import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'ghost';
    style?: ViewStyle;
    accessibilityHint?: string;
    /** Override the default label (defaults to `title`). */
    accessibilityLabel?: string;
    testID?: string;
}

export default function PrimaryButton({
    title,
    onPress,
    loading,
    disabled,
    variant = 'primary',
    style,
    accessibilityHint,
    accessibilityLabel,
    testID,
}: Props) {
    const isGhost = variant === 'ghost';
    const isDisabled = !!(disabled || loading);
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessible
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: isDisabled, busy: !!loading }}
            testID={testID}
            style={({ pressed }) => [
                styles.base,
                isGhost ? styles.ghost : styles.primary,
                pressed && !isDisabled ? { opacity: 0.85 } : null,
                isDisabled ? { opacity: 0.5 } : null,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={colors.text} accessibilityLabel="Loading" />
            ) : (
                <Text style={[typography.button, isGhost ? { color: colors.primary } : null]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.l,
        borderRadius: radius.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: { backgroundColor: colors.primary },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
});
