/**
 * Song audio is served from stable, unhashed paths (`audio/<name>.mp3`) instead of going through
 * the bundler. Source filenames like `Everything's+Made+for+Love_.mp3` or `I’m+the+Rainbow+Fog.mp3`
 * carry `'`, `’`, `(`, `)` and `+`, which some static hosts answer with the SPA fallback, so the
 * served name is an ASCII slug of the source name. Shared by the Vite plugin that copies the files
 * (`vite.config.ts`), codegen (which fails on two sources that slug the same) and the app.
 */
export function servedAudioName(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const slug = stem
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${slug || 'track'}.mp3`;
}

/** `audio/<served name>`, relative to the site base. */
export function servedAudioPath(filename: string): string {
  return `audio/${servedAudioName(filename)}`;
}

/** Throws when two source files would be served at the same path. */
export function assertDistinctAudioNames(filenames: readonly string[]): void {
  const seen = new Map<string, string>();
  for (const filename of filenames) {
    const served = servedAudioName(filename);
    const other = seen.get(served);
    if (other) {
      throw new Error(
        `songs/${filename} and songs/${other} would both be served as audio/${served}`,
      );
    }
    seen.set(served, filename);
  }
}
