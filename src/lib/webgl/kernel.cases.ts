import type { GeometryKernel } from './kernel';
import type { MeshData } from './mesh';

/**
 * Fixed inputs every `GeometryKernel` must turn into the outputs committed in
 * `kernel.fixtures.json` (within 1e-6; see kernel.test.ts). Each case returns named flat arrays.
 * Rewrite the fixtures after an intentional change: `npx tsx scripts/emit-kernel-fixtures.ts`.
 */
export type KernelOutputs = Record<string, number[]>;

export const LATHE_PROFILE: [number, number][] = [
  [0.2, 0],
  [0.35, 0.3],
  [0.1, 0.6],
];

function mesh(data: MeshData): KernelOutputs {
  return {
    positions: [...data.positions],
    normals: [...(data.normals ?? [])],
    indices: [...(data.indices ?? [])],
  };
}

export const KERNEL_CASES: Record<string, (kernel: GeometryKernel) => KernelOutputs> = {
  sphere: (k) => mesh(k.sphere(0.75, 4, 6)),
  lathe: (k) => mesh(k.lathe(LATHE_PROFILE, 6)),
  ribbon: (k) => mesh(k.ribbon(0.4, 8, 2)),
  particles: (k) => {
    const pos = new Float32Array([0, 1, 0, 0.5, 0.2, -0.3, -1, 3, 2, 0.1, 0.05, 0]);
    const vel = new Float32Array([1, 0, 0, 0, 2, 0, -0.5, -1, 0.25, 0, -4, 0]);
    const params = {
      gravity: [0, -9.8, 0.4] as [number, number, number],
      drag: 0.8,
      floorY: 0,
      bounce: 0.6,
    };
    for (let step = 0; step < 12; step++) k.integrateParticles(pos, vel, 1 / 60, params);
    return { pos: [...pos], vel: [...vel] };
  },
  hose: (k) => {
    // Slack (bows), taut (straight), and anchor on target (a closed loop).
    const anchors = new Float32Array([0, 0, 0, 1, 0, 0, 0, 2, 0]);
    const targets = new Float32Array([0.3, -0.2, 0, 3, 0, 0, 0, 2, 0]);
    const out = new Float32Array(3 * 5 * 3);
    k.hoseChain(anchors, targets, out, { restLength: 0.8, bend: [0, 0, 1] });
    return { out: [...out] };
  },
};
