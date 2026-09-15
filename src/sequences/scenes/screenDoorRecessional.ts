import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import {
  createBox,
  createIcosahedronLines,
  createLineCube,
  createPlane,
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

interface PorchKit {
  floor: GpuMesh;
  post: GpuMesh;
  lintel: GpuMesh;
  door: GpuMesh;
  bulb: GpuMesh;
  moths: GpuMesh;
  lattice: GpuMesh;
  ico: GpuMesh;
  core: GpuMesh;
}

const FRAME_COUNT = 8;
const FRAME_SPACING = 2.15;

export function createScreenDoorRecessional(): SequenceScene {
  let kit: PorchKit | null = null;
  const mothData = createPoints(40);
  const proj = createMat4();
  const view = createMat4();
  const identityModel = createMat4();

  return {
    init(engine: SequenceEngine) {
      kit = {
        floor: new GpuMesh(engine.gl, createPlane(3.2, FRAME_COUNT * FRAME_SPACING + 6, 6, 18)),
        post: new GpuMesh(engine.gl, createBox(0.12, 2.4, 0.12)),
        lintel: new GpuMesh(engine.gl, createBox(1.7, 0.12, 0.12)),
        door: new GpuMesh(engine.gl, createBox(1.35, 2.15, 0.04)),
        bulb: new GpuMesh(engine.gl, createSphere(0.07, 10, 12)),
        moths: new GpuMesh(engine.gl, mothData),
        lattice: new GpuMesh(engine.gl, createLineCube(1.4)),
        ico: new GpuMesh(engine.gl, createIcosahedronLines(0.95)),
        core: new GpuMesh(engine.gl, createSphere(0.16, 12, 16)),
      };
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, progress, aspect } = ctx;
      if (!kit) return;
      identity(identityModel);

      const camZ = 7.2 - progress * 22;
      const enterVoid = smoothstep(0.78, 0.92, progress);
      const eye: Vec3 = [0.08 * Math.sin(progress * 4), 1.25, camZ];
      const target: Vec3 = [0, 1.05, camZ - 4.5];
      perspective(proj, 52 * DEG, aspect, 0.08, 50);
      lookAt(view, eye, target, [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.15, 0.9, 0.3];
      engine.lightColor = [1, 0.78, 0.5];
      engine.ambient = [0.06, 0.05, 0.045];
      engine.fogDensity = 0.09 + enterVoid * 0.04;
      engine.fogColor = [0.03, 0.025, 0.02];
      engine.pointPos = [0, 2.15, camZ - 1.2];
      engine.pointColor = [1, 0.7, 0.35];
      engine.pointRange = 5.5;
      engine.clear(0.03, 0.025, 0.02);

      engine.drawLit(kit.floor, modelTRSX(0, 0, -FRAME_COUNT), {
        color: [0.28, 0.22, 0.16],
        useVertexColor: true,
        shininess: 8,
      });

      const lastIndex = FRAME_COUNT - 1;
      const doorOpen = smoothstep(0.64, 0.78, progress);

      for (let i = 0; i < FRAME_COUNT; i++) {
        const z = -i * FRAME_SPACING;
        const oak: Vec3 = [0.5, 0.32, 0.16];
        engine.drawLit(kit.post, modelTRSX(-0.82, 1.2, z), { color: oak, shininess: 14 });
        engine.drawLit(kit.post, modelTRSX(0.82, 1.2, z), { color: oak, shininess: 14 });
        engine.drawLit(kit.lintel, modelTRSX(0, 2.38, z), { color: oak, shininess: 14 });
        engine.drawLit(kit.lintel, modelTRSX(0, 0.08, z), { color: oak, shininess: 10 });

        const isLast = i === lastIndex;
        const swing = isLast ? -doorOpen * 1.35 : 0;
        engine.drawLit(
          kit.door,
          modelTRSX(0.55 * Math.cos(swing) - 0.55, 1.15, z + 0.08, 0, swing, 0),
          {
            color: [0.18, 0.2, 0.2],
            shininess: 30,
          },
        );

        engine.drawLit(kit.bulb, modelTRSX(0, 2.15, z + 0.2), {
          color: [1, 0.85, 0.55],
          emissive: [0.85, 0.55, 0.2],
          shininess: 4,
        });
      }

      writePoints(mothData, (i, set) => {
        const bulbIndex = i % FRAME_COUNT;
        const z = -bulbIndex * FRAME_SPACING + 0.2;
        const a = timeSec * (1.2 + (i % 5) * 0.15) + i;
        const r = 0.18 + (i % 4) * 0.05;
        set(Math.cos(a) * r, 2.15 + Math.sin(a * 1.7) * 0.12, z + Math.sin(a) * r);
      });
      kit.moths.updatePositions(mothData.positions);
      engine.drawPoints(kit.moths, identityModel, [0.95, 0.88, 0.7], 3.5, 0.65);

      if (enterVoid > 0.02) {
        const vz = -lastIndex * FRAME_SPACING - 2.4;
        const spin = timeSec * 0.4;
        engine.drawLines(
          kit.lattice,
          modelTRSX(0, 1.2, vz, spin, spin * 0.7, 0),
          [0.78, 0.55, 0.28],
        );
        engine.drawLines(kit.ico, modelTRSX(0, 1.2, vz, -spin * 0.5, spin, 0), [0.85, 0.62, 0.32]);
        engine.drawLit(
          kit.core,
          modelTRSX(
            0,
            1.2,
            vz,
            0,
            spin,
            0,
            1 + enterVoid * 0.2,
            1 + enterVoid * 0.2,
            1 + enterVoid * 0.2,
          ),
          {
            color: [0.55, 0.18, 0.05],
            emissive: [0.5, 0.14, 0.04],
            shininess: 8,
          },
        );
      }
    },
    dispose() {
      if (!kit) return;
      for (const mesh of Object.values(kit)) mesh.dispose();
      kit = null;
    },
  };
}
