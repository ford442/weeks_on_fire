import type { FilterOption } from '../lib/filterOptions';

export const allValue = 'All';

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
  /** Tailwind height class; the song list and gallery toolbars differ. */
  heightClass?: string;
}

/** A labelled "<label>: All" dropdown over a fixed, taxonomy-ordered option list. */
export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  heightClass = 'h-11',
}: FilterSelectProps) {
  const groups: Array<{ group: string | undefined; options: FilterOption[] }> = [];
  for (const option of options) {
    const last = groups[groups.length - 1];
    if (last && last.group === option.group) last.options.push(option);
    else groups.push({ group: option.group, options: [option] });
  }

  const renderOption = (option: FilterOption) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  );

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${heightClass} w-full rounded-md border border-zinc-800 bg-black/70 px-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30`}
      >
        <option value={allValue}>{label}: All</option>
        {groups.map(({ group, options: groupOptions }) =>
          group ? (
            <optgroup key={group} label={group}>
              {groupOptions.map(renderOption)}
            </optgroup>
          ) : (
            groupOptions.map(renderOption)
          ),
        )}
      </select>
    </label>
  );
}
