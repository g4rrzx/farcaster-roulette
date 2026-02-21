"use client";

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
        recast_launch: QuestStatus;
    }>({
        daily: 'idle',
        follow: 'idle',
        recast: 'idle',
        recast_launch: 'idle',
    });

    const [nextClaimDate, setNextClaimDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success',
    });

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

    const verifyQuest = async (questType: 'daily' | 'follow' | 'recast' | 'recast_launch', questKey: keyof typeof quests) => {
        if (!user || isLoading) return;

        updateQuest(questKey, 'verifying');
        setModalState(prev => ({ ...prev, isOpen: false }));

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
                if (data.nextClaimDate) setNextClaimDate(data.nextClaimDate);

                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate([50, 50, 100]);
                }
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#00f2ff', '#a855f7', '#ffffff']
                });

                // Show Success Modal
                setModalState({
                    isOpen: true,
                    title: 'Congratulations! 🎉',
                    message: data.message || `Quest completed! You earned a ticket.`,
                    type: 'success'
                });

            } else {
                updateQuest(questKey, questType === 'daily' ? 'idle' : 'action_taken');
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

                // Show Error Modal
                setModalState({
                    isOpen: true,
                    title: 'Oops! 😬',
                    message: data.error || 'Verification failed. Please try again.',
                    type: 'error'
                });
            }
        } catch (e) {
            console.error('Quest verify error:', e);
            updateQuest(questKey, questType === 'daily' ? 'idle' : 'action_taken');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

            // Show Error Modal for Network Error
            setModalState({
                isOpen: true,
                title: 'Connection Error',
                message: 'Network error. Please try again later.',
                type: 'error'
            });
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

    // --- RECAST LAUNCH ---
    const handleRecastLaunchAction = () => updateQuest('recast_launch', 'action_taken');
    const handleVerifyRecastLaunch = () => verifyQuest('recast_launch', 'recast_launch');

    return (
        <main className={`${styles.container} page-transition`}>
            <header className={styles.header}>
                <h1 className={styles.title}>Quest Board</h1>
                <p className={styles.subtitle}>Complete tasks to earn free tickets</p>
            </header>

            {modalState.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${modalState.type === 'error' ? styles.modalError : styles.modalSuccess}`}>
                        <div className={styles.modalHeader}>
                            <span className={`material-symbols-outlined ${styles.modalIcon}`}>
                                {modalState.type === 'error' ? 'error' : 'celebration'}
                            </span>
                            <h2 className={styles.modalTitle}>{modalState.title}</h2>
                        </div>
                        <p className={styles.modalBodyText}>{modalState.message}</p>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                            onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                        >
                            Got it
                        </button>
                    </div>
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
                        title="Like & Recast Launch!"
                        description="Support our launch to earn 2 tickets!"
                        reward="+2 Tickets 🎟️"
                        actionLabel="Go to Cast"
                        href="https://farcaster.xyz/fcmini/0xc4dd7fac"
                        status={quests.recast_launch}
                        onActionTaken={handleRecastLaunchAction}
                        onVerify={handleVerifyRecastLaunch}
                        isPageLoading={isLoading}
                    />

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
