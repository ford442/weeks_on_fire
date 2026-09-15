import { describe, expect, it } from 'vitest';

import {
  createMat4,
  lookAt,
  multiply,
  perspective,
  transformPoint,
  vec3,
  vec3Length,
  vec3Normalize,
} from './math';

describe('webgl math', () => {
  it('normalizes a vector', () => {
    const n = vec3Normalize(vec3(0, 3, 0));
    expect(n[0]).toBeCloseTo(0);
    expect(n[1]).toBeCloseTo(1);
    expect(n[2]).toBeCloseTo(0);
  });

  it('multiplies identity with a translation-like matrix via perspective * lookAt', () => {
    const proj = createMat4();
    const view = createMat4();
    const mvp = createMat4();
    perspective(proj, Math.PI / 3, 16 / 9, 0.1, 100);
    lookAt(view, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
    multiply(mvp, proj, view);
    const clip = transformPoint(mvp, [0, 0, 0]);
    expect(Number.isFinite(clip[0])).toBe(true);
    expect(Number.isFinite(clip[1])).toBe(true);
    expect(Math.abs(clip[0])).toBeLessThan(0.02);
    expect(Math.abs(clip[1])).toBeLessThan(0.02);
  });

  it('reports vector length', () => {
    expect(vec3Length([3, 4, 0])).toBeCloseTo(5);
  });
});
