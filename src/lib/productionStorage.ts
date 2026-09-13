import type { EpisodeProduction } from '../data/production';
import { PRODUCTION_STORAGE_SCHEMA_VERSION, parseStoredProduction } from '../schemas/production';

function storageKey(episode: string): string {
  return `wof:production:episode-${episode}`;
}

export function productionsEqual(a: EpisodeProduction, b: EpisodeProduction): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function loadStored(episode: string): EpisodeProduction | null {
  try {
    const raw = localStorage.getItem(storageKey(episode));
    if (!raw) return null;

    return parseStoredProduction(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStored(episode: string, production: EpisodeProduction): void {
  const payload = {
    schemaVersion: PRODUCTION_STORAGE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    production,
  };
  localStorage.setItem(storageKey(episode), JSON.stringify(payload));
}

export function clearStored(episode: string): void {
  localStorage.removeItem(storageKey(episode));
}
