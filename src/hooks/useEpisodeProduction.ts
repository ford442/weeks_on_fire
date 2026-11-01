import { useCallback, useEffect, useState } from 'react';

import { AVAILABLE_EPISODES, loadEpisodeProduction } from '../data/production';
import { clearStored, loadStored, productionsEqual, saveStored } from '../lib/productionStorage';

import type { EpisodeId, EpisodeProduction } from '../data/production';

export type SyncStatus = 'synced' | 'local-edits' | 'loading';

type ProductionUpdater = EpisodeProduction | ((previous: EpisodeProduction) => EpisodeProduction);

export function useEpisodeProduction(initialEpisode: EpisodeId = '01') {
  const [episodeId, setEpisodeId] = useState<EpisodeId>(initialEpisode);
  const [production, setProductionState] = useState<EpisodeProduction | null>(null);
  const [committed, setCommitted] = useState<EpisodeProduction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');

  const loadEpisode = useCallback(async (episode: EpisodeId) => {
    setIsLoading(true);
    setSyncStatus('loading');

    const committedData = await loadEpisodeProduction(episode);
    if (!committedData) {
      setCommitted(null);
      setProductionState(null);
      setIsLoading(false);
      setSyncStatus('synced');
      return;
    }

    const stored = loadStored(episode);
    const resolved = stored ?? committedData;

    setCommitted(committedData);
    setProductionState(resolved);
    setIsLoading(false);
    setSyncStatus(productionsEqual(resolved, committedData) ? 'synced' : 'local-edits');
  }, []);

  useEffect(() => {
    void loadEpisode(episodeId);
  }, [episodeId, loadEpisode]);

  const switchEpisode = useCallback((episode: EpisodeId) => {
    setEpisodeId(episode);
  }, []);

  const setProduction = useCallback(
    (updater: ProductionUpdater) => {
      setProductionState((previous) => {
        if (!previous) return previous;

        const next = typeof updater === 'function' ? updater(previous) : updater;
        saveStored(episodeId, next);
        return next;
      });
    },
    [episodeId],
  );

  useEffect(() => {
    if (isLoading || !production || !committed) {
      if (!isLoading) setSyncStatus('synced');
      return;
    }
    setSyncStatus(productionsEqual(production, committed) ? 'synced' : 'local-edits');
  }, [production, committed, isLoading]);

  const resetToCommitted = useCallback(() => {
    if (!committed) return;
    clearStored(episodeId);
    setProductionState(structuredClone(committed));
  }, [episodeId, committed]);

  return {
    episodeId,
    availableEpisodes: AVAILABLE_EPISODES,
    production,
    committed,
    isLoading,
    syncStatus,
    switchEpisode,
    setProduction,
    resetToCommitted,
  };
}
