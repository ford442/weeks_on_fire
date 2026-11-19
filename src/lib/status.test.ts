import { describe, expect, it } from 'vitest';

import {
  countByStatus,
  isFinalized,
  PRODUCTION_STATUSES,
  productionStatusMeta,
  statusOptions,
} from './status';

describe('production status', () => {
  it('defines one label and accent for every stage, in pipeline order', () => {
    expect(PRODUCTION_STATUSES).toEqual([
      'suggested',
      'ready-to-generate',
      'generated',
      'in-edit',
      'approved',
      'final',
    ]);
    for (const status of PRODUCTION_STATUSES) {
      expect(productionStatusMeta[status].label).not.toBe('');
      expect(productionStatusMeta[status].accent).not.toBe('');
    }
  });

  it('treats only Approved and Final as finalized', () => {
    expect(PRODUCTION_STATUSES.filter(isFinalized)).toEqual(['approved', 'final']);
  });

  it('builds counted filter options', () => {
    const counts = countByStatus([
      { status: 'final' },
      { status: 'final' },
      { status: 'generated' },
    ]);
    expect(counts).toEqual({ final: 2, generated: 1 });
    const options = statusOptions(counts);
    expect(options.find((o) => o.value === 'final')?.label).toBe('Final (2)');
    expect(options.find((o) => o.value === 'suggested')?.label).toBe('Suggested (0)');
  });
});
