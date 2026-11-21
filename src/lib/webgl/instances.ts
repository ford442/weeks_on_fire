import type { Mat4, Vec3 } from './math';

/** `drawLit` / `InstanceBatch.push` shininess when none is given. */
export const DEFAULT_SHININESS = 32;

/** Floats per instance: model matrix (16), colour rgb (3), emissive rgb + shininess (4). */
export const INSTANCE_FLOATS = 23;

/**
 * Where each per-instance attribute sits: `[location, size in floats, offset in floats]`.
 * Locations 0-2 are the mesh's position / normal / colour; the shaders' `aModel` (a mat4) takes
 * 3-6, `aInstanceColor` 7, `aInstanceEmissive` 8.
 */
export const INSTANCE_LAYOUT: readonly (readonly [number, number, number])[] = [
  [3, 4, 0],
  [4, 4, 4],
  [5, 4, 8],
  [6, 4, 12],
  [7, 3, 16],
  [8, 4, 19],
];

const NO_EMISSIVE: Vec3 = [0, 0, 0];

/**
 * Copies of one mesh to draw in a single instanced call: each with its own model matrix,
 * colour, emissive and shininess. Reuse one batch per frame (`clear()`, then `push`).
 */
export class InstanceBatch {
  private buffer: Float32Array;
  private length = 0;

  constructor(capacity = 8) {
    this.buffer = new Float32Array(Math.max(1, capacity) * INSTANCE_FLOATS);
  }

  get count(): number {
    return this.length;
  }

  clear(): this {
    this.length = 0;
    return this;
  }

  push(
    model: Mat4,
    color: Vec3,
    emissive: Vec3 = NO_EMISSIVE,
    shininess = DEFAULT_SHININESS,
  ): this {
    const needed = (this.length + 1) * INSTANCE_FLOATS;
    if (needed > this.buffer.length) {
      const grown = new Float32Array(Math.max(needed, this.buffer.length * 2));
      grown.set(this.buffer);
      this.buffer = grown;
    }
    const o = this.length * INSTANCE_FLOATS;
    const b = this.buffer;
    b.set(model.subarray(0, 16), o);
    b[o + 16] = color[0];
    b[o + 17] = color[1];
    b[o + 18] = color[2];
    b[o + 19] = emissive[0];
    b[o + 20] = emissive[1];
    b[o + 21] = emissive[2];
    b[o + 22] = shininess;
    this.length += 1;
    return this;
  }

  /** The packed per-instance floats, `count * INSTANCE_FLOATS` long (a view, not a copy). */
  data(): Float32Array {
    return this.buffer.subarray(0, this.length * INSTANCE_FLOATS);
  }

  /** Instance `i`'s model matrix (a view), for drawing instances one by one. */
  model(i: number): Mat4 {
    const o = i * INSTANCE_FLOATS;
    return this.buffer.subarray(o, o + 16);
  }

  color(i: number): Vec3 {
    const o = i * INSTANCE_FLOATS + 16;
    const b = this.buffer;
    return [b[o] ?? 0, b[o + 1] ?? 0, b[o + 2] ?? 0];
  }

  emissive(i: number): Vec3 {
    const o = i * INSTANCE_FLOATS + 19;
    const b = this.buffer;
    return [b[o] ?? 0, b[o + 1] ?? 0, b[o + 2] ?? 0];
  }

  shininess(i: number): number {
    return this.buffer[i * INSTANCE_FLOATS + 22] ?? DEFAULT_SHININESS;
  }
}
