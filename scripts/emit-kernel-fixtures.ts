/**
 * Rewrites src/lib/webgl/kernel.fixtures.json from the TypeScript geometry kernel. Run after an
 * intentional change to the kernel; kernel.test.ts then holds every kernel to these numbers.
 *
 *   npx tsx scripts/emit-kernel-fixtures.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { tsKernel } from '../src/lib/webgl/kernel';
import { KERNEL_CASES } from '../src/lib/webgl/kernel.cases';

const path = join(import.meta.dirname, '..', 'src', 'lib', 'webgl', 'kernel.fixtures.json');
const fixtures = Object.fromEntries(
  Object.entries(KERNEL_CASES).map(([name, run]) => [name, run(tsKernel)]),
);
writeFileSync(path, `${JSON.stringify(fixtures)}\n`);
execFileSync('npx', ['prettier', '--write', path], { stdio: 'inherit' });
console.log(`emit-kernel-fixtures: wrote ${Object.keys(fixtures).length} cases to ${path}`);
