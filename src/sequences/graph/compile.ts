import { sampleKeys } from './animate';
import {
  BUILTIN_SLOTS,
  FUNCTION_NAMES,
  ExprError,
  compileExpr,
  type Compiled,
  type ResolveSlot,
} from './expr';
import {
  DYNAMIC_GEOMETRY,
  type GraphNode,
  type Keyframe,
  type Scalar,
  type SequenceGraph,
  type Vector,
} from './types';

import type { Vec3 } from '../../lib/webgl/math';

/** Where each built-in lives in the slot array. */
export const SLOT = { t: 0, p: 1, dur: 2, i: 3, n: 4, k: 5 } as const;

export type CompiledVector = (slots: Float64Array) => Vec3;

export interface GraphIssue {
  /** JSON path inside the graph, e.g. `['nodes', 3, 'translation', 1]`. */
  path: (string | number)[];
  message: string;
}

export interface CompiledVar {
  name: string;
  slot: number;
  fn: Compiled;
}

export interface CompiledNode {
  node: GraphNode;
  index: number;
  parent: number;
  /** Root first, parent last. */
  ancestors: number[];
  /** The node whose `instances` / `repeat` this node is drawn once per (itself, an ancestor, or -1). */
  copySource: number;
  /** Copies per frame: `instances.count * repeat.copies` of the copy source, else 1. */
  copies: number;
  hasChildren: boolean;
  vars: CompiledVar[];
  translation?: CompiledVector;
  rotation?: CompiledVector;
  scale?: CompiledVector;
  squash?: Compiled;
  wobbleAmp?: Compiled;
  visible?: Compiled;
  color?: CompiledVector;
  emissive?: CompiledVector;
  alpha?: Compiled;
  size?: Compiled;
  repeatOffset?: Compiled;
  /** `field` per-point vars and positions, `hose` ends, `ribbon` mix. */
  fieldVars?: CompiledVar[];
  position?: CompiledVector;
  from?: CompiledVector;
  to?: CompiledVector;
  mix?: Compiled;
}

export interface CompiledGraph {
  slotCount: number;
  vars: CompiledVar[];
  nodes: CompiledNode[];
  camera: {
    eye: CompiledVector;
    target: CompiledVector;
    fov: Compiled;
    radius?: Compiled;
    height?: Compiled;
    angle?: Compiled;
  };
  environment: {
    background?: CompiledVector;
    lightDir?: CompiledVector;
    lightColor?: CompiledVector;
    ambient?: CompiledVector;
    fogDensity?: Compiled;
    fogColor?: CompiledVector;
    pointPosition?: CompiledVector;
    pointColor?: CompiledVector;
    pointRange?: Compiled;
  };
}

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED = new Set<string>([...BUILTIN_SLOTS, 'pi', 'tau', ...FUNCTION_NAMES]);

function isKeys(value: unknown): value is Keyframe<unknown>[] {
  return Array.isArray(value) && typeof value[0] === 'object' && value[0] !== null;
}

/**
 * Compiles every expression in a graph against its scope. Never throws on author errors: they come
 * back as `issues` with the path that failed (the schema reports them; the evaluator refuses to
 * run a graph that has any).
 */
export function compileGraph(graph: SequenceGraph): { graph: CompiledGraph; issues: GraphIssue[] } {
  const issues: GraphIssue[] = [];
  let slotCount = BUILTIN_SLOTS.length;
  const builtin: ResolveSlot = (name) =>
    name in SLOT ? SLOT[name as keyof typeof SLOT] : undefined;

  const fail = (path: (string | number)[], message: string) => issues.push({ path, message });
  const zero: Compiled = () => 0;

  const scalar = (value: Scalar, resolve: ResolveSlot, path: (string | number)[]): Compiled => {
    if (typeof value === 'number') return () => value;
    if (typeof value === 'string') {
      try {
        return compileExpr(value, resolve);
      } catch (error) {
        fail(path, describeExprError(value, error));
        return zero;
      }
    }
    const keys = value;
    return (s) => sampleKeys(keys, s[SLOT.t] ?? 0);
  };

  const vector = (
    value: Vector,
    resolve: ResolveSlot,
    path: (string | number)[],
  ): CompiledVector => {
    if (isKeys(value)) {
      const keys = value as Keyframe<Vec3>[];
      return (s) => sampleKeys(keys, s[SLOT.t] ?? 0);
    }
    const parts = (value as (number | string)[]).map((part, axis) =>
      scalar(part, resolve, [...path, axis]),
    );
    const [x, y, z] = parts as [Compiled, Compiled, Compiled];
    return (s) => [x(s), y(s), z(s)];
  };

  const declareVars = (
    vars: Record<string, Scalar> | undefined,
    outer: ResolveSlot,
    taken: ReadonlySet<string>,
    path: (string | number)[],
  ): { compiled: CompiledVar[]; resolve: ResolveSlot } => {
    const own = new Map<string, number>();
    const resolve: ResolveSlot = (name) => own.get(name) ?? outer(name);
    const compiled: CompiledVar[] = [];
    for (const [name, value] of Object.entries(vars ?? {})) {
      const at = [...path, name];
      if (!NAME.test(name)) fail(at, `var name "${name}" must be letters, digits and _`);
      else if (RESERVED.has(name)) fail(at, `var name "${name}" is a built-in name`);
      else if (taken.has(name)) fail(at, `var "${name}" is already defined by the graph`);
      // Compiled before it is declared: a var reads only the vars above it.
      const fn = scalar(value, resolve, at);
      const slot = slotCount++;
      own.set(name, slot);
      compiled.push({ name, slot, fn });
    }
    return { compiled, resolve };
  };

  const graphVars = declareVars(graph.vars, builtin, new Set(), ['vars']);
  const graphVarNames = new Set(Object.keys(graph.vars ?? {}));
  const root = graphVars.resolve;

  // Camera.
  const camera = graph.camera;
  const cameraPath = ['camera'];
  let compiledCamera: CompiledGraph['camera'];
  if (camera.type === 'locked') {
    const eye = camera.eye;
    const target = camera.target;
    const fov = camera.fov ?? 50;
    compiledCamera = { eye: () => [...eye], target: () => [...target], fov: () => fov };
  } else if (camera.type === 'perspective') {
    compiledCamera = {
      eye: vector(camera.eye, root, [...cameraPath, 'eye']),
      target: vector(camera.target, root, [...cameraPath, 'target']),
      fov: camera.fov === undefined ? () => 50 : scalar(camera.fov, root, [...cameraPath, 'fov']),
    };
  } else {
    compiledCamera = {
      eye: () => [0, 0, 0],
      target: camera.target
        ? vector(camera.target, root, [...cameraPath, 'target'])
        : () => [0, 0, 0],
      fov: camera.fov === undefined ? () => 50 : scalar(camera.fov, root, [...cameraPath, 'fov']),
      radius: scalar(camera.radius, root, [...cameraPath, 'radius']),
      height: scalar(camera.height, root, [...cameraPath, 'height']),
      angle: scalar(camera.angle, root, [...cameraPath, 'angle']),
    };
  }

  const env = graph.environment ?? {};
  const envPath = ['environment'];
  const optionalVector = (value: Vector | undefined, key: string) =>
    value === undefined ? undefined : vector(value, root, [...envPath, key]);
  const environment: CompiledGraph['environment'] = {
    background: optionalVector(env.background, 'background'),
    lightDir: optionalVector(env.lightDir, 'lightDir'),
    lightColor: optionalVector(env.lightColor, 'lightColor'),
    ambient: optionalVector(env.ambient, 'ambient'),
    fogColor: optionalVector(env.fogColor, 'fogColor'),
    fogDensity:
      env.fogDensity === undefined
        ? undefined
        : scalar(env.fogDensity, root, [...envPath, 'fogDensity']),
  };
  if (env.pointLight) {
    const lightPath = [...envPath, 'pointLight'];
    environment.pointPosition = vector(env.pointLight.position, root, [...lightPath, 'position']);
    environment.pointColor = vector(env.pointLight.color, root, [...lightPath, 'color']);
    environment.pointRange = scalar(env.pointLight.range, root, [...lightPath, 'range']);
  }

  // Nodes, in order: a parent must come before its children.
  const indexById = new Map<string, number>();
  const resolvers: ResolveSlot[] = [];
  const nodes: CompiledNode[] = [];
  graph.nodes.forEach((node, index) => {
    const path = ['nodes', index];
    let parent = -1;
    if (node.parent !== undefined) {
      const found = indexById.get(node.parent);
      if (found === undefined) {
        fail(
          [...path, 'parent'],
          graph.nodes.some((other) => other.id === node.parent)
            ? `${node.parent} must come before ${node.id} in nodes`
            : `${node.parent} is not a node id`,
        );
      } else parent = found;
    }
    if (!indexById.has(node.id)) indexById.set(node.id, index);

    const parentNode = parent >= 0 ? nodes[parent] : undefined;
    const ancestors = parentNode ? [...parentNode.ancestors, parent] : [];
    const outer = parentNode ? (resolvers[parent] ?? root) : root;
    const scope = declareVars(node.vars, outer, graphVarNames, [...path, 'vars']);
    resolvers[index] = scope.resolve;
    const resolve = scope.resolve;

    const ownCopies = Boolean(node.instances || node.repeat);
    const inherited = parentNode ? parentNode.copySource : -1;
    if (ownCopies && inherited >= 0) {
      fail(
        [...path, node.instances ? 'instances' : 'repeat'],
        `already copied by ${graph.nodes[inherited]?.id ?? 'an ancestor'}; only one node in a chain can have instances or repeat`,
      );
    }
    const copySource = ownCopies ? index : inherited;
    const sourceNode = copySource >= 0 ? graph.nodes[copySource] : undefined;
    const copies = sourceNode ? (sourceNode.instances?.count ?? 1) * repeatCopies(sourceNode) : 1;

    const geometry = node.geometry;
    if (geometry && (DYNAMIC_GEOMETRY as readonly string[]).includes(geometry.type) && copies > 1) {
      fail(
        [...path, 'geometry', 'type'],
        `${geometry.type} geometry is rebuilt every frame and cannot be copied (instances / repeat)`,
      );
    }

    const compiled: CompiledNode = {
      node,
      index,
      parent,
      ancestors,
      copySource,
      copies,
      hasChildren: false,
      vars: scope.compiled,
    };
    if (parentNode) parentNode.hasChildren = true;
    if (node.translation)
      compiled.translation = vector(node.translation, resolve, [...path, 'translation']);
    if (node.rotation) compiled.rotation = vector(node.rotation, resolve, [...path, 'rotation']);
    if (node.scale) compiled.scale = vector(node.scale, resolve, [...path, 'scale']);
    if (node.squash !== undefined)
      compiled.squash = scalar(node.squash, resolve, [...path, 'squash']);
    if (node.wobble)
      compiled.wobbleAmp = scalar(node.wobble.amp, resolve, [...path, 'wobble', 'amp']);
    if (node.visible !== undefined)
      compiled.visible = scalar(node.visible, resolve, [...path, 'visible']);
    if (node.repeat?.offset !== undefined) {
      compiled.repeatOffset = scalar(node.repeat.offset, resolve, [...path, 'repeat', 'offset']);
    }

    const material = node.material;
    if (material) {
      const at = [...path, 'material'];
      compiled.color = vector(material.color, resolve, [...at, 'color']);
      if (material.kind === 'lit' || material.kind === 'cel') {
        if (material.emissive)
          compiled.emissive = vector(material.emissive, resolve, [...at, 'emissive']);
      } else if (material.kind === 'unlit') {
        if (material.alpha !== undefined)
          compiled.alpha = scalar(material.alpha, resolve, [...at, 'alpha']);
        if (material.size !== undefined)
          compiled.size = scalar(material.size, resolve, [...at, 'size']);
      }
    }

    if (geometry) {
      const at = [...path, 'geometry'];
      if (geometry.type === 'field') {
        const pointScope = declareVars(geometry.vars, resolve, graphVarNames, [...at, 'vars']);
        compiled.fieldVars = pointScope.compiled;
        compiled.position = vector(geometry.position, pointScope.resolve, [...at, 'position']);
      }
      if (geometry.type === 'hose') {
        compiled.from = vector(geometry.from, resolve, [...at, 'from']);
        compiled.to = vector(geometry.to, resolve, [...at, 'to']);
      }
      if (geometry.type === 'ribbon') compiled.mix = scalar(geometry.mix, resolve, [...at, 'mix']);
    }
    nodes.push(compiled);
  });

  return {
    graph: { slotCount, vars: graphVars.compiled, nodes, camera: compiledCamera, environment },
    issues,
  };
}

/** Repeat copies of a node: `repeat.copies` (default 3), or 1 without a repeat. */
export function repeatCopies(node: GraphNode): number {
  return node.repeat ? (node.repeat.copies ?? 3) : 1;
}

function describeExprError(source: string, error: unknown): string {
  if (error instanceof ExprError) {
    const caret = `${source.slice(0, error.at)}⟨here⟩${source.slice(error.at)}`;
    return `expression "${source}": ${error.message} (at ${caret})`;
  }
  return `expression "${source}": ${error instanceof Error ? error.message : String(error)}`;
}
