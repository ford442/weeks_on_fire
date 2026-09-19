import { DEG, type Vec3 } from '../../lib/webgl/math';
import { loopTime, resolve, sampleKeys } from './animate';
import type { GraphClip, SequenceGraph } from './types';

export interface NodeFrame {
  translation: Vec3;
  /** Euler XYZ, radians (spin already included). */
  rotation: Vec3;
  scale: Vec3;
  /** Set for `lit` / `cel` materials only. */
  emissive?: Vec3;
  alpha: number;
}

export interface GraphFrame {
  eye: Vec3;
  target: Vec3;
  fovDeg: number;
  fogDensity: number;
  /** Index-aligned with `graph.nodes`. */
  nodes: NodeFrame[];
}

export const DEFAULT_FOV = 50;

/** Pure sampler: resolves camera, fog and per-node transforms for a film time. No GL. */
export function createGraphEvaluator(graph: SequenceGraph): (timeSec: number) => GraphFrame {
  const clipsByNode = new Map<string, GraphClip[]>();
  for (const clip of graph.clips ?? []) {
    const list = clipsByNode.get(clip.target) ?? [];
    list.push(clip);
    clipsByNode.set(clip.target, list);
  }

  return (filmTime) => {
    const t = loopTime(filmTime, graph.loop);
    const camera = graph.camera;

    let eye: Vec3;
    let target: Vec3;
    let fovDeg: number;
    if (camera.type === 'locked') {
      eye = [...camera.eye];
      target = [...camera.target];
      fovDeg = camera.fov ?? DEFAULT_FOV;
    } else if (camera.type === 'perspective') {
      eye = resolve(camera.eye, t);
      target = resolve(camera.target, t);
      fovDeg = camera.fov === undefined ? DEFAULT_FOV : resolve(camera.fov, t);
    } else {
      target = camera.target ? resolve(camera.target, t) : [0, 0, 0];
      const radius = resolve(camera.radius, t);
      const angle = resolve(camera.angle, t) * DEG;
      eye = [
        target[0] + Math.sin(angle) * radius,
        resolve(camera.height, t),
        target[2] + Math.cos(angle) * radius,
      ];
      fovDeg = camera.fov === undefined ? DEFAULT_FOV : resolve(camera.fov, t);
    }

    let fogDensity = graph.environment?.fogDensity ?? 0;
    for (const clip of clipsByNode.get('scene') ?? []) {
      if (clip.property === 'fogDensity') {
        fogDensity = sampleKeys(clip.keys, t, clip.ease) as number;
      }
    }

    const nodes = graph.nodes.map((node): NodeFrame => {
      const frame: NodeFrame = {
        translation: [...(node.translation ?? [0, 0, 0])],
        rotation: [0, 0, 0],
        scale: [...(node.scale ?? [1, 1, 1])],
        alpha: node.material.kind === 'unlit' ? (node.material.alpha ?? 1) : 1,
      };
      let rotationDeg: Vec3 = [...(node.rotation ?? [0, 0, 0])];
      if (node.material.kind === 'lit' || node.material.kind === 'cel') {
        frame.emissive = [...(node.material.emissive ?? [0, 0, 0])];
      }
      for (const clip of clipsByNode.get(node.id) ?? []) {
        const value = sampleKeys(clip.keys, t, clip.ease);
        switch (clip.property) {
          case 'translation':
            frame.translation = value as Vec3;
            break;
          case 'rotation':
            rotationDeg = value as Vec3;
            break;
          case 'scale':
            frame.scale = value as Vec3;
            break;
          case 'emissive':
            frame.emissive = value as Vec3;
            break;
          case 'alpha':
            frame.alpha = value as number;
            break;
        }
      }
      const spin = node.spin ?? [0, 0, 0];
      frame.rotation = [
        (rotationDeg[0] + spin[0] * t) * DEG,
        (rotationDeg[1] + spin[1] * t) * DEG,
        (rotationDeg[2] + spin[2] * t) * DEG,
      ];
      return frame;
    });

    return { eye, target, fovDeg, fogDensity, nodes };
  };
}
