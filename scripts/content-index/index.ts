import { join } from 'node:path';

import {
  loadSongs,
  loadCutaways,
  loadGallery,
  loadCharacters,
  loadDaisyBell,
  loadStaff,
  loadEpisodes,
  loadCartoons,
  loadSequences,
  loadCustomRendererIds,
} from './load';
import {
  validateContent,
  validateEpisodes,
  validateCartoons,
  validateCharacters,
  validateSequences,
} from './validate';
import {
  emitSongsModule,
  emitCutawaysModule,
  emitGalleryModule,
  emitCharactersModule,
  emitDaisyBellModule,
  emitStaffModule,
  emitEpisodesModule,
  emitCartoonsModule,
  emitSequencesModule,
} from './emit';
import { syncOutputs } from './output';

const repoRoot = join(import.meta.dirname, '../..');
const generatedDir = join(repoRoot, 'src/data/generated');
const checkMode = process.argv.includes('--check');

function main() {
  const songs = loadSongs(repoRoot);
  const cutaways = loadCutaways(repoRoot);
  const gallery = loadGallery(repoRoot);
  const characters = loadCharacters(repoRoot);
  const daisyBell = loadDaisyBell(repoRoot);
  const staff = loadStaff(repoRoot);
  const episodes = loadEpisodes(repoRoot);
  const cartoons = loadCartoons(repoRoot);
  const sequences = loadSequences(repoRoot);

  validateContent(repoRoot, songs, cutaways, checkMode);
  validateEpisodes(repoRoot, episodes);
  validateCartoons(repoRoot, cartoons);
  validateCharacters(repoRoot, characters);
  validateSequences(repoRoot, sequences, loadCustomRendererIds(repoRoot));

  const outputs = {
    'songs.ts': emitSongsModule(songs),
    'cutaways.ts': emitCutawaysModule(
      cutaways.map((cutaway) => ({
        ...cutaway,
        segments: cutaway.segments ?? [],
      })),
    ).code,
    'gallery.ts': emitGalleryModule(gallery),
    'characters.ts': emitCharactersModule(characters),
    'daisy-bell.ts': emitDaisyBellModule(daisyBell),
    'staff.ts': emitStaffModule(staff),
    'episodes.ts': emitEpisodesModule(episodes),
    'cartoons.ts': emitCartoonsModule(cartoons),
    'sequences.ts': emitSequencesModule(sequences),
  };
  syncOutputs(generatedDir, outputs, {
    check: checkMode,
    label: 'Generated files',
    fixHint: 'Run npm run codegen and commit the changes.',
  });

  console.log(
    `Generated ${songs.length} songs, ${cutaways.length} cutaways, ${gallery.length} gallery scenes, ${characters.length} characters, ${staff.length} staff, ${episodes.length} episodes, ${cartoons.length} cartoons, ${sequences.length} sequences.`,
  );
}

main();
