"use client";

import { useEffect, useState } from "react";
import styles from "./ParticlesBackground.module.css";

const ICONS = ["💎", "🎰", "🎲", "7️⃣", "🍒", "🔥", "🚀", "💰"];

interface Particle {
    id: number;
    icon: string;
    left: string;
    delay: string;
    duration: string;
    size: string;
}

export default function ParticlesBackground() {
    const isMounted = true;
    const [particles] = useState<Particle[]>(() => {
        // Initial generation only happens once per component instance
        if (typeof window === 'undefined') return [];
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            icon: ICONS[Math.floor(Math.random() * ICONS.length)],
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 10}s`,
            duration: `${15 + Math.random() * 15}s`,
            size: `${1 + Math.random()}rem`,
        }));
    });


    if (!isMounted) return null;

    return (
        <div className={styles.container}>
            {particles.map((p) => (
                <span
                    key={p.id}
                    className={styles.particle}
                    style={{
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        fontSize: p.size,
                    }}
                >
                    {p.icon}
                </span>
            ))}
        </div>
    );
}
