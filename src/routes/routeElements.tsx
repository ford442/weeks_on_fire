/** Elements the route table (`./appRoutes.tsx`) mounts: lazy views, layouts, fallbacks, errors. */
import { lazy, Suspense, useEffect } from 'react';
import {
  isRouteErrorResponse,
  Link,
  Navigate,
  Outlet,
  useLocation,
  useRouteError,
} from 'react-router-dom';

import SiteHeader from '../components/SiteHeader';
import MediaSessionProvider from '../contexts/MediaSessionProvider';

import { likelyViews, prefetchView, viewLoaders } from './lazyViews';
import {
  CREW_PREFIX,
  crewPath,
  isLegacyArchiveLink,
  isLegacyCrewPath,
  legacySceneRedirect,
  viewPaths,
} from './paths';
import { rememberViewLocation } from './viewSearch';

import type { SiteView } from '../components/SiteHeader';

export const Overview = lazy(viewLoaders.overview);
export const Finalized = lazy(viewLoaders.finalized);
export const Gallery = lazy(viewLoaders.gallery);
export const TimelinePage = lazy(viewLoaders.timeline);
export const Songs = lazy(viewLoaders.songs);
export const Scenes = lazy(viewLoaders.scenes);
export const Video = lazy(viewLoaders.video);
export const Suggestions = lazy(viewLoaders.suggestions);
export const Cartoons = lazy(viewLoaders.cartoons);
export const Sequences = lazy(viewLoaders.sequences);
export const Characters = lazy(viewLoaders.characters);
export const Episodes = lazy(viewLoaders.episodes);
export const Crew = lazy(viewLoaders.crew);
export const SearchPage = lazy(viewLoaders.search);
export const PublicLayout = lazy(() => import('../public/PublicLayout'));
export const Listen = lazy(() => import('../public/Listen'));
export const Album = lazy(() => import('../public/Listen').then((m) => ({ default: m.Album })));
export const PublicHome = lazy(() =>
  import('../public/PublicPages').then((m) => ({ default: m.PublicHome })),
);
export const LaceWaterfall = lazy(() =>
  import('../public/PublicPages').then((m) => ({ default: m.LaceWaterfall })),
);
export const MusicProjects = lazy(() =>
  import('../public/PublicPages').then((m) => ({ default: m.MusicProjects })),
);

/** Card-shaped placeholders so the layout doesn't jump when a view's chunk arrives. */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading…</span>
      <div className="mb-4 h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950 motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
          >
            <div className="aspect-[4/5] animate-pulse bg-zinc-900 motion-reduce:animate-none" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-1/3 rounded bg-zinc-800" />
              <div className="h-4 w-4/5 rounded bg-zinc-800" />
              <div className="h-3 w-full rounded bg-zinc-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Warms the views most visitors open next, once the current one has painted: after `load`, a
 * further pause, then an idle slot. Starting earlier puts other views' parse and evaluate on the
 * main thread while this one is still painting. Skipped on Save-Data / 2G connections.
 */
function usePrefetchLikelyViews() {
  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (connection?.saveData || /2g/.test(connection?.effectiveType ?? '')) return;

    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => likelyViews.forEach(prefetchView);
    const schedule = () => {
      timer = setTimeout(() => {
        if ('requestIdleCallback' in window)
          idle = window.requestIdleCallback(run, { timeout: 4000 });
        else run();
      }, 3000);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      window.removeEventListener('load', schedule);
      if (timer !== undefined) clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, []);
}

/** Old URLs that now live somewhere else; `null` when `pathname` is current. */
function legacyRedirect(pathname: string, search: string): string | null {
  // Public listen and the band page used to live under /show.
  if (
    pathname === '/show/listen' ||
    pathname.startsWith('/show/listen/') ||
    pathname === '/show/lace-waterfall'
  ) {
    return `${pathname.slice(CREW_PREFIX.length)}${search}`;
  }
  // The Crew view used to be called Staff.
  if (/^(\/show)?\/staff\/?$/.test(pathname)) return `${crewPath('/crew')}${search}`;
  // Creator sections used to live at the root.
  if (isLegacyCrewPath(pathname)) return `${crewPath(pathname)}${search}`;
  // The hub home used to be the Visual Archive; keep its filtered links working.
  if (isLegacyArchiveLink(pathname, search)) return `${viewPaths.gallery}${search}`;
  // Daisy Bell is one scene among many now.
  const scenePath = legacySceneRedirect(pathname);
  return scenePath ? `${scenePath}${search}` : null;
}

/** Every route renders under this: media session, legacy redirects, idle prefetch. */
export function Root() {
  usePrefetchLikelyViews();
  const { pathname, search } = useLocation();
  const to = legacyRedirect(pathname, search);
  return (
    <MediaSessionProvider>
      {to ? (
        <Navigate to={to} replace />
      ) : (
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      )}
    </MediaSessionProvider>
  );
}

/** Creator hub: prompts, timeline, and the rest of the production tools. */
export function CrewLayout() {
  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <SiteHeader />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </main>
  );
}

const listLabels: Partial<Record<SiteView, string>> = {
  songs: 'songs',
  suggestions: 'suggestions',
  cartoons: 'cartoons',
  sequences: 'sequences',
  episodes: 'episodes',
  characters: 'characters',
  scenes: 'scenes',
};

const isListSection = (section: string): section is keyof typeof listLabels =>
  section in listLabels;

/**
 * Shown in place of a view when its loader or render fails: an unknown id gets a 404 with a way
 * back to its list (instead of a silent redirect); anything else gets a retry.
 */
export function RouteError() {
  const error = useRouteError();
  const { pathname } = useLocation();
  const section = pathname.slice(CREW_PREFIX.length).split('/').filter(Boolean)[0] ?? '';
  const list = isListSection(section) ? section : undefined;
  const listPath = list ? crewPath(`/${list}`) : CREW_PREFIX;
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  // The header remembers each tab's last location; don't let the tab reopen this dead end.
  useEffect(() => {
    if (list && notFound) rememberViewLocation(list, listPath, '');
  }, [list, listPath, notFound]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center text-zinc-300 sm:px-6"
    >
      <h1 className="text-2xl font-semibold text-white">
        {notFound ? 'Nothing here' : 'Something went wrong'}
      </h1>
      <p className="text-sm leading-6 text-zinc-400">
        {notFound
          ? `There is no ${list ? (listLabels[list] ?? '').replace(/s$/, '') : 'page'} at this address. It may have been renamed or removed.`
          : 'This view failed to load. If you are offline, reconnect and try again.'}
      </p>
      <div className="flex justify-center gap-3">
        <Link
          to={listPath}
          className="rounded-md border border-orange-500/60 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-100 hover:bg-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {list ? `All ${listLabels[list]}` : 'Back to the hub'}
        </Link>
        {!notFound && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            Reload
          </button>
        )}
      </div>
    </div>
  );
}
