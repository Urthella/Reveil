import { computeBadges } from './badges.util';

describe('computeBadges', () => {
    it('marks badges as earned once the streak reaches the threshold', () => {
        const badges = computeBadges(15);
        const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
        expect(byId.spark.earned).toBe(true);
        expect(byId.momentum.earned).toBe(true);
        expect(byId.rooted.earned).toBe(true);
        expect(byId.identity.earned).toBe(false);
    });

    it('reports partial progress for upcoming badges', () => {
        const badges = computeBadges(5);
        const momentum = badges.find((b) => b.id === 'momentum')!;
        expect(momentum.progress).toBeCloseTo(5 / 7);
    });

    it('caps progress at 1 for streaks past the threshold', () => {
        const badges = computeBadges(400);
        for (const b of badges) {
            expect(b.progress).toBeLessThanOrEqual(1);
            expect(b.earned).toBe(true);
        }
    });
});
