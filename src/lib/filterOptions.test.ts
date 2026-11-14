import { describe, expect, it } from 'vitest';

import { filmScenes } from '../data/films';
import { songs } from '../data/songs';
import { genres, themes, taxonomy } from '../data/taxonomy';

import { episodeOptions, genreOptions, themeOptions, toolOptions } from './filterOptions';

describe('filter options', () => {
  it('keeps taxonomy order, groups, and counts, and skips unused entries', () => {
    const options = episodeOptions(['03', '03', 'night-side', '01']);
    expect(options).toEqual([
      { value: '01', label: 'Episode 1 (1)', group: 'Episodes' },
      { value: '03', label: 'Episode 3 (2)', group: 'Episodes' },
      { value: 'night-side', label: 'Night Side (1)', group: 'Collections' },
    ]);
  });

  it('builds genre, theme, and tool options from the fixed lists', () => {
    expect(genreOptions(['Metal', 'Metal'])).toEqual([{ value: 'Metal', label: 'Metal (2)' }]);
    expect(themeOptions(['Well Fall'])).toEqual([{ value: 'Well Fall', label: 'Well Fall (1)' }]);
    expect(toolOptions(['grok-imagine'])).toEqual([
      { value: 'grok-imagine', label: 'Grok Imagine (1)' },
    ]);
  });
});

describe('catalog data is normalised', () => {
  const episodeIds = new Set(taxonomy.episodes.map((entry) => entry.id));

  it('gives every song a canonical episode id and genre', () => {
    for (const song of songs) {
      expect(episodeIds.has(song.episode), `${song.id} episode ${song.episode}`).toBe(true);
      expect(genres.includes(song.genre), `${song.id} genre ${song.genre}`).toBe(true);
    }
  });

  it('keeps the dropdowns short and free of case-only duplicates', () => {
    const episodes = episodeOptions(songs.map((song) => song.episode));
    const genreList = genreOptions(songs.map((song) => song.genre));
    expect(episodes.length).toBeLessThanOrEqual(taxonomy.episodes.length);
    expect(genreList.length).toBeLessThanOrEqual(genres.length);
    for (const labels of [taxonomy.episodes.map((entry) => entry.label), genres, themes]) {
      const folded = labels.map((label) => label.toLowerCase());
      expect(new Set(folded).size).toBe(folded.length);
    }
  });

  it('gives every gallery scene a canonical episode, theme, and tool', () => {
    const toolIds = new Set(taxonomy.tools.map((tool) => tool.id));
    for (const scene of filmScenes) {
      expect(episodeIds.has(scene.episode), `${scene.id} episode ${scene.episode}`).toBe(true);
      expect(themes.includes(scene.theme), `${scene.id} theme ${scene.theme}`).toBe(true);
      if (scene.tool) expect(toolIds.has(scene.tool)).toBe(true);
    }
  });
});
