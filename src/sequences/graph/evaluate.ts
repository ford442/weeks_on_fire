import { modelTRSX } from '../../lib/webgl/engine';
import { DEG, multiply, createMat4, type Mat4, type Vec3 } from '../../lib/webgl/math';

import { loopTime, sampleKeys } from './animate';
import { SLOT, compileGraph, repeatCopies, type CompiledGraph, type CompiledNode } from './compile';
import { mulberry32 } from './random';

import type { GraphClip, GraphNode, SequenceGraph } from './types';

/** One drawn copy of a node. */
export interface CopyFrame {
  /** Model matrix for this node's mesh (parent transforms and `lineCube` size included). */
  model: Mat4;
  color: Vec3;
  emissive: Vec3;
  alpha: number;
  /** Point size, pixels. */
  size: number;
  /** Instance index and repeat copy this copy was evaluated with. */
  i: number;
  k: number;
}

export interface NodeFrame {
  /** Visible copies only, in copy order (repeat outer, instances inner). */
  copies: CopyFrame[];
  /** Dynamic geometry inputs, evaluated at the node's first copy. */
  mix?: number;
  from?: Vec3;
  to?: Vec3;
}

export interface GraphFrame {
  /** Scene time (after `loop`). */
  timeSec: number;
  eye: Vec3;
  target: Vec3;
  fovDeg: number;
  near: number;
  far: number;
  background: Vec3;
  lightDir: Vec3;
  lightColor: Vec3;
  ambient: Vec3;
  fogDensity: number;
  fogColor: Vec3;
  pointPos: Vec3;
  pointColor: Vec3;
  /** 0 = no point light. */
  pointRange: number;
  /** Index-aligned with `graph.nodes`. */
  nodes: NodeFrame[];
}

export interface GraphEvaluator {
  /** Everything the renderer needs for film time `timeSec`. */
  frame: (timeSec: number) => GraphFrame;
  /** Writes a `field` node's point positions for the last `frame()` into `out` (xyz triples). */
  writeField: (nodeIndex: number, out: Float32Array) => void;
}

export const DEFAULT_FOV = 50;
export const DEFAULT_ENVIRONMENT = {
  background: [0.02, 0.02, 0.02] as Vec3,
  lightDir: [0.35, 0.82, 0.45] as Vec3,
  lightColor: [1, 0.92, 0.82] as Vec3,
  ambient: [0.12, 0.11, 0.1] as Vec3,
  fogColor: [0.04, 0.04, 0.045] as Vec3,
};
const DEFAULT_POINT_SIZE = 4;
const BLACK: Vec3 = [0, 0, 0];

/** `lineCube` meshes are built at unit size and scaled per node, so lattices share one mesh. */
export function geometryScale(node: GraphNode): number {
  return node.geometry?.type === 'lineCube' ? node.geometry.size : 1;
}

/** Offsets of an `instances` layout, jitter included. */
export function layoutOffsets(node: GraphNode): Vec3[] {
  const spec = node.instances;
  if (!spec) return [[0, 0, 0]];
  const offsets: Vec3[] = [];
  const spacing = spec.spacing ?? [1, 1, 1];
  const columns = spec.columns ?? Math.ceil(Math.sqrt(spec.count));
  const rows = Math.ceil(spec.count / columns);
  for (let i = 0; i < spec.count; i++) {
    switch (spec.layout) {
      case 'line':
        offsets.push([spacing[0] * i, spacing[1] * i, spacing[2] * i]);
        break;
      case 'grid': {
        const col = i % columns;
        const row = Math.floor(i / columns);
        offsets.push([
          (col - (columns - 1) / 2) * spacing[0],
          0,
          (row - (rows - 1) / 2) * spacing[2],
        ]);
        break;
      }
      case 'ring': {
        const angle = (i / spec.count) * Math.PI * 2;
        const radius = spec.radius ?? 1;
        offsets.push([Math.sin(angle) * radius, 0, Math.cos(angle) * radius]);
        break;
      }
      case 'explicit':
        offsets.push([...(spec.points?.[i] ?? [0, 0, 0])]);
        break;
      default:
        offsets.push([0, 0, 0]);
    }
  }
  if (spec.jitter !== undefined) {
    const jitter: Vec3 =
      typeof spec.jitter === 'number' ? [spec.jitter, spec.jitter, spec.jitter] : spec.jitter;
    const rand = mulberry32(spec.seed ?? 1);
    for (const offset of offsets) {
      for (let axis = 0; axis < 3; axis++)
        offset[axis] = (offset[axis] ?? 0) + (rand() * 2 - 1) * jitter[axis]!;
    }
  }
  return offsets;
}

function wobbleFactor(node: GraphNode, amp: number, t: number): number {
  const wobble = node.wobble;
  if (!wobble) return 1;
  const since = t - (wobble.start ?? 0);
  if (since < 0) return 1;
  return (
    1 + amp * Math.sin(Math.PI * 2 * wobble.freq * since) * Math.exp(-(wobble.decay ?? 0) * since)
  );
}

/**
 * Pure sampler: compiles the graph once, then resolves camera, environment and every node copy for
 * a film time. No GL. Throws if the graph has expression or structure errors (codegen reports them
 * first, with paths; see `schema.ts`).
 */
export function createGraphEvaluator(
  graph: SequenceGraph,
  options: { durationSec?: number } = {},
): GraphEvaluator {
  const { graph: compiled, issues } = compileGraph(graph);
  if (issues.length > 0) {
    const first = issues[0]!;
    throw new Error(`graph ${first.path.join('.')}: ${first.message}`);
  }
  const durationSec = options.durationSec ?? 0;
  const slots = new Float64Array(compiled.slotCount);
  const clipsByNode = new Map<string, GraphClip[]>();
  for (const clip of graph.clips ?? []) {
    const list = clipsByNode.get(clip.target) ?? [];
    list.push(clip);
    clipsByNode.set(clip.target, list);
  }
  const layouts = compiled.nodes.map((entry) => layoutOffsets(entry.node));
  // Per node, per copy: its own vars' values, world matrix (for children) and visibility.
  const varCache = compiled.nodes.map(
    (entry) => new Float64Array(entry.copies * entry.vars.length),
  );
  const worlds: Mat4[][] = compiled.nodes.map(() => []);
  const visible: boolean[][] = compiled.nodes.map(() => []);

  const restoreVars = (index: number, copy: number) => {
    const entry = compiled.nodes[index]!;
    const cache = varCache[index]!;
    const c = entry.copies === 1 ? 0 : copy;
    entry.vars.forEach((v, j) => (slots[v.slot] = cache[c * entry.vars.length + j]!));
  };

  const setCopy = (source: CompiledNode | undefined, copy: number) => {
    const count = source?.node.instances?.count ?? 1;
    const reps = source ? repeatCopies(source.node) : 1;
    slots[SLOT.i] = copy % count;
    slots[SLOT.n] = count;
    slots[SLOT.k] = Math.floor(copy / count) - Math.floor((reps - 1) / 2);
  };

  const evaluateNode = (entry: CompiledNode, t: number, out: NodeFrame) => {
    const { node, index } = entry;
    const source = entry.copySource >= 0 ? compiled.nodes[entry.copySource] : undefined;
    const clips = clipsByNode.get(node.id) ?? [];
    const g = geometryScale(node);
    const cache = varCache[index]!;
    worlds[index]!.length = 0;
    visible[index]!.length = 0;

    for (let copy = 0; copy < entry.copies; copy++) {
      setCopy(source, copy);
      for (const ancestor of entry.ancestors) restoreVars(ancestor, copy);
      entry.vars.forEach((v, j) => {
        const value = v.fn(slots);
        slots[v.slot] = value;
        cache[copy * entry.vars.length + j] = value;
      });

      const parentCopy = entry.parent >= 0 && compiled.nodes[entry.parent]!.copies > 1 ? copy : 0;
      const parentVisible =
        entry.parent >= 0 ? (visible[entry.parent]![parentCopy] ?? false) : true;
      const shown = parentVisible && (entry.visible ? entry.visible(slots) > 0 : true);
      visible[index]!.push(shown);
      if (!shown) {
        worlds[index]!.push(createMat4());
        continue;
      }

      let translation: Vec3 = entry.translation ? entry.translation(slots) : [0, 0, 0];
      let rotationDeg: Vec3 = entry.rotation ? entry.rotation(slots) : [0, 0, 0];
      let scale: Vec3 = entry.scale ? entry.scale(slots) : [1, 1, 1];
      let emissiveClip: Vec3 | undefined;
      let alphaClip: number | undefined;
      for (const clip of clips) {
        const value = sampleKeys(clip.keys, t, clip.ease);
        if (clip.property === 'translation') translation = value as Vec3;
        else if (clip.property === 'rotation') rotationDeg = value as Vec3;
        else if (clip.property === 'scale') scale = value as Vec3;
        else if (clip.property === 'emissive') emissiveClip = value as Vec3;
        else if (clip.property === 'alpha') alphaClip = value as number;
      }

      if (entry.copySource === index) {
        const i = slots[SLOT.i]!;
        const k = slots[SLOT.k]!;
        const offset = layouts[index]![i] ?? [0, 0, 0];
        translation = [
          translation[0] + offset[0],
          translation[1] + offset[1],
          translation[2] + offset[2],
        ];
        const repeat = node.repeat;
        if (repeat) {
          const travel =
            (entry.repeatOffset ? entry.repeatOffset(slots) : 0) + (repeat.speed ?? 0) * t;
          const wrapped = ((travel % repeat.period) + repeat.period) % repeat.period;
          const axis = repeat.axis === 'x' ? 0 : repeat.axis === 'y' ? 1 : 2;
          translation[axis] = translation[axis] + (-wrapped + k * repeat.period);
        }
      }

      const spin = node.spin ?? [0, 0, 0];
      const rx = (rotationDeg[0] + spin[0] * t) * DEG;
      const ry = (rotationDeg[1] + spin[1] * t) * DEG;
      const rz = (rotationDeg[2] + spin[2] * t) * DEG;

      if (entry.squash || node.wobble) {
        const amp = entry.wobbleAmp ? entry.wobbleAmp(slots) : 0;
        const s = Math.max(
          0.01,
          (entry.squash ? entry.squash(slots) : 1) * wobbleFactor(node, amp, t),
        );
        const wide = 1 / Math.sqrt(s);
        scale = [scale[0] * wide, scale[1] * s, scale[2] * wide];
      }

      const [x, y, z] = translation;
      const local = modelTRSX(x, y, z, rx, ry, rz, scale[0] * g, scale[1] * g, scale[2] * g);
      const parentWorld = entry.parent >= 0 ? worlds[entry.parent]![parentCopy] : undefined;
      const model = parentWorld ? multiply(createMat4(), parentWorld, local) : local;
      if (entry.hasChildren) {
        if (g === 1) worlds[index]!.push(model);
        else {
          const plain = modelTRSX(x, y, z, rx, ry, rz, scale[0], scale[1], scale[2]);
          worlds[index]!.push(parentWorld ? multiply(createMat4(), parentWorld, plain) : plain);
        }
      } else {
        worlds[index]!.push(model);
      }

      const material = node.material;
      if (!material || !node.geometry) continue;
      const color = entry.color ? entry.color(slots) : BLACK;
      let emissive: Vec3 = BLACK;
      if (material.kind === 'lit' || material.kind === 'cel') {
        if (emissiveClip) emissive = emissiveClip;
        else if (entry.emissive) emissive = entry.emissive(slots);
        else if (material.glow !== undefined) {
          const glow = material.glow;
          emissive = [color[0] * glow, color[1] * glow, color[2] * glow];
        }
      }
      out.copies.push({
        model,
        color,
        emissive,
        alpha: alphaClip ?? (entry.alpha ? entry.alpha(slots) : 1),
        size: entry.size ? entry.size(slots) : DEFAULT_POINT_SIZE,
        i: slots[SLOT.i]!,
        k: slots[SLOT.k]!,
      });

      if (copy === 0) {
        if (entry.mix) out.mix = entry.mix(slots);
        if (entry.from) out.from = entry.from(slots);
        if (entry.to) out.to = entry.to(slots);
      }
    }
  };

  const frame = (filmTime: number): GraphFrame => {
    const t = loopTime(filmTime, graph.loop);
    slots.fill(0);
    slots[SLOT.t] = t;
    slots[SLOT.p] = durationSec > 0 ? filmTime / durationSec : 0;
    slots[SLOT.dur] = durationSec;
    slots[SLOT.n] = 1;
    for (const v of compiled.vars) slots[v.slot] = v.fn(slots);

    const { eye, target, fovDeg } = evaluateCamera(graph, compiled, slots);
    const lens = graph.camera;
    const env = compiled.environment;
    let fogDensity = env.fogDensity ? env.fogDensity(slots) : 0;
    for (const clip of clipsByNode.get('scene') ?? []) {
      if (clip.property === 'fogDensity')
        fogDensity = sampleKeys(clip.keys, t, clip.ease) as number;
    }
    const result: GraphFrame = {
      timeSec: t,
      eye,
      target,
      fovDeg,
      near: lens.near ?? 0.1,
      far: lens.far ?? 60,
      background: env.background ? env.background(slots) : DEFAULT_ENVIRONMENT.background,
      lightDir: env.lightDir ? env.lightDir(slots) : DEFAULT_ENVIRONMENT.lightDir,
      lightColor: env.lightColor ? env.lightColor(slots) : DEFAULT_ENVIRONMENT.lightColor,
      ambient: env.ambient ? env.ambient(slots) : DEFAULT_ENVIRONMENT.ambient,
      fogDensity,
      fogColor: env.fogColor ? env.fogColor(slots) : DEFAULT_ENVIRONMENT.fogColor,
      pointPos: env.pointPosition ? env.pointPosition(slots) : [0, 0, 0],
      pointColor: env.pointColor ? env.pointColor(slots) : [1, 0.7, 0.35],
      pointRange: env.pointRange ? env.pointRange(slots) : 0,
      nodes: [],
    };
    for (const entry of compiled.nodes) {
      const out: NodeFrame = { copies: [] };
      evaluateNode(entry, t, out);
      result.nodes.push(out);
    }
    return result;
  };

  const writeField = (nodeIndex: number, out: Float32Array) => {
    const entry = compiled.nodes[nodeIndex];
    const geometry = entry?.node.geometry;
    if (!entry || !entry.position || geometry?.type !== 'field') return;
    for (const ancestor of entry.ancestors) restoreVars(ancestor, 0);
    restoreVars(nodeIndex, 0);
    slots[SLOT.n] = geometry.count;
    slots[SLOT.k] = 0;
    const count = Math.min(geometry.count, out.length / 3);
    const pointVars = entry.fieldVars ?? [];
    for (let i = 0; i < count; i++) {
      slots[SLOT.i] = i;
      for (const v of pointVars) slots[v.slot] = v.fn(slots);
      const [x, y, z] = entry.position(slots);
      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }
  };

  return { frame, writeField };
}

function evaluateCamera(
  graph: SequenceGraph,
  compiled: CompiledGraph,
  slots: Float64Array,
): { eye: Vec3; target: Vec3; fovDeg: number } {
  const camera = compiled.camera;
  const target = camera.target(slots);
  const fovDeg = camera.fov(slots);
  if (graph.camera.type !== 'orbit') return { eye: camera.eye(slots), target, fovDeg };
  const radius = camera.radius?.(slots) ?? 1;
  const angle = (camera.angle?.(slots) ?? 0) * DEG;
  return {
    eye: [
      target[0] + Math.sin(angle) * radius,
      camera.height?.(slots) ?? 0,
      target[2] + Math.cos(angle) * radius,
    ],
    target,
    fovDeg,
  };
}
