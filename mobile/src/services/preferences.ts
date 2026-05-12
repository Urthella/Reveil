import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    onboarded: 'reveil:onboarded',
    locale: 'reveil:locale',
    seenBadges: 'reveil:seen-badges',
    density: 'reveil:density',
    seenLevel: 'reveil:seen-level',
} as const;

export type Density = 'comfortable' | 'compact';

export const prefs = {
    async hasOnboarded(): Promise<boolean> {
        return (await AsyncStorage.getItem(KEYS.onboarded)) === 'true';
    },
    async setOnboarded(value: boolean): Promise<void> {
        await AsyncStorage.setItem(KEYS.onboarded, value ? 'true' : 'false');
    },
    async getLocale(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.locale);
    },
    async setLocale(locale: string): Promise<void> {
        await AsyncStorage.setItem(KEYS.locale, locale);
    },
    async getSeenBadges(): Promise<string[]> {
        const raw = await AsyncStorage.getItem(KEYS.seenBadges);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
        } catch {
            return [];
        }
    },
    async setSeenBadges(ids: string[]): Promise<void> {
        await AsyncStorage.setItem(KEYS.seenBadges, JSON.stringify(ids));
    },
    async getDensity(): Promise<Density> {
        const raw = await AsyncStorage.getItem(KEYS.density);
        return raw === 'compact' ? 'compact' : 'comfortable';
    },
    async setDensity(density: Density): Promise<void> {
        await AsyncStorage.setItem(KEYS.density, density);
    },
    async getSeenLevel(): Promise<number> {
        const raw = await AsyncStorage.getItem(KEYS.seenLevel);
        const n = raw ? Number(raw) : 1;
        return Number.isFinite(n) && n >= 1 ? n : 1;
    },
    async setSeenLevel(level: number): Promise<void> {
        await AsyncStorage.setItem(KEYS.seenLevel, String(Math.max(1, Math.floor(level))));
    },
};
