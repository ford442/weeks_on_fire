/**
 * Helpers for the real-GL frame harness: a deterministic downsample taken inside the page, and
 * the tolerance compare run in Node. Kept free of Playwright imports so Vitest can test them.
 */

/** Cells in the committed thumbnail. 16:9 like the player, so cells stay square. */
export const GRID = { cols: 48, rows: 27 } as const;

/**
 * Differences are in 0-255 channel levels, measured per cell after box-averaging, so MSAA edge
 * noise between GL backends mostly cancels.
 *
 * Measured on lattice-hymn with software GL: an identical setup differs by exactly 0, so these
 * limits are headroom for another CPU or Chromium build. Failures this harness exists to catch
 * land far outside them: a cleared frame is max 124-149 / mean 5.6-14.7, a frame from the wrong
 * moment of the film is max 40-112, and doubling the canvas pixel density (thinner 1px lines) is
 * mean 4.4. Do not loosen these to make a diff pass; regenerate the fixture if the change is
 * intended.
 */
export const TOLERANCE = {
  /** Largest allowed difference in any single cell channel. */
  maxChannelDiff: 8,
  /** Largest allowed mean difference across every cell channel. */
  meanChannelDiff: 2,
} as const;

export interface Tolerance {
  maxChannelDiff: number;
  meanChannelDiff: number;
}

export interface FixtureFrame {
  label: string;
  timeSec: number;
  /** `cols * rows * 3` bytes (row-major RGB), base64. */
  rgb: string;
}

export interface FrameFixture {
  sequence: string;
  cols: number;
  rows: number;
  frames: FixtureFrame[];
}

export interface FrameDiff {
  ok: boolean;
  maxDiff: number;
  meanDiff: number;
  worst: { col: number; row: number; channel: 'r' | 'g' | 'b'; actual: number; expected: number };
}

export interface Thumbnail {
  /** `cols * rows * 3` channel values, row-major RGB. */
  rgb: number[];
  /** Full-resolution PNG data URL of the canvas, attached to the report. */
  png: string;
  /** Drawing-buffer size the thumbnail was taken from. */
  width: number;
  height: number;
}

/**
 * Runs inside the page. Copies the GL canvas to a 2D canvas, then box-averages it down to
 * `cols x rows`. Averaging by hand (not `drawImage` scaling) keeps the result independent of the
 * browser's resampling filter. Needs `preserveDrawingBuffer`, i.e. a `?capture=1` page load.
 *
 * Playwright serializes this function, so it must not reference anything outside its arguments.
 */
export function readThumbnailInPage(args: {
  selector: string;
  cols: number;
  rows: number;
}): Thumbnail {
  const { selector, cols, rows } = args;
  const source = document.querySelector<HTMLCanvasElement>(selector);
  if (!source) throw new Error(`no canvas matches ${selector}`);
  const { width, height } = source;
  if (width === 0 || height === 0) throw new Error(`canvas is ${width}x${height}`);

  const scratch = document.createElement('canvas');
  scratch.width = width;
  scratch.height = height;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2d context unavailable');
  ctx.drawImage(source, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  const rgb: number[] = [];
  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor((row * height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * height) / rows));
    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor((col * width) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * width) / cols));
      let r = 0;
      let g = 0;
      let b = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      rgb.push(Math.round(r / n), Math.round(g / n), Math.round(b / n));
    }
  }
  return { rgb, png: source.toDataURL('image/png'), width, height };
}

export function encodeRgb(rgb: ArrayLike<number>): string {
  return Buffer.from(Uint8Array.from(rgb)).toString('base64');
}

export function decodeRgb(base64: string): number[] {
  return [...Buffer.from(base64, 'base64')];
}

/** True when every value is within `slack` of the first cell: cleared, or flat-colour, frame. */
export function isFlat(rgb: ArrayLike<number>, slack = 2): boolean {
  for (let i = 3; i < rgb.length; i++) {
    if (Math.abs((rgb[i] ?? 0) - (rgb[i % 3] ?? 0)) > slack) return false;
  }
  return true;
}

export function compareFrames(
  actual: ArrayLike<number>,
  expected: ArrayLike<number>,
  tolerance: Tolerance = TOLERANCE,
  cols: number = GRID.cols,
): FrameDiff {
  if (actual.length !== expected.length) {
    throw new Error(`frame has ${actual.length} values, fixture has ${expected.length}`);
  }
  let max = -1;
  let worstIndex = 0;
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    const diff = Math.abs((actual[i] ?? 0) - (expected[i] ?? 0));
    sum += diff;
    if (diff > max) {
      max = diff;
      worstIndex = i;
    }
  }
  const cell = Math.floor(worstIndex / 3);
  const meanDiff = actual.length === 0 ? 0 : sum / actual.length;
  return {
    ok: max <= tolerance.maxChannelDiff && meanDiff <= tolerance.meanChannelDiff,
    maxDiff: Math.max(max, 0),
    meanDiff,
    worst: {
      col: cell % cols,
      row: Math.floor(cell / cols),
      channel: (['r', 'g', 'b'] as const)[worstIndex % 3] ?? 'r',
      actual: actual[worstIndex] ?? 0,
      expected: expected[worstIndex] ?? 0,
    },
  };
}

export function describeDiff(label: string, diff: FrameDiff, tolerance = TOLERANCE): string {
  const { worst } = diff;
  return (
    `${label}: max ${diff.maxDiff} (limit ${tolerance.maxChannelDiff}), ` +
    `mean ${diff.meanDiff.toFixed(2)} (limit ${tolerance.meanChannelDiff}); ` +
    `worst cell (${worst.col},${worst.row}) ${worst.channel}: got ${worst.actual}, ` +
    `fixture ${worst.expected}`
  );
}
