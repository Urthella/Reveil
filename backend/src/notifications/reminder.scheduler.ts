import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from './reminder.entity';
import { PushToken } from './push-token.entity';
import { NotificationFeedItem } from './notification-feed.entity';
import { Habit } from '../habits/habit.entity';
import { User } from '../users/user.entity';
import { ExpoPushClient } from './expo-push.client';

@Injectable()
export class ReminderScheduler {
    private readonly logger = new Logger(ReminderScheduler.name);

    constructor(
        @InjectRepository(Reminder) private reminders: Repository<Reminder>,
        @InjectRepository(PushToken) private tokens: Repository<PushToken>,
        @InjectRepository(Habit) private habits: Repository<Habit>,
        @InjectRepository(User) private users: Repository<User>,
        @InjectRepository(NotificationFeedItem) private feed: Repository<NotificationFeedItem>,
        private readonly expo: ExpoPushClient,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async tick() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const time = `${hh}:${mm}`;
        const isoDow = String(((now.getDay() + 6) % 7) + 1); // ISO: Mon=1..Sun=7

        const due = await this.reminders.find({ where: { enabled: true, time } });
        const matching = due.filter((r) => r.weekdays.split(',').includes(isoDow));
        if (matching.length === 0) return;

        let sent = 0;
        for (const reminder of matching) {
            const user = await this.users.findOne({ where: { id: reminder.userId } });
            if (user && isInQuietHours(time, user.quietHoursStart, user.quietHoursEnd)) {
                this.logger.debug(`Skipping reminder ${reminder.id} — quiet hours for ${user.id}`);
                continue;
            }
            const userTokens = await this.tokens.find({ where: { userId: reminder.userId } });
            if (userTokens.length === 0) continue;
            const habit = reminder.habitId
                ? await this.habits.findOne({ where: { id: reminder.habitId } })
                : null;
            // Skip reminders attached to paused habits.
            if (habit && habit.active === false) {
                this.logger.debug(`Skipping reminder ${reminder.id} — habit ${habit.id} paused`);
                continue;
            }
            const title = habit ? `Reveil · ${habit.title}` : 'Reveil reminder';
            const body = reminder.message ?? (habit ? `Time to work on "${habit.title}".` : 'Quick check-in time.');
            await this.expo.send(
                userTokens.map((t) => t.token),
                title,
                body,
                { reminderId: reminder.id, habitId: reminder.habitId ?? null },
                'reminder',
            );
            await this.feed.save(this.feed.create({
                userId: reminder.userId,
                title,
                body,
                kind: 'reminder',
                habitId: reminder.habitId ?? undefined,
            }));
            sent++;
        }
        if (sent > 0) this.logger.debug(`Dispatched ${sent} reminder(s) at ${time}`);
    }
}

/**
 * True when `time` (HH:mm) falls inside the user's quiet hours window.
 * Supports overnight windows (e.g. 22:00 → 07:00).
 */
export function isInQuietHours(time: string, startHHmm?: string | null, endHHmm?: string | null): boolean {
    if (!startHHmm || !endHHmm) return false;
    const t = toMinutes(time);
    const s = toMinutes(startHHmm);
    const e = toMinutes(endHHmm);
    if (s === e) return false;
    if (s < e) return t >= s && t < e;
    // Wrap-around: e.g. 22:00 to 07:00
    return t >= s || t < e;
}

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}
