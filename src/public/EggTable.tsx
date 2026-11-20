import { useEffect, useRef, useState } from 'react';

import { drawSnake, prefersReducedMotion, spawnSnake, stepSnake, type Snake } from './laserSnake';

/**
 * The laundry-room table: drag or flick the eggs, keep them on the table while laser snakes
 * crawl across and knock them about. Vanilla canvas, no dependencies, no win state.
 *
 * Under `prefers-reduced-motion` the snakes are drawn once and stay put, and they never knock.
 */

type Egg = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  /** >0 while falling off the table: frames left in the fall. */
  falling: number;
  /** Frames until a lost egg is put back. */
  respawn: number;
};

const W = 720;
const H = 440;
// The tabletop, inside the stage.
const TABLE = { x: 110, y: 90, w: 500, h: 260 };
const EGG_RX = 15;
const EGG_RY = 20;
const FRICTION = 0.965;
const BOUNCE = 0.6;
const EGG_COUNT = 4;

function homeEgg(i: number): Egg {
  return {
    x: TABLE.x + TABLE.w * ((i + 1) / (EGG_COUNT + 1)),
    y: TABLE.y + TABLE.h / 2 + (i % 2 ? 24 : -24),
    vx: 0,
    vy: 0,
    angle: (i - 1.5) * 0.3,
    falling: 0,
    respawn: 0,
  };
}

function drawRoom(ctx: CanvasRenderingContext2D) {
  // Linoleum floor, checkerboard, the colour of a basement at 2 AM.
  const tile = 40;
  for (let y = 0; y < H; y += tile)
    for (let x = 0; x < W; x += tile) {
      ctx.fillStyle = (x / tile + y / tile) % 2 ? '#1a1520' : '#221b29';
      ctx.fillRect(x, y, tile, tile);
    }
  // Two dryers along the top wall, one door glowing.
  for (let i = 0; i < 2; i++) {
    const dx = 24 + i * 96;
    ctx.fillStyle = '#2e2836';
    ctx.fillRect(dx, 8, 80, 66);
    ctx.beginPath();
    ctx.arc(dx + 40, 44, 22, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? 'rgba(251, 146, 60, 0.35)' : '#15111a';
    ctx.fill();
    ctx.strokeStyle = '#4b4356';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // Table shadow, then the folding table itself.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(TABLE.x + 10, TABLE.y + 14, TABLE.w, TABLE.h);
  ctx.fillStyle = '#d6cfc0';
  ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
  ctx.strokeStyle = '#8c8577';
  ctx.lineWidth = 4;
  ctx.strokeRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
  // A folded towel and a mug, set dressing only.
  ctx.fillStyle = '#7c9cb5';
  ctx.fillRect(TABLE.x + 22, TABLE.y + 20, 70, 40);
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.arc(TABLE.x + TABLE.w - 40, TABLE.y + 38, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a29';
  ctx.beginPath();
  ctx.arc(TABLE.x + TABLE.w - 40, TABLE.y + 38, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawEgg(ctx: CanvasRenderingContext2D, e: Egg) {
  if (e.respawn > 0) return;
  const s = e.falling > 0 ? e.falling / 30 : 1;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(4, 5, EGG_RX, EGG_RY, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(-5, -8, 2, 0, 0, EGG_RY);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(1, '#e9d9bd');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, EGG_RX, EGG_RY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function onTable(e: Egg) {
  return e.x > TABLE.x && e.x < TABLE.x + TABLE.w && e.y > TABLE.y && e.y < TABLE.y + TABLE.h;
}

export default function EggTable() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lost, setLost] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let reduced = prefersReducedMotion();
    setStill(reduced);
    const eggs = Array.from({ length: EGG_COUNT }, (_, i) => homeEgg(i));
    const makeSnake = () => {
      const s = spawnSnake(W, H);
      s.speed *= 1.4;
      return s;
    };
    let snakes: Snake[] = [makeSnake(), makeSnake()];
    snakes[1]!.age = -300;
    // Reduced motion: pre-walk each snake into view and freeze it there.
    const freeze = () => {
      snakes = [makeSnake(), makeSnake()].map((s) => {
        s.x = TABLE.x + Math.random() * TABLE.w;
        s.y = TABLE.y + Math.random() * TABLE.h;
        for (let i = 0; i < 60; i++) stepSnake(s);
        s.age = 200;
        return s;
      });
    };
    if (reduced) freeze();

    let drag: {
      egg: Egg;
      dx: number;
      dy: number;
      hist: { x: number; y: number; t: number }[];
    } | null = null;
    let raf = 0;
    let running = false;

    const toStage = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
    };

    const onDown = (ev: PointerEvent) => {
      const p = toStage(ev);
      const egg = eggs.find(
        (e) => e.respawn === 0 && e.falling === 0 && Math.hypot(e.x - p.x, e.y - p.y) < EGG_RY + 8,
      );
      if (!egg) return;
      canvas.setPointerCapture(ev.pointerId);
      egg.vx = egg.vy = 0;
      drag = { egg, dx: egg.x - p.x, dy: egg.y - p.y, hist: [{ ...p, t: ev.timeStamp }] };
      ev.preventDefault();
    };
    const onMove = (ev: PointerEvent) => {
      if (!drag) return;
      const p = toStage(ev);
      drag.egg.x = p.x + drag.dx;
      drag.egg.y = p.y + drag.dy;
      drag.hist.push({ ...p, t: ev.timeStamp });
      if (drag.hist.length > 5) drag.hist.shift();
      if (!running) render();
    };
    const onUp = (ev: PointerEvent) => {
      if (!drag) return;
      const h = drag.hist;
      const a = h[0]!;
      const b = h[h.length - 1]!;
      const dt = Math.max(16, b.t - a.t);
      // px per ms → px per frame (~16ms), capped so a flick can't teleport.
      const cap = 28;
      drag.egg.vx = Math.max(-cap, Math.min(cap, ((b.x - a.x) / dt) * 16));
      drag.egg.vy = Math.max(-cap, Math.min(cap, ((b.y - a.y) / dt) * 16));
      drag = null;
      canvas.releasePointerCapture?.(ev.pointerId);
      start();
    };

    const physics = () => {
      for (const [i, e] of eggs.entries()) {
        if (e.respawn > 0) {
          e.respawn -= 1;
          if (e.respawn === 0) Object.assign(e, homeEgg(i));
          continue;
        }
        if (e.falling > 0) {
          e.falling -= 1;
          e.x += e.vx * 0.5;
          e.y += e.vy * 0.5;
          if (e.falling === 0) e.respawn = 90;
          continue;
        }
        if (drag?.egg === e) continue;
        e.x += e.vx;
        e.y += e.vy;
        e.angle += e.vx * 0.02;
        e.vx *= FRICTION;
        e.vy *= FRICTION;
        const fast = Math.hypot(e.vx, e.vy) > 9;
        // The table has a lip: slow eggs bounce, fast ones go over.
        const hitX = e.x - EGG_RX < TABLE.x || e.x + EGG_RX > TABLE.x + TABLE.w;
        const hitY = e.y - EGG_RY < TABLE.y || e.y + EGG_RY > TABLE.y + TABLE.h;
        // Dropped off the table by hand, or hit the edge too fast: over it goes.
        if (!onTable(e) || ((hitX || hitY) && fast)) {
          e.falling = 30;
          setLost((n) => n + 1);
          continue;
        }
        if (hitX) {
          e.x = Math.max(TABLE.x + EGG_RX, Math.min(TABLE.x + TABLE.w - EGG_RX, e.x));
          e.vx *= -BOUNCE;
        }
        if (hitY) {
          e.y = Math.max(TABLE.y + EGG_RY, Math.min(TABLE.y + TABLE.h - EGG_RY, e.y));
          e.vy *= -BOUNCE;
        }
      }
      // Egg–egg nudges, so they clack instead of stacking.
      for (let i = 0; i < eggs.length; i++)
        for (let j = i + 1; j < eggs.length; j++) {
          const a = eggs[i]!;
          const b = eggs[j]!;
          if (a.falling || b.falling || a.respawn || b.respawn) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const min = EGG_RX * 2;
          if (d < min) {
            const nx = dx / d;
            const ny = dy / d;
            const push = (min - d) / 2;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) {
              a.vx += rel * nx;
              a.vy += rel * ny;
              b.vx -= rel * nx;
              b.vy -= rel * ny;
            }
          }
        }
    };

    const snakesStep = () => {
      snakes = snakes.map((s) => {
        const out = s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60;
        if (s.age < 0) {
          s.age += 1;
          return s;
        }
        if (s.age > s.life || (out && s.age > 60)) {
          const n = makeSnake();
          n.age = -Math.floor(120 + Math.random() * 240);
          return n;
        }
        stepSnake(s);
        // Knock: the hot head shoves any egg it touches along its heading, outward.
        if (s.age > 30)
          for (const e of eggs) {
            if (e.falling || e.respawn || drag?.egg === e) continue;
            if (Math.hypot(e.x - s.x, e.y - s.y) < EGG_RY + 4) {
              e.vx += Math.cos(s.heading) * 6;
              e.vy += Math.sin(s.heading) * 6;
            }
          }
        return s;
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      drawRoom(ctx);
      for (const e of eggs) drawEgg(ctx, e);
      ctx.globalCompositeOperation = 'lighter';
      for (const s of snakes) if (s.age >= 0) drawSnake(ctx, s, 1.8);
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = () => {
      physics();
      if (!reduced) snakesStep();
      render();
      // Reduced motion: stop once every egg has settled; drags restart it.
      const settled = eggs.every(
        (e) => !e.falling && !e.respawn && Math.hypot(e.vx, e.vy) < 0.05 && drag?.egg !== e,
      );
      if (reduced && settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    render();
    start();

    const onVisibility = () => (document.hidden ? stop() : start());
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => {
      reduced = !!mq?.matches;
      setStill(reduced);
      if (reduced) freeze();
      render();
      start();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onVisibility);
    mq?.addEventListener?.('change', onMotion);
    return () => {
      stop();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      document.removeEventListener('visibilitychange', onVisibility);
      mq?.removeEventListener?.('change', onMotion);
    };
  }, []);

  return (
    <figure className="rounded-2xl border border-fuchsia-900/50 bg-zinc-950 p-3">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A laundry-room folding table with eggs on it. Drag or flick the eggs; laser snakes crawl across and knock them."
        className="block aspect-[720/440] w-full touch-none select-none rounded-xl"
      />
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-zinc-400">
        <span>
          Drag or flick the eggs. Keep them on the table.
          {still && ' The snakes are resting.'}
        </span>
        <span aria-live="polite" className="font-mono text-orange-300">
          Eggs off the table: {lost}
        </span>
      </figcaption>
    </figure>
  );
}
