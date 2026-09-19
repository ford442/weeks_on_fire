import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { createSequenceGl } from '../lib/webgl/context';
import { SequenceEngine } from '../lib/webgl/engine';
import { shouldAnimate } from '../lib/webgl/loop';
import { formatTimecode } from '../lib/timecode';
import { createSequenceScene } from '../sequences/registry';
import type { SequenceRecord } from '../data/sequences';

interface SequencePlayerProps {
  sequence: SequenceRecord;
}

export default function SequencePlayer({ sequence }: SequencePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(true);
  const loopRef = useRef(true);
  const offsetRef = useRef(0);
  const originRef = useRef(0);
  const lastUiRef = useRef(0);
  const engineRef = useRef<SequenceEngine | null>(null);
  const sceneRef = useRef<ReturnType<typeof createSequenceScene>>(undefined);
  const wakeRef = useRef<(() => void) | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);

  const [playing, setPlaying] = useState(!reducedMotion);
  const [loop, setLoop] = useState(true);
  const [uiTime, setUiTime] = useState(0);
  const [unsupported, setUnsupported] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const coordinator = useMediaCoordinator();
  const duration = sequence.durationSec;
  const mediaId = `sequence:${sequence.id}`;

  useEffect(() => {
    playingRef.current = playing;
    wakeRef.current?.();
  }, [playing]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion && playingRef.current) {
      offsetRef.current += (performance.now() - originRef.current) / 1000;
      playingRef.current = false;
      setPlaying(false);
    }
  }, [reducedMotion]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    offsetRef.current = 0;
    originRef.current = performance.now();
    lastUiRef.current = 0;
    setUiTime(0);
    const start = !reducedMotionRef.current;
    setPlaying(start);
    playingRef.current = start;
  }, [sequence.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = createSequenceGl(canvas);
    if (!gl) {
      setUnsupported(true);
      return;
    }
    setUnsupported(false);
    setContextLost(false);

    let lost = false;
    let hidden = document.hidden;

    const setup = (): boolean => {
      try {
        const engine = new SequenceEngine(gl);
        const scene = createSequenceScene(sequence.id);
        scene?.init(engine);
        engineRef.current = engine;
        sceneRef.current = scene;
        return true;
      } catch {
        return false;
      }
    };

    const teardown = () => {
      try {
        sceneRef.current?.dispose();
        engineRef.current?.dispose();
      } catch {
        // GL objects are already gone after a context loss.
      }
      engineRef.current = null;
      sceneRef.current = undefined;
    };

    if (!setup()) {
      teardown();
      setUnsupported(true);
      return;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const readTime = (now: number) => {
      let time = playingRef.current
        ? offsetRef.current + (now - originRef.current) / 1000
        : offsetRef.current;
      if (time >= duration) {
        if (loopRef.current) {
          time = time % duration;
          offsetRef.current = time;
          originRef.current = now;
        } else {
          time = duration;
          offsetRef.current = duration;
          if (playingRef.current) {
            playingRef.current = false;
            setPlaying(false);
            coordinator.deactivate(mediaId);
          }
        }
      }
      return time;
    };

    const draw = (now: number) => {
      resize();
      const timeSec = readTime(now);
      const sceneNow = sceneRef.current;
      const engineNow = engineRef.current;
      if (sceneNow && engineNow && canvas.width > 0 && canvas.height > 0) {
        sceneNow.draw({
          engine: engineNow,
          timeSec,
          progress: duration > 0 ? timeSec / duration : 0,
          durationSec: duration,
          aspect: canvas.width / canvas.height,
        });
      }
      if (now - lastUiRef.current > 80) {
        lastUiRef.current = now;
        setUiTime(timeSec);
      }
    };

    // The loop only keeps ticking while playing and visible. Paused players draw single frames
    // on demand (seek, resize, resume) through `wake`.
    let raf = 0;
    const frame = (now: number) => {
      raf = 0;
      draw(now);
      if (
        shouldAnimate({ playing: playingRef.current, documentHidden: hidden, contextLost: lost })
      ) {
        raf = requestAnimationFrame(frame);
      }
    };
    const wake = () => {
      if (raf === 0 && !lost && !hidden) raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;
    originRef.current = performance.now();
    wake();

    const onVisibility = () => {
      const now = performance.now();
      if (document.hidden) {
        hidden = true;
        cancelAnimationFrame(raf);
        raf = 0;
        // Freeze the film clock so it does not jump ahead while the tab is in the background.
        if (playingRef.current) offsetRef.current += (now - originRef.current) / 1000;
        originRef.current = now;
      } else {
        hidden = false;
        originRef.current = now;
        wake();
      }
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      if (playingRef.current) offsetRef.current += (performance.now() - originRef.current) / 1000;
      originRef.current = performance.now();
      teardown();
      setContextLost(true);
    };

    const onRestored = () => {
      if (!setup()) {
        teardown();
        setUnsupported(true);
        return;
      }
      lost = false;
      originRef.current = performance.now();
      setContextLost(false);
      wake();
    };

    const onResize = () => wake();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      teardown();
    };
  }, [coordinator, duration, mediaId, sequence.id]);

  useEffect(() => {
    if (!playing) {
      coordinator.deactivate(mediaId);
      return;
    }
    coordinator.activate(
      mediaId,
      {
        play: () => {
          originRef.current = performance.now();
          playingRef.current = true;
          setPlaying(true);
        },
        pause: () => {
          offsetRef.current += (performance.now() - originRef.current) / 1000;
          playingRef.current = false;
          setPlaying(false);
        },
      },
      { title: sequence.title, artist: 'Weeks on Fire', album: '3D Sequences' },
    );
    return () => coordinator.deactivate(mediaId);
  }, [coordinator, mediaId, playing, sequence.title]);

  const togglePlay = () => {
    if (playing) {
      offsetRef.current += (performance.now() - originRef.current) / 1000;
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    if (offsetRef.current >= duration) offsetRef.current = 0;
    originRef.current = performance.now();
    playingRef.current = true;
    setPlaying(true);
  };

  const restart = () => {
    offsetRef.current = 0;
    originRef.current = performance.now();
    setUiTime(0);
    playingRef.current = true;
    setPlaying(true);
    wakeRef.current?.();
  };

  const seek = (next: number) => {
    const clamped = Math.min(duration, Math.max(0, next));
    offsetRef.current = clamped;
    originRef.current = performance.now();
    setUiTime(clamped);
    wakeRef.current?.();
  };

  const aspectClass = sequence.aspect === '4:3' ? 'aspect-[4/3]' : 'aspect-video';

  return (
    <div className="overflow-hidden rounded-md border border-zinc-800 bg-black">
      <div className={`relative ${aspectClass} bg-black`}>
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          role="img"
          aria-label={`${sequence.title} 3D sequence`}
        />
        {unsupported ? (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-zinc-400">
            WebGL is unavailable in this browser, so the in-hub player cannot run.
          </p>
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
