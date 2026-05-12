import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';

// Lazy-require firebase/auth so a mock-mode bundle never evaluates Firebase.
function loadFirebaseAuth(): typeof import('firebase/auth') | null {
    if (!isFirebaseConfigured()) return null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('firebase/auth');
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

/** iOS-only Apple Sign-In flow that bridges to Firebase OAuthProvider('apple.com'). */
export async function signInWithApple(): Promise<void> {
    const fb = loadFirebaseAuth();
    const auth = getFirebaseAuth();
    if (!fb || !auth) throw new Error('Firebase auth not configured');

    const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
    });
    if (!credential.identityToken) {
        throw new Error('Apple sign-in returned no identity token');
    }
    const provider = new fb.OAuthProvider('apple.com');
    const cred = provider.credential({
        idToken: credential.identityToken,
        rawNonce: undefined,
    });
    await fb.signInWithCredential(auth, cred);
}

/** Bridge a Google id_token (obtained via the in-screen useAuthRequest hook) to Firebase. */
export async function bridgeGoogleIdToken(idToken: string): Promise<void> {
    const fb = loadFirebaseAuth();
    const auth = getFirebaseAuth();
    if (!fb || !auth) throw new Error('Firebase auth not configured');
    const cred = fb.GoogleAuthProvider.credential(idToken);
    await fb.signInWithCredential(auth, cred);
}
