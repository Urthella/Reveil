import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';

// `User` type is referenced for the public API. We use `any` here because
// importing it statically from `firebase/auth` would force Firebase to
// evaluate at bundle-load time, which trips the Hermes registration race.
type User = any;

interface AuthState {
    user: User | null;
    initializing: boolean;
    /** True when running without real Firebase config — UI can show a hint. */
    mock: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    signOutUser: () => Promise<void>;
    /** Resolves the current Firebase ID token (or 'mock-token' in dev). */
    getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthState | null>(null);

// Lazy-require firebase/auth only when we actually need it. Keeps the
// initial bundle evaluation away from Firebase's component registry,
// which on Hermes throws "Component auth has not been registered yet"
// when imported eagerly.
function loadFirebaseAuth(): typeof import('firebase/auth') | null {
    if (!isFirebaseConfigured()) return null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('firebase/auth');
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);
    const mock = !isFirebaseConfigured();

    useEffect(() => {
        if (mock) {
            setInitializing(false);
            return;
        }
        const fb = loadFirebaseAuth();
        const auth = getFirebaseAuth();
        if (!fb || !auth) {
            setInitializing(false);
            return;
        }
        return fb.onAuthStateChanged(auth, (u: User | null) => {
            setUser(u);
            setInitializing(false);
        });
    }, [mock]);

    const value: AuthState = {
        user,
        initializing,
        mock,
        signIn: async (email, password) => {
            if (mock) {
                setUser({ uid: email });
                return;
            }
            const fb = loadFirebaseAuth();
            const auth = getFirebaseAuth();
            if (!fb || !auth) throw new Error('Firebase auth unavailable');
            await fb.signInWithEmailAndPassword(auth, email, password);
        },
        signUp: async (email, password) => {
            if (mock) {
                setUser({ uid: email });
                return;
            }
            const fb = loadFirebaseAuth();
            const auth = getFirebaseAuth();
            if (!fb || !auth) throw new Error('Firebase auth unavailable');
            await fb.createUserWithEmailAndPassword(auth, email, password);
        },
        sendPasswordReset: async (email) => {
            if (mock) {
                throw new Error('Password reset is unavailable in mock mode.');
            }
            const fb = loadFirebaseAuth();
            const auth = getFirebaseAuth();
            if (!fb || !auth) throw new Error('Firebase auth unavailable');
            await fb.sendPasswordResetEmail(auth, email);
        },
        signOutUser: async () => {
            if (mock) {
                setUser(null);
                return;
            }
            const fb = loadFirebaseAuth();
            const auth = getFirebaseAuth();
            if (!fb || !auth) return;
            await fb.signOut(auth);
        },
        getToken: async () => {
            if (mock) return 'mock-token';
            const auth = getFirebaseAuth();
            const u = auth?.currentUser;
            if (!u) throw new Error('Not signed in');
            return u.getIdToken();
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

let tokenProvider: () => Promise<string> = async () => 'mock-token';
export function registerTokenProvider(fn: () => Promise<string>) {
    tokenProvider = fn;
}
export function getCurrentToken(): Promise<string> {
    return tokenProvider();
}
