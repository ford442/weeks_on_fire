import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import SiteHeader from './components/SiteHeader';

const Gallery = lazy(() => import('./components/Gallery'));
const TimelinePage = lazy(() => import('./components/TimelinePage'));
const Songs = lazy(() => import('./components/Songs'));
const DaisyBell = lazy(() => import('./components/DaisyBell'));
const Suggestions = lazy(() => import('./components/Suggestions'));
const Characters = lazy(() => import('./components/Characters'));
const Staff = lazy(() => import('./components/Staff'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16 text-sm text-zinc-400">
      Loading…
    </div>
  );
}

export default function App() {
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
          <Route path="/characters" element={<Characters />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </main>
  );
}
