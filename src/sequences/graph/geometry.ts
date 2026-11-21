import { tsKernel, type GeometryKernel } from '../../lib/webgl/kernel';
import {
  createBox,
  createCylinder,
  createIcosahedron,
  createIcosahedronLines,
  createLineCube,
  createPlane,
  createTorus,
  type MeshData,
} from '../../lib/webgl/mesh';

import { emitterCapacity } from './emitter';
import { HoseTube } from './hose';
import { mulberry32 } from './random';

import type { GraphGeometry } from './types';

/** Builds a node's mesh; spheres and lathes go through the renderer's geometry kernel. */
export function buildGeometry(
  geometry: GraphGeometry,
  kernel: GeometryKernel = tsKernel,
): MeshData {
  switch (geometry.type) {
    case 'box':
      return createBox(...geometry.size);
    case 'sphere':
      return kernel.sphere(geometry.radius, geometry.lat, geometry.long);
    case 'cylinder':
      return createCylinder(geometry.radius, geometry.height, geometry.radial, geometry.caps);
    case 'torus':
      return createTorus(geometry.major, geometry.minor, geometry.majorSeg, geometry.minorSeg);
    case 'plane':
      return createPlane(geometry.width, geometry.depth, geometry.nx, geometry.nz);
    case 'icosahedron':
      return createIcosahedron(geometry.radius);
    case 'lathe':
      return kernel.lathe(geometry.profile, geometry.segments);
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
    // Dynamic geometry: the renderer rewrites these every frame; this is the first build.
    case 'field':
      return { positions: new Float32Array(geometry.count * 3), mode: 'points' };
    case 'emitter':
      return { positions: new Float32Array(emitterCapacity(geometry) * 3), mode: 'points' };
    case 'ribbon':
      return kernel.ribbon(
        typeof geometry.mix === 'number' ? geometry.mix : 0,
        geometry.uSegments,
        geometry.vSegments,
      );
    case 'hose':
      return new HoseTube(geometry, kernel).mesh([0, 0, 0], [0, -geometry.length, 0]);
  }
}
