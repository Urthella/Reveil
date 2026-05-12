import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { t } from '../services/i18n';

export interface WeeklyDay {
    date: string;
    completed: number;
    total: number;
}

const WEEKDAY_LABEL = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function WeeklyChart({ data }: { data: WeeklyDay[] }) {
    if (!data?.length) return null;
    const ratios = data.map((d) => (d.total > 0 ? d.completed / d.total : 0));

    return (
        <View>
            <Text style={typography.caption}>{t('dashboard.weeklyTitle')}</Text>
            <View style={styles.row}>
                {data.map((d, i) => {
                    const ratio = ratios[i];
                    const heightPct = Math.max(8, Math.round(ratio * 100));
                    const dow = new Date(d.date + 'T00:00:00').getDay();
                    return (
                        <View key={d.date} style={styles.col}>
                            <View style={styles.barWrap}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${heightPct}%`,
                                            backgroundColor: ratio >= 1 ? colors.success : ratio > 0 ? colors.primary : colors.surfaceAlt,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.label}>{WEEKDAY_LABEL[dow]}</Text>
                            <Text style={styles.value}>
                                {d.completed}/{d.total}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s, marginTop: spacing.s, height: 120 },
    col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    barWrap: {
        width: '100%',
        height: 80,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.s,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    bar: { width: '100%' },
    label: { ...typography.caption, marginTop: spacing.xs },
    value: { ...typography.caption, fontSize: 10, color: colors.textMuted },
});
