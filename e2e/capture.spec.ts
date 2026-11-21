import { expect, test, type Page } from '@playwright/test';

/**
 * In-hub capture (docs/capture.md), end to end in Chromium: a Record press makes a WebM take whose
 * length matches the catalog (±1 s, read back by a `<video>` from the file's own Duration), and a
 * cutaway's local stills reach the recorded canvas. Real time: each take runs as long as its cut.
 */

const TOLERANCE_SEC = 1;

interface TakeInfo {
  duration: number;
  type: string;
  width: number;
  height: number;
  size: number;
}

/** Reads the newest take back the way a viewer would: through a `<video>`. */
async function readTake(page: Page): Promise<TakeInfo> {
  const shelf = page.getByRole('region', { name: 'Recorded takes' });
  await expect(shelf).toBeVisible({ timeout: 120_000 });
  return shelf
    .locator('video')
    .first()
    .evaluate(async (node) => {
      const video = node as HTMLVideoElement;
      if (video.readyState < 1) {
        await new Promise((resolve) =>
          video.addEventListener('loadedmetadata', resolve, { once: true }),
        );
      }
      const blob = await (await fetch(video.src)).blob();
      return {
        duration: video.duration,
        type: blob.type,
        width: video.videoWidth,
        height: video.videoHeight,
        size: blob.size,
      };
    });
}

test.describe('in-hub capture', () => {
  test.setTimeout(120_000);

  test('a sequence take runs as long as the catalog says', async ({ page }) => {
    // Spoon Whip: 12 s in content/sequences/spoon-whip.json.
    await page.goto('show/sequences/spoon-whip');
    await page.getByRole('button', { name: 'Record take' }).click();
    await expect(page.getByRole('button', { name: 'Stop take' })).toBeVisible();
    // The take draws in-thread with a preserved drawing buffer, only while it runs.
    const canvas = page.locator('canvas[data-renderer]');
    await expect(canvas).toHaveAttribute('data-renderer', 'main');
    await expect(canvas).toHaveAttribute('data-preserve-drawing-buffer', 'true');

    const take = await readTake(page);
    expect(take.type).toBe('video/webm');
    expect(Number.isFinite(take.duration)).toBe(true);
    expect(Math.abs(take.duration - 12)).toBeLessThanOrEqual(TOLERANCE_SEC);
    expect([take.width, take.height]).toEqual([1280, 720]);

    await expect(page.getByRole('button', { name: 'Record take' })).toBeEnabled();
    await expect(canvas).toHaveAttribute('data-preserve-drawing-buffer', 'false');
  });

  test('a musical cutaway take records its local stills', async ({ page }) => {
    // The Soft Gyre: five 6 s shots, each a repo still (content/cutaways/the-soft-gyre.json).
    await page.goto('show/suggestions/the-soft-gyre');
    await page.getByRole('button', { name: 'Record take' }).click();
    const capture = page.getByRole('img', { name: 'The Soft Gyre capture' });
    await expect(capture).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('status')).toContainText('REC', { timeout: 20_000 });

    // Mid-shot, the recorded canvas holds a picture, not a flat placeholder (and is origin-clean,
    // or getImageData would throw).
    await page.waitForTimeout(3000);
    const spread = await capture.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let min = 255;
      let max = 0;
      for (let i = 0; i < data.length; i += 4 * 97) {
        const luma = ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0)) / 3;
        min = Math.min(min, luma);
        max = Math.max(max, luma);
      }
      return max - min;
    });
    expect(spread).toBeGreaterThan(60);

    const take = await readTake(page);
    expect(take.type).toBe('video/webm');
    expect(Math.abs(take.duration - 30)).toBeLessThanOrEqual(TOLERANCE_SEC);
    expect([take.width, take.height]).toEqual([1280, 720]);
  });
});
