import type { SiteView } from '../components/SiteHeader';

/**
 * Last path + query string seen per view, so returning to a tab restores its selection, search,
 * and filters (all of which live in the URL).
 */
const lastLocation = new Map<SiteView, string>();

export function rememberViewLocation(view: SiteView, pathname: string, search: string): void {
  lastLocation.set(view, pathname + search);
}

export function rememberedViewLocation(view: SiteView, fallbackPath: string): string {
  return lastLocation.get(view) ?? fallbackPath;
}
