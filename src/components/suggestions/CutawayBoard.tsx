import { X } from 'lucide-react';
import type { CutawaySegment, CutawaySuggestion, SightCandidate } from '../../data/suggestions';
import CutawayPreview from '../CutawayPreview';
import CopyButton from './CopyButton';
import SightBank from './SightBank';
import { applySightToPrompt } from './sightSlots';

interface CutawayBoardProps {
  cutaway: CutawaySuggestion;
  segment: CutawaySegment;
  previewSight?: SightCandidate;
  copiedKey: string | null;
  sights: SightCandidate[];
  hasSightBank: boolean;
  sightCategories: string[];
  sightCategory: string;
  activeSightId?: string;
  slotLettersBySight: Map<string, string[]>;
  onActiveSegmentChange: (id: string) => void;
  onCopy: (text: string, label: string, key: string) => void;
  onClearPreview: () => void;
  onSightCategory: (category: string) => void;
  onSelectSight: (sight: SightCandidate) => void;
}

/** Prompt workspace: timeline preview, the active segment's prompts, and the sight bank. */
export default function CutawayBoard({
  cutaway,
  segment,
  previewSight,
  copiedKey,
  sights,
  hasSightBank,
  sightCategories,
  sightCategory,
  activeSightId,
  slotLettersBySight,
  onActiveSegmentChange,
  onCopy,
  onClearPreview,
  onSightCategory,
  onSelectSight,
}: CutawayBoardProps) {
  return (
    <div className="space-y-5">
      <CutawayPreview
        segments={cutaway.segments}
        activeSegmentId={segment.id}
        onActiveSegmentChange={onActiveSegmentChange}
      />
      <SegmentDetail
        cutaway={cutaway}
        segment={segment}
        previewSight={previewSight}
        copiedKey={copiedKey}
        onCopy={onCopy}
        onClearPreview={onClearPreview}
      />
      {hasSightBank && (
        <SightBank
          sights={sights}
          categories={sightCategories}
          activeCategory={sightCategory}
          activeSightId={activeSightId}
          slotLettersBySight={slotLettersBySight}
          onCategory={onSightCategory}
          onSelectSight={onSelectSight}
        />
      )}
    </div>
  );
}

interface SegmentDetailProps {
  cutaway: CutawaySuggestion;
  segment: CutawaySegment;
  previewSight?: SightCandidate;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
  onClearPreview?: () => void;
}

function SegmentDetail({
  cutaway,
  segment,
  previewSight,
  copiedKey,
  onCopy,
  onClearPreview,
}: SegmentDetailProps) {
  const grokPrompt = previewSight
    ? applySightToPrompt(segment.grokImaginePrompt, previewSight.prompt)
    : segment.grokImaginePrompt;
  const geminiPrompt = previewSight
    ? applySightToPrompt(segment.geminiOmniPrompt, previewSight.prompt)
    : segment.geminiOmniPrompt;
  const variations = previewSight
    ? segment.promptVariations.map((variation) =>
        applySightToPrompt(variation, previewSight.prompt),
      )
    : segment.promptVariations;

  return (
    <aside className="flex min-h-0 flex-col gap-5 rounded-lg border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
          {cutaway.title}
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
          {previewSight ? `${segment.label} · ${previewSight.title}` : segment.label}
        </h2>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          {segment.durationSec === 0
            ? 'Still'
            : `${segment.start} → ${segment.end} (${segment.durationSec}s)`}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {previewSight ? previewSight.description : segment.onScreen}
        </p>
      </div>

      {previewSight && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2">
          <p className="text-sm leading-6 text-violet-100">
            Preview: {previewSight.title}
            {previewSight.lane === 'ending' ? ' · H only' : ''}
          </p>
          {onClearPreview && (
            <button
              type="button"
              onClick={onClearPreview}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-500/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-100 transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      )}

      {segment.stillUrl && (
        <img
          src={segment.stillUrl}
          alt={segment.label}
          className="w-full rounded-md border border-zinc-800 object-cover"
        />
      )}

      {segment.lyrics ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Lyrics / Cue
          </h3>
          <pre className="max-h-36 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-3 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
            {segment.lyrics}
          </pre>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{segment.musicCue}</p>
        </section>
      ) : (
        <p className="text-xs leading-5 text-zinc-500">{segment.musicCue}</p>
      )}

      <PromptBlock
        title="Grok Imagine Prompt"
        text={grokPrompt}
        copied={copiedKey === `${segment.id}:grok`}
        onCopy={() => onCopy(grokPrompt, 'Grok Imagine prompt', `${segment.id}:grok`)}
      />

      <PromptBlock
        title="Gemini Omni Prompt"
        text={geminiPrompt}
        copied={copiedKey === `${segment.id}:gemini`}
        onCopy={() => onCopy(geminiPrompt, 'Gemini Omni prompt', `${segment.id}:gemini`)}
      />

      {variations.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Variations
          </h3>
          <div className="space-y-3">
            {variations.map((variation, index) => (
              <div
                key={`${segment.id}:variation:${index}`}
                className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-zinc-500">Variation {index + 1}</span>
                  <CopyButton
                    copied={copiedKey === `${segment.id}:variation:${index}`}
                    label="Copy"
                    onClick={() =>
                      onCopy(
                        variation,
                        `Variation ${index + 1}`,
                        `${segment.id}:variation:${index}`,
                      )
                    }
                  />
                </div>
                <p className="text-sm leading-6 text-zinc-300">{variation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}

interface PromptBlockProps {
  title: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}

function PromptBlock({ title, text, copied, onCopy }: PromptBlockProps) {
  return (
    <section className="min-h-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{title}</h3>
        <CopyButton copied={copied} label="Copy" onClick={onCopy} />
      </div>
      <pre className="max-h-44 overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 text-zinc-200 whitespace-pre-wrap">
        {text}
      </pre>
    </section>
  );
}
