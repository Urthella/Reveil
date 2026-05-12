import { parseCsv } from './export.service';

describe('parseCsv', () => {
    it('parses simple rows', () => {
        const rows = parseCsv('a,b,c\n1,2,3\n4,5,6');
        expect(rows).toEqual([['a', 'b', 'c'], ['1', '2', '3'], ['4', '5', '6']]);
    });

    it('handles quoted fields with embedded commas and escaped quotes', () => {
        const rows = parseCsv('title,note\n"Hello, world","She said ""hi"""');
        expect(rows[1]).toEqual(['Hello, world', 'She said "hi"']);
    });

    it('ignores trailing newlines and CRs', () => {
        const rows = parseCsv('a\r\nb\r\n');
        expect(rows).toEqual([['a'], ['b']]);
    });

    it('preserves empty trailing fields', () => {
        const rows = parseCsv('a,b,c\n1,,3');
        expect(rows[1]).toEqual(['1', '', '3']);
    });
});
