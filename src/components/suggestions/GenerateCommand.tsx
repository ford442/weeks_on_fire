import { buildGenerateCommand, type GenerateKind } from '../../lib/generateCommand';

import CopyButton from './CopyButton';

import type { Generation } from '../../../scripts/content-index/generation';

interface GenerateCommandProps {
  cutawayId: string;
  segmentId: string;
  /** The segment's effective xAI settings from the catalog (`generationDefaults` + overrides). */
  generation?: Generation;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}

/** `python3 ... id` and then one unit per `--flag value`, for display only. */
const flagUnits = (command: string): string[] => command.split(/ (?=--)/);

const TITLES: Record<GenerateKind, string> = {
  image: 'Generate the still on xAI',
  video: 'Generate the clip on xAI',
};

/**
 * "Copy generate command": the `scripts/xai-batch.py` line for this segment, with its model,
 * aspect and the rest of its settings filled in. The still command is always there; the clip
 * command only when the cutaway's content opted in with `generation.video`.
 */
export default function GenerateCommand({
  cutawayId,
  segmentId,
  generation,
  copiedKey,
  onCopy,
}: GenerateCommandProps) {
  const kinds: GenerateKind[] = generation?.video ? ['image', 'video'] : ['image'];

  return (
    <section className="min-h-0" aria-label="Generate on xAI">
      {kinds.map((kind) => {
        const command = buildGenerateCommand(cutawayId, segmentId, kind, generation);
        const dryRun = buildGenerateCommand(cutawayId, segmentId, kind, generation, {
          dryRun: true,
        });
        const key = `${segmentId}:generate-${kind}`;
        return (
          <div key={kind} className="mb-4 last:mb-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-400">{TITLES[kind]}</h3>
              <div className="flex gap-2">
                <CopyButton
                  copied={copiedKey === `${key}:dry`}
                  label="Copy dry run"
                  onClick={() => onCopy(dryRun, 'dry-run command', `${key}:dry`)}
                />
                <CopyButton
                  copied={copiedKey === key}
                  label="Copy command"
                  onClick={() => onCopy(command, 'generate command', key)}
                />
              </div>
            </div>
            <pre className="overflow-auto rounded-md border border-zinc-800 bg-black/80 p-4 text-sm leading-6 whitespace-pre-wrap text-zinc-200">
              {flagUnits(command).map((unit, index) => (
                // Each `--flag value` stays whole, so a narrow column wraps between flags and
                // never inside `--resolution`. The copied text is the plain string, not this.
                <span key={unit} className="inline-block break-words">
                  {index > 0 ? ' ' : ''}
                  {unit}
                </span>
              ))}
            </pre>
          </div>
        );
      })}
      <p className="text-xs leading-5 text-zinc-500">
        Needs <code className="font-mono">XAI_API_KEY</code> in your shell. It is a paid API: run
        the dry run first, which lists the prompt and settings and spends nothing.
      </p>
    </section>
  );
}
