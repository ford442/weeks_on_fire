import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import {
  createIcosahedronLines,
  createLineCube,
  createPoints,
  createSphere,
  writePoints,
} from '../../lib/webgl/mesh';
import { createMat4, DEG, identity, lookAt, perspective, type Vec3 } from '../../lib/webgl/math';
import type { SequenceDrawContext, SequenceScene } from '../types';

const KICK = 0.4;

export function createKickLattice(): SequenceScene {
  let cubes: GpuMesh[] = [];
  let ico: GpuMesh | null = null;
  let core: GpuMesh | null = null;
  let sparks: GpuMesh | null = null;
  const sparkData = createPoints(36);
  const proj = createMat4();
  const view = createMat4();
  const identityModel = createMat4();

  return {
    init(engine: SequenceEngine) {
      cubes = [0.9, 1.55, 2.25, 3.15].map((size) => new GpuMesh(engine.gl, createLineCube(size)));
      ico = new GpuMesh(engine.gl, createIcosahedronLines(1.85));
      core = new GpuMesh(engine.gl, createSphere(0.28, 18, 24));
      sparks = new GpuMesh(engine.gl, sparkData);
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, aspect } = ctx;
      const kickI = Math.floor(timeSec / KICK);
      const phase = timeSec - kickI * KICK;
      const punch = phase < 1 / 24;
      const hop = Math.max(0, 1 - phase / 0.12);

      const eye: Vec3 = [3.55, 2.05, 3.7];
      perspective(proj, 46 * DEG, aspect, 0.1, 40);
      lookAt(view, eye, [0, 0, 0], [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.4, 0.75, 0.5];
      engine.lightColor = [1, 0.72, 0.42];
      engine.ambient = [0.05, 0.04, 0.035];
      engine.fogDensity = 0.04;
      engine.fogColor = [0.03, 0.025, 0.02];
      engine.pointRange = 0;
      if (punch) engine.clear(0, 0, 0);
      else engine.clear(0.025, 0.02, 0.018);

      identity(identityModel);

      cubes.forEach((cube, index) => {
        const dir = index % 2 === 0 ? 1 : -1;
        const snap = kickI * 0.18 * dir;
        const scale = 1 + 0.1 * hop;
        const model = modelTRSX(0, 0, 0, snap * 0.35, snap, snap * 0.12, scale, scale, scale);
        const brass: Vec3 = [0.72 + index * 0.04, 0.5, 0.28];
        engine.drawLines(cube, model, brass);
      });

      if (ico) {
        const snap = -kickI * 0.22;
        const scale = 1 + 0.08 * hop;
        const model = modelTRSX(0, 0, 0, snap * 0.4, snap, 0, scale, scale, scale);
        engine.drawLines(ico, model, [0.82, 0.62, 0.32]);
      }

      if (core) {
        const pulse = 1 + 0.28 * hop;
        const model = modelTRSX(0, 0, 0, 0, kickI * 0.5, 0, pulse, pulse, pulse);
        engine.drawLit(core, model, {
          color: [0.55, 0.18, 0.05],
          emissive: [0.55 + 0.35 * hop, 0.16, 0.04],
          shininess: 8,
        });
      }

      if (sparks) {
        writePoints(sparkData, (i, set) => {
          const seed = i * 1.7;
          const jump = 0.55 + (i % 7) * 0.18 + hop * 0.45;
          const a = seed + kickI * 0.51;
          set(Math.cos(a) * jump, Math.sin(a * 1.3) * 0.35 * jump, Math.sin(a) * jump);
        });
        sparks.updatePositions(sparkData.positions);
        engine.drawPoints(sparks, identityModel, [1, 0.45, 0.12], 5, punch ? 0.15 : 0.85);
      }
    },
    dispose() {
      cubes.forEach((cube) => cube.dispose());
      cubes = [];
      ico?.dispose();
      core?.dispose();
      sparks?.dispose();
      ico = null;
      core = null;
      sparks = null;
    },
  };
}
