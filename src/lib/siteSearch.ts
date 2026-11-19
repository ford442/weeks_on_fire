// Hub-wide search: MiniSearch over the slim documents codegen writes to
// `data/generated/search-index.ts` (titles, tags, summaries, linked character names — no lyrics or
// prompts). Only the lazily loaded search overlay and `/show/search` import this module, so neither
// MiniSearch nor the corpus ships in the main chunk; `scripts/check-bundle-size.ts` enforces it.
import MiniSearch from 'minisearch';

import { searchDocuments } from '../data/generated/search-index';

import type { SearchDocType, SearchDocument } from '../data/generated/search-index';

export type { SearchDocType, SearchDocument };

/** Badge text per result type, in the order the search page lists its filters. */
export const SEARCH_TYPE_LABELS: Record<SearchDocType, string> = {
  song: 'Song',
  cutaway: 'Suggestion',
  scene: 'Scene',
  still: 'Still',
  episode: 'Episode',
  character: 'Character',
  cartoon: 'Cartoon',
  sequence: '3D sequence',
  crew: 'Crew',
};

export const SEARCH_TYPES = Object.keys(SEARCH_TYPE_LABELS) as SearchDocType[];

export interface SearchHit extends SearchDocument {
  score: number;
}

export interface SearchOptions {
  /** Defaults to 40. */
  limit?: number;
  /** Only this type. */
  type?: SearchDocType;
}

export interface HubSearch {
  search(query: string, options?: SearchOptions): SearchHit[];
  /** Hits per type for `query`, ignoring any type filter. */
  countByType(query: string): Partial<Record<SearchDocType, number>>;
}

/** Lowercase and drop diacritics, so "mobius" finds Möbius Chrome. */
function normalizeTerm(term: string): string {
  return term
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Every term must match (AND). Terms of two letters or more also match as a prefix ("marb" →
 * marble); terms of five or more tolerate a typo. Title hits outrank cast, tag and summary hits.
 */
export function createHubSearch(documents: readonly SearchDocument[] = searchDocuments): HubSearch {
  const engine = new MiniSearch<SearchDocument>({
    fields: ['title', 'subtitle', 'tags', 'characters', 'summary'],
    processTerm: normalizeTerm,
    searchOptions: {
      boost: { title: 4, characters: 2, tags: 1.5, subtitle: 1.2 },
      prefix: (term) => term.length >= 2,
      fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
      combineWith: 'AND',
    },
  });
  engine.addAll(documents);
  const byId = new Map(documents.map((document) => [document.id, document]));

  const run = (query: string, type?: SearchDocType): SearchHit[] => {
    if (!query.trim()) return [];
    return engine
      .search(query, type ? { filter: (result) => byId.get(String(result.id))?.type === type } : {})
      .flatMap((result) => {
        const document = byId.get(String(result.id));
        return document ? [{ ...document, score: result.score }] : [];
      });
  };

  return {
    search: (query, { limit = 40, type } = {}) => run(query, type).slice(0, limit),
    countByType: (query) => {
      const counts: Partial<Record<SearchDocType, number>> = {};
      for (const hit of run(query)) counts[hit.type] = (counts[hit.type] ?? 0) + 1;
      return counts;
    },
  };
}

let shared: HubSearch | undefined;

/** One index per page load, built on first use (a few hundred documents, a few milliseconds). */
export function hubSearch(): HubSearch {
  shared ??= createHubSearch();
  return shared;
}
