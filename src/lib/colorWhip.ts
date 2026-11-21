/**
 * Color Whip's eight segment dialects. With no still linked, the preview shows each as a live CSS
 * field (`.color-whip-field--*` in `src/styles.css`); a capture draws the same field on canvas
 * (`src/lib/capture/compositor.ts`).
 */
export const COLOR_WHIP_DIALECTS = [
  'strobe',
  'whip',
  'phosphor',
  'smash',
  'chase',
  'cuts',
  'vortex',
  'hit',
] as const;

export type ColorWhipDialect = (typeof COLOR_WHIP_DIALECTS)[number];

export function colorWhipDialect(segmentId: string): ColorWhipDialect | null {
  const match = /color-whip-[a-h]-([a-z]+)/.exec(segmentId);
  const dialect = match?.[1];
  if (!dialect) return null;
  return (COLOR_WHIP_DIALECTS as readonly string[]).includes(dialect)
    ? (dialect as ColorWhipDialect)
    : null;
}
