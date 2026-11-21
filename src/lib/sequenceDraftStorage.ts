/**
 * Graph editor drafts, one per sequence id, in this browser only (the hub never writes to the
 * repo). The JSON is kept as text, invalid or not, so a half-typed edit survives a reload.
 * Same shape as `productionStorage.ts`: a versioned payload under a `wof:` key.
 */

export const SEQUENCE_DRAFT_SCHEMA_VERSION = 1;
const PREFIX = 'wof:sequence-graph:';

export interface SequenceDraft {
  schemaVersion: number;
  savedAt: string;
  /** The catalog sequence this draft started from. */
  forkedFrom: string;
  text: string;
}

function storageKey(id: string): string {
  return `${PREFIX}${id}`;
}

function isDraft(value: unknown): value is SequenceDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    draft.schemaVersion === SEQUENCE_DRAFT_SCHEMA_VERSION &&
    typeof draft.savedAt === 'string' &&
    typeof draft.forkedFrom === 'string' &&
    typeof draft.text === 'string'
  );
}

export function loadDraft(id: string): SequenceDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Saves `text` as the draft for `id`; false when storage is full or blocked (private mode). */
export function saveDraft(id: string, text: string, forkedFrom: string): boolean {
  const payload: SequenceDraft = {
    schemaVersion: SEQUENCE_DRAFT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    forkedFrom,
    text,
  };
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(id: string): void {
  try {
    localStorage.removeItem(storageKey(id));
  } catch {
    // Blocked storage: nothing was saved either.
  }
}

/** Every draft in this browser, newest first. */
export function listDrafts(): { id: string; savedAt: string; forkedFrom: string }[] {
  const drafts: { id: string; savedAt: string; forkedFrom: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      if (!name?.startsWith(PREFIX)) continue;
      const id = name.slice(PREFIX.length);
      const draft = loadDraft(id);
      if (draft) drafts.push({ id, savedAt: draft.savedAt, forkedFrom: draft.forkedFrom });
    }
  } catch {
    return [];
  }
  return drafts.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
