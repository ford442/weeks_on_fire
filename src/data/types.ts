import type {
  CartoonStatus,
  EpisodeStatus,
  ImageKind,
  SceneTone,
  SequenceMedium,
} from '../../scripts/content-index/catalog-types';

/**
 * Catalog record types are derived from the Zod schemas in `scripts/content-index/schemas.ts`
 * (see `catalog-types.ts`). Only UI chrome — labels and accent classes — is authored here.
 */
export type {
  CartoonRecord,
  CartoonStatus,
  CutawaySegment,
  CutawaySuggestion,
  CutawaySummary,
  EpisodeFiles,
  EpisodeRecord,
  EpisodeStatus,
  FilmScene,
  ImageKind,
  MediaType,
  Picture,
  ProductionStatus,
  SceneBeat,
  SceneBoard,
  SceneExtra,
  SceneFrame,
  SceneLock,
  SceneTone,
  SceneTreatment,
  SceneVideo,
  Schedule,
  ScheduleBlock,
  ScheduleSlot,
  ScheduleSponsor,
  SequenceAspect,
  SequenceMedium,
  SequenceRecord,
  SequenceRenderer,
  SeriesCharacter,
  SightCandidate,
  SightLane,
  Song,
  SongSummary,
  CrewMember,
  CrewRecord,
  CrewRole,
  SuggestionKind,
  Taxonomy,
  TaxonomyEpisode,
  TaxonomyTool,
} from '../../scripts/content-index/catalog-types';

export const imageKindMeta: Record<
  ImageKind,
  { label: string; description: string; accent: string }
> = {
  scene: {
    label: 'Scene',
    description: 'Locked production stills tied to episode beats.',
    accent: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  },
  test: {
    label: 'Test idea',
    description: 'Visual experiments and mood boards from ideas/.',
    accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  },
  character: {
    label: 'Character',
    description: 'Casting and continuity reference frames.',
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  },
};

export const episodeStatusMeta: Record<EpisodeStatus, { label: string; accent: string }> = {
  'synopsis-ready': {
    label: 'Synopsis ready',
    accent: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  },
  'in-production': {
    label: 'In production',
    accent: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  },
  candidate: {
    label: 'Candidate',
    accent: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
  },
};

export const cartoonStatusMeta: Record<CartoonStatus, { label: string; accent: string }> = {
  seed: {
    label: 'Seed',
    accent: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-200',
  },
  sketched: {
    label: 'Sketched',
    accent: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  },
  'ready-to-generate': {
    label: 'Ready to generate',
    accent: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  },
  promoted: {
    label: 'Promoted',
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  },
};

export const sequenceMediumMeta: Record<
  SequenceMedium,
  { label: string; accent: string; description: string }
> = {
  unreal: {
    label: 'Unreal',
    accent: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
    description: 'Impossible lattices, chrome ribbons, forms that do not occur in a kitchen.',
  },
  photoreal: {
    label: 'Photoreal',
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    description: 'Real-world objects and rooms — porcelain, brass, honey-oak, steam, moths.',
  },
  cartoon: {
    label: 'Cartoon',
    accent: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
    description: 'Cel-shaded 3D, rubber-hose limbs, TV-paint flats, thick ink.',
  },
  mixed: {
    label: 'Mixed',
    accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
    description:
      'A grounded scene that opens onto geometry, or geometry that pretends to be a room.',
  },
};

/**
 * Classes for every `SceneTone` a scene board, treatment or beat can name. Full class strings, not
 * built from the tone, so Tailwind sees them.
 */
export const sceneToneMeta: Record<
  SceneTone,
  {
    /** Bordered chip. */
    accent: string;
    /** Text color on its own, for labels set in the tone. */
    text: string;
    /** Placeholder tile behind a keyframe that has no still yet. */
    tile: string;
    /** Sparkle icon on that placeholder. */
    icon: string;
    /** Far end of the page-hero gradient. */
    hero: string;
  }
> = {
  emerald: {
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    text: 'text-emerald-300',
    tile: 'bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-black',
    icon: 'text-emerald-700/80',
    hero: 'to-emerald-950/30',
  },
  stone: {
    accent: 'border-stone-400/40 bg-stone-500/10 text-stone-200',
    text: 'text-stone-300',
    tile: 'bg-gradient-to-br from-stone-900 via-zinc-950 to-black',
    icon: 'text-stone-500',
    hero: 'to-stone-900/40',
  },
  orange: {
    accent: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
    text: 'text-orange-300',
    tile: 'bg-gradient-to-br from-orange-950/40 via-zinc-950 to-black',
    icon: 'text-orange-700/80',
    hero: 'to-orange-950/30',
  },
  sky: {
    accent: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
    text: 'text-sky-300',
    tile: 'bg-gradient-to-br from-sky-950/40 via-zinc-950 to-black',
    icon: 'text-sky-700/80',
    hero: 'to-sky-950/30',
  },
  violet: {
    accent: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
    text: 'text-violet-300',
    tile: 'bg-gradient-to-br from-violet-950/40 via-zinc-950 to-black',
    icon: 'text-violet-700/80',
    hero: 'to-violet-950/30',
  },
  cyan: {
    accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
    text: 'text-cyan-300',
    tile: 'bg-gradient-to-br from-cyan-950/40 via-zinc-950 to-black',
    icon: 'text-cyan-700/80',
    hero: 'to-cyan-950/30',
  },
  amber: {
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    text: 'text-amber-300',
    tile: 'bg-gradient-to-br from-amber-950/40 via-zinc-950 to-black',
    icon: 'text-amber-700/80',
    hero: 'to-amber-950/30',
  },
};
