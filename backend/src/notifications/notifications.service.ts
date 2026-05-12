import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushToken } from './push-token.entity';
import { Reminder } from './reminder.entity';
import { NotificationEvent } from './notification-event.entity';
import { NotificationFeedItem } from './notification-feed.entity';
import { Habit } from '../habits/habit.entity';
import { ExpoPushClient } from './expo-push.client';
import { RegisterTokenDto } from './dto/register-token.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { LogNotificationEventDto } from './dto/log-event.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(PushToken)
        private tokens: Repository<PushToken>,
        @InjectRepository(Reminder)
        private reminders: Repository<Reminder>,
        @InjectRepository(Habit)
        private habits: Repository<Habit>,
        @InjectRepository(NotificationEvent)
        private events: Repository<NotificationEvent>,
        @InjectRepository(NotificationFeedItem)
        private feed: Repository<NotificationFeedItem>,
        private expo: ExpoPushClient,
    ) { }

    async registerToken(userId: string, dto: RegisterTokenDto): Promise<PushToken> {
        const existing = await this.tokens.findOne({ where: { userId, token: dto.token } });
        if (existing) {
            existing.platform = dto.platform ?? existing.platform;
            return this.tokens.save(existing);
        }
        const created = this.tokens.create({
            userId,
            token: dto.token,
            platform: dto.platform ?? 'expo',
        });
        return this.tokens.save(created);
    }

    async listReminders(userId: string): Promise<Reminder[]> {
        return this.reminders.find({ where: { userId }, order: { time: 'ASC' } });
    }

    async createReminder(userId: string, dto: CreateReminderDto): Promise<Reminder> {
        if (dto.habitId) {
            const habit = await this.habits.findOne({ where: { id: dto.habitId } });
            if (!habit) throw new NotFoundException('Habit not found');
            if (habit.userId !== userId) throw new ForbiddenException();
        }
        const reminder = this.reminders.create({
            userId,
            habitId: dto.habitId,
            time: dto.time,
            weekdays: dto.weekdays ?? '1,2,3,4,5,6,7',
            enabled: dto.enabled ?? true,
            message: dto.message,
        });
        return this.reminders.save(reminder);
    }

    async deleteReminder(userId: string, id: string): Promise<{ deleted: true }> {
        const reminder = await this.reminders.findOne({ where: { id } });
        if (!reminder) throw new NotFoundException();
        if (reminder.userId !== userId) throw new ForbiddenException();
        await this.reminders.delete({ id });
        return { deleted: true };
    }

    /** Send an ad-hoc test push to every device registered for the user. */
    async sendTestPush(userId: string, title: string, body: string): Promise<{ sent: number }> {
        const userTokens = await this.tokens.find({ where: { userId } });
        return this.expo.send(userTokens.map((t) => t.token), title, body, { type: 'test' });
    }

    async logEvent(userId: string, dto: LogNotificationEventDto): Promise<NotificationEvent> {
        const event = this.events.create({
            userId,
            eventType: dto.eventType,
            reminderId: dto.reminderId,
            habitId: dto.habitId,
        });
        return this.events.save(event);
    }

    async recordFeed(userId: string, item: { title: string; body: string; kind: string; habitId?: string | null }): Promise<NotificationFeedItem> {
        const row = this.feed.create({
            userId,
            title: item.title,
            body: item.body,
            kind: item.kind,
            habitId: item.habitId ?? undefined,
        });
        return this.feed.save(row);
    }

    async listFeed(userId: string, limit = 50): Promise<NotificationFeedItem[]> {
        return this.feed.find({
            where: { userId },
            order: { sentAt: 'DESC' },
            take: limit,
        });
    }
}
