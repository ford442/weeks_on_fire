import { describe, expect, it } from 'vitest';

import { DEFAULT_SHININESS, INSTANCE_FLOATS, INSTANCE_LAYOUT, InstanceBatch } from './instances';
import { createMat4 } from './math';

describe('InstanceBatch', () => {
  it('packs model, colour, emissive and shininess per instance', () => {
    const model = createMat4();
    model[12] = 3;
    const batch = new InstanceBatch(1).push(model, [0.1, 0.2, 0.3], [0.4, 0.5, 0.6], 9);
    const data = batch.data();
    expect(data).toHaveLength(INSTANCE_FLOATS);
    expect(data[12]).toBe(3);
    expect(Array.from(data.subarray(16))).toEqual(
      [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 9].map((v) => Math.fround(v)),
    );
  });

  it('defaults to no glow and the engine shininess', () => {
    const batch = new InstanceBatch().push(createMat4(), [1, 1, 1]);
    expect(batch.emissive(0)).toEqual([0, 0, 0]);
    expect(batch.shininess(0)).toBe(DEFAULT_SHININESS);
  });

  it('grows past its initial capacity and keeps earlier instances', () => {
    const batch = new InstanceBatch(1);
    for (let i = 0; i < 5; i++) batch.push(createMat4(), [i, 0, 0]);
    expect(batch.count).toBe(5);
    expect(batch.color(0)).toEqual([0, 0, 0]);
    expect(batch.color(4)).toEqual([4, 0, 0]);
    expect(batch.data()).toHaveLength(5 * INSTANCE_FLOATS);
  });

  it('reads back what it was given, for the one-draw-per-instance fallback', () => {
    const model = createMat4();
    model[0] = 2;
    const batch = new InstanceBatch().push(createMat4(), [0, 0, 0]).push(model, [0, 1, 0]);
    expect(batch.model(1)[0]).toBe(2);
    expect(batch.model(1)).toHaveLength(16);
    batch.clear();
    expect(batch.count).toBe(0);
    expect(batch.data()).toHaveLength(0);
  });

  it('lays the attributes out back to back with no overlap', () => {
    let end = 0;
    for (const [, size, offset] of INSTANCE_LAYOUT) {
      expect(offset).toBe(end);
      end = offset + size;
    }
    expect(end).toBe(INSTANCE_FLOATS);
  });
});
