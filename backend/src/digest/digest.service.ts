import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../habits/habit.entity';
import { HabitLog } from '../tracking/habit-log.entity';
import { computeStats, daysAgoIso } from '../common/stats.util';

export interface WeeklyDigest {
    weekEndDate: string;
    summary: string;
    overall: {
        consistencyScore: number;
        completedDays: number;
        totalDays: number;
        currentStreak: number;
    };
    perHabit: {
        habitId: string;
        title: string;
        category: string;
        consistencyScore: number;
        completedDays: number;
        currentStreak: number;
    }[];
    topHabit?: { habitId: string; title: string; consistencyScore: number };
    needsAttention?: { habitId: string; title: string; consistencyScore: number };
}

@Injectable()
export class DigestService {
    private readonly logger = new Logger(DigestService.name);

    constructor(
        @InjectRepository(Habit) private habits: Repository<Habit>,
        @InjectRepository(HabitLog) private logs: Repository<HabitLog>,
    ) { }

    async buildForUser(userId: string, locale: 'en' | 'tr' = 'en'): Promise<WeeklyDigest> {
        const habits = await this.habits.find({ where: { userId } });
        const sinceWeek = daysAgoIso(6);
        const recent = await this.logs
            .createQueryBuilder('log')
            .where('log.userId = :userId', { userId })
            .andWhere('log.date >= :sinceWeek', { sinceWeek })
            .getMany();

        const overallStats = computeStats(recent, 7);
        const perHabit = habits.map((h) => {
            const habitLogs = recent.filter((l) => l.habitId === h.id);
            const stats = computeStats(habitLogs, 7);
            return {
                habitId: h.id,
                title: h.title,
                category: h.category ?? 'general',
                consistencyScore: stats.consistencyScore,
                completedDays: stats.completedDays,
                currentStreak: stats.currentStreak,
            };
        });

        const ranked = [...perHabit].sort((a, b) => b.consistencyScore - a.consistencyScore);
        const topHabit = ranked[0]
            ? { habitId: ranked[0].habitId, title: ranked[0].title, consistencyScore: ranked[0].consistencyScore }
            : undefined;
        const needsAttention = ranked.length > 1 && ranked[ranked.length - 1].consistencyScore < 50
            ? {
                habitId: ranked[ranked.length - 1].habitId,
                title: ranked[ranked.length - 1].title,
                consistencyScore: ranked[ranked.length - 1].consistencyScore,
            }
            : undefined;

        return {
            weekEndDate: daysAgoIso(0),
            summary: this.summarize(locale, overallStats.consistencyScore, overallStats.currentStreak, topHabit, needsAttention),
            overall: {
                consistencyScore: overallStats.consistencyScore,
                completedDays: overallStats.completedDays,
                totalDays: overallStats.totalDays,
                currentStreak: overallStats.currentStreak,
            },
            perHabit,
            topHabit,
            needsAttention,
        };
    }

    private summarize(
        locale: 'en' | 'tr',
        score: number,
        streak: number,
        top?: { title: string; consistencyScore: number },
        attention?: { title: string; consistencyScore: number },
    ): string {
        if (locale === 'tr') {
            const parts = [`Bu hafta %${score} tutarlılık, ${streak} günlük seri.`];
            if (top) parts.push(`En güçlü: "${top.title}" (%${top.consistencyScore}).`);
            if (attention) parts.push(`Dikkat: "${attention.title}" geride kaldı (%${attention.consistencyScore}).`);
            return parts.join(' ');
        }
        const parts = [`This week: ${score}% consistency, ${streak}-day streak.`];
        if (top) parts.push(`Strongest: "${top.title}" at ${top.consistencyScore}%.`);
        if (attention) parts.push(`Needs attention: "${attention.title}" (${attention.consistencyScore}%).`);
        return parts.join(' ');
    }
}
