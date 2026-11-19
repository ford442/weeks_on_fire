import { SongRecordSchema } from '../../scripts/content-index/record-schemas';

import { songs } from './generated/songs';
import { fetchRecord, prefetch, useRecord, type RecordSource } from './records';

import type { Song } from './types';

export type { Song, SongSummary } from './types';
export { songs, linkedAudioFilenames, audioFilenames } from './generated/songs';

const songSource: RecordSource<Song> = {
  kind: 'songs',
  known: new Set(songs.map((song) => song.id)),
  parse: (raw) => SongRecordSchema.parse(raw),
};

/** Full song (style prompt, lyrics, notes) from `public/catalog/songs/<id>.json`. */
export const loadSong = (id: string): Promise<Song> => fetchRecord(songSource, id);
export const prefetchSong = (id: string): void => prefetch(songSource, id);
export const useSongRecord = (id: string | undefined) => useRecord(songSource, id);
