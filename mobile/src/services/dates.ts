/**
 * Local-timezone date helpers. We deliberately avoid `Date.toISOString()`
 * (UTC) because it shifts the calendar boundary for users east of UTC —
 * 02:30 in Istanbul is "tomorrow" to UTC and would put a habit log on the
 * wrong day. These helpers always reason in the user's local timezone.
 */

function pad(n: number): string {
    return n < 10 ? '0' + n : String(n);
}

/** Returns YYYY-MM-DD in the device's local timezone. */
export function localIsoDate(d: Date = new Date()): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns the local YYYY-MM-DD `n` days before `ref` (default today). */
export function localDaysAgoIso(n: number, ref: Date = new Date()): string {
    const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - n);
    return localIsoDate(d);
}

/** Returns the local YYYY-MM-DD `n` days after `ref` (default today). */
export function localDaysAheadIso(n: number, ref: Date = new Date()): string {
    return localDaysAgoIso(-n, ref);
}

export function todayIso(): string {
    return localIsoDate();
}
