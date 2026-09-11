import { readFileSync, writeFileSync } from 'node:fs';

const INDEX_PATH = 'dist/index.html';
const LINK_INDEX_PATH = 'dist/1ink.1ink';
const header = readFileSync(INDEX_PATH);

function fail(message) {
  console.error(`check-index-encoding: ${message}`);
  process.exit(1);
}

if (header.length >= 2 && header[0] === 0xff && header[1] === 0xfe) {
  fail(`${INDEX_PATH} starts with a UTF-16 LE BOM`);
}
if (header.length >= 2 && header[0] === 0xfe && header[1] === 0xff) {
  fail(`${INDEX_PATH} starts with a UTF-16 BE BOM`);
}
if (header.length >= 3 && header[0] === 0xef && header[1] === 0xbb && header[2] === 0xbf) {
  fail(`${INDEX_PATH} starts with a UTF-8 BOM`);
}

const sample = header.subarray(0, Math.min(64, header.length));
const nulCount = [...sample].filter((byte) => byte === 0).length;
if (nulCount > 8) {
  fail(`${INDEX_PATH} looks like UTF-16 (${nulCount} NUL bytes in the header)`);
}

const html = header.toString('utf8');
if (/<base\b/i.test(html)) {
  fail(`${INDEX_PATH} contains a <base> tag; Vite relative assets must not use document base`);
}

// test.1ink.us DirectoryIndex prefers 1ink.1ink (UTF-16 LE) over index.html.
writeFileSync(
  LINK_INDEX_PATH,
  Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(html, 'utf16le')]),
);

console.log('check-index-encoding: dist/index.html is UTF-8 with no BOM and no <base> tag');
console.log(`check-index-encoding: wrote UTF-16 LE ${LINK_INDEX_PATH}`);
