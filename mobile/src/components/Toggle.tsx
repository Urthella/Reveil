import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
    value: boolean;
    onChange: (next: boolean) => void;
    accessibilityLabel?: string;
    disabled?: boolean;
}

export default function Toggle({ value, onChange, accessibilityLabel, disabled }: Props) {
    return (
        <Pressable
            onPress={() => !disabled && onChange(!value)}
            disabled={disabled}
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled: !!disabled }}
            accessibilityLabel={accessibilityLabel}
            style={[styles.track, value ? styles.trackOn : null, disabled ? styles.trackDisabled : null]}
        >
            <View style={[styles.knob, value ? styles.knobOn : null]} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        width: 48,
        height: 28,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 2,
        justifyContent: 'center',
    },
    trackOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    trackDisabled: { opacity: 0.5 },
    knob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.text,
    },
    knobOn: { transform: [{ translateX: 20 }] },
});
