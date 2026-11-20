import { createLathe, createRibbon, createSphere, type MeshData } from './mesh';

import type { Vec3 } from './math';

/**
 * The CPU geometry work a scene can hand off: mesh builders that run at init (or while a mesh
 * morphs), and per-frame kernels over flat `Float32Array`s (xyz triples) that a native
 * implementation could run without allocating.
 *
 * Only `tsKernel` exists. A C++/WASM kernel was gated on a profile (issue #94, Phase D): it
 * would only be built if these functions took at least 25% of a frame's CPU. They took 0.3-4.7%
 * on the render worker (docs/perf/engine-v2-profile.md), so the interface stays and the native
 * build does not. Re-run `scripts/trace-sequences.ts` when a film leans on particles or hoses.
 */
export interface GeometryKernel {
  readonly name: string;
  sphere(radius: number, latBands?: number, longBands?: number): MeshData;
  /** Surface of revolution around Y from `[radius, y]` pairs, bottom to top. */
  lathe(profile: readonly [number, number][], segments?: number): MeshData;
  /** Möbius band (`mix` 0) morphing into a (2,3) torus-knot ribbon (`mix` 1). */
  ribbon(mix: number, uSegments?: number, vSegments?: number): MeshData;
  /**
   * Advances particles in place by `dt` seconds: semi-implicit Euler under `gravity`, with
   * exponential `drag`, bouncing off an optional floor. `pos` and `vel` are xyz triples.
   */
  integrateParticles(
    pos: Float32Array,
    vel: Float32Array,
    dt: number,
    params: ParticleParams,
  ): void;
  /**
   * Rubber-hose limbs: for each `anchors[i]` (shoulder, hip) to `targets[i]` (hand, foot), writes
   * evenly spaced points along a hose of `restLength` into `out`. Closer than `restLength`, the
   * hose bows into a circular arc of that length (no elbow); farther, it stretches straight.
   * `out` holds `samples` points per limb: `out.length = limbs * samples * 3`, `samples >= 2`.
   */
  hoseChain(
    anchors: Float32Array,
    targets: Float32Array,
    out: Float32Array,
    params: HoseParams,
  ): void;
}

export interface ParticleParams {
  /** Acceleration in units per second squared. */
  gravity: Vec3;
  /** Per second: velocity is scaled by `exp(-drag * dt)` each step. 0 = no drag. */
  drag: number;
  /** Particles that end a step below this y are put back on it and bounce. */
  floorY?: number;
  /** Share of vertical speed kept by a bounce, 0..1. Default 0.5. */
  bounce?: number;
}

export interface HoseParams {
  restLength: number;
  /** Which way a slack hose bows; projected off the anchor-target line. Default +y. */
  bend?: Vec3;
}

/** Arc half-angle `t` with `sin(t) / t = ratio` (chord / arc length), by Newton's method. */
function arcHalfAngle(ratio: number): number {
  if (ratio >= 1) return 0;
  if (ratio <= 0) return Math.PI;
  // A good start from the series sin(t)/t ~ 1 - t^2/6.
  let t = Math.min(Math.PI, Math.sqrt(6 * (1 - ratio)));
  for (let i = 0; i < 12; i++) {
    const f = Math.sin(t) / t - ratio;
    const df = (t * Math.cos(t) - Math.sin(t)) / (t * t);
    if (df === 0) break;
    const next = Math.min(Math.PI, Math.max(1e-6, t - f / df));
    if (Math.abs(next - t) < 1e-12) return next;
    t = next;
  }
  return t;
}

function integrateParticles(
  pos: Float32Array,
  vel: Float32Array,
  dt: number,
  params: ParticleParams,
): void {
  const [gx, gy, gz] = params.gravity;
  const damp = params.drag > 0 ? Math.exp(-params.drag * dt) : 1;
  const bounce = params.bounce ?? 0.5;
  const floor = params.floorY;
  const count = Math.min(pos.length, vel.length) / 3;
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const vx = ((vel[o] ?? 0) + gx * dt) * damp;
    let vy = ((vel[o + 1] ?? 0) + gy * dt) * damp;
    const vz = ((vel[o + 2] ?? 0) + gz * dt) * damp;
    const x = (pos[o] ?? 0) + vx * dt;
    let y = (pos[o + 1] ?? 0) + vy * dt;
    const z = (pos[o + 2] ?? 0) + vz * dt;
    if (floor !== undefined && y < floor) {
      y = floor + (floor - y) * bounce;
      vy = -vy * bounce;
    }
    pos[o] = x;
    pos[o + 1] = y;
    pos[o + 2] = z;
    vel[o] = vx;
    vel[o + 1] = vy;
    vel[o + 2] = vz;
  }
}

function hoseChain(
  anchors: Float32Array,
  targets: Float32Array,
  out: Float32Array,
  params: HoseParams,
): void {
  const limbs = Math.min(anchors.length, targets.length) / 3;
  if (limbs === 0) return;
  const samples = out.length / 3 / limbs;
  if (!Number.isInteger(samples) || samples < 2) {
    throw new RangeError(
      `hoseChain: out has ${out.length} floats for ${limbs} limbs; it needs limbs * samples * 3 ` +
        'with at least 2 samples per limb',
    );
  }
  const [bx, by, bz] = params.bend ?? [0, 1, 0];
  const length = Math.max(0, params.restLength);

  for (let limb = 0; limb < limbs; limb++) {
    const a = limb * 3;
    const ax = anchors[a] ?? 0;
    const ay = anchors[a + 1] ?? 0;
    const az = anchors[a + 2] ?? 0;
    const dx = (targets[a] ?? 0) - ax;
    const dy = (targets[a + 1] ?? 0) - ay;
    const dz = (targets[a + 2] ?? 0) - az;
    const chord = Math.hypot(dx, dy, dz);
    const base = limb * samples * 3;

    // Unit chord direction, and the bow direction: `bend` with its chord component removed.
    const ux = chord > 0 ? dx / chord : 0;
    const uy = chord > 0 ? dy / chord : 1;
    const uz = chord > 0 ? dz / chord : 0;
    const along = bx * ux + by * uy + bz * uz;
    let px = bx - along * ux;
    let py = by - along * uy;
    let pz = bz - along * uz;
    let plen = Math.hypot(px, py, pz);
    if (plen < 1e-9) {
      // `bend` is parallel to the limb: bow along any perpendicular.
      [px, py, pz] = Math.abs(ux) < 0.9 ? [0, -uz, uy] : [uz, 0, -ux];
      plen = Math.hypot(px, py, pz) || 1;
    }
    px /= plen;
    py /= plen;
    pz /= plen;

    const half = length > 0 && chord < length ? arcHalfAngle(chord / length) : 0;
    for (let s = 0; s < samples; s++) {
      const f = s / (samples - 1);
      const o = base + s * 3;
      if (half === 0) {
        // Taut: a straight, stretched hose.
        out[o] = ax + dx * f;
        out[o + 1] = ay + dy * f;
        out[o + 2] = az + dz * f;
        continue;
      }
      // Slack: point `f` of the way along an arc of `length` whose chord is the limb.
      const radius = length / (2 * half);
      const angle = -half + 2 * half * f;
      const alongChord = chord / 2 + radius * Math.sin(angle);
      const bow = radius * (Math.cos(angle) - Math.cos(half));
      out[o] = ax + ux * alongChord + px * bow;
      out[o + 1] = ay + uy * alongChord + py * bow;
      out[o + 2] = az + uz * alongChord + pz * bow;
    }
  }
}

/** The TypeScript kernel: today's mesh builders plus the two flat-array kernels above. */
export const tsKernel: GeometryKernel = {
  name: 'ts',
  sphere: (radius, latBands, longBands) => createSphere(radius, latBands, longBands),
  lathe: (profile, segments) => createLathe(profile, segments),
  ribbon: (mix, uSegments, vSegments) => createRibbon(mix, uSegments, vSegments),
  integrateParticles,
  hoseChain,
};

/** The kernel a renderer runs. One implementation today; see the note on `GeometryKernel`. */
export function selectGeometryKernel(): GeometryKernel {
  return tsKernel;
}
