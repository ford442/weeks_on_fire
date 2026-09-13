import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist/assets';
const MAIN_ENTRY_LIMIT_BYTES = 500 * 1024;

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const files = readdirSync(DIST_DIR).filter((name) => name.endsWith('.js'));
const mainEntry = files.find((name) => name.startsWith('index-'));

if (!mainEntry) {
  console.error('check-bundle-size: no dist/assets/index-*.js entry chunk found');
  process.exit(1);
}

const mainPath = join(DIST_DIR, mainEntry);
const mainSize = statSync(mainPath).size;

console.log('Bundle sizes:');
for (const file of files.sort()) {
  const size = statSync(join(DIST_DIR, file)).size;
  const marker = file === mainEntry ? ' (main entry)' : '';
  console.log(`  ${file}: ${formatKb(size)}${marker}`);
}

if (mainSize > MAIN_ENTRY_LIMIT_BYTES) {
  console.error(
    `\ncheck-bundle-size: main entry ${mainEntry} is ${formatKb(mainSize)} — limit is ${formatKb(MAIN_ENTRY_LIMIT_BYTES)}`,
  );
  process.exit(1);
}

console.log(
  `\ncheck-bundle-size: main entry ${formatKb(mainSize)} is within ${formatKb(MAIN_ENTRY_LIMIT_BYTES)} limit`,
);
