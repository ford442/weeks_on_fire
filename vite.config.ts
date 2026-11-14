import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
  plugins: [react(), tailwindcss()],
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
