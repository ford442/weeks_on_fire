import { servedAudioPath } from '../../scripts/content-index/audio-names';
import { audioFilenames } from '../data/generated/songs';

import { publicPath } from './basePath';

const known = new Set(audioFilenames);

/**
 * URL for an mp3 in songs/. The files are copied to `dist/audio/` (and served there by the dev
 * server) under stable names, so the browser and the service worker cache them by one URL across
 * deploys, and no per-track JS chunk exists just to resolve a hashed asset name.
 */
export function songAudioUrl(filename: string): string | undefined {
  return known.has(filename) ? publicPath(servedAudioPath(filename)) : undefined;
}

/** Kept async so callers don't care how the URL is resolved. */
export function loadSongAudioUrl(filename: string): Promise<string | undefined> {
  return Promise.resolve(songAudioUrl(filename));
}

export function listAudioFilenames(): string[] {
  return [...audioFilenames];
}

function decodeAudioFilename(filename: string): string {
  return filename
    .replace(/\.mp3$/i, '')
    .replace(/\+/g, ' ')
    .replace(/_/g, ' ');
}

export interface UnlistedTrack {
  id: string;
  title: string;
  filename: string;
}

export function getUnlistedTracks(linkedFilenames: Set<string>): UnlistedTrack[] {
  return listAudioFilenames()
    .filter((filename) => !linkedFilenames.has(filename))
    .map((filename) => ({
      id: filename,
      title: decodeAudioFilename(filename),
      filename,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
