import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Habit } from '../habits/habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { FeedbackLog } from '../feedback/feedback.entity';
import { NotificationEvent } from '../notifications/notification-event.entity';
import { daysAgoIso } from '../common/stats.util';

export interface PlatformInsights {
    generatedAt: string;
    totals: {
        users: number;
        habits: number;
        logs: number;
        feedback: number;
        notificationEvents: number;
    };
    activity: {
        logsLast7d: number;
        logsLast30d: number;
        activeUsersLast7d: number;
    };
    aiQuality: {
        ratedFeedback: number;
        thumbsUp: number;
        thumbsDown: number;
        thumbsDownRatio: number;          // among rated
        sourceBreakdown: { claude: number; openai: number; rule: number };
    };
    notifications: {
        tapsLast7d: number;
        dismissLast7d: number;
        shownLast7d: number;
        tapThroughRate: number;           // taps / shown, last 7d
    };
    categoryBreakdown: Record<string, number>;
}

@Injectable()
export class InsightsService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Habit) private readonly habits: Repository<Habit>,
        @InjectRepository(HabitLog) private readonly logs: Repository<HabitLog>,
        @InjectRepository(FeedbackLog) private readonly feedback: Repository<FeedbackLog>,
        @InjectRepository(NotificationEvent) private readonly events: Repository<NotificationEvent>,
    ) { }

    async getPlatformInsights(): Promise<PlatformInsights> {
        const [users, habits, logs, feedback, notificationEvents] = await Promise.all([
            this.users.count(),
            this.habits.count(),
            this.logs.count(),
            this.feedback.count(),
            this.events.count(),
        ]);

        const sinceWeek = daysAgoIso(7);
        const sinceMonth = daysAgoIso(30);

        const recentLogs = await this.logs
            .createQueryBuilder('log')
            .where('log.date >= :sinceMonth', { sinceMonth })
            .getMany();
        const last7 = recentLogs.filter((l) => l.date >= sinceWeek);
        const activeWeek = new Set(last7.map((l) => l.userId));

        const allFeedback = await this.feedback.find();
        const rated = allFeedback.filter((f) => f.rating !== 0);
        const up = rated.filter((f) => f.rating === 1).length;
        const down = rated.filter((f) => f.rating === -1).length;
        type FeedbackSource = 'claude' | 'openai' | 'rule';
        const sourceBreakdown = allFeedback.reduce(
            (acc, f) => {
                const key = (['claude', 'openai', 'rule'].includes(f.source) ? f.source : 'rule') as FeedbackSource;
                acc[key] = (acc[key] ?? 0) + 1;
                return acc;
            },
            { claude: 0, openai: 0, rule: 0 } as Record<FeedbackSource, number>,
        );

        const allHabits = await this.habits.find();
        const categoryBreakdown = allHabits.reduce<Record<string, number>>((acc, h) => {
            const key = h.category || 'general';
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {});

        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        const recentEvents = await this.events.find({
            where: { occurredAt: MoreThanOrEqual(sevenDaysAgo) },
        });
        const taps = recentEvents.filter((e) => e.eventType === 'tap').length;
        const dismiss = recentEvents.filter((e) => e.eventType === 'dismiss').length;
        const shown = recentEvents.filter((e) => e.eventType === 'shown').length;

        return {
            generatedAt: new Date().toISOString(),
            totals: { users, habits, logs, feedback, notificationEvents },
            activity: {
                logsLast7d: last7.length,
                logsLast30d: recentLogs.length,
                activeUsersLast7d: activeWeek.size,
            },
            aiQuality: {
                ratedFeedback: rated.length,
                thumbsUp: up,
                thumbsDown: down,
                thumbsDownRatio: rated.length ? down / rated.length : 0,
                sourceBreakdown,
            },
            notifications: {
                tapsLast7d: taps,
                dismissLast7d: dismiss,
                shownLast7d: shown,
                tapThroughRate: shown > 0 ? taps / shown : 0,
            },
            categoryBreakdown,
        };
    }
}
