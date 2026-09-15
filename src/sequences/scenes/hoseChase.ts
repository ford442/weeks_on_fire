import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import {
  createBox,
  createCylinder,
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

interface Puppet {
  head: GpuMesh;
  body: GpuMesh;
  limb: GpuMesh;
  eye: GpuMesh;
  cube: GpuMesh;
  floor: GpuMesh;
  wall: GpuMesh;
  curtain: GpuMesh;
  dust: GpuMesh;
}

export function createHoseChase(): SequenceScene {
  let puppet: Puppet | null = null;
  const dustData = createPoints(28);
  const proj = createMat4();
  const view = createMat4();
  const identityModel = createMat4();

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

  function drawRunner(
    engine: SequenceEngine,
    x: number,
    bodyY: number,
    squashY: number,
    lean: number,
    stride: number,
    wheel: boolean,
    alpha: number,
  ) {
    if (!puppet) return;
    const bodyColor: Vec3 = [orange[0] * alpha, orange[1] * alpha, orange[2] * alpha];
    const headColor: Vec3 = [cream[0] * alpha, cream[1] * alpha, cream[2] * alpha];
    const inkColor: Vec3 = [ink[0] * alpha, ink[1] * alpha, ink[2] * alpha];
    const cubeC: Vec3 = [cubeColor[0] * alpha, cubeColor[1] * alpha, cubeColor[2] * alpha];

    cel(puppet.body, engine, modelTRSX(x, bodyY, 0, 0, 0.12, lean, 1.15, squashY, 1), bodyColor);
    cel(
      puppet.head,
      engine,
      modelTRSX(x, bodyY + 0.42 / squashY, 0.04, 0, 0, lean * 0.4),
      headColor,
    );
    engine.drawLit(puppet.eye, modelTRSX(x - 0.07, bodyY + 0.46, 0.2), {
      color: inkColor,
      emissive: inkColor,
      cel: true,
    });
    engine.drawLit(puppet.eye, modelTRSX(x + 0.07, bodyY + 0.46, 0.2), {
      color: inkColor,
      emissive: inkColor,
      cel: true,
    });

    if (wheel) {
      for (let spoke = 0; spoke < 4; spoke++) {
        const a = stride + (spoke * Math.PI) / 2;
        cel(
          puppet.limb,
          engine,
          modelTRSX(x - 0.02, bodyY - 0.22, 0, 0, 0, a, 1, 0.85, 1),
          inkColor,
        );
      }
    } else {
      const leg = Math.sin(stride) * 0.7;
      cel(puppet.limb, engine, modelTRSX(x - 0.16, bodyY - 0.28, 0, 0, 0, 0.25 + leg), inkColor);
      cel(puppet.limb, engine, modelTRSX(x + 0.16, bodyY - 0.28, 0, 0, 0, -0.25 - leg), inkColor);
    }

    const arm = Math.sin(stride + Math.PI) * 0.85;
    cel(puppet.limb, engine, modelTRSX(x - 0.24, bodyY + 0.08, 0, 0, 0, 1.05 + arm), inkColor);
    cel(puppet.limb, engine, modelTRSX(x + 0.24, bodyY + 0.08, 0, 0, 0, -1.05 - arm), inkColor);
    cel(
      puppet.cube,
      engine,
      modelTRSX(x, bodyY + 0.66 / squashY, 0, 0.2, stride * 0.15, lean * 0.3, 0.55, 0.55, 0.55),
      cubeC,
    );
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
        dust: new GpuMesh(engine.gl, dustData),
      };
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, aspect } = ctx;
      if (!puppet) return;
      identity(identityModel);

      const t = timeSec;
      const squashIn = smoothstep(0, 2, t);
      const run = t >= 2 && t < 12;
      const skidT = smoothstep(12, 14.5, t);
      const hold = smoothstep(14.5, 16, t);

      const runTime = Math.max(0, Math.min(t - 2, 10));
      const skidElapsed = Math.max(0, Math.min(t - 12, 2.5));
      const skidDistance = 3.6 * (skidElapsed - (skidElapsed * skidElapsed) / (2 * 2.5));
      const scroll = runTime * 3.6 + skidDistance;
      const tile = 4.2;
      const scrollMod = ((scroll % tile) + tile) % tile;

      const x = -0.15 + 0.35 * (1 - squashIn);
      const hop = run ? Math.abs(Math.sin(t * 16)) * 0.06 : 0;
      const lean = run ? -0.35 : 0.55 * skidT * (1 - hold);
      const squashY = 0.7 + 0.3 * squashIn - 0.22 * skidT + hop;
      const bodyY = 2.1 * (1 - squashIn) + 0.55 * squashIn + hop - 0.08 * skidT;
      const stride = run ? t * 16 : 12 * 16 * (1 - skidT);

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

      for (let i = -1; i <= 1; i++) {
        engine.drawLit(puppet.floor, modelTRSX(-scrollMod + i * tile, 0, 0), {
          color: [0.25, 0.22, 0.18],
          useVertexColor: true,
          shininess: 6,
        });
      }
      engine.drawLit(puppet.wall, modelTRSX(0, 1.55, -1.55), {
        color: [0.9, 0.82, 0.68],
        shininess: 4,
      });
      for (let i = -1; i <= 1; i++) {
        const cx = -scrollMod + i * tile;
        engine.drawLit(puppet.curtain, modelTRSX(cx - 2.05, 1.5, -1.35), {
          color: orange,
          shininess: 6,
        });
        engine.drawLit(puppet.curtain, modelTRSX(cx + 2.05, 1.5, -1.35), {
          color: orange,
          shininess: 6,
        });
      }

      if (run) {
        drawRunner(engine, x - 0.42, bodyY, squashY, lean, stride - 0.8, true, 0.35);
        drawRunner(engine, x - 0.24, bodyY, squashY, lean, stride - 0.4, true, 0.6);
      }
      drawRunner(engine, x, bodyY, squashY, lean, stride, run, 1);

      writePoints(dustData, (i, set) => {
        const life = skidT * (1 - hold);
        const a = i * 0.9;
        const spread = 0.15 + life * (0.2 + (i % 5) * 0.08);
        set(
          x - 0.35 - spread * Math.cos(a),
          0.08 + life * (0.05 + (i % 4) * 0.04),
          Math.sin(a) * 0.12 * life,
        );
      });
      puppet.dust.updatePositions(dustData.positions);
      if (skidT > 0.05) {
        engine.drawPoints(
          puppet.dust,
          identityModel,
          [0.55, 0.45, 0.32],
          7,
          0.55 * skidT * (1 - hold),
        );
        engine.drawLit(puppet.limb, modelTRSX(x - 0.55, 0.02, 0.08, 0, 0, 1.57, 0.7, 0.15, 0.15), {
          color: [0.2, 0.16, 0.12],
          emissive: [0.12, 0.06, 0.02],
          cel: true,
        });
        engine.drawLit(puppet.limb, modelTRSX(x - 0.7, 0.02, -0.08, 0, 0, 1.57, 0.55, 0.12, 0.12), {
          color: [0.2, 0.16, 0.12],
          emissive: [0.1, 0.05, 0.02],
          cel: true,
        });
      }
    },
    dispose() {
      if (!puppet) return;
      for (const mesh of Object.values(puppet)) mesh.dispose();
      puppet = null;
    },
  };
}
