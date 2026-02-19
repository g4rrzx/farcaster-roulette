"use client";

import styles from './Profil.module.css';
import StatBox from '@/components/StatBox';

export default function ProfilPage() {
    const history = [
        { id: 1, type: 'win', amount: '+50 WARPS', time: '2m ago' },
        { id: 2, type: 'loss', amount: '-10 WARPS', time: '5m ago' },
        { id: 3, type: 'loss', amount: '-10 WARPS', time: '12m ago' },
        { id: 4, type: 'win', amount: '+100 WARPS', time: '1h ago' },
    ];

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div className={styles.avatarContainer}>
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBX0U2dhk6dVb1vs7oMtloybq7L9-KBKsfY3yzR25eiZf6VbaBugDaZ8i3uK8no3Y4qWxlCK1VQC7v5WTKP8-fXG-61Iy-99Y3-LFZlkXiX-qMx7sHm5Fr_mUN2nJlx8-p_VYm-r6hvHAOVN_-ovovIrIBDXdzIMPLuiSn0E_psL-vuqUfCxyr2J3yJQ_rC45vHaESqdJGA9fL-eq0s6SNoErfbbXgErsK1d7X7lPBghUygQmOnonPjzP49eree_AP96ANo97tr3yow" alt="User" className={styles.avatarImg} />
                    <div className={styles.levelBadge}>Lvl 5</div>
                </div>
                <h1 className={styles.username}>@garr</h1>
                <div className={styles.metaInfo}>
                    <span className={styles.fid}>FID: 12345</span>
                    <span className={styles.divider}>•</span>
                    <span className={styles.wallet}>0x71C...9A23</span>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <StatBox label="Wins" value="12" highlight />
                <StatBox label="Losses" value="45" />
                <StatBox label="Win Rate" value="21%" />
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Recent History</h2>
                <div className={styles.historyList}>
                    {history.map((item) => (
                        <div key={item.id} className={`${styles.historyItem} glass-morphism`}>
                            <div className={styles.historyIcon}>
                                <span className={`material-symbols-outlined ${item.type === 'win' ? 'text-primary' : 'text-slate-500'}`}>
                                    {item.type === 'win' ? 'trophy' : 'close'}
                                </span>
                            </div>
                            <div className={styles.historyContent}>
                                <span className={styles.historyType}>{item.type === 'win' ? 'Win' : 'Miss'}</span>
                                <span className={styles.historyTime}>{item.time}</span>
                            </div>
                            <span className={`${styles.historyAmount} ${item.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                {item.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
