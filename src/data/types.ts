import type {
  CartoonStatus,
  DaisyFrameTreatment,
  EpisodeStatus,
  ImageKind,
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
  DaisyBellFrame,
  DaisyBellSequenceBeat,
  DaisyBellSight,
  DaisyFrameTreatment,
  EpisodeFiles,
  EpisodeRecord,
  EpisodeStatus,
  FilmScene,
  ImageKind,
  MediaType,
  SequenceAspect,
  SequenceMedium,
  SequenceRecord,
  SequenceRenderer,
  SeriesCharacter,
  SightCandidate,
  SightLane,
  Song,
  StaffMember,
  StaffRecord,
  StaffRole,
  SuggestionKind,
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
