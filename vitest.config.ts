import { defineConfig, type Plugin } from 'vitest/config';

/**
 * Tests don't re-encode stills: a responsive `?…&as=picture` import (see
 * scripts/content-index/image-variants.ts) resolves to a one-source Picture of the original file.
 */
function stubPictures(): Plugin {
  return {
    name: 'wof-stub-pictures',
    enforce: 'pre',
    load(id) {
      const [path, query = ''] = id.split('?');
      if (!/(?:^|&)as=picture(?:&|$)/.test(query)) return null;
      return `import src from ${JSON.stringify(path)};\nexport default { sources: {}, img: { src, w: 0, h: 0 } };`;
    },
  };
}

export default defineConfig({
  plugins: [stubPictures()],
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/content-index/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'src/data/generated/**', 'src/test/**'],
      reporter: ['text-summary', 'json-summary', 'lcov'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'e2e/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/components/**/*.test.tsx'],
          setupFiles: ['src/test/setup-dom.ts'],
        },
      },
    ],
  },
});
