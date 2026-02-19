"use client";

import styles from './Quest.module.css';
import QuestCard from '@/components/QuestCard';

export default function QuestPage() {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Quest Board</h1>
                <p className={styles.subtitle}>Complete tasks to earn more spins</p>
            </header>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Daily Tasks</h2>
                <div className={styles.grid}>
                    <QuestCard
                        title="Daily Check-in"
                        description="Log in to claim your free daily reward."
                        reward="+1 Spin"
                        actionLabel="Claim"
                        onClaim={() => console.log('Claimed')}
                    />
                    <QuestCard
                        title="Like & Recast"
                        description="Engage with our latest announcement."
                        reward="+2 Spins"
                        actionLabel="Go"
                    />
                    <QuestCard
                        title="Follow @roulette"
                        description="Follow our official account"
                        reward="+50 WARPS"
                        isClaimed={true}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Weekly Challenges</h2>
                <div className={styles.grid}>
                    <QuestCard
                        title="Winning Streak"
                        description="Win 3 in a row."
                        reward="+5 Spins"
                        actionLabel="View"
                    />
                </div>
            </div>
        </main>
    );
}
