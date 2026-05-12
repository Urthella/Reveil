import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import PrimaryButton from './PrimaryButton';
import {
    bridgeGoogleIdToken,
    isAppleSignInAvailable,
    isGoogleSignInAvailable,
    signInWithApple,
} from '../services/social-auth';

/** Lazy-loaded so jest/web builds don't trip on the native module. */
function loadGoogleProviders() {
    try {
        return require('expo-auth-session/providers/google') as typeof import('expo-auth-session/providers/google');
    } catch {
        return null;
    }
}
function loadWebBrowser() {
    try {
        return require('expo-web-browser') as typeof import('expo-web-browser');
    } catch {
        return null;
    }
}

interface Props {
    onSignedIn: () => void;
}

export default function SocialSignInButtons({ onSignedIn }: Props) {
    const googleAvailable = isGoogleSignInAvailable();
    const appleAvailable = isAppleSignInAvailable();

    const Google = googleAvailable ? loadGoogleProviders() : null;
    const browser = googleAvailable ? loadWebBrowser() : null;

    // Hook must be called unconditionally — fall back to a stub array when not available.
    const useAuthRequest = (Google as any)?.useAuthRequest as
        | ((cfg: any) => [any, any, (opts?: any) => Promise<any>])
        | undefined;
    const [request, response, promptAsync] = (useAuthRequest
        ? useAuthRequest({
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
            androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
        })
        : [null, null, async () => null]) as any;

    useEffect(() => {
        browser?.maybeCompleteAuthSession?.();
    }, [browser]);

    useEffect(() => {
        if (response?.type === 'success' && response.params?.id_token) {
            bridgeGoogleIdToken(response.params.id_token)
                .then(onSignedIn)
                .catch((err) => Alert.alert('Sign-in failed', err?.message ?? 'Unknown error'));
        }
    }, [response, onSignedIn]);

    if (!googleAvailable && !appleAvailable) return null;

    return (
        <View style={styles.row}>
            {googleAvailable ? (
                <PrimaryButton
                    title="Sign in with Google"
                    variant="ghost"
                    onPress={() => promptAsync?.()}
                    disabled={!request}
                    accessibilityLabel="Sign in with Google"
                    style={{ flex: 1 }}
                />
            ) : null}
            {appleAvailable ? (
                <PrimaryButton
                    title="Sign in with Apple"
                    variant="ghost"
                    onPress={() => signInWithApple().then(onSignedIn).catch((e) => Alert.alert('Apple sign-in failed', e?.message))}
                    accessibilityLabel="Sign in with Apple"
                    style={{ flex: 1 }}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
