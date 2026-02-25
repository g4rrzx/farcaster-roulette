import { db } from '../db/index.js';
import { users, spins } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export async function getUserProfile(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) throw new Error('User not found');

    const winRate =
        user.totalSpins > 0
            ? Math.round((user.totalWins / user.totalSpins) * 100)
            : 0;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        fid: user.fid,
        walletAddress: user.walletAddress,
        balance: Number(user.balance),
        level: user.level,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        totalSpins: user.totalSpins,
        freeSpins: user.freeSpins,
        winRate,
        createdAt: user.createdAt,
    };
}

export async function getUserHistory(
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
        type: spin.result as 'win' | 'loss',
        amount:
            spin.result === 'win'
                ? `+${spin.payout} WARPS`
                : `-${spin.betAmount} WARPS`,
        payout: spin.payout,
        betAmount: spin.betAmount,
        createdAt: spin.createdAt,
    }));
}
