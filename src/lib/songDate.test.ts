import { describe, expect, it } from 'vitest';
import { formatSongDate } from './songDate';

describe('formatSongDate', () => {
  it('formats an ISO calendar date as day, short month, year', () => {
    expect(formatSongDate('2026-10-06')).toBe('6 Oct 2026');
    expect(formatSongDate('2026-05-07')).toBe('7 May 2026');
    expect(formatSongDate('2026-09-14')).toBe('14 Sep 2026');
  });

  it('returns malformed input unchanged', () => {
    expect(formatSongDate('soon')).toBe('soon');
  });
});
