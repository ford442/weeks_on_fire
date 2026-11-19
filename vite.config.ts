import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { servedAudioName } from './scripts/content-index/audio-names';

const songsDir = join(import.meta.dirname, 'songs');

/**
 * Song audio stays authored in songs/ but is served at stable paths: `audio/<slug>.mp3` (see
 * `scripts/content-index/audio-names.ts`). The build copies each file once into `dist/audio/`;
 * the dev server serves it from songs/. Nothing imports the mp3s, so they never pass through
 * Rollup and never get a hashed name or a JS chunk of their own.
 */
function songAudio(): Plugin {
  const files = () => readdirSync(songsDir).filter((file) => file.endsWith('.mp3'));
  return {
    name: 'wof-song-audio',
    configureServer(server) {
      const byServed = new Map(files().map((file) => [servedAudioName(file), file]));
      // Not mounted at '/audio': connect would re-prefix a rewritten URL with the mount path.
      server.middlewares.use((req, _res, next) => {
        const match = /^\/audio\/([^?#]+)/.exec(req.url ?? '');
        const source = match ? byServed.get(decodeURIComponent(match[1]!)) : undefined;
        // Hand the request to Vite's static file server (range requests, so seeking works).
        if (source) req.url = `/songs/${encodeURI(source)}`;
        next();
      });
    },
    generateBundle() {
      for (const file of files()) {
        this.emitFile({
          type: 'asset',
          fileName: `audio/${servedAudioName(file)}`,
          source: readFileSync(join(songsDir, file)),
        });
      }
    },
  };
}

// Output filenames must survive zip/SFTP uploads and SPA-fallback servers.
// Source names like `Everything's+Made+for+Love_.mp3` or `The+Monster+Mash+(Finale).mp3`
// otherwise leak `'`, `’`, `(`, `)` and `+` into asset/chunk URLs, and some hosts answer
// those with the index.html fallback (text/html) -> "Failed to load module script".
function safeName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return slug || 'asset';
}

// npm run build passes `--base ${VITE_BASE:-./}`. Reading VITE_BASE here
// does not work: Vite bundles this file and replaces process.env.VITE_*.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), songAudio()],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: (chunk) => `assets/${safeName(chunk.name)}-[hash].js`,
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (asset) => {
          const original = asset.names?.[0] ?? asset.name ?? 'asset';
          const dot = original.lastIndexOf('.');
          const stem = dot > 0 ? original.slice(0, dot) : original;
          const ext = dot > 0 ? original.slice(dot) : '';
          return `assets/${safeName(stem)}-[hash]${safeName(ext) === 'asset' ? '' : ext.replace(/[^A-Za-z0-9.]/g, '')}`;
        },
      },
    },
  },
});
