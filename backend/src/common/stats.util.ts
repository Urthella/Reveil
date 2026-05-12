import { HabitLog } from '../tracking/habit-log.entity';

export interface HabitStats {
    consistencyScore: number; // 0..100
    completedDays: number;
    totalDays: number;
    currentStreak: number;
    windowDays: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export function daysAgoIso(days: number, ref: Date = new Date()): string {
    const d = new Date(ref.getTime() - days * ONE_DAY_MS);
    return isoDate(d);
}

export function computeStats(logs: HabitLog[], windowDays = 30, expectedDaysPerWeek = 7): HabitStats {
    const today = new Date();
    const completedDates = new Set(
        logs.filter((l) => l.completed && !l.frozen).map((l) => l.date),
    );
    const frozenDates = new Set(
        logs.filter((l) => l.frozen).map((l) => l.date),
    );

    let completedDays = 0;
    for (let i = 0; i < windowDays; i++) {
        if (completedDates.has(daysAgoIso(i, today))) completedDays++;
    }

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
        const date = daysAgoIso(i, today);
        if (completedDates.has(date)) {
            currentStreak++;
        } else if (frozenDates.has(date)) {
            // Freeze day — walk past without incrementing the streak.
            continue;
        } else if (i === 0) {
            // Today not yet logged — keep walking back.
            continue;
        } else {
            break;
        }
    }

    // Expected completions across the window — e.g. a 3×/week target over a 30-day
    // window expects ~12.86 completions, so completing 13 days clamps to 100%.
    const safeTarget = Math.max(1, Math.min(7, expectedDaysPerWeek || 7));
    const expected = Math.max(1, (windowDays * safeTarget) / 7);
    const ratio = Math.min(1, completedDays / expected);
    const consistencyScore = Math.round(ratio * 100);
    return {
        consistencyScore,
        completedDays,
        totalDays: windowDays,
        currentStreak,
        windowDays,
    };
}
