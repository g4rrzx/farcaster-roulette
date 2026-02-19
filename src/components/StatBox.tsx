"use client";

import styles from './StatBox.module.css';

interface StatBoxProps {
    label: string;
    value: string | number;
    highlight?: boolean;
}

export default function StatBox({ label, value, highlight = false }: StatBoxProps) {
    return (
        <div className={`${styles.box} glass-morphism ${highlight ? styles.highlight : ''}`}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
        </div>
    );
}
