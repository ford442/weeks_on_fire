import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { shouldAnimate } from '../lib/webgl/loop';
import { PlaybackClock } from '../lib/playbackClock';
import { formatTimecode } from '../lib/timecode';
import { createInThreadHost } from '../sequences/render/inThreadHost';
import { FrameStatsWindow, type StatsSummary } from '../sequences/render/stats';
import {
  canRenderInWorker,
  createWorkerHost,
  markWorkerUnavailable,
} from '../sequences/render/workerHost';

import type { SequenceRecord } from '../data/sequences';
import type {
  RendererCallbacks,
  RendererHost,
  RendererInfo,
  RendererMode,
} from '../sequences/render/host';

/** `auto` draws in the render worker where the browser can; `main` forces the in-thread path. */
export type RendererPreference = 'auto' | 'worker' | 'main';

interface SequencePlayerProps {
  sequence: SequenceRecord;
  /** Keep the drawing buffer so a frame can be read back (`?capture=1`). Off for playback. */
  capture?: boolean;
  /** `?renderer=main` draws on the page's thread even where the worker would work. */
  renderer?: RendererPreference;
  /** `?stats=1`: overlay the renderer's per-frame CPU time and GL counters. */
  stats?: boolean;
}

function preferredMode(preference: RendererPreference): RendererMode {
  return preference !== 'main' && canRenderInWorker() ? 'worker' : 'main';
}

function createPlayerCanvas(title: string, mode: RendererMode): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'block h-full w-full';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${title} 3D sequence`);
  canvas.dataset.renderer = mode;
  return canvas;
}

function backingSize(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    dpr,
    width: Math.max(1, Math.floor(canvas.clientWidth * dpr)),
    height: Math.max(1, Math.floor(canvas.clientHeight * dpr)),
  };
}

export default function SequencePlayer({
  sequence,
  capture = false,
  renderer = 'auto',
  stats = false,
}: SequencePlayerProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lastUiRef = useRef(0);
  const lastStatsUiRef = useRef(0);
  const wakeRef = useRef<(() => void) | null>(null);
  // The next frame does not follow the last one (seek, restart): tell the renderer.
  const jumpRef = useRef(true);
  const statsWindowRef = useRef(new FrameStatsWindow());
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);

  const [clock] = useState(
    () => new PlaybackClock({ durationSec: sequence.durationSec, playing: !reducedMotion }),
  );
  const [playing, setPlaying] = useState(!reducedMotion);
  const [loop, setLoop] = useState(true);
  const [uiTime, setUiTime] = useState(0);
  const [unsupported, setUnsupported] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  // Why the renderer failed, if it did, and what it reported once it was up.
  const [failure, setFailure] = useState<string | null>(null);
  const [info, setInfo] = useState<RendererInfo | null>(null);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  // The film (and capture setting) whose worker failed, so this player draws it in-thread.
  const [fellBackFor, setFellBackFor] = useState<string | null>(null);

  const coordinator = useMediaCoordinator();
  const duration = sequence.durationSec;
  const mediaId = `sequence:${sequence.id}`;
  const sessionKey = `${sequence.id}|${capture ? 'capture' : 'play'}`;
  const mode: RendererMode = fellBackFor === sessionKey ? 'main' : preferredMode(renderer);

  useEffect(() => {
    wakeRef.current?.();
  }, [playing]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion && clock.playing) {
      clock.pause(performance.now());
      setPlaying(false);
    }
  }, [clock, reducedMotion]);

  useEffect(() => {
    clock.setLoop(loop);
  }, [clock, loop]);

  useEffect(() => {
    const start = !reducedMotionRef.current;
    clock.reset(duration, start, performance.now());
    lastUiRef.current = 0;
    jumpRef.current = true;
    setUiTime(0);
    setPlaying(start);
  }, [clock, duration, sequence.id]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // One canvas per renderer: a canvas handed to a worker can never be drawn on here again.
    const canvas = createPlayerCanvas(sequence.title, mode);
    stage.replaceChildren(canvas);
    setUnsupported(false);
    setContextLost(false);
    setFailure(null);
    setInfo(null);
    setSummary(null);
    statsWindowRef.current.clear();

    let host: RendererHost | null = null;
    let disposed = false;
    let failed = false;
    let lost = false;
    let hidden = document.hidden;
    let lastTimeSec = -1;
    let raf = 0;

    // The film clock is held while nothing can be drawn (hidden tab, lost context) so it does
    // not jump ahead when drawing resumes.
    const syncClockHold = (now: number) => {
      if (hidden || lost) clock.freeze(now);
      else clock.thaw(now);
    };

    const draw = (now: number) => {
      if (!host) return;
      const { dpr, width, height } = backingSize(canvas);
      host.resize(width, height, dpr);
      const { timeSec, ended } = clock.tick(now);
      if (ended) {
        setPlaying(false);
        coordinator.deactivate(mediaId);
      }
      // Seeks, restarts and loop wraps are jumps; everything else follows the previous frame.
      const continuous = !jumpRef.current && timeSec >= lastTimeSec;
      jumpRef.current = false;
      lastTimeSec = timeSec;
      host.frame(timeSec, continuous);
      if (now - lastUiRef.current > 80) {
        lastUiRef.current = now;
        setUiTime(timeSec);
      }
      if (stats && now - lastStatsUiRef.current > 250) {
        lastStatsUiRef.current = now;
        setSummary(statsWindowRef.current.summary());
      }
    };

    // The loop only keeps ticking while playing and visible. Paused players draw single frames
    // on demand (seek, resize, resume) through `wake`.
    const frame = (now: number) => {
      raf = 0;
      draw(now);
      if (shouldAnimate({ playing: clock.playing, documentHidden: hidden, contextLost: lost })) {
        raf = requestAnimationFrame(frame);
      }
    };
    const wake = () => {
      if (raf === 0 && host && !failed && !lost && !hidden) raf = requestAnimationFrame(frame);
    };

    const callbacks: RendererCallbacks = {
      onReady(ready) {
        if (disposed) return;
        canvas.dataset.gl = ready.kind;
        canvas.dataset.preserveDrawingBuffer = String(ready.preserveDrawingBuffer);
        if (ready.renderer) canvas.dataset.glRenderer = ready.renderer;
        setInfo(ready);
      },
      onFailure(reported) {
        if (disposed) return;
        failed = true;
        cancelAnimationFrame(raf);
        raf = 0;
        if (reported.recoverable) {
          console.warn(
            `SequencePlayer: the render worker could not draw "${sequence.id}"; drawing in-thread.`,
            reported.reason ?? '',
          );
          // No context in the worker (or no worker): later players skip it.
          if (reported.kind === 'none') markWorkerUnavailable();
          setFellBackFor(sessionKey);
          return;
        }
        canvas.dataset.gl = reported.kind;
        setFailure(reported.reason);
        setUnsupported(true);
      },
      onContextLost() {
        if (disposed) return;
        lost = true;
        cancelAnimationFrame(raf);
        raf = 0;
        syncClockHold(performance.now());
        setContextLost(true);
      },
      onContextRestored() {
        if (disposed) return;
        lost = false;
        jumpRef.current = true;
        syncClockHold(performance.now());
        setContextLost(false);
        wake();
      },
      onFrame(frameStats) {
        statsWindowRef.current.push(frameStats, performance.now());
      },
    };

    const options = {
      source: { id: sequence.id, graph: sequence.graph },
      durationSec: duration,
      capture,
    };
    host =
      mode === 'worker'
        ? createWorkerHost(canvas, { ...options, ...backingSize(canvas) }, callbacks)
        : createInThreadHost(canvas, options, callbacks);

    wakeRef.current = wake;
    syncClockHold(performance.now());
    wake();

    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      syncClockHold(performance.now());
      wake();
    };
    const onResize = () => wake();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      host?.dispose();
      host = null;
      canvas.remove();
    };
  }, [capture, clock, coordinator, duration, mediaId, mode, sequence, sessionKey, stats]);

  useEffect(() => {
    if (!playing) {
      coordinator.deactivate(mediaId);
      return;
    }
    coordinator.activate(
      mediaId,
      {
        play: () => {
          clock.play(performance.now());
          setPlaying(true);
        },
        pause: () => {
          clock.pause(performance.now());
          setPlaying(false);
        },
      },
      { title: sequence.title, artist: 'Weeks on Fire', album: '3D Sequences' },
    );
    return () => coordinator.deactivate(mediaId);
  }, [clock, coordinator, mediaId, playing, sequence.title]);

  const togglePlay = () => {
    const now = performance.now();
    if (clock.playing) clock.pause(now);
    else clock.play(now);
    setPlaying(clock.playing);
  };

  const restart = () => {
    clock.restart(performance.now());
    jumpRef.current = true;
    setUiTime(0);
    setPlaying(true);
    wakeRef.current?.();
  };

  const seek = (next: number) => {
    clock.seek(next, performance.now());
    jumpRef.current = true;
    setUiTime(clock.peek(performance.now()));
    wakeRef.current?.();
  };

  const aspectClass = sequence.aspect === '4:3' ? 'aspect-[4/3]' : 'aspect-video';

  return (
    <div className="overflow-hidden rounded-md border border-zinc-800 bg-black">
      <div className={`relative ${aspectClass} bg-black`}>
        {/* The renderer's <canvas> is created per session in the effect above. */}
        <div ref={stageRef} className="h-full w-full" />
        {stats ? <StatsOverlay mode={mode} info={info} summary={summary} /> : null}
        {unsupported ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-zinc-400">
            <p>WebGL is unavailable in this browser, so the in-hub player cannot run.</p>
            {failure ? (
              <p className="max-w-full break-words font-mono text-xs text-zinc-500">{failure}</p>
            ) : null}
          </div>
        ) : null}
        {contextLost && !unsupported ? (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center bg-black p-4 text-center text-sm text-zinc-400"
          >
            The graphics context was lost. The player will resume automatically if the browser
            restores it; otherwise reload the page.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/90 p-3">
        <label className="block">
          <span className="sr-only">Seek {sequence.title}</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={Math.min(uiTime, duration)}
            onChange={(event) => seek(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-orange-500"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <RotateCcw size={14} />
              Restart
            </button>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={loop}
                onChange={(event) => setLoop(event.target.checked)}
                className="accent-orange-500"
              />
              Loop
            </label>
          </div>
          <p className="font-mono text-xs text-zinc-400">
            {formatTimecode(uiTime)} / {formatTimecode(duration)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatsOverlayProps {
  mode: RendererMode;
  info: RendererInfo | null;
  summary: StatsSummary | null;
}

/** `?stats=1`: what drew the last frames and how much it cost, over the last 60 frames. */
function StatsOverlay({ mode, info, summary }: StatsOverlayProps) {
  const rows: [string, string][] = [
    ['thread', mode === 'worker' ? 'worker' : 'main'],
    ['context', info?.kind ?? '…'],
  ];
  if (summary) {
    rows.push(
      ['buffer', `${summary.width}×${summary.height}`],
      ['cpu', `${summary.cpuMsAvg.toFixed(2)} ms avg · ${summary.cpuMsMax.toFixed(2)} max`],
      ['fps', summary.fps.toFixed(0)],
      ['draws', `${summary.drawCalls} (${summary.instances} objects)`],
      ['uniforms', String(summary.uniformCalls)],
      ['uploads', String(summary.bufferUploads)],
    );
  }
  return (
    <aside
      aria-label="Renderer stats"
      className="pointer-events-none absolute left-2 top-2 rounded bg-black/75 px-2 py-1 font-mono text-[10px] leading-4 text-lime-300"
    >
      <dl className="grid grid-cols-[auto_auto] gap-x-2">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-400">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
