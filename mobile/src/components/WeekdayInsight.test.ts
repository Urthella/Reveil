import { computeWeekdayStats } from './WeekdayInsight';
import { HabitLog } from '../services/api';

const log = (date: string, completed: boolean, frozen = false): HabitLog =>
    ({ id: date, habitId: 'h', date, completed, frozen, moodScore: undefined, notes: '' } as any);

describe('computeWeekdayStats', () => {
    it('returns 7 buckets even when only some weekdays have logs', () => {
        const stats = computeWeekdayStats([log('2026-05-04', true), log('2026-05-05', false)]);
        expect(stats).toHaveLength(7);
    });

    it('counts completion rate per weekday', () => {
        // 2026-05-04 is Mon, 2026-05-05 Tue, 2026-05-06 Wed.
        const logs = [
            log('2026-05-04', true),
            log('2026-05-04', true),  // would never duplicate in practice but the count math must hold
            log('2026-05-05', false),
            log('2026-05-06', true),
        ];
        const stats = computeWeekdayStats(logs);
        // Find Monday (1)
        const monday = stats.find((s) => s.dayOfWeek === 1)!;
        expect(monday.total).toBe(2);
        expect(monday.completed).toBe(2);
        expect(monday.rate).toBe(1);
    });

    it('skips frozen days from the sample', () => {
        const stats = computeWeekdayStats([log('2026-05-04', false, true)]);
        const monday = stats.find((s) => s.dayOfWeek === 1)!;
        expect(monday.total).toBe(0);
        expect(monday.rate).toBe(0);
    });
});
