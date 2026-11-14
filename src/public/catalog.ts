import { songs } from '../data/songs';

import type { Song } from '../data/types';

/** Public tracks: anything with committed audio, newest first. Lyric-only songs show as "coming soon". */
export function publicTracks(filter?: (song: Song) => boolean): {
  playable: Song[];
  upcoming: Song[];
} {
  const list = filter ? songs.filter(filter) : songs;
  const byNewest = (a: Song, b: Song) => b.added.localeCompare(a.added);
  return {
    playable: list.filter((song) => song.audioFile).sort(byNewest),
    upcoming: list.filter((song) => !song.audioFile).sort(byNewest),
  };
}

export const artistFor = (song: Song) =>
  song.episode === 'lace-waterfall' ? 'Lace Waterfall' : 'Weeks of Fire';
