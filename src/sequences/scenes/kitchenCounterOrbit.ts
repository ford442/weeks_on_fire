import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import {
  createBox,
  createCylinder,
  createPoints,
  createSphere,
  createTorus,
  writePoints,
} from '../../lib/webgl/mesh';
import { createMat4, DEG, identity, lookAt, perspective, type Vec3 } from '../../lib/webgl/math';
import type { SequenceDrawContext, SequenceScene } from '../types';

interface StillLife {
  table: GpuMesh;
  mug: GpuMesh;
  handle: GpuMesh;
  coffee: GpuMesh;
  orange: GpuMesh;
  spoon: GpuMesh;
  wall: GpuMesh;
  steam: GpuMesh;
}

export function createKitchenCounterOrbit(): SequenceScene {
  let meshes: StillLife | null = null;
  const steamData = createPoints(36);
  const proj = createMat4();
  const view = createMat4();
  const identityModel = createMat4();

  return {
    init(engine: SequenceEngine) {
      meshes = {
        table: new GpuMesh(engine.gl, createBox(3.4, 0.12, 1.8)),
        mug: new GpuMesh(engine.gl, createCylinder(0.22, 0.42, 28, true)),
        handle: new GpuMesh(engine.gl, createTorus(0.16, 0.035, 24, 12)),
        coffee: new GpuMesh(engine.gl, createCylinder(0.185, 0.02, 24, true)),
        orange: new GpuMesh(engine.gl, createSphere(0.2, 16, 20)),
        spoon: new GpuMesh(engine.gl, createBox(0.04, 0.015, 0.55)),
        wall: new GpuMesh(engine.gl, createBox(4.2, 2.4, 0.08)),
        steam: new GpuMesh(engine.gl, steamData),
      };
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, progress, aspect } = ctx;
      if (!meshes) return;

      identity(identityModel);
      const orbit = progress * Math.PI * 2;
      const radius = 2.15;
      const eye: Vec3 = [
        Math.sin(orbit) * radius,
        1.15 + 0.12 * Math.sin(progress * Math.PI * 2),
        Math.cos(orbit) * radius + 0.15,
      ];
      perspective(proj, 40 * DEG, aspect, 0.08, 20);
      lookAt(view, eye, [0, 0.35, 0], [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.2, 0.85, 0.4];
      engine.lightColor = [1, 0.86, 0.62];
      engine.ambient = [0.16, 0.13, 0.11];
      engine.fogDensity = 0.02;
      engine.fogColor = [0.08, 0.06, 0.05];
      engine.pointPos = [0.15, 1.6, 0.2];
      engine.pointColor = [1, 0.78, 0.45];
      engine.pointRange = 3.4;
      engine.clear(0.09, 0.07, 0.055);

      engine.drawLit(meshes.wall, modelTRSX(0, 1.15, -0.92), {
        color: [0.82, 0.76, 0.66],
        shininess: 6,
      });
      engine.drawLit(meshes.table, modelTRSX(0, 0, 0), { color: [0.48, 0.3, 0.14], shininess: 18 });
      engine.drawLit(meshes.mug, modelTRSX(-0.18, 0.27, 0.05), {
        color: [0.93, 0.9, 0.84],
        shininess: 70,
      });
      engine.drawLit(meshes.handle, modelTRSX(-0.4, 0.28, 0.05, Math.PI / 2, 0, 0), {
        color: [0.93, 0.9, 0.84],
        shininess: 70,
      });
      engine.drawLit(meshes.coffee, modelTRSX(-0.18, 0.45, 0.05), {
        color: [0.18, 0.1, 0.05],
        emissive: [0.05, 0.02, 0.01],
        shininess: 80,
      });
      engine.drawLit(meshes.orange, modelTRSX(0.42, 0.26, 0.18), {
        color: [0.9, 0.42, 0.1],
        shininess: 28,
      });

      const spoonYaw = 0.18 * Math.sin(timeSec * 0.35);
      engine.drawLit(meshes.spoon, modelTRSX(0.12, 0.085, -0.22, 0, spoonYaw, 0.12), {
        color: [0.72, 0.55, 0.28],
        shininess: 90,
      });

      writePoints(steamData, (i, set) => {
        const phase = i * 0.47 + timeSec * 0.55;
        const rise = ((phase * 0.35) % 1.1) * 0.9;
        const swirl = phase * 1.7;
        set(
          -0.18 + Math.cos(swirl) * 0.05 * rise,
          0.52 + rise,
          0.05 + Math.sin(swirl * 0.8) * 0.04 * rise,
        );
      });
      meshes.steam.updatePositions(steamData.positions);
      engine.drawPoints(meshes.steam, identityModel, [0.95, 0.9, 0.82], 5, 0.35);
    },
    dispose() {
      if (!meshes) return;
      for (const mesh of Object.values(meshes)) mesh.dispose();
      meshes = null;
    },
  };
}
