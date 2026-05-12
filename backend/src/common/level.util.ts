import { HabitLog } from '../tracking/habit-log.entity';

export interface LevelInfo {
    xp: number;
    level: number;
    xpInLevel: number;
    xpToNextLevel: number;
}

const XP_PER_COMPLETION = 10;
const XP_MOOD_BONUS = 2;
const XP_PER_STREAK_DAY = 5;

/** Total XP required to *reach* level n (n >= 1). Quadratic so it slows down. */
export function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    return 100 * (level - 1) * (level - 1);
}

export function computeXp(logs: HabitLog[], currentStreak: number): number {
    let xp = 0;
    for (const l of logs) {
        if (l.frozen) continue;
        if (l.completed) {
            xp += XP_PER_COMPLETION;
            if (typeof l.moodScore === 'number' && l.moodScore > 0) xp += XP_MOOD_BONUS;
        }
    }
    xp += Math.max(0, currentStreak) * XP_PER_STREAK_DAY;
    return xp;
}

export function levelFromXp(xp: number): LevelInfo {
    let level = 1;
    while (xpForLevel(level + 1) <= xp && level < 999) level++;
    const base = xpForLevel(level);
    const next = xpForLevel(level + 1);
    return {
        xp,
        level,
        xpInLevel: xp - base,
        xpToNextLevel: Math.max(1, next - base),
    };
}
