"use client";

import { useState, useEffect } from 'react';
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
    nextClaimDate?: string | null;
    isPageLoading?: boolean;
}

export default function QuestCard({
    title,
    description,
    reward,
    status = 'idle',
    onActionTaken,
    onVerify,
    actionLabel = "Start",
    href,
    nextClaimDate,
    isPageLoading = false
}: QuestCardProps) {

    const [timeLeft, setTimeLeft] = useState<string>('');

    // Derived flags
    const isClaimed = status === 'claimed';
    const isLoading = status === 'verifying' || isPageLoading;
    const needsVerification = status === 'action_taken';

    useEffect(() => {
        if (!isClaimed || !nextClaimDate) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const resetTime = new Date(nextClaimDate).getTime();
            const difference = resetTime - now;

            if (difference <= 0) {
                clearInterval(interval);
                setTimeLeft('Available now (Refresh)');
            } else {
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isClaimed, nextClaimDate]);

    const getButtonContent = () => {
        if (isPageLoading) return 'Loading...';
        if (isLoading) return 'Verifying...';
        if (isClaimed) return timeLeft ? `Wait ${timeLeft}` : 'Done';
        if (needsVerification) return 'Verify';
        return actionLabel;
    };

    const renderButton = (content: React.ReactNode) => {
        let className = `${styles.actionButton} `;
        if (isClaimed) className += styles.claimed;
        if (isLoading) className += styles.loading;
        if (needsVerification) className += ` ${styles.readyToVerify}`;

        // Initial state with an external link
        if (href && status === 'idle' && !isPageLoading) {
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
