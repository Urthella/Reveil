import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { getLocale } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
    level: number;
    onDismiss: () => void;
}

export default function LevelUpToast({ level, onDismiss }: Props) {
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
                accessibilityLabel={tr ? `Seviye atladın: ${level}` : `Level up: ${level}`}
                style={styles.card}
            >
                <Text style={styles.icon}>⭐</Text>
                <Text style={typography.caption}>{tr ? 'Seviye atladın!' : 'Level up!'}</Text>
                <Text style={typography.h2}>{tr ? `Seviye ${level}` : `Level ${level}`}</Text>
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
        zIndex: 51,
    },
    card: {
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderColor: colors.warning,
        borderWidth: 2,
        borderRadius: radius.l,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    icon: { fontSize: 36 },
});
