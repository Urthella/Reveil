import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import { feedbackService, FeedbackLog } from '../services/api';
import { getLocale, t } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface Props {
    onSeeAll?: () => void;
}

export default function WeeklyInsightCard({ onSeeAll }: Props) {
    const [latest, setLatest] = useState<FeedbackLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const refresh = async () => {
        try {
            const history = await feedbackService.history();
            setLatest(history?.[0] ?? null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const isStale = !latest || Date.now() - new Date(latest.generatedAt).getTime() > WEEK_MS;

    const generate = async () => {
        setGenerating(true);
        try {
            const fresh = await feedbackService.generate(undefined, getLocale());
            setLatest(fresh);
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.response?.data?.message ?? 'Failed to generate.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return null;

    return (
        <Card>
            <View style={styles.header}>
                <Text style={typography.h3}>{getLocale() === 'tr' ? 'Haftalık özet' : 'Weekly insight'}</Text>
                {latest ? (
                    <Text style={typography.caption}>{new Date(latest.generatedAt).toLocaleDateString()}</Text>
                ) : null}
            </View>
            {latest ? (
                <Text style={[typography.body, { marginTop: spacing.s, color: colors.text }]}>{latest.feedbackText}</Text>
            ) : (
                <Text style={[typography.caption, { marginTop: spacing.s }]}>
                    {getLocale() === 'tr'
                        ? 'Henüz bir geri bildirim yok. Bu haftaki özetini şimdi üret.'
                        : 'No insight yet — generate this week\'s summary now.'}
                </Text>
            )}
            <View style={styles.actions}>
                <PrimaryButton
                    title={isStale
                        ? (getLocale() === 'tr' ? 'Yeni özet üret' : 'Generate fresh insight')
                        : (getLocale() === 'tr' ? 'Yenile' : 'Regenerate')}
                    variant={isStale ? 'primary' : 'ghost'}
                    onPress={generate}
                    loading={generating}
                    style={{ flex: 1 }}
                />
                {onSeeAll ? (
                    <PrimaryButton
                        title={getLocale() === 'tr' ? 'Tümü' : 'See all'}
                        variant="ghost"
                        onPress={onSeeAll}
                        style={{ flex: 1 }}
                    />
                ) : null}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actions: { flexDirection: 'row', gap: spacing.m, marginTop: spacing.m },
});
