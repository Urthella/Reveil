import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { HabitLog } from '../services/api';
import { getLocale } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export interface WeekdayCount {
    dayOfWeek: number;     // 0..6, Sun..Sat
    total: number;
    completed: number;
    rate: number;          // 0..1
}

export function computeWeekdayStats(logs: HabitLog[]): WeekdayCount[] {
    const totals = Array(7).fill(0);
    const completed = Array(7).fill(0);
    for (const l of logs) {
        if (l.frozen) continue;
        const dow = new Date(l.date + 'T00:00:00').getDay();
        if (Number.isNaN(dow)) continue;
        totals[dow]++;
        if (l.completed) completed[dow]++;
    }
    return totals.map((total, i) => ({
        dayOfWeek: i,
        total,
        completed: completed[i],
        rate: total > 0 ? completed[i] / total : 0,
    }));
}

export default function WeekdayInsight({ logs }: { logs: HabitLog[] }) {
    const stats = computeWeekdayStats(logs);
    const sample = stats.reduce((s, d) => s + d.total, 0);
    if (sample < 7) return null; // Not enough data to be meaningful.
    const tr = getLocale() === 'tr';
    const labels = tr ? DAY_LABELS_TR : DAY_LABELS_EN;

    const observed = stats.filter((d) => d.total > 0);
    if (!observed.length) return null;
    const best = observed.reduce((b, d) => (d.rate > b.rate ? d : b));
    const worst = observed.reduce((w, d) => (d.rate < w.rate ? d : w));

    return (
        <View>
            <Text style={typography.h3}>{tr ? 'Hangi günler güçlüsün?' : 'Which days are you strongest?'}</Text>
            <View style={[styles.row, { marginTop: spacing.s }]}>
                {stats.map((d) => (
                    <View key={d.dayOfWeek} style={styles.col}>
                        <Text style={[typography.caption, d.rate >= 0.7 ? { color: colors.success } : null]}>
                            {labels[d.dayOfWeek]}
                        </Text>
                        <View style={styles.barWrap}>
                            <View
                                style={[
                                    styles.bar,
                                    { height: `${Math.max(8, Math.round(d.rate * 100))}%`, backgroundColor: barColor(d.rate) },
                                ]}
                            />
                        </View>
                        <Text style={typography.caption}>{Math.round(d.rate * 100)}%</Text>
                    </View>
                ))}
            </View>
            <Text style={[typography.body, { marginTop: spacing.s }]}>
                {tr
                    ? `En güçlü gün: ${labels[best.dayOfWeek]} (%${Math.round(best.rate * 100)}). Dikkat: ${labels[worst.dayOfWeek]} (%${Math.round(worst.rate * 100)}).`
                    : `Strongest on ${labels[best.dayOfWeek]} (${Math.round(best.rate * 100)}%). Weakest on ${labels[worst.dayOfWeek]} (${Math.round(worst.rate * 100)}%).`}
            </Text>
            <View style={{ marginTop: spacing.s }}>
                <ProgressBar value={Math.round(best.rate * 100)} label="Best-day completion" />
            </View>
        </View>
    );
}

function barColor(rate: number): string {
    if (rate >= 0.8) return colors.success;
    if (rate >= 0.5) return colors.primary;
    if (rate > 0) return colors.warning;
    return colors.surfaceAlt;
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s, height: 100 },
    col: { flex: 1, alignItems: 'center', gap: spacing.xs },
    barWrap: {
        width: '100%',
        height: 60,
        backgroundColor: colors.surfaceAlt,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    bar: { width: '100%' },
});
