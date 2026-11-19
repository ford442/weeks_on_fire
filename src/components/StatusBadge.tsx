import { productionStatusMeta, type ProductionStatus } from '../lib/status';

/** The hub-wide production status pill. Same label and color on every tab. */
export default function StatusBadge({
  status,
  size = 'sm',
}: {
  status: ProductionStatus;
  size?: 'xs' | 'sm';
}) {
  const meta = productionStatusMeta[status];
  const sizing = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      title={meta.description}
      className={`inline-flex shrink-0 items-center rounded-md border font-semibold ${sizing} ${meta.accent}`}
    >
      {meta.label}
    </span>
  );
}
