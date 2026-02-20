"use client";

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
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
    const { user, walletAddress, setWalletAddress } = useAuth();
    const [stats] = useState({ wins: 0, spins: 0, ticketsClaimed: 0 });
    const [history] = useState<HistoryItem[]>([]);

    const [particleStyles] = useState<{ left: string, delay: string, duration: string }[]>(() => {
        if (typeof window === 'undefined') return [];
        return Array.from({ length: 15 }).map(() => ({
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${5 + Math.random() * 5}s`,
        }));
    });
    const [isMounted, setIsMounted] = useState(false);


    const isClient = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    if (!isClient) return null;

    const handleManualConnect = async () => {
        try {
            import('@farcaster/frame-sdk').then(async ({ default: sdk }) => {
                const provider = await sdk.wallet.ethProvider;
                const accounts = await provider.request({ method: "eth_requestAccounts" });
                if (accounts && (accounts as string[])[0]) {
                    setWalletAddress((accounts as string[])[0]);
                }
            });
        } catch (e) {
            console.error(e);
            alert("Failed to connect wallet.");
        }
    };

    if (!user || !walletAddress) {
        return (
            <main className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className={styles.ambientGlow}></div>
                <div style={{ textAlign: 'center', zIndex: 10, padding: '2rem' }}>
                    <span className="material-symbols-outlined neon-text-glow" style={{ fontSize: 64, color: 'var(--text-primary)', marginBottom: '1rem' }}>account_balance_wallet</span>
                    <h1 style={{ marginBottom: '1rem' }}>Wallet Not Connected</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please connect your unified Farcaster wallet to view your profile and start spinning.</p>
                    <button onClick={handleManualConnect} className="btn-primary" style={{ animation: 'none' }}>
                        Connect Farcaster Wallet
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            {/* Ambient Background Particles */}
            <div className={styles.ambientGlow}></div>
            <div className={styles.particlesContainer}>
                {particleStyles.map((style, i) => (
                    <div
                        key={i}
                        className={styles.particle}
                        style={{
                            left: style.left,
                            animationDelay: style.delay,
                            animationDuration: style.duration,
                        }}
                    />
                ))}
            </div>

            <header className={styles.header}>
                <div className={styles.avatarContainer}>
                    {user?.pfpUrl ? (
                        <Image
                            src={user.pfpUrl}
                            alt={user.displayName || user.username || 'User'}
                            width={96}
                            height={96}
                            className={styles.avatarImg}
                        />
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
