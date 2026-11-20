import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GenerateCommand from './GenerateCommand';

import type { Generation } from '../../../scripts/content-index/generation';

/** The command lines as displayed (each flag is its own span, so read the <pre>, not one text node). */
const shown = (): string[] => [...document.querySelectorAll('pre')].map((pre) => pre.textContent);

function setup(generation?: Generation, copiedKey: string | null = null) {
  const onCopy = vi.fn();
  render(
    <GenerateCommand
      cutawayId="mv-demo"
      segmentId="mv-demo-a-cold-open"
      generation={generation}
      copiedKey={copiedKey}
      onCopy={onCopy}
    />,
  );
  return onCopy;
}

describe('GenerateCommand', () => {
  it('shows the still command with the model and aspect, even for a cutaway with no settings', () => {
    setup();
    expect(shown()).toEqual([
      'python3 scripts/xai-batch.py mv-demo --only mv-demo-a-cold-open' +
        ' --model grok-imagine-image-quality --aspect 16:9',
    ]);
    expect(screen.queryByRole('heading', { name: /clip/i })).toBeNull();
  });

  it('shows the configured settings in the command', () => {
    setup({
      image: {
        model: 'grok-imagine-image-2.0',
        aspectRatio: '9:16',
        resolution: '2k',
        quality: 'medium',
      },
    });
    expect(shown()[0]).toContain(
      '--model grok-imagine-image-2.0 --aspect 9:16 --resolution 2k --quality medium',
    );
  });

  it('copies the real command, and the dry run with --dry-run on the end', () => {
    const onCopy = setup({ image: { aspectRatio: '1:1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Copy command' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy dry run' }));
    const [real, dry] = onCopy.mock.calls as [[string, string, string], [string, string, string]];
    expect(real[0]).toBe(
      'python3 scripts/xai-batch.py mv-demo --only mv-demo-a-cold-open' +
        ' --model grok-imagine-image-quality --aspect 1:1',
    );
    expect(dry[0]).toBe(`${real[0]} --dry-run`);
    expect(real[2]).not.toBe(dry[2]); // separate "Copied" states
  });

  it('offers a clip command only when the content opted in with generation.video', () => {
    setup({ video: { aspectRatio: '9:16', resolution: '720p', durationSec: 6 } });
    expect(screen.getByRole('heading', { name: 'Generate the still on xAI' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Generate the clip on xAI' })).toBeTruthy();
    expect(shown()).toHaveLength(2);
    expect(shown()[1]).toContain(
      '--video --model grok-imagine-video --aspect 9:16 --resolution 720p --duration 6',
    );
    expect(screen.getAllByRole('button', { name: 'Copy command' })).toHaveLength(2);
  });

  it('shows "Copied" on the button that was just used', () => {
    setup(undefined, 'mv-demo-a-cold-open:generate-image');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy dry run' })).toBeTruthy();
  });

  it('warns that the API is paid and needs a key, and never shows one', () => {
    setup();
    expect(screen.getByText(/paid API/)).toBeTruthy();
    expect(document.body.textContent).toContain('XAI_API_KEY');
    expect(document.body.textContent).not.toMatch(/xai-[A-Za-z0-9]{8,}/);
  });
});
