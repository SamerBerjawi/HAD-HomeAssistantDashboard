import { describe, expect, it } from 'vitest';
import { groupBy, matches, SEARCH_FROM } from '@/pro/lib/sheetLists';

describe('sheetLists', () => {
  it('groups by key in first-seen order', () => {
    const rows = [
      { n: 'a', room: 'Kitchen' },
      { n: 'b', room: 'Hall' },
      { n: 'c', room: 'Kitchen' }
    ];
    expect(groupBy(rows, (r) => r.room)).toEqual([
      { key: 'Kitchen', items: [rows[0], rows[2]] },
      { key: 'Hall', items: [rows[1]] }
    ]);
  });

  it('puts empty keys under Other and moves `last` keys to the end', () => {
    const rows = [{ room: '' }, { room: 'Hall' }, { room: 'Kitchen' }];
    expect(groupBy(rows, (r) => r.room, ['Other', 'Hall']).map((g) => g.key)).toEqual(['Kitchen', 'Other', 'Hall']);
  });

  it('matches case-insensitively on any text and ignores missing ones', () => {
    expect(matches('kit', 'Ceiling', null, 'Kitchen')).toBe(true);
    expect(matches(' LAMP ', undefined, 'Desk lamp')).toBe(true);
    expect(matches('garage', 'Hall', null)).toBe(false);
  });

  it('matches everything for an empty query', () => {
    expect(matches('   ', 'Anything')).toBe(true);
    expect(SEARCH_FROM).toBeGreaterThan(1);
  });
});
