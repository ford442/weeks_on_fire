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
    id: 'gallery',
    label: 'Visual Archive',
    path: '/',
    eyebrow: 'Grok Imagine Archive',
    description:
      'Production stills, cutaway suggestion prompts, and test ideas — scene, suggestion, test, and character lanes with copy-ready Grok prompts.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    path: '/timeline',
    eyebrow: 'Production Timeline',
    description:
      'Track scene creation, prompt evolution, media links, and status. Export JSON to commit production history.',
  },
  {
    id: 'songs',
    label: 'Songs',
    path: '/songs',
    eyebrow: 'Minimax Music Catalog',
    description:
      'Browse the series soundtrack — Minimax style prompts, lyrics, episode ties, and copy-ready generation notes.',
  },
  {
    id: 'daisy-bell',
    label: 'Daisy Bell',
    path: '/daisy-bell',
    eyebrow: 'Daisy Bell Cutaway',
    description:
      'Rubella & Lillith on the flower bicycle into old London — color HD keyframes beside intentional scratchy period film, sequence board, and street sights.',
  },
  {
    id: 'suggestions',
    label: 'Suggestions',
    path: '/suggestions',
    eyebrow: 'Suggested Cutaways',
    description:
      'Every current cutaway, one-panel gag, and scene suggestion — timed segments with copyable Grok Imagine / Gemini Omni prompts.',
  },
  {
    id: 'cartoons',
    label: 'Cartoons',
    path: '/cartoons',
    eyebrow: 'Cartoon Ideas',
    description:
      'Short cartoon seeds from agents — premise, still, optional Grok prompt. Promote winners to Suggestions.',
  },
  {
    id: 'sequences',
    label: '3D Sequences',
    path: '/sequences',
    eyebrow: '3D Sequences',
    description:
      'Playable in-hub 3D video sequences — unreal lattices, still-life orbits, cel-shaded errands, chrome ribbons, mixed porch walks. Ten seconds to two minutes.',
  },
  {
    id: 'characters',
    label: 'Characters',
    path: '/characters',
    eyebrow: 'Character Bible',
    description:
      'Recurring cast and lawn-ensemble roles — including Qing Rao (清饶), the crystal-skull keeper on the Episode 03 Monster Mash lawn.',
  },
  {
    id: 'episodes',
    label: 'Episodes',
    path: '/episodes',
    eyebrow: 'Episode Bible',
    description:
      'Loglines, status, and in-app synopses for every episode — read-only home for scripts and scene breakdowns. Timeline stays the editor.',
  },
  {
    id: 'staff',
    label: 'Crew',
    path: '/staff',
    eyebrow: 'Series Crew',
    description:
      'Meet the fictional writer, producer, director, and crew behind Weeks on Fire — bios, quotes, and series credits.',
  },
];

export function siteUrl(path: string): string {
  const normalized = path === '/' ? '' : path.replace(/^\//, '');
  return normalized ? `${SITE_BASE}/${normalized}` : `${SITE_BASE}/`;
}
