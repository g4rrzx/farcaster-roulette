"use client";

import { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './Spin.module.css';
import RouletteRing from '@/components/RouletteRing';
import WelcomeModal from '@/components/WelcomeModal';
import WinnerModal from '@/components/WinnerModal';
import { useAuth } from '@/components/AuthProvider';
import JackpotTicker from '@/components/JackpotTicker';
import sdk from '@farcaster/frame-sdk';
import { encodeFunctionData } from 'viem';

export default function SpinPage() {
    const { user, walletAddress, setWalletAddress, tickets, setTickets } = useAuth();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<null | 'win' | 'loss' | 'jackpot'>(null);
    const [isClaiming, setIsClaiming] = useState(false);
    const [streak, setStreak] = useState(0);

    // Winner modal state
    const [showWinner, setShowWinner] = useState(false);
    const [winData, setWinData] = useState({ amount: "0", txHash: "" });

    const handleClaimTicket = useCallback(async () => {
        if (isClaiming || !user) return;
        setIsClaiming(true);

        try {
            const res = await fetch('/api/users/claim-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.fid}` // Passing FID as simple auth for MVP
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setTickets(data.tickets);
                }
            } else {
                throw new Error("Failed to claim ticket from server");
            }
        } catch (error) {
            console.error(error);
            alert("Could not claim ticket. Backend might be unreachable.");
        } finally {
            setIsClaiming(false);
        }
    }, [isClaiming, user, setTickets]);

    const handleSpin = async () => {
        if (tickets <= 0 || isSpinning || !user) return;

        setIsSpinning(true);
        setResult(null);

        try {
            // 1. Get Wallet Address from Farcaster App context if not already set
            const provider = await sdk.wallet.ethProvider;
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            const userWallet = (accounts as string[])[0];

            if (!userWallet) throw new Error("Could not connect to Farcaster wallet");

            // 2. Fetch ECDSA signature and nonce from Backend
            const prepareRes = await fetch('/api/spin/prepare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.fid}`
                },
                body: JSON.stringify({ userWallet, nonce: tickets })
            });
            const prepareData = await prepareRes.json();

            if (!prepareRes.ok || !prepareData.success) {
                throw new Error(prepareData.error || 'Failed to prepare spin');
            }

            const { signature, nonce, contractAddress, spinFee } = prepareData;

            // 3. Initiate Farcaster Transaction
            const abi = [{
                inputs: [
                    { internalType: "uint256", name: "currentNonce", type: "uint256" },
                    { internalType: "bytes", name: "signature", type: "bytes" }
                ],
                name: "spin",
                outputs: [],
                stateMutability: "payable",
                type: "function"
            }];

            const callData = encodeFunctionData({
                abi,
                functionName: 'spin',
                args: [BigInt(nonce), signature]
            });

            // Farcaster Frame v2 native transaction bridging via EIP-1193 provider
            const txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [{
                    to: contractAddress,
                    data: callData,
                    value: `0x${BigInt(spinFee).toString(16)}`, // Hex format required
                    chainId: "0xa4b1" // 42161 in hex (Arbitrum One)
                }]
            }) as string;

            // 4. Temporarily show wheel spinning locally while we wait for verification 
            // (In a real app, you might wait for verification first before spinning, or spin optimistically then verify)

            const verifyRes = await fetch('/api/spin/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.fid}`
                },
                body: JSON.stringify({ txHash })
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Transaction verification failed');
            }

            // 6. Resolve UI State from backend deterministic result
            const outcome = verifyData.result as 'win' | 'loss' | 'jackpot';
            setResult(outcome);
            setTickets(verifyData.newTickets);

            if (outcome === 'win' || outcome === 'jackpot') {
                setStreak((prev) => prev + 1);
                setWinData({ amount: verifyData.payout.toString(), txHash: txHash });

                // Show modal after wheel stops spinning (~3.5s)
                setTimeout(() => {
                    setShowWinner(true);
                }, 3600);
            } else {
                setStreak(0);
            }

        } catch (error: unknown) {
            console.error("Spin error:", error);
            const msg = error instanceof Error ? error.message : "An error occurred while trying to spin";
            alert(msg);
            setResult('loss'); // Fallback
        } finally {
            setTimeout(() => {
                setIsSpinning(false);
            }, 3000); // Ensure the wheel animation completes at least roughly
        }
    };

    const handleManualConnect = async () => {
        try {
            import('@farcaster/frame-sdk').then(async ({ default: sdk }) => {
                const provider = await sdk.wallet.ethProvider;
                const accounts = await provider.request({ method: "eth_requestAccounts" });
                if (accounts && (accounts as string[])[0]) {
                    setWalletAddress((accounts as string[])[0]);
                }
            });
        } catch (e) {
            console.error(e);
            alert("Failed to connect wallet.");
        }
    };

    if (!user || !walletAddress) {
        return (
            <main className={styles.mainContainer} style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', zIndex: 10, padding: '2rem' }}>
                    <span className="material-symbols-outlined neon-text-glow" style={{ fontSize: 64, color: 'var(--text-primary)', marginBottom: '1rem' }}>account_balance_wallet</span>
                    <h1 style={{ marginBottom: '1rem' }}>Wallet & Farcaster Profile Needed</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please connect your unified Farcaster wallet to load the Roulette wheel.</p>
                    <button onClick={handleManualConnect} className="btn-primary" style={{ animation: 'none' }}>
                        Connect SDK
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.mainContainer}>
            <JackpotTicker />
            <WelcomeModal />

            <WinnerModal
                isVisible={showWinner}
                tokenAmount={winData.amount}
                txHash={winData.txHash}
                onDismiss={() => setShowWinner(false)}
            />

            {/* Header / Top Bar */}
            <header className={styles.header}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>
                        <span className="material-symbols-outlined text-primary">casino</span>
                    </div>
                    <div>
                        <h1 className={styles.title}>Farcaster <span className="text-primary">Roulette</span></h1>
                        <div className={styles.networkStatusRow}>
                            <span className={styles.networkDot}></span>
                            <span className={styles.networkStatus}>Network Live</span>
                        </div>
                    </div>
                </div>

                <div className={styles.balanceContainer}>
                    <div className={`${styles.ticketBox} glass-morphism ${tickets > 0 ? styles.ticketReady : ''}`}>
                        <span className={styles.ticketEmoji}>🎟️</span>
                        <div className={styles.ticketInfo}>
                            <span className={styles.ticketLabel}>Tickets</span>
                            <span className={styles.ticketValue}>{tickets}</span>
                        </div>
                    </div>
                    <div className={styles.avatar}>
                        {user?.pfpUrl ? (
                            <Image
                                src={user.pfpUrl}
                                alt={user.displayName || user.username || 'User'}
                                width={48}
                                height={48}
                            />
                        ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--text-secondary)' }}>person</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Streak badge */}
            {streak > 1 && (
                <div className={styles.streakBadge}>
                    <span>🔥</span>
                    <span>{streak} Win Streak!</span>
                </div>
            )}

            <div className={styles.gameArea}>
                <RouletteRing
                    isSpinning={isSpinning}
                    result={result}
                    onSpin={handleSpin}
                    disabled={tickets <= 0 || isSpinning}
                />

                <div className={styles.controlsArea}>
                    <div className={styles.statusMessage}>
                        {isSpinning ? (
                            <>
                                <p className={`${styles.statusText} neon-text-glow`}>Reading luck...</p>
                                <div className={styles.loaderBar}>
                                    <div className={styles.loaderProgress}></div>
                                </div>
                            </>
                        ) : (
                            <p className={styles.statusText}>
                                {result
                                    ? result === 'jackpot'
                                        ? '🏆 MEGA JACKPOT!'
                                        : result === 'win'
                                            ? '✨ ARB REWARD!'
                                            : 'ZONK! Try Again 💀'
                                    : tickets > 0
                                        ? 'Ready to Spin'
                                        : 'Claim a Ticket to Play'}
                            </p>
                        )}
                    </div>

                    {tickets <= 0 && (
                        <button
                            className={styles.claimButton}
                            onClick={handleClaimTicket}
                            disabled={isClaiming}
                        >
                            {isClaiming ? (
                                <span className={styles.claimSpinner}></span>
                            ) : (
                                <>
                                    <span>🎟️</span>
                                    <span>Claim Free Ticket</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
