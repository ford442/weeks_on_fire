import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

import {
  GRID,
  compareFrames,
  decodeRgb,
  describeDiff,
  encodeRgb,
  isFlat,
  readThumbnailInPage,
  type FrameFixture,
  type Thumbnail,
} from './frame';

/**
 * Real-GL check of the 3D player. Vitest runs under jsdom, whose `getContext` returns null, so
 * nothing else in CI ever executes a shader. This opens the production build in Chromium (software
 * GL), and asserts the player got a context and drew something recognisably the same film, on
 * both renderers: the render worker (the default) and the in-thread fallback (`?renderer=main`).
 *
 * Both renderers are compared to the same committed frames, so "identical frames" is checked, not
 * assumed. The fixtures were taken from the in-thread engine before the worker existed.
 *
 * Update the committed frames after an intentional visual change with `npm run test:e2e:update`
 * (only the worker run writes; the in-thread run is then compared against what it wrote).
 */

const SEQUENCES = [
  // Graph-backed: lines, a lit core, point sprites.
  { id: 'lattice-hymn', title: 'Lattice Hymn' },
  // Cel puppets with afterimage ghosts: the instanced path's busiest scene.
  { id: 'hose-chase', title: 'Hose Chase' },
  // Custom lattice: instanced line cubes plus per-frame spark rewrites.
  { id: 'kick-lattice', title: 'Kick Lattice' },
  // Ribbon rebuilt through the geometry kernel while it morphs.
  { id: 'mobius-chrome', title: 'Möbius Chrome' },
] as const;

type Sequence = (typeof SEQUENCES)[number];

const RENDERERS = [
  { mode: 'worker', query: '' },
  { mode: 'main', query: '&renderer=main' },
] as const;

type Renderer = (typeof RENDERERS)[number];

function fixturePath(sequence: Sequence): string {
  return join(import.meta.dirname, 'fixtures', `${sequence.id}.frames.json`);
}

// Reduced motion makes the player start paused at 0:00, so every frame below is a seek and the
// film clock never races the capture.
test.use({ reducedMotion: 'reduce' });

async function openPlayer(page: Page, sequence: Sequence, query: string): Promise<Locator> {
  await page.goto(`show/sequences/${sequence.id}?${query.replace(/^&/, '')}`);
  return page.getByRole('img', { name: `${sequence.title} 3D sequence` });
}

/** Waits for a context, then fails with the player's own explanation if it is showing one. */
async function expectContext(
  page: Page,
  canvas: Locator,
  mode: Renderer['mode'],
  testInfo: TestInfo,
): Promise<void> {
  await expect(canvas).toHaveAttribute('data-gl', 'webgl2');
  await expect(canvas, 'the renderer the player says drew the frame').toHaveAttribute(
    'data-renderer',
    mode,
  );
  const overlay = page.getByText('WebGL is unavailable');
  if ((await overlay.count()) > 0) {
    throw new Error(
      `player is showing its failure overlay: ${await overlay.locator('..').innerText()}`,
    );
  }
  const renderer = await canvas.getAttribute('data-gl-renderer');
  testInfo.annotations.push({ type: 'gl-renderer', description: renderer ?? 'unknown' });
}

/** Resolves after `count` animation frames, so a draw queued before the call has finished. */
function nextFrames(page: Page, count = 2): Promise<void> {
  return page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        const step = (left: number) =>
          requestAnimationFrame(() => (left <= 1 ? resolve() : step(left - 1)));
        step(n);
      }),
    count,
  );
}

function timecode(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

async function seekTo(page: Page, sequence: Sequence, seconds: number): Promise<void> {
  const slider = page.getByRole('slider', { name: `Seek ${sequence.title}` });
  await slider.fill(String(seconds));
  await expect(page.getByText(new RegExp(`^${timecode(seconds)} / `))).toBeVisible();
  await nextFrames(page);
}

/**
 * Reads the page canvas. On the worker path that is the placeholder `<canvas>`, which shows the
 * frame the worker last committed, so `drawImage` reads the worker's picture.
 */
function readFrame(page: Page): Promise<Thumbnail> {
  return page.evaluate(readThumbnailInPage, {
    selector: 'canvas[role="img"]',
    cols: GRID.cols,
    rows: GRID.rows,
  });
}

function loadFixture(sequence: Sequence): FrameFixture | undefined {
  try {
    return JSON.parse(readFileSync(fixturePath(sequence), 'utf8')) as FrameFixture;
  } catch {
    return undefined;
  }
}

for (const { mode, query } of RENDERERS) {
  test(`${mode}: playback does not preserve the drawing buffer; only ?capture=1 does`, async ({
    page,
  }, testInfo) => {
    const sequence = SEQUENCES[0];
    for (const [flags, preserved] of [
      [query, false],
      [`capture=1${query}`, true],
    ] as const) {
      const canvas = await openPlayer(page, sequence, flags);
      await expectContext(page, canvas, mode, testInfo);
      // Reported by the context that was created (in the worker, or here), not echoed from the request.
      await expect(canvas, `context attributes for "?${flags}"`).toHaveAttribute(
        'data-preserve-drawing-buffer',
        String(preserved),
      );
      const pageContext = await canvas.evaluate((el: HTMLCanvasElement) => {
        try {
          const gl = el.getContext('webgl2');
          return gl ? { owner: 'page', attrs: gl.getContextAttributes() } : { owner: 'none' };
        } catch (error) {
          return { owner: (error as Error).name };
        }
      });
      if (mode === 'worker') {
        // A transferred canvas refuses getContext: the page thread really is not drawing.
        expect(pageContext.owner).toBe('InvalidStateError');
      } else {
        expect(pageContext).toMatchObject({
          owner: 'page',
          attrs: { alpha: false, depth: true, stencil: false, preserveDrawingBuffer: preserved },
        });
      }
    }
  });
}

test.describe('without the render worker', () => {
  // The hub's service worker would answer the request before page.route could abort it.
  test.use({ serviceWorkers: 'block' });

  test('falls back in-thread when the render worker cannot load', async ({ page }, testInfo) => {
    let blocked = 0;
    await page.route(/\/renderWorker-[^/]*\.js$/, (route) => {
      blocked += 1;
      return route.abort();
    });
    const sequence = SEQUENCES[0];
    const canvas = await openPlayer(page, sequence, 'capture=1');
    await expectContext(page, canvas, 'main', testInfo);
    expect(blocked, 'the worker script was requested and refused').toBeGreaterThan(0);
    await seekTo(page, sequence, 0);
    await expect(async () => {
      expect(isFlat((await readFrame(page)).rgb)).toBe(false);
    }).toPass({ timeout: 10_000 });
  });
});

for (const sequence of SEQUENCES) {
  for (const { mode, query } of RENDERERS) {
    test(`${sequence.id} (${mode}): draws the committed frames at 0s and 50%`, async ({
      page,
    }, testInfo) => {
      const canvas = await openPlayer(page, sequence, `capture=1${query}`);
      await expectContext(page, canvas, mode, testInfo);

      const slider = page.getByRole('slider', { name: `Seek ${sequence.title}` });
      const duration = Number(await slider.getAttribute('max'));
      expect(duration, 'slider max is the film duration').toBeGreaterThan(0);

      // Only the worker run rewrites fixtures; the in-thread run always compares.
      const updating =
        mode === 'worker' && ['all', 'changed'].includes(testInfo.config.updateSnapshots);
      const fixture = loadFixture(sequence);
      if (!updating && !fixture) {
        throw new Error(
          `No frame fixture at ${fixturePath(sequence)}. Generate it with: npm run test:e2e:update`,
        );
      }

      const targets = [
        { label: '0s', timeSec: 0 },
        { label: '50%', timeSec: duration / 2 },
      ];
      const captured: { label: string; timeSec: number; rgb: number[] }[] = [];

      for (const target of targets) {
        const expected = fixture?.frames.find((frame) => frame.label === target.label);
        if (!updating && !expected) {
          throw new Error(`Fixture has no "${target.label}" frame. Run: npm run test:e2e:update`);
        }

        let latest: Thumbnail | undefined;
        // Retried briefly: the first draw after load can land a frame or two late on a slow
        // runner, and a worker frame reaches the placeholder canvas a compositor frame later.
        await expect(async () => {
          await seekTo(page, sequence, target.timeSec);
          latest = await readFrame(page);
          expect(
            isFlat(latest.rgb),
            `${target.label}: the canvas is one flat colour (cleared frame, shader that failed to link, or nothing drawn)`,
          ).toBe(false);
          if (!updating && expected) {
            const diff = compareFrames(latest.rgb, decodeRgb(expected.rgb));
            expect(diff.ok, describeDiff(target.label, diff)).toBe(true);
          }
        }).toPass({ timeout: 10_000, intervals: [250, 500, 1000] });

        if (latest) {
          await testInfo.attach(`frame-${target.label.replace('%', 'pct')}.png`, {
            body: Buffer.from(latest.png.replace(/^data:image\/png;base64,/, ''), 'base64'),
            contentType: 'image/png',
          });
          captured.push({ ...target, rgb: latest.rgb });
        }
      }

      const [first, middle] = captured;
      if (first && middle) {
        const between = compareFrames(first.rgb, middle.rgb);
        expect(between.ok, 'the film at 50% must look different from 0s').toBe(false);
      }

      if (updating) {
        const next: FrameFixture = {
          sequence: sequence.id,
          cols: GRID.cols,
          rows: GRID.rows,
          frames: captured.map(({ label, timeSec, rgb }) => ({
            label,
            timeSec,
            rgb: encodeRgb(rgb),
          })),
        };
        mkdirSync(dirname(fixturePath(sequence)), { recursive: true });
        writeFileSync(fixturePath(sequence), `${JSON.stringify(next, null, 2)}\n`);
      }
    });
  }
}
