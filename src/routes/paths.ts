import type { SiteView } from '../components/SiteHeader';

export const viewPaths: Record<SiteView, string> = {
  gallery: '/',
  timeline: '/timeline',
  songs: '/songs',
  'daisy-bell': '/daisy-bell',
  suggestions: '/suggestions',
  cartoons: '/cartoons',
  sequences: '/sequences',
  characters: '/characters',
  episodes: '/episodes',
  staff: '/staff',
};

export function pathnameToView(pathname: string): SiteView {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/' || normalized === '') return 'gallery';
  if (normalized.startsWith('/songs')) return 'songs';
  if (normalized === '/timeline') return 'timeline';
  if (normalized === '/daisy-bell') return 'daisy-bell';
  if (normalized.startsWith('/suggestions')) return 'suggestions';
  if (normalized.startsWith('/cartoons')) return 'cartoons';
  if (normalized.startsWith('/sequences')) return 'sequences';
  if (normalized === '/characters') return 'characters';
  if (normalized.startsWith('/episodes')) return 'episodes';
  if (normalized === '/staff') return 'staff';

  return 'gallery';
}
