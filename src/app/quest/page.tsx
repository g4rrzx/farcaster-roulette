"use client";

import { useState } from 'react';
import styles from './Quest.module.css';
import QuestCard from '@/components/QuestCard';

export default function QuestPage() {
    const [quests, setQuests] = useState({
        daily: { isClaimed: false, isLoading: false },
        follow: { isClaimed: false, isLoading: false },
        recast: { isClaimed: false, isLoading: false },
    });

    const handleVerifyFollow = async () => {
        setQuests(prev => ({ ...prev, follow: { ...prev.follow, isLoading: true } }));

        // Mock API Call to verify follow status via backend -> Neynar
        // e.g. await fetch('/api/quests/verify-follow?target=fcmini')
        await new Promise(r => setTimeout(r, 1500));

        // Assuming success
        setQuests(prev => ({ ...prev, follow: { isClaimed: true, isLoading: false } }));
        alert("Follow verified! +1 Ticket");
    };

    const handleVerifyRecast = async () => {
        setQuests(prev => ({ ...prev, recast: { ...prev.recast, isLoading: true } }));
        await new Promise(r => setTimeout(r, 1500));
        setQuests(prev => ({ ...prev, recast: { isClaimed: true, isLoading: false } }));
        alert("Recast verified! +1 Ticket");
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
                        isClaimed={quests.daily.isClaimed}
                        isLoading={quests.daily.isLoading}
                        onClaim={() => {
                            setQuests(prev => ({ ...prev, daily: { isClaimed: true, isLoading: false } }));
                            alert("Daily claimed!");
                        }}
                    />
                    <QuestCard
                        title="Like & Recast"
                        description="Engage with our latest announcement."
                        reward="+1 Ticket 🎟️"
                        actionLabel="Verify"
                        href="https://warpcast.com/fcmini" // Change this to specific cast URL later
                        isClaimed={quests.recast.isClaimed}
                        isLoading={quests.recast.isLoading}
                        onClaim={handleVerifyRecast}
                    />
                    <QuestCard
                        title="Follow @fcmini"
                        description="Follow our official account on Farcaster"
                        reward="+1 Ticket 🎟️"
                        actionLabel="Verify"
                        href="https://farcaster.xyz/fcmini"
                        isClaimed={quests.follow.isClaimed}
                        isLoading={quests.follow.isLoading}
                        onClaim={handleVerifyFollow}
                    />
                </div>
            </div>
        </main>
    );
}
