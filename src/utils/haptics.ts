/**
 * Haptic Feedback Utility
 * Uses the Vibration API to provide tactile feedback on supported devices.
 */

export const triggerHaptic = (type: 'tick' | 'success' | 'error' | 'soft') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    switch (type) {
        case 'tick':
            // Very short, sharp vibration for wheel ticks
            navigator.vibrate(5);
            break;
        case 'success':
            // Success pattern: short pulse, pause, longer pulse
            navigator.vibrate([50, 50, 100]);
            break;
        case 'error':
            // Error pattern: rapid double pulse
            navigator.vibrate([30, 50, 30]);
            break;
        case 'soft':
            // Soft feedback for UI interactions (buttons)
            navigator.vibrate(10);
            break;
    }
};
