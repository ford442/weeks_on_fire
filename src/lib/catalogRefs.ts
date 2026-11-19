// Labels and deep links for the catalog refs a Timeline scene can carry (songId, cutawayId, ...).
//
// This module deliberately reads the slim `{ id, title }` lists in `data/generated/catalog-refs.ts`
// and never `data/songs` or `data/suggestions`: those carry every lyric and segment prompt, and
// importing them here would drag hundreds of KB into the Timeline chunk. `scripts/check-bundle-size.ts`
// fails the build if that happens.
import {
  cartoonRefs,
  characterRefs,
  cutawayRefs,
  sequenceRefs,
  songRefs,
} from '../data/generated/catalog-refs';
import { viewPaths } from '../routes/paths';
import { pickCatalogRefs } from '../schemas/production';

import type { CatalogRef } from '../data/generated/catalog-refs';
import type { CatalogRefs } from '../schemas/production';

export type SingleRefKey = 'songId' | 'cutawayId' | 'sequenceId' | 'cartoonId';

export interface SingleRefField {
  key: SingleRefKey;
  /** Short noun shown next to the link, e.g. "Song". */
  label: string;
  /** Known records, A–Z by title — the picker's options. */
  options: readonly CatalogRef[];
  /** In-app route that opens the record. */
  pathFor: (id: string) => string;
}

function byTitle(refs: readonly CatalogRef[]): CatalogRef[] {
  return [...refs].sort((a, b) => a.title.localeCompare(b.title));
}

function detailPath(base: string): (id: string) => string {
  return (id) => `${base}/${encodeURIComponent(id)}`;
}

export const SINGLE_REF_FIELDS: readonly SingleRefField[] = [
  {
    key: 'songId',
    label: 'Song',
    options: byTitle(songRefs),
    pathFor: detailPath(viewPaths.songs),
  },
  {
    key: 'cutawayId',
    label: 'Cutaway',
    options: byTitle(cutawayRefs),
    // Cutaways are the Suggestions board's records.
    pathFor: detailPath(viewPaths.suggestions),
  },
  {
    key: 'sequenceId',
    label: 'Sequence',
    options: byTitle(sequenceRefs),
    pathFor: detailPath(viewPaths.sequences),
  },
  {
    key: 'cartoonId',
    label: 'Cartoon',
    options: byTitle(cartoonRefs),
    pathFor: detailPath(viewPaths.cartoons),
  },
];

export const CHARACTER_OPTIONS: readonly CatalogRef[] = byTitle(characterRefs);

/** The character's profile (`/show/characters/:id`). */
function characterPath(character: CatalogRef): string {
  return detailPath(viewPaths.characters)(character.id);
}

export interface SceneRefLink {
  /** Which field this came from; with `id` it is unique within a scene. */
  key: SingleRefKey | 'characterIds';
  label: string;
  id: string;
  /** Catalog title, or the bare id when the catalog no longer has the record. */
  title: string;
  /** Null when the id is not in the catalog (no route to send the reader to). */
  to: string | null;
}

const byId = (refs: readonly CatalogRef[]) => new Map(refs.map((ref) => [ref.id, ref]));
const characterById = byId(characterRefs);

/** The links to show for a scene (or clip) — one per ref that is set, in a fixed order. */
export function sceneRefLinks(refs: CatalogRefs): SceneRefLink[] {
  const links: SceneRefLink[] = [];

  for (const field of SINGLE_REF_FIELDS) {
    const id = refs[field.key];
    if (!id) continue;
    const record = field.options.find((option) => option.id === id);
    links.push({
      key: field.key,
      label: field.label,
      id,
      title: record?.title ?? id,
      to: record ? field.pathFor(id) : null,
    });
  }

  for (const id of refs.characterIds ?? []) {
    const record = characterById.get(id);
    links.push({
      key: 'characterIds',
      label: 'Character',
      id,
      title: record?.title ?? id,
      to: record ? characterPath(record) : null,
    });
  }

  return links;
}

/** True when both carry the same refs; unset and empty compare equal, order of keys does not matter. */
export function sameCatalogRefs(a: CatalogRefs, b: CatalogRefs): boolean {
  return JSON.stringify(pickCatalogRefs(a)) === JSON.stringify(pickCatalogRefs(b));
}

/** `options` plus `current` when the catalog no longer has it, so an edit never silently drops an id. */
export function withCurrentOption(
  options: readonly CatalogRef[],
  current: string | undefined,
): Array<CatalogRef & { missing: boolean }> {
  const known = options.map((option) => ({ ...option, missing: false }));
  if (current && !options.some((option) => option.id === current)) {
    known.push({ id: current, title: current, missing: true });
  }
  return known;
}
