import { useState } from 'react';
import { X, Save } from 'lucide-react';

import { useCaptureTakes } from '../hooks/useCaptureTakes';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { appendSceneHistory, updateSceneStatus } from '../data/production';
import { findTakeByUrl, type CaptureTake } from '../lib/capture/takes';
import { isHostedMediaUrl, isSessionMediaUrl } from '../lib/mediaUrl';
import { formatTimecodeTenths } from '../lib/timecode';
import {
  CHARACTER_OPTIONS,
  SINGLE_REF_FIELDS,
  sameCatalogRefs,
  withCurrentOption,
} from '../lib/catalogRefs';
import { productionStatusMeta } from '../lib/status';
import { pickCatalogRefs, SCENE_STATUSES, withCatalogRefs } from '../schemas/production';

import SceneRefLinks from './SceneRefLinks';

import type { ProductionScene, SceneStatus } from '../data/production';
import type { CatalogRefs } from '../schemas/production';

interface SceneEditorModalProps {
  scene: ProductionScene | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: ProductionScene) => void;
}

const STATUSES: readonly SceneStatus[] = SCENE_STATUSES;

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
  const [refs, setRefs] = useState<CatalogRefs>(() => pickCatalogRefs(scene));
  const [historyNote, setHistoryNote] = useState('');

  const toggleCharacter = (id: string, on: boolean) => {
    setRefs((prev) => {
      const rest = (prev.characterIds ?? []).filter((existing) => existing !== id);
      return { ...prev, characterIds: on ? [...rest, id] : rest };
    });
  };

  const handleSave = () => {
    // Cleared pickers remove the key entirely: "unset" is never '' or [].
    let updated: ProductionScene = withCatalogRefs(
      {
        ...scene,
        title: title.trim() || scene.title,
        timestamp: timestamp.trim() || scene.timestamp,
        description: description.trim(),
        prompt: prompt.trim() || undefined,
        mediaUrl: mediaUrl.trim() || undefined,
      },
      refs,
    );

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
      mediaUrl !== (scene.mediaUrl ?? '') ||
      !sameCatalogRefs(refs, scene);

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
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
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
            <div className="space-y-2">
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
              <SessionTakePicker mediaUrl={mediaUrl} onPick={setMediaUrl} />
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-400">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SceneStatus)}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {productionStatusMeta[s].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <MediaUrlNote mediaUrl={mediaUrl} />

          <fieldset className="space-y-3 rounded-md border border-zinc-800 p-3">
            <legend className="px-1 text-xs font-medium text-zinc-400">
              Catalog links (optional — ids are saved, the scene title stays yours)
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SINGLE_REF_FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-400">
                    {field.label}
                  </span>
                  <select
                    value={refs[field.key] ?? ''}
                    onChange={(e) => setRefs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">— none —</option>
                    {withCurrentOption(field.options, refs[field.key]).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.missing ? `${option.id} (not in catalog)` : option.title}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <fieldset>
              <legend className="mb-1 text-xs font-medium text-zinc-400">Characters</legend>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                {[
                  ...CHARACTER_OPTIONS.map((option) => ({ ...option, missing: false })),
                  ...(refs.characterIds ?? [])
                    .filter((id) => !CHARACTER_OPTIONS.some((option) => option.id === id))
                    .map((id) => ({ id, title: id, missing: true })),
                ].map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={refs.characterIds?.includes(option.id) ?? false}
                      onChange={(e) => toggleCharacter(option.id, e.target.checked)}
                      className="accent-orange-500"
                    />
                    {option.missing ? `${option.id} (not in catalog)` : option.title}
                  </label>
                ))}
              </div>
            </fieldset>

            <SceneRefLinks refs={refs} newTab />
          </fieldset>

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

function takeLabel(take: CaptureTake): string {
  const time = new Date(take.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${take.title} · ${formatTimecodeTenths(take.durationSec)} · ${time}`;
}

/** Takes recorded in this tab (Sequences, Suggestions): attach one to the scene for this session. */
function SessionTakePicker({
  mediaUrl,
  onPick,
}: {
  mediaUrl: string;
  onPick: (url: string) => void;
}) {
  const takes = useCaptureTakes();
  if (takes.length === 0) return null;
  const current = findTakeByUrl(mediaUrl);

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-400">
        Or a take recorded in this tab (session only)
      </span>
      <select
        value={current?.url ?? ''}
        onChange={(e) => {
          if (e.target.value) onPick(e.target.value);
        }}
        className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-orange-500"
      >
        <option value="">— choose a take —</option>
        {takes.map((take) => (
          <option key={take.id} value={take.url}>
            {takeLabel(take)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** What happens to the scene's media link: kept and exported, or session only. */
function MediaUrlNote({ mediaUrl }: { mediaUrl: string }) {
  const url = mediaUrl.trim();
  if (!url) return null;

  if (isSessionMediaUrl(url)) {
    const take = findTakeByUrl(url);
    return (
      <div
        role="note"
        className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100"
      >
        <p>
          <strong>Session only.</strong> This take plays in this tab and nowhere else. It is not
          saved with your edits, not in Export JSON and not sent to clip_stacker: download it, host
          it (Drive / Imgur), and paste the hosted link here to keep it.
        </p>
        {take ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- a take is a picture test; its only sound is the song
          <video
            src={take.url}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full max-w-sm rounded bg-black"
            aria-label={`${take.title} take`}
          />
        ) : (
          <p className="text-amber-200">
            This take is gone: it was discarded, or the tab was reloaded since it was recorded.
          </p>
        )}
      </div>
    );
  }

  if (!isHostedMediaUrl(url)) {
    return (
      <p role="note" className="text-xs leading-5 text-zinc-400">
        This is not an http(s) link, so clip_stacker and other machines may not be able to open it.
      </p>
    );
  }
  return null;
}
