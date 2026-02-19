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
    const [stats, setStats] = useState({ wins: 0, losses: 0, winRate: 0 });
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        // TODO: Fetch from backend API when connected
        // For now, start with empty stats — will be populated from real spins
        setStats({ wins: 0, losses: 0, winRate: 0 });
        setHistory([]);
    }, []);

    const truncateAddress = (address?: string) => {
        if (!address) return '—';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.avatarContainer}>
                    {user?.pfpUrl ? (
                        <img src={user.pfpUrl} alt={user.displayName || user.username || 'User'} className={styles.avatarImg} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person</span>
                        </div>
                    )}
                    <div className={styles.levelBadge}>Lvl 1</div>
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
                <StatBox label="Losses" value={stats.losses} />
                <StatBox label="Win Rate" value={`${stats.winRate}%`} />
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
                        {history.map((item) => (
                            <div key={item.id} className={`${styles.historyItem} glass-morphism`}>
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
