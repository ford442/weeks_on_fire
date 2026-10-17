import { useState } from 'react';
import { X, Save } from 'lucide-react';

import { useEscapeKey } from '../hooks/useEscapeKey';
import { appendSceneHistory, updateSceneStatus } from '../data/production';

import type { ProductionScene, SceneStatus } from '../data/production';

interface SceneEditorModalProps {
  scene: ProductionScene | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: ProductionScene) => void;
}

const STATUSES: SceneStatus[] = ['draft', 'generated', 'approved', 'in-edit', 'final'];

export default function SceneEditorModal({
  scene,
  isNew = false,
  onClose,
  onSave,
}: SceneEditorModalProps) {
  if (!scene) return null;

  return <SceneEditorModalContent scene={scene} isNew={isNew} onClose={onClose} onSave={onSave} />;
}

function SceneEditorModalContent({
  scene,
  isNew = false,
  onClose,
  onSave,
}: SceneEditorModalProps & { scene: ProductionScene }) {
  useEscapeKey(onClose);
  const [title, setTitle] = useState(scene.title);
  const [timestamp, setTimestamp] = useState(scene.timestamp);
  const [description, setDescription] = useState(scene.description);
  const [prompt, setPrompt] = useState(scene.prompt ?? '');
  const [mediaUrl, setMediaUrl] = useState(scene.mediaUrl ?? '');
  const [status, setStatus] = useState<SceneStatus>(scene.status);
  const [historyNote, setHistoryNote] = useState('');

  const handleSave = () => {
    let updated: ProductionScene = {
      ...scene,
      title: title.trim() || scene.title,
      timestamp: timestamp.trim() || scene.timestamp,
      description: description.trim(),
      prompt: prompt.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
    };

    // If status changed, use helper (it appends history)
    if (status !== scene.status) {
      updated = updateSceneStatus(updated, status, historyNote || `Status → ${status}`);
    }

    // Always append a general edit entry if user provided a note or any field changed meaningfully
    const changed =
      title !== scene.title ||
      timestamp !== scene.timestamp ||
      description !== scene.description ||
      prompt !== (scene.prompt ?? '') ||
      mediaUrl !== (scene.mediaUrl ?? '');

    if (changed || historyNote.trim()) {
      const note = historyNote.trim() || (isNew ? 'Initial details added' : 'Updated via editor');
      updated = appendSceneHistory(updated, isNew ? 'added' : 'edited', note);
    }

    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'New scene' : 'Edit scene'}
        className="w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div>
            <div className="text-sm text-orange-400">
              {isNew ? 'NEW SCENE' : 'EDIT SCENE'} — {scene.id}
            </div>
            <div className="text-lg font-semibold text-white">{title || 'Untitled scene'}</div>
          </div>
          <button
            type="button"
            aria-label="Close editor"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-400">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-400">
                Timestamp (e.g. 00:02:17)
              </span>
              <input
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm font-mono outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-400">
              Description / Synopsis beat
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-400">
              Grok Imagine prompt
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Enter or paste the current prompt..."
              className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2 font-mono text-sm outline-none focus:border-orange-500"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-400">
                Media URL (Drive / external)
              </span>
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-400">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SceneStatus)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-400">
              Change note (will be appended to history)
            </span>
            <input
              value={historyNote}
              onChange={(e) => setHistoryNote(e.target.value)}
              placeholder="e.g. Refined prompt for better volumetric lighting"
              className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            <Save size={16} /> {isNew ? 'Create scene' : 'Save & append history'}
          </button>
        </div>

        {/* History preview */}
        <div className="border-t border-zinc-800 bg-black/40 px-5 py-3 text-xs">
          <div className="mb-1 font-semibold text-zinc-400">
            Current history ({scene.history.length})
          </div>
          <div className="max-h-24 space-y-1 overflow-auto text-zinc-400">
            {scene.history
              .slice()
              .reverse()
              .slice(0, 4)
              .map((h, i) => (
                <div key={i}>
                  {new Date(h.date).toLocaleDateString()} — {h.action}: {h.note}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
