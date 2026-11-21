import { tsKernel, type GeometryKernel } from '../../lib/webgl/kernel';

import type { MeshData } from '../../lib/webgl/mesh';
import type { Vec3 } from '../../lib/webgl/math';

export interface HoseShape {
  length: number;
  radius: number;
  bend?: Vec3;
  samples?: number;
  radial?: number;
}

export const DEFAULT_HOSE_SAMPLES = 12;
export const DEFAULT_HOSE_RADIAL = 8;

/**
 * A rubber-hose limb: the kernel's `hoseChain` spine from `from` to `to`, swept into a tube with
 * parallel-transport frames (no twisting). Same vertex layout every call, so after the first
 * build only positions and normals are re-uploaded.
 */
export class HoseTube {
  readonly samples: number;
  readonly radial: number;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  private readonly spine: Float32Array;
  private readonly anchor = new Float32Array(3);
  private readonly target = new Float32Array(3);

  constructor(
    private readonly shape: HoseShape,
    private readonly kernel: GeometryKernel = tsKernel,
  ) {
    this.samples = Math.max(2, shape.samples ?? DEFAULT_HOSE_SAMPLES);
    this.radial = Math.max(3, shape.radial ?? DEFAULT_HOSE_RADIAL);
    const vertices = this.samples * (this.radial + 1);
    this.positions = new Float32Array(vertices * 3);
    this.normals = new Float32Array(vertices * 3);
    this.spine = new Float32Array(this.samples * 3);
  }

  /** Static index buffer for the tube (two triangles per quad). */
  indices(): Uint16Array {
    const ring = this.radial + 1;
    const out: number[] = [];
    for (let s = 0; s < this.samples - 1; s++) {
      for (let r = 0; r < this.radial; r++) {
        const a = s * ring + r;
        const b = a + ring;
        // Counter-clockwise seen from outside: (around) x (along) points out.
        out.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    return Uint16Array.from(out);
  }

  /** Recomputes the tube for this frame's ends. */
  update(from: Vec3, to: Vec3): void {
    this.anchor.set(from);
    this.target.set(to);
    this.kernel.hoseChain(this.anchor, this.target, this.spine, {
      restLength: this.shape.length,
      bend: this.shape.bend,
    });
    sweep(this.spine, this.samples, this.radial, this.shape.radius, this.positions, this.normals);
  }

  mesh(from: Vec3, to: Vec3): MeshData {
    this.update(from, to);
    return {
      positions: this.positions.slice(),
      normals: this.normals.slice(),
      indices: this.indices(),
      mode: 'triangles',
    };
  }
}

function sweep(
  spine: Float32Array,
  samples: number,
  radial: number,
  radius: number,
  positions: Float32Array,
  normals: Float32Array,
): void {
  const point = (s: number): Vec3 => [spine[s * 3]!, spine[s * 3 + 1]!, spine[s * 3 + 2]!];
  const tangentAt = (s: number): Vec3 => {
    const a = point(Math.max(0, s - 1));
    const b = point(Math.min(samples - 1, s + 1));
    return normalize([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [0, 1, 0]);
  };

  // First frame: any normal perpendicular to the first tangent.
  let tangent = tangentAt(0);
  let normal = normalize(
    cross(tangent, Math.abs(tangent[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]),
    [1, 0, 0],
  );
  for (let s = 0; s < samples; s++) {
    if (s > 0) {
      const next = tangentAt(s);
      // Parallel transport: remove the new tangent's component from the old normal.
      const along = dot(normal, next);
      normal = normalize(
        [normal[0] - next[0] * along, normal[1] - next[1] * along, normal[2] - next[2] * along],
        normal,
      );
      tangent = next;
    }
    const binormal = cross(tangent, normal);
    const center = point(s);
    for (let r = 0; r <= radial; r++) {
      const angle = (r / radial) * Math.PI * 2;
      const c = Math.cos(angle);
      const sn = Math.sin(angle);
      const nx = normal[0] * c + binormal[0] * sn;
      const ny = normal[1] * c + binormal[1] * sn;
      const nz = normal[2] * c + binormal[2] * sn;
      const o = (s * (radial + 1) + r) * 3;
      positions[o] = center[0] + nx * radius;
      positions[o + 1] = center[1] + ny * radius;
      positions[o + 2] = center[2] + nz * radius;
      normals[o] = nx;
      normals[o + 1] = ny;
      normals[o + 2] = nz;
    }
  }
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(v: Vec3, fallback: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  return length > 1e-9 ? [v[0] / length, v[1] / length, v[2] / length] : fallback;
}
