import { clip, firstSentence } from './route-table';

/**
 * The Overview "What's new" strip, chosen at codegen time so the landing chunk imports a few
 * dozen slim records instead of every lyric and segment prompt (see `emitWhatsNewModule`).
 */
export type WhatsNewKind = 'song' | 'suggestion' | 'cartoon' | 'sequence' | 'video' | 'image';

export interface WhatsNewItem {
  kind: WhatsNewKind;
  id: string;
  title: string;
  /** One short sentence, clipped for a card. */
  blurb: string;
  /** YYYY-MM-DD. */
  added: string;
  /** Repo-relative still, resolved to a bundler import by the emitter. */
  imagePath?: string;
  /** Songs only: an mp3 is linked, so the track can be played. */
  audio?: boolean;
}

export interface WhatsNewSources {
  songs: ReadonlyArray<{
    id: string;
    title: string;
    added: string;
    description: string;
    audioFile: string | null;
  }>;
  cutaways: ReadonlyArray<{ id: string; title: string; added?: string; summary: string }>;
  cartoons: ReadonlyArray<{
    id: string;
    title: string;
    added?: string;
    premise: string;
    stillImagePath?: string;
  }>;
  sequences: ReadonlyArray<{
    id: string;
    title: string;
    added?: string;
    premise: string;
    stillImagePath?: string;
  }>;
  gallery: ReadonlyArray<{
    id: string;
    title: string;
    added?: string;
    description: string;
    mediaType: 'image' | 'video';
    imagePath?: string;
  }>;
}

export const WHATS_NEW_PER_KIND = 2;
export const WHATS_NEW_LIMIT = 12;
export const BLURB_MAX = 120;

/** Display order when two items share a day. */
const kindOrder: readonly WhatsNewKind[] = [
  'song',
  'suggestion',
  'video',
  'sequence',
  'cartoon',
  'image',
];

const blurb = (text: string) => clip(firstSentence(text), BLURB_MAX);

/** Every record that carries a date, as one flat list. Undated records are not "new" to anyone. */
export function collectWhatsNew(sources: WhatsNewSources): WhatsNewItem[] {
  const items: WhatsNewItem[] = [];
  const add = (item: Omit<WhatsNewItem, 'added'> & { added: string | undefined }) => {
    if (item.added) items.push({ ...item, added: item.added });
  };

  for (const song of sources.songs) {
    add({
      kind: 'song',
      id: song.id,
      title: song.title,
      blurb: blurb(song.description),
      added: song.added,
      ...(song.audioFile ? { audio: true } : {}),
    });
  }
  for (const cutaway of sources.cutaways) {
    add({
      kind: 'suggestion',
      id: cutaway.id,
      title: cutaway.title,
      blurb: blurb(cutaway.summary),
      added: cutaway.added,
    });
  }
  for (const cartoon of sources.cartoons) {
    add({
      kind: 'cartoon',
      id: cartoon.id,
      title: cartoon.title,
      blurb: blurb(cartoon.premise),
      added: cartoon.added,
      ...(cartoon.stillImagePath ? { imagePath: cartoon.stillImagePath } : {}),
    });
  }
  for (const sequence of sources.sequences) {
    add({
      kind: 'sequence',
      id: sequence.id,
      title: sequence.title,
      blurb: blurb(sequence.premise),
      added: sequence.added,
      ...(sequence.stillImagePath ? { imagePath: sequence.stillImagePath } : {}),
    });
  }
  for (const scene of sources.gallery) {
    add({
      kind: scene.mediaType === 'video' ? 'video' : 'image',
      id: scene.id,
      title: scene.title,
      blurb: blurb(scene.description),
      added: scene.added,
      ...(scene.imagePath ? { imagePath: scene.imagePath } : {}),
    });
  }
  return items;
}

function newestFirst(a: WhatsNewItem, b: WhatsNewItem): number {
  return (
    b.added.localeCompare(a.added) ||
    kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) ||
    a.id.localeCompare(b.id)
  );
}

/**
 * The newest `perKind` records of each kind, merged newest first and cut to `limit`. The per-kind
 * cap keeps one busy day of songs from crowding out the stills and video.
 */
export function pickWhatsNew(
  items: readonly WhatsNewItem[],
  { perKind = WHATS_NEW_PER_KIND, limit = WHATS_NEW_LIMIT } = {},
): WhatsNewItem[] {
  const sorted = [...items].sort(newestFirst);
  const taken = new Map<WhatsNewKind, number>();
  const picked: WhatsNewItem[] = [];
  for (const item of sorted) {
    const count = taken.get(item.kind) ?? 0;
    if (count >= perKind) continue;
    taken.set(item.kind, count + 1);
    picked.push(item);
  }
  return picked.slice(0, limit);
}

export function buildWhatsNew(sources: WhatsNewSources): WhatsNewItem[] {
  return pickWhatsNew(collectWhatsNew(sources));
}
