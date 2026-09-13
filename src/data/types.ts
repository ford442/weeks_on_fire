export interface Song {
  id: string;
  title: string;
  genre: string;
  description: string;
  episode: string;
  stylePrompt: string;
  lyrics: string | null;
  notes: string | null;
  instrumental: boolean;
  tags: string[];
  sourceFile: string;
  audioFile?: string;
}

export interface CutawaySegment {
  id: string;
  label: string;
  start: string;
  end: string;
  durationSec: number;
  onScreen: string;
  lyrics: string;
  musicCue: string;
  grokImaginePrompt: string;
  geminiOmniPrompt: string;
  promptVariations: string[];
  stillUrl?: string;
}

export type SuggestionKind = 'musical' | 'gag' | 'scene';

export type SightLane = 'fall' | 'ending';

export interface SightCandidate {
  id: string;
  title: string;
  category: string;
  lane: SightLane;
  prompt: string;
  description: string;
}

export interface CutawaySuggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  status: 'suggested' | 'ready-to-generate' | 'in-production';
  runtime: string;
  episode: string;
  songId: string;
  songTitle: string;
  summary: string;
  visualArc: string;
  tags: string[];
  segments: CutawaySegment[];
  sightBank?: SightCandidate[];
}

export type MediaType = 'image' | 'video';

export type ImageKind = 'scene' | 'suggestion' | 'test' | 'character';

export interface FilmScene {
  id: string;
  imageKind: ImageKind;
  episode: string;
  title: string;
  prompt: string;
  promptVariations: string[];
  imageUrl?: string;
  mediaType: MediaType;
  musicCue: string;
  musicStyle: string;
  description: string;
  theme: string;
  tags: string[];
}

export interface SeriesCharacter {
  id: string;
  name: string;
  nameNote?: string;
  role: string;
  episodes: string[];
  traits: string[];
  bio: string;
  props: string[];
  tags: string[];
  imageUrl?: string;
}

export type StaffRole = 'Writer' | 'Producer' | 'Director' | 'Music Supervisor' | 'Visual Designer';

export interface StaffRecord {
  id: string;
  name: string;
  role: StaffRole;
  location: string;
  yearsOnSeries: string;
  specialty: string;
  bio: string;
  quote: string;
  credits: string[];
  imageFile: string;
}

export interface StaffMember extends Omit<StaffRecord, 'imageFile'> {
  /** Public URL under /cast, with optional subdirectory prefix in production. */
  imageUrl: string;
}

export type DaisyFrameTreatment = 'color' | 'period';

export interface DaisyBellFrame {
  id: string;
  order: number;
  title: string;
  treatment: DaisyFrameTreatment;
  beat: string;
  description: string;
  prompt: string;
  imageUrl?: string;
  tags: string[];
}

export interface DaisyBellSight {
  id: string;
  lyricCue: string | null;
  title: string;
  description: string;
}

export interface DaisyBellSequenceBeat {
  id: string;
  step: number;
  title: string;
  treatment: DaisyFrameTreatment | 'flip';
  summary: string;
}

export const imageKindMeta: Record<
  ImageKind,
  { label: string; description: string; accent: string }
> = {
  scene: {
    label: 'Scene',
    description: 'Locked production stills tied to episode beats.',
    accent: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  },
  suggestion: {
    label: 'Suggestion',
    description: 'Cutaway / gag prompts ready to generate — image optional.',
    accent: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
  },
  test: {
    label: 'Test Idea',
    description: 'Visual experiments and mood boards from ideas/.',
    accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  },
  character: {
    label: 'Character',
    description: 'Casting and continuity reference frames.',
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  },
};

export const daisyTreatmentMeta: Record<
  DaisyFrameTreatment,
  { label: string; short: string; accent: string; description: string }
> = {
  color: {
    label: 'Full color HD',
    short: 'Color',
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    description:
      'Crisp modern photography — wildflower field chroma, or Victorian London snapped into full HD while the street stays period.',
  },
  period: {
    label: 'Scratchy period film',
    short: 'Period',
    accent: 'border-stone-400/40 bg-stone-500/10 text-stone-200',
    description:
      'Intentional nitrate decay: grain, vertical scratches, flicker, soft focus, black-and-white or heavy sepia. The flower bike should still feel wrong — too alive for the century.',
  },
};
