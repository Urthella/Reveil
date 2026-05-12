import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocale } from '../services/i18n';
import { colors, spacing, typography } from '../theme';

const SECTIONS_EN = [
    {
        h: 'What Reveil collects',
        p: 'Reveil stores only the information you create: your habits, daily completion logs, optional mood (1–10) and notes, AI feedback the system generates, reminders you set, and Expo push tokens needed to deliver them. Email and Firebase UID are kept for sign-in.',
    },
    {
        h: 'What we do not collect',
        p: 'We do not track your location, contacts, photos, or social graph. We do not run ads. We do not sell or rent your data. The AI engine receives anonymised numeric stats — never your raw notes or identifying info.',
    },
    {
        h: 'How AI feedback works',
        p: 'When you tap Generate, the backend sends only aggregated stats (consistency %, streak, completed/total days, optional category and tone) to the AI engine. If OPENAI_API_KEY is configured the engine forwards those stats to OpenAI; otherwise a deterministic rule-based generator runs locally. Every output passes a safety filter that blocks relapse-encouraging or self-harm phrases.',
    },
    {
        h: 'Your controls',
        p: 'You can export everything (JSON or CSV) from Profile → Export, import a previous export, opt out of weekly digests, set quiet hours, pause habits without losing data, and permanently delete your account from Profile → Delete account.',
    },
    {
        h: 'Storage',
        p: 'In dev the data lives in a local SQLite file. In production it lives in Postgres on infrastructure under our control. All HTTP traffic uses TLS. Authentication tokens are short-lived Firebase ID tokens.',
    },
    {
        h: 'Contact',
        p: 'Halil Utku Demirtaş & Furkan Can Karafil — Konya Food and Agriculture University, Department of Computer Engineering. Supervised by Prof. Dr. Meltem Huri Baturay Khan.',
    },
];

const SECTIONS_TR = [
    {
        h: 'Reveil neyi toplar',
        p: 'Reveil yalnızca senin oluşturduğun veriyi tutar: alışkanlıklar, günlük tamamlama kayıtları, opsiyonel mood (1–10) ve notlar, sistemin ürettiği AI geri bildirim, kurduğun hatırlatmalar ve push gönderimi için gerekli Expo token\'ları. Giriş için e-posta ve Firebase UID saklanır.',
    },
    {
        h: 'Toplamadıklarımız',
        p: 'Konum, kişiler, fotoğraflar veya sosyal ağ izlemiyoruz. Reklam göstermiyoruz. Veriyi satmıyoruz, kiralamıyoruz. AI motoru yalnız anonim sayısal istatistikleri görür — ham notların veya kimlik bilgin asla iletilmez.',
    },
    {
        h: 'AI geri bildirim nasıl çalışır',
        p: '"Üret" dediğinde backend yalnız agregat istatistikleri (tutarlılık %, seri, tamamlanan/toplam, opsiyonel kategori ve ton) AI motoruna iletir. OPENAI_API_KEY ayarlıysa motor OpenAI\'ye yönlendirir; değilse deterministik kural tabanlı üretim çalışır. Her çıktı, nüksetmeyi veya kendine zarar vermeyi teşvik eden ifadeleri engelleyen bir güvenlik filtresinden geçer.',
    },
    {
        h: 'Senin kontrollerin',
        p: 'Profil → Dışa aktar üzerinden her şeyi (JSON veya CSV) indirebilir, daha önceki bir dışa aktarmayı içe aktarabilir, haftalık özetten çıkabilir, sessiz saatler kurabilir, alışkanlıkları veriyi kaybetmeden duraklatabilir ve Profil → Hesabı sil ile kalıcı olarak silebilirsin.',
    },
    {
        h: 'Depolama',
        p: 'Geliştirme ortamında veriler yerel bir SQLite dosyasında, prodüksiyonda kontrolümüzdeki bir Postgres veritabanında saklanır. Tüm HTTP trafiği TLS kullanır. Kimlik token\'ları kısa ömürlü Firebase ID token\'larıdır.',
    },
    {
        h: 'İletişim',
        p: 'Halil Utku Demirtaş & Furkan Can Karafil — Konya Gıda ve Tarım Üniversitesi, Bilgisayar Mühendisliği. Danışman: Prof. Dr. Meltem Huri Baturay Khan.',
    },
];

export default function PrivacyScreen() {
    const tr = getLocale() === 'tr';
    const sections = tr ? SECTIONS_TR : SECTIONS_EN;
    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={typography.h1}>{tr ? 'Gizlilik' : 'Privacy'}</Text>
                <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                    Reveil v1.0 · {new Date().getFullYear()}
                </Text>
                {sections.map((s) => (
                    <View key={s.h} style={{ marginTop: spacing.l }}>
                        <Text style={typography.h3}>{s.h}</Text>
                        <Text style={[typography.body, { marginTop: spacing.s }]}>{s.p}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.l, gap: spacing.s },
});
