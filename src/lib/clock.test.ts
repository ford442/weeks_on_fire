import { describe, expect, it } from 'vitest';

import { broadcastOffset, formatClock, minutesOfDay, parseClock, toClock } from './clock';

describe('parseClock', () => {
  it('reads HH:MM, 24-hour', () => {
    expect(parseClock('00:00')).toBe(0);
    expect(parseClock('02:30')).toBe(150);
    expect(parseClock('23:59')).toBe(1439);
  });

  it.each(['2:30', '24:00', '12:60', '12:5', '1230', '02:30pm', ' 02:30', '', 'noon'])(
    'rejects %j',
    (value) => {
      expect(parseClock(value)).toBeUndefined();
    },
  );

  it('rejects missing values', () => {
    expect(parseClock(null)).toBeUndefined();
    expect(parseClock(undefined)).toBeUndefined();
  });
});

describe('formatClock / toClock', () => {
  it('formats a 12-hour label, with 12 for midnight and noon', () => {
    expect(formatClock(0)).toBe('12:00 AM');
    expect(formatClock(5)).toBe('12:05 AM');
    expect(formatClock(150)).toBe('2:30 AM');
    expect(formatClock(720)).toBe('12:00 PM');
    expect(formatClock(23 * 60 + 44)).toBe('11:44 PM');
  });

  it('formats the 24-hour form used in data and URLs', () => {
    expect(toClock(0)).toBe('00:00');
    expect(toClock(224)).toBe('03:44');
    expect(toClock(23 * 60 + 59)).toBe('23:59');
  });

  it('wraps out-of-range minutes into one day', () => {
    expect(toClock(1440)).toBe('00:00');
    expect(toClock(-1)).toBe('23:59');
    expect(formatClock(1440 + 150)).toBe('2:30 AM');
  });

  it('round-trips every minute of the day', () => {
    for (let minute = 0; minute < 1440; minute += 1) {
      expect(parseClock(toClock(minute))).toBe(minute);
    }
  });
});

describe('minutesOfDay', () => {
  it('reads the local clock of a Date', () => {
    expect(minutesOfDay(new Date(2026, 0, 5, 3, 44, 59))).toBe(224);
    expect(minutesOfDay(new Date(2026, 0, 5, 0, 0, 0))).toBe(0);
  });
});

describe('broadcastOffset', () => {
  it('counts minutes from the start of the broadcast day, wrapping midnight', () => {
    const dayStart = parseClock('06:00')!;
    expect(broadcastOffset(parseClock('06:00')!, dayStart)).toBe(0);
    expect(broadcastOffset(parseClock('23:00')!, dayStart)).toBe(17 * 60);
    expect(broadcastOffset(parseClock('02:00')!, dayStart)).toBe(20 * 60);
    expect(broadcastOffset(parseClock('05:59')!, dayStart)).toBe(23 * 60 + 59);
  });
});
