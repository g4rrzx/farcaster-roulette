"use client";

import styles from "./WinnerModal.module.css";

interface WinnerModalProps {
    isVisible: boolean;
    tokenAmount: string;
    txHash: string;
    onDismiss: () => void;
}

export default function WinnerModal({
    isVisible,
    tokenAmount,
    txHash,
    onDismiss,
}: WinnerModalProps) {
    if (!isVisible) return null;

    const shortHash = txHash
        ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
        : "Pending...";

    const explorerUrl = txHash
        ? `https://arbiscan.io/tx/${txHash}`
        : "#";

    return (
        <div className={styles.overlay}>
            {/* Confetti particles */}
            <div className={styles.confettiContainer}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className={styles.confetti}
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            backgroundColor: ['#00f2ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'][
                                Math.floor(Math.random() * 6)
                            ],
                        }}
                    />
                ))}
            </div>

            <div className={`${styles.modal} glass-morphism`}>
                <div className={styles.trophy}>🏆</div>

                <h1 className={styles.title}>YOU WON!</h1>

                <div className={styles.rewardBox}>
                    <span className={styles.rewardLabel}>Reward</span>
                    <span className={styles.rewardAmount}>{tokenAmount}</span>
                    <span className={styles.rewardToken}>Tokens</span>
                </div>

                <div className={styles.txSection}>
                    <span className={styles.txLabel}>Transaction</span>
                    <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txHash}
                    >
                        {shortHash}
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            open_in_new
                        </span>
                    </a>
                </div>

                <button className={styles.ctaButton} onClick={onDismiss}>
                    Awesome! 🎉
                </button>
            </div>
        </div>
    );
}
