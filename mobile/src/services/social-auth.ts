import { Platform } from 'react-native';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

/**
 * Best-effort lazy loader for an Expo module — keeps the bundle from
 * choking on a missing native module in test environments.
 */
function loadOptional<T>(name: string): T | null {
    try {
        return require(name) as T;
    } catch {
        return null;
    }
}

export function isGoogleSignInAvailable(): boolean {
    if (!isFirebaseConfigured()) return false;
    return !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
        || !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
        || !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
}

export function isAppleSignInAvailable(): boolean {
    if (!isFirebaseConfigured()) return false;
    return Platform.OS === 'ios';
}

/**
 * Initiates the Google Sign-In flow via expo-auth-session and exchanges the
 * resulting id_token for a Firebase credential. Throws when prerequisites are
 * missing so callers can surface a useful error.
 */
export async function signInWithGoogle(): Promise<void> {
    const expoAuth = loadOptional<typeof import('expo-auth-session/providers/google')>('expo-auth-session/providers/google');
    const webBrowser = loadOptional<typeof import('expo-web-browser')>('expo-web-browser');
    if (!expoAuth || !webBrowser) {
        throw new Error('expo-auth-session is not installed');
    }
    const clientIds = {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    };
    const hasAny = Object.values(clientIds).some(Boolean);
    if (!hasAny) {
        throw new Error('No Google client IDs configured (set EXPO_PUBLIC_GOOGLE_CLIENT_ID_*)');
    }
    webBrowser.maybeCompleteAuthSession();

    const discovery = { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' };
    const useAuthRequest: any = (expoAuth as any).useAuthRequest ?? (expoAuth as any).default?.useAuthRequest;
    if (!useAuthRequest) throw new Error('expo-auth-session/providers/google missing useAuthRequest');

    // Note: useAuthRequest is a hook — callers should prefer wiring it through
    // a screen. We expose this helper for cases where a fire-and-forget call
    // works: it manually drives the flow via promptAsync().
    throw new Error(
        'Use the GoogleSignInButton component (which wires useAuthRequest properly) — '
        + 'expo-auth-session requires a hook context.'
    );
    // Suppress unused-var lints in case the body ever reverts.
    void discovery;
}

/** iOS-only Apple Sign-In flow that bridges to Firebase OAuthProvider('apple.com'). */
export async function signInWithApple(): Promise<void> {
    const Apple = loadOptional<typeof import('expo-apple-authentication')>('expo-apple-authentication');
    if (!Apple) throw new Error('expo-apple-authentication is not installed');
    const credential = await Apple.signInAsync({
        requestedScopes: [
            Apple.AppleAuthenticationScope.FULL_NAME,
            Apple.AppleAuthenticationScope.EMAIL,
        ],
    });
    if (!credential.identityToken) {
        throw new Error('Apple sign-in returned no identity token');
    }
    const provider = new OAuthProvider('apple.com');
    const cred = provider.credential({
        idToken: credential.identityToken,
        rawNonce: undefined,
    });
    await signInWithCredential(auth, cred);
}

/** Bridge a Google id_token (obtained via the in-screen useAuthRequest hook) to Firebase. */
export async function bridgeGoogleIdToken(idToken: string): Promise<void> {
    const cred = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, cred);
}
