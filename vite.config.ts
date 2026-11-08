import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// npm run build passes `--base ${VITE_BASE:-./}`. Reading VITE_BASE here
// does not work: Vite bundles this file and replaces process.env.VITE_*.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
