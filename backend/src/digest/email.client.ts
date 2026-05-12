import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Minimal Resend email client. Activated only when both RESEND_API_KEY
 * and DIGEST_FROM_EMAIL are set. Otherwise `send()` becomes a no-op so
 * the rest of the system stays usable without paid credentials.
 */
@Injectable()
export class EmailClient {
    private readonly logger = new Logger(EmailClient.name);
    constructor(private readonly http: HttpService) { }

    isConfigured(): boolean {
        return !!(process.env.RESEND_API_KEY && process.env.DIGEST_FROM_EMAIL);
    }

    async send(to: string, subject: string, html: string): Promise<{ sent: boolean }> {
        if (!this.isConfigured()) return { sent: false };
        try {
            await firstValueFrom(
                this.http.post(
                    'https://api.resend.com/emails',
                    {
                        from: process.env.DIGEST_FROM_EMAIL,
                        to,
                        subject,
                        html,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 8000,
                    },
                ),
            );
            return { sent: true };
        } catch (err: any) {
            this.logger.warn(`Email send failed for ${to}: ${err.message}`);
            return { sent: false };
        }
    }
}

export function digestEmailHtml(displayName: string | undefined, summary: string, perHabit: { title: string; consistencyScore: number; currentStreak: number }[]): string {
    const greeting = displayName ? `Hi ${displayName},` : 'Hi,';
    const rows = perHabit
        .map(
            (h) =>
                `<tr><td style="padding:6px 12px">${escapeHtml(h.title)}</td><td style="padding:6px 12px">${h.consistencyScore}%</td><td style="padding:6px 12px">${h.currentStreak}d</td></tr>`,
        )
        .join('');
    return `<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;background:#0F0F14;color:#fff;padding:24px">
  <h1 style="color:#6C63FF">Reveil weekly digest</h1>
  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(summary)}</p>
  <table style="width:100%;background:#1A1A22;border-radius:12px;border-collapse:collapse;margin-top:16px">
    <thead><tr><th style="text-align:left;padding:8px 12px">Habit</th><th style="text-align:left;padding:8px 12px">Consistency</th><th style="text-align:left;padding:8px 12px">Streak</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#7A7A8C;font-size:12px;margin-top:32px">Sent by Reveil · You can disable digests in the app's profile screen.</p>
</body></html>`;
}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
