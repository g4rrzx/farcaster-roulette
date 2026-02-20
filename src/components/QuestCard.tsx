"use client";

import styles from './QuestCard.module.css';

interface QuestCardProps {
    title: string;
    description: string;
    reward: string;
    status?: 'idle' | 'action_taken' | 'verifying' | 'claimed';
    onActionTaken?: () => void;
    onVerify?: () => void;
    actionLabel?: string;
    href?: string;
}

export default function QuestCard({
    title,
    description,
    reward,
    status = 'idle',
    onActionTaken,
    onVerify,
    actionLabel = "Start",
    href
}: QuestCardProps) {

    // Derived flags
    const isClaimed = status === 'claimed';
    const isLoading = status === 'verifying';
    const needsVerification = status === 'action_taken';

    const getButtonContent = () => {
        if (isLoading) return 'Verifying...';
        if (isClaimed) return 'Done';
        if (needsVerification) return 'Verify';
        return actionLabel;
    };

    const renderButton = (content: React.ReactNode) => {
        let className = `${styles.actionButton} `;
        if (isClaimed) className += styles.claimed;
        if (isLoading) className += styles.loading;
        if (needsVerification) className += ` ${styles.readyToVerify}`;

        // Initial state with an external link
        if (href && status === 'idle') {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className.trim()}
                    onClick={onActionTaken}
                >
                    {content}
                </a>
            );
        }

        // Verification state or daily claim without link
        return (
            <button
                className={className.trim()}
                onClick={needsVerification ? onVerify : onActionTaken}
                disabled={isClaimed || isLoading}
            >
                {content}
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
            {renderButton(getButtonContent())}
        </div>
    );
}
