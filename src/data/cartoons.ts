import { cartoonRecords } from './generated/cartoons';

export type { CartoonRecord, CartoonStatus } from './types';
export { cartoonStatusMeta } from './types';

export const cartoons = cartoonRecords;

/** Local I2V loops live in public/cartoons and are gitignored. */
function sitePrefix(): string {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return '';
  const first = window.location.pathname.split('/').filter(Boolean)[0];
  if (first === 'weeks-on-fire' || first === 'weeks_on_fire') return `/${first}`;
  return '';
}

export function cartoonClipSrc(id: string): string {
  return `${sitePrefix()}/cartoons/${id}.mp4`;
}
