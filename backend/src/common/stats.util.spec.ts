import { computeStats, daysAgoIso, isoDate } from './stats.util';
import { HabitLog } from '../tracking/habit-log.entity';

const log = (date: string, completed = true, frozen = false): HabitLog =>
    ({ date, completed, frozen, id: '', habitId: '', userId: '', moodScore: 0, notes: '', createdAt: new Date() } as any);

describe('computeStats', () => {
    it('returns 0 consistency and 0 streak when there are no logs', () => {
        const stats = computeStats([], 30);
        expect(stats.consistencyScore).toBe(0);
        expect(stats.completedDays).toBe(0);
        expect(stats.currentStreak).toBe(0);
    });

    it('counts each unique completed day once within the window', () => {
        const today = isoDate(new Date());
        const yesterday = daysAgoIso(1);
        const stats = computeStats([log(today), log(yesterday)], 30);
        expect(stats.completedDays).toBe(2);
        expect(Math.round(stats.consistencyScore)).toBe(Math.round((2 / 30) * 100));
    });

    it('extends the current streak across consecutive days', () => {
        const logs = [log(daysAgoIso(0)), log(daysAgoIso(1)), log(daysAgoIso(2))];
        const stats = computeStats(logs, 30);
        expect(stats.currentStreak).toBe(3);
    });

    it('treats no log today as a streak gap only after yesterday is missing', () => {
        const logs = [log(daysAgoIso(1)), log(daysAgoIso(2))];
        const stats = computeStats(logs, 30);
        expect(stats.currentStreak).toBe(2);
    });

    it('breaks the streak on a non-completed entry', () => {
        const logs = [log(daysAgoIso(0)), log(daysAgoIso(1), false), log(daysAgoIso(2))];
        const stats = computeStats(logs, 30);
        expect(stats.currentStreak).toBe(1);
    });

    it('walks past a frozen day without breaking the streak', () => {
        const logs = [
            log(daysAgoIso(0)),
            log(daysAgoIso(1), false, true), // frozen
            log(daysAgoIso(2)),
            log(daysAgoIso(3)),
        ];
        const stats = computeStats(logs, 30);
        expect(stats.currentStreak).toBe(3);
    });

    it('does not count a frozen day toward consistency', () => {
        const logs = [log(daysAgoIso(0), false, true)];
        const stats = computeStats(logs, 30);
        expect(stats.completedDays).toBe(0);
        expect(stats.consistencyScore).toBe(0);
    });

    it('scales consistency by the weekly target', () => {
        // 3 days/week target over 30 days expects ~13 completions.
        // Hitting 13 unique days should be 100% — even with the same raw count.
        const logs = Array.from({ length: 13 }, (_, i) => log(daysAgoIso(i)));
        const at7 = computeStats(logs, 30, 7);
        const at3 = computeStats(logs, 30, 3);
        expect(at7.consistencyScore).toBeLessThan(at3.consistencyScore);
        expect(at3.consistencyScore).toBe(100);
    });
});
