import { describePath } from './issues';
import { locateJson } from './jsonLocate';
import { keyframeLists } from './schema';

import type { SequenceGraph } from './types';

/** One keyframe track on the editor's strip. */
export interface TimelineRow {
  /** `camera.angle`, `vars.lift`, `node core: squash`, `clip box.translation`. */
  label: string;
  /** Path of the keyframe list in the graph JSON. */
  path: (string | number)[];
  times: number[];
}

/** Every keyframe list in the graph, labelled, in document order. Markers come separately. */
export function timelineRows(graph: SequenceGraph): TimelineRow[] {
  return keyframeLists(graph)
    .filter((list) => list.path[0] !== 'markers')
    .map((list) => ({
      label: describePath(graph, list.path)
        .replace(/: keys$/, '')
        .replace(/:$/, ''),
      path: list.path,
      times: list.keys.map((k) => k.t),
    }));
}

/** Two decimals is finer than a frame at 60 fps and keeps the JSON readable. */
export function roundTime(t: number): number {
  return Math.round(t * 100) / 100;
}

/**
 * Moves keyframe `index` of the list at `path` to `timeSec`, editing only that number in `text`
 * (the author's formatting stays). The time is clamped to `[0, durationSec]` and kept strictly
 * between its neighbours, so a drag can never reorder keys. Returns the new text, or null if the
 * key cannot be found (the text changed under the drag, or is not JSON).
 */
export function retimeKey(
  text: string,
  path: readonly (string | number)[],
  index: number,
  timeSec: number,
  durationSec: number,
  neighbours: { before?: number; after?: number },
): string | null {
  const spans = locateJson(text);
  const span = spans?.get(JSON.stringify([...path, index, 't']));
  if (!span) return null;
  const step = 0.01;
  const lo = Math.max(0, neighbours.before === undefined ? 0 : neighbours.before + step);
  const hi = Math.min(
    durationSec,
    neighbours.after === undefined ? durationSec : neighbours.after - step,
  );
  if (lo > hi) return null;
  const t = roundTime(Math.min(hi, Math.max(lo, timeSec)));
  return `${text.slice(0, span.from)}${String(t)}${text.slice(span.to)}`;
}
