import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../habits/habit.entity';
import { TrackingService } from '../tracking/tracking.service';
import { computeStats, daysAgoIso, isoDate } from '../common/stats.util';
import { Badge, computeBadges } from '../common/badges.util';
import { computeXp, levelFromXp, LevelInfo } from '../common/level.util';

export interface HabitWithProgress {
    id: string;
    title: string;
    frequency: string;
    targetCount: number;
    timeOfDay: string | null;
    category: string;
    weeklyTarget: number;
    consistencyScore: number;
    currentStreak: number;
    completedToday: boolean;
    completedDays: number;
    /** Last 7 days, oldest→newest. 1 = completed, 0 = skipped/empty, -1 = frozen. */
    last7: number[];
}

export interface CategoryRollup {
    category: string;
    habitCount: number;
    consistencyScore: number;   // average across the category's habits, 0..100
    currentStreak: number;      // best streak in that category
}

export interface DashboardResponse {
    habits: HabitWithProgress[];
    consistencyScore: number;
    currentStreak: number;
    longestStreak: number;
    completedToday: number;
    totalHabits: number;
    weeklySummary: {
        date: string;
        completed: number;
        total: number;
    }[];
    badges: Badge[];
    categoryBreakdown: CategoryRollup[];
    progress: LevelInfo;
}

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Habit)
        private habitRepo: Repository<Habit>,
        private trackingService: TrackingService,
    ) { }

    async getDashboard(userId: string): Promise<DashboardResponse> {
        const habits = await this.habitRepo.find({
            where: { userId, active: true },
            order: { sortIndex: 'ASC', createdAt: 'DESC' },
        });

        const sinceDate = daysAgoIso(30);
        const allLogs = await this.trackingService.getRecentLogs(userId, sinceDate);

        const today = isoDate(new Date());

        const habitsWithProgress: HabitWithProgress[] = habits.map((h) => {
            const habitLogs = allLogs.filter((l) => l.habitId === h.id);
            const stats = computeStats(habitLogs, 30, h.weeklyTarget ?? 7);
            const completedToday = habitLogs.some(
                (l) => l.date === today && l.completed,
            );
            const last7: number[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = daysAgoIso(i);
                const entry = habitLogs.find((l) => l.date === d);
                if (!entry) last7.push(0);
                else if (entry.frozen) last7.push(-1);
                else last7.push(entry.completed ? 1 : 0);
            }
            return {
                id: h.id,
                title: h.title,
                frequency: h.frequency,
                targetCount: h.targetCount,
                timeOfDay: h.timeOfDay ?? null,
                category: h.category ?? 'general',
                weeklyTarget: h.weeklyTarget ?? 7,
                consistencyScore: stats.consistencyScore,
                currentStreak: stats.currentStreak,
                completedToday,
                completedDays: stats.completedDays,
                last7,
            };
        });

        const overallStats = computeStats(allLogs, 30);
        const completedToday = habitsWithProgress.filter((h) => h.completedToday).length;

        const weeklySummary = this.buildWeeklySummary(allLogs, habits.length);

        // Longest streak across any habit (motivational anchor for badges).
        const longestStreak = habitsWithProgress.reduce(
            (max, h) => Math.max(max, h.currentStreak),
            overallStats.currentStreak,
        );

        const totalXp = computeXp(allLogs, overallStats.currentStreak);
        const progress = levelFromXp(totalXp);

        return {
            habits: habitsWithProgress,
            consistencyScore: overallStats.consistencyScore,
            currentStreak: overallStats.currentStreak,
            longestStreak,
            completedToday,
            totalHabits: habits.length,
            weeklySummary,
            badges: computeBadges(longestStreak),
            categoryBreakdown: this.rollupByCategory(habitsWithProgress),
            progress,
        };
    }

    private rollupByCategory(habits: HabitWithProgress[]): CategoryRollup[] {
        const buckets = new Map<string, HabitWithProgress[]>();
        for (const h of habits) {
            const key = h.category || 'general';
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(h);
        }
        const rollups: CategoryRollup[] = [];
        for (const [category, items] of buckets.entries()) {
            const avg = items.reduce((sum, h) => sum + h.consistencyScore, 0) / items.length;
            const best = items.reduce((m, h) => Math.max(m, h.currentStreak), 0);
            rollups.push({
                category,
                habitCount: items.length,
                consistencyScore: Math.round(avg),
                currentStreak: best,
            });
        }
        return rollups.sort((a, b) => b.habitCount - a.habitCount);
    }

    private buildWeeklySummary(logs: { date: string; completed: boolean }[], totalHabits: number) {
        const days: { date: string; completed: number; total: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysAgoIso(i);
            const completed = logs.filter((l) => l.date === d && l.completed).length;
            days.push({ date: d, completed, total: totalHabits });
        }
        return days;
    }
}
