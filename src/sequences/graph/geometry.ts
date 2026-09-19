import {
  createBox,
  createCylinder,
  createIcosahedron,
  createIcosahedronLines,
  createLathe,
  createLineCube,
  createPlane,
  createSphere,
  createTorus,
  type MeshData,
} from '../../lib/webgl/mesh';
import type { GraphGeometry } from './types';

/** Small deterministic PRNG so a `points` cloud looks the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildGeometry(geometry: GraphGeometry): MeshData {
  switch (geometry.type) {
    case 'box':
      return createBox(...geometry.size);
    case 'sphere':
      return createSphere(geometry.radius, geometry.lat, geometry.long);
    case 'cylinder':
      return createCylinder(geometry.radius, geometry.height, geometry.radial, geometry.caps);
    case 'torus':
      return createTorus(geometry.major, geometry.minor, geometry.majorSeg, geometry.minorSeg);
    case 'plane':
      return createPlane(geometry.width, geometry.depth, geometry.nx, geometry.nz);
    case 'icosahedron':
      return createIcosahedron(geometry.radius);
    case 'lathe':
      return createLathe(geometry.profile, geometry.segments);
    case 'lineCube':
      return createLineCube(geometry.size);
    case 'icosahedronLines':
      return createIcosahedronLines(geometry.radius);
    case 'line': {
      const pts = geometry.points;
      const positions: number[] = [];
      const segmentCount = geometry.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < segmentCount; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if (a && b) positions.push(...a, ...b);
      }
      return { positions: new Float32Array(positions), mode: 'lines' };
    }
    case 'points': {
      const rand = mulberry32(geometry.seed ?? 1);
      const [min, max] = geometry.radius;
      const flatten = geometry.flatten ?? 1;
      const positions = new Float32Array(geometry.count * 3);
      for (let i = 0; i < geometry.count; i++) {
        const cosPhi = rand() * 2 - 1;
        const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
        const theta = rand() * Math.PI * 2;
        const r = min + (max - min) * rand();
        positions[i * 3] = r * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = r * cosPhi * flatten;
        positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
      }
      return { positions, mode: 'points' };
    }
  }
}
