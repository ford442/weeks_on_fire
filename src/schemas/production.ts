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

// wof:production:episode-NN localStorage envelope. Bump this literal and add a
// migration branch here (rather than in productionStorage.ts) when the stored
// shape needs to change; unrecognized versions are rejected, not guessed at.
export const PRODUCTION_STORAGE_SCHEMA_VERSION = 1 as const;

export const StoredProductionSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_STORAGE_SCHEMA_VERSION),
  savedAt: z.string(),
  production: EpisodeProductionSchema,
});
export type StoredProduction = z.infer<typeof StoredProductionSchema>;

export function parseStoredProduction(data: unknown): EpisodeProduction | null {
  const result = StoredProductionSchema.safeParse(data);
  return result.success ? result.data.production : null;
}
