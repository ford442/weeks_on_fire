import { z } from 'zod';

import { GenerationSchema } from './generation';
import { PRODUCTION_STATUSES } from './statuses';
import { SequenceGraphSchema } from './graph-schema';

export const AddedDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'added must be YYYY-MM-DD');

/** Optional `added: YYYY-MM-DD` on non-song records; feeds the Overview "What's new" strip. */
const optionalAdded = AddedDateSchema.optional();

/**
 * Catalog links (see `validateCatalogLinks`). Ids only, validated against their catalog at codegen
 * time and emitted into `src/data/generated/catalog-graph.ts`. Omit a field rather than leave it empty.
 */
const linkId = z.string().min(1);
const linkIds = z.array(linkId).min(1);

export { PRODUCTION_STATUSES };
export const ProductionStatusSchema = z.enum(PRODUCTION_STATUSES);
export type ProductionStatus = z.infer<typeof ProductionStatusSchema>;

export const SongFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  added: AddedDateSchema,
  /** Family from `content/taxonomy.json` `genres`. */
  genre: z.string().min(1),
  /** Free-text style detail under the family, e.g. "Late-80s glam strut". */
  subgenre: z.string().min(1).optional(),
  description: z.string().min(1),
  /** Id from `content/taxonomy.json` `episodes`. */
  episode: z.string().min(1),
  /** Free-text placement detail under the episode, e.g. "Skeleton Union Break". */
  slot: z.string().min(1).optional(),
  tags: z.array(z.string()),
  instrumental: z.boolean().optional(),
  audioFile: z.string().nullable().optional(),
  /** Production stage. Omitted → `final` when the song has audio, else `generated`. */
  status: ProductionStatusSchema.optional(),
  /**
   * Episode Bible id (`content/episodes.json`) when the song belongs to one but `episode` is a
   * bucket (`cutaway`, `eyewash`, …). Omitted → derived from `episode` when that is an episode id.
   */
  episodeId: linkId.optional(),
});

export const CutawaySegmentSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  start: z.string(),
  end: z.string(),
  durationSec: z.number(),
  onScreen: z.string(),
  lyrics: z.string(),
  musicCue: z.string(),
  grokImaginePrompt: z.string(),
  geminiOmniPrompt: z.string(),
  promptVariations: z.array(z.string()),
  stillUrl: z.string().optional(),
  stillImagePath: z.string().optional(),
  previewUrl: z.string().optional(),
  /**
   * How this segment is generated on xAI. Inline segments may set it directly; either way codegen
   * overwrites it with the merged result (`generationDefaults` ← this ← `segmentGeneration[id]`).
   */
  generation: GenerationSchema.optional(),
});

export const SightLaneSchema = z.enum(['fall', 'ending']);

export const SightCandidateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  lane: SightLaneSchema,
  prompt: z.string().min(1),
  description: z.string().min(1),
});

export const SuggestionKindSchema = z.enum(['musical', 'gag', 'scene']);

export const SuggestionStatusSchema = ProductionStatusSchema;

export const CutawaySchema = z.object({
  id: z.string().min(1),
  kind: SuggestionKindSchema,
  title: z.string().min(1),
  /** Day the record was added (YYYY-MM-DD). */
  added: optionalAdded,
  status: SuggestionStatusSchema,
  runtime: z.string(),
  episode: z.string(),
  songId: z.string(),
  songTitle: z.string(),
  summary: z.string(),
  visualArc: z.string(),
  tags: z.array(z.string()),
  segmentsSource: z.string().optional(),
  segmentStills: z.record(z.string(), z.string()).optional(),
  /** xAI settings for every segment (`scripts/xai-api-spec.json` lists the values). */
  generationDefaults: GenerationSchema.optional(),
  /**
   * Per-segment overrides of `generationDefaults`, keyed by segment id. Needed for
   * `segmentsSource` cutaways, whose segments are parsed from markdown and can carry no fields.
   */
  segmentGeneration: z.record(z.string(), GenerationSchema).optional(),
  segments: z.array(CutawaySegmentSchema).optional(),
  sightBank: z.array(SightCandidateSchema).optional(),
  /** Cast on screen: ids from `content/characters.json`. */
  characterIds: linkIds.optional(),
  /** Episode Bible id (`content/episodes.json`); `episode` stays the free-text placement. */
  episodeId: linkId.optional(),
  /** The cartoon this cutaway was promoted from; that cartoon must name it in `promotedToCutawayId`. */
  promotedFromCartoonId: linkId.optional(),
  /** 3D sequences (`content/sequences/`) cut into this cutaway. */
  sequenceInsertIds: linkIds.optional(),
});

/** A clock time as `HH:MM`, 24-hour. */
export const ClockSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:MM, 24-hour (e.g. "02:00")');

/**
 * A fake sponsor spot for the EyeWash Station schedule. Copy is transcribed from the ident pack
 * (`ideas/eyewash-idents.md`); the full spot (still, VO) stays there.
 */
export const ScheduleSponsorSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  /** The spot's opening line, verbatim. */
  tagline: z.string().min(1),
  smallPrint: z.string().min(1).optional(),
});

/** One timed airing of a cutaway. Slots are authored in broadcast order. */
export const ScheduleSlotSchema = z.strictObject({
  /** Clock time the slot starts, `HH:MM` 24-hour. It runs until the next slot starts. */
  at: ClockSchema,
  /** The cutaway that airs (`content/cutaways/<id>.json`). */
  cutawayId: z.string().min(1),
  /** A repeat of a cutaway that already aired earlier in the day. The first airing is never a rerun. */
  rerun: z.boolean().optional(),
  /** Sponsor spot (`sponsors[].id`) that airs in the ad break after this slot. */
  adBreak: z.string().min(1).optional(),
});

/** A named run of slots: "Continuing Education", "The Two at Eleven". */
export const ScheduleBlockSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  /** How the station words the slot ("Weekday mid-morning", "Whenever, unannounced"). */
  when: z.string().min(1),
  /** What airs in the block, one line. */
  about: z.string().min(1),
  slots: z.array(ScheduleSlotSchema).min(1),
});

/**
 * The EyeWash Station rundown (`content/schedule.json`): one broadcast day, looping. It arranges
 * existing cutaways in time; it never holds a cutaway idea of its own (those live once, in
 * `content/cutaways/`). Cutaways with no slot show as unscheduled.
 */
export const ScheduleSchema = z.strictObject({
  station: z.string().min(1),
  channel: z.string().min(1),
  sponsors: z.array(ScheduleSponsorSchema),
  blocks: z.array(ScheduleBlockSchema).min(1),
});

/**
 * Archive lanes for stills. There is deliberately no `suggestion` lane: cutaway and gag ideas live
 * once, in `content/cutaways/`, and the Suggestions view is their only home.
 */
export const ImageKindSchema = z.enum(['scene', 'test', 'character']);

export const MediaTypeSchema = z.enum(['image', 'video']);

export const FilmSceneSchema = z.object({
  id: z.string().min(1),
  imageKind: ImageKindSchema,
  /** Production stage, independent of `imageKind` (the archive lane) and `mediaType`. */
  status: ProductionStatusSchema,
  /** Day the record was added (YYYY-MM-DD). */
  added: optionalAdded,
  /** Id from `content/taxonomy.json` `episodes`. */
  episode: z.string().min(1),
  /** Free-text placement detail under the episode, e.g. "Short packet farm". */
  slot: z.string().min(1).optional(),
  /** Id from `content/taxonomy.json` `tools`, when a generator is worth filtering on. */
  tool: z.string().min(1).optional(),
  title: z.string(),
  prompt: z.string(),
  promptVariations: z.array(z.string()),
  imagePath: z.string().optional(),
  mediaType: MediaTypeSchema,
  musicCue: z.string(),
  musicStyle: z.string(),
  description: z.string(),
  /** Entry from `content/taxonomy.json` `themes`: a recurring visual motif, not a category. */
  theme: z.string().min(1),
  tags: z.array(z.string()),
});

export const TaxonomyEpisodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z.string().min(1),
});

export const TaxonomyToolSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const TaxonomySchema = z.object({
  episodes: z.array(TaxonomyEpisodeSchema).min(1),
  genres: z.array(z.string().min(1)).min(1),
  themes: z.array(z.string().min(1)).min(1),
  tools: z.array(TaxonomyToolSchema),
});

export const CharacterBibleStatusSchema = z.enum(['concept', 'active', 'recurring', 'retired']);

export const SeriesCharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  nameNote: z.string().optional(),
  role: z.string(),
  episodes: z.array(z.string()),
  traits: z.array(z.string()),
  bio: z.string(),
  props: z.array(z.string()),
  tags: z.array(z.string()),
  imagePath: z.string().optional(),
  /** Relationship-map cluster name (see characters/bible/relationship-map.md), e.g. "The Two". */
  cluster: z.string().min(1).optional(),
  /** Character bible status legend (characters/bible/README.md#status-legend). */
  bibleStatus: CharacterBibleStatusSchema.optional(),
  /** Repo-relative path to a committed character bible sheet, for a deep link. */
  bibleSheet: z.string().min(1).optional(),
});

/** Accent a treatment, beat or whole scene board is drawn in. Classes live in `src/data/types.ts`. */
export const SCENE_TONES = [
  'emerald',
  'stone',
  'orange',
  'sky',
  'violet',
  'cyan',
  'amber',
] as const;
export const SceneToneSchema = z.enum(SCENE_TONES);

/** A named look a scene is shot in, e.g. "Full color HD" vs "Scratchy period film". */
export const SceneTreatmentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Chip text; also the filter label on the keyframe board. */
  short: z.string().min(1),
  tone: SceneToneSchema,
  description: z.string().min(1),
  /** Draw this treatment's stills in black and white, whatever the file holds. */
  grayscale: z.boolean().optional(),
});

/** A copy-ready prompt block pasted into every re-roll of the scene. */
export const SceneLockSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1),
});

export const SceneBeatSchema = z.object({
  id: z.string().min(1),
  step: z.number(),
  title: z.string().min(1),
  summary: z.string().min(1),
  /** Treatment id the beat is shot in; omitted when the beat has no single look. */
  treatment: z.string().min(1).optional(),
});

export const SceneFrameSchema = z.object({
  id: z.string().min(1),
  order: z.number(),
  title: z.string().min(1),
  /** Treatment id from the board's `treatments`; omitted for a single-look scene. */
  treatment: z.string().min(1).optional(),
  beat: z.string(),
  description: z.string(),
  prompt: z.string(),
  imagePath: z.string().optional(),
  tags: z.array(z.string()),
});

export const SceneExtraSchema = z.object({
  id: z.string().min(1),
  /** The lyric or line this extra lands on, when there is one. */
  cue: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().min(1),
});

/** A finished or in-progress cut of the scene: a slideshow or a generated clip. */
export const SceneVideoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(['slideshow', 'clip']),
  /** Direct file (mp4/webm plays in the page) or a page to open. Large video is linked, not committed. */
  url: z.string().url(),
  /** Same pipeline as every other tab; see `PRODUCTION_STATUSES`. */
  status: ProductionStatusSchema,
  runtime: z.string().optional(),
  note: z.string().optional(),
});

/**
 * A scene with its own page: pitch, locks, sequence, keyframe board and finished video. One file
 * per scene in `content/scenes/<id>.json`; every scene renders through the same template.
 *
 * Not the Timeline's `ProductionScene` (an episode slot) or the archive's `FilmScene` (a still);
 * "board" is what the hub already calls a keyframe board.
 */
export const SceneBoardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  /** Eyebrow above the title, e.g. "Musical cutaway". */
  format: z.string().optional(),
  /** Who is on screen, e.g. "Rubella & Lillith". */
  cast: z.string().optional(),
  status: ProductionStatusSchema,
  /** Accent for the page hero. Defaults to the hub orange. */
  tone: SceneToneSchema.optional(),
  /** Song id from `songs/*.md`; the page plays that song's audio. */
  songId: z.string().min(1).optional(),
  /** Repo-relative concept doc, shown to the crew in edit mode. */
  conceptFile: z.string().min(1).optional(),
  pitch: z.string().min(1),
  /** Cast on screen: ids from `content/characters.json`. `cast` stays the display line. */
  characterIds: linkIds.optional(),
  /** Short continuity note: what never changes between takes. */
  continuity: z.string().optional(),
  locks: z.array(SceneLockSchema),
  treatments: z.array(SceneTreatmentSchema),
  beats: z.array(SceneBeatSchema),
  frames: z.array(SceneFrameSchema),
  extras: z
    .object({
      heading: z.string().min(1),
      items: z.array(SceneExtraSchema),
    })
    .optional(),
  videos: z.array(SceneVideoSchema),
});

export const CrewRoleSchema = z.enum([
  'Writer',
  'Producer',
  'Director',
  'Music Supervisor',
  'Visual Designer',
]);

export const CrewMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: CrewRoleSchema,
  location: z.string().min(1),
  yearsOnSeries: z.string().min(1),
  specialty: z.string().min(1),
  bio: z.string().min(1),
  quote: z.string().min(1),
  credits: z.array(z.string()),
  /** Filename under public/cast/ (copied to dist/cast on Vite build). */
  imageFile: z.string().min(1),
});

export const EpisodeStatusSchema = z.enum(['synopsis-ready', 'in-production', 'candidate']);

export const EpisodeFilesSchema = z.object({
  synopsis: z.string().optional(),
  scenes: z.string().optional(),
  screenplay: z.string().optional(),
  subtitles: z.string().optional(),
  notes: z.string().optional(),
  seasonArc: z.string().optional(),
});

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  number: z.number(),
  title: z.string().min(1),
  register: z.string().optional(),
  status: EpisodeStatusSchema,
  runtime: z.string().optional(),
  logline: z.string().min(1),
  isCandidate: z.boolean().optional(),
  files: EpisodeFilesSchema,
});

export const CartoonStatusSchema = z.enum(['seed', 'sketched', 'ready-to-generate', 'promoted']);

export const CartoonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  premise: z.string().min(1),
  visual: z.string().min(1),
  /** Day the record was added (YYYY-MM-DD). */
  added: optionalAdded,
  status: CartoonStatusSchema,
  tags: z.array(z.string()),
  runtime: z.string().optional(),
  register: z.string().optional(),
  characterLean: z.string().optional(),
  grokImaginePrompt: z.string().optional(),
  motion: z.string().optional(),
  notes: z.string().optional(),
  agent: z.string().optional(),
  stillImagePath: z.string().optional(),
  /**
   * The Suggestions cutaway this seed was promoted to. Required when `status` is `promoted` (and
   * only then); the cutaway must point back with `promotedFromCartoonId`.
   */
  promotedToCutawayId: linkId.optional(),
});

export const SequenceMediumSchema = z.enum(['unreal', 'photoreal', 'cartoon', 'mixed']);

export const SequenceAspectSchema = z.enum(['16:9', '4:3']);

export const SequenceRendererSchema = z.enum(['graph', 'custom']);

export const SequenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  medium: SequenceMediumSchema,
  /** Day the record was added (YYYY-MM-DD). */
  added: optionalAdded,
  runtime: z.string().min(1),
  durationSec: z.number().min(10).max(120),
  premise: z.string().min(1),
  visual: z.string().min(1),
  motion: z.string().min(1),
  tags: z.array(z.string()),
  aspect: SequenceAspectSchema.optional(),
  register: z.string().optional(),
  grokImaginePrompt: z.string().optional(),
  geminiOmniPrompt: z.string().optional(),
  notes: z.string().optional(),
  agent: z.string().optional(),
  stillImagePath: z.string().optional(),
  /** Cutaways this sequence belongs with. Sequences still never carry a `songId`. */
  relatedCutawayIds: linkIds.optional(),
  /** Cast in the sequence: ids from `content/characters.json`. */
  characterIds: linkIds.optional(),
  /**
   * `graph`: played from a scene graph (`<id>.graph.json` or the `graph` key). `custom`: a
   * hand-written factory in `src/sequences/scenes/index.ts`. Derived from the graph when omitted.
   */
  renderer: SequenceRendererSchema.optional(),
  graph: SequenceGraphSchema.optional(),
});

export type TaxonomyEpisode = z.infer<typeof TaxonomyEpisodeSchema>;
export type TaxonomyTool = z.infer<typeof TaxonomyToolSchema>;
export type TaxonomyRecord = z.infer<typeof TaxonomySchema>;
export type SongFrontmatter = z.infer<typeof SongFrontmatterSchema>;
export type CutawaySegmentRecord = z.infer<typeof CutawaySegmentSchema>;
export type SightCandidateRecord = z.infer<typeof SightCandidateSchema>;
export type CutawayRecord = z.infer<typeof CutawaySchema>;
export type ScheduleSponsor = z.infer<typeof ScheduleSponsorSchema>;
export type ScheduleSlot = z.infer<typeof ScheduleSlotSchema>;
export type ScheduleBlock = z.infer<typeof ScheduleBlockSchema>;
export type ScheduleRecord = z.infer<typeof ScheduleSchema>;
export type FilmSceneRecord = z.infer<typeof FilmSceneSchema>;
export type SeriesCharacterRecord = z.infer<typeof SeriesCharacterSchema>;
export type CharacterBibleStatus = z.infer<typeof CharacterBibleStatusSchema>;
export type CrewRole = z.infer<typeof CrewRoleSchema>;
export type CrewMemberRecord = z.infer<typeof CrewMemberSchema>;
export type EpisodeStatus = z.infer<typeof EpisodeStatusSchema>;
export type EpisodeFiles = z.infer<typeof EpisodeFilesSchema>;
export type EpisodeRecord = z.infer<typeof EpisodeSchema>;
export type CartoonStatus = z.infer<typeof CartoonStatusSchema>;
export type CartoonRecord = z.infer<typeof CartoonSchema>;
export type SequenceMedium = z.infer<typeof SequenceMediumSchema>;
export type SequenceAspect = z.infer<typeof SequenceAspectSchema>;
export type SequenceRecord = z.infer<typeof SequenceSchema>;
export type SightLane = z.infer<typeof SightLaneSchema>;
export type SuggestionKind = z.infer<typeof SuggestionKindSchema>;
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>;
export type ImageKind = z.infer<typeof ImageKindSchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type SequenceRenderer = z.infer<typeof SequenceRendererSchema>;
export type SceneTone = z.infer<typeof SceneToneSchema>;
export type SceneTreatment = z.infer<typeof SceneTreatmentSchema>;
export type SceneLock = z.infer<typeof SceneLockSchema>;
export type SceneBeat = z.infer<typeof SceneBeatSchema>;
export type SceneFrameRecord = z.infer<typeof SceneFrameSchema>;
export type SceneExtra = z.infer<typeof SceneExtraSchema>;
export type SceneVideo = z.infer<typeof SceneVideoSchema>;
export type SceneBoardRecord = z.infer<typeof SceneBoardSchema>;
