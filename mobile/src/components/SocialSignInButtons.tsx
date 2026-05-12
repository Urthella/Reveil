import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import PrimaryButton from './PrimaryButton';
import {
    bridgeGoogleIdToken,
    isAppleSignInAvailable,
    isGoogleSignInAvailable,
    signInWithApple,
} from '../services/social-auth';

interface Props {
    onSignedIn: () => void;
}

export default function SocialSignInButtons({ onSignedIn }: Props) {
    const googleAvailable = isGoogleSignInAvailable();
    const appleAvailable = isAppleSignInAvailable();

    // Hook must be called unconditionally to satisfy the rules of hooks.
    // Even when no client IDs are configured, the hook itself is safe to call
    // — it just returns a no-op request.
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    });

    useEffect(() => {
        WebBrowser.maybeCompleteAuthSession();
    }, []);

    useEffect(() => {
        if (response?.type === 'success' && (response.params as any)?.id_token) {
            bridgeGoogleIdToken((response.params as any).id_token)
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
                    onPress={() => promptAsync()}
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
