import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { HabitLog } from '../services/api';
import { getLocale } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

function average(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Returns the Pearson correlation coefficient between two equal-length series.
 * Returns 0 when either series has zero variance (signal is meaningless).
 */
function pearson(xs: number[], ys: number[]): number {
    if (xs.length < 2 || xs.length !== ys.length) return 0;
    const mx = average(xs);
    const my = average(ys);
    let num = 0;
    let dx2 = 0;
    let dy2 = 0;
    for (let i = 0; i < xs.length; i++) {
        const dx = xs[i] - mx;
        const dy = ys[i] - my;
        num += dx * dy;
        dx2 += dx * dx;
        dy2 += dy * dy;
    }
    const denom = Math.sqrt(dx2 * dy2);
    if (denom === 0) return 0;
    return num / denom;
}

export interface MoodStats {
    sampleSize: number;
    avgMoodOnCompleted: number;
    avgMoodOnSkipped: number;
    correlation: number; // -1..+1
}

export function computeMoodStats(logs: HabitLog[]): MoodStats {
    const withMood = logs.filter((l) => typeof l.moodScore === 'number' && !l.frozen);
    const completedMoods = withMood.filter((l) => l.completed).map((l) => l.moodScore as number);
    const skippedMoods = withMood.filter((l) => !l.completed).map((l) => l.moodScore as number);
    const xs = withMood.map((l) => (l.completed ? 1 : 0));
    const ys = withMood.map((l) => l.moodScore as number);
    return {
        sampleSize: withMood.length,
        avgMoodOnCompleted: Math.round(average(completedMoods) * 10) / 10,
        avgMoodOnSkipped: Math.round(average(skippedMoods) * 10) / 10,
        correlation: Math.round(pearson(xs, ys) * 100) / 100,
    };
}

export default function MoodInsight({ logs }: { logs: HabitLog[] }) {
    const stats = computeMoodStats(logs);
    if (stats.sampleSize < 3) return null; // need at least 3 mood-tagged entries
    const tr = getLocale() === 'tr';

    const tone = stats.correlation >= 0.3
        ? (tr ? 'Bu alışkanlığı tamamladığında mood\'un belirgin biçimde yükseliyor.' :
            'Your mood reliably climbs on the days you complete this habit.')
        : stats.correlation <= -0.3
            ? (tr ? 'İlginç — bu alışkanlığı yaptığın günler mood ortalama düşmüş. Belki zorlu günlerde başarıyorsun.' :
                'Interesting — your mood actually dips on completion days. You might be powering through tough days.')
            : (tr ? 'Mood ile bu alışkanlık arasında belirgin bir bağ yok. Süre değil ama sıklık önemli olabilir.' :
                'No strong link between mood and this habit yet. Frequency may matter more than feel.');

    return (
        <View>
            <Text style={typography.h3}>{tr ? 'Mood içgörüsü' : 'Mood insight'}</Text>
            <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                {tr ? `${stats.sampleSize} mood-etiketli kayıt` : `${stats.sampleSize} mood-tagged entries`}
            </Text>
            <View style={[styles.row, { marginTop: spacing.s }]}>
                <View style={styles.cell}>
                    <Text style={typography.caption}>{tr ? 'Tamamlanınca' : 'On completed'}</Text>
                    <Text style={typography.h2}>{stats.avgMoodOnCompleted}/10</Text>
                </View>
                <View style={styles.cell}>
                    <Text style={typography.caption}>{tr ? 'Atlanınca' : 'On skipped'}</Text>
                    <Text style={typography.h2}>{stats.avgMoodOnSkipped}/10</Text>
                </View>
            </View>
            <Text style={[typography.caption, { marginTop: spacing.s }]}>
                {tr ? 'Korelasyon' : 'Correlation'}: <Text style={typography.bodyStrong}>{stats.correlation.toFixed(2)}</Text>
            </Text>
            <ProgressBar value={Math.round(((stats.correlation + 1) / 2) * 100)} label="Mood correlation" />
            <Text style={[typography.body, { marginTop: spacing.s }]}>{tone}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.m },
    cell: { flex: 1, padding: spacing.s, backgroundColor: colors.surfaceAlt, borderRadius: 8 },
});
