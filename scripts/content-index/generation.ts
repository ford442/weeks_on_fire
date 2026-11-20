import { z } from 'zod';

import spec from '../xai-api-spec.json';

/**
 * `generationDefaults` (and the per-segment overrides): how a cutaway wants its stills and clips
 * made on the xAI Imagine API. Authored in `content/cutaways/<id>.json`, validated here against
 * the same `scripts/xai-api-spec.json` the Python runner reads, and emitted on every segment of
 * `public/catalog/cutaways/<id>.json` as the already-merged `generation` block, so the Suggestions
 * "copy generate command" button and `scripts/xai-batch.py` see identical values.
 *
 * Every field is optional: whatever a cutaway does not say falls through to the runner's built-in
 * default (`spec.image.defaultModel`, 16:9, ...). Keys are the API's, in camelCase.
 */
export const XAI_SPEC = spec;

const oneOf = (values: readonly string[]) => z.enum(values as [string, ...string[]]);
const model = z.string().min(1);

export const ImageGenerationSchema = z.strictObject({
  model: model.optional(),
  aspectRatio: oneOf(spec.image.aspectRatios).optional(),
  resolution: oneOf(spec.image.resolutions).optional(),
  /** Only `spec.image.qualityModels` accept it; see {@link generationIssues}. */
  quality: oneOf(spec.image.qualities).optional(),
  /** Images per request. More than one is saved as `<segment>.jpg`, `<segment>-2.jpg`, ... */
  n: z.number().int().min(1).max(spec.image.maxCount).optional(),
  responseFormat: oneOf(spec.image.responseFormats).optional(),
});

export const VideoGenerationSchema = z.strictObject({
  model: model.optional(),
  aspectRatio: oneOf(spec.video.aspectRatios).optional(),
  resolution: oneOf(spec.video.resolutions).optional(),
  /** Omitted → the segment's own timed length (clamped to the API range), else the API default. */
  durationSec: z
    .number()
    .int()
    .min(spec.video.minDurationSec)
    .max(spec.video.maxDurationSec)
    .optional(),
});

export const GenerationSchema = z.strictObject({
  image: ImageGenerationSchema.optional(),
  video: VideoGenerationSchema.optional(),
});

export type ImageGeneration = z.infer<typeof ImageGenerationSchema>;
export type VideoGeneration = z.infer<typeof VideoGenerationSchema>;
export type Generation = z.infer<typeof GenerationSchema>;

/**
 * Later layers win, field by field and per medium: a segment that sets `image.aspectRatio` keeps the
 * cutaway's `image.model`. Returns `undefined` when no layer says anything, so records without
 * generation settings stay byte-identical.
 */
export function mergeGeneration(
  ...layers: ReadonlyArray<Generation | undefined>
): Generation | undefined {
  const image: ImageGeneration = {};
  const video: VideoGeneration = {};
  for (const layer of layers) {
    Object.assign(image, layer?.image);
    Object.assign(video, layer?.video);
  }
  const merged: Generation = {
    ...(Object.keys(image).length > 0 ? { image } : {}),
    ...(Object.keys(video).length > 0 ? { video } : {}),
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Cross-field problems in an **effective** (already merged) config, which no single field's enum
 * can catch. Checked after merging because a cutaway default `quality` is fine when the segment
 * that inherits it also gets a model that supports it.
 */
export function generationIssues(generation: Generation): string[] {
  const issues: string[] = [];
  const { image } = generation;
  if (image?.quality !== undefined) {
    const effectiveModel = image.model ?? spec.image.defaultModel;
    if (!spec.image.qualityModels.includes(effectiveModel)) {
      issues.push(
        `image.quality "${image.quality}" is only supported on ${spec.image.qualityModels.join(', ')}, ` +
          `but the model here is ${effectiveModel}` +
          (image.model === undefined ? ' (the default). Set image.model' : '. Change image.model'),
      );
    }
  }
  return issues;
}

/**
 * Codegen errors for one loaded cutaway (segments already carry their merged `generation`):
 * `segmentGeneration` keys that name no segment, and cross-field problems in any segment's
 * effective config. Segments that share a problem are reported together, once.
 */
export function generationErrors(cutaway: {
  id: string;
  segments?: ReadonlyArray<{ id: string; generation?: Generation }>;
  segmentGeneration?: Readonly<Record<string, unknown>>;
}): string[] {
  const errors: string[] = [];
  const segments = cutaway.segments ?? [];

  const known = new Set(segments.map((segment) => segment.id));
  const unknown = Object.keys(cutaway.segmentGeneration ?? {}).filter((id) => !known.has(id));
  if (unknown.length > 0) {
    errors.push(
      `Cutaway ${cutaway.id}: segmentGeneration names unknown segment id(s): ${unknown.join(', ')}` +
        ` (segments: ${[...known].join(', ') || 'none'})`,
    );
  }

  const segmentsByIssue = new Map<string, string[]>();
  for (const segment of segments) {
    for (const issue of segment.generation ? generationIssues(segment.generation) : []) {
      segmentsByIssue.set(issue, [...(segmentsByIssue.get(issue) ?? []), segment.id]);
    }
  }
  for (const [issue, ids] of segmentsByIssue) {
    errors.push(`Cutaway ${cutaway.id}: ${issue} (segment ${ids.join(', ')})`);
  }
  return errors;
}
