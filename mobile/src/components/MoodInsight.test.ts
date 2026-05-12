import { computeMoodStats } from './MoodInsight';
import { HabitLog } from '../services/api';

const log = (date: string, completed: boolean, moodScore?: number, frozen = false): HabitLog =>
    ({ id: date, habitId: 'h', date, completed, frozen, moodScore } as any);

describe('computeMoodStats', () => {
    it('returns zeros when no mood tags are present', () => {
        const stats = computeMoodStats([log('2026-05-01', true), log('2026-05-02', false)]);
        expect(stats.sampleSize).toBe(0);
        expect(stats.correlation).toBe(0);
    });

    it('reports a positive correlation when completed days have higher mood', () => {
        const stats = computeMoodStats([
            log('2026-05-01', true, 9),
            log('2026-05-02', true, 8),
            log('2026-05-03', false, 3),
            log('2026-05-04', false, 4),
            log('2026-05-05', true, 9),
        ]);
        expect(stats.correlation).toBeGreaterThan(0.7);
        expect(stats.avgMoodOnCompleted).toBeGreaterThan(stats.avgMoodOnSkipped);
    });

    it('ignores frozen days from the sample', () => {
        const stats = computeMoodStats([
            log('2026-05-01', true, 9),
            log('2026-05-02', false, 3, true), // frozen — excluded
            log('2026-05-03', true, 9),
            log('2026-05-04', false, 4),
        ]);
        expect(stats.sampleSize).toBe(3);
    });
});
