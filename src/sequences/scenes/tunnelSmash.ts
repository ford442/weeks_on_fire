import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import { createPoints, createSphere, createTorus, writePoints } from '../../lib/webgl/mesh';
import {
  createMat4,
  DEG,
  identity,
  lookAt,
  perspective,
  smoothstep,
  type Vec3,
} from '../../lib/webgl/math';
import type { SequenceDrawContext, SequenceScene } from '../types';

const KICK = 0.4;
const RING_COUNT = 8;

export function createTunnelSmash(): SequenceScene {
  let rings: GpuMesh[] = [];
  let core: GpuMesh | null = null;
  let sparks: GpuMesh | null = null;
  const sparkData = createPoints(40);
  const proj = createMat4();
  const view = createMat4();
  const identityModel = createMat4();

  return {
    init(engine: SequenceEngine) {
      rings = Array.from(
        { length: RING_COUNT },
        (_, i) => new GpuMesh(engine.gl, createTorus(1.15 - i * 0.04, 0.055, 36, 10)),
      );
      core = new GpuMesh(engine.gl, createSphere(0.22, 16, 20));
      sparks = new GpuMesh(engine.gl, sparkData);
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, aspect } = ctx;
      const kickI = Math.floor(timeSec / KICK);
      const phase = timeSec - kickI * KICK;
      const lurch = smoothstep(0, 0.16, phase / KICK);
      const travel = (kickI + lurch) * 0.22;
      const camZ = 8.4 - travel;
      const punch = phase < 1 / 24;

      const eye: Vec3 = [0.42, -0.18, camZ];
      const target: Vec3 = [0.35, -0.22, camZ - 4.2];
      perspective(proj, (54 - Math.min(travel * 2.2, 18)) * DEG, aspect, 0.08, 40);
      lookAt(view, eye, target, [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.55, 0.25, 0.8];
      engine.lightColor = [1, 0.55, 0.22];
      engine.ambient = [0.06, 0.05, 0.04];
      engine.fogDensity = 0.08;
      engine.fogColor = [0.02, 0.015, 0.012];
      engine.pointPos = [0, 0, 0];
      engine.pointColor = [1, 0.35, 0.08];
      engine.pointRange = 6;
      if (punch) engine.clear(0, 0, 0);
      else engine.clear(0.018, 0.014, 0.012);

      identity(identityModel);

      rings.forEach((ring, index) => {
        const z = -index * 1.05;
        const dir = index % 2 === 0 ? 1 : -1;
        const model = modelTRSX(
          0.08 * index,
          -0.04 * index,
          z,
          Math.PI / 2,
          timeSec * 3.4 * dir,
          0,
        );
        const brass: Vec3 = [0.72 + index * 0.02, 0.48, 0.22];
        engine.drawLit(ring, model, {
          color: brass,
          shininess: 70,
          emissive: [0.08, 0.03, 0.01],
        });
      });

      if (core) {
        const pulse = 1 + 0.18 * (1 - phase / KICK);
        engine.drawLit(core, modelTRSX(0, 0, -8.6, 0, timeSec * 2.2, 0, pulse, pulse, pulse), {
          color: [0.55, 0.18, 0.05],
          emissive: [0.55, 0.14, 0.04],
          shininess: 8,
        });
      }

      if (sparks) {
        writePoints(sparkData, (i, set) => {
          const seed = i * 0.73;
          const z = ((seed + timeSec * 6.5) % 10) - 1.2;
          const a = seed * 2.1;
          const r = 0.35 + (i % 5) * 0.12;
          set(Math.cos(a) * r + 0.2, Math.sin(a * 1.4) * r - 0.1, -z);
        });
        sparks.updatePositions(sparkData.positions);
        engine.drawPoints(sparks, identityModel, [1, 0.5, 0.15], 4, punch ? 0.2 : 0.7);
      }
    },
    dispose() {
      rings.forEach((ring) => ring.dispose());
      rings = [];
      core?.dispose();
      sparks?.dispose();
      core = null;
      sparks = null;
    },
  };
}
