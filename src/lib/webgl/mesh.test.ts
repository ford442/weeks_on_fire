import { describe, expect, it } from 'vitest';

import {
  MAX_INDEX,
  createBox,
  createCylinder,
  createIcosahedron,
  createLathe,
  createPlane,
  createRibbon,
  createSphere,
  createTorus,
  finalizeMesh,
} from './mesh';

function maxIndex(indices: Uint16Array | undefined): number {
  let max = 0;
  for (const index of indices ?? []) if (index > max) max = index;
  return max;
}

describe('16-bit index ceiling', () => {
  it('throws instead of wrapping when a grid has more than 65536 vertices', () => {
    // 257 x 257 = 66049 vertices; the last slot (66048) would wrap through a Uint16Array.
    expect(() => createPlane(10, 10, 256, 256)).toThrow(RangeError);
    expect(() => createPlane(10, 10, 256, 256)).toThrow(/"plane".*66049 vertices/);
  });

  it('names the geometry that overflowed', () => {
    expect(() => createSphere(1, 300, 300)).toThrow(/"sphere"/);
    expect(() => createTorus(2, 0.5, 300, 300)).toThrow(/"torus"/);
    expect(() => createCylinder(1, 1, 40000)).toThrow(/"cylinder"/);
    expect(() => createRibbon(0.5, 400, 200)).toThrow(/"ribbon"/);
    const profile = Array.from({ length: 3000 }, (_, i): [number, number] => [1, i]);
    expect(() => createLathe(profile, 40)).toThrow(/"lathe"/);
  });

  it('accepts a mesh that uses every slot up to exactly 65535', () => {
    // 256 x 256 = 65536 vertices, slots 0..65535.
    const mesh = createPlane(10, 10, 255, 255);
    expect(mesh.positions.length / 3).toBe(MAX_INDEX + 1);
    expect(maxIndex(mesh.indices)).toBe(MAX_INDEX);
  });

  it('rejects a single index above the ceiling even when the vertex count is small', () => {
    expect(() =>
      finalizeMesh('wild', {
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
        indices: [0, 1, MAX_INDEX + 1],
        mode: 'triangles',
      }),
    ).toThrow(/"wild".*index 65536 at position 2/);
  });

  it('rejects indices that a Uint16Array would silently coerce', () => {
    const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
    for (const bad of [-1, 1.5, Number.NaN]) {
      expect(() =>
        finalizeMesh('coerced', { positions, indices: [0, 1, bad], mode: 'triangles' }),
      ).toThrow(/"coerced"/);
    }
  });

  it('does not limit non-indexed meshes, which draw with drawArrays', () => {
    const count = MAX_INDEX + 10;
    const mesh = finalizeMesh('cloud', {
      positions: new Array<number>(count * 3).fill(0),
      mode: 'points',
    });
    expect(mesh.positions.length / 3).toBe(count);
    expect(mesh.indices).toBeUndefined();
  });

  it('keeps every default builder safely under the ceiling', () => {
    const builders = [
      createBox(1, 1, 1),
      createSphere(1),
      createCylinder(1, 1),
      createTorus(1, 0.3),
      createPlane(4, 4, 8, 8),
      createIcosahedron(1),
      createRibbon(0.5),
      createLathe(
        [
          [0.5, 0],
          [0.8, 1],
          [0.4, 2],
        ],
        24,
      ),
    ];
    for (const mesh of builders) {
      expect(mesh.positions.length / 3).toBeLessThanOrEqual(MAX_INDEX + 1);
      expect(maxIndex(mesh.indices)).toBeLessThanOrEqual(MAX_INDEX);
    }
  });

  it('only attaches the attributes a builder provided', () => {
    const box = createBox(1, 1, 1);
    expect(box.normals).toBeInstanceOf(Float32Array);
    expect(box.colors).toBeUndefined();
    expect(createPlane(1, 1, 2, 2).colors).toBeInstanceOf(Float32Array);
  });
});
