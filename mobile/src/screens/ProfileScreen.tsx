import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import Toggle from '../components/Toggle';
import XpBar from '../components/XpBar';
import { useAuth } from '../services/auth';
import { authService, dashboardService, LevelInfo } from '../services/api';
import { getLocale, setLocale, subscribeLocale, t } from '../services/i18n';
import { prefs } from '../services/preferences';
import { setDensity, useDensity } from '../services/density';
import { colors, radius, spacing, typography } from '../theme';

interface ProfileData {
    email?: string;
    displayName?: string;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    digestEnabled?: boolean;
}

export default function ProfileScreen({ navigation }: any) {
    const { user, signOutUser, mock } = useAuth();
    const [locale, setLocaleState] = useState(getLocale());
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [quietStart, setQuietStart] = useState('');
    const [quietEnd, setQuietEnd] = useState('');
    const [savingQuiet, setSavingQuiet] = useState(false);
    const [digestEnabled, setDigestEnabled] = useState(true);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

    useEffect(() => subscribeLocale(setLocaleState), []);

    useEffect(() => {
        authService.me().then((p) => {
            setProfile(p);
            setQuietStart(p?.quietHoursStart ?? '');
            setQuietEnd(p?.quietHoursEnd ?? '');
            setDigestEnabled(p?.digestEnabled !== false);
        }).catch(() => undefined);
        dashboardService.get().then((d) => setLevelInfo(d.progress)).catch(() => undefined);
    }, []);

    const toggleDigest = async (next: boolean) => {
        setDigestEnabled(next); // optimistic
        try {
            await authService.updatePreferences({ digestEnabled: next });
        } catch {
            setDigestEnabled(!next);
            Alert.alert(t('common.error'), 'Could not save preference.');
        }
    };

    const onExportCsv = async () => {
        try {
            const csv = await authService.exportCsv();
            let Sharing: any = null;
            let FileSystem: any = null;
            try {
                Sharing = require('expo-sharing');
                try { FileSystem = require('expo-file-system/legacy'); }
                catch { FileSystem = require('expo-file-system'); }
            } catch { /* sharing not available */ }

            if (FileSystem && Sharing && (await Sharing.isAvailableAsync())) {
                const path = `${FileSystem.cacheDirectory}reveil-logs-${Date.now()}.csv`;
                await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType?.UTF8 ?? 'utf8' });
                await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export your Reveil logs' });
                return;
            }
            Alert.alert('CSV ready', csv.slice(0, 240) + '…');
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.response?.data?.message ?? 'Export failed.');
        }
    };

    const saveQuietHours = async () => {
        const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
        const start = quietStart.trim();
        const end = quietEnd.trim();
        if (start && !HHMM.test(start)) {
            Alert.alert(t('common.error'), 'Start must be HH:mm (e.g. 22:00).');
            return;
        }
        if (end && !HHMM.test(end)) {
            Alert.alert(t('common.error'), 'End must be HH:mm (e.g. 07:00).');
            return;
        }
        setSavingQuiet(true);
        try {
            await authService.updatePreferences({
                quietHoursStart: start || null,
                quietHoursEnd: end || null,
            });
            Alert.alert('Saved', 'Quiet hours updated.');
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.response?.data?.message ?? 'Failed to save.');
        } finally {
            setSavingQuiet(false);
        }
    };

    const onSignOut = async () => {
        await signOutUser();
        navigation.replace('Login');
    };

    const onDelete = () => {
        Alert.alert(
            t('profile.deleteAccount'),
            'Permanently removes your habits, logs, AI feedback, reminders, and account from the server. This cannot be undone.',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.deleteMe();
                        } catch {
                            // ignore — fall through to local cleanup so the user can always escape
                        }
                        await prefs.setOnboarded(false);
                        await signOutUser();
                        navigation.replace('Onboarding');
                    },
                },
            ],
        );
    };

    const onExport = async () => {
        try {
            const data = await authService.exportData();
            const json = JSON.stringify(data, null, 2);

            // Lazy-import the Expo modules so this screen still renders in test
            // environments where the native modules are unavailable.
            let Sharing: any = null;
            let FileSystem: any = null;
            try {
                Sharing = require('expo-sharing');
                // expo-file-system v55+ keeps the cacheDirectory API under /legacy.
                try {
                    FileSystem = require('expo-file-system/legacy');
                } catch {
                    FileSystem = require('expo-file-system');
                }
            } catch {
                /* sharing not available */
            }

            if (FileSystem && Sharing && (await Sharing.isAvailableAsync())) {
                const path = `${FileSystem.cacheDirectory}reveil-export-${Date.now()}.json`;
                await FileSystem.writeAsStringAsync(path, json, {
                    encoding: FileSystem.EncodingType?.UTF8 ?? 'utf8',
                });
                await Sharing.shareAsync(path, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export your Reveil data',
                });
                return;
            }
            Alert.alert('Export ready', json.slice(0, 240) + '…');
        } catch (err: any) {
            Alert.alert(t('common.error'), err?.response?.data?.message ?? 'Export failed.');
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Card>
                    <Text style={typography.h3}>{t('profile.title')}</Text>
                    <Text style={[typography.body, { marginTop: spacing.s }]}>
                        {profile?.displayName ?? user?.email ?? '—'}
                    </Text>
                    <Text style={typography.caption}>{profile?.email ?? user?.email ?? ''}</Text>
                    {mock ? (
                        <Text style={[typography.caption, { color: colors.warning, marginTop: spacing.s }]}>
                            Mock auth mode — no Firebase project configured.
                        </Text>
                    ) : null}
                </Card>

                {levelInfo ? (
                    <Card>
                        <XpBar progress={levelInfo} />
                    </Card>
                ) : null}

                <Card>
                    <Text style={typography.h3}>{t('profile.language')}</Text>
                    <View style={[styles.row, { marginTop: spacing.s }]}>
                        <LangChip
                            code="en"
                            current={locale}
                            onPress={async () => {
                                await setLocale('en');
                                authService.updatePreferences({ locale: 'en' }).catch(() => undefined);
                            }}
                            label="English"
                        />
                        <LangChip
                            code="tr"
                            current={locale}
                            onPress={async () => {
                                await setLocale('tr');
                                authService.updatePreferences({ locale: 'tr' }).catch(() => undefined);
                            }}
                            label="Türkçe"
                        />
                    </View>
                </Card>

                <Card>
                    <Text style={typography.h3}>{getLocale() === 'tr' ? 'Sessiz saatler' : 'Quiet hours'}</Text>
                    <Text style={[typography.caption, { marginTop: spacing.s }]}>
                        {getLocale() === 'tr'
                            ? 'Bu aralıkta hatırlatma push\'ı gönderilmez. HH:mm formatında.'
                            : 'No reminder pushes will be sent during this window. HH:mm.'}
                    </Text>
                    <View style={[styles.row, { marginTop: spacing.s }]}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={quietStart}
                            onChangeText={setQuietStart}
                            placeholder="22:00"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numbers-and-punctuation"
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={quietEnd}
                            onChangeText={setQuietEnd}
                            placeholder="07:00"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>
                    <PrimaryButton
                        title={t('common.save')}
                        variant="ghost"
                        onPress={saveQuietHours}
                        loading={savingQuiet}
                    />
                </Card>

                <Card>
                    <Text style={typography.h3}>{t('profile.notifications')}</Text>
                    <PrimaryButton
                        title="Open reminders"
                        variant="ghost"
                        onPress={() => navigation.navigate('Reminders')}
                        style={{ marginTop: spacing.s }}
                    />
                    <View style={[styles.toggleRow, { marginTop: spacing.m }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={typography.bodyStrong}>
                                {getLocale() === 'tr' ? 'Haftalık özet' : 'Weekly digest'}
                            </Text>
                            <Text style={typography.caption}>
                                {getLocale() === 'tr'
                                    ? 'Pazar akşamı bir özet bildirimi al.'
                                    : 'Receive a Sunday-evening summary push.'}
                            </Text>
                        </View>
                        <Toggle
                            value={digestEnabled}
                            onChange={toggleDigest}
                            accessibilityLabel="Weekly digest"
                        />
                    </View>
                </Card>

                <Card>
                    <Text style={typography.h3}>
                        {getLocale() === 'tr' ? 'Veri dışa aktarımı' : 'Data export'}
                    </Text>
                    <Text style={[typography.caption, { marginTop: spacing.s }]}>
                        {getLocale() === 'tr'
                            ? 'Tüm verini JSON ya da CSV olarak indir.'
                            : 'Download all of your data as JSON or CSV.'}
                    </Text>
                    <View style={[styles.row, { marginTop: spacing.s }]}>
                        <PrimaryButton
                            title="JSON"
                            variant="ghost"
                            onPress={onExport}
                            style={{ flex: 1 }}
                        />
                        <PrimaryButton
                            title="CSV"
                            variant="ghost"
                            onPress={onExportCsv}
                            style={{ flex: 1 }}
                        />
                    </View>
                </Card>

                <Card>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={typography.h3}>
                                {getLocale() === 'tr' ? 'Kompakt mod' : 'Compact mode'}
                            </Text>
                            <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                                {getLocale() === 'tr'
                                    ? 'Daha sıkı yerleşim — kart aralıkları azalır.'
                                    : 'Tighter layout — reduces card spacing.'}
                            </Text>
                        </View>
                        <DensitySwitch />
                    </View>
                </Card>

                <Card>
                    <Text style={typography.h3}>{t('profile.about')}</Text>
                    <Text style={[typography.caption, { marginTop: spacing.s }]}>
                        Reveil 1.0.0 · Konya Food and Agriculture University · COMP4901
                    </Text>
                    <PrimaryButton
                        title={getLocale() === 'tr' ? 'Gizlilik' : 'Privacy'}
                        variant="ghost"
                        onPress={() => navigation.navigate('Privacy')}
                        style={{ marginTop: spacing.s }}
                    />
                </Card>

                <PrimaryButton title={t('profile.signOut')} onPress={onSignOut} />
                <PrimaryButton title={t('profile.deleteAccount')} variant="ghost" onPress={onDelete} />
            </ScrollView>
        </SafeAreaView>
    );
}

function DensitySwitch() {
    const density = useDensity();
    return (
        <Toggle
            value={density === 'compact'}
            onChange={(next) => setDensity(next ? 'compact' : 'comfortable')}
            accessibilityLabel="Compact mode"
        />
    );
}

function LangChip({
    code,
    current,
    label,
    onPress,
}: {
    code: 'en' | 'tr';
    current: string;
    label: string;
    onPress: () => void;
}) {
    const selected = current === code;
    return (
        <Pressable onPress={onPress} style={[styles.chip, selected ? styles.chipSelected : null]}>
            <Text style={[typography.caption, selected ? { color: colors.text } : null]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.m },
    row: { flexDirection: 'row', gap: spacing.s },
    chip: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    input: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
});
