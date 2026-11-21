import { describe, expect, it } from 'vitest';

import { autoPan, fitRect, PAN_PRESETS, panWindow } from './compositor';

describe('fitRect', () => {
  it('letterboxes a still inside the frame without cropping (the assembler pads, never crops)', () => {
    expect(fitRect({ width: 1000, height: 1000 }, 1280, 720)).toEqual({
      x: 280,
      y: 0,
      width: 720,
      height: 720,
    });
    expect(fitRect({ width: 1920, height: 1080 }, 1280, 720)).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });
  });
});

describe('Ken Burns', () => {
  it('cycles push, left, pull, right like `assemble-cutaway.py --pan auto`', () => {
    expect([0, 1, 2, 3, 4].map(autoPan)).toEqual([
      PAN_PRESETS.push,
      PAN_PRESETS.left,
      PAN_PRESETS.pull,
      PAN_PRESETS.right,
      PAN_PRESETS.push,
    ]);
  });

  it('moves the zoompan window linearly and keeps it inside the picture', () => {
    expect(panWindow(PAN_PRESETS.push, 0, 1280, 720)).toEqual({ zoom: 1, x: 0, y: 0 });
    const end = panWindow(PAN_PRESETS.push, 1, 1280, 720);
    expect(end.zoom).toBeCloseTo(1.15);
    expect(end.x).toBeCloseTo((1280 - 1280 / 1.15) / 2);
    // `left` starts right of centre and ends left of it, clamped to the frame.
    const left0 = panWindow(PAN_PRESETS.left, 0, 1280, 720);
    const left1 = panWindow(PAN_PRESETS.left, 1, 1280, 720);
    expect(left0.x).toBeGreaterThan(left1.x);
    expect(left1.x).toBeGreaterThanOrEqual(0);
    expect(left0.x + 1280 / left0.zoom).toBeLessThanOrEqual(1280 + 1e-9);
  });
});
