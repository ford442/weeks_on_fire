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
  loadEpisodes,
  loadCartoons,
} from './load';
import { validateContent, validateEpisodes, validateCartoons } from './validate';
import {
  emitSongsModule,
  emitCutawaysModule,
  emitGalleryModule,
  emitCharactersModule,
  emitDaisyBellModule,
  emitStaffModule,
  emitEpisodesModule,
  emitCartoonsModule,
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
  const episodes = loadEpisodes(repoRoot);
  const cartoons = loadCartoons(repoRoot);

  validateContent(repoRoot, songs, cutaways, checkMode);
  validateEpisodes(repoRoot, episodes);
  validateCartoons(cartoons);

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
  writeGenerated('episodes.ts', emitEpisodesModule(episodes));
  writeGenerated('cartoons.ts', emitCartoonsModule(cartoons));

  console.log(
    `Generated ${songs.length} songs, ${cutaways.length} cutaways, ${gallery.length} gallery scenes, ${characters.length} characters, ${staff.length} staff, ${episodes.length} episodes, ${cartoons.length} cartoons.`,
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
