import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import SiteHeader from './components/SiteHeader';
import { likelyViews, prefetchView, viewLoaders } from './routes/lazyViews';

const Gallery = lazy(viewLoaders.gallery);
const TimelinePage = lazy(viewLoaders.timeline);
const Songs = lazy(viewLoaders.songs);
const DaisyBell = lazy(viewLoaders['daisy-bell']);
const Suggestions = lazy(viewLoaders.suggestions);
const Cartoons = lazy(viewLoaders.cartoons);
const Sequences = lazy(viewLoaders.sequences);
const Characters = lazy(viewLoaders.characters);
const Episodes = lazy(viewLoaders.episodes);
const Staff = lazy(viewLoaders.staff);

/** Card-shaped placeholders so the layout doesn't jump when a view's chunk arrives. */
function RouteFallback() {
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

function usePrefetchLikelyViews() {
  useEffect(() => {
    const run = () => likelyViews.forEach(prefetchView);
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = setTimeout(run, 2000);
    return () => clearTimeout(handle);
  }, []);
}

export default function App() {
  usePrefetchLikelyViews();

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <SiteHeader />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/index.html" element={<Gallery />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/songs/:id" element={<Songs />} />
          <Route path="/daisy-bell" element={<DaisyBell />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/suggestions/:id" element={<Suggestions />} />
          <Route path="/cartoons" element={<Cartoons />} />
          <Route path="/cartoons/:id" element={<Cartoons />} />
          <Route path="/sequences" element={<Sequences />} />
          <Route path="/sequences/:id" element={<Sequences />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/episodes" element={<Episodes />} />
          <Route path="/episodes/:id" element={<Episodes />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </main>
  );
}
