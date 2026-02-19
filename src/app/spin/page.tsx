"use client";

import { useState } from 'react';
import styles from './Spin.module.css';
import RouletteRing from '@/components/RouletteRing';
import SpinButton from '@/components/SpinButton';

export default function SpinPage() {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<null | 'win' | 'loss'>(null);

    const handleSpin = async () => {
        setIsSpinning(true);
        setResult(null);

        // Simulate backend call and delay
        setTimeout(() => {
            setIsSpinning(false);
            // Random result for now
            setResult(Math.random() > 0.5 ? 'win' : 'loss');
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
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                            <span className={styles.networkStatus}>Network Live</span>
                        </div>
                    </div>
                </div>

                <div className={styles.balanceContainer}>
                    <div className={`${styles.balanceBox} glass-morphism`}>
                        <div className="flex flex-col items-end">
                            <span className={styles.balanceLabel}>Balance</span>
                            <span className={styles.balanceValue}>5,420 WARPS</span>
                        </div>
                        <div className={styles.balanceIcon}>
                            <span className="material-symbols-outlined">bolt</span>
                        </div>
                    </div>
                    {/* Avatar placeholder */}
                    <div className={styles.avatar}>
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBX0U2dhk6dVb1vs7oMtloybq7L9-KBKsfY3yzR25eiZf6VbaBugDaZ8i3uK8no3Y4qWxlCK1VQC7v5WTKP8-fXG-61Iy-99Y3-LFZlkXiX-qMx7sHm5Fr_mUN2nJlx8-p_VYm-r6hvHAOVN_-ovovIrIBDXdzIMPLuiSn0E_psL-vuqUfCxyr2J3yJQ_rC45vHaESqdJGA9fL-eq0s6SNoErfbbXgErsK1d7X7lPBghUygQmOnonPjzP49eree_AP96ANo97tr3yow" alt="User" />
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
                            <span className={`${styles.statValue} text-primary`}>100</span>
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
