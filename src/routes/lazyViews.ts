import type { SiteView } from '../components/SiteHeader';

/** Dynamic imports for each view; shared by `React.lazy` and hover/idle prefetch so both hit one chunk. */
export const viewLoaders = {
  gallery: () => import('../components/Gallery'),
  timeline: () => import('../components/TimelinePage'),
  songs: () => import('../components/Songs'),
  'daisy-bell': () => import('../components/DaisyBell'),
  suggestions: () => import('../components/Suggestions'),
  cartoons: () => import('../components/Cartoons'),
  sequences: () => import('../components/Sequences'),
  characters: () => import('../components/Characters'),
  episodes: () => import('../components/Episodes'),
  staff: () => import('../components/Staff'),
} satisfies Record<SiteView, () => Promise<unknown>>;

const requested = new Set<SiteView>();

/** Warms a view's chunk. Safe to call repeatedly; failures are left for the real navigation to surface. */
export function prefetchView(view: SiteView): void {
  if (requested.has(view)) return;
  requested.add(view);
  viewLoaders[view]().catch(() => requested.delete(view));
}

/** Views most visitors open after landing; fetched once the browser is idle. */
export const likelyViews: readonly SiteView[] = ['gallery', 'songs', 'suggestions', 'episodes'];
