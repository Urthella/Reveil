import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { FeedbackLog } from './feedback.entity';
import { Habit } from '../habits/habit.entity';
import { TrackingService } from '../tracking/tracking.service';
import { computeStats, daysAgoIso, HabitStats } from '../common/stats.util';

type Locale = 'en' | 'tr';
type FeedbackSource = 'claude' | 'openai' | 'rule';

interface AiEngineResponse {
    feedbackText: string;
    source: FeedbackSource;
}

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);
    private readonly engineUrl =
        process.env.AI_ENGINE_URL || 'http://localhost:8000';

    constructor(
        @InjectRepository(FeedbackLog)
        private feedbackRepo: Repository<FeedbackLog>,
        @InjectRepository(Habit)
        private habitRepo: Repository<Habit>,
        private trackingService: TrackingService,
        private http: HttpService,
    ) { }

    async generate(
        userId: string,
        habitId?: string,
        locale: Locale = 'en',
        tone: 'gentle' | 'firm' | 'playful' | 'coach' = 'coach',
    ): Promise<FeedbackLog> {
        const since = daysAgoIso(30);
        const allLogs = await this.trackingService.getRecentLogs(userId, since);

        let habit: Habit | null = null;
        let stats: HabitStats;
        if (habitId) {
            habit = await this.habitRepo.findOne({ where: { id: habitId, userId } });
            const logs = allLogs.filter((l) => l.habitId === habitId);
            stats = computeStats(logs, 30, habit?.weeklyTarget ?? 7);
        } else {
            stats = computeStats(allLogs, 30);
        }

        const payload = {
            habitTitle: habit?.title,
            habitFrequency: habit?.frequency,
            habitCategory: habit?.category,
            consistencyScore: stats.consistencyScore,
            completedDays: stats.completedDays,
            totalDays: stats.totalDays,
            currentStreak: stats.currentStreak,
            locale,
            tone,
        };

        let feedbackText: string;
        let source: FeedbackSource = 'rule';

        try {
            const { data } = await firstValueFrom(
                this.http.post<AiEngineResponse>(`${this.engineUrl}/feedback`, payload, {
                    timeout: 8000,
                }),
            );
            feedbackText = data.feedbackText;
            source = data.source;
        } catch (err) {
            this.logger.warn(`AI engine unreachable, falling back to local rule: ${err?.message}`);
            feedbackText = this.localFallback(stats, habit?.title, locale);
        }

        const record = this.feedbackRepo.create({
            userId,
            habitId: habit?.id,
            feedbackText,
            source,
            consistencyScore: stats.consistencyScore,
            streak: stats.currentStreak,
        });
        return this.feedbackRepo.save(record);
    }

    async listForUser(userId: string, limit = 20): Promise<FeedbackLog[]> {
        return this.feedbackRepo.find({
            where: { userId },
            order: { generatedAt: 'DESC' },
            take: limit,
        });
    }

    async rate(userId: string, feedbackId: string, rating: -1 | 0 | 1): Promise<FeedbackLog> {
        const record = await this.feedbackRepo.findOne({ where: { id: feedbackId } });
        if (!record) throw new NotFoundException('Feedback not found');
        if (record.userId !== userId) throw new ForbiddenException();
        record.rating = rating;
        return this.feedbackRepo.save(record);
    }

    private localFallback(stats: HabitStats, habitTitle?: string, locale: Locale = 'en'): string {
        if (locale === 'tr') {
            const subject = habitTitle ? `"${habitTitle}" alışkanlığın` : 'alışkanlıkların';
            if (stats.currentStreak >= 7) {
                return `Harika — ${subject} için üst üste ${stats.currentStreak} gün. İstikrar artık kimliğin oluyor; bugünü de küçük bir adımla taşı.`;
            }
            if (stats.consistencyScore >= 70) {
                return `Güçlü ritim: son ${stats.windowDays} günde ${subject} için %${stats.consistencyScore}. Yarınki zaman dilimini şimdiden koru.`;
            }
            if (stats.consistencyScore >= 40) {
                return `Sağlam bir temel: %${stats.consistencyScore}. Bu hafta üst üste iki gün yapmayı hedefle — alışkanlıklar orada yerleşmeye başlar.`;
            }
            if (stats.completedDays === 0) {
                return `Her başlangıç sayılır. Bugün ${subject} için en küçük versiyon yeter — mükemmel plan yerine bir dakikalık başlangıç.`;
            }
            return `İlerleme doğrusal değildir. ${stats.completedDays}/${stats.totalDays} gün — bugün için tek bir küçük zafer seç, yarını o sürükler.`;
        }

        const subject = habitTitle ? `your "${habitTitle}" habit` : 'your habits';
        if (stats.currentStreak >= 7) {
            return `Outstanding — ${stats.currentStreak} days in a row on ${subject}. Consistency is becoming identity. Keep the streak alive today.`;
        }
        if (stats.consistencyScore >= 70) {
            return `Strong rhythm: ${stats.consistencyScore}% on ${subject} over the last ${stats.windowDays} days. You're building real momentum — protect tomorrow's slot.`;
        }
        if (stats.consistencyScore >= 40) {
            return `Decent baseline at ${stats.consistencyScore}% on ${subject}. Aim to stack two consecutive days this week — that's where habits start to lock in.`;
        }
        if (stats.completedDays === 0) {
            return `New beginnings count. The smallest doable version of ${subject} today is enough — a one-minute start beats a perfect plan.`;
        }
        return `Progress isn't linear. ${stats.completedDays}/${stats.totalDays} days on ${subject} — pick one tiny win for today and let it pull tomorrow with it.`;
    }
}
