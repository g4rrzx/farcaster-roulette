"use client";

import { useEffect, useState } from "react";
import styles from "./JackpotTicker.module.css";

const MOCK_WINS = [
    { user: "@dwr.eth", amount: "5,000", token: "DEGEN" },
    { user: "@vbuterin", amount: "1,000", token: "HIGHER" },
    { user: "@jessepollak", amount: "500", token: "TN100x" },
    { user: "@pugson", amount: "10,000", token: "MOXIE" },
    { user: "@betashop.eth", amount: "2,500", token: "HAM" },
];

export default function JackpotTicker() {
    return (
        <div className={styles.container}>
            <div className={styles.track}>
                {/* Triple the content for smooth infinite loop */}
                {[...MOCK_WINS, ...MOCK_WINS, ...MOCK_WINS].map((win, i) => (
                    <div key={i} className={styles.item}>
                        <span className={styles.icon}>🎉</span>
                        <span className={styles.text}>
                            <span className={styles.user}>{win.user}</span> won{" "}
                            <span className={styles.amount}>{win.amount} {win.token}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
