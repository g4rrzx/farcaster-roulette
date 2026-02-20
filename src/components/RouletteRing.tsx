"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './RouletteRing.module.css';
import SpinButton from './SpinButton';
import { triggerHaptic } from '@/utils/haptics';

interface RouletteRingProps {
    isSpinning: boolean;
    result: 'win' | 'loss' | 'jackpot' | null;
    onSpin: () => void;
    disabled?: boolean;
}

export default function RouletteRing({ isSpinning, result, onSpin, disabled }: RouletteRingProps) {
    const wheelRef = useRef<HTMLDivElement>(null);
    const pointerRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const speedRef = useRef(0);
    const lastTickRef = useRef(0);

    // Config
    const MAX_SPEED = 1000; // degrees per second
    const ACCELERATION = 500;
    const SEGMENT_ANGLE = 45; // 360 / 8 segments

    useEffect(() => {
        if (isSpinning) {
            // Start Loop
            let startTime = performance.now();
            lastTimeRef.current = startTime;
            speedRef.current = 0;

            const animate = (time: number) => {
                const deltaTime = (time - lastTimeRef.current) / 1000;
                lastTimeRef.current = time;

                // Accelerate
                if (speedRef.current < MAX_SPEED) {
                    speedRef.current += ACCELERATION * deltaTime;
                } else {
                    speedRef.current = MAX_SPEED;
                }

                rotationRef.current += speedRef.current * deltaTime;

                // Ticking Logic
                const currentAngle = rotationRef.current;
                if (currentAngle - lastTickRef.current >= SEGMENT_ANGLE) {
                    lastTickRef.current = currentAngle;
                    triggerTick();
                }

                if (wheelRef.current) {
                    wheelRef.current.style.transform = `rotate(${rotationRef.current % 360}deg)`;
                }

                animationFrameRef.current = requestAnimationFrame(animate);
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            if (result) {
                handleStop(result);
            } else {
                rotationRef.current = 0;
                if (wheelRef.current) wheelRef.current.style.transform = 'rotate(0deg)';
            }
        }

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isSpinning, result]);

    const handleStop = (res: 'win' | 'loss' | 'jackpot') => {
        // Angles corresponding to the center of each of the 8 segments
        // The wheel spins CLOCKWISE, but the segments in CSS are defined clockwise from the top starting at 0.
        // Wait, when wheel rotation = R, the segment at the top is the one that was at angle (360 - R).
        // Let's define the top-center angle of each segment:
        // Segment 1 (0-45deg) -> Center = 22.5deg (Zonk)
        // Segment 2 (45-90deg) -> Center = 67.5deg (Win)
        // Segment 3 (90-135deg) -> Center = 112.5deg (Zonk)
        // Segment 4 (135-180deg) -> Center = 157.5deg (Win)
        // Segment 5 (180-225deg) -> Center = 202.5deg (Zonk)
        // Segment 6 (225-270deg) -> Center = 247.5deg (Jackpot)
        // Segment 7 (270-315deg) -> Center = 292.5deg (Zonk)
        // Segment 8 (315-360deg) -> Center = 337.5deg (Win)

        const LOSS_ANGLES = [22.5, 112.5, 202.5, 292.5];
        const WIN_ANGLES = [67.5, 157.5, 337.5];
        const JACKPOT_ANGLES = [247.5];

        let targets = LOSS_ANGLES;
        if (res === 'win') targets = WIN_ANGLES;
        if (res === 'jackpot') targets = JACKPOT_ANGLES;

        const randomTarget = targets[Math.floor(Math.random() * targets.length)];

        // Calculate final rotation
        const currentRot = rotationRef.current;
        const extraSpins = 3 * 360; // 3 full spins minimum

        // We want (finalRot + randomTarget) % 360 = 0 (top position)
        // So wheel needs to rotate such that the segment at `randomTarget` lands at 0deg (360deg).
        // finalRot = N*360 + (360 - randomTarget)
        const targetMod = (360 - randomTarget) % 360;
        const currentMod = currentRot % 360;

        let diff = targetMod - currentMod;
        if (diff < 0) diff += 360;

        // Apply a little random offset inside the segment so it doesn't always land dead center
        // Segment is 45 degrees wide, so -15 to +15 is safe
        const randomOffset = (Math.random() * 30) - 15;

        const finalRot = currentRot + diff + extraSpins + randomOffset;

        if (wheelRef.current) {
            wheelRef.current.style.transform = `rotate(${currentRot}deg)`;
            void wheelRef.current.offsetWidth;

            // Use CSS transition for smooth landing
            wheelRef.current.style.transition = 'transform 3.5s cubic-bezier(0.15, 0, 0.15, 1)'; // Custom easing
            wheelRef.current.style.transform = `rotate(${finalRot}deg)`;

            rotationRef.current = finalRot;
        }
    };

    // Reset transition when spinning starts again
    useEffect(() => {
        if (isSpinning && wheelRef.current) {
            wheelRef.current.style.transition = 'none';
        }
    }, [isSpinning]);

    const triggerTick = () => {
        // Trigger Haptic Feedback
        triggerHaptic('tick');

        if (pointerRef.current) {
            // Reset animation
            pointerRef.current.classList.remove(styles.ticking);
            void pointerRef.current.offsetWidth; // Trigger reflow
            pointerRef.current.classList.add(styles.ticking);
        }
    };

    // Wheel Segments Data matches CSS
    const segmentsData = [
        { label: "ZONK 💀", type: "zonk", rotation: 22.5 },
        { label: "0.01 ARB", type: "arb", rotation: 67.5 },
        { label: "ZONK 💀", type: "zonk", rotation: 112.5 },
        { label: "0.01 ARB", type: "arb", rotation: 157.5 },
        { label: "ZONK 💀", type: "zonk", rotation: 202.5 },
        { label: "JACKPOT 🏆", type: "jackpot", rotation: 247.5 },
        { label: "ZONK 💀", type: "zonk", rotation: 292.5 },
        { label: "0.01 ARB", type: "arb", rotation: 337.5 },
    ];

    return (
        <div className={styles.container}>
            {/* Background Glow */}
            <div className={styles.ambientGlow}></div>

            {/* The Rotating Wheel */}
            <div ref={wheelRef} className={styles.wheel}>

                {/* Outer Rim with Bolts */}
                <div className={styles.rim}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={styles.bolt} style={{ transform: `rotate(${i * 30}deg)` }}></div>
                    ))}
                </div>

                {/* Segments Layer */}
                <div className={styles.segments}></div>

                {/* Segment Texts */}
                <div className={styles.segmentTexts}>
                    {segmentsData.map((seg, i) => (
                        <div key={i} className={styles.segmentText} style={{ transform: `rotate(${seg.rotation}deg)` }}>
                            <span className={
                                seg.type === 'zonk'
                                    ? styles.textZonk
                                    : seg.type === 'arb'
                                        ? styles.textArb
                                        : styles.textJackpot
                            }>
                                {seg.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Light Divider Lines */}
                <div className={styles.gridLines}></div>

                {/* Inner Shadow for depth */}
                <div className={styles.innerShadow}></div>
            </div>

            {/* Static Center Hub (Interactive Button) */}
            <div className={styles.hub}>
                <SpinButton onClick={onSpin} disabled={disabled} />
            </div>

            {/* Pointer / Flapper */}
            <div ref={pointerRef} className={styles.pointerContainer}>
                <div className={styles.pointerBody}></div>
                <div className={styles.pointerTip}></div>
            </div>

            {/* Overlay Reflection */}
            <div className={styles.glassReflection}></div>
        </div>
    );
}
