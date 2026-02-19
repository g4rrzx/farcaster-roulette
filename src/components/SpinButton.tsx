"use client";

import styles from './SpinButton.module.css';

interface SpinButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export default function SpinButton({ onClick, disabled }: SpinButtonProps) {
    return (
        <button
            className={styles.spinButton}
            onClick={onClick}
            disabled={disabled}
        >
            <div className={styles.shimmer}></div>
            <span className={styles.label}>
                SPIN <span className="material-symbols-outlined" style={{ fontWeight: 900 }}>autorenew</span>
            </span>
        </button>
    );
}
