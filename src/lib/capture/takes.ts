/**
 * Takes recorded in this tab. Held as `blob:` URLs in memory only: nothing here is persisted, and
 * every take is gone when the tab closes. Download a take, host it (Drive / Imgur), and paste the
 * hosted link into the Timeline to keep it. Binary captures never go into git.
 */

export type TakeSourceKind = 'sequence' | 'cutaway';

export interface CaptureTake {
  id: string;
  kind: TakeSourceKind;
  /** Catalog id of what was recorded (sequence or cutaway). */
  sourceId: string;
  title: string;
  /** `blob:` URL; playable in this tab only. */
  url: string;
  fileName: string;
  mimeType: string;
  /** What the file reports. */
  durationSec: number;
  /** What the catalog says one full take runs. */
  expectedDurationSec: number;
  sizeBytes: number;
  createdAt: string;
}

export interface NewTake {
  kind: TakeSourceKind;
  sourceId: string;
  title: string;
  blob: Blob;
  extension: string;
  durationSec: number;
  expectedDurationSec: number;
}

type Listener = () => void;

let takes: readonly CaptureTake[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function stamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/** `wof-sequence-hose-chase-20261121-041500.webm` */
export function takeFileName(
  kind: TakeSourceKind,
  sourceId: string,
  date: Date,
  extension: string,
): string {
  return `wof-${kind}-${sourceId}-${stamp(date)}.${extension}`;
}

export function addTake(input: NewTake, now: Date = new Date()): CaptureTake {
  counter += 1;
  const take: CaptureTake = {
    id: `take-${counter}`,
    kind: input.kind,
    sourceId: input.sourceId,
    title: input.title,
    url: URL.createObjectURL(input.blob),
    fileName: takeFileName(input.kind, input.sourceId, now, input.extension),
    mimeType: input.blob.type,
    durationSec: input.durationSec,
    expectedDurationSec: input.expectedDurationSec,
    sizeBytes: input.blob.size,
    createdAt: now.toISOString(),
  };
  takes = [take, ...takes];
  emit();
  return take;
}

/** Discards a take and frees its memory. A Timeline scene still pointing at it stops playing. */
export function removeTake(id: string): void {
  const take = takes.find((candidate) => candidate.id === id);
  if (!take) return;
  URL.revokeObjectURL(take.url);
  takes = takes.filter((candidate) => candidate.id !== id);
  emit();
}

/** Newest first. The same array until something changes (safe for `useSyncExternalStore`). */
export function getTakes(): readonly CaptureTake[] {
  return takes;
}

export function findTakeByUrl(url: string | null | undefined): CaptureTake | undefined {
  return url ? takes.find((take) => take.url === url) : undefined;
}

export function subscribeTakes(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Saves a take through a temporary `<a download>`. */
export function downloadTake(take: Pick<CaptureTake, 'url' | 'fileName'>): void {
  const anchor = document.createElement('a');
  anchor.href = take.url;
  anchor.download = take.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Test seam: forget every take. */
export function resetTakesForTest(): void {
  takes.forEach((take) => URL.revokeObjectURL(take.url));
  takes = [];
  counter = 0;
  emit();
}
