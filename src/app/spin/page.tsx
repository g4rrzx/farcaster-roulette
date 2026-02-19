"use client";

import { useState, useCallback } from 'react';
import styles from './Spin.module.css';
import RouletteRing from '@/components/RouletteRing';
import SpinButton from '@/components/SpinButton';
import WelcomeModal from '@/components/WelcomeModal';
import WinnerModal from '@/components/WinnerModal';
import { useAuth } from '@/components/AuthProvider';

export default function SpinPage() {
    const { user } = useAuth();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<null | 'win' | 'loss'>(null);
    const [tickets, setTickets] = useState(0);
    const [isClaiming, setIsClaiming] = useState(false);
    const [streak, setStreak] = useState(0);

    // Winner modal state
    const [showWinner, setShowWinner] = useState(false);
    const [winData, setWinData] = useState({ amount: "0", txHash: "" });

    const handleClaimTicket = useCallback(async () => {
        if (isClaiming) return;
        setIsClaiming(true);

        // TODO: Call backend API to claim ticket (anti-spam)
        // Simulating API delay
        await new Promise((r) => setTimeout(r, 1200));
        setTickets((prev) => prev + 1);
        setIsClaiming(false);
    }, [isClaiming]);

    const handleSpin = async () => {
        if (tickets <= 0 || isSpinning) return;

        setIsSpinning(true);
        setResult(null);
        setTickets((prev) => prev - 1);

        // Simulate backend spin call
        setTimeout(() => {
            setIsSpinning(false);
            const won = Math.random() > 0.5;

            if (won) {
                setResult('win');
                setStreak((prev) => prev + 1);
                const amount = (Math.floor(Math.random() * 50) + 10).toString();
                // Simulated tx hash — will come from contract later
                const fakeTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
                setWinData({ amount, txHash: fakeTx });
                setShowWinner(true);
            } else {
                setResult('loss');
                setStreak(0);
            }
        }, 3000);
    };

    return (
        <main className={styles.mainContainer}>
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
                            <img src={user.pfpUrl} alt={user.displayName || user.username || 'User'} />
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
                <RouletteRing isSpinning={isSpinning} result={result} />

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
                                    ? result === 'win'
                                        ? '🏆 YOU WON!'
                                        : 'Try Again'
                                    : tickets > 0
                                        ? 'Ready to Spin'
                                        : 'Claim a Ticket to Play'}
                            </p>
                        )}
                    </div>

                    {tickets > 0 ? (
                        <SpinButton onClick={handleSpin} disabled={isSpinning} />
                    ) : (
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
