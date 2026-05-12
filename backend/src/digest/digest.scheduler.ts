import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { PushToken } from '../notifications/push-token.entity';
import { ExpoPushClient } from '../notifications/expo-push.client';
import { NotificationFeedItem } from '../notifications/notification-feed.entity';
import { DigestService } from './digest.service';
import { EmailClient, digestEmailHtml } from './email.client';
import { isInQuietHours } from '../notifications/reminder.scheduler';

/**
 * Weekly digest cron. Sundays at 19:00 server time, fans out via push (and,
 * if Resend is configured, via email) to every user who has at least one
 * push token; respects per-user quiet hours.
 *
 * Disable by setting DIGEST_CRON=off (handy for tests / staging).
 */
@Injectable()
export class DigestScheduler {
    private readonly logger = new Logger(DigestScheduler.name);

    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(PushToken) private readonly tokens: Repository<PushToken>,
        @InjectRepository(NotificationFeedItem) private readonly feed: Repository<NotificationFeedItem>,
        private readonly digestService: DigestService,
        private readonly expo: ExpoPushClient,
        private readonly email: EmailClient,
    ) { }

    // Sunday at 19:00 — Cron syntax: minute hour dayOfMonth month dayOfWeek
    @Cron('0 19 * * 0')
    async tick() {
        if (process.env.DIGEST_CRON === 'off') return;
        await this.runOnce();
    }

    /** Public so it can be triggered manually via an admin route or tests. */
    async runOnce(): Promise<{ delivered: number; emailsSent: number }> {
        const tokenRows = await this.tokens.find();
        const userIds = Array.from(new Set(tokenRows.map((t) => t.userId)));
        if (userIds.length === 0) return { delivered: 0, emailsSent: 0 };

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const time = `${hh}:${mm}`;

        let delivered = 0;
        let emailsSent = 0;
        for (const userId of userIds) {
            const user = await this.users.findOne({ where: { id: userId } });
            if (user && user.digestEnabled === false) {
                this.logger.debug(`Skipping digest for ${userId} — opted out`);
                continue;
            }
            if (user && isInQuietHours(time, user.quietHoursStart, user.quietHoursEnd)) {
                this.logger.debug(`Skipping digest for ${userId} — quiet hours`);
                continue;
            }
            try {
                const locale = user?.locale === 'tr' ? 'tr' : 'en';
                const digest = await this.digestService.buildForUser(userId, locale);
                const userTokens = tokenRows.filter((t) => t.userId === userId);
                const title = locale === 'tr' ? 'Reveil · Haftalık özet' : 'Reveil · Weekly digest';
                await this.expo.send(
                    userTokens.map((t) => t.token),
                    title,
                    digest.summary,
                    { type: 'digest' },
                );
                await this.feed.save(this.feed.create({
                    userId,
                    title,
                    body: digest.summary,
                    kind: 'digest',
                }));
                delivered++;

                if (this.email.isConfigured() && user?.email && this.isRealEmail(user.email)) {
                    const html = digestEmailHtml(user.displayName, digest.summary, digest.perHabit);
                    const r = await this.email.send(user.email, title, html);
                    if (r.sent) emailsSent++;
                }
            } catch (err: any) {
                this.logger.warn(`Digest failed for ${userId}: ${err.message}`);
            }
        }
        this.logger.log(`Weekly digest fan-out: ${delivered}/${userIds.length} push, ${emailsSent} email`);
        return { delivered, emailsSent };
    }

    /** Skip the synthetic dev email pattern (`<uid>@reveil.app`). */
    private isRealEmail(email: string): boolean {
        return /@/.test(email) && !email.endsWith('@reveil.app');
    }
}
