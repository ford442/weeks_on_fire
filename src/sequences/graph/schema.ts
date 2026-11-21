import { z } from 'zod';

import { compileGraph } from './compile';
import { emitterCapacity, MAX_EMITTER_CAPACITY } from './emitter';
import { POINT_GEOMETRY } from './types';

import type { SequenceGraph } from './types';

/**
 * Zod schema for graph v2 (`types.ts`). Codegen validates every `content/sequences/*.graph.json`
 * with it (`scripts/content-index/graph-schema.ts` re-exports it); the in-hub editor validates
 * drafts with the same schema. Unknown keys fail. `issues.ts` turns its errors into
 * `node leg-l: scale[1] must be positive`.
 */

const num = z.number().finite();
const vec3 = z.tuple([num, num, num]);
const positive = num.positive();
const segments = z.number().int().min(3).max(128);
const expr = z
  .string()
  .min(1, { error: 'expression is empty' })
  .max(500, { error: 'expression is longer than 500 characters' });

const EaseSchema = z.enum(['linear', 'in', 'out', 'inOut', 'hold']);

function keyframe<T extends z.ZodType>(value: T) {
  return z.strictObject({ t: num.min(0), v: value, ease: EaseSchema.optional() });
}

function animated<T extends z.ZodType>(value: T) {
  return z.union([value, z.array(keyframe(value)).min(1)], {
    error: 'must be a value or a list of { t, v } keyframes',
  });
}

/** A number (checked by `value`), an expression string, or number keyframes. */
function scalarOf(value: z.ZodType<number> = num) {
  return z.union([value, expr, z.array(keyframe(value)).min(1)], {
    error: 'must be a number, an expression string, or a list of { t, v } keyframes',
  });
}
const scalar = scalarOf();

const part = z.union([num, expr], { error: 'must be a number or an expression string' });
const vector = z.union([z.tuple([part, part, part]), z.array(keyframe(vec3)).min(1)], {
  error:
    'must be [x, y, z] (numbers or expression strings) or a list of { t, v: [x, y, z] } keyframes',
});

const VarsSchema = z.record(
  z.string(),
  z.union([num, expr], { error: 'must be a number or an expression string' }),
);

const lens = { near: positive.optional(), far: positive.optional() };

const CameraSchema = z.discriminatedUnion(
  'type',
  [
    z.strictObject({
      type: z.literal('locked'),
      eye: vec3,
      target: vec3,
      fov: positive.max(140).optional(),
      ...lens,
    }),
    z.strictObject({
      type: z.literal('perspective'),
      eye: vector,
      target: vector,
      fov: scalarOf(positive.max(140)).optional(),
      ...lens,
    }),
    z.strictObject({
      type: z.literal('orbit'),
      target: vector.optional(),
      radius: scalarOf(positive),
      height: scalar,
      angle: scalar,
      fov: scalarOf(positive.max(140)).optional(),
      ...lens,
    }),
  ],
  { error: 'camera type must be locked, perspective or orbit' },
);

const EnvironmentSchema = z.strictObject({
  background: vector.optional(),
  lightDir: vector.optional(),
  lightColor: vector.optional(),
  ambient: vector.optional(),
  fogDensity: scalarOf(num.min(0)).optional(),
  fogColor: vector.optional(),
  pointLight: z
    .strictObject({ position: vector, color: vector, range: scalarOf(num.min(0)) })
    .optional(),
});

const EmitterSchema = z.strictObject({
  type: z.literal('emitter'),
  rate: animated(num.min(0)).optional(),
  burst: z
    .array(keyframe(z.number().int().min(0).max(MAX_EMITTER_CAPACITY)))
    .min(1)
    .optional(),
  life: positive.max(30),
  speed: z.union([num.min(0), z.tuple([num.min(0), num.min(0)])], {
    error: 'must be a speed or [min, max]',
  }),
  direction: vec3.optional(),
  spread: num.min(0).max(180).optional(),
  gravity: vec3.optional(),
  drag: num.min(0).optional(),
  origin: vec3.optional(),
  radius: num.min(0).optional(),
  floorY: num.optional(),
  bounce: num.min(0).max(1).optional(),
  seed: z.number().int().optional(),
  capacity: z.number().int().min(1).max(MAX_EMITTER_CAPACITY).optional(),
});

const GEOMETRY_TYPES =
  'box, sphere, cylinder, torus, plane, icosahedron, lathe, lineCube, icosahedronLines, line, points, field, emitter, ribbon or hose';

const GeometrySchema = z.discriminatedUnion(
  'type',
  [
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
    z.strictObject({
      type: z.literal('field'),
      count: z.number().int().min(1).max(5000),
      vars: VarsSchema.optional(),
      position: vector,
    }),
    EmitterSchema,
    z.strictObject({
      type: z.literal('ribbon'),
      mix: scalarOf(num.min(0).max(1)),
      uSegments: z.number().int().min(3).max(256).optional(),
      vSegments: z.number().int().min(1).max(64).optional(),
    }),
    z.strictObject({
      type: z.literal('hose'),
      from: vector,
      to: vector,
      length: positive,
      radius: positive,
      bend: vec3.optional(),
      samples: z.number().int().min(2).max(64).optional(),
      radial: z.number().int().min(3).max(32).optional(),
    }),
  ],
  { error: `geometry type must be ${GEOMETRY_TYPES}` },
);

const MaterialSchema = z.discriminatedUnion(
  'kind',
  [
    z.strictObject({
      kind: z.enum(['lit', 'cel']),
      color: vector,
      emissive: vector.optional(),
      glow: num.min(0).optional(),
      shininess: positive.optional(),
      outline: z.boolean().optional(),
      vertexColor: z.boolean().optional(),
    }),
    z.strictObject({
      kind: z.literal('unlit'),
      color: vector,
      size: scalarOf(positive).optional(),
      alpha: scalarOf(num.min(0).max(1)).optional(),
    }),
    z.strictObject({ kind: z.literal('line'), color: vector }),
  ],
  { error: 'material kind must be lit, cel, unlit or line' },
);

const NodeSchema = z.strictObject({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/, { error: 'node id must be letters, digits, - and _' }),
  parent: z.string().min(1).optional(),
  geometry: GeometrySchema.optional(),
  material: MaterialSchema.optional(),
  translation: vector.optional(),
  rotation: vector.optional(),
  scale: vector.optional(),
  spin: vec3.optional(),
  squash: scalarOf(positive).optional(),
  wobble: z
    .strictObject({
      amp: scalar,
      freq: positive,
      decay: num.min(0).optional(),
      start: num.min(0).optional(),
    })
    .optional(),
  visible: scalar.optional(),
  vars: VarsSchema.optional(),
  instances: z
    .strictObject({
      count: z.number().int().min(1).max(1000),
      layout: z.enum(['line', 'grid', 'ring', 'explicit']).optional(),
      spacing: vec3.optional(),
      columns: z.number().int().min(1).max(1000).optional(),
      radius: positive.optional(),
      points: z.array(vec3).min(1).max(1000).optional(),
      jitter: z.union([num.min(0), vec3]).optional(),
      seed: z.number().int().optional(),
    })
    .optional(),
  repeat: z
    .strictObject({
      axis: z.enum(['x', 'y', 'z']),
      period: positive,
      copies: z.number().int().min(1).max(50).optional(),
      speed: num.optional(),
      offset: scalar.optional(),
    })
    .optional(),
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
  'ribbon',
  'hose',
]);
const LINE_GEOMETRY = new Set(['lineCube', 'icosahedronLines', 'line']);
const POINTS = new Set<string>(POINT_GEOMETRY);

function ascending(keys: readonly { t: number }[]): boolean {
  return keys.every((key, index) => index === 0 || key.t > (keys[index - 1]?.t ?? -Infinity));
}

function isKeyframeList(value: unknown): value is { t: number }[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'object' && item !== null && 't' in item && 'v' in item)
  );
}

/** Every keyframe list in the graph (camera, environment, nodes, clips, emitters), with its path. */
export function keyframeLists(
  value: unknown,
  path: (string | number)[] = [],
): { path: (string | number)[]; keys: { t: number }[] }[] {
  if (isKeyframeList(value)) return [{ path, keys: value }];
  if (Array.isArray(value))
    return value.flatMap((item, index) => keyframeLists(item, [...path, index]));
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => keyframeLists(item, [...path, key]));
  }
  return [];
}

export const SequenceGraphSchema = z
  .strictObject({
    camera: CameraSchema,
    environment: EnvironmentSchema.optional(),
    vars: VarsSchema.optional(),
    nodes: z.array(NodeSchema).min(1).max(300),
    clips: z.array(ClipSchema).max(1000).optional(),
    loop: z.strictObject({ inSec: num.min(0), outSec: positive }).optional(),
    markers: z
      .array(z.strictObject({ t: num.min(0), label: z.string().min(1).max(80) }))
      .max(200)
      .optional(),
    post: z
      .strictObject({
        vignette: z
          .strictObject({
            strength: num.min(0).max(1),
            radius: num.min(0).max(1.5).optional(),
            softness: positive.max(2).optional(),
          })
          .optional(),
        ghosts: z
          .strictObject({
            count: z.number().int().min(1).max(4),
            decay: num.gt(0).max(1),
            spacing: positive.max(1).optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .superRefine((graph, ctx) => {
    const fail = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path });

    if (graph.loop && graph.loop.outSec <= graph.loop.inSec) {
      fail('loop.outSec must be greater than loop.inSec', ['loop', 'outSec']);
    }

    for (const list of keyframeLists(graph)) {
      // Markers are labelled times, not keyframes; they are checked below.
      if (list.path[0] === 'markers') continue;
      if (!ascending(list.keys)) fail('keyframe times must be strictly ascending', list.path);
    }
    if (graph.markers && !ascending(graph.markers)) {
      fail('marker times must be strictly ascending', ['markers']);
    }

    const nodes = new Map<string, (typeof graph.nodes)[number]>();
    graph.nodes.forEach((node, index) => {
      const at = (...rest: (string | number)[]) => ['nodes', index, ...rest];
      if (node.id === 'scene') fail('node id "scene" is reserved', at('id'));
      if (nodes.has(node.id)) fail(`duplicate node id ${node.id}`, at('id'));
      nodes.set(node.id, node);
      if (node.parent === node.id) fail('a node cannot be its own parent', at('parent'));

      const { geometry, material } = node;
      if (geometry && !material)
        return fail(`${geometry.type} geometry needs a material`, at('material'));
      if (material && !geometry)
        return fail('a material needs geometry (a group has neither)', at('geometry'));
      if (!geometry || !material) return;

      const kindPath = at('material', 'kind');
      if (TRIANGLE_GEOMETRY.has(geometry.type) && material.kind === 'line') {
        fail(`${geometry.type} needs a lit, cel or unlit material`, kindPath);
      } else if (LINE_GEOMETRY.has(geometry.type) && material.kind !== 'line') {
        fail(`${geometry.type} needs a line material`, kindPath);
      } else if (POINTS.has(geometry.type) && material.kind !== 'unlit') {
        fail(`${geometry.type} needs an unlit material`, kindPath);
      }
      if (material.kind === 'unlit' && !POINTS.has(geometry.type)) {
        if (material.size !== undefined || material.alpha !== undefined) {
          fail('unlit size / alpha apply to points, field and emitter only', kindPath);
        }
      }
      if (
        (material.kind === 'lit' || material.kind === 'cel') &&
        material.glow !== undefined &&
        material.emissive !== undefined
      ) {
        fail('set glow or emissive, not both', at('material', 'glow'));
      }
      if (
        (material.kind === 'lit' || material.kind === 'cel') &&
        material.vertexColor &&
        geometry.type !== 'plane'
      ) {
        fail(
          'vertexColor needs plane geometry (the only mesh with vertex colours)',
          at('material', 'vertexColor'),
        );
      }
      if (geometry.type === 'points' && geometry.radius[0] > geometry.radius[1]) {
        fail('points radius must be [min, max]', at('geometry', 'radius'));
      }
      if (geometry.type === 'lathe') {
        // Uint16 index buffer.
        const vertices = geometry.profile.length * ((geometry.segments ?? 24) + 1);
        if (vertices > 65535) fail('lathe exceeds 65535 vertices', at('geometry'));
      }
      if (geometry.type === 'emitter') {
        if (geometry.rate === undefined && geometry.burst === undefined) {
          fail('an emitter needs rate or burst', at('geometry'));
        }
        if (Array.isArray(geometry.speed) && geometry.speed[0] > geometry.speed[1]) {
          fail('speed must be [min, max]', at('geometry', 'speed'));
        }
        if (geometry.capacity === undefined && emitterCapacity(geometry) >= MAX_EMITTER_CAPACITY) {
          fail(
            `emitter could need more than ${MAX_EMITTER_CAPACITY} live particles; lower rate or life`,
            at('geometry'),
          );
        }
      }
    });

    graph.nodes.forEach((node, index) => {
      const instances = node.instances;
      if (!instances) return;
      const at = ['nodes', index, 'instances'];
      if (instances.layout === 'explicit') {
        if (instances.points?.length !== instances.count) {
          fail(`explicit layout needs exactly count (${instances.count}) points`, [
            ...at,
            'points',
          ]);
        }
      } else if (instances.points) {
        fail('points apply to the explicit layout only', [...at, 'points']);
      }
      if (instances.layout === 'ring' && instances.radius === undefined) {
        fail('ring layout needs a radius', [...at, 'radius']);
      }
    });

    const seen = new Set<string>();
    (graph.clips ?? []).forEach((clip, index) => {
      const path = ['clips', index];
      const key = `${clip.target}:${clip.property}`;
      if (seen.has(key)) fail(`duplicate clip for ${key}`, path);
      seen.add(key);

      const scalarProperty = clip.property === 'alpha' || clip.property === 'fogDensity';
      if (clip.keys.some((k) => (typeof k.v === 'number') !== scalarProperty)) {
        fail(`${clip.property} keys need ${scalarProperty ? 'a number' : 'a [x, y, z] vector'}`, [
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
      const material = node.material;
      if (clip.property === 'emissive' && material?.kind !== 'lit' && material?.kind !== 'cel') {
        fail(`emissive needs a lit or cel material on ${node.id}`, path);
      }
      if (clip.property === 'alpha' && !(node.geometry && POINTS.has(node.geometry.type))) {
        fail(`alpha applies to points, field and emitter nodes only (${node.id})`, path);
      }
    });

    // Expressions, scopes, parents and copies: the same compile the renderer runs.
    for (const issue of compileGraph(graph).issues) fail(issue.message, issue.path);
  }) satisfies z.ZodType<SequenceGraph>;
