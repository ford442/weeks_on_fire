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
  CutawayRecord,
  CutawaySegmentRecord,
  DaisyBellFrameRecord,
  FilmSceneRecord,
  SequenceRecord as SequenceSource,
  SeriesCharacterRecord,
  SongFrontmatter,
  StaffMemberRecord,
} from './schemas';

export type {
  CartoonStatus,
  DaisyBellSequenceBeat,
  DaisyBellSight,
  DaisyFrameTreatment,
  EpisodeFiles,
  EpisodeRecord,
  EpisodeStatus,
  ImageKind,
  MediaType,
  SequenceAspect,
  SequenceMedium,
  SequenceRenderer,
  SightLane,
  StaffRole,
  SuggestionKind,
  SuggestionStatus,
} from './schemas';
export type { SightCandidateRecord as SightCandidate } from './schemas';

/** Codegen rewrites a source image path into an imported asset URL. */
type ResolveImage<T, PathKey extends keyof T, UrlKey extends string> = Omit<T, PathKey> & {
  [K in UrlKey]?: string;
};

export type Song = Omit<SongFrontmatter, 'instrumental' | 'audioFile'> & {
  instrumental: boolean;
  audioFile?: string;
  stylePrompt: string;
  lyrics: string | null;
  notes: string | null;
  sourceFile: string;
};

export type CutawaySegment = ResolveImage<CutawaySegmentRecord, 'stillImagePath', 'stillUrl'>;

/** `segmentsSource` / `segmentStills` are resolved into `segments` by codegen. */
export type CutawaySuggestion = Omit<
  CutawayRecord,
  'segmentsSource' | 'segmentStills' | 'segments'
> & {
  segments: CutawaySegment[];
};

export type FilmScene = ResolveImage<FilmSceneRecord, 'imagePath', 'imageUrl'>;
export type SeriesCharacter = ResolveImage<SeriesCharacterRecord, 'imagePath', 'imageUrl'>;
export type DaisyBellFrame = ResolveImage<DaisyBellFrameRecord, 'imagePath', 'imageUrl'>;

export type StaffRecord = StaffMemberRecord;
/** Site-facing staff member: `imageFile` becomes a public `/cast` URL. */
export type StaffMember = Omit<StaffRecord, 'imageFile'> & {
  /** Public URL under /cast, with optional subdirectory prefix in production. */
  imageUrl: string;
};

export type CartoonRecord = ResolveImage<CartoonSource, 'stillImagePath', 'stillUrl'>;

/** `renderer` is always present once codegen has derived it from the graph. */
export type SequenceRecord = ResolveImage<SequenceSource, 'stillImagePath', 'stillUrl'> &
  Required<Pick<SequenceSource, 'renderer'>>;
