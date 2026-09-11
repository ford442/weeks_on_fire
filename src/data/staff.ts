export type StaffRole = 'Writer' | 'Producer' | 'Director' | 'Music Supervisor' | 'Visual Designer';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  location: string;
  yearsOnSeries: string;
  specialty: string;
  bio: string;
  quote: string;
  credits: string[];
  /** Relative path under public/cast (deployed to FTP with the site). */
  imageUrl: string;
}

/** Cast portraits live in public/cast and ship via deploy.py with the site. */
function sitePrefix(): string {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return '';
  const first = window.location.pathname.split('/').filter(Boolean)[0];
  if (first === 'weeks-on-fire' || first === 'weeks_on_fire') return `/${first}`;
  return '';
}

const cast = (filename: string) => `${sitePrefix()}/cast/${filename}`;

export const staffMembers: StaffMember[] = [
  {
    id: 'mara-vell',
    name: 'Mara Vell',
    role: 'Writer',
    location: 'Santa Fe, NM',
    yearsOnSeries: 'Since Episode 01',
    specialty: 'Mythic dialogue & scene rhythm',
    bio: 'Mara drafts the Weeks on Fire scripts as fever-dream road diaries — short enough to cut on a beat, strange enough to linger after the drop. She treats every musical cutaway as a character beat, not a pause, and builds episode arcs around the spaces between lyrics. Before the series, she wrote late-night radio dramas and desert-noir stage pieces that never quite fit a conventional stage.',
    quote:
      'If the serpent rises on the snare hit, the line before it has to already be burning. Dialogue is just another instrument in the mix.',
    credits: [
      'Episode 01 — cold-open monologue',
      'Episode 02 — roadside confession structure',
      'Episode 02 — 480p Studio Huddle (meta pacing / HOA seed)',
      'Episode 03 — Laser Snakes narrative spine',
    ],
    imageUrl: cast('mara-vell.jpg'),
  },
  {
    id: 'julian-rook',
    name: 'Julian Rook',
    role: 'Producer',
    location: 'Los Angeles, CA',
    yearsOnSeries: 'Series lead',
    specialty: 'Budget alchemy & cue scheduling',
    bio: 'Julian keeps Weeks on Fire moving from prompt folder to finished cut without sanding off the weirdness. He coordinates Minimax track delivery, Grok Imagine still batches, and subtitle locks like a single production board — and insists the archive stay as useful as the film. His rule: every still needs a prompt, every cue needs a scene, every episode needs a reason to exist beyond the glow.',
    quote:
      'We do not scale chaos. We schedule it. If the desert wants lasers, we give it lasers — on time, on budget, and with the prompt copied into the gallery.',
    credits: [
      'Series financing & delivery calendar',
      'External media hosting policy',
      'Production hub review cadence',
    ],
    imageUrl: cast('julian-rook.jpg'),
  },
  {
    id: 'soren-kade',
    name: 'Soren Kade',
    role: 'Director',
    location: 'Joshua Tree, CA',
    yearsOnSeries: 'Episodes 01–03',
    specialty: 'Night desert tableaux & kinetic cutaways',
    bio: 'Soren directs Weeks on Fire like a concert filmed inside a hallucination — wide dunes first, faces second, then the strike of light. He storyboards in ten-second blocks synced to Minimax drops and pushes Grok Imagine toward practical dust, anamorphic stretch, and silhouettes that feel cast rather than generated. On set (or in the prompt suite), he hunts for one image per scene that could hang on a wall and still scare you a little.',
    quote:
      'The series is not about explaining the fire. It is about standing close enough that the heat rearranges the frame.',
    credits: [
      'Episode 03 — Laser Serpent Awakening',
      'Visual grammar for musical cutaways',
      'Shot language for Grok Imagine stills',
    ],
    imageUrl: cast('soren-kade.jpg'),
  },
  {
    id: 'nova-chen',
    name: 'Nova Chen',
    role: 'Music Supervisor',
    location: 'Brooklyn, NY',
    yearsOnSeries: 'Since Episode 02',
    specialty: 'Minimax style prompts & drop mapping',
    bio: 'Nova maps every Weeks on Fire cue to a scene emotion before a single lyric is generated. She writes Minimax style prompts like shot lists — genre, pressure, silence, release — and keeps the Songs archive honest about what each track is doing on screen. If a drop does not change the picture, she sends it back.',
    quote: 'A good cue does not decorate the cut. It argues with it until the cut gets braver.',
    credits: [
      'Halloween Snake Battle drop placement',
      'Catalog tagging for episode ties',
      'Style-prompt QA for Minimax batches',
    ],
    imageUrl: cast('nova-chen.jpg'),
  },
  {
    id: 'elio-marsh',
    name: 'Elio Marsh',
    role: 'Visual Designer',
    location: 'Portland, OR',
    yearsOnSeries: 'Archive & stills',
    specialty: 'Prompt craft & color temperature',
    bio: 'Elio turns director notes into reproducible Grok Imagine prompts and keeps the Visual Archive readable for collaborators. He obsesses over orange firelight against cold moonlight, coherent laser geometry, and tags that actually help you find a still at 2 a.m. The gallery is his cut of the film — stills as chapters.',
    quote:
      'If you cannot copy the prompt and get something close to the still, we did not finish the shot. We only finished a screenshot.',
    credits: [
      'Prompt variation sets per episode',
      'Theme & tag taxonomy',
      'Lightbox copy-ready workflow',
    ],
    imageUrl: cast('elio-marsh.jpg'),
  },
];
