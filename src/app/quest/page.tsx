"use client";

import { useState, useEffect } from 'react';
import styles from './Quest.module.css';
import QuestCard from '@/components/QuestCard';
import { useAuth } from '@/components/AuthProvider';

type QuestStatus = 'idle' | 'action_taken' | 'verifying' | 'claimed';

export default function QuestPage() {
    const { user, setTickets } = useAuth();

    const [quests, setQuests] = useState<{
        daily: QuestStatus;
        follow: QuestStatus;
        recast: QuestStatus;
    }>({
        daily: 'idle',
        follow: 'idle',
        recast: 'idle',
    });

    const [nextClaimDate, setNextClaimDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch quest status from database
    useEffect(() => {
        const currentFid = user?.fid;
        if (!currentFid) return;

        async function fetchQuestStatus() {
            try {
                const res = await fetch(`/api/quests/status?fid=${currentFid}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setQuests(data.quests);
                        setNextClaimDate(data.nextClaimDate);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch quest status:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchQuestStatus();
    }, [user?.fid]);

    const updateQuest = (key: keyof typeof quests, status: QuestStatus) => {
        setQuests(prev => ({ ...prev, [key]: status }));
    };

    const verifyQuest = async (questType: 'daily' | 'follow' | 'recast', questKey: keyof typeof quests) => {
        if (!user || isLoading) return;

        updateQuest(questKey, 'verifying');
        setError(null);

        try {
            const res = await fetch('/api/quests/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fid: user.fid, questType }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                updateQuest(questKey, 'claimed');
                setTickets(data.tickets);
                // Also update next claim date if this was the daily quest
                if (data.nextClaimDate) setNextClaimDate(data.nextClaimDate);
            } else {
                // Verification failed — show error and reset
                setError(data.error || 'Verification failed');
                updateQuest(questKey, questType === 'daily' ? 'idle' : 'action_taken');
            }
        } catch (e) {
            console.error('Quest verify error:', e);
            setError('Network error. Please try again.');
            updateQuest(questKey, questType === 'daily' ? 'idle' : 'action_taken');
        }
    };

    // --- DAILY CHECK-IN ---
    const handleDailyClaim = () => verifyQuest('daily', 'daily');

    // --- FOLLOW ---
    const handleFollowAction = () => updateQuest('follow', 'action_taken');
    const handleVerifyFollow = () => verifyQuest('follow', 'follow');

    // --- RECAST ---
    const handleRecastAction = () => updateQuest('recast', 'action_taken');
    const handleVerifyRecast = () => verifyQuest('recast', 'recast');

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Quest Board</h1>
                <p className={styles.subtitle}>Complete tasks to earn free tickets</p>
            </header>

            {error && (
                <div className={styles.errorBanner}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
                </div>
            )}

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Daily Tasks</h2>
                <div className={styles.grid}>
                    <QuestCard
                        title="Daily Check-in"
                        description="Log in to claim your free daily ticket."
                        reward="+1 Ticket 🎟️"
                        actionLabel="Claim"
                        status={quests.daily}
                        onActionTaken={handleDailyClaim}
                        nextClaimDate={nextClaimDate}
                        isPageLoading={isLoading}
                    />
                    <QuestCard
                        title="Like & Recast"
                        description="Engage with our latest announcement."
                        reward="+1 Ticket 🎟️"
                        actionLabel="Go to Cast"
                        href="https://farcaster.xyz/fcmini/0xd77c1cf1"
                        status={quests.recast}
                        onActionTaken={handleRecastAction}
                        onVerify={handleVerifyRecast}
                        nextClaimDate={nextClaimDate}
                        isPageLoading={isLoading}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>One-time Quests</h2>
                <div className={styles.grid}>
                    <QuestCard
                        title="Follow @fcmini"
                        description="Follow our official account for updates."
                        reward="+1 Ticket 🎟️"
                        actionLabel="Follow"
                        href="https://warpcast.com/fcmini"
                        status={quests.follow}
                        onActionTaken={handleFollowAction}
                        onVerify={handleVerifyFollow}
                        isPageLoading={isLoading}
                    />
                </div>
            </div>
        </main>
    );
}
