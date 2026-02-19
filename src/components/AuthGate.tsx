"use client";

import { useAuth } from "./AuthProvider";
import styles from "./AuthGate.module.css";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const { isLoading, isConnected, error } = useAuth();

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.spinner}></div>
                    <p className={styles.text}>Connecting to Farcaster...</p>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className={styles.container}>
                <div className={`${styles.card} glass-morphism`}>
                    <div className={styles.iconCircle}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                            lock
                        </span>
                    </div>
                    <h1 className={styles.title}>
                        Farcaster <span className={styles.highlight}>Roulette</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Open this app inside a Farcaster client to play
                    </p>
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.badge}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            info
                        </span>
                        Farcaster Mini App Required
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
