import { computeXp, levelFromXp, xpForLevel } from './level.util';
import { HabitLog } from '../tracking/habit-log.entity';

const log = (completed: boolean, moodScore?: number, frozen = false): HabitLog =>
    ({ id: '', userId: '', habitId: '', date: '2026-05-04', completed, frozen, moodScore, notes: '', createdAt: new Date() } as any);

describe('XP and level math', () => {
    it('awards 10 xp per completion + 2 for mood + 5 per streak day', () => {
        const logs = [log(true, 8), log(true), log(false), log(true, 3, true)];
        // 12 + 10 + 0 + 0 (frozen excluded) = 22, plus streak 3 → 22 + 15 = 37.
        expect(computeXp(logs, 3)).toBe(37);
    });

    it('xpForLevel grows quadratically', () => {
        expect(xpForLevel(1)).toBe(0);
        expect(xpForLevel(2)).toBe(100);
        expect(xpForLevel(3)).toBe(400);
        expect(xpForLevel(4)).toBe(900);
    });

    it('levelFromXp resolves correctly across boundaries', () => {
        expect(levelFromXp(0).level).toBe(1);
        expect(levelFromXp(99).level).toBe(1);
        expect(levelFromXp(100).level).toBe(2);
        expect(levelFromXp(399).level).toBe(2);
        expect(levelFromXp(400).level).toBe(3);

        const info = levelFromXp(250);
        expect(info.level).toBe(2);
        expect(info.xpInLevel).toBe(150);          // 250 - 100
        expect(info.xpToNextLevel).toBe(300);      // 400 - 100
    });
});
