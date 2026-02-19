"use client";

import styles from './SpinButton.module.css';

interface SpinButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export default function SpinButton({ onClick, disabled }: SpinButtonProps) {
    return (
        <div className={styles.container}>
            <button
                className={`${styles.button} ${disabled ? styles.disabled : ''}`}
                onClick={onClick}
                disabled={disabled}
            >
                <div className={styles.innerRing}>
                    <span className={styles.text}>SPIN</span>
                </div>
            </button>
            {/* Glow effect under the button */}
            <div className={`${styles.glow} ${disabled ? '' : styles.activeGlow}`}></div>
        </div>
    );
}
