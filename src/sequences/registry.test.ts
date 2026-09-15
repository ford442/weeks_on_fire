import { describe, expect, it } from 'vitest';

import { sequences } from '../data/sequences';
import { createSequenceScene, sequenceRendererIds } from './registry';

describe('sequence renderers', () => {
  it('covers every catalog sequence', () => {
    for (const sequence of sequences) {
      expect(sequenceRendererIds).toContain(sequence.id);
      expect(createSequenceScene(sequence.id)).toBeDefined();
    }
  });

  it('keeps every catalog duration between 10 and 120 seconds', () => {
    expect(sequences).toHaveLength(5);
    for (const sequence of sequences) {
      expect(sequence.durationSec).toBeGreaterThanOrEqual(10);
      expect(sequence.durationSec).toBeLessThanOrEqual(120);
    }
  });
});
