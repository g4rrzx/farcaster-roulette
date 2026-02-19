"use client";

import styles from './QuestCard.module.css';

interface QuestCardProps {
    title: string;
    description: string;
    reward: string;
    isClaimed?: boolean;
    onClaim?: () => void;
    actionLabel?: string;
}

export default function QuestCard({
    title,
    description,
    reward,
    isClaimed = false,
    onClaim,
    actionLabel = "Start"
}: QuestCardProps) {
    return (
        <div className={`${styles.card} glass-morphism`}>
            <div className={styles.iconContainer}>
                <span className="material-symbols-outlined text-primary">star</span>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
                <div className={styles.rewardTag}>
                    <span className="material-symbols-outlined text-[10px]">bolt</span>
                    {reward}
                </div>
            </div>
            <button
                className={`${styles.actionButton} ${isClaimed ? styles.claimed : ''}`}
                onClick={onClaim}
                disabled={isClaimed}
            >
                {isClaimed ? 'Done' : actionLabel}
            </button>
        </div>
    );
}
