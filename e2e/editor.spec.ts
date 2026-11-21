import { expect, test, type Page } from '@playwright/test';

/**
 * The in-hub graph editor (`/show/sequences/:id/edit`) on the production build: its chunk loads,
 * the live player draws the draft, codegen's checks show up as readable problems, keyframes retime
 * from the strip, drafts survive a reload, and a fork needs a free slug.
 */

test.use({
  reducedMotion: 'reduce',
  // Desktop chrome: the editor hides itself under the `lg` breakpoint.
  viewport: { width: 1600, height: 1000 },
  permissions: ['clipboard-read', 'clipboard-write'],
});

const EDITOR = 'lattice-hymn.graph.json';

async function open(page: Page, path = 'show/sequences/lattice-hymn/edit') {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('textbox', { name: EDITOR })).toBeVisible();
}

/** The whole document, through the clipboard (CodeMirror only renders the lines on screen). */
async function documentText(page: Page): Promise<string> {
  await page.getByRole('textbox', { name: EDITOR }).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  return page.evaluate(() => navigator.clipboard.readText());
}

async function replaceInDocument(page: Page, from: string, to: string) {
  const text = await documentText(page);
  expect(text).toContain(from);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(text.replace(from, to));
}

test('edits a graph with codegen problems inline, and plays the last valid version', async ({
  page,
}) => {
  await open(page);
  const canvas = page.getByRole('img', { name: 'Lattice Hymn 3D sequence' });
  await expect(canvas).toHaveAttribute('data-gl', /webgl/);
  await expect(page.getByText('Valid graph: codegen would accept it.')).toBeVisible();

  await replaceInDocument(page, '"radius": 0.28', '"radius": -0.28');
  await expect(
    page.getByRole('button', { name: 'node core: geometry.radius must be positive' }),
  ).toBeVisible();
  await replaceInDocument(
    page,
    '"spin": [0, 28.6, 0]',
    '"spin": [0, 28.6, 0], "squash": "1 + pulsee"',
  );
  await expect(
    page.getByRole('button', {
      name: /node core: squash expression "1 \+ pulsee": unknown name "pulsee"/,
    }),
  ).toBeVisible();

  await replaceInDocument(page, '"radius": -0.28', '"radius": 0.28');
  await replaceInDocument(page, '"1 + pulsee"', '"1 + 0.2 * sin(t * 6)"');
  await expect(page.getByText('Valid graph: codegen would accept it.')).toBeVisible();

  // The draft is kept in this browser.
  await page.reload();
  await expect(page.getByText('Draft saved in this browser')).toBeVisible();
  expect(await documentText(page)).toContain('sin(t * 6)');
  await page.getByRole('button', { name: 'Revert to catalog' }).click();
  await expect(page.getByText('Matches the catalog')).toBeVisible();
});

test('scrubs from the strip and retimes a keyframe by dragging and by keyboard', async ({
  page,
}) => {
  await open(page);
  const ruler = page.getByRole('slider', { name: 'Scrub the film' });
  const box = await ruler.boundingBox();
  if (!box) throw new Error('no ruler');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('slider', { name: 'Seek Lattice Hymn' })).toHaveValue('8');

  const key = page.getByRole('button', { name: 'camera.radius key 2 at 3.5 seconds' });
  const kb = await key.boundingBox();
  if (!kb) throw new Error('no key');
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2);
  await page.mouse.down();
  await page.mouse.move(kb.x + kb.width / 2 + box.width / 8, kb.y + kb.height / 2, { steps: 4 });
  await page.mouse.up();
  const moved = page.getByRole('button', { name: /^camera\.radius key 2 at / });
  await expect(moved).not.toHaveAccessibleName('camera.radius key 2 at 3.5 seconds');
  const label = (await moved.getAttribute('aria-label')) ?? '';
  const seconds = Number(/at ([\d.]+) seconds/.exec(label)?.[1]);
  expect(seconds).toBeGreaterThan(4.5);
  expect(seconds).toBeLessThan(6.5);

  await moved.focus();
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(
    page.getByRole('button', {
      name: `camera.radius key 2 at ${Math.round((seconds - 1) * 100) / 100} seconds`,
    }),
  ).toBeVisible();
  // Only that key's number changed in the JSON.
  expect(await documentText(page)).toContain(
    `{"t": ${Math.round((seconds - 1) * 100) / 100}, "v": 5}`,
  );
});

test('forks under a new id only when the id is a free slug', async ({ page }) => {
  await open(page);
  const input = page.getByLabel('New id');
  await input.fill('Lattice Hymn');
  await expect(page.locator('#fork-id-problem')).toContainText('lowercase letters and digits');
  await input.fill('kick-lattice');
  await expect(page.locator('#fork-id-problem')).toHaveText(
    '"kick-lattice" is already a sequence.',
  );
  await input.fill('lattice-hymn-two');
  await page.getByRole('button', { name: 'Fork' }).click();
  await expect(page).toHaveURL(/\/show\/sequences\/lattice-hymn\/edit\?as=lattice-hymn-two$/);
  await expect(
    page.getByRole('heading', { name: /Graph editor · lattice-hymn-two/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Download lattice-hymn-two.graph.json' }),
  ).toBeVisible();
});
