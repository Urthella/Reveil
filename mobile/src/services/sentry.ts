/**
 * JS-only Sentry wrapper. Activates when EXPO_PUBLIC_SENTRY_DSN is set.
 *
 * We deliberately use @sentry/browser instead of @sentry/react-native: the
 * native SDK requires iOS/Android pod linking and a managed Expo build, which
 * is overkill for the current deliverable. This still captures uncaught JS
 * errors and lets us call captureException explicitly from API failures.
 */
let _initialized = false;
let _Sentry: typeof import('@sentry/browser') | null = null;

function tryLoad(): typeof import('@sentry/browser') | null {
    if (_Sentry) return _Sentry;
    try {
        _Sentry = require('@sentry/browser');
        return _Sentry;
    } catch {
        return null;
    }
}

export function initSentry(): void {
    if (_initialized) return;
    const dsn = (process.env as any).EXPO_PUBLIC_SENTRY_DSN as string | undefined;
    if (!dsn) return;
    const Sentry = tryLoad();
    if (!Sentry) return;
    Sentry.init({
        dsn,
        environment: (process.env as any).EXPO_PUBLIC_NODE_ENV ?? 'development',
        release: 'reveil-mobile@1.0.0',
        tracesSampleRate: 0,
    });
    _initialized = true;
}

export function captureException(err: unknown, extras?: Record<string, unknown>): void {
    if (!_initialized) return;
    const Sentry = _Sentry;
    if (!Sentry) return;
    try {
        Sentry.withScope((scope) => {
            if (extras) for (const [k, v] of Object.entries(extras)) scope.setExtra(k, v);
            Sentry.captureException(err);
        });
    } catch {
        /* never let observability throw */
    }
}

export function isSentryEnabled(): boolean {
    return _initialized;
}
