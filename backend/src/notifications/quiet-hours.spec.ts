import { isInQuietHours } from './reminder.scheduler';

describe('isInQuietHours', () => {
    it('returns false when either bound is missing', () => {
        expect(isInQuietHours('12:00', null, '08:00')).toBe(false);
        expect(isInQuietHours('12:00', '22:00', null)).toBe(false);
    });

    it('handles a daytime window correctly', () => {
        expect(isInQuietHours('14:30', '12:00', '17:00')).toBe(true);
        expect(isInQuietHours('11:59', '12:00', '17:00')).toBe(false);
        expect(isInQuietHours('17:00', '12:00', '17:00')).toBe(false);
    });

    it('handles an overnight window', () => {
        expect(isInQuietHours('23:30', '22:00', '07:00')).toBe(true);
        expect(isInQuietHours('06:59', '22:00', '07:00')).toBe(true);
        expect(isInQuietHours('07:00', '22:00', '07:00')).toBe(false);
        expect(isInQuietHours('12:00', '22:00', '07:00')).toBe(false);
    });
});
