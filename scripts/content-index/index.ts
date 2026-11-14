import { join } from 'node:path';

import {
  loadSongs,
  loadCutaways,
  loadGallery,
  loadCharacters,
  loadDaisyBell,
  loadCrew,
  loadEpisodes,
  loadCartoons,
  loadSequences,
  loadTaxonomy,
  loadCustomRendererIds,
} from './load';
import {
  validateContent,
  validateEpisodes,
  validateCartoons,
  validateCharacters,
  validateSequences,
  validateTaxonomy,
} from './validate';
import {
  emitSongsModule,
  emitCutawaysModule,
  emitGalleryModule,
  emitCharactersModule,
  emitDaisyBellModule,
  emitCrewModule,
  emitEpisodesModule,
  emitCartoonsModule,
  emitSequencesModule,
  emitTaxonomyModule,
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
  const crew = loadCrew(repoRoot);
  const episodes = loadEpisodes(repoRoot);
  const cartoons = loadCartoons(repoRoot);
  const sequences = loadSequences(repoRoot);
  const taxonomy = loadTaxonomy(repoRoot);

  validateContent(repoRoot, songs, cutaways, checkMode);
  validateEpisodes(repoRoot, episodes);
  validateTaxonomy(taxonomy, episodes, songs, gallery);
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
    'crew.ts': emitCrewModule(crew),
    'episodes.ts': emitEpisodesModule(episodes),
    'cartoons.ts': emitCartoonsModule(cartoons),
    'sequences.ts': emitSequencesModule(sequences),
    'taxonomy.ts': emitTaxonomyModule(taxonomy),
  };
  syncOutputs(generatedDir, outputs, {
    check: checkMode,
    label: 'Generated files',
    fixHint: 'Run npm run codegen and commit the changes.',
  });

  console.log(
    `Generated ${songs.length} songs, ${cutaways.length} cutaways, ${gallery.length} gallery scenes, ${characters.length} characters, ${crew.length} crew, ${episodes.length} episodes, ${cartoons.length} cartoons, ${sequences.length} sequences.`,
  );
}

main();
