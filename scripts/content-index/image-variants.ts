/**
 * Responsive variants for repo stills. Codegen imports each card still a second time with this
 * query; `vite-imagetools` turns it into a `Picture` (AVIF + WebP + a fallback in the source's own
 * format, at each width, plus the fallback's intrinsic size), which `<Still>` renders as
 * `<picture>` with `srcset` / `sizes` and `width` / `height` so the card reserves its space.
 * The plain import (the original file) stays for the lightbox and anything that needs one URL.
 */
export const STILL_WIDTHS = [480, 960, 1440] as const;

const fallbackFormat: Record<string, string> = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

/** The import query for `path`, or `null` when the file is not a raster format we re-encode. */
export function pictureQuery(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const fallback = fallbackFormat[ext];
  if (!fallback) return null;
  const formats = [...new Set(['avif', 'webp', fallback])].join(';');
  return `?w=${STILL_WIDTHS.join(';')}&format=${formats}&as=picture`;
}
