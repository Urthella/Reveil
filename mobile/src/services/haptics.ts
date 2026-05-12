/**
 * Thin wrapper over expo-haptics. Loads the native module lazily so that
 * unit tests / web builds don't crash, and silently no-ops when haptics
 * aren't available on the current platform.
 */
type HapticsModule = typeof import('expo-haptics');
let cached: HapticsModule | null = null;
let attempted = false;

function load(): HapticsModule | null {
    if (attempted) return cached;
    attempted = true;
    try {
        cached = require('expo-haptics');
    } catch {
        cached = null;
    }
    return cached;
}

export async function hapticSuccess(): Promise<void> {
    const m = load();
    if (!m) return;
    try {
        await m.notificationAsync(m.NotificationFeedbackType.Success);
    } catch {
        /* ignore */
    }
}

export async function hapticWarning(): Promise<void> {
    const m = load();
    if (!m) return;
    try {
        await m.notificationAsync(m.NotificationFeedbackType.Warning);
    } catch {
        /* ignore */
    }
}

export async function hapticTap(): Promise<void> {
    const m = load();
    if (!m) return;
    try {
        await m.selectionAsync();
    } catch {
        /* ignore */
    }
}
