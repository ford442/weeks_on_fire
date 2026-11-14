import { taxonomy } from '../data/taxonomy';

export interface FilterOption {
  value: string;
  label: string;
  /** Rendered as an <optgroup> when any option in the list has one. */
  group?: string;
}

/**
 * Options in taxonomy order for the values actually present in `used`, each labelled with its
 * count. Dropdowns built this way never offer a choice that matches nothing.
 */
function withCounts(
  entries: Array<{ value: string; label: string; group?: string }>,
  used: readonly string[],
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const value of used) counts.set(value, (counts.get(value) ?? 0) + 1);
  return entries
    .filter((entry) => counts.has(entry.value))
    .map((entry) => ({
      ...entry,
      label: `${entry.label} (${counts.get(entry.value) ?? 0})`,
    }));
}

export function episodeOptions(usedIds: readonly string[]): FilterOption[] {
  return withCounts(
    taxonomy.episodes.map((entry) => ({ value: entry.id, label: entry.label, group: entry.group })),
    usedIds,
  );
}

export function genreOptions(usedGenres: readonly string[]): FilterOption[] {
  return withCounts(
    taxonomy.genres.map((genre) => ({ value: genre, label: genre })),
    usedGenres,
  );
}

export function themeOptions(usedThemes: readonly string[]): FilterOption[] {
  return withCounts(
    taxonomy.themes.map((theme) => ({ value: theme, label: theme })),
    usedThemes,
  );
}

export function toolOptions(usedTools: readonly string[]): FilterOption[] {
  return withCounts(
    taxonomy.tools.map((tool) => ({ value: tool.id, label: tool.label })),
    usedTools,
  );
}

/** The ids a URL filter may hold: anything else (a stale bookmark) falls back to "All". */
export function optionValues(options: readonly FilterOption[]): string[] {
  return options.map((option) => option.value);
}
