"use client";

import { useEffect, useState } from "react";
import styles from "./JackpotTicker.module.css";

const MOCK_WINS = [
    { id: 1, user: "@dwr.eth", amount: "5,000", token: "DEGEN" },
    { id: 2, user: "@vbuterin", amount: "1,000", token: "HIGHER" },
    { id: 3, user: "@jessepollak", amount: "500", token: "TN100x" },
    { id: 4, user: "@pugson", amount: "10,000", token: "MOXIE" },
    { id: 5, user: "@betashop.eth", amount: "2,500", token: "HAM" },
];

interface WinRecord {
    id: string | number;
    user: string;
    amount: string | number;
    token: string;
    createdAt?: string;
}

export default function JackpotTicker() {
    const [wins, setWins] = useState<WinRecord[]>(MOCK_WINS);

    useEffect(() => {
        const fetchRecentWins = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/spin/recent-wins`);
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
        // Optional: Poll every 30 seconds for new wins
        const interval = setInterval(fetchRecentWins, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.track}>
                {/* Triple the content for smooth infinite loop */}
                {[...wins, ...wins, ...wins].map((win, i) => (
                    <div key={`${win.id || win.user}-${i}`} className={styles.item}>
                        <span className={styles.icon}>🎉</span>
                        <span className={styles.text}>
                            <span className={styles.user}>{win.user}</span> won{" "}
                            <span className={styles.amount}>
                                {typeof win.amount === 'number' ? win.amount.toLocaleString() : win.amount} {win.token}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
