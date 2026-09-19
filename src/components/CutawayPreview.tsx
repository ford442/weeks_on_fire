import { Pause, Play, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CutawaySegment } from '../data/suggestions';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const MIN_DWELL_SEC = 2.5;
const COLOR_WHIP_DIALECTS = [
  'strobe',
  'whip',
  'phosphor',
  'smash',
  'chase',
  'cuts',
  'vortex',
  'hit',
] as const;

type ColorWhipDialect = (typeof COLOR_WHIP_DIALECTS)[number];

function colorWhipDialect(segmentId: string): ColorWhipDialect | null {
  const match = /color-whip-[a-h]-([a-z]+)/.exec(segmentId);
  const dialect = match?.[1];
  if (!dialect) return null;
  return (COLOR_WHIP_DIALECTS as readonly string[]).includes(dialect)
    ? (dialect as ColorWhipDialect)
    : null;
}

function ColorWhipField({ dialect }: { dialect: ColorWhipDialect }) {
  const layered = dialect === 'phosphor' || dialect === 'chase' || dialect === 'hit';

  return (
    <div className={`color-whip-field color-whip-field--${dialect}`} aria-hidden="true">
      {layered ? (
        <>
          <div className="color-whip-field__layer" />
          <div className="color-whip-field__layer" />
          <div className="color-whip-field__layer" />
        </>
      ) : null}
    </div>
  );
}

function segmentDwellSec(segment: CutawaySegment): number {
  return segment.durationSec === 0 ? MIN_DWELL_SEC : segment.durationSec;
}

interface CutawayPreviewProps {
  segments: CutawaySegment[];
  activeSegmentId: string;
  onActiveSegmentChange: (id: string) => void;
  className?: string;
}

export default function CutawayPreview({
  segments,
  activeSegmentId,
  onActiveSegmentChange,
  className = '',
}: CutawayPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const foundIndex = segments.findIndex((segment) => segment.id === activeSegmentId);
  const activeIndex = foundIndex >= 0 ? foundIndex : 0;
  const activeSegment = segments[activeIndex];

  useEffect(() => {
    if (!isPlaying || !activeSegment) return;

    const dwellMs = segmentDwellSec(activeSegment) * 1000;
    const timer = window.setTimeout(() => {
      const nextSegment = segments[activeIndex + 1];
      if (nextSegment) {
        onActiveSegmentChange(nextSegment.id);
      } else {
        setIsPlaying(false);
      }
    }, dwellMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, activeIndex, activeSegment, segments, onActiveSegmentChange]);

  if (!activeSegment) {
    return null;
  }

  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= segments.length - 1;

  const stepTo = (index: number) => {
    const target = segments[index];
    if (target) onActiveSegmentChange(target.id);
  };

  const togglePlaying = () => {
    if (!isPlaying && atEnd) {
      stepTo(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const whipDialect = colorWhipDialect(activeSegment.id);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95 ${className}`}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {activeSegment.previewUrl ? (
          <video
            key={activeSegment.id}
            src={activeSegment.previewUrl}
            className="h-full w-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : activeSegment.stillUrl ? (
          <img
            key={activeSegment.id}
            src={activeSegment.stillUrl}
            alt={activeSegment.label}
            className={`h-full w-full object-cover ${
              reducedMotion ? '' : 'animate-cutaway-ken-burns'
            }`}
            style={
              reducedMotion
                ? undefined
                : { animationDuration: `${Math.max(segmentDwellSec(activeSegment), 3)}s` }
            }
          />
        ) : whipDialect ? (
          <ColorWhipField key={activeSegment.id} dialect={whipDialect} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <Sparkles size={22} className="text-zinc-600" />
            <p className="text-xs text-zinc-500">Prompt ready · still not linked</p>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
          {activeSegment.label}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-3 py-2">
        <button
          type="button"
          onClick={() => stepTo(activeIndex - 1)}
          disabled={atStart}
          aria-label="Previous segment"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 p-2 text-zinc-300 transition hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-40"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          onClick={togglePlaying}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          className="inline-flex items-center justify-center rounded-md border border-orange-500/40 bg-orange-500/15 p-2 text-orange-200 transition hover:border-orange-400 hover:bg-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          onClick={() => stepTo(activeIndex + 1)}
          disabled={atEnd}
          aria-label="Next segment"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 p-2 text-zinc-300 transition hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-40"
        >
          <SkipForward size={14} />
        </button>
        <p className="ml-auto font-mono text-[11px] text-zinc-500">
          {activeIndex + 1} / {segments.length}
        </p>
      </div>
    </div>
  );
}
