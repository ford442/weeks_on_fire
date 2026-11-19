import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/**
 * Like `syncOutputs`, for a directory codegen owns outright (`public/catalog/<kind>/`): files in
 * `dir` that `outputs` no longer names are deleted, or reported as stale in check mode, so a
 * removed record cannot keep serving its old JSON.
 */
export function syncOwnedDirectory(
  dir: string,
  outputs: Readonly<Record<string, string>>,
  options: SyncOptions,
): void {
  const orphans = existsSync(dir)
    ? readdirSync(dir).filter((name) => name.endsWith('.json') && !(name in outputs))
    : [];
  let orphanError: Error | undefined;
  if (orphans.length > 0) {
    if (options.check) {
      orphanError = new Error(
        `${options.label} has files codegen no longer writes (${orphans.join(', ')}). ${options.fixHint}`,
      );
    } else {
      for (const name of orphans) rmSync(join(dir, name));
    }
  }
  syncOutputs(dir, outputs, options);
  if (orphanError) throw orphanError;
}
