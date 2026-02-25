"use client";

import { useEffect, useState } from "react";
import styles from "./JackpotTicker.module.css";

interface WinRecord {
    id: string | number;
    user: string;
    amount: string | number;
    token: string;
    isJackpot?: boolean;
    createdAt?: string;
}

export default function JackpotTicker() {
    const [wins, setWins] = useState<WinRecord[]>([]);

    useEffect(() => {
        const fetchRecentWins = async () => {
            try {
                const res = await fetch('/api/spin/recent-wins');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setWins(data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch recent wins:", err);
            }
        };

        fetchRecentWins();
        const interval = setInterval(fetchRecentWins, 30000);
        return () => clearInterval(interval);
    }, []);

    if (wins.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.track}>
                {[...wins, ...wins, ...wins].map((win, i) => (
                    <div
                        key={`${win.id || win.user}-${i}`}
                        className={`${styles.item} ${win.isJackpot ? styles.jackpotItem : ''}`}
                    >
                        <span className={styles.icon}>{win.isJackpot ? '🏆' : '🎉'}</span>
                        <span className={styles.text}>
                            <span className={styles.user}>{win.user}</span>{" "}
                            {win.isJackpot ? (
                                <span className={styles.jackpotLabel}>JACKPOT </span>
                            ) : (
                                <>won{" "}</>
                            )}
                            <span className={win.isJackpot ? styles.jackpotAmount : styles.amount}>
                                {typeof win.amount === 'number' ? win.amount.toLocaleString() : win.amount} {win.token}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
