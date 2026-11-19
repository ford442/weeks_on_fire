import type { SiteView } from '../components/SiteHeader';

/** Creator hub. The public site owns `/`. */
export const CREW_PREFIX = '/show';

const crewRoots = [
  'finalized',
  'timeline',
  'songs',
  'daisy-bell',
  'suggestions',
  'cartoons',
  'sequences',
  'characters',
  'episodes',
  'crew',
  'search',
] as const;

export function crewPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === CREW_PREFIX || normalized.startsWith(`${CREW_PREFIX}/`)) return normalized;
  if (normalized === '/') return CREW_PREFIX;
  return `${CREW_PREFIX}${normalized}`;
}

/** Bare creator URLs from before the hub moved under `/show`. */
export function isLegacyCrewPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return crewRoots.some((root) => normalized === `/${root}` || normalized.startsWith(`/${root}/`));
}

/**
 * The hub home used to be the Visual Archive, whose filters live in the query string. A bare
 * `/show?q=…` is therefore an archive link; the Overview takes no parameters.
 */
export function isLegacyArchiveLink(pathname: string, search: string): boolean {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized === CREW_PREFIX && search.length > 1;
}

/**
 * Daisy Bell had a top-level tab before scenes shared one template. Returns where an old
 * `/show/daisy-bell` link now lives, or null for any other path.
 */
export function legacySceneRedirect(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized === crewPath('/daisy-bell') ? crewPath('/scenes/daisy-bell') : null;
}

export const viewPaths: Record<SiteView, string> = {
  overview: crewPath('/'),
  finalized: crewPath('/finalized'),
  gallery: crewPath('/archive'),
  video: crewPath('/video'),
  timeline: crewPath('/timeline'),
  songs: crewPath('/songs'),
  scenes: crewPath('/scenes'),
  suggestions: crewPath('/suggestions'),
  cartoons: crewPath('/cartoons'),
  sequences: crewPath('/sequences'),
  characters: crewPath('/characters'),
  episodes: crewPath('/episodes'),
  crew: crewPath('/crew'),
  search: crewPath('/search'),
};

/** `/show/search?q=…` — the full results page for a query (blank query → the bare page). */
export function searchPath(query: string): string {
  const q = query.trim();
  return q ? `${viewPaths.search}?${new URLSearchParams({ q }).toString()}` : viewPaths.search;
}

/** `/show/suggestions/<id>` — a cutaway's board, and where it sits in the schedule. */
export function suggestionPath(id: string): string {
  return crewPath(`/suggestions/${id}`);
}

/** `/show/episodes/<id>` — an episode's page in the Episode Bible. */
export function episodePath(id: string): string {
  return crewPath(`/episodes/${id}`);
}

export function pathnameToView(pathname: string): SiteView {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const bare =
    normalized === CREW_PREFIX
      ? '/'
      : normalized.startsWith(`${CREW_PREFIX}/`)
        ? normalized.slice(CREW_PREFIX.length)
        : normalized;

  if (bare === '/' || bare === '') return 'overview';
  if (bare === '/archive') return 'gallery';
  if (bare === '/finalized') return 'finalized';
  if (bare.startsWith('/songs')) return 'songs';
  if (bare === '/timeline') return 'timeline';
  if (bare.startsWith('/scenes')) return 'scenes';
  if (bare === '/video') return 'video';
  if (bare.startsWith('/suggestions')) return 'suggestions';
  if (bare.startsWith('/cartoons')) return 'cartoons';
  if (bare.startsWith('/sequences')) return 'sequences';
  if (bare === '/characters' || bare.startsWith('/characters/')) return 'characters';
  if (bare.startsWith('/episodes')) return 'episodes';
  if (bare === '/crew') return 'crew';
  if (bare === '/search') return 'search';

  return 'overview';
}
