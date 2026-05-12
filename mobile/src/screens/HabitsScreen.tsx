import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { habitsService, Habit } from '../services/api';
import { colors, radius, spacing, typography } from '../theme';

export default function HabitsScreen({ navigation }: any) {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [reordering, setReordering] = useState(false);
    const [reorderMode, setReorderMode] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce keystrokes so we don't hammer the API while the user types.
    useEffect(() => {
        const handle = setTimeout(() => setDebouncedQuery(query), 250);
        return () => clearTimeout(handle);
    }, [query]);

    const load = useCallback(async (q?: string) => {
        try {
            const data = await habitsService.list({ includePaused: true, q });
            setHabits(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load(debouncedQuery);
        }, [load, debouncedQuery]),
    );

    useEffect(() => {
        load(debouncedQuery);
    }, [debouncedQuery, load]);

    const move = async (id: string, direction: 'up' | 'down') => {
        if (reordering) return;
        const idx = habits.findIndex((h) => h.id === id);
        if (idx < 0) return;
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= habits.length) return;

        const next = [...habits];
        [next[idx], next[swap]] = [next[swap], next[idx]];
        setHabits(next); // optimistic

        setReordering(true);
        try {
            await habitsService.reorder(next.map((h, i) => ({ id: h.id, sortIndex: i })));
        } catch {
            // Roll back on failure.
            setHabits(habits);
        } finally {
            setReordering(false);
        }
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
                data={habits}
                keyExtractor={(h) => h.id}
                contentContainerStyle={{ padding: spacing.l, gap: spacing.s }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                ListHeaderComponent={
                    <View style={{ gap: spacing.s }}>
                        <TextInput
                            style={styles.search}
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search habits…"
                            placeholderTextColor={colors.textMuted}
                            autoCorrect={false}
                            autoCapitalize="none"
                            accessibilityLabel="Search habits"
                            editable={!reorderMode}
                        />
                        <View style={{ flexDirection: 'row', gap: spacing.s }}>
                            <PrimaryButton
                                title="Add habit"
                                onPress={() => navigation.navigate('CreateHabit')}
                                style={{ flex: 1 }}
                            />
                            <PrimaryButton
                                title={reorderMode ? 'Done' : '↕ Reorder'}
                                variant={reorderMode ? 'primary' : 'ghost'}
                                onPress={() => setReorderMode((v) => !v)}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const paused = item.active === false;
                    const isFirst = index === 0;
                    const isLast = index === habits.length - 1;
                    return (
                        <Card style={paused ? { opacity: 0.6 } : undefined}>
                            <View style={styles.headerRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={typography.bodyStrong}>
                                        {paused ? '⏸️ ' : ''}{item.title}
                                    </Text>
                                    <Text style={typography.caption}>
                                        {item.frequency}
                                        {item.timeOfDay ? ` · ${item.timeOfDay}` : ''}
                                    </Text>
                                </View>
                                <View style={styles.arrows}>
                                    <ArrowButton
                                        label="↑"
                                        disabled={isFirst || reordering}
                                        onPress={() => move(item.id, 'up')}
                                        accessibilityLabel="Move up"
                                    />
                                    <ArrowButton
                                        label="↓"
                                        disabled={isLast || reordering}
                                        onPress={() => move(item.id, 'down')}
                                        accessibilityLabel="Move down"
                                    />
                                </View>
                            </View>
                            {item.description && !reorderMode ? (
                                <Text style={[typography.body, { marginTop: spacing.s }]}>{item.description}</Text>
                            ) : null}
                            {!reorderMode ? (
                                <View style={{ marginTop: spacing.m }}>
                                    <PrimaryButton
                                        title="Open"
                                        variant="ghost"
                                        onPress={() =>
                                            navigation.navigate('HabitDetail', { habitId: item.id, title: item.title })
                                        }
                                    />
                                </View>
                            ) : null}
                        </Card>
                    );
                }}
                ListEmptyComponent={<Text style={typography.body}>No habits yet — tap “Add habit”.</Text>}
            />
        </SafeAreaView>
    );
}

function ArrowButton({
    label,
    disabled,
    onPress,
    accessibilityLabel,
}: {
    label: string;
    disabled: boolean;
    onPress: () => void;
    accessibilityLabel: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled }}
            style={[styles.arrow, disabled ? styles.arrowDisabled : null]}
        >
            <Text style={[typography.bodyStrong, disabled ? { color: colors.textMuted } : null]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    arrows: { flexDirection: 'row', gap: spacing.xs, marginLeft: spacing.s },
    arrow: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.m,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    arrowDisabled: { opacity: 0.5 },
    search: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
});
