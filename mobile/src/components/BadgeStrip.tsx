import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../services/api';
import { colors, radius, spacing, typography } from '../theme';
import { t } from '../services/i18n';

const ICONS: Record<string, string> = {
    spark: '✨',
    momentum: '🚀',
    rooted: '🌳',
    identity: '🏆',
    dedicated: '💎',
    forged: '🔥',
};

export default function BadgeStrip({ badges }: { badges: Badge[] }) {
    if (!badges?.length) return null;
    return (
        <View>
            <Text style={typography.caption}>{t('dashboard.badges')}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {badges.map((b) => {
                    const earned = b.earned;
                    return (
                        <View
                            key={b.id}
                            style={[styles.card, earned ? styles.earned : styles.locked]}
                        >
                            <Text style={[styles.icon, earned ? null : styles.dim]}>{ICONS[b.id] ?? '⭐'}</Text>
                            <Text style={[typography.bodyStrong, earned ? null : styles.dim]}>{b.label}</Text>
                            <Text style={[typography.caption, earned ? null : styles.dim]}>{b.description}</Text>
                            {!earned ? (
                                <View style={styles.bar}>
                                    <View style={[styles.barFill, { width: `${Math.round(b.progress * 100)}%` }]} />
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { gap: spacing.s, paddingVertical: spacing.s, paddingRight: spacing.l },
    card: {
        width: 132,
        padding: spacing.m,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    earned: { backgroundColor: colors.surface, borderColor: colors.primary },
    locked: { backgroundColor: colors.surfaceAlt },
    dim: { color: colors.textMuted },
    icon: { fontSize: 28 },
    bar: {
        marginTop: spacing.xs,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: radius.pill,
        overflow: 'hidden',
    },
    barFill: { height: '100%', backgroundColor: colors.primary },
});
