import { GpuMesh, type SequenceEngine } from '../../lib/webgl/engine';
import { DEFAULT_SHININESS, InstanceBatch } from '../../lib/webgl/instances';
import { createMat4, DEG, lookAt, perspective, type Vec3 } from '../../lib/webgl/math';

import { EmitterSim } from './emitter';
import { createGraphEvaluator, type CopyFrame, type GraphEvaluator } from './evaluate';
import { buildGeometry } from './geometry';
import { HoseTube } from './hose';
import { DYNAMIC_GEOMETRY, POINT_GEOMETRY } from './types';

import type { SequenceDrawContext, SequenceScene } from '../types';
import type { GraphGeometry, GraphNode, SequenceGraph } from './types';

const BLACK: Vec3 = [0, 0, 0];
/** Ribbon morphs re-mesh when `mix` moves a whole step of this (deterministic, unlike a threshold). */
const RIBBON_MIX_STEP = 0.01;
const DEFAULT_GHOST_SPACING = 1 / 24;

const isPoints = (node: GraphNode) =>
  node.geometry !== undefined && (POINT_GEOMETRY as readonly string[]).includes(node.geometry.type);
const isDynamic = (node: GraphNode) =>
  node.geometry !== undefined &&
  (DYNAMIC_GEOMETRY as readonly string[]).includes(node.geometry.type);

/** Additive point sprites go last so they blend over the opaque nodes; groups draw nothing. */
function drawOrder(nodes: GraphNode[]): number[] {
  const order = nodes.map((_, index) => index).filter((index) => nodes[index]?.geometry);
  return order.sort((a, b) => Number(isPoints(nodes[a]!)) - Number(isPoints(nodes[b]!)) || a - b);
}

/**
 * Nodes with equal keys share one mesh. A line cube is built at unit size and scaled per node,
 * so a lattice of different-sized cubes is one mesh (and one instanced draw). Dynamic geometry
 * is per node: each is rewritten from its own node's expressions.
 */
function geometryKey(node: GraphNode, index: number): string {
  const geometry = node.geometry!;
  if (isDynamic(node)) return `#${index}`;
  return geometry.type === 'lineCube' ? 'lineCube' : JSON.stringify(geometry);
}

function meshGeometry(geometry: GraphGeometry): GraphGeometry {
  return geometry.type === 'lineCube' ? { type: 'lineCube', size: 1 } : geometry;
}

/** How copies are shaded; consecutive copies in one instanced draw must agree. Null: never batched. */
function shadingKey(node: GraphNode): string | null {
  const material = node.material;
  if (!material || isPoints(node)) return null;
  if (material.kind === 'cel' && material.outline) return null;
  if (material.kind === 'lit' || material.kind === 'cel') {
    return material.vertexColor ? `${material.kind}+vc` : material.kind;
  }
  return material.kind;
}

/** Per-mesh state for geometry that changes every frame. */
interface DynamicMesh {
  node: number;
  ribbonMix?: number;
  hose?: HoseTube;
  field?: Float32Array;
  /** One simulation per pass (0 = the frame, k = ghost k), so each only moves forward. */
  emitters?: EmitterSim[];
  /** Live particles after this pass's update. */
  count?: number;
}

/** Plays a validated `SequenceGraph` on the shared `SequenceEngine`. */
export function createGraphScene(graph: SequenceGraph): SequenceScene {
  const order = drawOrder(graph.nodes);
  const proj = createMat4();
  const view = createMat4();
  const batch = new InstanceBatch(Math.max(8, graph.nodes.length));
  let evaluator: GraphEvaluator | null = null;
  let evaluatorDuration = -1;

  // One mesh per distinct geometry; `meshOf[node]` indexes `meshes` (-1 for groups).
  const keys: string[] = [];
  const meshOf = graph.nodes.map((node, index) => {
    if (!node.geometry) return -1;
    const key = geometryKey(node, index);
    const existing = keys.indexOf(key);
    if (existing >= 0) return existing;
    keys.push(key);
    return keys.length - 1;
  });
  let meshes: GpuMesh[] = [];
  let dynamic = new Map<number, DynamicMesh>();

  const evaluatorFor = (durationSec: number): GraphEvaluator => {
    if (!evaluator || evaluatorDuration !== durationSec) {
      evaluator = createGraphEvaluator(graph, { durationSec });
      evaluatorDuration = durationSec;
    }
    return evaluator;
  };

  function updateDynamic(
    engine: SequenceEngine,
    frame: ReturnType<GraphEvaluator['frame']>,
    pass: number,
  ) {
    for (const [meshIndex, state] of dynamic) {
      const mesh = meshes[meshIndex];
      const node = graph.nodes[state.node];
      const nodeFrame = frame.nodes[state.node];
      const geometry = node?.geometry;
      if (!mesh || !geometry || !nodeFrame || nodeFrame.copies.length === 0) continue;
      switch (geometry.type) {
        case 'ribbon': {
          const mix = Math.round((nodeFrame.mix ?? 0) / RIBBON_MIX_STEP) * RIBBON_MIX_STEP;
          if (mix === state.ribbonMix) break;
          const data = engine.kernel.ribbon(mix, geometry.uSegments, geometry.vSegments);
          mesh.updatePositions(data.positions);
          if (data.normals) mesh.updateNormals(data.normals);
          state.ribbonMix = mix;
          break;
        }
        case 'hose':
          if (!state.hose || !nodeFrame.from || !nodeFrame.to) break;
          state.hose.update(nodeFrame.from, nodeFrame.to);
          mesh.updatePositions(state.hose.positions);
          mesh.updateNormals(state.hose.normals);
          break;
        case 'field':
          if (!state.field || !evaluator) break;
          evaluator.writeField(state.node, state.field);
          mesh.updatePositions(state.field);
          break;
        case 'emitter': {
          state.emitters ??= [];
          const sim = (state.emitters[pass] ??= new EmitterSim(geometry, engine.kernel));
          state.count = sim.sample(frame.timeSec);
          if (state.count > 0) mesh.updatePositions(sim.positions);
          break;
        }
        default:
          break;
      }
    }
  }

  /** Draws the whole graph at `filmTime` into the bound framebuffer. */
  function renderAt(
    engine: SequenceEngine,
    filmTime: number,
    durationSec: number,
    aspect: number,
    pass: number,
  ) {
    const frame = evaluatorFor(durationSec).frame(filmTime);
    perspective(proj, frame.fovDeg * DEG, aspect, frame.near, frame.far);
    lookAt(view, frame.eye, frame.target, [0, 1, 0]);
    engine.setCamera(proj, view, frame.eye);
    engine.lightDir = frame.lightDir;
    engine.lightColor = frame.lightColor;
    engine.ambient = frame.ambient;
    engine.fogDensity = frame.fogDensity;
    engine.fogColor = frame.fogColor;
    engine.pointPos = frame.pointPos;
    engine.pointColor = frame.pointColor;
    engine.pointRange = frame.pointRange;
    engine.clear(...frame.background);
    updateDynamic(engine, frame, pass);

    // Consecutive copies with one mesh and one shading become one instanced draw.
    let pendingMesh = -1;
    let pendingKey: string | null = null;
    let pendingNode: GraphNode | null = null;
    const flush = () => {
      const mesh = meshes[pendingMesh];
      const node = pendingNode;
      if (mesh && node && batch.count > 0) drawBatch(engine, mesh, node);
      batch.clear();
      pendingMesh = -1;
      pendingKey = null;
      pendingNode = null;
    };

    for (const index of order) {
      const node = graph.nodes[index];
      const copies = frame.nodes[index]?.copies;
      const meshIndex = meshOf[index] ?? -1;
      const mesh = meshes[meshIndex];
      if (!node || !copies || copies.length === 0 || !mesh) continue;
      const key = shadingKey(node);
      if (key === null) {
        flush();
        for (const copy of copies) drawSingle(engine, mesh, node, copy, dynamic.get(meshIndex));
        continue;
      }
      if (pendingMesh !== meshIndex || pendingKey !== key) flush();
      pendingMesh = meshIndex;
      pendingKey = key;
      pendingNode = node;
      for (const copy of copies) pushCopy(node, copy);
    }
    flush();
  }

  function pushCopy(node: GraphNode, copy: CopyFrame) {
    const material = node.material!;
    if (material.kind === 'line') batch.push(copy.model, copy.color);
    else if (material.kind === 'unlit') batch.push(copy.model, BLACK, copy.color);
    else batch.push(copy.model, copy.color, copy.emissive, material.shininess ?? DEFAULT_SHININESS);
  }

  /** One copy, or a run of copies: plain draw for one, instanced for more (same pixels). */
  function drawBatch(engine: SequenceEngine, mesh: GpuMesh, node: GraphNode) {
    const material = node.material!;
    const cel = material.kind === 'cel';
    const useVertexColor =
      (material.kind === 'lit' || material.kind === 'cel') && material.vertexColor;
    if (batch.count === 1) {
      if (material.kind === 'line') engine.drawLines(mesh, batch.model(0), batch.color(0));
      else {
        engine.drawLit(mesh, batch.model(0), {
          color: batch.color(0),
          emissive: batch.emissive(0),
          shininess: batch.shininess(0),
          cel,
          useVertexColor,
        });
      }
      return;
    }
    if (material.kind === 'line') engine.drawLinesInstanced(mesh, batch);
    else engine.drawLitInstanced(mesh, batch, { cel, useVertexColor });
  }

  function drawSingle(
    engine: SequenceEngine,
    mesh: GpuMesh,
    node: GraphNode,
    copy: CopyFrame,
    state: DynamicMesh | undefined,
  ) {
    const material = node.material!;
    if (isPoints(node)) {
      engine.drawPoints(mesh, copy.model, copy.color, copy.size, copy.alpha, state?.count);
      return;
    }
    if (material.kind === 'line') {
      engine.drawLines(mesh, copy.model, copy.color);
      return;
    }
    if (material.kind === 'unlit') {
      engine.drawLit(mesh, copy.model, { color: BLACK, emissive: copy.color });
      return;
    }
    if (material.kind === 'cel' && material.outline) engine.drawOutline(mesh, copy.model);
    engine.drawLit(mesh, copy.model, {
      color: copy.color,
      emissive: copy.emissive,
      shininess: material.shininess,
      cel: material.kind === 'cel',
      useVertexColor: material.vertexColor,
    });
  }

  return {
    init(engine: SequenceEngine) {
      dynamic = new Map();
      meshes = keys.map((_, meshIndex) => {
        const nodeIndex = meshOf.indexOf(meshIndex);
        const node = graph.nodes[nodeIndex];
        const geometry = node?.geometry;
        if (!node || !geometry) throw new Error(`graph mesh ${meshIndex} has no node`);
        const data = buildGeometry(meshGeometry(geometry), engine.kernel);
        if (isDynamic(node)) {
          const state: DynamicMesh = { node: nodeIndex };
          if (geometry.type === 'hose') state.hose = new HoseTube(geometry, engine.kernel);
          if (geometry.type === 'field') state.field = new Float32Array(data.positions.length);
          if (geometry.type === 'ribbon') {
            state.ribbonMix = typeof geometry.mix === 'number' ? geometry.mix : 0;
          }
          dynamic.set(meshIndex, state);
        }
        return new GpuMesh(engine.gl, data);
      });
    },
    draw({ engine, timeSec, aspect, durationSec }: SequenceDrawContext) {
      renderAt(engine, timeSec, durationSec, aspect, 0);

      const post = graph.post;
      const ghosts = post?.ghosts;
      if (ghosts && ghosts.count > 0) {
        const spacing = ghosts.spacing ?? DEFAULT_GHOST_SPACING;
        const { drawingBufferWidth: width, drawingBufferHeight: height } = engine.gl;
        // Nothing to trail before the first ghost's moment; skip the offscreen passes.
        if (timeSec - spacing >= 0 && engine.post.beginCurrent(width, height)) {
          renderAt(engine, timeSec, durationSec, aspect, 0);
          for (let k = 1; k <= ghosts.count; k++) {
            const earlier = timeSec - k * spacing;
            if (earlier < 0) break;
            engine.post.beginGhost();
            renderAt(engine, earlier, durationSec, aspect, k);
            engine.post.compositeGhost(ghosts.decay ** k, ghosts.mode === 'darken');
          }
        }
      }
      if (post?.vignette) engine.post.vignette(post.vignette, aspect);
    },
    dispose() {
      meshes.forEach((mesh) => mesh.dispose());
      meshes = [];
      dynamic = new Map();
    },
  };
}
