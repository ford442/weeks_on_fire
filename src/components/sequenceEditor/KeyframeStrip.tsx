import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { formatTimecode } from '../../lib/timecode';

import type { GraphMarker } from '../../sequences/graph/types';
import type { TimelineRow } from '../../sequences/graph/timeline';

interface KeyframeStripProps {
  rows: TimelineRow[];
  markers: GraphMarker[];
  durationSec: number;
  timeSec: number;
  onSeek: (timeSec: number) => void;
  /** Move key `index` of `row` to `timeSec` (the editor clamps and rewrites the JSON). */
  onRetime: (row: TimelineRow, index: number, timeSec: number) => void;
}

const NUDGE = 0.05;

/** Seconds between ruler ticks: about ten ticks whatever the length. */
function tickStep(durationSec: number): number {
  return [0.5, 1, 2, 5, 10, 15, 30].find((step) => durationSec / step <= 12) ?? 30;
}

/**
 * Every keyframe track in the graph against the film clock. Click a track to scrub the player;
 * drag a key (or focus it and use ←/→, Shift for whole seconds) to retime it. Retiming edits only
 * that key's `t` in the JSON, so the author's formatting stays.
 */
export default function KeyframeStrip({
  rows,
  markers,
  durationSec,
  timeSec,
  onSeek,
  onRetime,
}: KeyframeStripProps) {
  const [drag, setDrag] = useState<{ row: number; index: number; timeSec: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const share = (t: number) => `${(Math.min(durationSec, Math.max(0, t)) / durationSec) * 100}%`;

  const timeAt = (clientX: number): number => {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track || track.width === 0) return 0;
    const u = (clientX - track.left) / track.width;
    return Math.min(durationSec, Math.max(0, u * durationSec));
  };

  const step = tickStep(durationSec);
  const ticks = Array.from({ length: Math.floor(durationSec / step) + 1 }, (_, i) => i * step);

  const onKeyDown = (event: KeyboardEvent, row: TimelineRow, index: number) => {
    const t = row.times[index] ?? 0;
    const delta = event.shiftKey ? 1 : NUDGE;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      onRetime(row, index, t + (event.key === 'ArrowLeft' ? -delta : delta));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSeek(t);
    }
  };

  return (
    <div className="rounded-md border border-zinc-800 bg-black/60 text-xs text-zinc-400">
      <div className="grid grid-cols-[11rem_minmax(0,1fr)] border-b border-zinc-800">
        <div className="px-2 py-1.5 font-semibold text-zinc-300">
          {formatTimecode(timeSec)} / {formatTimecode(durationSec)}
        </div>
        {/* Ruler: click to scrub. */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Scrub the film"
          aria-valuemin={0}
          aria-valuemax={durationSec}
          aria-valuenow={Math.round(timeSec * 100) / 100}
          className="relative h-7 cursor-pointer"
          onPointerDown={(event) => onSeek(timeAt(event.clientX))}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') onSeek(Math.max(0, timeSec - 0.5));
            if (event.key === 'ArrowRight') onSeek(Math.min(durationSec, timeSec + 0.5));
          }}
        >
          {ticks.map((t) => (
            <span
              key={t}
              // The tick at the very end labels to its left, inside the track.
              className={`absolute top-0 h-full leading-7 text-zinc-500 ${
                t >= durationSec ? '-translate-x-full border-r pr-1' : 'border-l pl-1'
              } border-zinc-800`}
              style={{ left: share(t) }}
            >
              {t}
            </span>
          ))}
          {markers.map((marker) => (
            <span
              key={`${marker.t}-${marker.label}`}
              title={`${marker.label} (${marker.t}s)`}
              className="absolute top-0 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-orange-400"
              style={{ left: share(marker.t) }}
            />
          ))}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-orange-300"
            style={{ left: share(timeSec) }}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-2 py-3 text-zinc-500">
          No keyframes yet. Lists of <code className="text-zinc-300">{'{ "t", "v" }'}</code>{' '}
          anywhere in the graph show up here as tracks.
        </p>
      ) : (
        <ul className="max-h-56 overflow-y-auto">
          {rows.map((row, rowIndex) => (
            <li
              key={row.path.join('.')}
              className="grid grid-cols-[11rem_minmax(0,1fr)] border-b border-zinc-900 last:border-b-0"
            >
              <span
                className="truncate px-2 py-1 font-mono text-[11px] text-zinc-300"
                title={row.label}
              >
                {row.label}
              </span>
              <div
                className="relative h-6 cursor-pointer"
                onPointerDown={(event) => {
                  if (event.target === event.currentTarget) onSeek(timeAt(event.clientX));
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-px bg-orange-300/50"
                  style={{ left: share(timeSec) }}
                />
                {row.times.map((t, index) => {
                  const shown =
                    drag && drag.row === rowIndex && drag.index === index ? drag.timeSec : t;
                  return (
                    <button
                      key={index}
                      type="button"
                      aria-label={`${row.label} key ${index + 1} at ${t} seconds`}
                      title={`${row.label} · ${shown.toFixed(2)}s`}
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-orange-200 bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      style={{ left: share(shown) }}
                      onKeyDown={(event) => onKeyDown(event, row, index)}
                      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDrag({ row: rowIndex, index, timeSec: t });
                      }}
                      onPointerMove={(event) => {
                        if (!drag || drag.row !== rowIndex || drag.index !== index) return;
                        setDrag({ ...drag, timeSec: timeAt(event.clientX) });
                      }}
                      onPointerUp={() => {
                        if (!drag) return;
                        setDrag(null);
                        if (Math.abs(drag.timeSec - t) > 0.004) onRetime(row, index, drag.timeSec);
                        else onSeek(t);
                      }}
                      onPointerCancel={() => setDrag(null)}
                    />
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
