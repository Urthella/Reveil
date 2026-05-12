import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface Props {
    /** 0..1 — the share of the period completed. */
    progress: number;
    /** Outer dimension in dp. Defaults to 48. */
    size?: number;
    /** Optional centered label (e.g. "4/7"). */
    label?: string;
    accessibilityLabel?: string;
}

/**
 * Lightweight circular progress indicator. We avoid pulling in react-native-svg
 * by approximating the ring with two stacked half-circles whose rotation is
 * keyed off the progress value:
 *
 *   - The right half is fully visible while progress > 0.
 *   - A "mask" half-circle on the left rotates with the progress (0..360°);
 *     once progress passes 50%, the right-side base color fills the second half.
 */
export default function ProgressRing({ progress, size = 48, label, accessibilityLabel }: Props) {
    const p = Math.max(0, Math.min(1, progress || 0));
    const ringColor = p >= 1 ? colors.success : p >= 0.5 ? colors.primary : p > 0 ? colors.warning : colors.surfaceAlt;
    const half = size / 2;

    const angle = p * 360;
    // For p <= 0.5 we rotate a single mask in the right hemisphere.
    // For p >  0.5 we keep the right side fully filled and rotate the second mask in the left hemisphere.
    const firstRotation = p <= 0.5 ? angle - 180 : 0;
    const secondRotation = p > 0.5 ? angle - 360 : -180;

    return (
        <View
            style={[styles.container, { width: size, height: size }]}
            accessibilityRole="progressbar"
            accessibilityValue={{ now: Math.round(p * 100), min: 0, max: 100 }}
            accessibilityLabel={accessibilityLabel ?? `${Math.round(p * 100)}%`}
        >
            <View style={[styles.base, { width: size, height: size, borderRadius: half, backgroundColor: colors.surfaceAlt }]} />
            <View style={[styles.fill, { width: size, height: size, borderRadius: half, backgroundColor: ringColor, opacity: p > 0 ? 1 : 0 }]} />
            {/* First mask covers the right hemisphere */}
            <View
                style={[
                    styles.maskWrap,
                    { width: size, height: size, borderRadius: half, transform: [{ rotate: `${firstRotation}deg` }] },
                ]}
            >
                <View style={[styles.maskHalf, { width: half, height: size, backgroundColor: colors.surfaceAlt }]} />
            </View>
            {/* Second mask covers the left hemisphere */}
            <View
                style={[
                    styles.maskWrap,
                    { width: size, height: size, borderRadius: half, transform: [{ rotate: `${secondRotation}deg` }] },
                ]}
            >
                <View style={[styles.maskHalf, { width: half, height: size, backgroundColor: colors.surfaceAlt }]} />
            </View>
            {/* Inner cutout for the donut effect */}
            <View
                style={[
                    styles.center,
                    {
                        width: size - 8,
                        height: size - 8,
                        borderRadius: (size - 8) / 2,
                        backgroundColor: colors.surface,
                    },
                ]}
            >
                {label ? <Text style={[typography.caption, { color: colors.text }]}>{label}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    base: { position: 'absolute' },
    fill: { position: 'absolute' },
    maskWrap: {
        position: 'absolute',
        overflow: 'hidden',
    },
    maskHalf: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
