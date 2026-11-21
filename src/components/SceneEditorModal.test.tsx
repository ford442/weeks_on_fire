import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { addTake, resetTakesForTest, type CaptureTake } from '../lib/capture/takes';

import SceneEditorModal from './SceneEditorModal';

import type { ProductionScene } from '../data/production';

const scene: ProductionScene = {
  id: 'scene-002',
  order: 2,
  title: 'Hose chase insert',
  timestamp: '00:01:10',
  description: '',
  mediaUrl: '',
  status: 'in-edit',
  addedAt: '2026-08-31T12:00:00Z',
  lastEditedAt: '2026-11-19T12:00:00Z',
  history: [],
};

beforeEach(() => {
  let urls = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => `blob:http://localhost/take-${(urls += 1)}`,
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });
});

afterEach(() => {
  resetTakesForTest();
  delete (URL as Partial<typeof URL>).createObjectURL;
  delete (URL as Partial<typeof URL>).revokeObjectURL;
});

function renderEditor(initial: ProductionScene = scene) {
  const onSave = vi.fn<(updated: ProductionScene) => void>();
  render(<SceneEditorModal scene={initial} onClose={() => undefined} onSave={onSave} />);
  return onSave;
}

function recordTake(): CaptureTake {
  let take: CaptureTake | undefined;
  act(() => {
    take = addTake({
      kind: 'sequence',
      sourceId: 'hose-chase',
      title: 'Hose Chase',
      blob: new Blob(['take'], { type: 'video/webm' }),
      extension: 'webm',
      durationSec: 16.02,
      expectedDurationSec: 16,
    });
  });
  if (!take) throw new Error('no take');
  return take;
}

describe('SceneEditorModal media', () => {
  it('offers no take picker until something was recorded in this tab', () => {
    renderEditor();
    expect(screen.queryByLabelText(/take recorded in this tab/)).toBeNull();
  });

  it('attaches a take from this tab and says plainly that it is session only', () => {
    const take = recordTake();
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText(/take recorded in this tab/), {
      target: { value: take.url },
    });
    expect(screen.getByLabelText('Media URL (Drive / external)')).toHaveProperty('value', take.url);
    const note = screen.getByRole('note');
    expect(note.textContent).toMatch(/Session only/);
    expect(note.textContent).toMatch(/not sent to clip_stacker/);
    expect(screen.getByLabelText('Hose Chase take')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Save & append history/ }));
    expect(onSave.mock.lastCall?.[0].mediaUrl).toBe(take.url);
  });

  it('says when a session take is gone (discarded, or the tab reloaded)', () => {
    renderEditor({ ...scene, mediaUrl: 'blob:http://localhost/old-take' });
    expect(screen.getByRole('note').textContent).toMatch(/This take is gone/);
  });

  it('keeps a hosted link without comment', () => {
    renderEditor({ ...scene, mediaUrl: 'https://drive.google.com/file/d/abc/view' });
    expect(screen.queryByRole('note')).toBeNull();
  });
});
