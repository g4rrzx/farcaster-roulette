"use client";

import { useState, useSyncExternalStore } from "react";
import styles from "./WelcomeModal.module.css";

export default function WelcomeModal() {
    const isClient = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    const [isVisible, setIsVisible] = useState(true);

    // Only render if we're on the client, user hasn't dismissed in session, and localStorage says they haven't been welcomed
    if (!isClient) return null;
    if (!isVisible) return null;

    // Check localStorage AFTER client check to avoid hydration mismatch
    if (localStorage.getItem("roulette_welcomed")) return null;

    const handleDismiss = () => {
        localStorage.setItem("roulette_welcomed", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} glass-morphism`}>
                <div className={styles.header}>
                    <div className={styles.iconRow}>
                        <span className={styles.stepIcon}>🎟️</span>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.stepIcon}>🎰</span>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.stepIcon}>🏆</span>
                    </div>
                    <h1 className={styles.title}>
                        Welcome to <span className={styles.highlight}>Roulette</span>
                    </h1>
                </div>

                <div className={styles.steps}>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Claim a Ticket</h3>
                            <p className={styles.stepDesc}>
                                Get your free ticket from the Quest board or daily claim
                            </p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Spin the Wheel</h3>
                            <p className={styles.stepDesc}>
                                Use your ticket to spin — each spin costs 1 ticket
                            </p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Win Tokens!</h3>
                            <p className={styles.stepDesc}>
                                If you win, tokens are sent directly to your wallet on-chain
                            </p>
                        </div>
                    </div>
                </div>

                <button className={styles.ctaButton} onClick={handleDismiss}>
                    Let&apos;s Go! 🚀
                </button>

                <p className={styles.note}>
                    Tickets are limited — complete quests to earn more!
                </p>
            </div>
        </div>
    );
}
