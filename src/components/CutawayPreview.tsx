import { Circle, Music, Pause, Play, SkipBack, SkipForward, Sparkles, Square } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSongAudioUrl } from '../hooks/useSongAudioUrl';
import { addTake } from '../lib/capture/takes';
import { captureUnsupportedReason } from '../lib/capture/support';
import { colorWhipDialect, type ColorWhipDialect } from '../lib/colorWhip';
import { buildCutawayTimeline, spanStart, stillsTrack } from '../lib/cutawayTimeline';
import { mediaElementTrack, PlaybackGraph } from '../lib/playbackGraph';
import { formatTimecode } from '../lib/timecode';

import TakeShelf from './capture/TakeShelf';
import Still from './Still';

import type { CutawaySegment } from '../data/suggestions';
import type { CutawayCapture } from '../lib/capture/cutawayCapture';

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

type RecordState = 'idle' | 'preparing' | 'recording' | 'finishing';

interface CutawayPreviewProps {
  /** The cutaway being previewed: names the Media Session entry and its takes. */
  cutaway: { id: string; title: string; songId?: string };
  segments: CutawaySegment[];
  activeSegmentId: string;
  onActiveSegmentChange: (id: string) => void;
  className?: string;
}

/**
 * Timed stills against the cutaway's song, on one `PlaybackGraph`: Play runs the song and cuts
 * the stills on its clock; Record captures the same graph to a WebM take (`docs/capture.md`).
 */
export default function CutawayPreview({
  cutaway,
  segments,
  activeSegmentId,
  onActiveSegmentChange,
  className = '',
}: CutawayPreviewProps) {
  const reducedMotion = usePrefersReducedMotion();
  const coordinator = useMediaCoordinator();
  const audioUrl = useSongAudioUrl(cutaway.songId || undefined);
  const timeline = useMemo(() => buildCutawayTimeline(segments), [segments]);
  // Created once and never disposed: StrictMode replays effects, and a graph holds nothing
  // beyond one pending frame once every effect below has removed its track.
  const [graph] = useState(() => new PlaybackGraph({ durationSec: timeline.durationSec }));
  const [isPlaying, setIsPlaying] = useState(false);
  const [gap, setGap] = useState(false);
  const [timeSec, setTimeSec] = useState(0);
  const [audioWanted, setAudioWanted] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordError, setRecordError] = useState<string | null>(null);
  const [unsupported] = useState(() => captureUnsupportedReason());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<CutawayCapture | null>(null);
  // The segment the graph last reported; a different `activeSegmentId` came from the viewer.
  const reportedRef = useRef<string | null>(null);
  const segmentsRef = useRef(segments);
  const onChangeRef = useRef(onActiveSegmentChange);

  useEffect(() => {
    segmentsRef.current = segments;
    onChangeRef.current = onActiveSegmentChange;
  });

  const foundIndex = segments.findIndex((segment) => segment.id === activeSegmentId);
  const activeIndex = foundIndex >= 0 ? foundIndex : 0;
  const activeSegment = segments[activeIndex];
  const capturing = recordState !== 'idle';

  useEffect(() => {
    graph.reset(timeline.durationSec);
    reportedRef.current = null;
  }, [graph, timeline]);

  useEffect(() => graph.subscribe((snapshot) => setIsPlaying(snapshot.playing)), [graph]);

  useEffect(
    () =>
      graph.connect(coordinator, `cutaway:${cutaway.id}`, {
        title: cutaway.title,
        artist: 'Weeks on Fire',
        album: 'Suggestions',
      }),
    [coordinator, cutaway.id, cutaway.title, graph],
  );

  useEffect(
    () =>
      graph.setMetadata({
        title: capturing ? `Recording · ${cutaway.title}` : cutaway.title,
        artist: 'Weeks on Fire',
        album: 'Suggestions',
      }),
    [capturing, cutaway.title, graph],
  );

  // The stills follow the clock: while playing, each cut moves the board to its segment.
  useEffect(
    () =>
      graph.addTrack(
        stillsTrack(timeline, (index, inGap) => {
          setGap(inGap);
          const segment = segmentsRef.current[index];
          if (!segment || !graph.running || reportedRef.current === segment.id) return;
          reportedRef.current = segment.id;
          onChangeRef.current(segment.id);
        }),
      ),
    [graph, timeline],
  );

  // The time readout, four times a second rather than every frame.
  useEffect(() => {
    let shown = -1;
    return graph.addTrack({
      frame: ({ timeSec: now }) => {
        if (Math.abs(now - shown) < 0.25) return;
        shown = now;
        setTimeSec(now);
      },
      transport: ({ timeSec: now }) => {
        shown = now;
        setTimeSec(now);
      },
    });
  }, [graph]);

  // Picking a segment on the board (or a sight) moves the clock there.
  useEffect(() => {
    if (capturing || foundIndex < 0 || reportedRef.current === activeSegmentId) return;
    reportedRef.current = activeSegmentId;
    graph.seek(spanStart(timeline, foundIndex));
  }, [activeSegmentId, capturing, foundIndex, graph, timeline]);

  // The song joins on the first Play; a capture brings its own (recorded) copy.
  useEffect(() => {
    if (!audioUrl || !audioWanted || capturing) return;
    const element = new Audio(audioUrl);
    element.preload = 'auto';
    const remove = graph.addTrack(mediaElementTrack(element));
    return () => {
      remove();
      element.removeAttribute('src');
      element.load();
    };
  }, [audioUrl, audioWanted, capturing, graph]);

  // Leaving the board stops playback and drops an unfinished take.
  useEffect(
    () => () => {
      captureRef.current?.cancel();
      captureRef.current = null;
      graph.pause();
    },
    [graph],
  );

  const stepTo = (index: number) => {
    const target = segments[index];
    if (!target) return;
    reportedRef.current = target.id;
    graph.seek(spanStart(timeline, index));
    onActiveSegmentChange(target.id);
  };

  const togglePlaying = () => {
    setAudioWanted(true);
    graph.toggle();
  };

  const finishRecording = useCallback(async () => {
    const capture = captureRef.current;
    if (!capture) return;
    captureRef.current = null;
    setRecordState('finishing');
    try {
      const take = await capture.finish();
      addTake({
        kind: 'cutaway',
        sourceId: cutaway.id,
        title: cutaway.title,
        blob: take.blob,
        extension: take.format.extension,
        durationSec: take.durationSec,
        expectedDurationSec: timeline.durationSec,
      });
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : 'The take could not be saved.');
    } finally {
      reportedRef.current = null;
      setRecordState('idle');
    }
  }, [cutaway.id, cutaway.title, timeline.durationSec]);

  const startRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas || capturing) return;
    setRecordError(null);
    setRecordState('preparing');
    try {
      const { loadShots, startCutawayCapture } = await import('../lib/capture/cutawayCapture');
      const shots = await loadShots(
        segments.map((segment) => ({
          label: segment.label,
          stillUrl: segment.stillUrl,
          whip: colorWhipDialect(segment.id),
        })),
      );
      captureRef.current = await startCutawayCapture({
        graph,
        canvas,
        timeline,
        shots,
        audioUrl,
        motion: !reducedMotion,
        onEnd: () => void finishRecording(),
        onError: (message) => setRecordError(message),
      });
      setRecordState('recording');
    } catch (error) {
      captureRef.current = null;
      setRecordError(error instanceof Error ? error.message : 'Recording could not start.');
      setRecordState('idle');
    }
  };

  if (!activeSegment) {
    return null;
  }

  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= segments.length - 1;
  const whipDialect = colorWhipDialect(activeSegment.id);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95 ${className}`}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {/* What a take records: shown in place of the live preview while recording. */}
        <canvas
          ref={canvasRef}
          className={capturing ? 'block h-full w-full object-contain' : 'hidden'}
          role="img"
          aria-label={`${cutaway.title} capture`}
        />
        {capturing ? null : gap && isPlaying ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-zinc-500">
            No shot here yet · the song plays on
          </div>
        ) : activeSegment.previewUrl ? (
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
          <Still
            key={activeSegment.id}
            src={activeSegment.stillUrl}
            picture={activeSegment.stillPicture}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={activeSegment.label}
            className={`h-full w-full object-cover ${
              reducedMotion ? '' : 'animate-cutaway-ken-burns'
            }`}
            style={
              reducedMotion
                ? undefined
                : {
                    animationDuration: `${Math.max(
                      (timeline.spans[activeIndex]?.endSec ?? 0) -
                        (timeline.spans[activeIndex]?.startSec ?? 0),
                      3,
                    )}s`,
                  }
            }
          />
        ) : whipDialect ? (
          <ColorWhipField key={activeSegment.id} dialect={whipDialect} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <Sparkles size={22} className="text-zinc-400" />
            <p className="text-xs text-zinc-400">Prompt ready · still not linked</p>
          </div>
        )}
        {capturing ? (
          <span
            role="status"
            className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded bg-black/75 px-2 py-0.5 text-xs font-semibold text-red-300"
          >
            <Circle size={10} className="fill-red-500 text-red-500" aria-hidden="true" />
            {recordState === 'preparing'
              ? 'Loading stills…'
              : recordState === 'finishing'
                ? 'Saving take…'
                : `REC ${formatTimecode(timeSec)} / ${formatTimecode(timeline.durationSec)}`}
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-zinc-300">
            {activeSegment.label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-3 py-2">
        <button
          type="button"
          onClick={() => stepTo(activeIndex - 1)}
          disabled={atStart || capturing}
          aria-label="Previous segment"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 p-2 text-zinc-300 transition hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-40"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          onClick={togglePlaying}
          disabled={recordState === 'preparing' || recordState === 'finishing'}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          className="inline-flex items-center justify-center rounded-md border border-orange-500/40 bg-orange-500/15 p-2 text-orange-200 transition hover:border-orange-400 hover:bg-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-40"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          onClick={() => stepTo(activeIndex + 1)}
          disabled={atEnd || capturing}
          aria-label="Next segment"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 p-2 text-zinc-300 transition hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-40"
        >
          <SkipForward size={14} />
        </button>
        {recordState === 'recording' ? (
          <button
            type="button"
            onClick={() => void finishRecording()}
            aria-label="Stop take"
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <Square size={12} aria-hidden="true" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startRecording()}
            aria-label="Record take"
            disabled={capturing || unsupported !== null}
            title={
              unsupported ?? 'Record the whole preview, song included, as a take for the Timeline'
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-red-400 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-40"
          >
            <Circle size={12} className="fill-red-500 text-red-500" aria-hidden="true" />
            Record
          </button>
        )}
        <p className="ml-auto flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span
            title={
              timeline.mode === 'song'
                ? 'Cut on the segment times, against the song'
                : 'Segment times overlap or are not times: segments play one after another'
            }
          >
            {timeline.mode === 'song' ? 'song-timed' : 'sequential'}
          </span>
          {audioUrl ? <Music size={12} aria-label="Plays the song" /> : null}
          <span>
            {activeIndex + 1} / {segments.length}
          </span>
        </p>
      </div>
      {recordError ? (
        <p role="alert" className="border-t border-zinc-800 px-3 py-2 text-xs text-red-300">
          {recordError}
        </p>
      ) : null}
      <TakeShelf kind="cutaway" sourceId={cutaway.id} />
    </div>
  );
}
