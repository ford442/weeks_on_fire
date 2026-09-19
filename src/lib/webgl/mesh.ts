import { vec3Cross, vec3Normalize, type Vec3 } from './math';

export type MeshMode = 'triangles' | 'lines' | 'points';

export interface MeshData {
  positions: Float32Array;
  normals?: Float32Array;
  colors?: Float32Array;
  indices?: Uint16Array;
  mode: MeshMode;
}

function pushV(target: number[], v: Vec3): void {
  target.push(v[0], v[1], v[2]);
}

export function createBox(sx: number, sy: number, sz: number): MeshData {
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const faces: Array<{ n: Vec3; q: Vec3[] }> = [
    {
      n: [0, 0, 1],
      q: [
        [-hx, -hy, hz],
        [hx, -hy, hz],
        [hx, hy, hz],
        [-hx, hy, hz],
      ],
    },
    {
      n: [0, 0, -1],
      q: [
        [hx, -hy, -hz],
        [-hx, -hy, -hz],
        [-hx, hy, -hz],
        [hx, hy, -hz],
      ],
    },
    {
      n: [0, 1, 0],
      q: [
        [-hx, hy, hz],
        [hx, hy, hz],
        [hx, hy, -hz],
        [-hx, hy, -hz],
      ],
    },
    {
      n: [0, -1, 0],
      q: [
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        [hx, -hy, hz],
        [-hx, -hy, hz],
      ],
    },
    {
      n: [1, 0, 0],
      q: [
        [hx, -hy, hz],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        [hx, hy, hz],
      ],
    },
    {
      n: [-1, 0, 0],
      q: [
        [-hx, -hy, -hz],
        [-hx, -hy, hz],
        [-hx, hy, hz],
        [-hx, hy, -hz],
      ],
    },
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  faces.forEach((face, faceIndex) => {
    const base = faceIndex * 4;
    for (const p of face.q) {
      pushV(positions, p);
      pushV(normals, face.n);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createLineCube(size: number): MeshData {
  const h = size / 2;
  const corners: Vec3[] = [
    [-h, -h, -h],
    [h, -h, -h],
    [h, h, -h],
    [-h, h, -h],
    [-h, -h, h],
    [h, -h, h],
    [h, h, h],
    [-h, h, h],
  ];
  const edges: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const positions: number[] = [];
  for (const [a, b] of edges) {
    const pa = corners[a];
    const pb = corners[b];
    if (!pa || !pb) continue;
    pushV(positions, pa);
    pushV(positions, pb);
  }
  return { positions: new Float32Array(positions), mode: 'lines' };
}

export function createSphere(radius: number, latBands = 16, longBands = 24): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= latBands; lat++) {
    const theta = (lat * Math.PI) / latBands;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    for (let lon = 0; lon <= longBands; lon++) {
      const phi = (lon * 2 * Math.PI) / longBands;
      const x = sinT * Math.cos(phi);
      const y = cosT;
      const z = sinT * Math.sin(phi);
      positions.push(x * radius, y * radius, z * radius);
      normals.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < longBands; lon++) {
      const first = lat * (longBands + 1) + lon;
      const second = first + longBands + 1;
      indices.push(first, second, first + 1, second, second + 1, first + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createCylinder(
  radius: number,
  height: number,
  radial = 20,
  includeCaps = true,
): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const hy = height / 2;

  for (let i = 0; i <= radial; i++) {
    const a = (i / radial) * Math.PI * 2;
    const x = Math.cos(a);
    const z = Math.sin(a);
    positions.push(x * radius, -hy, z * radius);
    normals.push(x, 0, z);
    positions.push(x * radius, hy, z * radius);
    normals.push(x, 0, z);
  }

  for (let i = 0; i < radial; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  if (includeCaps) {
    const start = positions.length / 3;
    positions.push(0, hy, 0);
    normals.push(0, 1, 0);
    positions.push(0, -hy, 0);
    normals.push(0, -1, 0);
    const topCenter = start;
    const botCenter = start + 1;
    for (let i = 0; i <= radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const top = positions.length / 3;
      positions.push(x, hy, z);
      normals.push(0, 1, 0);
      const bot = positions.length / 3;
      positions.push(x, -hy, z);
      normals.push(0, -1, 0);
      if (i > 0) {
        indices.push(topCenter, top - 2, top);
        indices.push(botCenter, bot, bot - 2);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createTorus(major: number, minor: number, majorSeg = 40, minorSeg = 16): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= majorSeg; i++) {
    const u = (i / majorSeg) * Math.PI * 2;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    for (let j = 0; j <= minorSeg; j++) {
      const v = (j / minorSeg) * Math.PI * 2;
      const cv = Math.cos(v);
      const sv = Math.sin(v);
      const x = (major + minor * cv) * cu;
      const y = minor * sv;
      const z = (major + minor * cv) * su;
      positions.push(x, y, z);
      normals.push(cv * cu, sv, cv * su);
    }
  }

  for (let i = 0; i < majorSeg; i++) {
    for (let j = 0; j < minorSeg; j++) {
      const a = i * (minorSeg + 1) + j;
      const b = a + minorSeg + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createPlane(width: number, depth: number, nx = 1, nz = 1): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const hw = width / 2;
  const hd = depth / 2;

  for (let z = 0; z <= nz; z++) {
    for (let x = 0; x <= nx; x++) {
      const px = -hw + (x / nx) * width;
      const pz = -hd + (z / nz) * depth;
      positions.push(px, 0, pz);
      normals.push(0, 1, 0);
      const checker = (x + z) % 2 === 0;
      if (checker) colors.push(0.22, 0.2, 0.18);
      else colors.push(0.32, 0.28, 0.24);
    }
  }

  for (let z = 0; z < nz; z++) {
    for (let x = 0; x < nx; x++) {
      const a = z * (nx + 1) + x;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createIcosahedron(radius: number): MeshData {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: Vec3[] = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ];
  const raw: Vec3[] = verts.map((v) => {
    const n = vec3Normalize(v);
    return [n[0] * radius, n[1] * radius, n[2] * radius];
  });

  const faces: Array<[number, number, number]> = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  faces.forEach((face, i) => {
    const a = raw[face[0]];
    const b = raw[face[1]];
    const c = raw[face[2]];
    if (!a || !b || !c) return;
    const n = vec3Normalize(
      vec3Cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]),
    );
    pushV(positions, a);
    pushV(positions, b);
    pushV(positions, c);
    pushV(normals, n);
    pushV(normals, n);
    pushV(normals, n);
    const base = i * 3;
    indices.push(base, base + 1, base + 2);
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createIcosahedronLines(radius: number): MeshData {
  const solid = createIcosahedron(radius);
  return toLineMesh(solid);
}

export function toLineMesh(mesh: MeshData): MeshData {
  const positions: number[] = [];
  const src = mesh.positions;
  const idx = mesh.indices;

  const pushEdge = (ia: number, ib: number) => {
    const ax = src[ia * 3] ?? 0;
    const ay = src[ia * 3 + 1] ?? 0;
    const az = src[ia * 3 + 2] ?? 0;
    const bx = src[ib * 3] ?? 0;
    const by = src[ib * 3 + 1] ?? 0;
    const bz = src[ib * 3 + 2] ?? 0;
    positions.push(ax, ay, az, bx, by, bz);
  };

  if (idx) {
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const a = idx[i] ?? 0;
      const b = idx[i + 1] ?? 0;
      const c = idx[i + 2] ?? 0;
      pushEdge(a, b);
      pushEdge(b, c);
      pushEdge(c, a);
    }
  } else {
    for (let i = 0; i + 8 < src.length; i += 9) {
      const a = i / 3;
      pushEdge(a, a + 1);
      pushEdge(a + 1, a + 2);
      pushEdge(a + 2, a);
    }
  }

  return { positions: new Float32Array(positions), mode: 'lines' };
}

function ribbonPoint(u: number, v: number, mix: number): Vec3 {
  const w = v;
  const mx = (1 + w * 0.35 * Math.cos(u / 2)) * Math.cos(u);
  const my = w * 0.35 * Math.sin(u / 2);
  const mz = (1 + w * 0.35 * Math.cos(u / 2)) * Math.sin(u);

  const p = 2;
  const q = 3;
  const cx = Math.cos(p * u);
  const sx = Math.sin(p * u);
  const cq = Math.cos(q * u);
  const sq = Math.sin(q * u);
  const kx = (2 + cq) * cx;
  const ky = sq;
  const kz = (2 + cq) * sx;
  const tx = -p * (2 + cq) * sx;
  const ty = q * cq;
  const tz = p * (2 + cq) * cx;
  const nx = -cx * cq;
  const ny = -sq;
  const nz = -sx * cq;
  const tlen = Math.hypot(tx, ty, tz) || 1;
  const nlen = Math.hypot(nx, ny, nz) || 1;
  const bx = (ty / tlen) * (nz / nlen) - (tz / tlen) * (ny / nlen);
  const by = (tz / tlen) * (nx / nlen) - (tx / tlen) * (nz / nlen);
  const bz = (tx / tlen) * (ny / nlen) - (ty / tlen) * (nx / nlen);
  const blen = Math.hypot(bx, by, bz) || 1;
  const knx = kx + (bx / blen) * w * 0.28;
  const kny = ky + (by / blen) * w * 0.28;
  const knz = kz + (bz / blen) * w * 0.28;

  return [
    mx * (1 - mix) + knx * mix * 0.55,
    my * (1 - mix) + kny * mix * 0.55,
    mz * (1 - mix) + knz * mix * 0.55,
  ];
}

export function createRibbon(mix: number, uSeg = 90, vSeg = 10): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= uSeg; i++) {
    const u = (i / uSeg) * Math.PI * 2;
    for (let j = 0; j <= vSeg; j++) {
      const v = (j / vSeg) * 2 - 1;
      const p = ribbonPoint(u, v, mix);
      const pU = ribbonPoint(u + 0.01, v, mix);
      const pV = ribbonPoint(u, v + 0.01, mix);
      const du: Vec3 = [pU[0] - p[0], pU[1] - p[1], pU[2] - p[2]];
      const dv: Vec3 = [pV[0] - p[0], pV[1] - p[1], pV[2] - p[2]];
      const n = vec3Normalize(vec3Cross(du, dv));
      pushV(positions, p);
      pushV(normals, n);
    }
  }

  for (let i = 0; i < uSeg; i++) {
    for (let j = 0; j < vSeg; j++) {
      const a = i * (vSeg + 1) + j;
      const b = a + vSeg + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}

export function createPoints(count: number): MeshData {
  return { positions: new Float32Array(count * 3), mode: 'points' };
}

export function writePoints(
  mesh: MeshData,
  write: (index: number, set: (x: number, y: number, z: number) => void) => void,
): void {
  const pos = mesh.positions;
  const count = pos.length / 3;
  for (let i = 0; i < count; i++) {
    write(i, (x, y, z) => {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    });
  }
}

/** Surface of revolution around Y from `[radius, y]` profile pairs, ordered bottom to top. */
export function createLathe(profile: readonly [number, number][], segments = 24): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const ring = segments + 1;

  profile.forEach(([radius, y], j) => {
    const prev = profile[Math.max(j - 1, 0)] ?? [radius, y];
    const next = profile[Math.min(j + 1, profile.length - 1)] ?? [radius, y];
    const dr = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dr, dy) || 1;
    const nr = dy / len;
    const ny = -dr / len;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.cos(a);
      const z = Math.sin(a);
      positions.push(x * radius, y, z * radius);
      normals.push(x * nr, ny, z * nr);
    }
  });

  for (let j = 0; j < profile.length - 1; j++) {
    for (let i = 0; i < segments; i++) {
      const bottom = j * ring + i;
      const top = (j + 1) * ring + i;
      indices.push(bottom, top, bottom + 1, top, top + 1, bottom + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    mode: 'triangles',
  };
}
