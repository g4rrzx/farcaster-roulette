"use client";

import styles from './SpinButton.module.css';

interface SpinButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isProcessing?: boolean;
}

export default function SpinButton({ onClick, disabled, isProcessing }: SpinButtonProps) {
    return (
        <div className={styles.container}>
            <button
                className={`${styles.button} ${disabled ? styles.disabled : ''} ${isProcessing ? styles.processing : ''}`}
                onClick={onClick}
                disabled={disabled}
            >
                <div className={styles.innerRing}>
                    {isProcessing ? (
                        <span className={styles.processingSpinner}></span>
                    ) : (
                        <span className={styles.text}>SPIN</span>
                    )}
                </div>
            </button>
            {/* Glow effect under the button */}
            <div className={`${styles.glow} ${disabled ? '' : styles.activeGlow}`}></div>
        </div>
    );
}
