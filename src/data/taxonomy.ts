import { taxonomy } from './generated/taxonomy';

import type { TaxonomyEpisode } from './types';

export type { Taxonomy, TaxonomyEpisode, TaxonomyTool } from './types';

/** Episode ids, genres, themes and tools come only from `content/taxonomy.json`. */
export { taxonomy };

const episodesById = new Map<string, TaxonomyEpisode>(
  taxonomy.episodes.map((entry) => [entry.id, entry]),
);
const toolsById = new Map(taxonomy.tools.map((entry) => [entry.id, entry.label]));

export const genres: readonly string[] = taxonomy.genres;
export const themes: readonly string[] = taxonomy.themes;

/** Display label for a canonical episode id. Codegen guarantees every catalog id resolves. */
export function episodeLabel(id: string): string {
  return episodesById.get(id)?.label ?? id;
}

export function episodeGroup(id: string): string | undefined {
  return episodesById.get(id)?.group;
}

export function toolLabel(id: string): string {
  return toolsById.get(id) ?? id;
}

/** "Episode 3 · Skeleton Union Break": the canonical label plus optional placement detail. */
export function episodeWithSlot(id: string, slot?: string): string {
  return slot ? `${episodeLabel(id)} · ${slot}` : episodeLabel(id);
}
