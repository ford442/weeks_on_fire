import type { ReactNode } from 'react';

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  /** Classes for the active state when the chip has its own color (e.g. an archive lane). */
  accentClass?: string;
  children: ReactNode;
}

/** A pressable filter pill: the one chip every list toolbar uses. */
export default function FilterChip({ active, onClick, accentClass, children }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? (accentClass ?? 'border-orange-500/60 bg-orange-500/15 text-orange-100')
          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}
