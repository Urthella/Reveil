import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    // @ts-ignore - getReactNativePersistence isn't in firebase v10 typings
    getReactNativePersistence,
    Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set these via app.json -> expo.extra.firebase or via EXPO_PUBLIC_FIREBASE_* env vars.
// Falls back to a deterministic placeholder so the app still imports cleanly when
// no Firebase project is configured (auth calls will then fail at runtime).
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:0:web:demo',
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    try {
        auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
        auth = getAuth(app);
    }
} else {
    app = getApps()[0]!;
    auth = getAuth(app);
}

export const isFirebaseConfigured = (): boolean =>
    !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY && process.env.EXPO_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key';

export { app, auth };
