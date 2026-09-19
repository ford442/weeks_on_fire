import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import { createMat4, DEG, lookAt, perspective, type Vec3 } from '../../lib/webgl/math';
import type { SequenceDrawContext, SequenceScene } from '../types';
import { buildGeometry } from './geometry';
import { createGraphEvaluator } from './evaluate';
import type { GraphNode, SequenceGraph } from './types';

const BLACK: Vec3 = [0, 0, 0];
const DEFAULT_ENV = {
  background: [0.02, 0.02, 0.02] as Vec3,
  lightDir: [0.35, 0.82, 0.45] as Vec3,
  lightColor: [1, 0.92, 0.82] as Vec3,
  ambient: [0.12, 0.11, 0.1] as Vec3,
  fogDensity: 0,
  fogColor: [0.04, 0.04, 0.045] as Vec3,
};

/** Additive point sprites go last so they blend over the opaque nodes. */
function drawOrder(nodes: GraphNode[]): number[] {
  const order = nodes.map((_, index) => index);
  const isPoints = (index: number) => nodes[index]?.geometry.type === 'points';
  return order.sort((a, b) => Number(isPoints(a)) - Number(isPoints(b)) || a - b);
}

/** Plays a validated `SequenceGraph` on the shared `SequenceEngine`. */
export function createGraphScene(graph: SequenceGraph): SequenceScene {
  const evaluate = createGraphEvaluator(graph);
  const order = drawOrder(graph.nodes);
  const env = { ...DEFAULT_ENV, ...graph.environment };
  const proj = createMat4();
  const view = createMat4();
  let meshes: GpuMesh[] = [];

  return {
    init(engine: SequenceEngine) {
      meshes = graph.nodes.map((node) => new GpuMesh(engine.gl, buildGeometry(node.geometry)));
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

      for (const index of order) {
        const node = graph.nodes[index];
        const state = frame.nodes[index];
        const mesh = meshes[index];
        if (!node || !state || !mesh) continue;
        const [x, y, z] = state.translation;
        const [rx, ry, rz] = state.rotation;
        const [sx, sy, sz] = state.scale;
        const model = modelTRSX(x, y, z, rx, ry, rz, sx, sy, sz);
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
}
