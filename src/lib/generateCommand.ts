import spec from '../../scripts/xai-api-spec.json';

import type { Generation } from '../../scripts/content-index/generation';

/**
 * The shell command that generates one cutaway segment on xAI Imagine: what the Suggestions
 * "Generate on xAI" block copies. It runs `scripts/xai-batch.py` with the segment's **effective**
 * settings spelled out as flags (the catalog's merged `generation`, else the runner's built-in
 * defaults from `scripts/xai-api-spec.json`), so the command reads, and behaves, the same whatever
 * the content later becomes. Needs `XAI_API_KEY` in the shell; the key is never part of it.
 */
export type GenerateKind = 'image' | 'video';

const SAFE = /^[A-Za-z0-9_./:=@%+,-]+$/;

/** One POSIX shell word: left bare when it has only safe characters, else single-quoted. */
export function shellQuote(value: string): string {
  if (SAFE.test(value)) return value;
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function flags(kind: GenerateKind, generation: Generation | undefined): string[] {
  if (kind === 'video') {
    const video = generation?.video;
    return [
      '--video',
      `--model ${shellQuote(video?.model ?? spec.video.defaultModel)}`,
      `--aspect ${shellQuote(video?.aspectRatio ?? spec.video.defaultAspectRatio)}`,
      ...(video?.resolution ? [`--resolution ${video.resolution}`] : []),
      // No --duration unless the content sets one: the runner then uses the segment's own timed
      // length, a rule that lives in one place (scripts/xai-batch.py).
      ...(video?.durationSec !== undefined ? [`--duration ${String(video.durationSec)}`] : []),
    ];
  }
  const image = generation?.image;
  return [
    `--model ${shellQuote(image?.model ?? spec.image.defaultModel)}`,
    `--aspect ${shellQuote(image?.aspectRatio ?? spec.image.defaultAspectRatio)}`,
    ...(image?.resolution ? [`--resolution ${image.resolution}`] : []),
    ...(image?.quality ? [`--quality ${image.quality}`] : []),
    ...(image?.responseFormat ? [`--response-format ${image.responseFormat}`] : []),
    ...(image?.n !== undefined && image.n !== 1 ? [`--n ${String(image.n)}`] : []),
  ];
}

export function buildGenerateCommand(
  cutawayId: string,
  segmentId: string,
  kind: GenerateKind,
  generation: Generation | undefined,
  { dryRun = false }: { dryRun?: boolean } = {},
): string {
  return [
    'python3 scripts/xai-batch.py',
    shellQuote(cutawayId),
    `--only ${shellQuote(segmentId)}`,
    ...flags(kind, generation),
    ...(dryRun ? ['--dry-run'] : []),
  ].join(' ');
}
