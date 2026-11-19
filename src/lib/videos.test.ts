import { describe, expect, it } from 'vitest';

import {
  buildVideoItems,
  finalizedVideoItems,
  hasTake,
  isDirectVideoUrl,
  type VideoSources,
} from './videos';

const sources: VideoSources = {
  scenes: [
    {
      id: 'daisy-bell',
      title: 'Daisy Bell',
      videos: [
        {
          id: 'slideshow',
          title: 'Timed slideshow',
          kind: 'slideshow',
          url: 'https://example.com/daisy.mp4',
          status: 'generated',
          runtime: '~4:20',
          note: 'Hosted elsewhere.',
        },
      ],
    },
  ],
  timeline: [
    {
      episode: '01',
      scene: { id: 'scene-001', title: 'Opening', timestamp: '00:00:00', status: 'generated' },
    },
    {
      episode: '01',
      scene: { id: 'scene-002', title: 'Corset', timestamp: '00:01:00', status: 'suggested' },
    },
    {
      episode: '02',
      scene: {
        id: 'scene-001',
        title: 'Linked idea',
        timestamp: '00:00:00',
        status: 'suggested',
        mediaUrl: 'https://example.com/linked.mp4',
      },
    },
    {
      episode: '03',
      scene: { id: 'scene-009', title: 'Locked', timestamp: '00:09:00', status: 'final' },
    },
  ],
  archive: [
    {
      id: 'a-still',
      title: 'A still',
      mediaType: 'image',
      status: 'final',
      episodeLabel: 'Episode 01',
    },
    {
      id: 'a-clip',
      title: 'A clip',
      mediaType: 'video',
      status: 'approved',
      episodeLabel: 'Episode 02',
    },
  ],
  cutaways: [
    { id: 'idea', title: 'Idea', status: 'ready-to-generate', episode: 'Gag', runtime: '~8s' },
    { id: 'taken', title: 'Taken', status: 'in-edit', episode: 'Musical', runtime: '~1:00' },
  ],
};

describe('buildVideoItems', () => {
  const items = buildVideoItems(sources);
  const keys = items.map((item) => item.key);

  it('collects scene videos, Timeline clips, archive clips and cutaways that have a take', () => {
    expect(keys).toEqual([
      'timeline:03:scene-009', // final
      'archive:a-clip', // approved
      'cutaway:taken', // in-edit
      'scene:daisy-bell:slideshow', // generated, source order kept within a stage
      'timeline:01:scene-001',
      'timeline:02:scene-001', // suggested, but a file is linked
    ]);
  });

  it('leaves out ideas, and archive stills, that are not video yet', () => {
    expect(keys).not.toContain('timeline:01:scene-002');
    expect(keys).not.toContain('cutaway:idea');
    expect(keys).not.toContain('archive:a-still');
  });

  it('describes where each one came from and links to the page that owns it', () => {
    const slideshow = items.find((item) => item.key === 'scene:daisy-bell:slideshow');
    expect(slideshow).toMatchObject({
      title: 'Daisy Bell — Timed slideshow',
      context: 'Scene · Daisy Bell · slideshow · ~4:20',
      url: 'https://example.com/daisy.mp4',
      to: '/show/scenes/daisy-bell',
      note: 'Hosted elsewhere.',
    });
    expect(items.find((item) => item.key === 'timeline:01:scene-001')).toMatchObject({
      context: 'Timeline · Episode 01 · 00:00:00',
      to: '/show/timeline',
    });
    expect(items.find((item) => item.key === 'timeline:01:scene-001')?.url).toBeUndefined();
    expect(items.find((item) => item.key === 'cutaway:taken')?.to).toBe('/show/suggestions/taken');
    expect(items.find((item) => item.key === 'archive:a-clip')?.to).toBe(
      '/show/archive?q=A%20clip',
    );
  });

  it('is empty when nothing has been generated', () => {
    expect(buildVideoItems({ scenes: [], timeline: [], archive: [], cutaways: [] })).toEqual([]);
  });
});

describe('finalizedVideoItems', () => {
  it('keeps only Approved and Final', () => {
    const finished = finalizedVideoItems(buildVideoItems(sources));
    expect(finished.map((item) => item.key)).toEqual(['timeline:03:scene-009', 'archive:a-clip']);
  });
});

describe('hasTake', () => {
  it('treats the two idea stages as "no take" unless a file is linked', () => {
    expect(hasTake({ status: 'suggested' })).toBe(false);
    expect(hasTake({ status: 'ready-to-generate' })).toBe(false);
    expect(hasTake({ status: 'generated' })).toBe(true);
    expect(hasTake({ status: 'suggested', url: 'https://example.com/x.mp4' })).toBe(true);
  });
});

describe('isDirectVideoUrl', () => {
  it('plays files a <video> understands and links out everything else', () => {
    expect(
      isDirectVideoUrl('https://test.1ink.us/weeks-on-fire/assets/daisy-bell-slideshow.mp4'),
    ).toBe(true);
    expect(isDirectVideoUrl('https://cdn.example.com/a.WEBM?token=1')).toBe(true);
    expect(isDirectVideoUrl('https://drive.google.com/file/d/abc/view')).toBe(false);
    expect(isDirectVideoUrl('https://imgur.com/a/clip')).toBe(false);
    expect(isDirectVideoUrl('https://example.com/not-mp4.html')).toBe(false);
  });
});
