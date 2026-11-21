import { data, Navigate, type LoaderFunctionArgs, type RouteObject } from 'react-router-dom';

import { RecordNotFoundError } from '../data/records';

import { loadSequenceEditor, prefetchView } from './lazyViews';
import { CREW_PREFIX, viewPaths } from './paths';
import {
  Album,
  Cartoons,
  Characters,
  Crew,
  CrewLayout,
  Episodes,
  Finalized,
  Gallery,
  LaceWaterfall,
  Listen,
  MusicProjects,
  Overview,
  PublicHome,
  PublicLayout,
  Recipes,
  Root,
  RouteError,
  RouteFallback,
  Scenes,
  SearchPage,
  SequenceEditor,
  Sequences,
  Songs,
  Suggestions,
  TimelinePage,
  Video,
} from './routeElements';

import type { SiteView } from '../components/SiteHeader';

/** React Router's not-found contract: a thrown 404 response, caught by the nearest `errorElement`. */
function throwNotFound(): never {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- a route response, not an Error
  throw data(null, { status: 404 });
}

/** A detail loader that only checks the id against a bundled list (its chunk is the view's own). */
function idLoader(ids: () => Promise<Iterable<{ id: string }>>) {
  return async ({ params }: LoaderFunctionArgs) => {
    const id = params.id ?? '';
    for (const record of await ids()) if (record.id === id) return null;
    throwNotFound();
  };
}

/**
 * Fetches the full record before the view renders, so a deep link or a click paints its detail
 * pane at once. A missing id is a 404; a failed fetch (offline) still renders the view, which
 * shows its own retryable error in the pane.
 */
function recordLoader(load: (id: string) => Promise<unknown>) {
  return async ({ params }: LoaderFunctionArgs) => {
    try {
      await load(params.id ?? '');
    } catch (error) {
      if (error instanceof RecordNotFoundError) throwNotFound();
    }
    return null;
  };
}

const songLoader = recordLoader(async (id) => (await import('../data/songs')).loadSong(id));
const cutawayLoader = recordLoader(async (id) =>
  (await import('../data/suggestions')).loadCutaway(id),
);

/** `/songs` opens on the first song; warm it with the list. */
/** `/songs` opens on the first song: start its record with the list, without blocking the list. */
function songsIndexLoader() {
  void import('../data/songs').then(({ prefetchSong, songs }) => {
    if (songs[0]) prefetchSong(songs[0].id);
  });
  return null;
}

/**
 * Starts the view's chunk alongside its loader. `React.lazy` would otherwise request it only
 * once the loader settles and the element renders, a waterfall on every deep link.
 */
function withView(view: SiteView, loader: (args: LoaderFunctionArgs) => Promise<unknown>) {
  return (args: LoaderFunctionArgs) => {
    prefetchView(view);
    return loader(args);
  };
}

const detail = (path: string): string => `${path}/:id`;

const crewViews: RouteObject[] = [
  { index: true, element: <Overview /> },
  { path: viewPaths.finalized, element: <Finalized /> },
  { path: viewPaths.gallery, element: <Gallery /> },
  { path: viewPaths.video, element: <Video /> },
  { path: viewPaths.timeline, element: <TimelinePage /> },
  { path: viewPaths.songs, element: <Songs />, loader: songsIndexLoader },
  { path: detail(viewPaths.songs), element: <Songs />, loader: withView('songs', songLoader) },
  { path: viewPaths.scenes, element: <Scenes /> },
  {
    path: detail(viewPaths.scenes),
    element: <Scenes />,
    loader: withView(
      'scenes',
      idLoader(async () => (await import('../data/sceneBoards')).sceneBoards),
    ),
  },
  { path: viewPaths.suggestions, element: <Suggestions /> },
  {
    path: detail(viewPaths.suggestions),
    element: <Suggestions />,
    loader: withView('suggestions', cutawayLoader),
  },
  { path: viewPaths.cartoons, element: <Cartoons /> },
  {
    path: detail(viewPaths.cartoons),
    element: <Cartoons />,
    loader: withView(
      'cartoons',
      idLoader(async () => (await import('../data/cartoons')).cartoons),
    ),
  },
  { path: viewPaths.sequences, element: <Sequences /> },
  {
    path: detail(viewPaths.sequences),
    element: <Sequences />,
    loader: withView(
      'sequences',
      idLoader(async () => (await import('../data/sequences')).sequences),
    ),
  },
  {
    // Before React.lazy asks for it: start the editor chunk with the id check.
    path: `${viewPaths.sequences}/:id/edit`,
    element: <SequenceEditor />,
    loader: (args: LoaderFunctionArgs) => {
      void loadSequenceEditor();
      return idLoader(async () => (await import('../data/sequences')).sequences)(args);
    },
  },
  { path: viewPaths.characters, element: <Characters /> },
  {
    path: detail(viewPaths.characters),
    element: <Characters />,
    loader: withView(
      'characters',
      idLoader(async () => (await import('../data/characters')).seriesCharacters),
    ),
  },
  { path: viewPaths.episodes, element: <Episodes /> },
  {
    path: detail(viewPaths.episodes),
    element: <Episodes />,
    loader: withView(
      'episodes',
      idLoader(async () => (await import('../data/episodes')).episodes),
    ),
  },
  { path: viewPaths.crew, element: <Crew /> },
  { path: viewPaths.search, element: <SearchPage /> },
  { path: '*', element: <Navigate to={CREW_PREFIX} replace /> },
];

/** The whole app as data-router route objects (`createBrowserRouter` / `createMemoryRouter`). */
export const appRoutes: RouteObject[] = [
  {
    element: <Root />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      {
        path: CREW_PREFIX,
        element: <CrewLayout />,
        // A pathless child keeps the header up while a view's error replaces just the view.
        children: [{ errorElement: <RouteError />, children: crewViews }],
      },
      {
        path: '/',
        element: <PublicLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <PublicHome /> },
          { path: 'index.html', element: <PublicHome /> },
          { path: 'listen', element: <Listen /> },
          { path: 'listen/:id', element: <Listen /> },
          { path: 'albums', element: <MusicProjects /> },
          { path: 'albums/:id', element: <Album /> },
          { path: 'lace-waterfall', element: <LaceWaterfall /> },
          { path: 'recipes', element: <Recipes /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
];
