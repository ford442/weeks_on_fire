import { describe, expect, it } from 'vitest';

import { sequences } from '../data/sequences';
import { customRendererIds, createSequenceScene } from './registry';

describe('sequence renderers', () => {
  it('gives every catalog sequence a graph or a registered custom factory', () => {
    for (const sequence of sequences) {
      if (sequence.renderer === 'graph') {
        expect(sequence.graph, sequence.id).toBeDefined();
        expect(customRendererIds, sequence.id).not.toContain(sequence.id);
      } else {
        expect(sequence.graph, sequence.id).toBeUndefined();
        expect(customRendererIds, sequence.id).toContain(sequence.id);
      }
      expect(createSequenceScene(sequence.id), sequence.id).toBeDefined();
    }
  });

  it('has no factory without a catalog record', () => {
    const ids = new Set(sequences.map((sequence) => sequence.id));
    for (const id of customRendererIds) expect(ids.has(id), id).toBe(true);
  });

  it('keeps at least one graph-only and one custom sequence shipped', () => {
    expect(sequences.some((sequence) => sequence.renderer === 'graph')).toBe(true);
    expect(sequences.some((sequence) => sequence.renderer === 'custom')).toBe(true);
  });

  it('keeps every catalog duration between 10 and 120 seconds', () => {
    for (const sequence of sequences) {
      expect(sequence.durationSec).toBeGreaterThanOrEqual(10);
      expect(sequence.durationSec).toBeLessThanOrEqual(120);
    }
  });

  it('tags the fast-motion kick pack', () => {
    const pack = ['kick-lattice', 'spoon-whip', 'tunnel-smash', 'hose-chase'];
    for (const id of pack) {
      const sequence = sequences.find((entry) => entry.id === id);
      expect(sequence).toBeDefined();
      expect(sequence?.tags).toContain('fast-motion');
    }
  });
});
