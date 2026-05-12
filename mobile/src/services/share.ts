import { Alert, Platform, Share } from 'react-native';

/**
 * Share a short piece of text via the OS share sheet. Uses RN's built-in
 * Share API on iOS/Android and falls back to an Alert preview on web /
 * environments where it isn't supported.
 */
export async function shareText(message: string, title?: string): Promise<void> {
    if (Platform.OS === 'web' || !Share?.share) {
        Alert.alert(title ?? 'Share', message);
        return;
    }
    try {
        await Share.share({ message, title });
    } catch (err: any) {
        Alert.alert('Share failed', err?.message ?? 'Unknown error.');
    }
}

export function buildStreakShareText(habitTitle: string, streak: number, locale: 'en' | 'tr'): string {
    if (locale === 'tr') {
        if (streak <= 0) {
            return `Reveil ile "${habitTitle}" alışkanlığını takip ediyorum. Bugün başlangıç günü.`;
        }
        return `🔥 ${streak} gün üst üste "${habitTitle}" yapıyorum. Reveil ile alışkanlık inşa ediyorum.`;
    }
    if (streak <= 0) {
        return `I'm tracking "${habitTitle}" with Reveil. Day 1 starts today.`;
    }
    return `🔥 ${streak} days in a row on "${habitTitle}". Building habits with Reveil.`;
}
