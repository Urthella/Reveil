import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import PrimaryButton from '../components/PrimaryButton';
import WeeklyChart from '../components/WeeklyChart';
import BadgeStrip from '../components/BadgeStrip';
import ProgressRing from '../components/ProgressRing';
import XpBar from '../components/XpBar';
import Sparkline from '../components/Sparkline';
import BadgeUnlockToast from '../components/BadgeUnlockToast';
import LevelUpToast from '../components/LevelUpToast';
import { hapticSuccess } from '../services/haptics';
import CategoryBreakdown from '../components/CategoryBreakdown';
import WeeklyInsightCard from '../components/WeeklyInsightCard';
import { prefs } from '../services/preferences';
import { Badge } from '../services/api';
import { dashboardService, habitsService, DashboardResponse, HabitCategory } from '../services/api';
import { t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

const CATEGORY_ICON: Record<HabitCategory, string> = {
    health: '💪',
    productivity: '🎯',
    mindfulness: '🧘',
    social: '🫂',
    recovery: '🌱',
    general: '⭐',
};

export default function DashboardScreen({ navigation }: any) {
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
    const [levelUp, setLevelUp] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const res = await dashboardService.get();
            setData(res);

            // Detect newly earned badges and queue a celebration for the first one.
            const earned = (res.badges ?? []).filter((b) => b.earned);
            if (earned.length) {
                const seen = new Set(await prefs.getSeenBadges());
                const fresh = earned.find((b) => !seen.has(b.id));
                if (fresh) {
                    setUnlockedBadge(fresh);
                    await prefs.setSeenBadges([...seen, ...earned.map((b) => b.id)]);
                }
            }

            // Detect level-up since the last time we showed the dashboard.
            const newLevel = res.progress?.level ?? 1;
            const seenLevel = await prefs.getSeenLevel();
            if (newLevel > seenLevel) {
                setLevelUp(newLevel);
                hapticSuccess();
            }
            if (newLevel !== seenLevel) await prefs.setSeenLevel(newLevel);
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load dashboard.');
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

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            {levelUp != null ? (
                <LevelUpToast level={levelUp} onDismiss={() => setLevelUp(null)} />
            ) : unlockedBadge ? (
                <BadgeUnlockToast badge={unlockedBadge} onDismiss={() => setUnlockedBadge(null)} />
            ) : null}
            <FlatList
                data={data?.habits ?? []}
                keyExtractor={(h) => h.id}
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
                            <Text style={typography.caption}>{t('dashboard.consistency')}</Text>
                            <Text style={styles.bigNumber}>{data?.consistencyScore ?? 0}%</Text>
                            <ProgressBar value={data?.consistencyScore ?? 0} />
                            <View style={styles.row}>
                                <View style={styles.rowItem}>
                                    <Text style={typography.caption}>{t('dashboard.streak')}</Text>
                                    <Text style={typography.h2}>{data?.currentStreak ?? 0}d</Text>
                                </View>
                                <View style={styles.rowItem}>
                                    <Text style={typography.caption}>{t('dashboard.today')}</Text>
                                    <Text style={typography.h2}>
                                        {data?.completedToday ?? 0}/{data?.totalHabits ?? 0}
                                    </Text>
                                </View>
                            </View>
                            {data?.progress ? (
                                <View style={{ marginTop: spacing.m }}>
                                    <XpBar progress={data.progress} />
                                </View>
                            ) : null}
                        </Card>

                        {data?.weeklySummary?.length ? (
                            <Card>
                                <WeeklyChart data={data.weeklySummary} />
                            </Card>
                        ) : null}

                        {data?.badges?.length ? (
                            <Card>
                                <BadgeStrip badges={data.badges} />
                            </Card>
                        ) : null}

                        {data?.categoryBreakdown?.length ? (
                            <Card>
                                <CategoryBreakdown data={data.categoryBreakdown} />
                            </Card>
                        ) : null}

                        <WeeklyInsightCard onSeeAll={() => navigation.navigate('Feedback', {})} />

                        <View style={styles.actions}>
                            <PrimaryButton
                                title={t('dashboard.addHabit')}
                                onPress={() => navigation.navigate('CreateHabit')}
                                style={{ flex: 1 }}
                            />
                            <PrimaryButton
                                title={t('dashboard.aiFeedback')}
                                variant="ghost"
                                onPress={() => navigation.navigate('Feedback', {})}
                                style={{ flex: 1 }}
                            />
                        </View>
                        <View style={styles.actions}>
                            <PrimaryButton
                                title={t('dashboard.reminders')}
                                variant="ghost"
                                onPress={() => navigation.navigate('Reminders')}
                                style={{ flex: 2 }}
                            />
                            <PrimaryButton
                                title="📅"
                                accessibilityLabel="Weekly digest"
                                variant="ghost"
                                onPress={() => navigation.navigate('Digest')}
                                style={{ flex: 1 }}
                            />
                        </View>

                        <Text style={[typography.h3, { marginTop: spacing.s }]}>{t('dashboard.yourHabits')}</Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                renderItem={({ item }) => {
                    const target = item.weeklyTarget ?? 7;
                    const expected = Math.max(1, (30 * target) / 7);
                    const ratio = Math.min(1, (item.completedDays ?? 0) / expected);
                    return (
                    <Card>
                        <View style={[styles.habitHeader, { gap: spacing.m }]}>
                            <ProgressRing
                                progress={ratio}
                                size={44}
                                label={`${item.currentStreak}d`}
                                accessibilityLabel={`Weekly progress ${Math.round(ratio * 100)}% — ${item.currentStreak} day streak`}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={typography.bodyStrong}>
                                    {(CATEGORY_ICON as Record<string, string>)[item.category ?? 'general'] ?? '⭐'} {item.title}
                                </Text>
                                <Text style={typography.caption}>
                                    {item.frequency}
                                    {target !== 7 ? ` · ${target}×/wk` : ''}
                                </Text>
                            </View>
                        </View>
                        <Text style={typography.caption}>
                            {item.completedDays}/30 days · {item.consistencyScore}% · streak {item.currentStreak}d
                        </Text>
                        <View style={{ marginTop: spacing.s }}>
                            <ProgressBar value={item.consistencyScore} />
                        </View>
                        {item.last7?.length ? (
                            <Sparkline days={item.last7} />
                        ) : null}
                        <View style={[styles.row, { marginTop: spacing.m }]}>
                            <PrimaryButton
                                title={item.completedToday ? t('habit.doneToday') : t('common.open')}
                                variant="ghost"
                                onPress={() =>
                                    navigation.navigate('HabitDetail', {
                                        habitId: item.id,
                                        title: item.title,
                                    })
                                }
                                style={{ flex: 1 }}
                            />
                        </View>
                    </Card>
                    );
                }}
                ListEmptyComponent={<StarterPack onCreated={load} navigation={navigation} />}
            />
        </SafeAreaView>
    );
}

interface StarterTemplate {
    icon: string;
    titleKey: { en: string; tr: string };
    frequency: 'daily' | 'weekly';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
    category: HabitCategory;
}

const STARTER_TEMPLATES: StarterTemplate[] = [
    { icon: '📖', titleKey: { en: 'Read 10 pages', tr: '10 sayfa oku' }, frequency: 'daily', timeOfDay: 'evening', category: 'productivity' },
    { icon: '💧', titleKey: { en: 'Drink water', tr: 'Su iç' }, frequency: 'daily', timeOfDay: 'anytime', category: 'health' },
    { icon: '🧘', titleKey: { en: '5 min breathing', tr: '5 dk nefes' }, frequency: 'daily', timeOfDay: 'morning', category: 'mindfulness' },
];

function StarterPack({ onCreated, navigation }: { onCreated: () => void; navigation: any }) {
    const [creating, setCreating] = useState<string | null>(null);
    const tr = require('../services/i18n').getLocale() === 'tr';
    const create = async (tpl: StarterTemplate) => {
        const title = tr ? tpl.titleKey.tr : tpl.titleKey.en;
        if (creating) return;
        setCreating(title);
        try {
            await habitsService.create({
                title,
                frequency: tpl.frequency,
                timeOfDay: tpl.timeOfDay,
                category: tpl.category,
            });
            onCreated();
        } finally {
            setCreating(null);
        }
    };
    return (
        <Card>
            <Text style={typography.bodyStrong}>{t('dashboard.empty')}</Text>
            <Text style={[typography.caption, { marginVertical: spacing.s }]}>
                {tr ? 'Saniyede başla — birini seç:' : 'Start in a tap — pick one:'}
            </Text>
            <View style={{ gap: spacing.s }}>
                {STARTER_TEMPLATES.map((tpl) => {
                    const title = tr ? tpl.titleKey.tr : tpl.titleKey.en;
                    const isCreating = creating === title;
                    return (
                        <Pressable
                            key={title}
                            onPress={() => create(tpl)}
                            disabled={!!creating}
                            accessibilityRole="button"
                            accessibilityLabel={`${tr ? 'Ekle' : 'Add'}: ${title}`}
                            style={[styles.starterRow, isCreating ? { opacity: 0.5 } : null]}
                        >
                            <Text style={styles.starterIcon}>{tpl.icon}</Text>
                            <Text style={[typography.bodyStrong, { flex: 1 }]}>{title}</Text>
                            <Text style={typography.caption}>
                                {isCreating ? '…' : tr ? 'Ekle' : 'Add'}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            <PrimaryButton
                title={t('dashboard.emptyCta')}
                variant="ghost"
                onPress={() => navigation.navigate('CreateHabit')}
                style={{ marginTop: spacing.s }}
            />
        </Card>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.m },
    bigNumber: { fontSize: 40, fontWeight: '700', color: colors.text, marginVertical: spacing.s },
    row: { flexDirection: 'row', gap: spacing.m, marginTop: spacing.s },
    rowItem: {
        flex: 1,
        backgroundColor: colors.surfaceAlt,
        padding: spacing.m,
        borderRadius: radius.m,
    },
    actions: { flexDirection: 'row', gap: spacing.m },
    habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    error: { ...typography.caption, color: colors.error },
    starterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        padding: spacing.m,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    starterIcon: { fontSize: 24 },
});
