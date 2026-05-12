import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { CategoryRollup, HabitCategory } from '../services/api';
import { getLocale, t } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

const ICON: Record<HabitCategory, string> = {
    health: '💪',
    productivity: '🎯',
    mindfulness: '🧘',
    social: '🫂',
    recovery: '🌱',
    general: '⭐',
};

const LABELS_TR: Record<HabitCategory, string> = {
    health: 'Sağlık',
    productivity: 'Üretkenlik',
    mindfulness: 'Farkındalık',
    social: 'Sosyal',
    recovery: 'İyileşme',
    general: 'Genel',
};

const LABELS_EN: Record<HabitCategory, string> = {
    health: 'Health',
    productivity: 'Productivity',
    mindfulness: 'Mindfulness',
    social: 'Social',
    recovery: 'Recovery',
    general: 'General',
};

export default function CategoryBreakdown({ data }: { data: CategoryRollup[] }) {
    if (!data?.length) return null;
    const labels = getLocale() === 'tr' ? LABELS_TR : LABELS_EN;
    const heading = getLocale() === 'tr' ? 'Kategori dağılımı' : 'By category';

    return (
        <View>
            <Text style={typography.h3}>{heading}</Text>
            <View style={{ gap: spacing.s, marginTop: spacing.s }}>
                {data.map((row) => (
                    <View key={row.category} style={styles.row}>
                        <View style={styles.labelRow}>
                            <Text style={typography.bodyStrong}>
                                {ICON[row.category] ?? '⭐'} {labels[row.category] ?? row.category}
                            </Text>
                            <Text style={typography.caption}>
                                {row.habitCount} · {row.consistencyScore}% · {row.currentStreak}d
                            </Text>
                        </View>
                        <ProgressBar value={row.consistencyScore} />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { gap: spacing.xs },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
