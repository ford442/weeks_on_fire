import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  GRID,
  TOLERANCE,
  compareFrames,
  decodeRgb,
  describeDiff,
  encodeRgb,
  isFlat,
  type FrameFixture,
} from './frame';

const CELLS = GRID.cols * GRID.rows * 3;

function frame(fill: (cell: number, channel: number) => number): number[] {
  return Array.from({ length: CELLS }, (_, i) => fill(Math.floor(i / 3), i % 3));
}

/** A dark frame with a bright block, standing in for an ember core and lattice. */
const scene = frame((cell, channel) =>
  cell % GRID.cols < 8 && cell < 200 ? [200, 120, 40][channel]! : 6,
);

describe('compareFrames', () => {
  it('accepts identical frames', () => {
    const diff = compareFrames(scene, scene);
    expect(diff).toMatchObject({ ok: true, maxDiff: 0, meanDiff: 0 });
  });

  it('accepts backend noise within the tolerance', () => {
    // +-1..2 levels on every value: mean 1.2, under the limit of 2.
    const noisy = scene.map((v, i) => v + (i % 5 === 0 ? 2 : -1));
    expect(compareFrames(noisy, scene).ok).toBe(true);
  });

  it('rejects a cleared frame', () => {
    const diff = compareFrames(new Array<number>(CELLS).fill(0), scene);
    expect(diff.ok).toBe(false);
    expect(diff.maxDiff).toBeGreaterThan(TOLERANCE.maxChannelDiff);
  });

  it('rejects a single cell that is far off even if the mean is fine', () => {
    const off = [...scene];
    off[300] = (off[300] ?? 0) + 60;
    const diff = compareFrames(off, scene);
    expect(diff.meanDiff).toBeLessThan(TOLERANCE.meanChannelDiff);
    expect(diff.ok).toBe(false);
  });

  it('rejects a small shift spread across every cell', () => {
    const dim = scene.map((v) => v + TOLERANCE.meanChannelDiff + 1);
    expect(compareFrames(dim, scene).ok).toBe(false);
  });

  it('reports where the worst cell is', () => {
    const off = [...scene];
    const cell = 3 * GRID.cols + 5;
    off[cell * 3 + 1] = (off[cell * 3 + 1] ?? 0) + 90;
    const diff = compareFrames(off, scene);
    expect(diff.worst).toMatchObject({ col: 5, row: 3, channel: 'g' });
    expect(describeDiff('50%', diff)).toMatch(/worst cell \(5,3\) g/);
  });

  it('refuses frames of different sizes instead of comparing a prefix', () => {
    expect(() => compareFrames([1, 2, 3], [1, 2, 3, 4, 5, 6])).toThrow(/3 values/);
  });
});

describe('isFlat', () => {
  it('is true for a cleared or single-colour frame', () => {
    expect(isFlat(new Array<number>(CELLS).fill(0))).toBe(true);
    expect(isFlat(frame((_, channel) => [10, 20, 30][channel]!))).toBe(true);
  });

  it('is false once anything is drawn', () => {
    expect(isFlat(scene)).toBe(false);
  });
});

describe('rgb codec', () => {
  it('round-trips through base64', () => {
    expect(decodeRgb(encodeRgb(scene))).toEqual(scene);
  });
});

const fixturesDir = join(import.meta.dirname, 'fixtures');
const fixtureFiles = readdirSync(fixturesDir).filter((name) => name.endsWith('.frames.json'));

describe('committed frame fixtures', () => {
  it('cover the films the harness plays', () => {
    // Every 3D sequence: they are all graphs, and each port was diffed against these frames.
    expect(fixtureFiles.sort()).toEqual([
      'elephant-trampoline.frames.json',
      'hose-chase.frames.json',
      'kick-lattice.frames.json',
      'kitchen-counter-orbit.frames.json',
      'lattice-hymn.frames.json',
      'mobius-chrome.frames.json',
      'rubber-hose-errand.frames.json',
      'screen-door-recessional.frames.json',
      'spoon-whip.frames.json',
      'tunnel-smash.frames.json',
    ]);
  });

  describe.each(fixtureFiles)('%s', (file) => {
    const fixture = JSON.parse(readFileSync(join(fixturesDir, file), 'utf8')) as FrameFixture;

    it('matches the grid the harness samples', () => {
      expect(fixture).toMatchObject({
        sequence: file.replace('.frames.json', ''),
        cols: GRID.cols,
        rows: GRID.rows,
      });
      const labels = fixture.frames.map((f) => f.label);
      expect(labels).toHaveLength(3);
      expect(labels[0]).toBe('0s');
      expect(labels[1]).toMatch(/^\d+%$/);
      expect(labels[2]).toBe('100%');
      for (const f of fixture.frames) expect(decodeRgb(f.rgb)).toHaveLength(CELLS);
    });

    it('holds real pictures, not a cleared canvas', () => {
      for (const f of fixture.frames) expect(isFlat(decodeRgb(f.rgb))).toBe(false);
    });

    it('holds two frames the comparison can tell apart', () => {
      const [first, middle] = fixture.frames.map((f) => decodeRgb(f.rgb));
      expect(compareFrames(first!, middle!).ok).toBe(false);
    });
  });
});
