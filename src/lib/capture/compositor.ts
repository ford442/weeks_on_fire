import { spanAt, type CutawayTimeline } from '../cutawayTimeline';

import type { ColorWhipDialect } from '../colorWhip';

/**
 * Draws one frame of a cutaway preview on a 2D canvas, so it can be recorded. It follows
 * `scripts/assemble-cutaway.py` at a high level, not pixel for pixel:
 *
 * - a still is fitted inside the frame (letterboxed, never cropped) and, with motion on, moved by
 *   the assembler's `--pan auto` cycle (push, left, pull, right; 1.15x zoom, 8% shift);
 * - a gap between shots is black;
 * - a Color Whip segment with no still draws its dialect's field (the CSS ones, on canvas);
 * - a segment with no picture at all draws a labelled placeholder card.
 */

export interface Pan {
  z0: number;
  x0: number;
  y0: number;
  z1: number;
  x1: number;
  y1: number;
}

const ZOOM = 1.15;
const SHIFT = 0.08;

export const PAN_PRESETS = {
  push: { z0: 1, x0: 0.5, y0: 0.5, z1: ZOOM, x1: 0.5, y1: 0.5 },
  pull: { z0: ZOOM, x0: 0.5, y0: 0.5, z1: 1, x1: 0.5, y1: 0.5 },
  left: { z0: ZOOM, x0: 0.5 + SHIFT, y0: 0.5, z1: ZOOM, x1: 0.5 - SHIFT, y1: 0.5 },
  right: { z0: ZOOM, x0: 0.5 - SHIFT, y0: 0.5, z1: ZOOM, x1: 0.5 + SHIFT, y1: 0.5 },
} as const satisfies Record<string, Pan>;

const AUTO_CYCLE = ['push', 'left', 'pull', 'right'] as const;

/** The assembler's `--pan auto`: segment n gets the n-th move of the cycle. */
export function autoPan(index: number): Pan {
  return PAN_PRESETS[AUTO_CYCLE[index % AUTO_CYCLE.length] ?? 'push'];
}

export interface StillImage {
  width: number;
  height: number;
}

export interface CompositorShot {
  label: string;
  /** A decoded, same-origin-clean image, or null. */
  image: (CanvasImageSource & StillImage) | null;
  whip: ColorWhipDialect | null;
  /** Why there is no picture, for the placeholder card. */
  note?: string;
}

export interface FrameOptions {
  /** Ken Burns and animated whip fields. Off under `prefers-reduced-motion`. */
  motion: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The still's box inside a `width` x `height` frame: fitted, centred, aspect kept. */
export function fitRect(image: StillImage, width: number, height: number): Rect {
  const scale = Math.min(width / image.width, height / image.height);
  const fitted = { width: image.width * scale, height: image.height * scale };
  return { x: (width - fitted.width) / 2, y: (height - fitted.height) / 2, ...fitted };
}

/** The zoompan window at `progress` (0..1): zoom and the visible region's top-left, in frame px. */
export function panWindow(pan: Pan, progress: number, width: number, height: number) {
  const t = Math.min(1, Math.max(0, progress));
  const zoom = pan.z0 + (pan.z1 - pan.z0) * t;
  const cx = pan.x0 + (pan.x1 - pan.x0) * t;
  const cy = pan.y0 + (pan.y1 - pan.y0) * t;
  const windowWidth = width / zoom;
  const windowHeight = height / zoom;
  const x = Math.min(Math.max(cx * width - windowWidth / 2, 0), width - windowWidth);
  const y = Math.min(Math.max(cy * height - windowHeight / 2, 0), height - windowHeight);
  return { zoom, x, y };
}

export function drawCutawayFrame(
  ctx: CanvasRenderingContext2D,
  timeline: CutawayTimeline,
  shots: readonly CompositorShot[],
  timeSec: number,
  { motion }: FrameOptions,
): void {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const { span, progress } = spanAt(timeline, timeSec);
  const shot = span ? shots[span.index] : undefined;
  if (span && shot) {
    const localSec = Math.max(0, timeSec - span.startSec);
    if (shot.image) {
      drawStill(ctx, shot.image, motion ? autoPan(span.index) : null, progress);
    } else if (shot.whip) {
      drawWhip(ctx, shot.whip, motion ? localSec : null);
    } else {
      drawPlaceholder(ctx, shot);
    }
  }
  ctx.restore();
}

function drawStill(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & StillImage,
  pan: Pan | null,
  progress: number,
): void {
  const { width, height } = ctx.canvas;
  const box = fitRect(image, width, height);
  if (pan) {
    const view = panWindow(pan, progress, width, height);
    ctx.setTransform(view.zoom, 0, 0, view.zoom, -view.x * view.zoom, -view.y * view.zoom);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, shot: CompositorShot): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e4e4e7';
  ctx.font = `600 ${Math.round(height * 0.05)}px system-ui, sans-serif`;
  ctx.fillText(shot.label, width / 2, height * 0.46, width * 0.9);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = `${Math.round(height * 0.032)}px system-ui, sans-serif`;
  ctx.fillText(
    shot.note ?? 'Prompt ready · still not linked',
    width / 2,
    height * 0.56,
    width * 0.9,
  );
}

// ----------------------------------------------------------------------------- Color Whip

/** Phase 0..1 through a `period`-second CSS animation, `delay` seconds late. */
function phase(timeSec: number, period: number, delay = 0): number {
  const t = (timeSec - delay) / period;
  return t - Math.floor(t);
}

/** `steps(1, end)` keyframes: the colour of the last stop at or before `p`. */
function stepColor(stops: readonly (readonly [number, string])[], p: number): string {
  let color = stops[0]?.[1] ?? '#000';
  for (const [at, value] of stops) if (p >= at) color = value;
  return color;
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Runs `draw` with the frame's centre as origin, scaled and rotated like a CSS transform. */
function centred(
  ctx: CanvasRenderingContext2D,
  { scale = 1, rotate = 0, skewX = 0, dx = 0, dy = 0 },
  draw: () => void,
): void {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.translate(width / 2 + dx, height / 2 + dy);
  ctx.rotate(rotate);
  ctx.transform(1, 0, Math.tan(skewX), 1, 0, 0);
  ctx.scale(scale, scale);
  ctx.translate(-width / 2, -height / 2);
  draw();
  ctx.restore();
}

/** A CSS `radial-gradient(circle at …)` blob: solid to `solid`, fading out by `fade` (of radius). */
function blob(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  at: [number, number],
  color: string,
  solid: number,
  fade: number,
): void {
  const cx = box.x + box.width * at[0];
  const cy = box.y + box.height * at[1];
  const radius = Math.hypot(
    Math.max(at[0], 1 - at[0]) * box.width,
    Math.max(at[1], 1 - at[1]) * box.height,
  );
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * fade);
  gradient.addColorStop(0, color);
  gradient.addColorStop(solid / fade, color);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(box.x, box.y, box.width, box.height);
}

let scratch: HTMLCanvasElement | null = null;

/**
 * A blank canvas the frame's size, for a CSS layer whose own paint is normal but which blends
 * onto the frame as a whole (`mix-blend-mode` on the layer, not on each gradient in it).
 */
function layerCanvas(width: number, height: number): CanvasRenderingContext2D | null {
  scratch ??= document.createElement('canvas');
  if (scratch.width !== width) scratch.width = width;
  if (scratch.height !== height) scratch.height = height;
  const layer = scratch.getContext('2d');
  layer?.setTransform(1, 0, 0, 1, 0, 0);
  layer?.clearRect(0, 0, width, height);
  return layer;
}

/** The `inset: -30%` layer box the layered dialects draw in. */
function layerBox(width: number, height: number): Rect {
  return { x: -0.3 * width, y: -0.3 * height, width: 1.6 * width, height: 1.6 * height };
}

/** Hard-stop conic wedges, CSS angles (0 = up, clockwise), as fractions of a turn. */
function wedges(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  stops: readonly (readonly [number, number, string])[],
  fromTurn = 0,
): void {
  for (const [start, end, color] of stops) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const a0 = (fromTurn + start) * Math.PI * 2 - Math.PI / 2;
    const a1 = (fromTurn + end) * Math.PI * 2 - Math.PI / 2;
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/**
 * A dialect's field at `timeSec` into its segment, or its still (reduced-motion) frame when
 * `timeSec` is null. Mirrors `.color-whip-field--*` in `src/styles.css`.
 */
export function drawWhip(
  ctx: CanvasRenderingContext2D,
  dialect: ColorWhipDialect,
  timeSec: number | null,
): void {
  const { width, height } = ctx.canvas;
  const still = timeSec === null;
  const t = timeSec ?? 0;
  // The CSS fields are sized in px for a ~640 px preview; scale them with the frame.
  const px = width / 640;

  switch (dialect) {
    case 'strobe': {
      if (still) {
        ctx.fillStyle = '#ff00aa';
        ctx.fillRect(0, 0, width / 2, height);
        ctx.fillStyle = '#c8ff00';
        ctx.fillRect(width / 2, 0, width / 2, height);
        return;
      }
      ctx.fillStyle = stepColor(
        [
          [0, '#ff00aa'],
          [0.46, '#000'],
          [0.53, '#c8ff00'],
        ],
        phase(t, 0.4),
      );
      ctx.fillRect(0, 0, width, height);
      return;
    }
    case 'whip': {
      const p = still ? 0 : phase(t, 0.18);
      const skew = still ? 0 : ((-18 + 28 * p) * Math.PI) / 180;
      const scale = still ? 1 : 1.4;
      // background-position 0 → 48% of (box − 240% tile): the stripes travel 0.672 widths.
      const offset = -0.672 * width * p;
      const period = 48 * px;
      const bands: [number, number, string][] = [
        [0, 10, '#00e5ff'],
        [10, 22, '#ff7a00'],
        [22, 28, '#00e5ff'],
        [28, 48, '#ff7a00'],
      ];
      centred(ctx, { scale, skewX: skew }, () => {
        const from = -width;
        const to = width * 2;
        const first = Math.floor((from - offset) / period) * period + offset;
        for (let x = first; x < to; x += period) {
          for (const [a, b, color] of bands) {
            ctx.fillStyle = color;
            ctx.fillRect(x + a * px, -height, (b - a) * px, height * 3);
          }
        }
      });
      return;
    }
    case 'phosphor': {
      ctx.fillStyle = '#2a0066';
      ctx.fillRect(0, 0, width, height);
      const layers: [number, number, string][] = [
        [0, 1, 'none'],
        [0.12, 0.55, 'hue-rotate(-20deg)'],
        [0.24, 0.3, 'hue-rotate(40deg)'],
      ];
      const layer = layerCanvas(width, height);
      if (!layer) return;
      // The two blobs paint normally inside a layer; the layer screens onto the frame.
      const box = layerBox(width, height);
      blob(layer, box, [0.62, 0.58], '#7a00ff', 0.28, 0.55);
      blob(layer, box, [0.38, 0.42], '#ffd000', 0.18, 0.42);
      ctx.globalCompositeOperation = 'screen';
      for (const [delay, opacity, filter] of layers) {
        const p = still ? 0 : phase(t, 0.4, delay);
        // ghost: (0,0,1) → 50% (2%, −1.5%, 1.04) → 100% (−1.5%, 2%, 0.98)
        const half = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5;
        const [x0, y0, s0, x1, y1, s1] =
          p < 0.5 ? [0, 0, 1, 2, -1.5, 1.04] : [2, -1.5, 1.04, -1.5, 2, 0.98];
        ctx.globalAlpha = opacity;
        ctx.filter = filter;
        centred(
          ctx,
          {
            scale: s0 + (s1 - s0) * half,
            dx: ((x0 + (x1 - x0) * half) / 100) * box.width,
            dy: ((y0 + (y1 - y0) * half) / 100) * box.height,
          },
          () => ctx.drawImage(layer.canvas, 0, 0),
        );
      }
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    case 'smash': {
      const p = still ? 0 : phase(t, 0.4);
      const scale = still
        ? 1
        : p < 0.7
          ? 1 + 2.4 * easeOut(p / 0.7)
          : 3.4 - 2.35 * easeOut((p - 0.7) / 0.3);
      centred(ctx, { scale }, () => {
        const cx = width * 0.38;
        const cy = height * 0.55;
        const radius = Math.hypot(0.62 * width, 0.55 * height);
        const ring = radius * 0.04;
        const count = Math.ceil((radius * 1.5) / ring);
        for (let i = count; i >= 1; i -= 1) {
          ctx.beginPath();
          ctx.arc(cx, cy, i * ring, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 1 ? '#ff4fa3' : '#00c9a7';
          ctx.fill();
        }
      });
      return;
    }
    case 'chase': {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      const box = layerBox(width, height);
      const layers: [[number, number], string, number, 'x' | 'y', number, number][] = [
        [[0.4, 0.5], '#ff0033', 0.4, 'x', -8, 8],
        [[0.52, 0.48], '#00ff66', 0.46, 'x', 6, -10],
        [[0.46, 0.58], '#0044ff', 0.34, 'y', -7, 9],
      ];
      ctx.globalCompositeOperation = 'screen';
      for (const [at, color, period, axis, from, to] of layers) {
        const p = still ? 0 : phase(t, period);
        const shift = ((from + (to - from) * p) / 100) * (axis === 'x' ? box.width : box.height);
        centred(ctx, axis === 'x' ? { dx: still ? 0 : shift } : { dy: still ? 0 : shift }, () =>
          blob(ctx, box, at, color, 0.28, 0.52),
        );
      }
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    case 'cuts': {
      const blue = '#1a2bff';
      const yellow = '#ffe14a';
      ctx.fillStyle = still
        ? blue
        : stepColor(
            [
              [0, blue],
              [0.16, '#000'],
              [0.19, yellow],
              [0.33, '#000'],
              [0.36, blue],
              [0.5, '#000'],
              [0.53, yellow],
              [0.67, '#000'],
              [0.7, blue],
              [0.84, '#000'],
              [0.87, yellow],
            ],
            phase(t, 2.4),
          );
      ctx.fillRect(0, 0, width, height);
      return;
    }
    case 'vortex': {
      const p = still ? 0 : phase(t, 0.8);
      centred(ctx, { scale: still ? 1 : 1.4, rotate: p * Math.PI * 2 }, () => {
        wedges(ctx, width * 0.38, height * 0.58, Math.hypot(width, height) * 1.5, [
          [0, 0.18, '#7a1028'],
          [0.18, 0.28, '#7dffc3'],
          [0.28, 0.48, '#7a1028'],
          [0.48, 0.55, '#7dffc3'],
          [0.55, 0.78, '#7a1028'],
          [0.78, 1, '#7dffc3'],
        ]);
      });
      return;
    }
    case 'hit': {
      ctx.fillStyle = still
        ? '#fff6e8'
        : stepColor(
            [
              [0, '#3a1020'],
              [0.19, '#fff6e8'],
              [0.29, '#1a0a12'],
            ],
            phase(t, 0.8),
          );
      ctx.fillRect(0, 0, width, height);
      const p = still ? 0 : phase(t, 0.4);
      const colors = ['#ff00aa', '#00e5ff', '#7a00ff', '#00c9a7', '#ff0033', '#1a2bff', '#7a1028'];
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = still ? 0.85 : 0.9 - 0.35 * p;
      const box = layerBox(width, height);
      centred(ctx, still ? {} : { scale: 1.5 + 0.2 * p, rotate: (-25 * p * Math.PI) / 180 }, () => {
        const cx = box.x + box.width * 0.6;
        const cy = box.y + box.height * 0.4;
        if (typeof ctx.createConicGradient === 'function') {
          // CSS `from 90deg` is canvas angle 0 (both clockwise; CSS 0deg points up).
          const gradient = ctx.createConicGradient(0, cx, cy);
          [...colors, '#ff00aa'].forEach((color, i) =>
            gradient.addColorStop(i / colors.length, color),
          );
          ctx.fillStyle = gradient;
          ctx.fillRect(box.x, box.y, box.width, box.height);
          return;
        }
        const step = 1 / colors.length;
        wedges(
          ctx,
          cx,
          cy,
          Math.hypot(box.width, box.height),
          colors.map((color, i) => [i * step, (i + 1) * step, color] as const),
          0.25,
        );
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
  }
}
