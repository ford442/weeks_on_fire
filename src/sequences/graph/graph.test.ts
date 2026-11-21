import { describe, expect, it } from 'vitest';

import { DEG } from '../../lib/webgl/math';

import { loopTime, resolve, sampleKeys } from './animate';
import { EMITTER_STEP, EmitterSim, emitterCapacity } from './emitter';
import { createGraphEvaluator, layoutOffsets } from './evaluate';
import { ExprError, compileExpr, exprNames } from './expr';
import { buildGeometry } from './geometry';
import { HoseTube } from './hose';
import { formatGraphProblems, graphProblems } from './issues';
import { SequenceGraphSchema } from './schema';

import type { z } from 'zod';
import type { GraphEmitter, GraphGeometry, GraphNode, SequenceGraph } from './types';

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

describe('compileExpr', () => {
  const names: Record<string, number> = { t: 0, x: 1 };
  const run = (source: string, slots: number[] = [2, 3]) =>
    compileExpr(source, (name) => names[name])(Float64Array.from(slots));

  it('follows arithmetic precedence and associativity', () => {
    expect(run('1 + 2 * 3')).toBe(7);
    expect(run('(1 + 2) * 3')).toBe(9);
    expect(run('10 - 4 - 3')).toBe(3);
    expect(run('-t * 2')).toBe(-4);
    expect(run('t * 3.4 * -1')).toBe(-6.8);
    expect(run('7 % 3')).toBe(1);
    expect(run('-7 % 3')).toBe(-1);
    expect(run('mod(-7, 3)')).toBe(2);
  });

  it('reads variables and calls functions', () => {
    expect(run('x * t + 1')).toBe(7);
    expect(run('sin(0) + cos(0)')).toBe(1);
    expect(run('max(1, x, t)')).toBe(3);
    expect(run('smoothstep(0, 4, t)')).toBeCloseTo(0.5);
    expect(run('pick(t, 10, 20, 30)')).toBe(30);
    expect(run('pick(9, 10, 20)')).toBe(20);
    expect(run('deg(pi)')).toBeCloseTo(180);
    expect(run('hash(3)')).toBe(run('hash(3)'));
  });

  it('returns 1 / 0 for comparisons and logic, and picks a ternary branch', () => {
    expect(run('t >= 2 && t < 12')).toBe(1);
    expect(run('t > 2 || x < 1')).toBe(0);
    expect(run('!t')).toBe(0);
    expect(run('t == 2 ? 5 : 6')).toBe(5);
    expect(run('t != 2 ? 5 : x > 2 ? 7 : 8')).toBe(7);
  });

  it('rejects unknown names, wrong arity and bad syntax with an offset', () => {
    expect(() => run('y + 1')).toThrow(ExprError);
    expect(() => run('y + 1')).toThrow(/unknown name "y"/);
    expect(() => run('nope(1)')).toThrow(/unknown function "nope"/);
    expect(() => run('clamp(1, 2)')).toThrow(/takes 3 arguments, got 2/);
    expect(() => run('1 +')).toThrow(/ends too early/);
    expect(() => run('1 2')).toThrow(/unexpected "2"/);
    expect(() => run('t.x')).toThrow(/unexpected "\."/);
    try {
      run('t + @');
    } catch (error) {
      expect((error as ExprError).at).toBe(4);
    }
  });

  it('lists the variables an expression reads', () => {
    expect(exprNames('sin(t) * x + pi')).toEqual(['t', 'x']);
    expect(exprNames('1 +')).toEqual([]);
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

/** Translation part of a column-major model matrix. */
const position = (model: Float32Array) => [model[12], model[13], model[14]];

describe('createGraphEvaluator', () => {
  const evaluate = createGraphEvaluator(graph).frame;

  it('places an orbit camera on its circle', () => {
    const frame = evaluate(10);
    expect(frame.eye[0]).toBeCloseTo(4);
    expect(frame.eye[1]).toBe(1);
    expect(frame.eye[2]).toBeCloseTo(0);
    expect(frame.target).toEqual([0, 0, 0]);
    expect(frame.fovDeg).toBe(50);
  });

  it('applies clips over static values, and spin on top of rotation', () => {
    const frame = evaluate(5);
    const box = frame.nodes[0]?.copies[0];
    expect(position(box!.model)).toEqual([5, 0, 0]);
    // A Y rotation of (90 + 10 * 5) degrees: the model's X axis is (cos, 0, -sin).
    const angle = (90 + 10 * 5) * DEG;
    expect(box!.model[0]).toBeCloseTo(Math.cos(angle));
    expect(box!.model[2]).toBeCloseTo(-Math.sin(angle));
    expect(box!.emissive).toEqual([0.1, 0, 0]);
    expect(frame.fogDensity).toBeCloseTo(0.5);
    expect(frame.nodes[1]?.copies[0]?.alpha).toBeCloseTo(0.5);
  });

  it('falls back to the static value for nodes without clips', () => {
    const plain = createGraphEvaluator({ ...graph, clips: [] }).frame(3);
    expect(position(plain.nodes[0]!.copies[0]!.model)).toEqual([0, 1, 0]);
    expect(plain.nodes[1]?.copies[0]?.alpha).toBe(0.5);
    expect(plain.fogDensity).toBe(0.1);
  });

  it('evaluates graph vars in order, with t, p and dur', () => {
    const driven = createGraphEvaluator(
      {
        camera: { type: 'perspective', eye: ['t', 'p', 'dur'], target: [0, 0, 0], fov: 'twice' },
        vars: { half: 't / 2', twice: 'half * 4' },
        nodes: [graph.nodes[0]!],
      },
      { durationSec: 20 },
    ).frame(5);
    expect(driven.eye).toEqual([5, 0.25, 20]);
    expect(driven.fovDeg).toBe(10);
  });

  it('samples keyframed vars at scene time', () => {
    const keyed = createGraphEvaluator({
      camera: { type: 'perspective', eye: [0, 'lift * 2', 0], target: [0, 0, 0] },
      vars: {
        lift: [
          { t: 0, v: 0 },
          { t: 4, v: 1 },
        ],
      },
      nodes: [graph.nodes[0]!],
    }).frame(1);
    expect(keyed.eye[1]).toBe(0.5);
  });

  it('wraps scene time with loop but keeps progress on film time', () => {
    const looped = createGraphEvaluator(
      {
        camera: { type: 'perspective', eye: ['t', 'p', 0], target: [0, 0, 0] },
        loop: { inSec: 0, outSec: 4 },
        nodes: [graph.nodes[0]!],
      },
      { durationSec: 10 },
    ).frame(6);
    expect(looped.eye).toEqual([2, 0.6, 0]);
    expect(looped.timeSec).toBe(2);
  });

  it('refuses a graph with expression errors', () => {
    expect(() =>
      createGraphEvaluator({
        ...graph,
        nodes: [{ ...graph.nodes[0]!, translation: ['nope', 0, 0] }],
      }),
    ).toThrow(/nodes\.0\.translation\.0/);
  });
});

const lit = (color: [number, number, number] = [1, 1, 1]) => ({ kind: 'lit' as const, color });
const box: GraphGeometry = { type: 'box', size: [1, 1, 1] };
const baseCamera: SequenceGraph['camera'] = { type: 'locked', eye: [0, 0, 5], target: [0, 0, 0] };

describe('graph v2 nodes', () => {
  it('composes parent transforms, and children inherit visibility and vars', () => {
    const nodes: GraphNode[] = [
      { id: 'group', translation: [10, 0, 0], vars: { lift: 't * 2' }, visible: 't < 5' },
      { id: 'child', parent: 'group', geometry: box, material: lit(), translation: [1, 'lift', 0] },
    ];
    const evaluate = createGraphEvaluator({ camera: baseCamera, nodes }).frame;
    expect(evaluate(0).nodes[0]?.copies).toEqual([]);
    expect(position(evaluate(2).nodes[1]!.copies[0]!.model)).toEqual([11, 4, 0]);
    expect(evaluate(6).nodes[1]?.copies).toEqual([]);
  });

  it('draws instances with i and n, and layouts place them', () => {
    const nodes: GraphNode[] = [
      {
        id: 'row',
        geometry: box,
        material: { kind: 'lit', color: ['i / n', 0, 0] },
        instances: { count: 3, layout: 'line', spacing: [2, 0, 0] },
        translation: [0, 'i', 0],
      },
    ];
    const copies = createGraphEvaluator({ camera: baseCamera, nodes }).frame(0).nodes[0]!.copies;
    expect(copies.map((copy) => position(copy.model))).toEqual([
      [0, 0, 0],
      [2, 1, 0],
      [4, 2, 0],
    ]);
    expect(copies.map((copy) => copy.color[0])).toEqual([0, 1 / 3, 2 / 3]);
  });

  it('lays out grids, rings and explicit points, with seeded jitter', () => {
    const grid = layoutOffsets({
      id: 'g',
      instances: { count: 4, layout: 'grid', spacing: [2, 0, 2] },
    });
    expect(grid).toEqual([
      [-1, 0, -1],
      [1, 0, -1],
      [-1, 0, 1],
      [1, 0, 1],
    ]);
    const ring = layoutOffsets({ id: 'r', instances: { count: 4, layout: 'ring', radius: 2 } });
    expect(ring[1]?.[0]).toBeCloseTo(2);
    expect(ring[2]?.[2]).toBeCloseTo(-2);
    const explicit = layoutOffsets({
      id: 'e',
      instances: {
        count: 2,
        layout: 'explicit',
        points: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      },
    });
    expect(explicit).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const jittered = { id: 'j', instances: { count: 3, jitter: 0.5, seed: 4 } };
    expect(layoutOffsets(jittered)).toEqual(layoutOffsets(jittered));
    for (const offset of layoutOffsets(jittered)) {
      for (const value of offset) expect(Math.abs(value)).toBeLessThanOrEqual(0.5);
    }
  });

  it('scrolls repeat copies along an axis and wraps them', () => {
    const nodes: GraphNode[] = [
      {
        id: 'floor',
        geometry: box,
        material: lit(),
        repeat: { axis: 'x', period: 4, copies: 3, offset: 't' },
        translation: [0, 'k', 0],
      },
    ];
    const at = (t: number) =>
      createGraphEvaluator({ camera: baseCamera, nodes })
        .frame(t)
        .nodes[0]!.copies.map((copy) => position(copy.model));
    expect(at(1)).toEqual([
      [-5, -1, 0],
      [-1, 0, 0],
      [3, 1, 0],
    ]);
    // A whole period later the treadmill looks the same.
    expect(at(5)).toEqual(at(1));
  });

  it('squashes with volume preserved, and wobble settles', () => {
    const nodes: GraphNode[] = [
      {
        id: 'blob',
        geometry: box,
        material: lit(),
        squash: 0.25,
        wobble: { amp: 0.5, freq: 1, decay: 3, start: 1 },
      },
    ];
    const evaluate = createGraphEvaluator({ camera: baseCamera, nodes }).frame;
    const scaleAt = (t: number) => {
      const m = evaluate(t).nodes[0]!.copies[0]!.model;
      return [m[0], m[5], m[10]];
    };
    expect(scaleAt(0)).toEqual([2, 0.25, 2]);
    const [x, y, z] = scaleAt(1.25);
    expect(x! * y! * z!).toBeCloseTo(1);
    // A quarter cycle in: sin = 1, decayed by exp(-3 * 0.25).
    expect(y).toBeCloseTo(0.25 * (1 + 0.5 * Math.exp(-0.75)));
    expect(scaleAt(20)[1]).toBeCloseTo(0.25);
  });

  it('writes field points with per-point vars', () => {
    const nodes: GraphNode[] = [
      {
        id: 'sparks',
        vars: { lift: '10' },
        geometry: {
          type: 'field',
          count: 3,
          vars: { twice: 'i * 2' },
          position: ['twice', 'lift', 'n'],
        },
        material: { kind: 'unlit', color: [1, 1, 1] },
      },
    ];
    const evaluator = createGraphEvaluator({ camera: baseCamera, nodes });
    evaluator.frame(0);
    const out = new Float32Array(9);
    evaluator.writeField(0, out);
    expect([...out]).toEqual([0, 10, 3, 2, 10, 3, 4, 10, 3]);
  });

  it('scales a lineCube by its size without passing that to children', () => {
    const nodes: GraphNode[] = [
      {
        id: 'cube',
        geometry: { type: 'lineCube', size: 2 },
        material: { kind: 'line', color: [1, 1, 1] },
      },
      { id: 'ball', parent: 'cube', geometry: box, material: lit(), translation: [1, 0, 0] },
    ];
    const frame = createGraphEvaluator({ camera: baseCamera, nodes }).frame(0);
    expect(frame.nodes[0]!.copies[0]!.model[0]).toBe(2);
    expect(position(frame.nodes[1]!.copies[0]!.model)).toEqual([1, 0, 0]);
    expect(frame.nodes[1]!.copies[0]!.model[0]).toBe(1);
  });

  it('derives emissive from glow and colour', () => {
    const nodes: GraphNode[] = [
      { id: 'cel', geometry: box, material: { kind: 'cel', color: [1, 0.5, 0], glow: 0.2 } },
    ];
    const copy = createGraphEvaluator({ camera: baseCamera, nodes }).frame(0).nodes[0]!.copies[0]!;
    expect(copy.emissive).toEqual([0.2, 0.1, 0]);
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

  it('sizes dynamic geometry for its first frame', () => {
    expect(buildGeometry({ type: 'field', count: 5, position: [0, 0, 0] }).positions.length).toBe(
      15,
    );
    const emitter: GraphEmitter = { type: 'emitter', rate: 10, life: 2, speed: 1 };
    expect(buildGeometry(emitter).positions.length).toBe(emitterCapacity(emitter) * 3);
    const hose = buildGeometry({
      type: 'hose',
      from: [0, 0, 0],
      to: [0, -1, 0],
      length: 1,
      radius: 0.1,
    });
    expect(hose.indices?.length).toBe(11 * 8 * 6);
  });
});

describe('EmitterSim', () => {
  const spec: GraphEmitter = {
    type: 'emitter',
    rate: 30,
    burst: [{ t: 0, v: 5 }],
    life: 1,
    speed: [1, 2],
    spread: 20,
    gravity: [0, -9.8, 0],
    seed: 2,
  };

  it('sizes its pool from rate, life and bursts', () => {
    expect(emitterCapacity(spec)).toBe(30 + 5 + 1);
    expect(emitterCapacity({ ...spec, capacity: 7 })).toBe(7);
  });

  it('is seekable: a frame does not depend on the frames drawn before it', () => {
    const forward = new EmitterSim(spec);
    for (let t = 0; t <= 2; t += 0.1) forward.sample(t);
    const aliveForward = forward.sample(2.5);
    const positionsForward = [...forward.positions.slice(0, aliveForward * 3)];

    const jumped = new EmitterSim(spec);
    jumped.sample(3);
    const aliveJumped = jumped.sample(2.5);
    expect(aliveJumped).toBe(aliveForward);
    expect([...jumped.positions.slice(0, aliveJumped * 3)]).toEqual(positionsForward);
  });

  it('emits the burst at once and retires particles after their life', () => {
    const sim = new EmitterSim({ type: 'emitter', burst: [{ t: 0.5, v: 4 }], life: 1, speed: 1 });
    expect(sim.sample(0.4)).toBe(0);
    expect(sim.sample(0.5 + EMITTER_STEP)).toBe(4);
    expect(sim.sample(1.4)).toBe(4);
    expect(sim.sample(1.6)).toBe(0);
  });

  it('launches inside its cone, and falls under gravity', () => {
    const sim = new EmitterSim({
      type: 'emitter',
      burst: [{ t: 0, v: 20 }],
      life: 5,
      speed: 2,
      spread: 10,
    });
    const alive = sim.sample(0.1);
    for (let p = 0; p < alive; p++) {
      const [x, y, z] = [
        sim.positions[p * 3]!,
        sim.positions[p * 3 + 1]!,
        sim.positions[p * 3 + 2]!,
      ];
      // Within 10 degrees of straight up.
      expect(Math.hypot(x, z) / y).toBeLessThan(Math.tan(10 * DEG) + 1e-6);
    }
    const falling = new EmitterSim({
      type: 'emitter',
      burst: [{ t: 0, v: 1 }],
      life: 5,
      speed: 2,
      spread: 0,
      gravity: [0, -10, 0],
    });
    falling.sample(1);
    // y = 2t - 5t^2 at t = 1 (stepped at 60 Hz, so close, not exact).
    expect(falling.positions[1]).toBeCloseTo(-3, 0);
  });
});

describe('HoseTube', () => {
  it('runs straight when taut and bows when slack, keeping its radius', () => {
    const tube = new HoseTube({ length: 1, radius: 0.1, samples: 9, radial: 6 });
    tube.update([0, 0, 0], [0, -1, 0]);
    // Ring 4 (the middle) sits on the axis when the hose is taut.
    const middle = 4 * 7 * 3;
    const centerX = (tube.positions[middle]! + tube.positions[middle + 9]!) / 2;
    expect(Math.abs(centerX)).toBeLessThan(0.11);

    tube.update([0, 0, 0], [0.5, 0, 0]);
    const mid = Array.from({ length: 6 }, (_, r) => tube.positions[middle + r * 3 + 1]!);
    const centerY = mid.reduce((sum, y) => sum + y, 0) / mid.length;
    // Bows toward +y (the default bend) by a fair share of its length.
    expect(centerY).toBeGreaterThan(0.2);
    for (let r = 0; r < 6; r++) {
      const n = [
        tube.normals[middle + r * 3]!,
        tube.normals[middle + r * 3 + 1]!,
        tube.normals[middle + r * 3 + 2]!,
      ];
      expect(Math.hypot(...n)).toBeCloseTo(1);
    }
  });
});

describe('SequenceGraphSchema', () => {
  const minimal: SequenceGraph = {
    camera: baseCamera,
    nodes: [{ id: 'a', geometry: box, material: lit() }],
  };

  const problems = (patch: Record<string, unknown>) => {
    const raw = { ...minimal, ...patch };
    const parsed = SequenceGraphSchema.safeParse(raw);
    if (parsed.success) return [];
    return graphProblems(raw, parsed.error as z.ZodError).map(
      (problem) => `${problem.where} ${problem.message}`,
    );
  };

  it('accepts every v2 feature together', () => {
    expect(
      problems({
        vars: {
          beat: 'floor(t / 0.5)',
          drop: [
            { t: 0, v: 0 },
            { t: 1, v: 2, ease: 'out' },
          ],
        },
        environment: {
          background: ['beat % 2 == 0 ? 0 : 0.1', 0, 0],
          pointLight: { position: [0, 1, 0], color: [1, 1, 1], range: 3 },
        },
        nodes: [
          {
            id: 'group',
            instances: { count: 3, layout: 'ring', radius: 2 },
            vars: { lift: 'i * 0.1' },
          },
          {
            id: 'body',
            parent: 'group',
            geometry: box,
            material: { kind: 'cel', color: [1, 0, 0], glow: 0.2 },
            squash: 'beat % 2 == 0 ? 0.8 : 1',
            translation: [0, 'lift', 0],
          },
          {
            id: 'floor',
            geometry: { type: 'plane', width: 4, depth: 4 },
            material: { kind: 'lit', color: [1, 1, 1], vertexColor: true },
            repeat: { axis: 'x', period: 4, speed: 1 },
          },
          {
            id: 'leg',
            geometry: {
              type: 'hose',
              from: [0, 0, 0],
              to: ['sin(t)', -1, 0],
              length: 1.2,
              radius: 0.05,
            },
            material: lit(),
          },
          {
            id: 'dust',
            geometry: {
              type: 'emitter',
              burst: [{ t: 1, v: 20 }],
              life: 1,
              speed: [0.5, 1],
              gravity: [0, -2, 0],
            },
            material: { kind: 'unlit', color: [1, 1, 1], size: 4, alpha: 0.5 },
          },
          {
            id: 'steam',
            geometry: { type: 'field', count: 10, vars: { up: 'i * 0.1' }, position: [0, 'up', 0] },
            material: { kind: 'unlit', color: [1, 1, 1] },
          },
          {
            id: 'band',
            geometry: { type: 'ribbon', mix: 'smoothstep(0, 10, t)' },
            material: lit(),
            wobble: { amp: 0.2, freq: 3, decay: 2, start: 1 },
          },
        ],
        markers: [
          { t: 1, label: 'drop' },
          { t: 2, label: 'land' },
        ],
        post: { vignette: { strength: 0.4 }, ghosts: { count: 3, decay: 0.5, mode: 'darken' } },
      }),
    ).toEqual([]);
  });

  it('formats positive-number, unknown-key and expression problems by node id', () => {
    expect(
      problems({
        nodes: [{ id: 'leg-l', geometry: { type: 'box', size: [1, 0, 1] }, material: lit() }],
      }),
    ).toEqual(['node leg-l: geometry.size[1] must be positive']);
    expect(
      problems({ nodes: [{ id: 'arm', geometry: box, material: lit(), spinn: [0, 1, 0] }] }),
    ).toEqual(['node arm: unknown key spinn']);
    const [expression] = problems({
      nodes: [{ id: 'arm', geometry: box, material: lit(), translation: ['sin(t', 0, 0] }],
    });
    expect(expression).toMatch(/^node arm: translation\[0\] expression "sin\(t": expected "\)"/);
    expect(
      problems({ nodes: [{ id: 'arm', geometry: box, material: lit(), visible: 'speed > 1' }] }),
    ).toEqual([
      expect.stringMatching(/^node arm: visible expression "speed > 1": unknown name "speed"/),
    ]);
  });

  it('formats the codegen line with the sequence id', () => {
    const raw = {
      ...minimal,
      nodes: [{ id: 'leg-l', geometry: { type: 'sphere', radius: -1 }, material: lit() }],
    };
    const parsed = SequenceGraphSchema.safeParse(raw);
    if (parsed.success) throw new Error('expected a failure');
    expect(formatGraphProblems('hose-chase', graphProblems(raw, parsed.error as z.ZodError))).toBe(
      'sequence hose-chase node leg-l: geometry.radius must be positive',
    );
  });

  it('scopes vars: ancestors yes, siblings no, built-in names never', () => {
    const sibling = problems({
      nodes: [
        { id: 'a', vars: { lift: '1' } },
        { id: 'b', geometry: box, material: lit(), translation: [0, 'lift', 0] },
      ],
    });
    expect(sibling).toEqual([
      expect.stringMatching(/node b: translation\[1\] expression "lift": unknown name "lift"/),
    ]);
    expect(problems({ vars: { t: '1' } })).toEqual(['vars.t var name "t" is a built-in name']);
    expect(problems({ vars: { later: 'sooner', sooner: '1' } })).toEqual([
      expect.stringMatching(/vars\.later expression "sooner": unknown name "sooner"/),
    ]);
  });

  it('checks hierarchy, copies and materials', () => {
    expect(
      problems({ nodes: [{ id: 'kid', parent: 'mum', geometry: box, material: lit() }] }),
    ).toEqual(['node kid: parent mum is not a node id']);
    expect(
      problems({
        nodes: [
          { id: 'a', instances: { count: 2 } },
          { id: 'b', parent: 'a', geometry: box, material: lit(), instances: { count: 2 } },
        ],
      }),
    ).toEqual([expect.stringMatching(/node b: instances already copied by a/)]);
    expect(
      problems({
        nodes: [
          {
            id: 'leg',
            instances: { count: 2 },
            geometry: { type: 'hose', from: [0, 0, 0], to: [0, -1, 0], length: 1, radius: 0.1 },
            material: lit(),
          },
        ],
      }),
    ).toEqual([
      expect.stringMatching(/node leg: geometry\.type hose geometry is rebuilt every frame/),
    ]);
    expect(
      problems({
        nodes: [
          {
            id: 'a',
            geometry: { type: 'emitter', life: 1, speed: 1 },
            material: { kind: 'unlit', color: [1, 1, 1] },
          },
        ],
      }),
    ).toEqual(['node a: geometry an emitter needs rate or burst']);
    expect(
      problems({
        nodes: [
          {
            id: 'a',
            geometry: box,
            material: { kind: 'lit', color: [1, 1, 1], glow: 0.2, emissive: [0, 0, 0] },
          },
        ],
      }),
    ).toEqual(['node a: material.glow set glow or emissive, not both']);
    expect(problems({ nodes: [{ id: 'a', geometry: box }] })).toEqual([
      'node a: material box geometry needs a material',
    ]);
  });

  it('checks keyframe order anywhere and marker order', () => {
    expect(
      problems({
        nodes: [
          {
            id: 'a',
            geometry: box,
            material: lit(),
            squash: [
              { t: 2, v: 1 },
              { t: 1, v: 0.5 },
            ],
          },
        ],
      }),
    ).toEqual(['node a: squash keyframe times must be strictly ascending']);
    expect(
      problems({
        markers: [
          { t: 2, label: 'b' },
          { t: 1, label: 'a' },
        ],
      }),
    ).toEqual(['markers marker times must be strictly ascending']);
  });
});
