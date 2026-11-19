import { useEffect, useRef } from 'react';

/**
 * Laser snakes — Episode 3 language for the public shell.
 * A fixed, pointer-events-none canvas behind the content: a few thin glowing
 * polylines (green/cyan halo, orange core) crawl on noise-ish sine paths,
 * fade out and respawn so they never pile up.
 *
 * Respects `prefers-reduced-motion` (renders nothing), pauses while the tab is
 * hidden, caps DPR at 2. No dependencies.
 */

type Snake = {
  x: number;
  y: number;
  heading: number;
  speed: number;
  phase: number;
  wobble: number;
  hue: 'green' | 'cyan';
  trail: { x: number; y: number }[];
  age: number;
  life: number;
};

const SNAKE_COUNT = 4;
const TRAIL_LEN = 46;

const HALO = {
  green: 'rgba(74, 222, 128, ALPHA)',
  cyan: 'rgba(34, 211, 238, ALPHA)',
} as const;

function spawn(w: number, h: number): Snake {
  // Enter from a random edge, heading roughly inward.
  const edge = Math.floor(Math.random() * 4);
  const pad = 20;
  let x: number;
  let y: number;
  let heading: number;
  if (edge === 0) {
    x = Math.random() * w;
    y = -pad;
    heading = Math.PI / 2;
  } else if (edge === 1) {
    x = w + pad;
    y = Math.random() * h;
    heading = Math.PI;
  } else if (edge === 2) {
    x = Math.random() * w;
    y = h + pad;
    heading = -Math.PI / 2;
  } else {
    x = -pad;
    y = Math.random() * h;
    heading = 0;
  }
  heading += (Math.random() - 0.5) * 1.2;
  return {
    x,
    y,
    heading,
    speed: 0.9 + Math.random() * 0.9,
    phase: Math.random() * Math.PI * 2,
    wobble: 0.012 + Math.random() * 0.02,
    hue: Math.random() < 0.5 ? 'green' : 'cyan',
    trail: [],
    age: 0,
    life: 520 + Math.random() * 480,
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;
}

export default function LaserSnakes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let snakes: Snake[] = [];
    let running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const step = (s: Snake) => {
      s.age += 1;
      s.phase += s.wobble;
      // Layered sines give a cheap noise-like meander.
      s.heading += Math.sin(s.phase) * 0.035 + Math.sin(s.phase * 0.37 + 1.3) * 0.02;
      // Occasional laser "snap": a hard 30–60° turn.
      if (Math.random() < 0.004) s.heading += (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
      s.x += Math.cos(s.heading) * s.speed;
      s.y += Math.sin(s.heading) * s.speed;
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > TRAIL_LEN) s.trail.shift();
    };

    const draw = (s: Snake) => {
      const pts = s.trail;
      if (pts.length < 2) return;
      // Fade in over 60 frames, out over the last 120.
      const fade = Math.min(1, s.age / 60, Math.max(0, (s.life - s.age) / 120));
      if (fade <= 0) return;
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = HALO[s.hue].replace('ALPHA', (0.12 * fade).toFixed(3));
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = HALO[s.hue].replace('ALPHA', (0.35 * fade).toFixed(3));
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = `rgba(253, 186, 116, ${(0.7 * fade).toFixed(3)})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // Hot head.
      const head = pts[pts.length - 1]!;
      ctx.fillStyle = `rgba(255, 237, 213, ${(0.8 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      snakes = snakes.map((s) => {
        const margin = 80;
        const out = s.x < -margin || s.x > w + margin || s.y < -margin || s.y > h + margin;
        if (s.age < 0) {
          s.age += 1;
          return s;
        }
        if (s.age > s.life || (out && s.age > 60)) return spawn(w, h);
        step(s);
        draw(s);
        return s;
      });
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || document.hidden || prefersReducedMotion()) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };

    resize();
    snakes = Array.from({ length: SNAKE_COUNT }, () => {
      const s = spawn(w, h);
      // Stagger so they don't all arrive together.
      s.age = -Math.floor(Math.random() * 240);
      return s;
    });
    start();

    const onVisibility = () => (document.hidden ? stop() : start());
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => (mq?.matches ? stop() : start());
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    mq?.addEventListener?.('change', onMotion);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      mq?.removeEventListener?.('change', onMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full motion-reduce:hidden"
    />
  );
}
