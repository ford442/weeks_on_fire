import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Box,
  Clock,
  Film,
  Flame,
  Flower2,
  Lightbulb,
  Music2,
  PenLine,
  UserCircle,
  Search,
  Users,
} from 'lucide-react';

import { prefetchView } from '../routes/lazyViews';
import { pathnameToView, viewPaths } from '../routes/paths';
import { rememberedViewLocation, rememberViewLocation } from '../routes/viewSearch';

const SiteSearch = lazy(() => import('./SiteSearch'));

export type SiteView =
  | 'gallery'
  | 'timeline'
  | 'songs'
  | 'daisy-bell'
  | 'suggestions'
  | 'cartoons'
  | 'sequences'
  | 'characters'
  | 'episodes'
  | 'staff';

const viewMeta: Record<SiteView, { title: string; description: string; icon: typeof Film }> = {
  gallery: {
    title: 'Visual archive',
    description:
      'Production stills, cutaway suggestion prompts, and test ideas — scene, suggestion, test, and character lanes with copy-ready Grok prompts.',
    icon: Film,
  },
  timeline: {
    title: 'Production timeline',
    description:
      'Track scene creation, prompt evolution, media links, and status. Export JSON to commit production history.',
    icon: Clock,
  },
  songs: {
    title: 'Songs',
    description:
      'Browse the series soundtrack — Minimax style prompts, lyrics, episode ties, and copy-ready generation notes.',
    icon: Music2,
  },
  'daisy-bell': {
    title: 'Daisy Bell cutaway',
    description:
      'Rubella & Lillith on the flower bicycle into old London — color HD keyframes beside intentional scratchy period film, sequence board, and street sights.',
    icon: Flower2,
  },
  suggestions: {
    title: 'Suggested cutaways',
    description:
      'Every current cutaway, one-panel gag, and scene suggestion — timed segments with copyable Grok Imagine / Gemini Omni prompts.',
    icon: Lightbulb,
  },
  cartoons: {
    title: 'Cartoon ideas',
    description:
      'Short cartoon seeds from agents — premise, still, optional Grok prompt. Promote winners to Suggestions.',
    icon: PenLine,
  },
  sequences: {
    title: '3D sequences',
    description:
      'Playable in-hub 3D video sequences — lattices, still-life, cel errands, chrome, porch walks, and a fast-motion kick pack. Ten seconds to two minutes.',
    icon: Box,
  },
  characters: {
    title: 'Character bible',
    description:
      'Recurring cast and lawn-ensemble roles — including Qing Rao (清饶), the crystal-skull keeper on the Episode 03 Monster Mash lawn.',
    icon: UserCircle,
  },
  episodes: {
    title: 'Episode bible',
    description:
      'Loglines, status, and in-app synopses for every episode — read-only home for scripts and scene breakdowns. Timeline stays the editor.',
    icon: BookOpen,
  },
  staff: {
    title: 'Series crew',
    description:
      'Meet the fictional writer, producer, director, and crew behind Weeks on Fire — bios, quotes, and series credits.',
    icon: Users,
  },
};

const tabs: Array<{ view: SiteView; label: string }> = [
  { view: 'gallery', label: 'Visual archive' },
  { view: 'timeline', label: 'Timeline' },
  { view: 'songs', label: 'Songs' },
  { view: 'daisy-bell', label: 'Daisy Bell' },
  { view: 'suggestions', label: 'Suggestions' },
  { view: 'cartoons', label: 'Cartoons' },
  { view: 'sequences', label: '3D sequences' },
  { view: 'characters', label: 'Characters' },
  { view: 'episodes', label: 'Episodes' },
  { view: 'staff', label: 'Crew' },
];

export default function SiteHeader() {
  const { pathname, search } = useLocation();
  const view = pathnameToView(pathname);
  const meta = viewMeta[view];
  const TitleIcon = meta.icon;
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    rememberViewLocation(view, pathname, search);
  }, [view, pathname, search]);

  useEffect(() => {
    document.title = `${meta.title} · Weeks on Fire`;
  }, [meta.title]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true;
      if (
        (event.key === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !typing)
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(234,88,12,0.12),_transparent_40%),linear-gradient(135deg,_#121212_0%,_#090909_58%,_#1b1010_100%)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 pt-3">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold text-orange-200 transition hover:text-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <Flame size={16} aria-hidden="true" />
            Weeks on Fire
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            onMouseEnter={() => void import('./SiteSearch')}
            onFocus={() => void import('./SiteSearch')}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-black/40 px-3 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-300 sm:w-64"
          >
            <Search size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Search the hub…</span>
            <span className="sr-only sm:hidden">Search the hub</span>
            <kbd className="ml-auto hidden rounded border border-zinc-700 px-1.5 text-xs text-zinc-400 sm:inline">
              /
            </kbd>
          </button>
        </div>

        <nav
          aria-label="Site sections"
          className="-mx-4 mt-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <ul className="flex w-max gap-1 pb-2">
            {tabs.map((tab) => (
              <li key={tab.view}>
                <TabLink
                  view={tab.view}
                  active={tab.view === view}
                  to={
                    tab.view === view
                      ? pathname + search
                      : rememberedViewLocation(tab.view, viewPaths[tab.view])
                  }
                >
                  {tab.label}
                </TabLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-1 border-t border-zinc-800/80 py-4 sm:flex-row sm:items-baseline sm:gap-4">
          <h1 className="inline-flex shrink-0 items-center gap-2.5 text-2xl font-semibold leading-tight text-white sm:text-3xl">
            <TitleIcon size={24} className="text-orange-300" aria-hidden="true" />
            {meta.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
            {meta.description}
          </p>
        </div>
      </div>

      {searchOpen && (
        <Suspense fallback={null}>
          <SiteSearch onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
  );
}

const tabIcons: Record<SiteView, typeof Film> = {
  gallery: Film,
  timeline: Clock,
  songs: Music2,
  'daisy-bell': Flower2,
  suggestions: Lightbulb,
  cartoons: PenLine,
  sequences: Box,
  characters: UserCircle,
  episodes: BookOpen,
  staff: Users,
};

interface TabLinkProps {
  view: SiteView;
  active: boolean;
  /** Where the visitor left this tab: path, selection, and filters. */
  to: string;
  children: string;
}

function TabLink({ view, active, to, children }: TabLinkProps) {
  const Icon = tabIcons[view];

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => prefetchView(view)}
      onFocus={() => prefetchView(view)}
      onTouchStart={() => prefetchView(view)}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
        active
          ? 'bg-orange-600 text-white shadow-sm shadow-orange-900/40'
          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
      }`}
    >
      <Icon size={16} aria-hidden="true" />
      {children}
    </Link>
  );
}
