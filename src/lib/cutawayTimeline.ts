import type { PlaybackTrack } from './playbackGraph';

/**
 * A cutaway's segments laid on one clock, for the in-hub preview and its capture.
 *
 * - **song**: every segment's `start` / `end` is a time, in order, none overlapping. Segments sit
 *   at those song times, as `scripts/assemble-cutaway.py` cuts them; a gap between them (a verse
 *   with no shot yet) is a gap in the picture too.
 * - **sequential**: anything else (overlapping times, `"Button"`, a 0 s still card). Segments play
 *   one after another for their `durationSec` (`MIN_DWELL_SEC` for a 0 s still card), as the
 *   preview always has.
 */

export const MIN_DWELL_SEC = 2.5;

export interface TimedSegment {
  id: string;
  start: string;
  end: string;
  durationSec: number;
}

export interface TimelineSpan {
  index: number;
  segmentId: string;
  startSec: number;
  endSec: number;
}

export interface CutawayTimeline {
  mode: 'song' | 'sequential';
  spans: TimelineSpan[];
  durationSec: number;
}

const CLOCK = /^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/;

/** Seconds from `"M:SS"`, `"H:MM:SS"` or a bare number of seconds; null for anything else. */
export function parseClockTime(value: string): number | null {
  const text = value.trim();
  const clock = CLOCK.exec(text);
  if (clock) {
    const [, hours, minutes = '0', seconds = '0'] = clock;
    if (Number(seconds) >= 60 || (hours !== undefined && Number(minutes) >= 60)) return null;
    return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds);
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  return Number(text);
}

function dwellSec(segment: TimedSegment): number {
  return segment.durationSec > 0 ? segment.durationSec : MIN_DWELL_SEC;
}

export function buildCutawayTimeline(segments: readonly TimedSegment[]): CutawayTimeline {
  const songSpans: TimelineSpan[] = [];
  let songTimed = segments.length > 0;
  let previousEnd = 0;
  segments.forEach((segment, index) => {
    if (!songTimed) return;
    const startSec = parseClockTime(segment.start);
    const endSec = parseClockTime(segment.end);
    if (startSec === null || endSec === null || endSec <= startSec || startSec < previousEnd) {
      songTimed = false;
      return;
    }
    songSpans.push({ index, segmentId: segment.id, startSec, endSec });
    previousEnd = endSec;
  });
  if (songTimed) return { mode: 'song', spans: songSpans, durationSec: previousEnd };

  let cursor = 0;
  const spans = segments.map((segment, index) => {
    const span = {
      index,
      segmentId: segment.id,
      startSec: cursor,
      endSec: cursor + dwellSec(segment),
    };
    cursor = span.endSec;
    return span;
  });
  return { mode: 'sequential', spans, durationSec: cursor };
}

export interface SpanPosition {
  /** The span on screen, or null in a gap (before the first shot, or between two). */
  span: TimelineSpan | null;
  /** The segment to show as current: the one on screen, or the last one to have started. */
  index: number;
  /** 0..1 through the span on screen (0 in a gap). */
  progress: number;
}

export function spanAt(timeline: CutawayTimeline, timeSec: number): SpanPosition {
  const { spans } = timeline;
  let index = 0;
  for (let i = 0; i < spans.length; i += 1) {
    const span = spans[i];
    if (!span || span.startSec > timeSec) break;
    index = i;
    const last = i === spans.length - 1;
    if (timeSec < span.endSec || (last && timeSec <= span.endSec)) {
      const length = span.endSec - span.startSec;
      return { span, index, progress: length > 0 ? (timeSec - span.startSec) / length : 0 };
    }
  }
  return { span: null, index, progress: 0 };
}

/** The span's start, for stepping to a segment. */
export function spanStart(timeline: CutawayTimeline, index: number): number {
  return timeline.spans[index]?.startSec ?? 0;
}

/**
 * A graph track that reports which segment is on screen. `onChange(index, gap)` fires when either
 * changes, so React re-renders on cuts, not on every frame.
 */
export function stillsTrack(
  timeline: CutawayTimeline,
  onChange: (index: number, gap: boolean) => void,
): PlaybackTrack {
  let last: { index: number; gap: boolean } | null = null;
  const report = (timeSec: number) => {
    const { span, index } = spanAt(timeline, timeSec);
    const gap = span === null;
    if (last && last.index === index && last.gap === gap) return;
    last = { index, gap };
    onChange(index, gap);
  };
  return {
    transport: ({ timeSec }) => report(timeSec),
    frame: ({ timeSec }) => report(timeSec),
  };
}
