import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

export default function ProgressBar({ value, label }: { value: number; label?: string }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ now: pct, min: 0, max: 100 }}
            accessibilityLabel={label ?? `${pct}% progress`}
        >
            <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceAlt,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
});
