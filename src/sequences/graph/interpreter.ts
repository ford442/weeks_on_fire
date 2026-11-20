import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import { DEFAULT_SHININESS, InstanceBatch } from '../../lib/webgl/instances';
import { createMat4, DEG, lookAt, perspective, type Vec3 } from '../../lib/webgl/math';

import { buildGeometry } from './geometry';
import { createGraphEvaluator, type NodeFrame } from './evaluate';

import type { SequenceDrawContext, SequenceScene } from '../types';
import type { GraphGeometry, GraphNode, SequenceGraph } from './types';

const BLACK: Vec3 = [0, 0, 0];
const DEFAULT_ENV = {
  background: [0.02, 0.02, 0.02] as Vec3,
  lightDir: [0.35, 0.82, 0.45] as Vec3,
  lightColor: [1, 0.92, 0.82] as Vec3,
  ambient: [0.12, 0.11, 0.1] as Vec3,
  fogDensity: 0,
  fogColor: [0.04, 0.04, 0.045] as Vec3,
};

const NO_EMISSIVE: Vec3 = [0, 0, 0];

/** Additive point sprites go last so they blend over the opaque nodes. */
function drawOrder(nodes: GraphNode[]): number[] {
  const order = nodes.map((_, index) => index);
  const isPoints = (index: number) => nodes[index]?.geometry.type === 'points';
  return order.sort((a, b) => Number(isPoints(a)) - Number(isPoints(b)) || a - b);
}

/**
 * Nodes with equal keys share one mesh. A line cube is built at unit size and scaled per node,
 * so a lattice of different-sized cubes is one mesh (and one instanced draw).
 */
function geometryKey(geometry: GraphGeometry): string {
  return geometry.type === 'lineCube' ? 'lineCube' : JSON.stringify(geometry);
}

function meshGeometry(geometry: GraphGeometry): GraphGeometry {
  return geometry.type === 'lineCube' ? { type: 'lineCube', size: 1 } : geometry;
}

function geometryScale(geometry: GraphGeometry): number {
  return geometry.type === 'lineCube' ? geometry.size : 1;
}

/** How a node is shaded; nodes in one instanced draw must agree on it. */
function shadingKey(node: GraphNode): string | null {
  const material = node.material;
  // Points blend with their own size and alpha; outlines need a second, front-culled pass.
  if (node.geometry.type === 'points') return null;
  if (material.kind === 'cel' && material.outline) return null;
  return material.kind;
}

/** A run of consecutive nodes (in draw order) that can be drawn as one instanced call. */
interface DrawGroup {
  mesh: number;
  nodes: number[];
}

function drawGroups(nodes: GraphNode[], order: number[], meshOf: number[]): DrawGroup[] {
  const groups: DrawGroup[] = [];
  let previous: { group: DrawGroup; shading: string } | null = null;
  for (const index of order) {
    const node = nodes[index];
    const mesh = meshOf[index];
    if (!node || mesh === undefined) continue;
    const shading = shadingKey(node);
    if (
      previous &&
      shading !== null &&
      previous.shading === shading &&
      previous.group.mesh === mesh
    ) {
      previous.group.nodes.push(index);
      continue;
    }
    const group: DrawGroup = { mesh, nodes: [index] };
    groups.push(group);
    previous = shading === null ? null : { group, shading };
  }
  return groups;
}

/** Plays a validated `SequenceGraph` on the shared `SequenceEngine`. */
export function createGraphScene(graph: SequenceGraph): SequenceScene {
  const evaluate = createGraphEvaluator(graph);
  const order = drawOrder(graph.nodes);
  const env = { ...DEFAULT_ENV, ...graph.environment };
  const proj = createMat4();
  const view = createMat4();
  const batch = new InstanceBatch(graph.nodes.length);

  // One mesh per distinct geometry; `meshOf[node]` indexes `meshes`.
  const keys: string[] = [];
  const meshOf = graph.nodes.map((node) => {
    const key = geometryKey(node.geometry);
    const existing = keys.indexOf(key);
    if (existing >= 0) return existing;
    keys.push(key);
    return keys.length - 1;
  });
  const meshSources = keys.map((_, mesh) => {
    const node = graph.nodes[meshOf.indexOf(mesh)];
    if (!node) throw new Error(`graph mesh ${mesh} has no node`);
    return meshGeometry(node.geometry);
  });
  const groups = drawGroups(graph.nodes, order, meshOf);
  let meshes: GpuMesh[] = [];

  const modelFor = (node: GraphNode, state: NodeFrame) => {
    const [x, y, z] = state.translation;
    const [rx, ry, rz] = state.rotation;
    const g = geometryScale(node.geometry);
    const [sx, sy, sz] = state.scale;
    return modelTRSX(x, y, z, rx, ry, rz, sx * g, sy * g, sz * g);
  };

  return {
    init(engine: SequenceEngine) {
      meshes = meshSources.map(
        (geometry) => new GpuMesh(engine.gl, buildGeometry(geometry, engine.kernel)),
      );
    },
    draw({ engine, timeSec, aspect }: SequenceDrawContext) {
      const frame = evaluate(timeSec);
      perspective(proj, frame.fovDeg * DEG, aspect, 0.1, 60);
      lookAt(view, frame.eye, frame.target, [0, 1, 0]);
      engine.setCamera(proj, view, frame.eye);
      engine.lightDir = env.lightDir;
      engine.lightColor = env.lightColor;
      engine.ambient = env.ambient;
      engine.fogDensity = frame.fogDensity;
      engine.fogColor = env.fogColor;
      engine.pointRange = 0;
      engine.clear(...env.background);

      for (const group of groups) {
        const mesh = meshes[group.mesh];
        if (!mesh) continue;
        if (group.nodes.length > 1) {
          drawBatched(engine, mesh, group.nodes, frame.nodes);
          continue;
        }
        const index = group.nodes[0] ?? -1;
        const node = graph.nodes[index];
        const state = frame.nodes[index];
        if (!node || !state) continue;
        const model = modelFor(node, state);
        const material = node.material;
        switch (material.kind) {
          case 'line':
            engine.drawLines(mesh, model, material.color);
            break;
          case 'unlit':
            if (node.geometry.type === 'points') {
              engine.drawPoints(mesh, model, material.color, material.size ?? 4, state.alpha);
            } else {
              engine.drawLit(mesh, model, { color: BLACK, emissive: material.color });
            }
            break;
          default:
            if (material.kind === 'cel' && material.outline) engine.drawOutline(mesh, model);
            engine.drawLit(mesh, model, {
              color: material.color,
              emissive: state.emissive,
              shininess: material.shininess,
              cel: material.kind === 'cel',
            });
        }
      }
    },
    dispose() {
      meshes.forEach((mesh) => mesh.dispose());
      meshes = [];
    },
  };

  /** A run of same-mesh, same-shading nodes: per-node colour, glow and shininess per instance. */
  function drawBatched(
    engine: SequenceEngine,
    mesh: GpuMesh,
    indices: number[],
    states: NodeFrame[],
  ) {
    batch.clear();
    let kind: GraphNode['material']['kind'] = 'lit';
    for (const index of indices) {
      const node = graph.nodes[index];
      const state = states[index];
      if (!node || !state) continue;
      const model = modelFor(node, state);
      const material = node.material;
      kind = material.kind;
      if (material.kind === 'line') batch.push(model, material.color);
      else if (material.kind === 'unlit') batch.push(model, BLACK, material.color);
      else {
        batch.push(
          model,
          material.color,
          state.emissive ?? NO_EMISSIVE,
          material.shininess ?? DEFAULT_SHININESS,
        );
      }
    }
    if (kind === 'line') engine.drawLinesInstanced(mesh, batch);
    else engine.drawLitInstanced(mesh, batch, { cel: kind === 'cel' });
  }
}
