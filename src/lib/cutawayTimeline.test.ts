import { describe, expect, it, vi } from 'vitest';

import {
  buildCutawayTimeline,
  MIN_DWELL_SEC,
  parseClockTime,
  spanAt,
  spanStart,
  stillsTrack,
} from './cutawayTimeline';

const seg = (id: string, start: string, end: string, durationSec = 0) => ({
  id,
  start,
  end,
  durationSec,
});

describe('parseClockTime', () => {
  it('reads M:SS, H:MM:SS and bare seconds', () => {
    expect(parseClockTime('0:06')).toBe(6);
    expect(parseClockTime('1:08')).toBe(68);
    expect(parseClockTime('1:02:03.5')).toBe(3723.5);
    expect(parseClockTime(' 12.5 ')).toBe(12.5);
  });

  it('refuses what is not a time', () => {
    expect(parseClockTime('Button')).toBeNull();
    expect(parseClockTime('5:40 PM')).toBeNull();
    expect(parseClockTime('0:75')).toBeNull();
    expect(parseClockTime('')).toBeNull();
  });
});

describe('buildCutawayTimeline', () => {
  it('cuts on the song times when every segment is a time, in order', () => {
    const timeline = buildCutawayTimeline([
      seg('a', '0:00', '0:06', 6),
      seg('b', '0:06', '0:12', 6),
      seg('c', '0:40', '0:48', 8),
    ]);
    expect(timeline.mode).toBe('song');
    expect(timeline.durationSec).toBe(48);
    expect(timeline.spans.map((span) => [span.startSec, span.endSec])).toEqual([
      [0, 6],
      [6, 12],
      [40, 48],
    ]);
  });

  it('plays segments one after another when the times overlap or are not times', () => {
    const timeline = buildCutawayTimeline([
      seg('card', '0:00', '0:00', 0), // a gag's still card
      seg('punch', '0:00', '0:07', 7),
      seg('button', 'Button', 'Button', 3),
    ]);
    expect(timeline.mode).toBe('sequential');
    expect(timeline.spans.map((span) => [span.startSec, span.endSec])).toEqual([
      [0, MIN_DWELL_SEC],
      [MIN_DWELL_SEC, MIN_DWELL_SEC + 7],
      [MIN_DWELL_SEC + 7, MIN_DWELL_SEC + 10],
    ]);
  });

  it('is empty for no segments', () => {
    expect(buildCutawayTimeline([])).toEqual({ mode: 'sequential', spans: [], durationSec: 0 });
  });
});

describe('spanAt', () => {
  const timeline = buildCutawayTimeline([
    seg('lead', '0:05', '0:10'),
    seg('a', '0:10', '0:20'),
    seg('b', '0:30', '0:40'),
  ]);

  it('finds the shot on screen and how far through it is', () => {
    expect(spanAt(timeline, 15)).toMatchObject({ index: 1, progress: 0.5 });
    expect(spanAt(timeline, 15).span?.segmentId).toBe('a');
  });

  it('reports gaps: before the first shot, and between two', () => {
    expect(spanAt(timeline, 2)).toMatchObject({ span: null, index: 0 });
    expect(spanAt(timeline, 25)).toMatchObject({ span: null, index: 1 });
  });

  it('holds the last shot on the very last frame', () => {
    expect(spanAt(timeline, 40)).toMatchObject({ index: 2, progress: 1 });
  });

  it('steps to a segment by its start', () => {
    expect(spanStart(timeline, 2)).toBe(30);
    expect(spanStart(timeline, 9)).toBe(0);
  });
});

describe('stillsTrack', () => {
  it('reports cuts and gaps, not every frame', () => {
    const timeline = buildCutawayTimeline([seg('a', '0:00', '0:05'), seg('b', '0:08', '0:10')]);
    const onChange = vi.fn();
    const track = stillsTrack(timeline, onChange);
    for (const timeSec of [0, 1, 2, 4.9, 5, 6, 8, 9]) {
      track.frame?.({ timeSec, continuous: true, playing: true });
    }
    expect(onChange.mock.calls).toEqual([
      [0, false],
      [0, true],
      [1, false],
    ]);
  });
});
