import { tsKernel, type GeometryKernel, type ParticleParams } from '../../lib/webgl/kernel';
import { DEG, type Vec3 } from '../../lib/webgl/math';

import { sampleKeys } from './animate';
import { mulberry32 } from './random';

import type { GraphEmitter } from './types';

/** Simulation step, seconds. Every frame is reached by whole steps from 0, so seeks repeat exactly. */
export const EMITTER_STEP = 1 / 60;
export const MAX_EMITTER_CAPACITY = 4096;

/** Particles alive at once, at most: `capacity`, or derived from the peak rate, life and bursts. */
export function emitterCapacity(spec: GraphEmitter): number {
  if (spec.capacity !== undefined) return spec.capacity;
  const rate = spec.rate;
  const peakRate =
    rate === undefined
      ? 0
      : typeof rate === 'number'
        ? rate
        : Math.max(0, ...rate.map((key) => key.v));
  const bursts = (spec.burst ?? []).reduce((sum, key) => sum + Math.max(0, Math.round(key.v)), 0);
  return Math.min(MAX_EMITTER_CAPACITY, Math.max(1, Math.ceil(peakRate * spec.life) + bursts + 1));
}

/**
 * A seekable particle emitter. `sample(t)` returns how many particles are alive at scene time `t`
 * and writes their positions, packed from the start of `positions`.
 *
 * State is advanced in fixed `EMITTER_STEP` steps through the geometry kernel's
 * `integrateParticles`. Moving forward continues from the last state; moving back (a seek, a loop
 * wrap) replays from 0, so a frame never depends on how the player got there.
 */
export class EmitterSim {
  readonly capacity: number;
  /** Alive particles' positions, packed: the first `sample()` result triples are valid. */
  readonly positions: Float32Array;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  /** Step each slot was born on; -1 = empty. */
  private readonly born: Int32Array;
  private readonly params: ParticleParams;
  private readonly lifeSteps: number;
  private readonly basis: { dir: Vec3; u: Vec3; v: Vec3 };
  private step = 0;
  private births = 0;
  private carry = 0;

  constructor(
    private readonly spec: GraphEmitter,
    private readonly kernel: GeometryKernel = tsKernel,
  ) {
    this.capacity = emitterCapacity(spec);
    this.positions = new Float32Array(this.capacity * 3);
    this.pos = new Float32Array(this.capacity * 3);
    this.vel = new Float32Array(this.capacity * 3);
    this.born = new Int32Array(this.capacity);
    this.params = {
      gravity: spec.gravity ?? [0, 0, 0],
      drag: spec.drag ?? 0,
      floorY: spec.floorY,
      bounce: spec.bounce,
    };
    this.lifeSteps = Math.max(1, Math.round(spec.life / EMITTER_STEP));
    this.basis = coneBasis(spec.direction ?? [0, 1, 0]);
    this.reset();
  }

  /** Alive count at scene time `timeSec`; their positions are packed into `positions`. */
  sample(timeSec: number): number {
    const target = Math.max(0, Math.floor(timeSec / EMITTER_STEP + 1e-6));
    if (target < this.step) this.reset();
    while (this.step < target) this.advance();
    let alive = 0;
    for (let slot = 0; slot < this.capacity; slot++) {
      if (this.born[slot]! < 0) continue;
      const o = slot * 3;
      const p = alive * 3;
      this.positions[p] = this.pos[o]!;
      this.positions[p + 1] = this.pos[o + 1]!;
      this.positions[p + 2] = this.pos[o + 2]!;
      alive += 1;
    }
    return alive;
  }

  private reset(): void {
    this.step = 0;
    this.births = 0;
    this.carry = 0;
    this.born.fill(-1);
    this.pos.fill(0);
    this.vel.fill(0);
  }

  /** One step: retire the old, emit for [t, t + step), then integrate everything alive. */
  private advance(): void {
    const t0 = this.step * EMITTER_STEP;
    const t1 = t0 + EMITTER_STEP;
    for (let slot = 0; slot < this.capacity; slot++) {
      const born = this.born[slot]!;
      if (born >= 0 && this.step - born >= this.lifeSteps) this.born[slot] = -1;
    }

    let count = 0;
    const rate = this.spec.rate;
    if (rate !== undefined) {
      const perSecond = typeof rate === 'number' ? rate : sampleKeys(rate, t0);
      this.carry += Math.max(0, perSecond) * EMITTER_STEP;
      const whole = Math.floor(this.carry);
      this.carry -= whole;
      count += whole;
    }
    for (const key of this.spec.burst ?? []) {
      if (key.t >= t0 && key.t < t1) count += Math.max(0, Math.round(key.v));
    }
    for (let n = 0; n < count; n++) this.spawn();

    this.kernel.integrateParticles(this.pos, this.vel, EMITTER_STEP, this.params);
    // Empty slots were integrated too; park them so they never drift to NaN.
    for (let slot = 0; slot < this.capacity; slot++) {
      if (this.born[slot]! >= 0) continue;
      const o = slot * 3;
      this.pos[o] = this.pos[o + 1] = this.pos[o + 2] = 0;
      this.vel[o] = this.vel[o + 1] = this.vel[o + 2] = 0;
    }
    this.step += 1;
  }

  private spawn(): void {
    const index = this.births++;
    const slot = index % this.capacity;
    const rand = mulberry32(((this.spec.seed ?? 1) * 0x9e3779b1 + index * 0x85ebca6b) >>> 0);
    const spec = this.spec;
    const origin = spec.origin ?? [0, 0, 0];
    const o = slot * 3;

    // Spawn point: uniform in a ball of `radius` around `origin`.
    const radius = (spec.radius ?? 0) * Math.cbrt(rand());
    const [sx, sy, sz] = unitVector(rand(), rand());
    this.pos[o] = origin[0] + sx * radius;
    this.pos[o + 1] = origin[1] + sy * radius;
    this.pos[o + 2] = origin[2] + sz * radius;

    // Direction: uniform over the cone of half-angle `spread` around `direction`.
    const spread = Math.min(180, Math.max(0, spec.spread ?? 30)) * DEG;
    const cosTheta = 1 - rand() * (1 - Math.cos(spread));
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    const phi = rand() * Math.PI * 2;
    const { dir, u, v } = this.basis;
    const a = Math.cos(phi) * sinTheta;
    const b = Math.sin(phi) * sinTheta;
    const [lo, hi] = typeof spec.speed === 'number' ? [spec.speed, spec.speed] : spec.speed;
    const speed = lo + (hi - lo) * rand();
    for (let axis = 0; axis < 3; axis++) {
      this.vel[o + axis] = (dir[axis]! * cosTheta + u[axis]! * a + v[axis]! * b) * speed;
    }
    this.born[slot] = this.step;
  }
}

function unitVector(r1: number, r2: number): Vec3 {
  const z = r1 * 2 - 1;
  const s = Math.sqrt(Math.max(0, 1 - z * z));
  const phi = r2 * Math.PI * 2;
  return [s * Math.cos(phi), s * Math.sin(phi), z];
}

/** `dir` normalized, plus two unit vectors perpendicular to it and to each other. */
function coneBasis(direction: Vec3): { dir: Vec3; u: Vec3; v: Vec3 } {
  const length = Math.hypot(...direction) || 1;
  const dir: Vec3 = [direction[0] / length, direction[1] / length, direction[2] / length];
  const helper: Vec3 = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const raw = cross(dir, helper);
  const ul = Math.hypot(...raw) || 1;
  const u: Vec3 = [raw[0] / ul, raw[1] / ul, raw[2] / ul];
  return { dir, u, v: cross(dir, u) };
}
