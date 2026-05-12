import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import { prefs } from '../services/preferences';
import { authService, habitsService, HabitCategory } from '../services/api';
import { colors, radius, spacing, typography } from '../theme';
import { getLocale, t } from '../services/i18n';

const { width } = Dimensions.get('window');

interface Slide {
    title: string;
    body: string;
    accent: string;
    pickFirst?: true;
}

interface StarterChoice {
    icon: string;
    en: string;
    tr: string;
    frequency: 'daily' | 'weekly';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
    category: HabitCategory;
}

const STARTER_CHOICES: StarterChoice[] = [
    { icon: '📖', en: 'Read 10 pages', tr: '10 sayfa oku', frequency: 'daily', timeOfDay: 'evening', category: 'productivity' },
    { icon: '🏃', en: 'Move 20 minutes', tr: '20 dk hareket', frequency: 'daily', timeOfDay: 'morning', category: 'health' },
    { icon: '🧘', en: '5 min breathing', tr: '5 dk nefes', frequency: 'daily', timeOfDay: 'morning', category: 'mindfulness' },
    { icon: '💧', en: 'Hydrate', tr: 'Su iç', frequency: 'daily', timeOfDay: 'anytime', category: 'health' },
    { icon: '🚭', en: 'No social media', tr: 'Sosyal medyasız gün', frequency: 'daily', timeOfDay: 'anytime', category: 'recovery' },
];

const slides = (): Slide[] => [
    { title: t('onboarding.slide1.title'), body: t('onboarding.slide1.body'), accent: '🌱' },
    { title: t('onboarding.slide2.title'), body: t('onboarding.slide2.body'), accent: '🤖' },
    { title: t('onboarding.slide3.title'), body: t('onboarding.slide3.body'), accent: '🔔' },
    {
        title: getLocale() === 'tr' ? 'İlk alışkanlığını seç.' : 'Pick your first habit.',
        body: getLocale() === 'tr'
            ? 'Hemen başlamak için bir tane seç — istediğin zaman silebilir veya değiştirebilirsin.'
            : "Tap one to start right now — you can edit or remove it any time.",
        accent: '🎯',
        pickFirst: true,
    },
];

export default function OnboardingScreen({ navigation }: any) {
    const data = slides();
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<StarterChoice | null>(null);
    const [creating, setCreating] = useState(false);
    const ref = useRef<FlatList<Slide>>(null);
    const tr = getLocale() === 'tr';

    const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        setIndex(i);
    };

    const finish = async () => {
        if (selected) {
            setCreating(true);
            try {
                try { await authService.syncUser(); } catch { /* offline ok */ }
                await habitsService.create({
                    title: tr ? selected.tr : selected.en,
                    frequency: selected.frequency,
                    timeOfDay: selected.timeOfDay,
                    category: selected.category,
                });
            } catch (err: any) {
                Alert.alert(t('common.error'), err?.message ?? 'Failed to create.');
            } finally {
                setCreating(false);
            }
        }
        await prefs.setOnboarded(true);
        navigation.replace('Login');
    };

    const next = async () => {
        if (index < data.length - 1) {
            ref.current?.scrollToIndex({ index: index + 1 });
        } else {
            await finish();
        }
    };

    const skip = async () => {
        await prefs.setOnboarded(true);
        navigation.replace('Login');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <FlatList
                ref={ref}
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={onMomentumEnd}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width }]}>
                        <Text style={styles.accent}>{item.accent}</Text>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.body}>{item.body}</Text>
                        {item.pickFirst ? (
                            <View style={styles.choices}>
                                {STARTER_CHOICES.map((c) => {
                                    const sel = selected?.en === c.en;
                                    return (
                                        <Pressable
                                            key={c.en}
                                            onPress={() => setSelected(sel ? null : c)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected: sel }}
                                            accessibilityLabel={tr ? c.tr : c.en}
                                            style={[styles.chip, sel ? styles.chipSelected : null]}
                                        >
                                            <Text style={styles.chipIcon}>{c.icon}</Text>
                                            <Text style={[typography.bodyStrong, sel ? null : { color: colors.textSecondary }]}>
                                                {tr ? c.tr : c.en}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ) : null}
                    </View>
                )}
            />
            <View style={styles.dots}>
                {data.map((_, i) => (
                    <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
                ))}
            </View>
            <View style={styles.actions}>
                <PrimaryButton title={t('onboarding.skip')} variant="ghost" onPress={skip} />
                <PrimaryButton
                    title={
                        index === data.length - 1
                            ? selected
                                ? (tr ? 'Bunu kullan' : 'Use this')
                                : t('onboarding.start')
                            : t('onboarding.next')
                    }
                    onPress={next}
                    loading={creating}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.m },
    accent: { fontSize: 72 },
    title: { ...typography.h1, textAlign: 'center' },
    body: { ...typography.body, textAlign: 'center' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.s, marginVertical: spacing.l },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 24 },
    actions: { flexDirection: 'row', padding: spacing.l, gap: spacing.m },
    choices: { width: '100%', gap: spacing.s, marginTop: spacing.m },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        padding: spacing.m,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.m,
    },
    chipSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
    chipIcon: { fontSize: 24 },
});
