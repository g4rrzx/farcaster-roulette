"use client";

import { useState } from 'react';
import styles from './Spin.module.css';
import RouletteRing from '@/components/RouletteRing';
import SpinButton from '@/components/SpinButton';
import { useAuth } from '@/components/AuthProvider';

export default function SpinPage() {
    const { user } = useAuth();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<null | 'win' | 'loss'>(null);
    const [balance, setBalance] = useState(1000);

    const handleSpin = async () => {
        setIsSpinning(true);
        setResult(null);

        // Simulate backend call and delay
        setTimeout(() => {
            setIsSpinning(false);
            const won = Math.random() > 0.5;
            setResult(won ? 'win' : 'loss');
            setBalance((prev) => won ? prev + 150 : prev - 100);
        }, 3000);
    };

    return (
        <main className={styles.mainContainer}>
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
                    <div className={`${styles.balanceBox} glass-morphism`}>
                        <div className={styles.balanceInfo}>
                            <span className={styles.balanceLabel}>Balance</span>
                            <span className={styles.balanceValue}>{balance.toLocaleString()} WARPS</span>
                        </div>
                        <div className={styles.balanceIcon}>
                            <span className="material-symbols-outlined">bolt</span>
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
                            <p className={styles.statusText}>{result ? (result === 'win' ? 'YOU WON!' : 'Try Again') : 'Ready to Spin'}</p>
                        )}
                    </div>

                    <SpinButton onClick={handleSpin} disabled={isSpinning} />

                    {/* Stats / Bet info */}
                    <div className={styles.statRow}>
                        <div className={`${styles.statBox} glass-morphism`}>
                            <span className={styles.statLabel}>Multiplier</span>
                            <span className={styles.statValue}>2.5x</span>
                        </div>
                        <div className={`${styles.statBox} glass-morphism`}>
                            <span className={styles.statLabel}>Bet</span>
                            <span className={`${styles.statValue}`} style={{ color: 'var(--primary)' }}>100</span>
                        </div>
                        <div className={`${styles.statBox} glass-morphism`}>
                            <span className={styles.statLabel}>Chance</span>
                            <span className={styles.statValue}>45%</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
