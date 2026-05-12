/**
 * Firebase initialization is lazy. We deliberately avoid importing the
 * `firebase/app` and `firebase/auth` modules at the top level — even an
 * unused import triggers a Firebase v10 + Hermes component-registration
 * race that surfaces as a red-box on cold start ("Component auth has not
 * been registered yet").
 *
 * In mock mode (no EXPO_PUBLIC_FIREBASE_API_KEY set) Firebase never loads.
 * Once a real key is provided, the helpers below dynamically require the
 * SDK on first use.
 */

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const configured = !!apiKey && apiKey !== 'demo-api-key';

export const isFirebaseConfigured = (): boolean => configured;

let _app: any = null;
let _auth: any = null;

function loadFirebase(): { app: any; auth: any } | null {
    if (!configured) return null;
    if (_app && _auth) return { app: _app, auth: _auth };
    // require() instead of import to keep this fully out of the bundle's
    // initial evaluation path when not configured.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps } = require('firebase/app');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase/auth');
    const firebaseConfig = {
        apiKey,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };
    _app = getApps()[0] ?? initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    return { app: _app, auth: _auth };
}

/** Resolves to the Firebase Auth instance or null when in mock mode. */
export function getFirebaseAuth(): any | null {
    return loadFirebase()?.auth ?? null;
}

/** Resolves to the FirebaseApp instance or null when in mock mode. */
export function getFirebaseApp(): any | null {
    return loadFirebase()?.app ?? null;
}
