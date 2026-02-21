"use client";

import { useState, useEffect, useSyncExternalStore } from 'react';
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

interface ProfileStats {
    totalWins: number;
    totalSpins: number;
    totalLosses: number;
    balance: number;
    tickets: number;
}

export default function ProfilPage() {
    const { user, walletAddress, setWalletAddress } = useAuth();
    const [stats, setStats] = useState<ProfileStats>({ totalWins: 0, totalSpins: 0, totalLosses: 0, balance: 0, tickets: 0 });
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [referralInput, setReferralInput] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);

    const isClient = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    // Fetch profile data from API
    useEffect(() => {
        async function fetchProfile() {
            if (!user?.fid) return;

            try {
                const res = await fetch(`/api/users/profile?fid=${user.fid}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                    setHistory(data.history || []);
                }
            } catch (e) {
                console.error('Failed to fetch profile:', e);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfile();
    }, [user?.fid]);

    if (!isClient) return null;

    const handleManualConnect = async () => {
        try {
            const { default: sdk } = await import('@farcaster/frame-sdk');
            const provider = await sdk.wallet.ethProvider;
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            if (accounts && (accounts as string[])[0]) {
                setWalletAddress((accounts as string[])[0]);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to connect wallet.");
        }
    };

    const handleShareReferral = () => {
        if (!user?.fid) return;
        const text = encodeURIComponent(`🎰 Come spin the Farcaster Roulette! Use my code to get a free spin! \n\nMy referral code (FID): ${user.fid}`);
        const embedUrl = encodeURIComponent('https://farcaster.xyz/miniapps/d4a1IMp6kHrn/arbitrum-roulette');
        const warpcastUrl = `https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}`;
        window.open(warpcastUrl, '_blank');
    };

    const handleClaimReferral = async () => {
        if (!user?.fid || !referralInput.trim()) return;
        setIsClaiming(true);
        try {
            const res = await fetch('/api/referral/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrerFid: referralInput.trim(),
                    referredFid: user.fid
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Successfully claimed referral!');
                setStats(prev => ({ ...prev, tickets: prev.tickets + 1 }));
                setReferralInput('');
            } else {
                alert(data.error || 'Failed to claim referral.');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred while claiming.');
        } finally {
            setIsClaiming(false);
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
        <main className={`${styles.container} page-transition`}>
            {/* Ambient Background */}
            <div className={styles.ambientGlow}></div>

            <header className={styles.header}>
                <div className={styles.avatarContainer}>
                    {user?.pfpUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
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
                {isLoading ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>Loading stats...</p>
                ) : (
                    <>
                        <StatBox label="Wins" value={stats.totalWins} highlight />
                        <StatBox label="Spins" value={stats.totalSpins} />
                        <StatBox label="Tickets" value={stats.tickets} />
                    </>
                )}
            </div>

            {/* Campaign Referral Section */}
            <div className={styles.section} style={{ marginBottom: '2.5rem' }}>
                <h2 className={styles.sectionTitle}>Campaign: Share & Earn</h2>
                <div className={`${styles.referralCard} glass-morphism`}>
                    <div className={styles.referralIconWrapper}>
                        <span className={`material-symbols-outlined ${styles.referralIcon} Glow`}>group_add</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5, fontSize: '0.9rem', textAlign: 'center' }}>
                        Invite friends to Farcaster Roulette! Share your link and get <b style={{ color: 'var(--primary)' }}>2 free spins</b>.
                        Your friends get <b style={{ color: 'var(--primary)' }}>1 free spin</b> too!
                    </p>
                    <div className={styles.referralActions}>
                        <button onClick={handleShareReferral} className={styles.shareButton}>
                            <span className="material-symbols-outlined">share</span>
                            Share Link to Warpcast
                        </button>
                    </div>

                    <hr className={styles.dividerLine} />

                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)', textAlign: 'center' }}>Got a referral code?</h3>
                    <div className={styles.referralInputWrapper}>
                        <input
                            type="text"
                            placeholder="Enter friend's FID"
                            value={referralInput}
                            onChange={(e) => setReferralInput(e.target.value)}
                            className={styles.referralInput}
                        />
                        <button
                            onClick={handleClaimReferral}
                            disabled={isClaiming || !referralInput.trim()}
                            className={styles.claimButton}
                        >
                            {isClaiming ? 'Claiming...' : 'Claim Spin'}
                        </button>
                    </div>
                </div>
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
