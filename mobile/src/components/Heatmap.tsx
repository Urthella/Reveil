import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HabitLog } from '../services/api';
import { getLocale } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
    logs: HabitLog[];
    days?: number; // default 91 (13 weeks)
}

const DEFAULT_DAYS = 91;
const COLS = Math.ceil(DEFAULT_DAYS / 7);

import { localDaysAgoIso } from '../services/dates';

function isoDaysAgo(n: number): string {
    return localDaysAgoIso(n);
}

function cellColor(state: 'completed' | 'frozen' | 'skipped' | 'empty'): string {
    switch (state) {
        case 'completed': return colors.primary;
        case 'frozen': return colors.secondary;
        case 'skipped': return colors.error;
        default: return colors.surfaceAlt;
    }
}

export default function Heatmap({ logs, days = DEFAULT_DAYS }: Props) {
    const cols = Math.ceil(days / 7);
    const completed = new Set(logs.filter((l) => l.completed && !l.frozen).map((l) => l.date));
    const frozen = new Set(logs.filter((l) => l.frozen).map((l) => l.date));
    const skipped = new Set(logs.filter((l) => !l.completed && !l.frozen).map((l) => l.date));
    const tr = getLocale() === 'tr';

    const rows: { date: string; state: 'completed' | 'frozen' | 'skipped' | 'empty' }[][] = [];
    for (let r = 0; r < 7; r++) rows.push([]);

    // Walk from oldest to newest so cells appear in chronological order left→right.
    for (let i = days - 1; i >= 0; i--) {
        const d = isoDaysAgo(i);
        const dow = (new Date(d + 'T00:00:00').getDay() + 6) % 7; // ISO Mon=0..Sun=6
        let state: 'completed' | 'frozen' | 'skipped' | 'empty' = 'empty';
        if (completed.has(d)) state = 'completed';
        else if (frozen.has(d)) state = 'frozen';
        else if (skipped.has(d)) state = 'skipped';
        rows[dow].push({ date: d, state });
    }

    const totalCompleted = completed.size;

    return (
        <View>
            <View style={styles.headerRow}>
                <Text style={typography.h3}>{tr ? 'Son 90 gün' : 'Last 90 days'}</Text>
                <Text style={typography.caption}>
                    {totalCompleted}/{days} {tr ? 'gün' : 'days'}
                </Text>
            </View>
            <View
                style={styles.grid}
                accessibilityLabel={`Heatmap: ${totalCompleted} completed of ${days} days`}
            >
                {rows.map((row, r) => (
                    <View key={r} style={styles.gridRow}>
                        {row.map((c) => (
                            <View
                                key={c.date}
                                style={[
                                    styles.cell,
                                    { backgroundColor: cellColor(c.state) },
                                ]}
                            />
                        ))}
                        {row.length < cols
                            ? Array.from({ length: cols - row.length }).map((_, i) => (
                                <View key={`pad-${i}`} style={[styles.cell, { opacity: 0 }]} />
                            ))
                            : null}
                    </View>
                ))}
            </View>
            <View style={styles.legend}>
                <Legend color={colors.primary} label={tr ? 'Tamam' : 'Done'} />
                <Legend color={colors.secondary} label={tr ? 'Donduruldu' : 'Frozen'} />
                <Legend color={colors.error} label={tr ? 'Atlandı' : 'Skipped'} />
                <Legend color={colors.surfaceAlt} label={tr ? 'Yok' : 'None'} />
            </View>
        </View>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={typography.caption}>{label}</Text>
        </View>
    );
}

const CELL = 12;

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    grid: { marginTop: spacing.s, gap: 2 },
    gridRow: { flexDirection: 'row', gap: 2 },
    cell: {
        width: CELL,
        height: CELL,
        borderRadius: 2,
    },
    legend: { flexDirection: 'row', gap: spacing.m, marginTop: spacing.s, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    legendDot: { width: 10, height: 10, borderRadius: 2 },
});
