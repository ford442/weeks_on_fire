import type { SiteView } from '../components/SiteHeader';

/** Creator hub. The public site owns `/`. */
export const CREW_PREFIX = '/show';

const crewRoots = [
  'timeline',
  'songs',
  'daisy-bell',
  'suggestions',
  'cartoons',
  'sequences',
  'characters',
  'episodes',
  'crew',
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

export const viewPaths: Record<SiteView, string> = {
  gallery: crewPath('/'),
  timeline: crewPath('/timeline'),
  songs: crewPath('/songs'),
  'daisy-bell': crewPath('/daisy-bell'),
  suggestions: crewPath('/suggestions'),
  cartoons: crewPath('/cartoons'),
  sequences: crewPath('/sequences'),
  characters: crewPath('/characters'),
  episodes: crewPath('/episodes'),
  crew: crewPath('/crew'),
};

export function pathnameToView(pathname: string): SiteView {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const bare =
    normalized === CREW_PREFIX
      ? '/'
      : normalized.startsWith(`${CREW_PREFIX}/`)
        ? normalized.slice(CREW_PREFIX.length)
        : normalized;

  if (bare === '/' || bare === '') return 'gallery';
  if (bare.startsWith('/songs')) return 'songs';
  if (bare === '/timeline') return 'timeline';
  if (bare === '/daisy-bell') return 'daisy-bell';
  if (bare.startsWith('/suggestions')) return 'suggestions';
  if (bare.startsWith('/cartoons')) return 'cartoons';
  if (bare.startsWith('/sequences')) return 'sequences';
  if (bare === '/characters') return 'characters';
  if (bare.startsWith('/episodes')) return 'episodes';
  if (bare === '/crew') return 'crew';

  return 'gallery';
}
