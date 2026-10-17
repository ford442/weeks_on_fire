import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SyncOptions {
  /** Compare only; never touch the disk. */
  check: boolean;
  /** Shown when `check` finds drift, e.g. "Run npm run codegen and commit the changes." */
  fixHint: string;
  label: string;
}

/**
 * Writes `outputs` (file name → contents) into `dir`, skipping files that are already current.
 * In check mode nothing is written; stale or missing files throw instead.
 */
export function syncOutputs(
  dir: string,
  outputs: Readonly<Record<string, string>>,
  { check, fixHint, label }: SyncOptions,
): void {
  const stale: string[] = [];
  for (const [name, contents] of Object.entries(outputs)) {
    const path = join(dir, name);
    if (existsSync(path) && readFileSync(path, 'utf8') === contents) continue;
    if (check) {
      stale.push(name);
      continue;
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, contents);
  }
  if (stale.length > 0) {
    throw new Error(`${label} out of date (${stale.join(', ')}). ${fixHint}`);
  }
}
