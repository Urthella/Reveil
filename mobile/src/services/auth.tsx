import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);
    const mock = !isFirebaseConfigured();

    useEffect(() => {
        if (mock) {
            setInitializing(false);
            return;
        }
        return onAuthStateChanged(auth, (u) => {
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
                setUser({ uid: email } as User);
                return;
            }
            await signInWithEmailAndPassword(auth, email, password);
        },
        signUp: async (email, password) => {
            if (mock) {
                setUser({ uid: email } as User);
                return;
            }
            await createUserWithEmailAndPassword(auth, email, password);
        },
        sendPasswordReset: async (email) => {
            if (mock) {
                // Surface a friendly message in dev mode rather than failing silently.
                throw new Error('Password reset is unavailable in mock mode.');
            }
            await sendPasswordResetEmail(auth, email);
        },
        signOutUser: async () => {
            if (mock) {
                setUser(null);
                return;
            }
            await signOut(auth);
        },
        getToken: async () => {
            if (mock) return 'mock-token';
            const u = auth.currentUser;
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
