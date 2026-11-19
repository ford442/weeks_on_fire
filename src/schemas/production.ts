// Shared Zod contract for production timeline + clip_stacker data.
// Used by src/data/production.ts (Timeline import/export) and src/lib/productionStorage.ts
// (wof:production:episode-NN localStorage wrapper) so both stay in lockstep with one schema.
// See docs/clip-stacker.md for the payload field reference.
import { z } from 'zod';

export const SCENE_STATUSES = ['draft', 'generated', 'approved', 'in-edit', 'final'] as const;
export const SceneStatusSchema = z.enum(SCENE_STATUSES);
export type SceneStatus = z.infer<typeof SceneStatusSchema>;

export const SceneHistoryEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  note: z.string(),
});
export type SceneHistoryEntry = z.infer<typeof SceneHistoryEntrySchema>;

// Optional pointers from a Timeline row to the catalog records that play in that slot. Every key
// is optional and validated only when present: a scene with just a prompt stays valid, "unset" is
// an omitted key (never ''), and ids — not titles — are what get stored (a scene's own title is
// the human label and diverges from catalog titles on purpose). `npm run codegen` checks each id
// in a committed scenes.json against the catalog it names; the editor can only pick known ids.
const CatalogIdSchema = z.string().min(1);

export const CatalogRefsSchema = z.object({
  songId: CatalogIdSchema.optional(),
  cutawayId: CatalogIdSchema.optional(),
  sequenceId: CatalogIdSchema.optional(),
  cartoonId: CatalogIdSchema.optional(),
  characterIds: z.array(CatalogIdSchema).min(1).optional(),
});
export type CatalogRefs = z.infer<typeof CatalogRefsSchema>;

export const CATALOG_REF_KEYS = [
  'songId',
  'cutawayId',
  'sequenceId',
  'cartoonId',
  'characterIds',
] as const satisfies readonly (keyof CatalogRefs)[];

/** Only the refs that are actually set, so "unset" stays an omitted key rather than '' or []. */
export function pickCatalogRefs(source: CatalogRefs): CatalogRefs {
  const refs: CatalogRefs = {};
  if (source.songId) refs.songId = source.songId;
  if (source.cutawayId) refs.cutawayId = source.cutawayId;
  if (source.sequenceId) refs.sequenceId = source.sequenceId;
  if (source.cartoonId) refs.cartoonId = source.cartoonId;
  if (source.characterIds?.length) refs.characterIds = [...source.characterIds];
  return refs;
}

/** Replaces every catalog ref on `target` with `refs`; keys not in `refs` are removed. */
export function withCatalogRefs<T extends CatalogRefs>(target: T, refs: CatalogRefs): T {
  const next: T = { ...target };
  for (const key of CATALOG_REF_KEYS) Reflect.deleteProperty(next, key);
  return Object.assign(next, pickCatalogRefs(refs));
}

export const ProductionSceneSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  timestamp: z.string(),
  description: z.string(),
  prompt: z.string().optional(),
  mediaUrl: z.string().optional(),
  status: SceneStatusSchema,
  addedAt: z.string(),
  lastEditedAt: z.string(),
  history: z.array(SceneHistoryEntrySchema),
  ...CatalogRefsSchema.shape,
});
export type ProductionScene = z.infer<typeof ProductionSceneSchema>;

export const EpisodeHistoryEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  note: z.string(),
});
export type EpisodeHistoryEntry = z.infer<typeof EpisodeHistoryEntrySchema>;

export const EpisodeProductionSchema = z.object({
  episode: z.string(),
  title: z.string(),
  lastUpdated: z.string(),
  scenes: z.array(ProductionSceneSchema),
  episodeHistory: z.array(EpisodeHistoryEntrySchema),
});
export type EpisodeProduction = z.infer<typeof EpisodeProductionSchema>;

export const CLIP_STACKER_VERSION = 'weeks_on_fire_v1' as const;

export const ClipStackerClipSchema = z.object({
  id: z.string(),
  title: z.string(),
  timestamp: z.string(),
  order: z.number(),
  status: SceneStatusSchema,
  mediaUrl: z.string().nullable(),
  description: z.string(),
  ...CatalogRefsSchema.shape,
});
export type ClipStackerClip = z.infer<typeof ClipStackerClipSchema>;

export const ClipStackerPayloadSchema = z.object({
  project: z.string(),
  version: z.literal(CLIP_STACKER_VERSION),
  exportedAt: z.string(),
  clips: z.array(ClipStackerClipSchema),
  episodeHistory: z.array(EpisodeHistoryEntrySchema),
});
export type ClipStackerPayload = z.infer<typeof ClipStackerPayloadSchema>;

export function parseClipStackerPayload(data: unknown): ClipStackerPayload | null {
  const result = ClipStackerPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}

// wof:production:episode-NN localStorage envelope. `schemaVersion` stays 1 while every new key is
// optional (v1 documents with or without the catalog refs both parse as-is). A shape change that
// old documents cannot satisfy bumps this literal, adds a `fromVersion[n]` step to the table below
// (n -> n+1, written as `fromV1`, `fromV2`, ...), and the saved edits are carried forward instead
// of dropped. Versions this build does not know, including future ones, are rejected.
export const PRODUCTION_STORAGE_SCHEMA_VERSION = 1 as const;

export const StoredProductionSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_STORAGE_SCHEMA_VERSION),
  savedAt: z.string(),
  production: EpisodeProductionSchema,
});
export type StoredProduction = z.infer<typeof StoredProductionSchema>;

// The envelope is read first, whatever its version; `production` is validated only after it has
// been brought up to the current shape.
const StoredEnvelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  savedAt: z.string(),
  production: z.unknown(),
});

export interface StoredProductionVersions<T> {
  /** The version this build writes, and the one `schema` validates. */
  current: number;
  schema: z.ZodType<T>;
  /** `fromVersion[n]` turns a version-n `production` payload into a version-(n+1) payload. */
  fromVersion: Readonly<Record<number, (production: unknown) => unknown>>;
}

/**
 * Builds a `(stored envelope) -> production | null` reader. Documents older than `current` are
 * walked up one `fromVersion` step at a time and then validated; anything newer than `current`,
 * a missing step, a throwing step, or a payload that fails `schema` returns null.
 */
export function createStoredProductionMigrator<T>(
  versions: StoredProductionVersions<T>,
): (data: unknown) => T | null {
  const { current, schema, fromVersion } = versions;

  return (data) => {
    const envelope = StoredEnvelopeSchema.safeParse(data);
    if (!envelope.success || envelope.data.schemaVersion > current) return null;

    let production = envelope.data.production;
    try {
      for (let version = envelope.data.schemaVersion; version < current; version += 1) {
        const step = fromVersion[version];
        if (!step) return null;
        production = step(production);
      }
    } catch {
      return null;
    }

    const parsed = schema.safeParse(production);
    return parsed.success ? parsed.data : null;
  };
}

const migrateCurrentStoredProduction = createStoredProductionMigrator({
  current: PRODUCTION_STORAGE_SCHEMA_VERSION,
  schema: EpisodeProductionSchema,
  // No steps yet: version 1 is the only version that has ever been written.
  fromVersion: {},
});

export function migrateStoredProduction(data: unknown): EpisodeProduction | null {
  return migrateCurrentStoredProduction(data);
}

export function parseStoredProduction(data: unknown): EpisodeProduction | null {
  return migrateStoredProduction(data);
}
