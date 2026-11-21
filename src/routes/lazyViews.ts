import type { SiteView } from '../components/SiteHeader';

/** Dynamic imports for each view; shared by `React.lazy` and hover/idle prefetch so both hit one chunk. */
export const viewLoaders = {
  overview: () => import('../components/Overview'),
  finalized: () => import('../components/Finalized'),
  gallery: () => import('../components/Gallery'),
  video: () => import('../components/Video'),
  timeline: () => import('../components/TimelinePage'),
  songs: () => import('../components/Songs'),
  scenes: () => import('../components/Scenes'),
  suggestions: () => import('../components/Suggestions'),
  cartoons: () => import('../components/Cartoons'),
  sequences: () => import('../components/Sequences'),
  characters: () => import('../components/Characters'),
  episodes: () => import('../components/Episodes'),
  crew: () => import('../components/Crew'),
  search: () => import('../components/SearchPage'),
} satisfies Record<SiteView, () => Promise<unknown>>;

/** The graph editor (`/sequences/:id/edit`): its own chunk, never part of the Sequences view. */
export const loadSequenceEditor = () => import('../components/sequenceEditor/SequenceEditor');

const requested = new Set<SiteView>();

/** Warms a view's chunk. Safe to call repeatedly; failures are left for the real navigation to surface. */
export function prefetchView(view: SiteView): void {
  if (requested.has(view)) return;
  requested.add(view);
  viewLoaders[view]().catch(() => requested.delete(view));
}

/** Views most visitors open after landing; fetched once the browser is idle. */
export const likelyViews: readonly SiteView[] = [
  'overview',
  'finalized',
  'gallery',
  'songs',
  'suggestions',
  'episodes',
];
