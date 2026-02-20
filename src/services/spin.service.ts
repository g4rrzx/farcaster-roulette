import { db } from '../db/index';
import { users, spins } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { ethers } from 'ethers';

// Game configuration
const GAME_CONFIG = {
    multiplier: 2.5,
    winChance: 0.45, // 45%
    minBet: 10,
    maxBet: 1000,
};

export function getSpinConfig() {
    return {
        multiplier: GAME_CONFIG.multiplier,
        winChance: GAME_CONFIG.winChance * 100, // Return as percentage
        minBet: GAME_CONFIG.minBet,
        maxBet: GAME_CONFIG.maxBet,
    };
}

/**
 * Prepares an on-chain spin by verifying tickets and issuing an ECDSA signature
 * so the user can call ArbitrumRoulette.spin(currentNonce, signature)
 */
export async function prepareSpin(userId: string, userWallet: string, nonce: number) {
    if (!process.env.PRIVATE_KEY) throw new Error("Backend misconfigured: Missing PRIVATE_KEY");
    if (!process.env.ROULETTE_CONTRACT_ADDRESS) throw new Error("Backend misconfigured: Missing CONTRACT_ADDRESS");

    // 1. Verify user exists and has tickets (freeSpins)
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('User not found');

    // Using freeSpins as our "Tickets" balance limit mechanism
    if (user.freeSpins <= 0) throw new Error('Insufficient tickets. Complete quests to earn more!');

    // 2. Validate userWallet exists (should be passed from frontend Farcaster context)
    if (!userWallet || !ethers.isAddress(userWallet)) {
        throw new Error('Valid wallet address is required to sign the transaction');
    }

    // 3. Generate ECDSA Signature matching ArbitrumRoulette V2
    // bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, currentNonce, spinFee, block.chainid, address(this)));

    const spinFee = ethers.parseUnits("1000", "gwei"); // 0.000001 ETH
    const chainId = 42161; // Arbitrum One
    const contractAddress = process.env.ROULETTE_CONTRACT_ADDRESS;

    // Pack the data exactly as Solidity abi.encodePacked does
    const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'uint256', 'uint256', 'address'],
        [userWallet, nonce, spinFee, chainId, contractAddress]
    );

    // Sign the message hash
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return {
        signature,
        nonce,
        spinFee: spinFee.toString(),
        contractAddress
    };
}

/**
 * Verifies an on-chain spin transaction and updates the database.
 * Decreases available tickets (freeSpins) and credits rewards if they won.
 */
export async function verifySpinTransaction(userId: string, txHash: string) {
    if (!process.env.ROULETTE_CONTRACT_ADDRESS) throw new Error("Backend misconfigured: Missing CONTRACT_ADDRESS");

    // Connect to Arbitrum to verify transaction
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
        throw new Error('Transaction not found or not confirmed yet. Please wait.');
    }

    if (receipt.status !== 1) {
        throw new Error('Transaction reverted on-chain.');
    }

    // Verify the transaction was sent to our actual contract
    if (receipt.to?.toLowerCase() !== process.env.ROULETTE_CONTRACT_ADDRESS.toLowerCase()) {
        throw new Error('Transaction was not sent to the Roulette contract.');
    }

    // Check if we already processed this txHash to prevent double counting
    const [existing] = await db.select().from(spins).where(eq(spins.txHash, txHash));
    if (existing) {
        return { message: 'Transaction already verified', spin: existing };
    }

    // Parse the Spin event logs
    // event Spin(address indexed user, uint256 feePaid, uint256 rewardAmount, ResultType result);
    // ResultType: 0=LOSE, 1=NORMAL_WIN, 2=JACKPOT
    const spinEventSignature = ethers.id("Spin(address,uint256,uint256,uint8)");

    let rewardAmount = BigInt(0);
    let resultType = 0; // LOSE

    for (const log of receipt.logs) {
        if (log.topics[0] === spinEventSignature) {
            // Found the Spin event!

            // Un-indexed params are in the data field: feePaid, rewardAmount, resultType
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256", "uint256", "uint8"],
                log.data
            );

            rewardAmount = decoded[1];
            resultType = decoded[2];
            break;
        }
    }

    const isWin = resultType > 0;
    const payoutStr = ethers.formatUnits(rewardAmount, 18);
    const payoutNumeric = parseFloat(payoutStr);
    const resultStr = resultType === 2 ? 'jackpot' : (isWin ? 'win' : 'loss');

    // 1. Decrement user's ticket (freeSpins)
    // 2. Add rewards (if won)
    await db
        .update(users)
        .set({
            freeSpins: sql`${users.freeSpins} - 1`,
            balance: sql`${users.balance} + ${payoutNumeric}`, // App balance is denominated conceptually in tokens
            totalSpins: sql`${users.totalSpins} + 1`,
            ...(isWin
                ? { totalWins: sql`${users.totalWins} + 1` }
                : { totalLosses: sql`${users.totalLosses} + 1` }),
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    // Record the verified spin in DB
    const [spin] = await db
        .insert(spins)
        .values({
            userId,
            betAmount: 1, // On-chain bet is always 1 ticket/spin fee
            multiplier: resultType === 2 ? "50.0" : (isWin ? "10.0" : "0.0"),
            result: resultStr,
            payout: payoutNumeric.toFixed(2),
            txHash,
        })
        .returning();

    // Get updated balance/tickets for frontend sync
    const [updatedUser] = await db
        .select({ balance: users.balance, tickets: users.freeSpins })
        .from(users)
        .where(eq(users.id, userId));

    return {
        success: true,
        result: resultStr,
        payout: payoutNumeric,
        newBalance: updatedUser.balance,
        newTickets: updatedUser.tickets,
        spinId: spin.id,
    };
}

export async function executeSpin(userId: string, betAmount: number) {
    // Validate bet amount
    if (betAmount < GAME_CONFIG.minBet || betAmount > GAME_CONFIG.maxBet) {
        throw new Error(
            `Bet must be between ${GAME_CONFIG.minBet} and ${GAME_CONFIG.maxBet}`
        );
    }

    // Get user and check balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('User not found');
    if (user.balance < betAmount) throw new Error('Insufficient balance');

    // Determine result
    const isWin = Math.random() < GAME_CONFIG.winChance;
    const result = isWin ? 'win' : 'loss';
    const payout = isWin ? Math.floor(betAmount * GAME_CONFIG.multiplier) : 0;
    const balanceChange = isWin ? payout - betAmount : -betAmount;

    // Update user balance + stats
    await db
        .update(users)
        .set({
            balance: sql`${users.balance} + ${balanceChange}`,
            totalSpins: sql`${users.totalSpins} + 1`,
            ...(isWin
                ? { totalWins: sql`${users.totalWins} + 1` }
                : { totalLosses: sql`${users.totalLosses} + 1` }),
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    // Record the spin
    const [spin] = await db
        .insert(spins)
        .values({
            userId,
            betAmount,
            multiplier: GAME_CONFIG.multiplier.toString(),
            result,
            payout: payout.toFixed(2),
        })
        .returning();

    // Get updated balance
    const [updatedUser] = await db
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId));

    return {
        result,
        payout,
        multiplier: GAME_CONFIG.multiplier,
        newBalance: updatedUser.balance,
        spinId: spin.id,
    };
}

export async function getSpinHistory(
    userId: string,
    limit = 20,
    offset = 0
) {
    const results = await db
        .select()
        .from(spins)
        .where(eq(spins.userId, userId))
        .orderBy(sql`${spins.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

    return results.map((spin) => ({
        id: spin.id,
        betAmount: spin.betAmount,
        multiplier: parseFloat(spin.multiplier),
        result: spin.result,
        payout: spin.payout,
        createdAt: spin.createdAt,
    }));
}

export async function getRecentWins(limit = 10) {
    const results = await db
        .select({
            id: spins.id,
            payout: spins.payout,
            userId: spins.userId,
            userName: users.name,
            createdAt: spins.createdAt,
        })
        .from(spins)
        .innerJoin(users, eq(spins.userId, users.id))
        .where(eq(spins.result, 'win'))
        .orderBy(sql`${spins.createdAt} DESC`)
        .limit(limit);

    return results.map((win) => ({
        id: win.id,
        user: win.userName || `@user_${win.userId.substring(0, 4)}`,
        amount: win.payout,
        token: 'DEGEN', // Default for now
        createdAt: win.createdAt,
    }));
}
