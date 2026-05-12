import { NativeModules, Platform } from 'react-native';
import { prefs } from './preferences';

type Locale = 'en' | 'tr';

const STRINGS: Record<Locale, Record<string, string>> = {
    en: {
        'common.loading': 'Loading…',
        'common.error': 'Error',
        'common.delete': 'Delete',
        'common.skip': 'Skip',
        'common.add': 'Add',
        'common.open': 'Open',
        'dashboard.consistency': '30-day consistency',
        'dashboard.streak': 'Streak',
        'dashboard.today': 'Today',
        'dashboard.yourHabits': 'Your habits',
        'dashboard.addHabit': 'Add habit',
        'dashboard.aiFeedback': 'AI feedback',
        'dashboard.reminders': 'Reminders & notifications',
        'dashboard.empty': 'No habits yet.',
        'dashboard.emptyHint': 'Start small. Add the first habit you want to build.',
        'dashboard.emptyCta': 'Create your first habit',
        'dashboard.weeklyTitle': 'Last 7 days',
        'dashboard.badges': 'Streak badges',
        'habit.markDone': 'Mark done',
        'habit.skip': 'Skip',
        'habit.doneToday': 'Done ✓',
        'habit.notLogged': 'Not yet logged',
        'habit.notes': 'Notes (optional)',
        'habit.notesHint': 'What helped or got in the way?',
        'habit.history': 'History',
        'habit.delete': 'Delete habit',
        'habit.completed': 'Completed',
        'habit.skipped': 'Skipped',
        'habit.getFeedback': 'Get AI feedback',
        'habit.moodLabel': 'How did it feel? (1–10)',
        'reminders.newTitle': 'New reminder',
        'reminders.timeLabel': 'Time (HH:mm, 24h)',
        'reminders.daysLabel': 'Days',
        'reminders.habitLabel': 'Habit (optional)',
        'reminders.messageLabel': 'Custom message (optional)',
        'reminders.save': 'Save reminder',
        'reminders.test': 'Send a test push',
        'reminders.active': 'Active reminders',
        'reminders.empty': 'No reminders yet — add one above.',
        'reminders.any': 'Any',
        'feedback.generateAll': 'Generate (all habits)',
        'feedback.generateThis': 'Generate (this habit)',
        'feedback.empty': 'No feedback yet — tap "Generate".',
        'feedback.past': 'Past feedback',
        'feedback.tapHint': 'Tap to generate fresh, personalized feedback.',
        'create.quickStart': 'Quick start',
        'create.quickStartHint': 'Pick a template — you can edit before saving.',
        'create.title': 'Title',
        'create.description': 'Description (optional)',
        'create.frequency': 'Frequency',
        'create.timeOfDay': 'Time of day',
        'create.create': 'Create habit',
        'onboarding.slide1.title': 'Build habits that last.',
        'onboarding.slide1.body': 'Reveil keeps your daily check-ins simple and private.',
        'onboarding.slide2.title': 'Adaptive AI feedback.',
        'onboarding.slide2.body': 'Tailored encouragement that adjusts to your real progress, never generic platitudes.',
        'onboarding.slide3.title': 'Reminders that respect you.',
        'onboarding.slide3.body': 'Choose when to be nudged. Skip a day without guilt — momentum is what matters.',
        'onboarding.skip': 'Skip',
        'onboarding.next': 'Next',
        'onboarding.start': 'Start',
        'login.signin': 'Sign in',
        'login.signup': 'Create account',
        'login.toggleToSignup': 'Need an account? Sign up',
        'login.toggleToSignin': 'Have one? Sign in',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.subtitle': 'AI-powered habits and recovery, one mindful day at a time.',
        'login.forgot': 'Forgot password?',
        'login.forgotPrompt': 'Enter your email above first, then tap "Forgot password?" again.',
        'login.resetSentTitle': 'Check your inbox',
        'login.resetSentBody': 'A password reset link is on its way.',
        'login.demo': 'Continue as demo guest',
        'profile.title': 'Profile',
        'profile.signOut': 'Sign out',
        'profile.deleteAccount': 'Delete account',
        'profile.language': 'Language',
        'profile.notifications': 'Notifications',
        'profile.about': 'About Reveil',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.confirm': 'Confirm',
    },
    tr: {
        'common.loading': 'Yükleniyor…',
        'common.error': 'Hata',
        'common.delete': 'Sil',
        'common.skip': 'Geç',
        'common.add': 'Ekle',
        'common.open': 'Aç',
        'dashboard.consistency': '30 günlük tutarlılık',
        'dashboard.streak': 'Seri',
        'dashboard.today': 'Bugün',
        'dashboard.yourHabits': 'Alışkanlıkların',
        'dashboard.addHabit': 'Alışkanlık ekle',
        'dashboard.aiFeedback': 'AI geri bildirim',
        'dashboard.reminders': 'Hatırlatmalar ve bildirimler',
        'dashboard.empty': 'Henüz alışkanlık yok.',
        'dashboard.emptyHint': 'Küçük başla. Geliştirmek istediğin ilk alışkanlığı ekle.',
        'dashboard.emptyCta': 'İlk alışkanlığını oluştur',
        'dashboard.weeklyTitle': 'Son 7 gün',
        'dashboard.badges': 'Seri rozetleri',
        'habit.markDone': 'Tamamlandı',
        'habit.skip': 'Atla',
        'habit.doneToday': 'Bugün tamam ✓',
        'habit.notLogged': 'Henüz kaydedilmedi',
        'habit.notes': 'Notlar (opsiyonel)',
        'habit.notesHint': 'Yardımcı olan ya da engelleyen neydi?',
        'habit.history': 'Geçmiş',
        'habit.delete': 'Alışkanlığı sil',
        'habit.completed': 'Tamamlandı',
        'habit.skipped': 'Atlandı',
        'habit.getFeedback': 'AI geri bildirim al',
        'habit.moodLabel': 'Nasıl hissettirdi? (1–10)',
        'reminders.newTitle': 'Yeni hatırlatma',
        'reminders.timeLabel': 'Saat (HH:mm, 24s)',
        'reminders.daysLabel': 'Günler',
        'reminders.habitLabel': 'Alışkanlık (opsiyonel)',
        'reminders.messageLabel': 'Özel mesaj (opsiyonel)',
        'reminders.save': 'Hatırlatmayı kaydet',
        'reminders.test': 'Test bildirimi gönder',
        'reminders.active': 'Aktif hatırlatmalar',
        'reminders.empty': 'Henüz hatırlatma yok — yukarıdan ekle.',
        'reminders.any': 'Herhangi',
        'feedback.generateAll': 'Üret (tüm alışkanlıklar)',
        'feedback.generateThis': 'Üret (bu alışkanlık)',
        'feedback.empty': 'Henüz geri bildirim yok — "Üret"e dokun.',
        'feedback.past': 'Geçmiş geri bildirimler',
        'feedback.tapHint': 'Sana özel taze bir geri bildirim üretmek için dokun.',
        'create.quickStart': 'Hızlı başlangıç',
        'create.quickStartHint': 'Bir şablon seç — kaydetmeden önce düzenleyebilirsin.',
        'create.title': 'Başlık',
        'create.description': 'Açıklama (opsiyonel)',
        'create.frequency': 'Sıklık',
        'create.timeOfDay': 'Günün vakti',
        'create.create': 'Alışkanlığı oluştur',
        'onboarding.slide1.title': 'Kalıcı alışkanlıklar oluştur.',
        'onboarding.slide1.body': 'Reveil günlük takibini basit ve özel tutar.',
        'onboarding.slide2.title': 'Sana uyarlanan AI geri bildirim.',
        'onboarding.slide2.body': 'Genel klişeler değil, gerçek ilerlemene göre değişen kişisel mesajlar.',
        'onboarding.slide3.title': 'Sana saygılı hatırlatmalar.',
        'onboarding.slide3.body': 'Ne zaman dürtüleceğini sen seç. Bir günü atlamak suç değil — önemli olan ivme.',
        'onboarding.skip': 'Geç',
        'onboarding.next': 'İleri',
        'onboarding.start': 'Başla',
        'login.signin': 'Giriş yap',
        'login.signup': 'Hesap oluştur',
        'login.toggleToSignup': 'Hesabın yok mu? Kayıt ol',
        'login.toggleToSignin': 'Var mı? Giriş yap',
        'login.forgot': 'Şifremi unuttum',
        'login.forgotPrompt': 'Önce yukarıdaki kutuya e-postanı yaz, sonra tekrar dokun.',
        'login.resetSentTitle': 'Posta kutunu kontrol et',
        'login.resetSentBody': 'Şifre sıfırlama bağlantısı yolda.',
        'login.demo': 'Demo misafir olarak devam et',
        'login.email': 'E-posta',
        'login.password': 'Şifre',
        'login.subtitle': 'Yapay zeka destekli alışkanlıklar, her gün bilinçli bir adım.',
        'profile.title': 'Profil',
        'profile.signOut': 'Çıkış yap',
        'profile.deleteAccount': 'Hesabı sil',
        'profile.language': 'Dil',
        'profile.notifications': 'Bildirimler',
        'profile.about': 'Reveil hakkında',
        'common.cancel': 'İptal',
        'common.save': 'Kaydet',
        'common.confirm': 'Tamam',
    },
};

function detectDeviceLocale(): Locale {
    try {
        const raw = Platform.OS === 'ios'
            ? NativeModules.SettingsManager?.settings?.AppleLocale ||
              NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
            : NativeModules.I18nManager?.localeIdentifier;
        if (typeof raw === 'string' && raw.toLowerCase().startsWith('tr')) return 'tr';
    } catch {
        /* ignore */
    }
    return 'en';
}

let current: Locale = detectDeviceLocale();
const listeners = new Set<(loc: Locale) => void>();

export function getLocale(): Locale {
    return current;
}

export async function initLocale(): Promise<void> {
    const stored = (await prefs.getLocale()) as Locale | null;
    if (stored === 'en' || stored === 'tr') current = stored;
    listeners.forEach((cb) => cb(current));
}

export async function setLocale(locale: Locale): Promise<void> {
    current = locale;
    await prefs.setLocale(locale);
    listeners.forEach((cb) => cb(locale));
}

export function subscribeLocale(cb: (loc: Locale) => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function t(key: string): string {
    return STRINGS[current][key] ?? STRINGS.en[key] ?? key;
}
