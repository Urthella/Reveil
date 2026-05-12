import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { feedbackService, FeedbackLog } from '../services/api';
import { getLocale, t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

type Tone = 'gentle' | 'firm' | 'playful' | 'coach';
const TONES: Tone[] = ['coach', 'gentle', 'firm', 'playful'];
const TONE_LABEL_EN: Record<Tone, string> = {
    coach: 'Coach',
    gentle: 'Gentle',
    firm: 'Firm',
    playful: 'Playful',
};
const TONE_LABEL_TR: Record<Tone, string> = {
    coach: 'Koç',
    gentle: 'Yumuşak',
    firm: 'Net',
    playful: 'Eğlenceli',
};

export default function FeedbackScreen({ route }: any) {
    const habitId: string | undefined = route?.params?.habitId;
    const [history, setHistory] = useState<FeedbackLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [tone, setTone] = useState<Tone>('coach');

    const refresh = async () => {
        try {
            const data = await feedbackService.history();
            setHistory(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const generate = async () => {
        setGenerating(true);
        try {
            const newItem = await feedbackService.generate(habitId, getLocale(), tone);
            setHistory((prev) => [newItem, ...prev]);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to generate feedback.');
        } finally {
            setGenerating(false);
        }
    };

    const rate = async (id: string, current: -1 | 0 | 1, value: -1 | 1) => {
        // Toggle off if tapping the same rating again.
        const next: -1 | 0 | 1 = current === value ? 0 : value;
        // Optimistic update
        setHistory((prev) => prev.map((f) => (f.id === id ? { ...f, rating: next } : f)));
        try {
            await feedbackService.rate(id, next);
        } catch {
            setHistory((prev) => prev.map((f) => (f.id === id ? { ...f, rating: current } : f)));
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
                data={history}
                keyExtractor={(f) => f.id}
                contentContainerStyle={styles.content}
                ItemSeparatorComponent={() => <View style={{ height: spacing.s }} />}
                ListHeaderComponent={
                    <View style={{ gap: spacing.m }}>
                        <Card>
                            <Text style={typography.caption}>{t('feedback.tapHint')}</Text>
                            <Text style={[typography.caption, { marginTop: spacing.s }]}>
                                {getLocale() === 'tr' ? 'Ton' : 'Tone'}
                            </Text>
                            <View style={styles.toneRow}>
                                {TONES.map((tn) => {
                                    const labels = getLocale() === 'tr' ? TONE_LABEL_TR : TONE_LABEL_EN;
                                    const selected = tone === tn;
                                    return (
                                        <Pressable
                                            key={tn}
                                            onPress={() => setTone(tn)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected }}
                                            accessibilityLabel={labels[tn]}
                                            style={[styles.toneChip, selected ? styles.toneChipSelected : null]}
                                        >
                                            <Text style={[typography.caption, selected ? { color: colors.text } : null]}>
                                                {labels[tn]}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <View style={{ marginTop: spacing.m }}>
                                <PrimaryButton
                                    title={habitId ? t('feedback.generateThis') : t('feedback.generateAll')}
                                    onPress={generate}
                                    loading={generating}
                                />
                            </View>
                        </Card>
                        <Text style={typography.h3}>{t('feedback.past')}</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const rating: -1 | 0 | 1 = (item.rating ?? 0) as -1 | 0 | 1;
                    return (
                        <Card>
                            <Text style={typography.body}>{item.feedbackText}</Text>
                            <Text style={[typography.caption, { marginTop: spacing.s }]}>
                                {new Date(item.generatedAt).toLocaleString()} · {item.source} · {item.consistencyScore}% / streak {item.streak}d
                            </Text>
                            <View style={styles.ratingRow}>
                                <RatingButton
                                    label="👍"
                                    active={rating === 1}
                                    onPress={() => rate(item.id, rating, 1)}
                                    accessibilityLabel="Rate this feedback helpful"
                                />
                                <RatingButton
                                    label="👎"
                                    active={rating === -1}
                                    onPress={() => rate(item.id, rating, -1)}
                                    accessibilityLabel="Rate this feedback unhelpful"
                                />
                            </View>
                        </Card>
                    );
                }}
                ListEmptyComponent={<Text style={typography.body}>{t('feedback.empty')}</Text>}
            />
        </SafeAreaView>
    );
}

function RatingButton({
    label,
    active,
    onPress,
    accessibilityLabel,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
    accessibilityLabel: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={accessibilityLabel}
            style={[styles.rateBtn, active ? styles.rateBtnActive : null]}
        >
            <Text style={styles.rateText}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
    ratingRow: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.m },
    rateBtn: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
    },
    rateBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    rateText: { fontSize: 18 },
    toneRow: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap', marginTop: spacing.xs },
    toneChip: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    toneChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
