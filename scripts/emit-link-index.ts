import { readFileSync, writeFileSync } from 'node:fs';

const INDEX_PATH = 'dist/index.html';
const LINK_INDEX_PATH = 'dist/1ink.1ink';

// test.1ink.us DirectoryIndex prefers 1ink.1ink (UTF-16 LE) over index.html.
// Run after check-index-encoding.ts so the source is known to be clean UTF-8.
const html = readFileSync(INDEX_PATH, 'utf8');
writeFileSync(
  LINK_INDEX_PATH,
  Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(html, 'utf16le')]),
);

console.log(`emit-link-index: wrote UTF-16 LE ${LINK_INDEX_PATH}`);
