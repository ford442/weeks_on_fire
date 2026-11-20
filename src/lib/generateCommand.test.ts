import { describe, expect, it } from 'vitest';

import { buildGenerateCommand, shellQuote } from './generateCommand';

describe('shellQuote', () => {
  it('leaves ordinary ids, ratios and model names bare', () => {
    for (const word of [
      'mv-ultra-a-cold-open',
      '16:9',
      '9:19.5',
      'grok-imagine-image-2.0',
      '720p',
    ]) {
      expect(shellQuote(word)).toBe(word);
    }
  });

  it('single-quotes anything the shell would interpret', () => {
    expect(shellQuote('two words')).toBe("'two words'");
    expect(shellQuote('a;b')).toBe("'a;b'");
    expect(shellQuote('$(rm -rf ~)')).toBe("'$(rm -rf ~)'");
    expect(shellQuote("it's")).toBe(`'it'\\''s'`);
    expect(shellQuote('')).toBe("''");
  });
});

describe('buildGenerateCommand (stills)', () => {
  it('always carries the model and aspect, falling back to the runner defaults', () => {
    expect(buildGenerateCommand('well-fall', 'well-fall-a-lip', 'image', undefined)).toBe(
      'python3 scripts/xai-batch.py well-fall --only well-fall-a-lip' +
        ' --model grok-imagine-image-quality --aspect 16:9',
    );
  });

  it('spells out every configured option, as the API names them', () => {
    expect(
      buildGenerateCommand('c', 's', 'image', {
        image: {
          model: 'grok-imagine-image-2.0',
          aspectRatio: '9:16',
          resolution: '2k',
          quality: 'medium',
          responseFormat: 'b64_json',
          n: 3,
        },
      }),
    ).toBe(
      'python3 scripts/xai-batch.py c --only s --model grok-imagine-image-2.0 --aspect 9:16' +
        ' --resolution 2k --quality medium --response-format b64_json --n 3',
    );
  });

  it('leaves out an n of 1, which is the default', () => {
    expect(buildGenerateCommand('c', 's', 'image', { image: { n: 1 } })).not.toContain('--n');
  });

  it('ignores clip settings, and fills what the content left unset', () => {
    const command = buildGenerateCommand('c', 's', 'image', {
      image: { aspectRatio: '1:1' },
      video: { durationSec: 5 },
    });
    expect(command).toContain('--model grok-imagine-image-quality --aspect 1:1');
    expect(command).not.toContain('--video');
    expect(command).not.toContain('--duration');
  });

  it('appends --dry-run on request, last', () => {
    const command = buildGenerateCommand('c', 's', 'image', undefined, { dryRun: true });
    expect(command.endsWith(' --dry-run')).toBe(true);
    expect(buildGenerateCommand('c', 's', 'image', undefined)).not.toContain('--dry-run');
  });

  it('quotes an id that is not shell-safe, so a copied command cannot run something else', () => {
    expect(buildGenerateCommand('a b', 's;x', 'image', undefined)).toContain("'a b' --only 's;x'");
  });
});

describe('buildGenerateCommand (clips)', () => {
  it('uses the video defaults and leaves the length to the runner unless the content sets one', () => {
    expect(buildGenerateCommand('c', 's', 'video', { video: {} })).toBe(
      'python3 scripts/xai-batch.py c --only s --video --model grok-imagine-video --aspect 16:9',
    );
  });

  it('spells out the configured clip options', () => {
    expect(
      buildGenerateCommand(
        'c',
        's',
        'video',
        {
          video: {
            model: 'grok-imagine-video-1.5',
            aspectRatio: '9:16',
            resolution: '720p',
            durationSec: 6,
          },
        },
        { dryRun: true },
      ),
    ).toBe(
      'python3 scripts/xai-batch.py c --only s --video --model grok-imagine-video-1.5 --aspect 9:16' +
        ' --resolution 720p --duration 6 --dry-run',
    );
  });

  it('ignores still settings', () => {
    const command = buildGenerateCommand('c', 's', 'video', { image: { quality: 'low', n: 4 } });
    expect(command).not.toContain('--quality');
    expect(command).not.toContain('--n');
  });
});
