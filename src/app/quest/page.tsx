"use client";

import { useState } from 'react';
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

    const [error, setError] = useState<string | null>(null);

    const updateQuest = (key: keyof typeof quests, status: QuestStatus) => {
        setQuests(prev => ({ ...prev, [key]: status }));
    };

    const verifyQuest = async (questType: 'daily' | 'follow' | 'recast', questKey: keyof typeof quests) => {
        if (!user) return;

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
                    />
                    <QuestCard
                        title="Like & Recast"
                        description="Engage with our latest announcement."
                        reward="+1 Ticket 🎟️"
                        actionLabel="Go to Cast"
                        href="https://warpcast.com/fcmini"
                        status={quests.recast}
                        onActionTaken={handleRecastAction}
                        onVerify={handleVerifyRecast}
                    />
                    <QuestCard
                        title="Follow @fcmini"
                        description="Follow our official account on Farcaster"
                        reward="+1 Ticket 🎟️"
                        actionLabel="Follow"
                        href="https://farcaster.xyz/fcmini"
                        status={quests.follow}
                        onActionTaken={handleFollowAction}
                        onVerify={handleVerifyFollow}
                    />
                </div>
            </div>
        </main>
    );
}
