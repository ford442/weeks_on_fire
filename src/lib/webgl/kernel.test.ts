import { describe, expect, it } from 'vitest';

import { LATHE_PROFILE, KERNEL_CASES, type KernelOutputs } from './kernel.cases';
import fixtureJson from './kernel.fixtures.json';
import { selectGeometryKernel, tsKernel, type GeometryKernel } from './kernel';
import { createLathe, createRibbon, createSphere } from './mesh';

/**
 * Every geometry kernel runs the same cases (kernel.cases.ts) and must reproduce the committed
 * outputs (kernel.fixtures.json) within 1e-6. Today that is `tsKernel` alone; a native kernel
 * would be added to KERNELS and held to the same numbers. After an intentional change to the TS
 * kernel, rewrite the fixtures with `npx tsx scripts/emit-kernel-fixtures.ts`.
 */
const KERNELS: readonly GeometryKernel[] = [tsKernel];
const TOLERANCE = 1e-6;
const fixtures: Record<string, KernelOutputs> = fixtureJson;

describe.each(KERNELS.map((kernel) => [kernel.name, kernel] as const))(
  'geometry kernel "%s" against the shared fixtures',
  (_name, kernel) => {
    it.each(Object.keys(KERNEL_CASES))('%s', (name) => {
      const expected = fixtures[name];
      expect(expected, `no fixture for ${name}`).toBeDefined();
      const actual = KERNEL_CASES[name]!(kernel);
      expect(Object.keys(actual).sort()).toEqual(Object.keys(expected!).sort());
      for (const [key, values] of Object.entries(actual)) {
        const want = expected![key]!;
        expect(values, `${name}.${key} length`).toHaveLength(want.length);
        let worst = 0;
        for (let i = 0; i < values.length; i++) {
          worst = Math.max(worst, Math.abs((values[i] ?? 0) - (want[i] ?? 0)));
        }
        expect(worst, `${name}.${key}: largest difference`).toBeLessThanOrEqual(TOLERANCE);
      }
    });
  },
);

describe('tsKernel', () => {
  it('is the kernel renderers pick', () => {
    expect(selectGeometryKernel()).toBe(tsKernel);
  });

  it('builds the same meshes as mesh.ts', () => {
    expect(tsKernel.sphere(0.5, 6, 8)).toEqual(createSphere(0.5, 6, 8));
    expect(tsKernel.lathe(LATHE_PROFILE, 5)).toEqual(createLathe(LATHE_PROFILE, 5));
    expect(tsKernel.ribbon(0.7, 12, 3)).toEqual(createRibbon(0.7, 12, 3));
  });
});

describe('integrateParticles', () => {
  it('follows free fall, then bounces off the floor and loses speed', () => {
    const pos = new Float32Array([0, 1, 0]);
    const vel = new Float32Array([0, 0, 0]);
    const params = {
      gravity: [0, -10, 0] as [number, number, number],
      drag: 0,
      floorY: 0,
      bounce: 0.5,
    };
    tsKernel.integrateParticles(pos, vel, 0.1, params);
    // Semi-implicit Euler: v = -1, y = 1 - 0.1.
    expect(vel[1]).toBeCloseTo(-1, 6);
    expect(pos[1]).toBeCloseTo(0.9, 6);
    for (let i = 0; i < 30; i++) {
      tsKernel.integrateParticles(pos, vel, 0.1, params);
      expect(pos[1]).toBeGreaterThanOrEqual(0);
    }
  });

  it('slows particles with drag and leaves velocity alone without it', () => {
    const vel = new Float32Array([2, 0, 0]);
    tsKernel.integrateParticles(new Float32Array(3), vel, 1, {
      gravity: [0, 0, 0],
      drag: Math.LN2,
    });
    expect(vel[0]).toBeCloseTo(1, 5);
    const still = new Float32Array([2, 0, 0]);
    tsKernel.integrateParticles(new Float32Array(3), still, 1, { gravity: [0, 0, 0], drag: 0 });
    expect(still[0]).toBe(2);
  });
});

describe('hoseChain', () => {
  const point = (out: Float32Array, i: number) => [out[i * 3]!, out[i * 3 + 1]!, out[i * 3 + 2]!];
  const run = (anchor: number[], target: number[], samples: number, restLength: number) => {
    const out = new Float32Array(samples * 3);
    tsKernel.hoseChain(new Float32Array(anchor), new Float32Array(target), out, {
      restLength,
      bend: [0, 1, 0],
    });
    return out;
  };
  const pathLength = (out: Float32Array, samples: number) => {
    let total = 0;
    for (let i = 1; i < samples; i++) {
      const [ax, ay, az] = point(out, i - 1);
      const [bx, by, bz] = point(out, i);
      total += Math.hypot(bx! - ax!, by! - ay!, bz! - az!);
    }
    return total;
  };

  it('starts on the anchor and ends on the target', () => {
    const out = run([0, 0, 0], [0.5, 0, 0], 9, 1);
    expect(point(out, 0).map((v) => Number(v.toFixed(5)))).toEqual([0, 0, 0]);
    expect(point(out, 8).map((v) => Number(v.toFixed(5)))).toEqual([0.5, 0, 0]);
  });

  it('bows a slack hose toward `bend`, keeping its length', () => {
    const samples = 65;
    const out = run([0, 0, 0], [0.5, 0, 0], samples, 1);
    expect(point(out, 32)[1]).toBeGreaterThan(0.2);
    // A fine polyline under-measures the arc only slightly.
    expect(pathLength(out, samples)).toBeCloseTo(1, 3);
  });

  it('stretches a taut hose straight', () => {
    const out = run([0, 0, 0], [2, 0, 0], 5, 1);
    for (let i = 0; i < 5; i++) expect(point(out, i)[1]).toBe(0);
    expect(point(out, 2)[0]).toBeCloseTo(1, 6);
  });

  it('refuses an output that does not hold whole limbs of at least two points', () => {
    expect(() => run([0, 0, 0], [1, 0, 0], 1, 1)).toThrow(RangeError);
    const out = new Float32Array(7);
    expect(() =>
      tsKernel.hoseChain(new Float32Array(3), new Float32Array(3), out, { restLength: 1 }),
    ).toThrow(/limbs \* samples \* 3/);
  });
});
