import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import SocialSignInButtons from '../components/SocialSignInButtons';
import { isGoogleSignInAvailable, isAppleSignInAvailable } from '../services/social-auth';
import { authService } from '../services/api';
import { useAuth } from '../services/auth';
import { t } from '../services/i18n';
import { colors, radius, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }: any) {
    const { signIn, signUp, sendPasswordReset, user, initializing, mock } = useAuth();
    const [email, setEmail] = useState('demo@reveil.app');
    const [password, setPassword] = useState('reveil-demo-1');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If Firebase already restored a session, jump straight to the dashboard.
        if (!initializing && user) navigation.replace('Dashboard');
    }, [user, initializing, navigation]);

    const submit = async () => {
        setLoading(true);
        try {
            if (mode === 'signup') {
                await signUp(email.trim(), password);
            } else {
                await signIn(email.trim(), password);
            }
            // Make sure the backend has a row for this user before we continue.
            try { await authService.syncUser(); } catch { /* backend optional in dev */ }
            navigation.replace('Dashboard');
        } catch (err: any) {
            Alert.alert('Sign-in failed', err?.message ?? 'Unknown error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.brand}>Reveil</Text>
                <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>{t('login.email')}</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="you@example.com"
                        placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.label}>{t('login.password')}</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder={t('login.password')}
                        placeholderTextColor={colors.textMuted}
                    />
                    <PrimaryButton
                        title={mode === 'signin' ? t('login.signin') : t('login.signup')}
                        onPress={submit}
                        loading={loading}
                    />
                    <PrimaryButton
                        title={mode === 'signin' ? t('login.toggleToSignup') : t('login.toggleToSignin')}
                        variant="ghost"
                        onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
                    />
                    {mode === 'signin' ? (
                        <PrimaryButton
                            title={t('login.forgot')}
                            variant="ghost"
                            onPress={async () => {
                                if (!email.trim()) {
                                    Alert.alert(t('common.error'), t('login.forgotPrompt'));
                                    return;
                                }
                                try {
                                    await sendPasswordReset(email.trim());
                                    Alert.alert(t('login.resetSentTitle'), t('login.resetSentBody'));
                                } catch (err: any) {
                                    Alert.alert(t('common.error'), err?.message ?? 'Failed.');
                                }
                            }}
                        />
                    ) : null}
                    <PrimaryButton
                        title={t('login.demo')}
                        variant="ghost"
                        accessibilityHint="Skip sign-in and try Reveil with seeded data."
                        onPress={async () => {
                            setLoading(true);
                            try {
                                // signIn with any creds resolves locally in mock mode; in
                                // real Firebase mode this hits a clearly invalid pair and
                                // falls back to navigating with mock-token which the
                                // backend AuthGuard maps to `test-user-123`.
                                try { await signIn('demo@reveil.app', 'demo'); } catch { /* mock mode handles it */ }
                                try { await authService.syncUser(); } catch { /* offline ok */ }
                                navigation.replace('Dashboard');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    />
                    {(isGoogleSignInAvailable() || isAppleSignInAvailable()) ? (
                        <SocialSignInButtons
                            onSignedIn={async () => {
                                try { await authService.syncUser(); } catch { /* backend optional */ }
                                navigation.replace('Dashboard');
                            }}
                        />
                    ) : null}
                </View>

                <Text style={styles.note}>
                    {mock
                        ? 'Mock auth (no Firebase config detected). Set EXPO_PUBLIC_FIREBASE_* to enable real sign-in.'
                        : 'Authenticated via Firebase. Tokens are sent to the backend per request.'}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: spacing.l, justifyContent: 'center' },
    brand: { ...typography.h1, fontSize: 44, marginBottom: spacing.s, color: colors.primary },
    subtitle: { ...typography.body, marginBottom: spacing.xl },
    form: { gap: spacing.s },
    label: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.s },
    input: {
        backgroundColor: colors.surface,
        color: colors.text,
        borderRadius: radius.m,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.s,
    },
    note: { ...typography.caption, marginTop: spacing.l, textAlign: 'center' },
});
