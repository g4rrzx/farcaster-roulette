"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './RouletteRing.module.css';

interface RouletteRingProps {
    isSpinning: boolean;
    result: 'win' | 'loss' | null;
}

export default function RouletteRing({ isSpinning, result }: RouletteRingProps) {
    const wheelRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const speedRef = useRef(0);
    // State to trigger re-render for final landing position class if needed, 
    // currently handling via direct DOM manipulation for performance.

    // Config
    const MAX_SPEED = 800; // degrees per second
    const ACCELERATION = 400;
    const DECELERATION = 200; // degrees per second squared

    useEffect(() => {
        if (isSpinning) {
            // Start Loop
            let startTime = performance.now();
            lastTimeRef.current = startTime;
            speedRef.current = 0;

            const animate = (time: number) => {
                const deltaTime = (time - lastTimeRef.current) / 1000;
                lastTimeRef.current = time;

                if (result) {
                    // Deceleration Phase handled separately or here?
                    // Actually, if result is set, we need to calculate Target.
                    // But here we just keep spinning until the parent tells us result is ready?
                    // The parent sets result AND setIsSpinning(false) usually together after delay.
                    // Ah, wait. checking props..
                    // Parent sets result THEN sets isSpinning(false)? 
                    // In SpinPage: receives result, THEN sets isSpinning(false).
                    // Actually in SpinPage mock: 
                    // setTimeout(() => { setIsSpinning(false); setResult(...) }, 3000);
                    // This implies they happen same time.
                }

                // Accelerate to Max Speed
                if (speedRef.current < MAX_SPEED) {
                    speedRef.current += ACCELERATION * deltaTime;
                } else {
                    speedRef.current = MAX_SPEED;
                }

                rotationRef.current += speedRef.current * deltaTime;

                if (wheelRef.current) {
                    wheelRef.current.style.transform = `rotate(${rotationRef.current % 360}deg)`;
                }

                animationFrameRef.current = requestAnimationFrame(animate);
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            // Stop Loop
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            // If we have a result, transition to it.
            if (result) {
                handleStop(result);
            } else {
                // Reset
                rotationRef.current = 0;
                if (wheelRef.current) wheelRef.current.style.transform = 'rotate(0deg)';
            }
        }

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isSpinning, result]);

    const handleStop = (res: 'win' | 'loss') => {
        // Target Segment Logic
        // 0deg at top = start of first segment (0-45).
        // Center of segments:
        // Win (Cyan): 22.5, 202.5 (+180)
        // Win (Purple): 112.5, 292.5
        // Loss (Dark): 67.5, 157.5, 247.5, 337.5

        const WIN_ANGLES = [22.5, 112.5, 202.5, 292.5];
        const LOSS_ANGLES = [67.5, 157.5, 247.5, 337.5];

        const targets = res === 'win' ? WIN_ANGLES : LOSS_ANGLES;
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];

        // Calculate rotation needed to bring randomTarget to Top (0deg)
        // Visual Angle V = (Rotation - Target) ? No.
        // Rotation R. Point P at angle A on wheel is now at R+A.
        // We want P=randomTarget to be at 0 (or 360).
        // R + randomTarget = 360 * N
        // R = 360*N - randomTarget.

        // Current Rotation
        const currentRot = rotationRef.current;

        // Minimum extra spins
        const extraSpins = 3 * 360;

        // Next multiple of 360 greater than current + extra
        // Actually we just want a target R > current + extra
        // such that (R + randomTarget) % 360 == 0

        // (R + T) % 360 = 0  => R % 360 = (360 - T) % 360.
        const targetMod = (360 - randomTarget) % 360;
        const currentMod = currentRot % 360;

        let diff = targetMod - currentMod;
        if (diff < 0) diff += 360;

        const finalRot = currentRot + diff + extraSpins;

        // Animate to finalRot using CSS transition for smooth ease-out
        if (wheelRef.current) {
            // Force reflow/style update for current pos
            wheelRef.current.style.transform = `rotate(${currentRot}deg)`;
            // Trigger reflow
            void wheelRef.current.offsetWidth;

            // Add transition
            wheelRef.current.style.transition = 'transform 3s cubic-bezier(0.1, 0, 0.2, 1)';
            wheelRef.current.style.transform = `rotate(${finalRot}deg)`;

            // Update ref to final so next spin starts from here
            rotationRef.current = finalRot;
        }
    };

    return (
        <div className={styles.container}>
            {/* Outer Glow Ring */}
            <div className={`${styles.outerGlow} pulse-effect`}></div>
            <div className={`${styles.outerGlowDelayed} pulse-effect`}></div>

            {/* Main Wheel */}
            <div
                ref={wheelRef}
                className={styles.wheel}
            // Initial static style removed, handled by JS
            >
                {/* Segments (Conic Gradient) */}
                <div className={styles.segments}></div>

                {/* Inner Ring */}
                <div className={styles.innerRing}>
                    {/* Center Hub */}
                    <div className={`${styles.hub} glass-morphism`}>
                        <span className={`material-symbols-outlined ${styles.hubIcon} neon-text-glow`}>flare</span>
                    </div>
                </div>
            </div>

            {/* Indicator */}
            <div className={styles.indicator}></div>
        </div>
    );
}
