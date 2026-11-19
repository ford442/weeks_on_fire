import { join } from 'node:path';

import {
  loadSongs,
  loadCutaways,
  loadGallery,
  loadCharacters,
  loadSceneBoards,
  loadCrew,
  loadEpisodes,
  loadCartoons,
  loadSequences,
  loadSchedule,
  loadProductions,
  loadTaxonomy,
  loadCustomRendererIds,
  loadDialogSceneIds,
  listMp3Filenames,
} from './load';
import {
  validateContent,
  validateEpisodes,
  validateCartoons,
  validateCharacters,
  validateSequences,
  validateScenes,
  validateSceneBoards,
  validateSchedule,
  validateTaxonomy,
  validateCatalogLinks,
} from './validate';
import {
  emitSongsModule,
  emitCutawaysModule,
  emitGalleryModule,
  emitCharactersModule,
  emitSceneBoardsModule,
  emitCrewModule,
  emitEpisodesModule,
  emitCartoonsModule,
  emitSequencesModule,
  emitScheduleModule,
  emitCatalogRefsModule,
  emitTaxonomyModule,
  emitWhatsNewModule,
  emitCatalogGraphModule,
  emitSearchIndexModule,
  emitRecordFiles,
} from './emit';
import { buildCatalogGraph } from './catalog-graph';
import { buildSearchDocuments } from './search-docs';
import { buildWhatsNew } from './whats-new';
import { syncOutputs, syncOwnedDirectory } from './output';
import { buildCutawayRecords, buildSongRecords } from './records';

const repoRoot = join(import.meta.dirname, '../..');
const generatedDir = join(repoRoot, 'src/data/generated');
const catalogDir = join(repoRoot, 'public/catalog');
const checkMode = process.argv.includes('--check');

function main() {
  const songs = loadSongs(repoRoot);
  const cutaways = loadCutaways(repoRoot);
  const gallery = loadGallery(repoRoot);
  const characters = loadCharacters(repoRoot);
  const sceneBoards = loadSceneBoards(repoRoot);
  const crew = loadCrew(repoRoot);
  const episodes = loadEpisodes(repoRoot);
  const cartoons = loadCartoons(repoRoot);
  const sequences = loadSequences(repoRoot);
  const schedule = loadSchedule(repoRoot);
  const taxonomy = loadTaxonomy(repoRoot);
  const productions = loadProductions(repoRoot);

  validateContent(repoRoot, songs, cutaways, checkMode);
  validateEpisodes(repoRoot, episodes);
  validateTaxonomy(taxonomy, episodes, songs, gallery);
  validateCartoons(repoRoot, cartoons);
  validateSceneBoards(repoRoot, sceneBoards, new Set(songs.map((song) => song.id)));
  validateCharacters(repoRoot, characters);
  validateSchedule(schedule, new Set(cutaways.map((cutaway) => cutaway.id)));
  validateSequences(repoRoot, sequences, loadCustomRendererIds(repoRoot));
  validateScenes(productions, {
    songs: new Set(songs.map((song) => song.id)),
    cutaways: new Set(cutaways.map((cutaway) => cutaway.id)),
    sequences: new Set(sequences.map((sequence) => sequence.id)),
    cartoons: new Set(cartoons.map((cartoon) => cartoon.id)),
    characters: new Set(characters.map((character) => character.id)),
  });
  validateCatalogLinks({
    songs,
    cutaways,
    cartoons,
    sequences,
    sceneBoards,
    characters,
    episodes,
    dialogSceneIds: loadDialogSceneIds(repoRoot),
  });

  const graph = buildCatalogGraph({
    songs,
    cutaways,
    sceneBoards,
    gallery,
    episodes,
    characters,
    cartoons,
    sequences,
    productions,
  });

  const songRecords = buildSongRecords(songs);
  const cutawayRecords = buildCutawayRecords(cutaways);

  const outputs = {
    'songs.ts': emitSongsModule(songRecords.summaries, listMp3Filenames(repoRoot)),
    'cutaways.ts': emitCutawaysModule(cutawayRecords.summaries, cutawayRecords.stillPaths),
    'gallery.ts': emitGalleryModule(gallery),
    'characters.ts': emitCharactersModule(characters),
    'scene-boards.ts': emitSceneBoardsModule(sceneBoards),
    'crew.ts': emitCrewModule(crew),
    'episodes.ts': emitEpisodesModule(episodes),
    'cartoons.ts': emitCartoonsModule(cartoons),
    'sequences.ts': emitSequencesModule(sequences),
    'schedule.ts': emitScheduleModule(schedule),
    'taxonomy.ts': emitTaxonomyModule(taxonomy),
    'whats-new.ts': emitWhatsNewModule(
      buildWhatsNew({ songs, cutaways, cartoons, sequences, gallery }),
    ),
    'catalog-refs.ts': emitCatalogRefsModule({ songs, cutaways, sequences, cartoons, characters }),
    'catalog-graph.ts': emitCatalogGraphModule(graph),
    'search-index.ts': emitSearchIndexModule(
      buildSearchDocuments({
        songs,
        cutaways,
        sceneBoards,
        gallery,
        episodes,
        characters,
        cartoons,
        sequences,
        crew,
        taxonomy,
        graph,
      }),
    ),
  };
  syncOutputs(generatedDir, outputs, {
    check: checkMode,
    label: 'Generated files',
    fixHint: 'Run npm run codegen and commit the changes.',
  });
  for (const [kind, { summaries, records }] of [
    ['songs', songRecords],
    ['cutaways', cutawayRecords],
  ] as const) {
    syncOwnedDirectory(join(catalogDir, kind), emitRecordFiles(summaries, records), {
      check: checkMode,
      label: `public/catalog/${kind}`,
      fixHint: 'Run npm run codegen and commit the changes.',
    });
  }

  console.log(
    `Generated ${songs.length} songs, ${cutaways.length} cutaways, ${gallery.length} gallery scenes, ${characters.length} characters, ${crew.length} crew, ${sceneBoards.length} scene boards, ${episodes.length} episodes, ${cartoons.length} cartoons, ${sequences.length} sequences, ${schedule.blocks.reduce((n, block) => n + block.slots.length, 0)} schedule slots; ${graph.nodes.length} graph nodes, ${graph.edges.length} edges; checked ${productions.length} scenes.json files.`,
  );
}

main();
