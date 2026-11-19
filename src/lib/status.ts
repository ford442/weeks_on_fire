import { PRODUCTION_STATUSES } from '../../scripts/content-index/statuses';

import type { ProductionStatus } from '../../scripts/content-index/schemas';
import type { FilterOption } from './filterOptions';

export { PRODUCTION_STATUSES };
export type { ProductionStatus };

/**
 * The one status vocabulary for the hub. Every tab (Visual Archive, Suggestions, Timeline,
 * Songs, Finalized) labels and colors a stage from here, so a "Final" badge looks the same
 * wherever it appears. Type — scene, song, image, video, character — is never encoded here.
 */
export const productionStatusMeta: Record<
  ProductionStatus,
  { label: string; description: string; accent: string }
> = {
  suggested: {
    label: 'Suggested',
    description: 'An idea on the board. Nothing generated yet.',
    accent: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-200',
  },
  'ready-to-generate': {
    label: 'Ready to generate',
    description: 'Prompt locked; waiting for a generation pass.',
    accent: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
  },
  generated: {
    label: 'Generated',
    description: 'A take exists. Not reviewed yet.',
    accent: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  },
  'in-edit': {
    label: 'In edit',
    description: 'Being cut, timed or re-rolled.',
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  },
  approved: {
    label: 'Approved',
    description: 'Signed off for the show.',
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  },
  final: {
    label: 'Final',
    description: 'Locked. This is the one.',
    accent: 'border-orange-500/50 bg-orange-500/15 text-orange-100',
  },
};

/** Stages the Finalized hub collects. */
export const FINALIZED_STATUSES: readonly ProductionStatus[] = ['approved', 'final'];

export function isFinalized(status: ProductionStatus): boolean {
  return FINALIZED_STATUSES.includes(status);
}

/** `FilterSelect` options in pipeline order, with optional per-status counts. */
export function statusOptions(counts?: Partial<Record<ProductionStatus, number>>): FilterOption[] {
  return PRODUCTION_STATUSES.map((status) => ({
    value: status,
    label:
      counts === undefined
        ? productionStatusMeta[status].label
        : `${productionStatusMeta[status].label} (${counts[status] ?? 0})`,
  }));
}

export function countByStatus(items: readonly { status: ProductionStatus }[]) {
  const counts: Partial<Record<ProductionStatus, number>> = {};
  for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;
  return counts;
}
