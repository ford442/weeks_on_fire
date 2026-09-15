import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useMediaCoordinator } from '../contexts/MediaSessionContext';
import { SequenceEngine } from '../lib/webgl/engine';
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

  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(true);
  const [uiTime, setUiTime] = useState(0);
  const [unsupported, setUnsupported] = useState(false);

  const coordinator = useMediaCoordinator();
  const duration = sequence.durationSec;
  const mediaId = `sequence:${sequence.id}`;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    offsetRef.current = 0;
    originRef.current = performance.now();
    lastUiRef.current = 0;
    setUiTime(0);
    setPlaying(true);
    playingRef.current = true;
  }, [sequence.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) {
      setUnsupported(true);
      return;
    }
    setUnsupported(false);

    const engine = new SequenceEngine(gl);
    const scene = createSequenceScene(sequence.id);
    engineRef.current = engine;
    sceneRef.current = scene;
    scene?.init(engine);

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

    let raf = 0;
    const tick = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    originRef.current = performance.now();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene?.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = undefined;
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
  };

  const seek = (next: number) => {
    const clamped = Math.min(duration, Math.max(0, next));
    offsetRef.current = clamped;
    originRef.current = performance.now();
    setUiTime(clamped);
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
