import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  loadSongs,
  loadCutaways,
  loadGallery,
  loadCharacters,
  loadDaisyBell,
  loadStaff,
} from './load';
import { validateContent } from './validate';
import {
  emitSongsModule,
  emitCutawaysModule,
  emitGalleryModule,
  emitCharactersModule,
  emitDaisyBellModule,
  emitStaffModule,
} from './emit';

const repoRoot = join(import.meta.dirname, '../..');
const generatedDir = join(repoRoot, 'src/data/generated');
const checkMode = process.argv.includes('--check');

function writeGenerated(name: string, contents: string) {
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(join(generatedDir, name), contents);
}

function main() {
  const songs = loadSongs(repoRoot);
  const cutaways = loadCutaways(repoRoot);
  const gallery = loadGallery(repoRoot);
  const characters = loadCharacters(repoRoot);
  const daisyBell = loadDaisyBell(repoRoot);
  const staff = loadStaff(repoRoot);

  validateContent(repoRoot, songs, cutaways, checkMode);

  writeGenerated('songs.ts', emitSongsModule(songs));
  writeGenerated(
    'cutaways.ts',
    emitCutawaysModule(
      cutaways.map((cutaway) => ({
        ...cutaway,
        segments: cutaway.segments ?? [],
      })),
    ).code,
  );
  writeGenerated('gallery.ts', emitGalleryModule(gallery));
  writeGenerated('characters.ts', emitCharactersModule(characters));
  writeGenerated('daisy-bell.ts', emitDaisyBellModule(daisyBell));
  writeGenerated('staff.ts', emitStaffModule(staff));

  console.log(
    `Generated ${songs.length} songs, ${cutaways.length} cutaways, ${gallery.length} gallery scenes, ${characters.length} characters, ${staff.length} staff.`,
  );

  if (checkMode) {
    const status = execSync('git status --porcelain src/data/generated', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    if (status) {
      throw new Error(
        'Generated files are out of date. Run npm run codegen and commit the changes.',
      );
    }
  }
}

main();
