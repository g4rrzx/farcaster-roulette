"use client";

import { useState } from 'react';
import styles from './Quest.module.css';
import QuestCard from '@/components/QuestCard';
import { useAuth } from '@/components/AuthProvider';

type QuestStatus = 'idle' | 'action_taken' | 'verifying' | 'claimed';

export default function QuestPage() {
    // Consume global tickets state
    const { setTickets } = useAuth();

    const [quests, setQuests] = useState<{
        daily: QuestStatus;
        follow: QuestStatus;
        recast: QuestStatus;
    }>({
        daily: 'idle',
        follow: 'idle',
        recast: 'idle',
    });

    const updateQuest = (key: keyof typeof quests, status: QuestStatus) => {
        setQuests(prev => ({ ...prev, [key]: status }));
    };

    const awardTicket = () => {
        // Increase global ticket balance
        setTickets(prev => prev + 1);
    };

    // --- DAILY CHECK-IN ---
    // Daily doesn't have an external link, so it just goes straight to verifying -> claimed
    const handleDailyClaim = async () => {
        updateQuest('daily', 'verifying');
        // Simulated API delay
        await new Promise(r => setTimeout(r, 1000));
        updateQuest('daily', 'claimed');
        awardTicket();
    };

    // --- FOLLOW (External Link) ---
    // Step 1: User clicks link
    const handleFollowAction = () => {
        updateQuest('follow', 'action_taken');
    };
    // Step 2: User clicks Verify
    const handleVerifyFollow = async () => {
        updateQuest('follow', 'verifying');
        // Mock backend verify via Neynar
        await new Promise(r => setTimeout(r, 1500));
        updateQuest('follow', 'claimed');
        awardTicket();
    };

    // --- RECAST (External Link) ---
    const handleRecastAction = () => {
        updateQuest('recast', 'action_taken');
    };
    const handleVerifyRecast = async () => {
        updateQuest('recast', 'verifying');
        await new Promise(r => setTimeout(r, 1500));
        updateQuest('recast', 'claimed');
        awardTicket();
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Quest Board</h1>
                <p className={styles.subtitle}>Complete tasks to earn tickets</p>
            </header>

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
                    // onVerify not needed since it's a 1-step claim process
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
