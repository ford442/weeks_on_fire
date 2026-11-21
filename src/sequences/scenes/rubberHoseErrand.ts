import { GpuMesh, modelTRSX, type SequenceEngine, disposeMeshes } from '../../lib/webgl/engine';
import { InstanceBatch } from '../../lib/webgl/instances';
import { createBox, createCylinder, createPlane, createSphere } from '../../lib/webgl/mesh';
import { createMat4, DEG, lookAt, perspective, smoothstep, type Vec3 } from '../../lib/webgl/math';

import type { SequenceDrawContext, SequenceScene } from '../types';

interface Puppet {
  head: GpuMesh;
  body: GpuMesh;
  limb: GpuMesh;
  eye: GpuMesh;
  cube: GpuMesh;
  floor: GpuMesh;
  wall: GpuMesh;
  curtain: GpuMesh;
}

export function createRubberHoseErrand(): SequenceScene {
  let puppet: Puppet | null = null;
  const proj = createMat4();
  const view = createMat4();
  const curtains = new InstanceBatch(2);
  const eyes = new InstanceBatch(2);
  const limbs = new InstanceBatch(4);

  const cream: Vec3 = [0.93, 0.86, 0.72];
  const orange: Vec3 = [1, 0.48, 0.12];
  const ink: Vec3 = [0.08, 0.06, 0.05];
  const cubeColor: Vec3 = [0.35, 0.55, 0.82];

  function cel(
    mesh: GpuMesh,
    engine: SequenceEngine,
    model: ReturnType<typeof modelTRSX>,
    color: Vec3,
  ) {
    engine.drawLit(mesh, model, {
      color,
      cel: true,
      shininess: 6,
      emissive: [color[0] * 0.22, color[1] * 0.22, color[2] * 0.22],
    });
  }

  return {
    init(engine: SequenceEngine) {
      puppet = {
        head: new GpuMesh(engine.gl, createSphere(0.22, 12, 16)),
        body: new GpuMesh(engine.gl, createSphere(0.28, 12, 16)),
        limb: new GpuMesh(engine.gl, createCylinder(0.045, 0.42, 10, true)),
        eye: new GpuMesh(engine.gl, createSphere(0.045, 8, 10)),
        cube: new GpuMesh(engine.gl, createBox(0.32, 0.32, 0.32)),
        floor: new GpuMesh(engine.gl, createPlane(6, 4, 8, 6)),
        wall: new GpuMesh(engine.gl, createBox(6.2, 3.2, 0.08)),
        curtain: new GpuMesh(engine.gl, createBox(0.35, 3.1, 0.12)),
      };
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, aspect } = ctx;
      if (!puppet) return;

      const t = timeSec;
      const squashIn = smoothstep(0, 3, t);
      const walkT = smoothstep(3, 12, t);
      const hatT = smoothstep(12, 18, t);
      const hopT = smoothstep(18, 24, t);
      const exitT = smoothstep(24, 31, t);

      const startX = -0.85;
      const cubeX = 0.65;
      const walkX = startX + (cubeX - 0.28 - startX) * walkT;
      const x = walkX + 2.1 * exitT;
      const hop = Math.abs(Math.sin((t - 18) * 8)) * 0.28 * hopT * (1 - exitT);
      const dropY = 2.2 * (1 - squashIn) + 0.55 * squashIn + hop;
      const squash = 1 + 0.35 * Math.sin(squashIn * Math.PI) * (1 - squashIn);
      const stride = walkT > 0 && hatT < 1 && exitT < 0.2 ? t * 7 : hopT * t * 9;
      const leg = Math.sin(stride) * 0.55 * Math.max(walkT, hopT) * (1 - hatT * 0.4);
      const arm = Math.sin(stride + Math.PI) * 0.7;

      const eye: Vec3 = [0, 1.2, 3.55];
      perspective(proj, 48 * DEG, aspect, 0.1, 30);
      lookAt(view, eye, [0, 0.72, 0], [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.2, 0.75, 0.7];
      engine.lightColor = [1.05, 0.98, 0.88];
      engine.ambient = [0.46, 0.4, 0.34];
      engine.fogDensity = 0;
      engine.pointPos = [0.1, 1.6, 2.4];
      engine.pointColor = [1, 0.9, 0.75];
      engine.pointRange = 7;
      engine.clear(0.16, 0.13, 0.11);

      engine.drawLit(puppet.floor, modelTRSX(0, 0, 0), {
        color: [0.25, 0.22, 0.18],
        useVertexColor: true,
        shininess: 6,
      });
      engine.drawLit(puppet.wall, modelTRSX(0, 1.55, -1.55), {
        color: [0.9, 0.82, 0.68],
        shininess: 4,
      });
      curtains.clear();
      curtains.push(modelTRSX(-2.05, 1.5, -1.35), orange, undefined, 6);
      curtains.push(modelTRSX(2.05, 1.5, -1.35), orange, undefined, 6);
      engine.drawLitInstanced(puppet.curtain, curtains);

      const bodyY = dropY;
      const body = modelTRSX(x, bodyY, 0, 0, 0.15, 0, 1, squash, 1);
      cel(puppet.body, engine, body, orange);

      const head = modelTRSX(x, bodyY + 0.42 / squash, 0.04);
      cel(puppet.head, engine, head, cream);
      eyes.clear();
      eyes.push(modelTRSX(x - 0.07, bodyY + 0.46, 0.2), ink, ink);
      eyes.push(modelTRSX(x + 0.07, bodyY + 0.46, 0.2), ink, ink);
      engine.drawLitInstanced(puppet.eye, eyes, { cel: true });

      // Hose limbs: ink, a fifth of it as glow, like every other cel part.
      const glow: Vec3 = [ink[0] * 0.22, ink[1] * 0.22, ink[2] * 0.22];
      limbs.clear();
      limbs.push(modelTRSX(x - 0.16, bodyY - 0.28, 0, 0, 0, 0.2 + leg), ink, glow, 6);
      limbs.push(modelTRSX(x + 0.16, bodyY - 0.28, 0, 0, 0, -0.2 - leg), ink, glow, 6);
      limbs.push(modelTRSX(x - 0.22, bodyY + 0.08, 0, 0, 0, 0.9 + arm), ink, glow, 6);
      limbs.push(modelTRSX(x + 0.22, bodyY + 0.08, 0, 0, 0, -0.9 - arm), ink, glow, 6);
      engine.drawLitInstanced(puppet.limb, limbs, { cel: true });

      const cubeStillX = 0.85;
      const cubeXNow = cubeStillX + (x - cubeStillX) * hatT;
      const cubeY = 0.22 + (bodyY + 0.62 - 0.22) * hatT;
      const cubeScale = 1 - 0.45 * hatT;
      const hideCube = exitT > 0.85 ? 0 : 1;
      if (hideCube) {
        cel(
          puppet.cube,
          engine,
          modelTRSX(cubeXNow, cubeY, 0, hatT * 0.4, hatT * 1.2, 0, cubeScale, cubeScale, cubeScale),
          cubeColor,
        );
      }
    },
    dispose() {
      if (!puppet) return;
      disposeMeshes(puppet);
      puppet = null;
    },
  };
}
