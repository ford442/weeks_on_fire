import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import {
  createIcosahedronLines,
  createLineCube,
  createPoints,
  createSphere,
  writePoints,
} from '../../lib/webgl/mesh';
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

export function createLatticeHymn(): SequenceScene {
  let cubes: GpuMesh[] = [];
  let ico: GpuMesh | null = null;
  let core: GpuMesh | null = null;
  let sparks: GpuMesh | null = null;
  const sparkData = createPoints(28);
  const proj = createMat4();
  const view = createMat4();

  return {
    init(engine: SequenceEngine) {
      cubes = [0.9, 1.55, 2.25, 3.15].map((size) => new GpuMesh(engine.gl, createLineCube(size)));
      ico = new GpuMesh(engine.gl, createIcosahedronLines(1.85));
      core = new GpuMesh(engine.gl, createSphere(0.28, 18, 24));
      sparks = new GpuMesh(engine.gl, sparkData);
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, progress, aspect } = ctx;
      const assemble = smoothstep(0, 0.22, progress);
      const pulse = 1 + 0.16 * Math.sin(timeSec * 7) * smoothstep(0.72, 0.9, progress);
      const orbit = progress * Math.PI * 2;
      const radius = 5.4 - assemble * 0.4;
      const eye: Vec3 = [
        Math.sin(orbit) * radius,
        1.35 + 0.45 * Math.sin(progress * Math.PI * 2),
        Math.cos(orbit) * radius,
      ];
      perspective(proj, 48 * DEG, aspect, 0.1, 40);
      lookAt(view, eye, [0, 0, 0], [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.4, 0.75, 0.5];
      engine.lightColor = [1, 0.72, 0.42];
      engine.ambient = [0.05, 0.04, 0.035];
      engine.fogDensity = 0.04;
      engine.fogColor = [0.03, 0.025, 0.02];
      engine.pointRange = 0;
      engine.clear(0.025, 0.02, 0.018);

      const identityModel = createMat4();
      identity(identityModel);

      cubes.forEach((cube, index) => {
        const speed = 0.35 + index * 0.22;
        const dir = index % 2 === 0 ? 1 : -1;
        const model = modelTRSX(
          0,
          0,
          0,
          timeSec * 0.4 * dir,
          timeSec * speed * dir,
          timeSec * 0.18,
          assemble,
          assemble,
          assemble,
        );
        const brass: Vec3 = [0.72 + index * 0.04, 0.5, 0.28];
        engine.drawLines(cube, model, brass);
      });

      if (ico) {
        const model = modelTRSX(
          0,
          0,
          0,
          timeSec * 0.2,
          -timeSec * 0.33,
          0,
          assemble,
          assemble,
          assemble,
        );
        engine.drawLines(ico, model, [0.82, 0.62, 0.32]);
      }

      if (core) {
        const model = modelTRSX(0, 0, 0, 0, timeSec * 0.5, 0, pulse, pulse, pulse);
        engine.drawLit(core, model, {
          color: [0.55, 0.18, 0.05],
          emissive: [0.55, 0.16, 0.04],
          shininess: 8,
        });
      }

      if (sparks) {
        writePoints(sparkData, (i, set) => {
          const seed = i * 1.7;
          const a = seed + timeSec * (0.4 + (i % 5) * 0.07);
          const r = 0.55 + (i % 7) * 0.18;
          set(Math.cos(a) * r, Math.sin(a * 1.3) * 0.35, Math.sin(a) * r);
        });
        sparks.updatePositions(sparkData.positions);
        engine.drawPoints(sparks, identityModel, [1, 0.45, 0.12], 4, 0.7 * assemble);
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
