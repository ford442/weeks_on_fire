import { Download, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCaptureTakes } from '../../hooks/useCaptureTakes';
import {
  downloadTake,
  removeTake,
  type CaptureTake,
  type TakeSourceKind,
} from '../../lib/capture/takes';
import { formatTimecodeTenths } from '../../lib/timecode';
import { crewPath } from '../../routes/paths';

/** ±1 s: what a full take may differ from the catalog runtime (issue #74's bar). */
const FULL_TAKE_TOLERANCE_SEC = 1;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function lengthNote(take: CaptureTake): string {
  const off = take.durationSec - take.expectedDurationSec;
  if (Math.abs(off) <= FULL_TAKE_TOLERANCE_SEC) return 'full take';
  return off < 0 ? 'stopped early' : 'longer than the cut';
}

interface TakeShelfProps {
  kind: TakeSourceKind;
  sourceId: string;
}

/** This tab's takes of one sequence or cutaway: watch, download, discard. Session only. */
export default function TakeShelf({ kind, sourceId }: TakeShelfProps) {
  const takes = useCaptureTakes().filter(
    (take) => take.kind === kind && take.sourceId === sourceId,
  );
  if (takes.length === 0) return null;

  return (
    <section aria-label="Recorded takes" className="space-y-3 border-t border-zinc-800 p-3">
      <div>
        <h3 className="text-xs font-semibold text-zinc-300">Takes (this tab only)</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-400">
          A take lives in this tab until you close it. Download it, host it (Drive / Imgur), then
          paste the link into a scene on the{' '}
          <Link to={crewPath('/timeline')} className="text-orange-300 hover:text-orange-200">
            Timeline
          </Link>{' '}
          to keep it.
        </p>
      </div>
      <ul className="space-y-3">
        {takes.map((take) => (
          <li key={take.id} className="space-y-2 rounded-md border border-zinc-800 bg-black/40 p-2">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a take is a picture test;
                its only sound is the song, which has no caption file */}
            <video
              src={take.url}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded bg-black"
              aria-label={`${take.title} take`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-zinc-400">
                {formatTimecodeTenths(take.durationSec)} · {lengthNote(take)} ·{' '}
                {formatBytes(take.sizeBytes)} · {take.fileName.split('.').pop()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadTake(take)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-orange-400 hover:text-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <Download size={14} aria-hidden="true" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => removeTake(take.id)}
                  aria-label={`Discard take ${take.fileName}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Discard
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
