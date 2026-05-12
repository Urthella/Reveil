import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import MoodPicker from '../components/MoodPicker';
import MoodInsight from '../components/MoodInsight';
import Heatmap from '../components/Heatmap';
import WeekdayInsight from '../components/WeekdayInsight';
import { hapticSuccess, hapticTap, hapticWarning } from '../services/haptics';
import { feedbackService, habitsService, trackingService, Habit, HabitLog } from '../services/api';
import { buildStreakShareText, shareText } from '../services/share';
import { getLocale, t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

import { localDaysAgoIso, localIsoDate, todayIso } from '../services/dates';
const isoToday = () => todayIso();

export default function HabitDetailScreen({ route, navigation }: any) {
    const { habitId } = route.params;
    const [habit, setHabit] = useState<Habit | null>(null);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [logging, setLogging] = useState(false);
    const [mood, setMood] = useState<number | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>(todayIso());

    const load = useCallback(async () => {
        try {
            const [h, data] = await Promise.all([
                habitsService.get(habitId).catch(() => null),
                trackingService.history(habitId),
            ]);
            setHabit(h);
            setLogs(data);
            const today = data.find((l) => l.date === isoToday());
            if (today) {
                setMood(today.moodScore);
                setNotes(today.notes ?? '');
            }
        } finally {
            setLoading(false);
        }
    }, [habitId]);

    const computeStreak = (): number => {
        const dayMs = 86400000;
        const completed = new Set(logs.filter((l) => l.completed && !l.frozen).map((l) => l.date));
        const frozen = new Set(logs.filter((l) => l.frozen).map((l) => l.date));
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = localDaysAgoIso(i);
            if (completed.has(d)) streak++;
            else if (frozen.has(d)) continue;
            else if (i === 0) continue;
            else break;
        }
        return streak;
    };

    const onShare = async () => {
        if (!habit) return;
        const streak = computeStreak();
        const message = buildStreakShareText(habit.title, streak, getLocale() as 'en' | 'tr');
        await shareText(message, getLocale() === 'tr' ? 'Reveil serim' : 'My Reveil streak');
    };

    const onShareCard = async () => {
        if (!habit) return;
        try {
            const svg = await feedbackService.shareCardSvg(habit.id, getLocale() as 'en' | 'tr');
            // Lazy-import the Expo modules so this still works in test environments.
            let Sharing: any = null;
            let FileSystem: any = null;
            try {
                Sharing = require('expo-sharing');
                try { FileSystem = require('expo-file-system/legacy'); }
                catch { FileSystem = require('expo-file-system'); }
            } catch { /* not available */ }
            if (FileSystem && Sharing && (await Sharing.isAvailableAsync())) {
                const path = `${FileSystem.cacheDirectory}reveil-card-${habit.id}.svg`;
                await FileSystem.writeAsStringAsync(path, svg, {
                    encoding: FileSystem.EncodingType?.UTF8 ?? 'utf8',
                });
                await Sharing.shareAsync(path, {
                    mimeType: 'image/svg+xml',
                    dialogTitle: getLocale() === 'tr' ? 'Reveil kartını paylaş' : 'Share Reveil card',
                });
                return;
            }
            // Fallback to plain text share if file APIs are missing.
            const message = buildStreakShareText(habit.title, computeStreak(), getLocale() as 'en' | 'tr');
            await shareText(message, getLocale() === 'tr' ? 'Reveil kartım' : 'My Reveil card');
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? err?.message ?? 'Failed.');
        }
    };

    const togglePause = async () => {
        if (!habit) return;
        try {
            const updated = await habitsService.update(habit.id, {
                active: !(habit.active ?? true),
                pausedUntil: null,
            });
            setHabit(updated);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed.');
        }
    };

    const pauseForDays = async (days: number) => {
        if (!habit) return;
        const until = localIsoDate(new Date(Date.now() + days * 86400000));
        try {
            const updated = await habitsService.update(habit.id, { pausedUntil: until, active: false });
            setHabit(updated);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed.');
        }
    };

    const resume = async () => {
        if (!habit) return;
        try {
            const updated = await habitsService.update(habit.id, { pausedUntil: null, active: true });
            setHabit(updated);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed.');
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load();
        }, [load]),
    );

    const targetLog = logs.find((l) => l.date === selectedDate);

    // Whenever the user picks a different date, hydrate inputs from that date's log.
    React.useEffect(() => {
        const log = logs.find((l) => l.date === selectedDate);
        setMood(log?.moodScore);
        setNotes(log?.notes ?? '');
    }, [selectedDate, logs]);

    const markToday = async (completed: boolean) => {
        setLogging(true);
        try {
            await trackingService.log({
                habitId,
                date: selectedDate,
                completed,
                frozen: false,
                moodScore: mood,
                notes: notes.trim() || undefined,
            });
            if (completed) hapticSuccess();
            else hapticTap();
            await load();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to log.');
        } finally {
            setLogging(false);
        }
    };

    const freezeToday = async () => {
        setLogging(true);
        try {
            await trackingService.log({
                habitId,
                date: selectedDate,
                completed: false,
                frozen: true,
                notes: notes.trim() || undefined,
            });
            hapticWarning();
            await load();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to freeze.');
        } finally {
            setLogging(false);
        }
    };

    const deleteHabit = async () => {
        Alert.alert('Delete habit', 'This removes the habit and its history.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await habitsService.remove(habitId);
                        navigation.goBack();
                    } catch (err: any) {
                        Alert.alert('Error', err?.response?.data?.message ?? 'Failed to delete.');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <FlatList
                data={logs}
                keyExtractor={(l) => l.id}
                contentContainerStyle={styles.content}
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                ListHeaderComponent={
                    <View style={{ gap: spacing.m }}>
                        {habit && habit.active === false ? (
                            <Card>
                                <Text style={[typography.bodyStrong, { color: colors.warning }]}>
                                    {getLocale() === 'tr' ? '⏸️ Bu alışkanlık duraklatıldı' : '⏸️ This habit is paused'}
                                </Text>
                                {habit.pausedUntil ? (
                                    <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                                        {getLocale() === 'tr'
                                            ? `Otomatik devam: ${habit.pausedUntil}`
                                            : `Auto-resumes on ${habit.pausedUntil}`}
                                    </Text>
                                ) : (
                                    <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                                        {getLocale() === 'tr'
                                            ? 'Hatırlatmalar gönderilmiyor ve dashboard\'da gizli. Geçmiş korunuyor.'
                                            : 'Reminders are paused and the habit is hidden from dashboard rollups. History is preserved.'}
                                    </Text>
                                )}
                                <PrimaryButton
                                    title={getLocale() === 'tr' ? '▶️ Şimdi devam ettir' : '▶️ Resume now'}
                                    variant="ghost"
                                    onPress={resume}
                                    style={{ marginTop: spacing.s }}
                                />
                            </Card>
                        ) : null}
                        <Card>
                            <View style={styles.dateNavRow}>
                                <PrimaryButton
                                    title="‹"
                                    variant="ghost"
                                    accessibilityLabel="Previous day"
                                    onPress={() => setSelectedDate(localDaysAgoIso(1, new Date(selectedDate + 'T00:00:00')))}
                                />
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={typography.caption}>
                                        {selectedDate === isoToday()
                                            ? (getLocale() === 'tr' ? 'Bugün' : 'Today')
                                            : selectedDate}
                                    </Text>
                                </View>
                                <PrimaryButton
                                    title="›"
                                    variant="ghost"
                                    accessibilityLabel="Next day"
                                    disabled={selectedDate >= isoToday()}
                                    onPress={() => {
                                        const next = localDaysAgoIso(-1, new Date(selectedDate + 'T00:00:00'));
                                        if (next <= isoToday()) setSelectedDate(next);
                                    }}
                                />
                            </View>
                            {selectedDate !== isoToday() ? (
                                <PrimaryButton
                                    title={getLocale() === 'tr' ? 'Bugüne dön' : 'Jump to today'}
                                    variant="ghost"
                                    onPress={() => setSelectedDate(isoToday())}
                                />
                            ) : null}
                            <Text style={[typography.h2, { marginVertical: spacing.s }]}>
                                {targetLog?.frozen
                                    ? '❄️ ' + (getLocale() === 'tr' ? 'Donduruldu' : 'Frozen')
                                    : targetLog?.completed
                                        ? t('habit.doneToday')
                                        : t('habit.notLogged')}
                            </Text>

                            <MoodPicker value={mood} onChange={setMood} />

                            <Text style={[typography.caption, { marginTop: spacing.m }]}>{t('habit.notes')}</Text>
                            <TextInput
                                style={styles.input}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                placeholder={t('habit.notesHint')}
                                placeholderTextColor={colors.textMuted}
                            />

                            <View style={styles.row}>
                                <PrimaryButton
                                    title={t('habit.markDone')}
                                    onPress={() => markToday(true)}
                                    loading={logging}
                                    style={{ flex: 1 }}
                                />
                                <PrimaryButton
                                    title={t('habit.skip')}
                                    variant="ghost"
                                    onPress={() => markToday(false)}
                                    loading={logging}
                                    style={{ flex: 1 }}
                                />
                            </View>
                            <PrimaryButton
                                title={getLocale() === 'tr' ? '❄️ Bugünü dondur' : '❄️ Freeze today'}
                                variant="ghost"
                                onPress={freezeToday}
                                loading={logging}
                                accessibilityHint="Skip today without breaking your streak."
                                style={{ marginTop: spacing.s }}
                            />
                        </Card>

                        <View style={styles.row}>
                            <PrimaryButton
                                title={t('habit.getFeedback')}
                                variant="ghost"
                                onPress={() => navigation.navigate('Feedback', { habitId })}
                                style={{ flex: 1 }}
                            />
                            <PrimaryButton
                                title="Edit"
                                variant="ghost"
                                onPress={() => navigation.navigate('CreateHabit', { habitId })}
                                style={{ flex: 1 }}
                            />
                        </View>
                        <View style={[styles.row, { gap: spacing.s }]}>
                            <PrimaryButton
                                title={getLocale() === 'tr' ? '🔥 Seriyi paylaş' : '🔥 Share streak'}
                                variant="ghost"
                                onPress={onShare}
                                accessibilityHint="Share your current streak via the OS share sheet."
                                style={{ flex: 1 }}
                            />
                            <PrimaryButton
                                title={getLocale() === 'tr' ? '🖼️ Kart' : '🖼️ Card'}
                                variant="ghost"
                                onPress={onShareCard}
                                accessibilityHint="Download a shareable progress card image."
                                style={{ flex: 1 }}
                            />
                        </View>

                        {logs.length > 0 ? (
                            <Card>
                                <Heatmap logs={logs} />
                            </Card>
                        ) : null}

                        {logs.length >= 3 ? (
                            <Card>
                                <MoodInsight logs={logs} />
                            </Card>
                        ) : null}

                        {logs.length >= 7 ? (
                            <Card>
                                <WeekdayInsight logs={logs} />
                            </Card>
                        ) : null}

                        <Text style={[typography.h3, { marginTop: spacing.s }]}>{t('habit.history')}</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Card style={styles.logRow}>
                        <Pressable
                            style={{ flex: 1 }}
                            accessibilityRole="button"
                            accessibilityHint="Edit this day's log"
                            onPress={() => setSelectedDate(item.date)}
                        >
                            <Text style={typography.bodyStrong}>{item.date}</Text>
                            {item.notes ? (
                                <Text style={[typography.caption, { marginTop: spacing.xs }]}>{item.notes}</Text>
                            ) : null}
                        </Pressable>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[typography.caption, item.frozen ? styles.frozen : item.completed ? styles.ok : styles.miss]}>
                                {item.frozen ? '❄️ ' + (getLocale() === 'tr' ? 'Donduruldu' : 'Frozen') : item.completed ? t('habit.completed') : t('habit.skipped')}
                            </Text>
                            {item.moodScore ? <Text style={typography.caption}>mood {item.moodScore}/10</Text> : null}
                            <Pressable
                                onPress={() => {
                                    Alert.alert(
                                        getLocale() === 'tr' ? 'Bu kaydı sil?' : 'Delete this log?',
                                        item.date,
                                        [
                                            { text: getLocale() === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                                            {
                                                text: getLocale() === 'tr' ? 'Sil' : 'Delete',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    await trackingService.removeLog(item.id);
                                                    await load();
                                                },
                                            },
                                        ],
                                    );
                                }}
                                accessibilityRole="button"
                                accessibilityLabel="Delete log"
                                style={{ paddingTop: spacing.xs }}
                            >
                                <Text style={[typography.caption, { color: colors.error }]}>🗑</Text>
                            </Pressable>
                        </View>
                    </Card>
                )}
                ListEmptyComponent={<Text style={typography.body}>No history yet.</Text>}
                ListFooterComponent={
                    <View style={{ marginTop: spacing.l, gap: spacing.s }}>
                        {habit?.active !== false ? (
                            <View style={[styles.row, { gap: spacing.s }]}>
                                <PrimaryButton
                                    title={getLocale() === 'tr' ? '3 gün' : '3 days'}
                                    variant="ghost"
                                    onPress={() => pauseForDays(3)}
                                    style={{ flex: 1 }}
                                />
                                <PrimaryButton
                                    title={getLocale() === 'tr' ? '7 gün' : '7 days'}
                                    variant="ghost"
                                    onPress={() => pauseForDays(7)}
                                    style={{ flex: 1 }}
                                />
                                <PrimaryButton
                                    title={getLocale() === 'tr' ? '14 gün' : '14 days'}
                                    variant="ghost"
                                    onPress={() => pauseForDays(14)}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        ) : null}
                        <PrimaryButton
                            title={
                                habit?.active === false
                                    ? (getLocale() === 'tr' ? '▶️ Devam ettir' : '▶️ Resume habit')
                                    : (getLocale() === 'tr' ? '⏸️ Süresiz duraklat' : '⏸️ Pause indefinitely')
                            }
                            variant="ghost"
                            onPress={togglePause}
                        />
                        <PrimaryButton title={t('habit.delete')} variant="ghost" onPress={deleteHabit} />
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
    row: { flexDirection: 'row', gap: spacing.m, marginTop: spacing.m },
    input: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        marginVertical: spacing.s,
        minHeight: 64,
        textAlignVertical: 'top',
    },
    logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ok: { color: colors.success },
    miss: { color: colors.warning },
    frozen: { color: colors.secondary },
    dateNavRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
});
