import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { habitsService, Habit } from '../services/api';
import { registerForPush, remindersService } from '../services/notifications';
import { t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

const WEEKDAYS = [
    { id: '1', label: 'Mo' },
    { id: '2', label: 'Tu' },
    { id: '3', label: 'We' },
    { id: '4', label: 'Th' },
    { id: '5', label: 'Fr' },
    { id: '6', label: 'Sa' },
    { id: '7', label: 'Su' },
];

export default function RemindersScreen({ navigation }: any) {
    const [reminders, setReminders] = useState<Awaited<ReturnType<typeof remindersService.list>>>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [time, setTime] = useState('20:00');
    const [habitId, setHabitId] = useState<string | undefined>();
    const [days, setDays] = useState<Set<string>>(new Set(WEEKDAYS.map((d) => d.id)));
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        const [r, h] = await Promise.all([remindersService.list(), habitsService.list()]);
        setReminders(r);
        setHabits(h);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load().catch(() => setLoading(false));
        }, [load]),
    );

    useEffect(() => {
        // Best-effort register the push token whenever this screen first appears.
        registerForPush().catch(() => undefined);
    }, []);

    const toggleDay = (id: string) => {
        setDays((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const submit = async () => {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
            Alert.alert('Time format', 'Use 24-hour HH:mm, e.g. 07:30 or 20:00.');
            return;
        }
        if (days.size === 0) {
            Alert.alert('Pick at least one day');
            return;
        }
        setSubmitting(true);
        try {
            await remindersService.create({
                time,
                habitId,
                weekdays: [...days].sort().join(','),
                message: message.trim() || undefined,
            });
            setMessage('');
            await load();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save reminder.');
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (id: string) => {
        await remindersService.remove(id);
        await load();
    };

    const testPush = async () => {
        const token = await registerForPush();
        if (!token) {
            Alert.alert(
                'Push not available',
                Platform.OS === 'web'
                    ? 'Push notifications need a physical iOS or Android device.'
                    : 'Permission denied or running in a simulator.',
            );
            return;
        }
        const res = await remindersService.sendTestPush();
        Alert.alert('Test sent', `Server dispatched ${res.sent} message(s).`);
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
                data={reminders}
                keyExtractor={(r) => r.id}
                contentContainerStyle={styles.content}
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                ListHeaderComponent={
                    <View style={{ gap: spacing.m }}>
                        <Card>
                            <Text style={typography.h3}>{t('reminders.newTitle')}</Text>
                            <Text style={typography.caption}>{t('reminders.timeLabel')}</Text>
                            <TextInput
                                style={styles.input}
                                value={time}
                                onChangeText={setTime}
                                placeholder="20:00"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numbers-and-punctuation"
                            />

                            <Text style={typography.caption}>{t('reminders.daysLabel')}</Text>
                            <View style={styles.row}>
                                {WEEKDAYS.map((d) => {
                                    const selected = days.has(d.id);
                                    return (
                                        <Pressable
                                            key={d.id}
                                            onPress={() => toggleDay(d.id)}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: selected }}
                                            accessibilityLabel={d.label}
                                            style={[styles.chip, selected ? styles.chipSelected : null]}
                                        >
                                            <Text style={[typography.caption, selected ? { color: colors.text } : null]}>{d.label}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            <Text style={typography.caption}>{t('reminders.habitLabel')}</Text>
                            <View style={[styles.row, { flexWrap: 'wrap' }]}>
                                <Pressable
                                    onPress={() => setHabitId(undefined)}
                                    style={[styles.chip, !habitId ? styles.chipSelected : null]}
                                >
                                    <Text style={[typography.caption, !habitId ? { color: colors.text } : null]}>{t('reminders.any')}</Text>
                                </Pressable>
                                {habits.map((h) => {
                                    const selected = habitId === h.id;
                                    return (
                                        <Pressable
                                            key={h.id}
                                            onPress={() => setHabitId(h.id)}
                                            style={[styles.chip, selected ? styles.chipSelected : null]}
                                        >
                                            <Text style={[typography.caption, selected ? { color: colors.text } : null]}>{h.title}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            <Text style={typography.caption}>{t('reminders.messageLabel')}</Text>
                            <TextInput
                                style={styles.input}
                                value={message}
                                onChangeText={setMessage}
                                placeholder="e.g. Time for your evening read."
                                placeholderTextColor={colors.textMuted}
                            />

                            <PrimaryButton title={t('reminders.save')} onPress={submit} loading={submitting} />
                        </Card>

                        <PrimaryButton title={t('reminders.test')} variant="ghost" onPress={testPush} />
                        <PrimaryButton
                            title={t('reminders.active') === 'Active reminders' ? '🔔 Notification history' : '🔔 Bildirim geçmişi'}
                            variant="ghost"
                            onPress={() => navigation.navigate('NotificationFeed')}
                        />

                        <Text style={typography.h3}>{t('reminders.active')}</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.rowBetween}>
                            <Text style={typography.bodyStrong}>
                                {item.time} · {item.weekdays.split(',').map((d) => WEEKDAYS[Number(d) - 1].label).join(' ')}
                            </Text>
                            <Pressable onPress={() => remove(item.id)}>
                                <Text style={{ color: colors.error }}>Remove</Text>
                            </Pressable>
                        </View>
                        {item.message ? <Text style={typography.body}>{item.message}</Text> : null}
                    </Card>
                )}
                ListEmptyComponent={<Text style={typography.body}>{t('reminders.empty')}</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
    input: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        marginVertical: spacing.s,
    },
    row: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap', marginBottom: spacing.s },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chip: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
