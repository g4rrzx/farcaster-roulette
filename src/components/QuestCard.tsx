"use client";

import styles from './QuestCard.module.css';

interface QuestCardProps {
    title: string;
    description: string;
    reward: string;
    isClaimed?: boolean;
    isLoading?: boolean;
    onClaim?: () => void;
    actionLabel?: string;
    href?: string;
}

export default function QuestCard({
    title,
    description,
    reward,
    isClaimed = false,
    isLoading = false,
    onClaim,
    actionLabel = "Start",
    href
}: QuestCardProps) {

    const ButtonElement = ({ children }: { children: React.ReactNode }) => {
        const className = `${styles.actionButton} ${isClaimed ? styles.claimed : ''} ${isLoading ? styles.loading : ''}`;

        if (href && !isClaimed) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                    {children}
                </a>
            );
        }

        return (
            <button
                className={className}
                onClick={onClaim}
                disabled={isClaimed || isLoading}
            >
                {children}
            </button>
        );
    };

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
            <ButtonElement>
                {isLoading ? 'Verifying...' : isClaimed ? 'Done' : actionLabel}
            </ButtonElement>
        </div>
    );
}
