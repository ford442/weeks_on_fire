import { loadCartoons, loadCutaways, loadEpisodes, loadSequences, loadSongs } from './load';
import { SITE_BASE, siteViews } from './views';

/**
 * One row per crawlable hub URL. Feeds `emit-route-html.ts` (per-route `<head>`),
 * sitemap.xml and llms.txt, so the three outputs cannot drift.
 *
 * Reads `content/` through `load.ts`, not `src/data/generated/` (whose `.jpg`
 * imports do not resolve under tsx).
 */
export interface RouteEntry {
  /** Router path under the site base, always with a trailing slash: `/show/songs/x/`. */
  path: string;
  kind: 'view' | 'song' | 'episode' | 'cartoon' | 'sequence' | 'suggestion';
  title: string;
  description: string;
  /** Absolute URL, trailing slash (what Pages serves with a 200). */
  canonical: string;
  ogImage: string;
  ogImageAlt: string;
  ogType: 'website' | 'music.song' | 'video.episode' | 'video.other';
  /** Index routes only: nav label and the longer view summary used by llms.txt. */
  label?: string;
  summary?: string;
}

export const BRAND = 'Weeks on Fire';
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 145;
export const DEFAULT_OG_IMAGE = `${SITE_BASE}/og-image.webp`;
export const DEFAULT_OG_IMAGE_ALT = 'Weeks on Fire character reference still';

/** One-breath format descriptions for index routes. Deadpan, no toolchain. */
const viewCopy: Record<string, { title: string; description: string }> = {
  gallery: {
    title: `${BRAND} — nearly silent comedy`,
    description:
      'Nearly silent comedy. Deadpan characters, a loud world, and the picture changes when the music drops.',
  },
  timeline: {
    title: `Production Timeline — ${BRAND}`,
    description: 'Every scene, in order, with its status. Some of them are finished.',
  },
  songs: {
    title: `Songs — ${BRAND}`,
    description:
      'The soundtrack. Torch songs, thrash, lounge and worse, each written to a picture. Sound on.',
  },
  'daisy-bell': {
    title: `Daisy Bell cutaway — ${BRAND}`,
    description:
      'Two women on a flower bicycle ride into old London. The film stock objects. Sound on.',
  },
  suggestions: {
    title: `Cutaways — ${BRAND}`,
    description:
      'Cutaways, one-panel gags and scenes waiting their turn. Each one is timed to the second.',
  },
  cartoons: {
    title: `Cartoons — ${BRAND}`,
    description: 'Six-second cartoons. Something small goes wrong, then larger. Sound on.',
  },
  sequences: {
    title: `3D Sequences — ${BRAND}`,
    description:
      'Short 3D pieces that play right in the page. Ten seconds to two minutes. Nothing explodes. Mostly.',
  },
  characters: {
    title: `Characters — ${BRAND}`,
    description: 'The recurring cast. They do not speak much, and they are not impressed.',
  },
  episodes: {
    title: `Episodes — ${BRAND}`,
    description: 'Every episode, its runtime and its logline. Almost no dialogue. Sound on.',
  },
  crew: {
    title: `Crew — ${BRAND}`,
    description: 'The people who make the show. Bios, quotes, and credits nobody asked for.',
  },
};

/** `/show/songs` → `/show/songs/`. */
export function routePath(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

export function routeUrl(path: string): string {
  return `${SITE_BASE}${routePath(path)}`;
}

/** Collapse whitespace and cut at a word boundary, adding an ellipsis. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.—–-]+$/, '')}…`;
}

/** First sentence of a blurb (the setup, not the punchline). */
export function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const match = /^.+?[.!?](?=\s|$)/.exec(flat);
  return match ? match[0] : flat;
}

function withPeriod(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/** Description = body (clipped to fit) + fixed tail. The tail always survives. */
function describe(body: string, tail: string): string {
  const room = DESCRIPTION_MAX - tail.length - 1;
  return `${withPeriod(clip(body, room))} ${tail}`.trim();
}

/** `{specific} {suffix} — Weeks on Fire`, clipping only the specific part. */
function titled(specific: string, suffix = ''): string {
  const tail = `${suffix ? ` ${suffix}` : ''} — ${BRAND}`;
  return `${clip(specific, TITLE_MAX - tail.length)}${tail}`;
}

/** `~6-8 seconds` → `6–8s`; `~7 seconds` → `7s`. Undefined when unparseable. */
export function shortSeconds(runtime: string | undefined): string | undefined {
  if (!runtime) return undefined;
  const match = /(\d+)\s*(?:[-–]\s*(\d+))?\s*s(?:ec|econds?)?\b/i.exec(runtime);
  if (!match) return undefined;
  return match[2] ? `${match[1]}–${match[2]}s` : `${match[1]}s`;
}

function entry(
  fields: Omit<RouteEntry, 'canonical' | 'ogImage' | 'ogImageAlt'> &
    Partial<Pick<RouteEntry, 'ogImage' | 'ogImageAlt'>>,
): RouteEntry {
  const path = routePath(fields.path);
  return {
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    ...fields,
    path,
    canonical: routeUrl(path),
  };
}

export function buildRouteTable(repoRoot: string): RouteEntry[] {
  const views = siteViews.map((view) => {
    const copy = viewCopy[view.id];
    if (!copy) throw new Error(`route-table: no head copy for view "${view.id}"`);
    return entry({
      path: view.path,
      kind: 'view',
      ogType: 'website',
      label: view.label,
      summary: view.description,
      ...copy,
    });
  });

  const viewPath = (id: string) => {
    const view = siteViews.find((v) => v.id === id);
    if (!view) throw new Error(`route-table: unknown view "${id}"`);
    return view.path;
  };

  const songs = loadSongs(repoRoot).map((song) =>
    entry({
      path: `${viewPath('songs')}/${song.id}`,
      kind: 'song',
      ogType: 'music.song',
      title: titled(song.title),
      description: describe(
        `${song.subgenre ?? song.genre}. ${withPeriod(firstSentence(song.description))}`,
        'Original track from Weeks on Fire. Sound on.',
      ),
    }),
  );

  const episodes = loadEpisodes(repoRoot).map((episode) =>
    entry({
      path: `${viewPath('episodes')}/${episode.id}`,
      kind: 'episode',
      ogType: 'video.episode',
      title: titled(episode.title, `(Ep. ${episode.number})`),
      description: describe(
        `${episode.runtime ? `${episode.runtime}, almost no dialogue. ` : 'Almost no dialogue. '}${episode.logline}`,
        'Sound on.',
      ),
    }),
  );

  const cartoons = loadCartoons(repoRoot).map((cartoon) => {
    const seconds = shortSeconds(cartoon.runtime);
    return entry({
      path: `${viewPath('cartoons')}/${cartoon.id}`,
      kind: 'cartoon',
      ogType: 'video.other',
      title: titled(cartoon.title, seconds ? `(${seconds})` : ''),
      description: describe(firstSentence(cartoon.premise), 'Sound on.'),
    });
  });

  const sequences = loadSequences(repoRoot).map((sequence) =>
    entry({
      path: `${viewPath('sequences')}/${sequence.id}`,
      kind: 'sequence',
      ogType: 'video.other',
      title: titled(sequence.title, `(${sequence.durationSec}s)`),
      description: describe(firstSentence(sequence.premise), 'Plays in the page.'),
    }),
  );

  const suggestions = loadCutaways(repoRoot).map((cutaway) =>
    entry({
      path: `${viewPath('suggestions')}/${cutaway.id}`,
      kind: 'suggestion',
      ogType: 'website',
      title: titled(cutaway.title, '(cutaway)'),
      description: describe(cutaway.summary, 'A cutaway from Weeks on Fire.'),
    }),
  );

  return [...views, ...songs, ...episodes, ...cartoons, ...sequences, ...suggestions];
}
