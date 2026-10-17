import { useRef, useState, type ChangeEvent } from 'react';
import { Download, RefreshCw, Upload } from 'lucide-react';

import { useEpisodeProduction } from '../hooks/useEpisodeProduction';
import {
  clipStackerToProduction,
  createEmptyScene,
  exportToClipStacker,
  isClipStackerPayload,
} from '../data/production';

import SceneTimeline from './SceneTimeline';
import SceneEditorModal from './SceneEditorModal';

import type { ProductionScene } from '../data/production';

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function TimelinePage() {
  const [editingScene, setEditingScene] = useState<ProductionScene | null>(null);
  const [isNewScene, setIsNewScene] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const clipStackerInputRef = useRef<HTMLInputElement>(null);

  const {
    episodeId,
    availableEpisodes,
    production,
    committed,
    isLoading,
    syncStatus,
    switchEpisode,
    setProduction,
    resetToCommitted,
  } = useEpisodeProduction('01');

  const handleEditScene = (scene: ProductionScene) => {
    setIsNewScene(false);
    setEditingScene(scene);
  };

  const handleAddScene = () => {
    if (!production) return;
    const nextOrder = Math.max(0, ...production.scenes.map((scene) => scene.order)) + 1;
    const newScene = createEmptyScene(nextOrder);
    setIsNewScene(true);
    setEditingScene(newScene);
  };

  const handleSaveScene = (updated: ProductionScene) => {
    setProduction((prev) => {
      const exists = prev.scenes.some((scene) => scene.id === updated.id);

      const newScenes = exists
        ? prev.scenes.map((scene) => (scene.id === updated.id ? updated : scene))
        : [...prev.scenes, updated].sort((a, b) => a.order - b.order);

      return {
        ...prev,
        scenes: newScenes,
        lastUpdated: new Date().toISOString(),
      };
    });
    setEditingScene(null);
    setIsNewScene(false);
  };

  const handleCloseEditor = () => {
    setEditingScene(null);
    setIsNewScene(false);
  };

  const handleExportJSON = () => {
    if (!production) return;
    downloadJson(production, `episode-${production.episode}-scenes.json`);
  };

  const handleExportToClipStacker = () => {
    if (!production) return;
    downloadJson(exportToClipStacker(production), `clip-stacker-${production.episode}.json`);
  };

  const handleImportClipStacker = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !production) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isClipStackerPayload(parsed)) {
        setImportMessage(
          'Invalid clip_stacker file: expected version weeks_on_fire_v1 with clips[].',
        );
        return;
      }

      const imported = clipStackerToProduction(parsed, episodeId, committed ?? production);
      setProduction(imported);
      setImportMessage(`Imported ${imported.scenes.length} clip(s) from clip_stacker.`);
    } catch {
      setImportMessage('Could not parse clip_stacker JSON file.');
    }
  };

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm text-zinc-400">
              Track scene creation, prompt evolution, media links, and status changes. Local edits
              auto-save in the browser — use <strong>Export JSON</strong> to save back into{' '}
              <code>episodes/episode-{episodeId}/scenes.json</code> and commit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={resetToCommitted}
              disabled={!production || isLoading}
              className="flex items-center gap-1.5 rounded border border-zinc-800 px-2.5 py-1 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
              title="Reset to committed scenes.json"
            >
              <RefreshCw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={() => clipStackerInputRef.current?.click()}
              disabled={!production || isLoading}
              className="flex items-center gap-1.5 rounded border border-zinc-800 px-2.5 py-1 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
              title="Import clip_stacker JSON"
            >
              <Upload size={14} /> Import clip_stacker
            </button>
            <input
              ref={clipStackerInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => void handleImportClipStacker(event)}
            />
            <button
              type="button"
              onClick={handleExportToClipStacker}
              disabled={!production || isLoading}
              className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-orange-300 transition hover:bg-zinc-900 disabled:opacity-50"
              title="Export starter data for clip_stacker"
            >
              <Download size={14} /> Export to clip_stacker
            </button>
          </div>
        </div>

        {importMessage && (
          <p className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
            {importMessage}
          </p>
        )}

        <SceneTimeline
          production={production}
          episodeId={episodeId}
          availableEpisodes={availableEpisodes}
          onEpisodeChange={switchEpisode}
          syncStatus={syncStatus}
          isLoading={isLoading}
          onEditScene={handleEditScene}
          onAddScene={handleAddScene}
          onExport={handleExportJSON}
        />
      </div>

      <SceneEditorModal
        scene={editingScene}
        isNew={isNewScene}
        onClose={handleCloseEditor}
        onSave={handleSaveScene}
      />
    </>
  );
}
