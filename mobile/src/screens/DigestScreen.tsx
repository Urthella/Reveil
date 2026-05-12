import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import PrimaryButton from '../components/PrimaryButton';
import { digestService, WeeklyDigest, HabitCategory } from '../services/api';
import { getLocale, t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

const ICON: Record<HabitCategory, string> = {
    health: '💪',
    productivity: '🎯',
    mindfulness: '🧘',
    social: '🫂',
    recovery: '🌱',
    general: '⭐',
};

export default function DigestScreen({ navigation }: any) {
    const [digest, setDigest] = useState<WeeklyDigest | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const data = await digestService.weekly(getLocale());
            setDigest(data);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Failed.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load();
        }, [load]),
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    const tr = getLocale() === 'tr';

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <FlatList
                data={digest?.perHabit ?? []}
                keyExtractor={(h) => h.habitId}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            load();
                        }}
                        tintColor={colors.primary}
                    />
                }
                ListHeaderComponent={
                    <View style={{ gap: spacing.m }}>
                        {error ? <Text style={styles.error}>{error}</Text> : null}
                        <Card>
                            <Text style={typography.caption}>
                                {tr ? 'Hafta sonu' : 'Week ending'} · {digest?.weekEndDate}
                            </Text>
                            <Text style={[typography.h2, { marginVertical: spacing.s }]}>
                                {digest?.overall.consistencyScore ?? 0}%
                            </Text>
                            <ProgressBar value={digest?.overall.consistencyScore ?? 0} />
                            <Text style={[typography.body, { marginTop: spacing.m, color: colors.text }]}>
                                {digest?.summary}
                            </Text>
                        </Card>

                        <View style={styles.row}>
                            <Card style={{ flex: 1 }}>
                                <Text style={typography.caption}>{tr ? 'Tamamlanan gün' : 'Completed'}</Text>
                                <Text style={typography.h3}>
                                    {digest?.overall.completedDays ?? 0}/{digest?.overall.totalDays ?? 7}
                                </Text>
                            </Card>
                            <Card style={{ flex: 1 }}>
                                <Text style={typography.caption}>{tr ? 'Seri' : 'Streak'}</Text>
                                <Text style={typography.h3}>{digest?.overall.currentStreak ?? 0}d</Text>
                            </Card>
                        </View>

                        {digest?.topHabit ? (
                            <Card>
                                <Text style={typography.caption}>{tr ? 'En güçlü' : 'Strongest'}</Text>
                                <Text style={typography.bodyStrong}>
                                    🏆 {digest.topHabit.title} · {digest.topHabit.consistencyScore}%
                                </Text>
                            </Card>
                        ) : null}

                        {digest?.needsAttention ? (
                            <Card>
                                <Text style={[typography.caption, { color: colors.warning }]}>
                                    {tr ? 'Dikkat' : 'Needs attention'}
                                </Text>
                                <Text style={typography.bodyStrong}>
                                    ⚠️ {digest.needsAttention.title} · {digest.needsAttention.consistencyScore}%
                                </Text>
                            </Card>
                        ) : null}

                        <Text style={[typography.h3, { marginTop: spacing.s }]}>
                            {tr ? 'Habit bazında' : 'Per habit'}
                        </Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.habitHeader}>
                            <Text style={typography.bodyStrong}>
                                {ICON[item.category] ?? '⭐'} {item.title}
                            </Text>
                            <Text style={typography.caption}>{item.completedDays}/7d · {item.currentStreak}d</Text>
                        </View>
                        <View style={{ marginTop: spacing.s }}>
                            <ProgressBar value={item.consistencyScore} />
                        </View>
                        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                            {item.consistencyScore}%
                        </Text>
                    </Card>
                )}
                ListEmptyComponent={
                    <Text style={typography.body}>
                        {tr ? 'Bu hafta için habit yok.' : 'No habits this week.'}
                    </Text>
                }
                ListFooterComponent={
                    <PrimaryButton
                        title={tr ? 'AI geri bildirimi al' : 'Get AI feedback'}
                        variant="ghost"
                        onPress={() => navigation.navigate('Feedback', {})}
                        style={{ marginTop: spacing.l }}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
    row: { flexDirection: 'row', gap: spacing.m },
    habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    error: { ...typography.caption, color: colors.error },
});
