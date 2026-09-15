import { describe, expect, it } from 'vitest';

import { formatTimecode } from './timecode';

describe('formatTimecode', () => {
  it('formats seconds under a minute', () => {
    expect(formatTimecode(16)).toBe('0:16');
  });

  it('formats minutes and pads seconds', () => {
    expect(formatTimecode(110)).toBe('1:50');
  });

  it('floors fractional seconds and clamps negatives', () => {
    expect(formatTimecode(32.9)).toBe('0:32');
    expect(formatTimecode(-4)).toBe('0:00');
  });
});
