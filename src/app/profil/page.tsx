"use client";

import { useState, useEffect } from 'react';
import styles from './Profil.module.css';
import StatBox from '@/components/StatBox';
import { useAuth } from '@/components/AuthProvider';

interface HistoryItem {
    id: number;
    type: 'win' | 'loss';
    amount: string;
    time: string;
}

export default function ProfilPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ wins: 0, spins: 0, ticketsClaimed: 0 });
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        // TODO: Fetch from backend API
        setStats({ wins: 0, spins: 0, ticketsClaimed: 0 });
        setHistory([]);
    }, []);

    return (
        <main className={styles.container}>
            {/* Ambient Background Particles */}
            <div className={styles.ambientGlow}></div>
            <div className={styles.particlesContainer}>
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            <header className={styles.header}>
                <div className={styles.avatarContainer}>
                    {user?.pfpUrl ? (
                        <img src={user.pfpUrl} alt={user.displayName || user.username || 'User'} className={styles.avatarImg} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person</span>
                        </div>
                    )}
                </div>
                <h1 className={styles.username}>@{user?.username || 'unknown'}</h1>
                <div className={styles.metaInfo}>
                    <span className={styles.fid}>FID: {user?.fid || '—'}</span>
                    <span className={styles.divider}>•</span>
                    <span className={styles.wallet}>{user?.displayName || '—'}</span>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <StatBox label="Wins" value={stats.wins} highlight />
                <StatBox label="Spins" value={stats.spins} />
                <StatBox label="Tickets" value={stats.ticketsClaimed} />
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Recent History</h2>
                {history.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-secondary)', opacity: 0.5 }}>history</span>
                        <p className={styles.emptyText}>No spins yet. Go play!</p>
                    </div>
                ) : (
                    <div className={styles.historyList}>
                        {history.map((item, index) => (
                            <div
                                key={item.id}
                                className={`${styles.historyItem} glass-morphism`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles.historyIcon}>
                                    <span className={`material-symbols-outlined ${item.type === 'win' ? styles.iconWin : styles.iconLoss}`}>
                                        {item.type === 'win' ? 'trophy' : 'close'}
                                    </span>
                                </div>
                                <div className={styles.historyContent}>
                                    <span className={styles.historyType}>{item.type === 'win' ? 'Win' : 'Miss'}</span>
                                    <span className={styles.historyTime}>{item.time}</span>
                                </div>
                                <span className={`${styles.historyAmount} ${item.type === 'win' ? styles.amountWin : styles.amountLoss}`}>
                                    {item.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
