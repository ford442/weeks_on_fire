/**
 * App-facing catalog types, derived from the Zod source schemas in `./schemas.ts`.
 *
 * Source records (what `content/` holds) and emitted records (what `src/data/generated/` exports)
 * differ only where codegen resolves a file path into a bundler import: `imagePath` → `imageUrl`,
 * `stillImagePath` → `stillUrl`, plus a few fields codegen derives. Those deltas are spelled out
 * here; every other field comes straight from the schema, so adding one is a one-file change.
 *
 * `src/data/types.ts` re-exports these. Type-only — nothing here runs in the app bundle.
 */
import type {
  CartoonRecord as CartoonSource,
  CutawaySegmentRecord,
  SceneBoardRecord,
  SceneFrameRecord,
  FilmSceneRecord,
  SequenceRecord as SequenceSource,
  SeriesCharacterRecord,
  CrewMemberRecord,
} from './schemas';
import type {
  CutawayFullRecord,
  CutawaySummaryRecord,
  SongRecord,
  SongSummary as SongSummaryRecord,
} from './record-schemas';

export type {
  CartoonStatus,
  CharacterBibleStatus,
  EpisodeFiles,
  EpisodeRecord,
  EpisodeStatus,
  ImageKind,
  MediaType,
  SequenceAspect,
  SequenceMedium,
  SceneBeat,
  SceneExtra,
  SceneLock,
  SceneTone,
  SceneTreatment,
  SceneVideo,
  SequenceRenderer,
  SightLane,
  CrewRole,
  SuggestionKind,
  SuggestionStatus,
  ProductionStatus,
} from './schemas';
export type { SightCandidateRecord as SightCandidate } from './schemas';
export type {
  ScheduleBlock,
  ScheduleRecord as Schedule,
  ScheduleSlot,
  ScheduleSponsor,
} from './schemas';
export type { TaxonomyEpisode, TaxonomyRecord as Taxonomy, TaxonomyTool } from './schemas';

/**
 * A responsive still from `vite-imagetools` (`?…&as=picture`, see `./image-variants.ts`): one
 * `srcset` per format, and the fallback image with its intrinsic size.
 */
export interface Picture {
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

type PictureKeyOf<UrlKey extends string> = UrlKey extends `${infer Stem}Url`
  ? `${Stem}Picture`
  : never;

/**
 * Codegen rewrites a source image path into an imported asset URL, and (for card stills) a
 * responsive `Picture` beside it.
 */
type ResolveImage<T, PathKey extends keyof T, UrlKey extends string> = Omit<T, PathKey> & {
  [K in UrlKey]?: string;
} & { [K in PictureKeyOf<UrlKey>]?: Picture };

/** List-view song fields: bundled, and in `public/catalog/songs/index.json`. */
export type SongSummary = SongSummaryRecord;
/** A full song (style prompt, lyrics, notes), fetched from `public/catalog/songs/<id>.json`. */
export type Song = SongRecord;

export type CutawaySegment = ResolveImage<CutawaySegmentRecord, 'stillImagePath', 'stillUrl'>;

/** List-view cutaway fields (no segments or sight bank, only their counts). */
export type CutawaySummary = CutawaySummaryRecord;

/**
 * A full cutaway, fetched from `public/catalog/cutaways/<id>.json`: `segmentsSource` /
 * `segmentStills` are resolved into `segments` by codegen, and each segment's repo still into a
 * bundled `stillUrl` by the loader.
 */
export type CutawaySuggestion = Omit<CutawayFullRecord, 'segments'> & {
  segments: CutawaySegment[];
};

export type FilmScene = ResolveImage<FilmSceneRecord, 'imagePath', 'imageUrl'>;
export type SeriesCharacter = ResolveImage<SeriesCharacterRecord, 'imagePath', 'imageUrl'>;
export type SceneFrame = ResolveImage<SceneFrameRecord, 'imagePath', 'imageUrl'>;
/** A scene board with each keyframe's `imagePath` resolved into an imported `imageUrl`. */
export type SceneBoard = Omit<SceneBoardRecord, 'frames'> & { frames: SceneFrame[] };

export type CrewRecord = CrewMemberRecord;
/** Site-facing crew member: `imageFile` becomes a public `/cast` URL. */
export type CrewMember = Omit<CrewRecord, 'imageFile'> & {
  /** Public URL under /cast, with optional subdirectory prefix in production. */
  imageUrl: string;
};

export type CartoonRecord = ResolveImage<CartoonSource, 'stillImagePath', 'stillUrl'>;

/** `renderer` is always present once codegen has derived it from the graph. */
export type SequenceRecord = ResolveImage<SequenceSource, 'stillImagePath', 'stillUrl'> &
  Required<Pick<SequenceSource, 'renderer'>>;
