/**
 * Thin Sentry wrapper. Only initializes when SENTRY_DSN is set so dev/test
 * environments stay silent. The rest of the app calls `captureException` and
 * gets a no-op when not configured.
 */
let _initialized = false;
let _Sentry: typeof import('@sentry/node') | null = null;

function tryLoad(): typeof import('@sentry/node') | null {
    if (_Sentry) return _Sentry;
    try {
        _Sentry = require('@sentry/node');
        return _Sentry;
    } catch {
        return null;
    }
}

export function initSentry(): void {
    if (_initialized) return;
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;
    const Sentry = tryLoad();
    if (!Sentry) return;
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV ?? 'development',
        release: process.env.APP_VERSION ?? '1.0.0',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    _initialized = true;
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
    if (!_initialized) return;
    const Sentry = _Sentry;
    if (!Sentry) return;
    try {
        Sentry.withScope((scope) => {
            if (context) {
                for (const [k, v] of Object.entries(context)) scope.setExtra(k, v);
            }
            Sentry.captureException(err);
        });
    } catch {
        /* never let observability throw */
    }
}

export function isSentryEnabled(): boolean {
    return _initialized;
}
