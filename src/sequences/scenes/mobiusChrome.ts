import { GpuMesh, modelTRSX, type SequenceEngine } from '../../lib/webgl/engine';
import { createRibbon } from '../../lib/webgl/mesh';
import { createMat4, DEG, lookAt, perspective, smoothstep, type Vec3 } from '../../lib/webgl/math';
import type { SequenceDrawContext, SequenceScene } from '../types';

export function createMobiusChrome(): SequenceScene {
  let ribbon: GpuMesh | null = null;
  let lastMix = -1;
  const proj = createMat4();
  const view = createMat4();
  const chrome: Vec3 = [0.72, 0.76, 0.8];

  function mixAt(progress: number): number {
    const toKnot = smoothstep(40 / 75, 55 / 75, progress);
    const back = 1 - smoothstep(65 / 75, 1, progress);
    return toKnot * back;
  }

  function rebuild(engine: SequenceEngine, mix: number) {
    ribbon?.dispose();
    ribbon = new GpuMesh(engine.gl, createRibbon(mix, 96, 12));
    lastMix = mix;
  }

  return {
    init(engine: SequenceEngine) {
      rebuild(engine, 0);
    },
    draw(ctx: SequenceDrawContext) {
      const { engine, timeSec, progress, aspect } = ctx;
      const mix = mixAt(progress);
      if (Math.abs(mix - lastMix) > 0.012) rebuild(engine, mix);
      if (!ribbon) return;

      const boom = 3.3 - 0.7 * smoothstep(0.25, 0.55, progress);
      const yaw = timeSec * 0.22;
      const eye: Vec3 = [
        Math.sin(yaw) * boom,
        0.55 + 0.35 * Math.sin(progress * Math.PI),
        Math.cos(yaw) * boom,
      ];
      perspective(proj, 50 * DEG, aspect, 0.08, 30);
      lookAt(view, eye, [0, 0, 0], [0, 1, 0]);
      engine.setCamera(proj, view, eye);
      engine.lightDir = [0.55, 0.35, 0.75];
      engine.lightColor = [1, 0.55, 0.22];
      engine.ambient = [0.08, 0.12, 0.16];
      engine.fogDensity = 0.05;
      engine.fogColor = [0.02, 0.03, 0.04];
      engine.pointPos = [1.2, 0.8, 0.4];
      engine.pointColor = [0.35, 0.75, 1];
      engine.pointRange = 4;
      engine.clear(0.015, 0.02, 0.03);

      const spin = modelTRSX(0, 0, 0, timeSec * 0.15, timeSec * 0.31, timeSec * 0.07);
      engine.drawLit(ribbon, spin, { color: chrome, shininess: 90, emissive: [0.04, 0.03, 0.02] });

      const split =
        smoothstep(55 / 75, 60 / 75, progress) * (1 - smoothstep(65 / 75, 72 / 75, progress));
      if (split > 0.02) {
        const offset = modelTRSX(0, 0.12 * split, 0, 0, split * 0.45, 0);
        engine.drawLit(ribbon, offset, {
          color: [0.55, 0.7, 0.82],
          shininess: 80,
          emissive: [0.02, 0.04, 0.06],
        });
      }
    },
    dispose() {
      ribbon?.dispose();
      ribbon = null;
    },
  };
}
