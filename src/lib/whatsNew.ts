import { viewPaths } from '../routes/paths';

import type { WhatsNewEntry, WhatsNewKind } from '../data/generated/whats-new';

export const whatsNewKindLabel: Record<WhatsNewKind, string> = {
  song: 'Song',
  suggestion: 'Suggestion',
  cartoon: 'Cartoon',
  sequence: '3D sequence',
  video: 'Video',
  image: 'Image',
};

/**
 * In-app destination for a "What's new" card. Songs, suggestions, cartoons and sequences have a
 * detail route; gallery stills and clips open the archive searched for their title.
 */
export function whatsNewPath(entry: Pick<WhatsNewEntry, 'kind' | 'id' | 'title'>): string {
  const id = encodeURIComponent(entry.id);
  switch (entry.kind) {
    case 'song':
      return `${viewPaths.songs}/${id}`;
    case 'suggestion':
      return `${viewPaths.suggestions}/${id}`;
    case 'cartoon':
      return `${viewPaths.cartoons}/${id}`;
    case 'sequence':
      return `${viewPaths.sequences}/${id}`;
    case 'video':
    case 'image':
      return `${viewPaths.gallery}?q=${encodeURIComponent(entry.title)}`;
  }
}
