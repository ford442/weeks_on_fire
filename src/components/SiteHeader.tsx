import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Box,
  Clock,
  Film,
  Flower2,
  Lightbulb,
  Music2,
  PenLine,
  UserCircle,
  Users,
} from 'lucide-react';

import { pathnameToView, viewPaths } from '../routes/paths';

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

const viewMeta: Record<SiteView, { eyebrow: string; description: string; icon: typeof Film }> = {
  gallery: {
    eyebrow: 'Grok Imagine Archive',
    description:
      'Production stills, cutaway suggestion prompts, and test ideas — scene, suggestion, test, and character lanes with copy-ready Grok prompts.',
    icon: Film,
  },
  timeline: {
    eyebrow: 'Production Timeline',
    description:
      'Track scene creation, prompt evolution, media links, and status. Export JSON to commit production history.',
    icon: Clock,
  },
  songs: {
    eyebrow: 'Minimax Music Catalog',
    description:
      'Browse the series soundtrack — Minimax style prompts, lyrics, episode ties, and copy-ready generation notes.',
    icon: Music2,
  },
  'daisy-bell': {
    eyebrow: 'Daisy Bell Cutaway',
    description:
      'Rubella & Lillith on the flower bicycle into old London — color HD keyframes beside intentional scratchy period film, sequence board, and street sights.',
    icon: Flower2,
  },
  suggestions: {
    eyebrow: 'Suggested Cutaways',
    description:
      'Every current cutaway, one-panel gag, and scene suggestion — timed segments with copyable Grok Imagine / Gemini Omni prompts.',
    icon: Lightbulb,
  },
  cartoons: {
    eyebrow: 'Cartoon Ideas',
    description:
      'Short cartoon seeds from agents — premise, still, optional Grok prompt. Promote winners to Suggestions.',
    icon: PenLine,
  },
  sequences: {
    eyebrow: '3D Sequences',
    description:
      'Playable in-hub 3D video sequences — lattices, still-life, cel errands, chrome, porch walks, and a fast-motion kick pack. Ten seconds to two minutes.',
    icon: Box,
  },
  characters: {
    eyebrow: 'Character Bible',
    description:
      'Recurring cast and lawn-ensemble roles — including Qing Rao (清饶), the crystal-skull keeper on the Episode 03 Monster Mash lawn.',
    icon: UserCircle,
  },
  episodes: {
    eyebrow: 'Episode Bible',
    description:
      'Loglines, status, and in-app synopses for every episode — read-only home for scripts and scene breakdowns. Timeline stays the editor.',
    icon: BookOpen,
  },
  staff: {
    eyebrow: 'Series Crew',
    description:
      'Meet the fictional writer, producer, director, and crew behind Weeks on Fire — bios, quotes, and series credits.',
    icon: Users,
  },
};

export default function SiteHeader() {
  const { pathname } = useLocation();
  const view = pathnameToView(pathname);
  const meta = viewMeta[view];
  const EyebrowIcon = meta.icon;

  return (
    <section className="border-b border-zinc-850 bg-[radial-gradient(circle_at_top_left,_rgba(234,88,12,0.14),_transparent_32%),linear-gradient(135deg,_#121212_0%,_#090909_58%,_#1b1010_100%)]">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-end px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-2 inline-flex items-center gap-2 rounded-md border border-orange-500/30 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
            <EyebrowIcon size={14} />
            {meta.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold leading-none text-white sm:text-5xl">
            Weeks on Fire
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">{meta.description}</p>

          <nav
            aria-label="Site sections"
            className="mt-5 inline-flex flex-wrap rounded-lg border border-zinc-800 bg-black/40 p-1"
          >
            <TabLink to={viewPaths.gallery}>
              <Film size={16} />
              Visual Archive
            </TabLink>
            <TabLink to={viewPaths.timeline}>
              <Clock size={16} />
              Timeline
            </TabLink>
            <TabLink to={viewPaths.songs}>
              <Music2 size={16} />
              Songs
            </TabLink>
            <TabLink to={viewPaths['daisy-bell']}>
              <Flower2 size={16} />
              Daisy Bell
            </TabLink>
            <TabLink to={viewPaths.suggestions}>
              <Lightbulb size={16} />
              Suggestions
            </TabLink>
            <TabLink to={viewPaths.cartoons}>
              <PenLine size={16} />
              Cartoons
            </TabLink>
            <TabLink to={viewPaths.sequences}>
              <Box size={16} />
              3D Sequences
            </TabLink>
            <TabLink to={viewPaths.characters}>
              <UserCircle size={16} />
              Characters
            </TabLink>
            <TabLink to={viewPaths.episodes}>
              <BookOpen size={16} />
              Episodes
            </TabLink>
            <TabLink to={viewPaths.staff}>
              <Users size={16} />
              Crew
            </TabLink>
          </nav>
        </div>
      </div>
    </section>
  );
}

interface TabLinkProps {
  to: string;
  children: ReactNode;
}

function TabLink({ to, children }: TabLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
          isActive
            ? 'bg-orange-600 text-white shadow-sm shadow-orange-900/40'
            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
