import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages sets VITE_BASE=/weeks_on_fire/ so deep links such as /show
// load /weeks_on_fire/assets. Other hosts keep relative './'.
const base = process.env.VITE_BASE ?? './';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
