import { linkedAudioFilenames, songs } from '../data/songs';

import type { Song } from '../data/types';

export const albums = [
  {
    id: 'lace-waterfall',
    title: 'Lace Waterfall',
    artist: 'Lace Waterfall',
    description: 'Rock and metal from Lillith and Rubella, the fictional band from the show.',
  },
  {
    id: 'night-side',
    title: 'Night Side',
    artist: 'Nova Chen',
    description: 'Instrumental techno, house, and trance for late-night listening.',
  },
] as const;

export function belongsToAlbum(song: Song, albumId: string): boolean {
  return song.episode === albumId || song.tags.includes(albumId);
}

export const hasPublicAudio = (song: Song) =>
  Boolean(song.audioFile && linkedAudioFilenames.has(song.audioFile));

/** Public tracks: linked audio first; both groups are newest first. */
export function publicTracks(filter?: (song: Song) => boolean): {
  playable: Song[];
  upcoming: Song[];
} {
  const list = filter ? songs.filter(filter) : songs;
  const byNewest = (a: Song, b: Song) => b.added.localeCompare(a.added);
  return {
    playable: list.filter(hasPublicAudio).sort(byNewest),
    upcoming: list.filter((song) => !hasPublicAudio(song)).sort(byNewest),
  };
}

export const artistFor = (song: Song) =>
  albums.find((album) => belongsToAlbum(song, album.id))?.artist ?? 'Weeks of Fire';
