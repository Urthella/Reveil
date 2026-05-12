import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../services/api';
import { getLocale } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

const ICONS: Record<string, string> = {
    spark: '✨',
    momentum: '🚀',
    rooted: '🌳',
    identity: '🏆',
    dedicated: '💎',
    forged: '🔥',
};

interface Props {
    badge: Badge;
    onDismiss: () => void;
}

/**
 * Slide-in toast at the top of the screen celebrating a freshly earned badge.
 * Auto-dismisses after 4 seconds; tap to dismiss earlier.
 */
export default function BadgeUnlockToast({ badge, onDismiss }: Props) {
    const translateY = useRef(new Animated.Value(-160)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
        ]).start();

        const timer = setTimeout(dismiss, 4000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -160, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onDismiss());
    };

    const tr = getLocale() === 'tr';

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[styles.container, { transform: [{ translateY }, { scale }], opacity }]}
        >
            <Pressable
                onPress={dismiss}
                accessibilityRole="alert"
                accessibilityLabel={`Badge unlocked: ${badge.label}`}
                style={styles.card}
            >
                <Text style={styles.icon}>{ICONS[badge.id] ?? '⭐'}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={typography.caption}>{tr ? 'Yeni rozet' : 'Badge unlocked'}</Text>
                    <Text style={typography.h3}>{badge.label}</Text>
                    <Text style={typography.caption}>{badge.description}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: spacing.l,
        left: spacing.l,
        right: spacing.l,
        zIndex: 50,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        borderWidth: 2,
        borderRadius: radius.l,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    icon: { fontSize: 36 },
});
