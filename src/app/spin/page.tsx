"use client";

import { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './Spin.module.css';
import RouletteRing from '@/components/RouletteRing';
import WelcomeModal from '@/components/WelcomeModal';
import WinnerModal from '@/components/WinnerModal';
import { useAuth } from '@/components/AuthProvider';
import JackpotTicker from '@/components/JackpotTicker';
import { encodeFunctionData } from 'viem';

export default function SpinPage() {
    const { user, walletAddress, setWalletAddress, tickets, setTickets } = useAuth();
    const [isSpinning, setIsSpinning] = useState(false);
    const [isProcessingTx, setIsProcessingTx] = useState(false);
    const [result, setResult] = useState<null | 'win' | 'loss' | 'jackpot'>(null);
    const [streak, setStreak] = useState(0);

    // Winner modal state
    const [showWinner, setShowWinner] = useState(false);
    const [winData, setWinData] = useState({ amount: "0", txHash: "" });

    // Error toast state
    const [spinError, setSpinError] = useState<string | null>(null);

    const handleSpin = useCallback(async () => {
        if (tickets <= 0 || isSpinning || isProcessingTx || !user) return;

        setIsProcessingTx(true);
        setResult(null);

        try {
            // 1. Get wallet provider via dynamic import
            const { default: sdk } = await import('@farcaster/frame-sdk');
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

            // 3. Build transaction data
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

            // 4. Switch to Arbitrum One chain first
            try {
                await provider.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0xa4b1" }] // 42161 in hex
                });
            } catch {
                // Chain switch may fail if already on correct chain — that's OK
            }

            // 5. Send transaction via Farcaster wallet popup — wheel NOT spinning yet
            const txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [{
                    from: userWallet as `0x${string}`,
                    to: contractAddress as `0x${string}`,
                    data: callData,
                    value: `0x${BigInt(spinFee).toString(16)}`,
                }]
            }) as `0x${string}`;

            // 5. Verify on backend
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

            // 6. Transaction confirmed! Now set the result and START spinning
            const outcome = verifyData.result as 'win' | 'loss' | 'jackpot';
            setResult(outcome);
            setTickets(verifyData.newTickets);
            setIsProcessingTx(false);
            setIsSpinning(true);

            // 7. After wheel animation (~3.5s), show winner modal if won
            if (outcome === 'win' || outcome === 'jackpot') {
                setStreak((prev) => prev + 1);
                setWinData({ amount: verifyData.payout.toString(), txHash: txHash });

                setTimeout(() => {
                    setShowWinner(true);
                }, 3800);
            } else {
                setStreak(0);
            }

            // 8. Stop spinning after animation completes
            setTimeout(() => {
                setIsSpinning(false);
            }, 4000);

        } catch (error: unknown) {
            console.error("Spin error:", error);
            const raw = error instanceof Error ? error.message : "Something went wrong";
            // Map common errors to friendly messages
            let msg = raw;
            if (raw.toLowerCase().includes('rejected') || raw.toLowerCase().includes('denied')) {
                msg = 'Transaction cancelled';
            } else if (raw.includes('Insufficient')) {
                msg = 'Not enough tickets. Complete quests to earn more!';
            } else if (raw.includes('not found') || raw.includes('not confirmed')) {
                msg = 'Transaction not confirmed yet. Please wait a moment and try again.';
            }
            setSpinError(msg);
            setTimeout(() => setSpinError(null), 4000);
            setIsProcessingTx(false);
            setIsSpinning(false);
        }
    }, [tickets, isSpinning, isProcessingTx, user, setTickets]);

    const handleManualConnect = async () => {
        try {
            const { default: sdk } = await import('@farcaster/frame-sdk');
            const provider = await sdk.wallet.ethProvider;
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            if (accounts && (accounts as string[])[0]) {
                setWalletAddress((accounts as string[])[0]);
            }
        } catch (e) {
            console.error(e);
            setSpinError('Failed to connect wallet. Please try again.');
            setTimeout(() => setSpinError(null), 4000);
        }
    };

    if (!user || !walletAddress) {
        return (
            <main className={styles.mainContainer} style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', zIndex: 10, padding: '2rem' }}>
                    <span className="material-symbols-outlined neon-text-glow" style={{ fontSize: 64, color: 'var(--text-primary)', marginBottom: '1rem' }}>account_balance_wallet</span>
                    <h1 style={{ marginBottom: '1rem' }}>Wallet &amp; Farcaster Profile Needed</h1>
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

            {/* Error Toast */}
            {spinError && (
                <div className={styles.errorToast}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                    <span>{spinError}</span>
                    <button onClick={() => setSpinError(null)} className={styles.errorToastClose}>✕</button>
                </div>
            )}

            {/* Header / Top Bar */}
            <header className={styles.header}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>
                        <Image src="/icon.png" alt="Arbitrum Roulette" width={28} height={28} />
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
                    isProcessingTx={isProcessingTx}
                    result={result}
                    onSpin={handleSpin}
                    disabled={tickets <= 0 || isSpinning || isProcessingTx}
                />

                <div className={styles.controlsArea}>
                    <div className={styles.statusMessage}>
                        {isProcessingTx ? (
                            <>
                                <p className={`${styles.statusText} neon-text-glow`}>Confirming Transaction...</p>
                                <div className={styles.loaderBar}>
                                    <div className={styles.loaderProgress}></div>
                                </div>
                            </>
                        ) : isSpinning ? (
                            <p className={`${styles.statusText} neon-text-glow`}>Spinning...</p>
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
                                        : 'Earn Tickets from Quest Board'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
