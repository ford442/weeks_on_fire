export interface SiteViewMeta {
  id: string;
  label: string;
  path: string;
  eyebrow: string;
  description: string;
}

export const SITE_BASE = 'https://ford442.github.io/weeks_on_fire';
export const REPO_BASE = 'https://github.com/ford442/weeks_on_fire';

export const siteViews: SiteViewMeta[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/show',
    eyebrow: 'About the show',
    description:
      'What Weeks on Fire is — logline, synopsis, tone and format, the episode list, the cast and crew, and what was added most recently.',
  },
  {
    id: 'finalized',
    label: 'Finalized',
    path: '/show/finalized',
    eyebrow: 'Finished work',
    description:
      'Every song, still and video marked Approved or Final — the finished pieces, in one place.',
  },
  {
    id: 'gallery',
    label: 'Visual Archive',
    path: '/show/archive',
    eyebrow: 'Grok Imagine Archive',
    description:
      'Production stills and test ideas — scene, test, and character lanes with copy-ready Grok prompts. Cutaway and gag ideas live in Suggestions.',
  },
  {
    id: 'video',
    label: 'Video',
    path: '/show/video',
    eyebrow: 'Generated Video',
    description:
      'Every generated clip and slideshow in one place — scene slideshows, Timeline clips, archive clips and cutaway takes, each with its production status.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    path: '/show/timeline',
    eyebrow: 'Production Timeline',
    description:
      'Track scene creation, prompt evolution, media links, and status. Export JSON to commit production history.',
  },
  {
    id: 'songs',
    label: 'Songs',
    path: '/show/songs',
    eyebrow: 'Minimax Music Catalog',
    description:
      'Browse the series soundtrack — Minimax style prompts, lyrics, episode ties, and copy-ready generation notes.',
  },
  {
    id: 'scenes',
    label: 'Scenes',
    path: '/show/scenes',
    eyebrow: 'Scene Boards',
    description:
      'Scenes with a page of their own — pitch, prompt locks, sequence, keyframe board and finished video. Daisy Bell is the first; every scene uses the same template.',
  },
  {
    id: 'suggestions',
    label: 'Suggestions',
    path: '/show/suggestions',
    eyebrow: 'Suggested Cutaways',
    description:
      'Every current cutaway, one-panel gag, and scene suggestion — timed segments with copyable Grok Imagine / Gemini Omni prompts.',
  },
  {
    id: 'cartoons',
    label: 'Cartoons',
    path: '/show/cartoons',
    eyebrow: 'Cartoon Ideas',
    description:
      'Short cartoon seeds from agents — premise, still, optional Grok prompt. Promote winners to Suggestions.',
  },
  {
    id: 'sequences',
    label: '3D Sequences',
    path: '/show/sequences',
    eyebrow: '3D Sequences',
    description:
      'Playable in-hub 3D video sequences — lattices, still-life, cel errands, chrome, porch walks, and a fast-motion kick pack. Ten seconds to two minutes.',
  },
  {
    id: 'characters',
    label: 'Characters',
    path: '/show/characters',
    eyebrow: 'Character Bible',
    description:
      'Recurring cast and lawn-ensemble roles — including Qing Rao (清饶), the crystal-skull keeper on the Episode 03 Monster Mash lawn.',
  },
  {
    id: 'episodes',
    label: 'Episodes',
    path: '/show/episodes',
    eyebrow: 'Episode Bible',
    description:
      'Loglines, status, and in-app synopses for every episode — read-only home for scripts and scene breakdowns. Timeline stays the editor.',
  },
  {
    id: 'search',
    label: 'Search',
    path: '/show/search',
    eyebrow: 'Hub search',
    description:
      'Search every catalog at once — songs, cutaways, scenes, stills, episodes, characters, cartoons, 3D sequences and crew — by title, tag, summary or character name. Deep-linkable: /show/search?q=<terms>.',
  },
  {
    id: 'crew',
    label: 'Crew',
    path: '/show/crew',
    eyebrow: 'Bios & credits',
    description:
      'Meet the fictional writer, producer, director, and crew behind Weeks on Fire — bios, quotes, and series credits.',
  },
];

export function siteUrl(path: string): string {
  const normalized = path === '/' ? '' : path.replace(/^\//, '');
  return normalized ? `${SITE_BASE}/${normalized}` : `${SITE_BASE}/`;
}
