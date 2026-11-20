/** Laser-snake motion and drawing, shared by the background (LaserSnakes) and the egg table. */

export type Snake = {
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

const TRAIL_LEN = 46;

const HALO = {
  green: 'rgba(74, 222, 128, ALPHA)',
  cyan: 'rgba(34, 211, 238, ALPHA)',
} as const;

export function spawnSnake(w: number, h: number): Snake {
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

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;
}

/** Advance one snake by a frame (meander + occasional hard "laser snap"). */
export function stepSnake(s: Snake) {
  s.age += 1;
  s.phase += s.wobble;
  // Layered sines give a cheap noise-like meander.
  s.heading += Math.sin(s.phase) * 0.035 + Math.sin(s.phase * 0.37 + 1.3) * 0.02;
  // Occasional laser "snap": a hard 30–60° turn.
  if (Math.random() < 0.004)
    s.heading += (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
  s.x += Math.cos(s.heading) * s.speed;
  s.y += Math.sin(s.heading) * s.speed;
  s.trail.push({ x: s.x, y: s.y });
  if (s.trail.length > TRAIL_LEN) s.trail.shift();
}

/** Draw a snake's glowing trail. `scale` widens the strokes (the egg table draws them bolder). */
export function drawSnake(ctx: CanvasRenderingContext2D, s: Snake, scale = 1) {
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
  ctx.strokeStyle = HALO[s.hue].replace('ALPHA', (0.12 * fade * scale).toFixed(3));
  ctx.lineWidth = 7 * scale;
  ctx.stroke();
  ctx.strokeStyle = HALO[s.hue].replace('ALPHA', (0.35 * fade * scale).toFixed(3));
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();
  ctx.strokeStyle = `rgba(253, 186, 116, ${(0.7 * fade).toFixed(3)})`;
  ctx.lineWidth = 0.9 * scale;
  ctx.stroke();
  const head = pts[pts.length - 1]!;
  ctx.fillStyle = `rgba(255, 237, 213, ${(0.8 * fade).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 1.6 * scale, 0, Math.PI * 2);
  ctx.fill();
}
