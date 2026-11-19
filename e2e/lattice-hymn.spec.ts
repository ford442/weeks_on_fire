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
 * GL), and asserts the player got a context and drew something recognisably the same film.
 *
 * Update the committed frames after an intentional visual change with `npm run test:e2e:update`.
 */

const SEQUENCE = { id: 'lattice-hymn', title: 'Lattice Hymn' } as const;
const FIXTURE_PATH = join(import.meta.dirname, 'fixtures', `${SEQUENCE.id}.frames.json`);

// Reduced motion makes the player start paused at 0:00, so every frame below is a seek and the
// film clock never races the capture.
test.use({ reducedMotion: 'reduce' });

function openPlayer(page: Page, query = ''): Promise<Locator> {
  return page
    .goto(`show/sequences/${SEQUENCE.id}${query}`)
    .then(() => page.getByRole('img', { name: `${SEQUENCE.title} 3D sequence` }));
}

/** Waits for a context, then fails with the player's own explanation if it is showing one. */
async function expectContext(page: Page, canvas: Locator, testInfo: TestInfo): Promise<void> {
  await expect(canvas).toHaveAttribute('data-gl', 'webgl2');
  const overlay = page.getByText('WebGL is unavailable');
  if ((await overlay.count()) > 0) {
    throw new Error(
      `player is showing its failure overlay: ${await overlay.locator('..').innerText()}`,
    );
  }
  const renderer = await canvas.evaluate((el: HTMLCanvasElement) => {
    const gl = el.getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown';
  });
  testInfo.annotations.push({ type: 'gl-renderer', description: renderer });
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

async function seekTo(page: Page, seconds: number): Promise<void> {
  const slider = page.getByRole('slider', { name: `Seek ${SEQUENCE.title}` });
  await slider.fill(String(seconds));
  await expect(page.getByText(new RegExp(`^${timecode(seconds)} / `))).toBeVisible();
  await nextFrames(page);
}

function readFrame(page: Page): Promise<Thumbnail> {
  return page.evaluate(readThumbnailInPage, {
    selector: 'canvas[role="img"]',
    cols: GRID.cols,
    rows: GRID.rows,
  });
}

function loadFixture(): FrameFixture | undefined {
  try {
    return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as FrameFixture;
  } catch {
    return undefined;
  }
}

test('playback does not preserve the drawing buffer; only ?capture=1 does', async ({
  page,
}, testInfo) => {
  for (const [query, preserved] of [
    ['', false],
    ['?capture=1', true],
  ] as const) {
    const canvas = await openPlayer(page, query);
    await expectContext(page, canvas, testInfo);
    const attributes = await canvas.evaluate(
      (el: HTMLCanvasElement) => el.getContext('webgl2')?.getContextAttributes() ?? null,
    );
    expect(attributes, `context attributes for "${query}"`).toMatchObject({
      alpha: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: preserved,
    });
  }
});

test('draws the committed frames at 0s and 50%', async ({ page }, testInfo) => {
  const canvas = await openPlayer(page, '?capture=1');
  await expectContext(page, canvas, testInfo);

  const slider = page.getByRole('slider', { name: `Seek ${SEQUENCE.title}` });
  const duration = Number(await slider.getAttribute('max'));
  expect(duration, 'slider max is the film duration').toBeGreaterThan(0);

  const updating = ['all', 'changed'].includes(testInfo.config.updateSnapshots);
  const fixture = loadFixture();
  if (!updating && !fixture) {
    throw new Error(
      `No frame fixture at ${FIXTURE_PATH}. Generate it with: npm run test:e2e:update`,
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
    // Retried briefly: the first draw after load can land a frame or two late on a slow runner.
    await expect(async () => {
      await seekTo(page, target.timeSec);
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
      sequence: SEQUENCE.id,
      cols: GRID.cols,
      rows: GRID.rows,
      frames: captured.map(({ label, timeSec, rgb }) => ({ label, timeSec, rgb: encodeRgb(rgb) })),
    };
    mkdirSync(dirname(FIXTURE_PATH), { recursive: true });
    writeFileSync(FIXTURE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  }
});
