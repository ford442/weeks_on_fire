/**
 * Schemas for the records codegen **emits** (as opposed to `./schemas.ts`, which validates what
 * `content/` and `songs/` hold). Codegen parses every record it writes through these, and the app
 * parses every per-record JSON file it fetches through the same ones, so a drifted or hand-edited
 * `public/catalog/` file fails loudly instead of rendering half a record.
 *
 * Each heavy catalog has two shapes:
 *
 * - **Summary** — the list-view fields. Bundled into `src/data/generated/<kind>.ts` and written to
 *   `public/catalog/<kind>/index.json`.
 * - **Record** — the summary plus the long fields (lyrics, prompts, segments). Written only to
 *   `public/catalog/<kind>/<id>.json` and fetched when a detail view opens.
 */
import { z } from 'zod';

import {
  CutawaySchema,
  CutawaySegmentSchema,
  ProductionStatusSchema,
  SightCandidateSchema,
  SongFrontmatterSchema,
} from './schemas';

/** Catalog kinds that ship as an index plus one JSON file per record. */
export const RECORD_KINDS = ['songs', 'cutaways'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export const SongSummarySchema = SongFrontmatterSchema.omit({
  instrumental: true,
  audioFile: true,
  status: true,
}).extend({
  instrumental: z.boolean(),
  status: ProductionStatusSchema,
  audioFile: z.string().optional(),
  sourceFile: z.string(),
});

export const SongRecordSchema = SongSummarySchema.extend({
  stylePrompt: z.string(),
  lyrics: z.string().nullable(),
  notes: z.string().nullable(),
});

/** Keys that exist only on the full song record. */
export const SONG_DETAIL_KEYS = ['stylePrompt', 'lyrics', 'notes'] as const;

export const CutawaySummarySchema = CutawaySchema.omit({
  segmentsSource: true,
  segmentStills: true,
  segments: true,
  sightBank: true,
}).extend({
  segmentCount: z.number().int().nonnegative(),
  sightCount: z.number().int().nonnegative(),
});

/**
 * A segment as written to JSON. A still that lives in the repo keeps its `stillImagePath`; the app
 * resolves it to a bundled URL through `cutawayStillUrls` (images stay bundler assets, so they keep
 * their hashed names and any image pipeline that runs on them).
 */
export const CutawayRecordSegmentSchema = CutawaySegmentSchema;

export const CutawayRecordSchema = CutawaySummarySchema.extend({
  segments: z.array(CutawayRecordSegmentSchema),
  sightBank: z.array(SightCandidateSchema).optional(),
});

/** Keys that exist only on the full cutaway record. */
export const CUTAWAY_DETAIL_KEYS = ['segments', 'sightBank'] as const;

export type SongSummary = z.infer<typeof SongSummarySchema>;
export type SongRecord = z.infer<typeof SongRecordSchema>;
export type CutawaySummaryRecord = z.infer<typeof CutawaySummarySchema>;
export type CutawayFullRecord = z.infer<typeof CutawayRecordSchema>;

/** Drops `keys` from `record`: the summary is the record minus its detail fields. */
export function omitKeys<T extends object, K extends keyof T>(
  record: T,
  keys: readonly K[],
): Omit<T, K> {
  const out = { ...record };
  for (const key of keys) delete out[key];
  return out;
}
