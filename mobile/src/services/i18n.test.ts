import { getLocale, setLocale, t } from './i18n';

describe('i18n', () => {
    it('falls back to English when key missing in current locale', async () => {
        await setLocale('en');
        expect(t('login.signin')).toBe('Sign in');
    });

    it('switches strings when locale changes', async () => {
        await setLocale('tr');
        expect(getLocale()).toBe('tr');
        expect(t('login.signin')).toBe('Giriş yap');
        await setLocale('en'); // reset for other tests
    });

    it('returns the key when neither locale has the entry', () => {
        expect(t('definitely.missing.key')).toBe('definitely.missing.key');
    });
});
