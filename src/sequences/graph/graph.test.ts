import { describe, expect, it } from 'vitest';

import { DEG } from '../../lib/webgl/math';
import { loopTime, resolve, sampleKeys } from './animate';
import { createGraphEvaluator } from './evaluate';
import { buildGeometry } from './geometry';
import type { GraphGeometry, SequenceGraph } from './types';

describe('sampleKeys', () => {
  const keys = [
    { t: 0, v: 0 },
    { t: 2, v: 10 },
    { t: 4, v: 20, ease: 'hold' as const },
    { t: 6, v: 40 },
  ];

  it('clamps before the first and after the last key', () => {
    expect(sampleKeys(keys, -1)).toBe(0);
    expect(sampleKeys(keys, 9)).toBe(40);
  });

  it('interpolates linearly by default and honours per-key ease', () => {
    expect(sampleKeys(keys, 1)).toBe(5);
    expect(sampleKeys(keys, 5)).toBe(20);
    expect(sampleKeys(keys, 0.5, 'inOut')).toBeCloseTo(1.5625);
  });

  it('interpolates vectors without mutating keys', () => {
    const vec = [
      { t: 0, v: [0, 0, 0] as [number, number, number] },
      { t: 1, v: [2, 4, 6] as [number, number, number] },
    ];
    expect(sampleKeys(vec, 0.5)).toEqual([1, 2, 3]);
    sampleKeys(vec, 0)[0] = 99;
    expect(vec[0]?.v[0]).toBe(0);
  });

  it('resolves constants and keyframe lists', () => {
    expect(resolve(3, 10)).toBe(3);
    expect(resolve([0, 1, 0], 10)).toEqual([0, 1, 0]);
    expect(
      resolve(
        [
          { t: 0, v: 0 },
          { t: 1, v: 1 },
        ],
        0.25,
      ),
    ).toBe(0.25);
  });
});

describe('loopTime', () => {
  it('passes time through without a loop or before outSec', () => {
    expect(loopTime(7)).toBe(7);
    expect(loopTime(7, { inSec: 2, outSec: 8 })).toBe(7);
  });

  it('wraps back into [inSec, outSec)', () => {
    expect(loopTime(8, { inSec: 2, outSec: 8 })).toBe(2);
    expect(loopTime(11, { inSec: 2, outSec: 8 })).toBe(5);
  });
});

const graph: SequenceGraph = {
  camera: {
    type: 'orbit',
    radius: 4,
    height: 1,
    angle: [
      { t: 0, v: 0 },
      { t: 10, v: 90 },
    ],
  },
  environment: { fogDensity: 0.1 },
  nodes: [
    {
      id: 'box',
      geometry: { type: 'box', size: [1, 1, 1] },
      material: { kind: 'lit', color: [1, 1, 1], emissive: [0.1, 0, 0] },
      translation: [0, 1, 0],
      rotation: [0, 90, 0],
      spin: [0, 10, 0],
    },
    {
      id: 'dust',
      geometry: { type: 'points', count: 4, radius: [1, 2] },
      material: { kind: 'unlit', color: [1, 1, 1], alpha: 0.5 },
    },
  ],
  clips: [
    {
      target: 'box',
      property: 'translation',
      keys: [
        { t: 0, v: [0, 0, 0] },
        { t: 10, v: [10, 0, 0] },
      ],
    },
    {
      target: 'scene',
      property: 'fogDensity',
      keys: [
        { t: 0, v: 0 },
        { t: 10, v: 1 },
      ],
    },
    {
      target: 'dust',
      property: 'alpha',
      keys: [
        { t: 0, v: 0 },
        { t: 10, v: 1 },
      ],
    },
  ],
};

describe('createGraphEvaluator', () => {
  const evaluate = createGraphEvaluator(graph);

  it('places an orbit camera on its circle', () => {
    const frame = evaluate(10);
    expect(frame.eye[0]).toBeCloseTo(4);
    expect(frame.eye[1]).toBe(1);
    expect(frame.eye[2]).toBeCloseTo(0);
    expect(frame.target).toEqual([0, 0, 0]);
    expect(frame.fovDeg).toBe(50);
  });

  it('applies clips over static transforms, and spin on top of rotation', () => {
    const box = evaluate(5).nodes[0];
    expect(box?.translation).toEqual([5, 0, 0]);
    expect(box?.rotation[1]).toBeCloseTo((90 + 10 * 5) * DEG);
    expect(box?.emissive).toEqual([0.1, 0, 0]);
    expect(evaluate(5).fogDensity).toBeCloseTo(0.5);
    expect(evaluate(5).nodes[1]?.alpha).toBeCloseTo(0.5);
  });

  it('falls back to the static value for nodes without clips', () => {
    const plain = createGraphEvaluator({ ...graph, clips: [] })(3);
    expect(plain.nodes[0]?.translation).toEqual([0, 1, 0]);
    expect(plain.nodes[1]?.alpha).toBe(0.5);
    expect(plain.fogDensity).toBe(0.1);
  });
});

describe('buildGeometry', () => {
  it('builds seeded, repeatable point clouds inside the radius range', () => {
    const cloud: GraphGeometry = { type: 'points', count: 50, radius: [1, 2], seed: 3 };
    const a = buildGeometry(cloud);
    const b = buildGeometry(cloud);
    expect(a.mode).toBe('points');
    expect([...a.positions]).toEqual([...b.positions]);
    for (let i = 0; i < 50; i++) {
      const r = Math.hypot(a.positions[i * 3]!, a.positions[i * 3 + 1]!, a.positions[i * 3 + 2]!);
      expect(r).toBeGreaterThanOrEqual(1 - 1e-5);
      expect(r).toBeLessThanOrEqual(2 + 1e-5);
    }
  });

  it('builds a closed polyline as line pairs', () => {
    const mesh = buildGeometry({
      type: 'line',
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      closed: true,
    });
    expect(mesh.mode).toBe('lines');
    expect(mesh.positions.length / 3).toBe(6);
  });

  it('lathes a profile into indexed triangles with outward normals', () => {
    const mesh = buildGeometry({
      type: 'lathe',
      profile: [
        [1, 0],
        [1, 2],
      ],
      segments: 8,
    });
    expect(mesh.mode).toBe('triangles');
    expect(mesh.indices?.length).toBe(8 * 6);
    // First vertex sits at angle 0: +X, and its normal points +X.
    expect(mesh.normals?.[0]).toBeCloseTo(1);
  });
});
