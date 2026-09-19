import { z } from 'zod';

import type { SequenceGraph } from '../../src/sequences/graph/types';

const num = z.number().finite();
const vec3 = z.tuple([num, num, num]);
const positive = num.positive();
const segments = z.number().int().min(3).max(128);

const EaseSchema = z.enum(['linear', 'in', 'out', 'inOut', 'hold']);

function keyframe<T extends z.ZodType>(value: T) {
  return z.strictObject({ t: num.min(0), v: value, ease: EaseSchema.optional() });
}

function animated<T extends z.ZodType>(value: T) {
  return z.union([value, z.array(keyframe(value)).min(1)]);
}

const CameraSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('locked'),
    eye: vec3,
    target: vec3,
    fov: positive.max(140).optional(),
  }),
  z.strictObject({
    type: z.literal('perspective'),
    eye: animated(vec3),
    target: animated(vec3),
    fov: animated(positive.max(140)).optional(),
  }),
  z.strictObject({
    type: z.literal('orbit'),
    target: animated(vec3).optional(),
    radius: animated(positive),
    height: animated(num),
    angle: animated(num),
    fov: animated(positive.max(140)).optional(),
  }),
]);

const EnvironmentSchema = z.strictObject({
  background: vec3.optional(),
  lightDir: vec3.optional(),
  lightColor: vec3.optional(),
  ambient: vec3.optional(),
  fogDensity: num.min(0).optional(),
  fogColor: vec3.optional(),
});

const GeometrySchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('box'), size: z.tuple([positive, positive, positive]) }),
  z.strictObject({
    type: z.literal('sphere'),
    radius: positive,
    lat: segments.optional(),
    long: segments.optional(),
  }),
  z.strictObject({
    type: z.literal('cylinder'),
    radius: positive,
    height: positive,
    radial: segments.optional(),
    caps: z.boolean().optional(),
  }),
  z.strictObject({
    type: z.literal('torus'),
    major: positive,
    minor: positive,
    majorSeg: segments.optional(),
    minorSeg: segments.optional(),
  }),
  z.strictObject({
    type: z.literal('plane'),
    width: positive,
    depth: positive,
    nx: z.number().int().min(1).max(128).optional(),
    nz: z.number().int().min(1).max(128).optional(),
  }),
  z.strictObject({ type: z.literal('icosahedron'), radius: positive }),
  z.strictObject({
    type: z.literal('lathe'),
    profile: z
      .array(z.tuple([num.min(0), num]))
      .min(2)
      .max(64),
    segments: segments.optional(),
  }),
  z.strictObject({ type: z.literal('lineCube'), size: positive }),
  z.strictObject({ type: z.literal('icosahedronLines'), radius: positive }),
  z.strictObject({
    type: z.literal('line'),
    points: z.array(vec3).min(2).max(4096),
    closed: z.boolean().optional(),
  }),
  z.strictObject({
    type: z.literal('points'),
    count: z.number().int().min(1).max(5000),
    radius: z.tuple([num.min(0), num.min(0)]),
    flatten: num.min(0).optional(),
    seed: z.number().int().optional(),
  }),
]);

const MaterialSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.enum(['lit', 'cel']),
    color: vec3,
    emissive: vec3.optional(),
    shininess: positive.optional(),
    outline: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('unlit'),
    color: vec3,
    size: positive.optional(),
    alpha: num.min(0).max(1).optional(),
  }),
  z.strictObject({ kind: z.literal('line'), color: vec3 }),
]);

const NodeSchema = z.strictObject({
  id: z.string().min(1),
  geometry: GeometrySchema,
  material: MaterialSchema,
  translation: vec3.optional(),
  rotation: vec3.optional(),
  scale: vec3.optional(),
  spin: vec3.optional(),
});

const ClipSchema = z.strictObject({
  target: z.string().min(1),
  property: z.enum(['translation', 'rotation', 'scale', 'emissive', 'alpha', 'fogDensity']),
  keys: z.array(keyframe(z.union([num, vec3]))).min(1),
  ease: EaseSchema.optional(),
});

const TRIANGLE_GEOMETRY = new Set([
  'box',
  'sphere',
  'cylinder',
  'torus',
  'plane',
  'icosahedron',
  'lathe',
]);
const LINE_GEOMETRY = new Set(['lineCube', 'icosahedronLines', 'line']);

function ascending(keys: readonly { t: number }[]): boolean {
  return keys.every((key, index) => index === 0 || key.t > (keys[index - 1]?.t ?? -Infinity));
}

function isKeyframeList(value: unknown): value is { t: number }[] {
  return Array.isArray(value) && typeof value[0] === 'object' && value[0] !== null;
}

export const SequenceGraphSchema = z
  .strictObject({
    camera: CameraSchema,
    environment: EnvironmentSchema.optional(),
    nodes: z.array(NodeSchema).min(1).max(200),
    clips: z.array(ClipSchema).max(1000).optional(),
    loop: z.strictObject({ inSec: num.min(0), outSec: positive }).optional(),
  })
  .superRefine((graph, ctx) => {
    const fail = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path });

    if (graph.loop && graph.loop.outSec <= graph.loop.inSec) {
      fail('loop.outSec must be greater than loop.inSec', ['loop', 'outSec']);
    }

    for (const [name, value] of Object.entries(graph.camera)) {
      if (isKeyframeList(value) && !ascending(value)) {
        fail(`camera.${name} keyframe times must be strictly ascending`, ['camera', name]);
      }
    }

    const nodes = new Map<string, (typeof graph.nodes)[number]>();
    graph.nodes.forEach((node, index) => {
      if (node.id === 'scene') fail('node id "scene" is reserved', ['nodes', index, 'id']);
      if (nodes.has(node.id)) fail(`duplicate node id ${node.id}`, ['nodes', index, 'id']);
      nodes.set(node.id, node);

      const { geometry, material } = node;
      const path = ['nodes', index, 'material', 'kind'];
      if (TRIANGLE_GEOMETRY.has(geometry.type) && material.kind === 'line') {
        fail(`${geometry.type} needs a lit, cel or unlit material`, path);
      } else if (LINE_GEOMETRY.has(geometry.type) && material.kind !== 'line') {
        fail(`${geometry.type} needs a line material`, path);
      } else if (geometry.type === 'points' && material.kind !== 'unlit') {
        fail('points need an unlit material', path);
      }
      if (material.kind === 'unlit' && geometry.type !== 'points') {
        if (material.size !== undefined || material.alpha !== undefined) {
          fail('unlit size / alpha apply to points only', path);
        }
      }
      if (geometry.type === 'points' && geometry.radius[0] > geometry.radius[1]) {
        fail('points radius must be [min, max]', ['nodes', index, 'geometry', 'radius']);
      }
      if (geometry.type === 'lathe') {
        // Uint16 index buffer.
        const vertices = geometry.profile.length * ((geometry.segments ?? 24) + 1);
        if (vertices > 65535) fail('lathe exceeds 65535 vertices', ['nodes', index, 'geometry']);
      }
    });

    const seen = new Set<string>();
    (graph.clips ?? []).forEach((clip, index) => {
      const path = ['clips', index];
      const key = `${clip.target}:${clip.property}`;
      if (seen.has(key)) fail(`duplicate clip for ${key}`, path);
      seen.add(key);

      if (!ascending(clip.keys))
        fail('clip key times must be strictly ascending', [...path, 'keys']);

      const scalar = clip.property === 'alpha' || clip.property === 'fogDensity';
      if (clip.keys.some((k) => (typeof k.v === 'number') !== scalar)) {
        fail(`${clip.property} keys need ${scalar ? 'a number' : 'a [x, y, z] vector'}`, [
          ...path,
          'keys',
        ]);
      }

      if (clip.target === 'scene') {
        if (clip.property !== 'fogDensity') fail('scene clips can only animate fogDensity', path);
        return;
      }
      const node = nodes.get(clip.target);
      if (!node) return fail(`clip target ${clip.target} is not a node id`, [...path, 'target']);
      if (clip.property === 'fogDensity') fail('fogDensity belongs on target "scene"', path);
      if (
        clip.property === 'emissive' &&
        node.material.kind !== 'lit' &&
        node.material.kind !== 'cel'
      ) {
        fail(`emissive needs a lit or cel material on ${node.id}`, path);
      }
      if (clip.property === 'alpha' && node.geometry.type !== 'points') {
        fail(`alpha applies to points nodes only (${node.id})`, path);
      }
    });
  }) satisfies z.ZodType<SequenceGraph>;
