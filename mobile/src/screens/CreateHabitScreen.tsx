import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { habitsService } from '../services/api';
import { getLocale, t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

const FREQUENCIES = ['daily', 'weekly'] as const;
const TIMES = ['morning', 'afternoon', 'evening', 'anytime'] as const;
const CATEGORIES = ['health', 'productivity', 'mindfulness', 'social', 'recovery', 'general'] as const;
const CATEGORY_ICON: Record<(typeof CATEGORIES)[number], string> = {
    health: '💪',
    productivity: '🎯',
    mindfulness: '🧘',
    social: '🫂',
    recovery: '🌱',
    general: '⭐',
};

interface Template {
    icon: string;
    title: string;
    description: string;
    frequency: (typeof FREQUENCIES)[number];
    timeOfDay: (typeof TIMES)[number];
    category: (typeof CATEGORIES)[number];
}

const TEMPLATES: Template[] = [
    {
        icon: '📖',
        title: 'Daily reading',
        description: 'Read at least 10 pages of any book.',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'productivity',
    },
    {
        icon: '🏃',
        title: 'Morning movement',
        description: '20 minutes of light cardio after waking up.',
        frequency: 'daily',
        timeOfDay: 'morning',
        category: 'health',
    },
    {
        icon: '🧘',
        title: '10 min meditation',
        description: 'Sit, breathe, observe — no goals.',
        frequency: 'daily',
        timeOfDay: 'morning',
        category: 'mindfulness',
    },
    {
        icon: '💧',
        title: 'Hydrate',
        description: 'Drink a glass of water with each meal.',
        frequency: 'daily',
        timeOfDay: 'anytime',
        category: 'health',
    },
    {
        icon: '🚭',
        title: 'No social media',
        description: 'Stay off social platforms for the full day.',
        frequency: 'daily',
        timeOfDay: 'anytime',
        category: 'recovery',
    },
    {
        icon: '🌙',
        title: 'Sleep before 23:00',
        description: 'Lights out by 11 PM.',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'health',
    },
    {
        icon: '🥗',
        title: 'No processed sugar',
        description: 'Avoid added sugar today.',
        frequency: 'daily',
        timeOfDay: 'anytime',
        category: 'health',
    },
    {
        icon: '🗣️',
        title: 'Weekly call to family',
        description: 'Call someone you love.',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'social',
    },
];

export default function CreateHabitScreen({ navigation, route }: any) {
    const editId: string | undefined = route?.params?.habitId;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>('daily');
    const [timeOfDay, setTimeOfDay] = useState<(typeof TIMES)[number]>('anytime');
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('general');
    const [weeklyTarget, setWeeklyTarget] = useState<number>(7);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!editId) return;
        habitsService
            .get(editId)
            .then((h) => {
                setTitle(h.title);
                setDescription(h.description ?? '');
                setFrequency((h.frequency as 'daily' | 'weekly') ?? 'daily');
                setTimeOfDay((h.timeOfDay as (typeof TIMES)[number]) ?? 'anytime');
                setCategory((h.category as (typeof CATEGORIES)[number]) ?? 'general');
                setWeeklyTarget(typeof h.weeklyTarget === 'number' ? h.weeklyTarget : 7);
            })
            .catch(() => undefined);
    }, [editId]);

    const applyTemplate = (template: Template) => {
        setTitle(template.title);
        setDescription(template.description);
        setFrequency(template.frequency);
        setTimeOfDay(template.timeOfDay);
        setCategory(template.category);
    };

    const submit = async () => {
        if (!title.trim()) {
            Alert.alert('Title required', 'Give the habit a name.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || undefined,
                frequency,
                timeOfDay,
                category,
                weeklyTarget,
            };
            if (editId) {
                await habitsService.update(editId, payload);
            } else {
                await habitsService.create(payload);
            }
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save habit.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {!editId ? (
                    <>
                        <Text style={typography.h3}>{t('create.quickStart')}</Text>
                        <Text style={typography.caption}>{t('create.quickStartHint')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
                            {TEMPLATES.map((tpl) => (
                                <Pressable
                                    key={tpl.title}
                                    style={styles.templateCard}
                                    onPress={() => applyTemplate(tpl)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${tpl.title} template`}
                                    accessibilityHint={`Fills the form with ${tpl.title}`}
                                >
                                    <Text style={styles.templateIcon}>{tpl.icon}</Text>
                                    <Text style={styles.templateTitle}>{tpl.title}</Text>
                                    <Text style={typography.caption} numberOfLines={2}>
                                        {tpl.description}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </>
                ) : null}

                <Text style={[typography.caption, { marginTop: spacing.l }]}>{t('create.title')}</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Read 10 pages"
                    placeholderTextColor={colors.textMuted}
                />

                <Text style={typography.caption}>{t('create.description')}</Text>
                <TextInput
                    style={[styles.input, { height: 96, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Why does this matter to you?"
                    placeholderTextColor={colors.textMuted}
                    multiline
                />

                <Text style={typography.caption}>{getLocale() === 'tr' ? 'Kategori' : 'Category'}</Text>
                <View style={styles.chipRow}>
                    {CATEGORIES.map((c) => (
                        <Chip
                            key={c}
                            label={`${CATEGORY_ICON[c]} ${c}`}
                            selected={category === c}
                            onPress={() => setCategory(c)}
                        />
                    ))}
                </View>

                <Text style={typography.caption}>{t('create.frequency')}</Text>
                <View style={styles.chipRow}>
                    {FREQUENCIES.map((f) => (
                        <Chip key={f} label={f} selected={frequency === f} onPress={() => setFrequency(f)} />
                    ))}
                </View>

                <Text style={typography.caption}>{t('create.timeOfDay')}</Text>
                <View style={styles.chipRow}>
                    {TIMES.map((tm) => (
                        <Chip key={tm} label={tm} selected={timeOfDay === tm} onPress={() => setTimeOfDay(tm)} />
                    ))}
                </View>

                <Text style={typography.caption}>
                    {getLocale() === 'tr' ? 'Haftalık hedef (gün)' : 'Weekly target (days)'}
                </Text>
                <View style={styles.chipRow}>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <Chip
                            key={n}
                            label={String(n)}
                            selected={weeklyTarget === n}
                            onPress={() => setWeeklyTarget(n)}
                        />
                    ))}
                </View>

                <View style={{ marginTop: spacing.l }}>
                    <PrimaryButton
                        title={editId ? (t('common.save') as string) : (t('create.create') as string)}
                        onPress={submit}
                        loading={submitting}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            style={[styles.chip, selected ? styles.chipSelected : null]}
        >
            <Text style={[typography.caption, selected ? { color: colors.text } : null]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
    input: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.s,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.s },
    chip: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    templateRow: { gap: spacing.s, paddingVertical: spacing.s, paddingRight: spacing.l },
    templateCard: {
        width: 160,
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    templateIcon: { fontSize: 28 },
    templateTitle: { ...typography.bodyStrong },
});
