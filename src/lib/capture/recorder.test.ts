import { describe, expect, it, vi } from 'vitest';

import { TakeRecorder } from './recorder';
import { pickRecordingFormat } from './support';

/** A MediaRecorder stand-in: state machine plus the events TakeRecorder listens for. */
class FakeRecorder extends EventTarget {
  static last: FakeRecorder | null = null;
  state: RecordingState = 'inactive';
  options: MediaRecorderOptions | undefined;
  calls: string[] = [];

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    super();
    this.options = options;
    FakeRecorder.last = this;
  }

  start() {
    this.calls.push('start');
    this.state = 'recording';
  }
  pause() {
    this.calls.push('pause');
    this.state = 'paused';
  }
  resume() {
    this.calls.push('resume');
    this.state = 'recording';
  }
  stop() {
    this.calls.push('stop');
    this.state = 'inactive';
    const data = new Event('dataavailable') as Event & { data: Blob };
    data.data = new Blob([new Uint8Array([1, 2, 3])]);
    this.dispatchEvent(data);
    this.dispatchEvent(new Event('stop'));
  }
}

function setup() {
  let now = 0;
  const recorder = new TakeRecorder(
    {} as MediaStream,
    { mimeType: 'video/mp4', extension: 'mp4' },
    { now: () => now, Recorder: FakeRecorder as unknown as typeof MediaRecorder },
  );
  const fake = FakeRecorder.last;
  if (!fake) throw new Error('no recorder');
  return { recorder, fake, advance: (ms: number) => (now += ms) };
}

describe('pickRecordingFormat', () => {
  it('prefers VP9 WebM, with Opus when there is audio', () => {
    expect(pickRecordingFormat(false, () => true)).toEqual({
      mimeType: 'video/webm;codecs=vp9',
      extension: 'webm',
    });
    expect(pickRecordingFormat(true, () => true)?.mimeType).toBe('video/webm;codecs=vp9,opus');
  });

  it('falls back to VP8, then to MP4 (Safari)', () => {
    expect(pickRecordingFormat(false, (type) => type.includes('vp8'))?.mimeType).toBe(
      'video/webm;codecs=vp8',
    );
    expect(pickRecordingFormat(false, (type) => type === 'video/mp4')).toEqual({
      mimeType: 'video/mp4',
      extension: 'mp4',
    });
  });

  it('returns null when nothing is supported, or the check throws', () => {
    expect(pickRecordingFormat(false, () => false)).toBeNull();
    expect(
      pickRecordingFormat(false, () => {
        throw new Error('no');
      }),
    ).toBeNull();
  });
});

describe('TakeRecorder', () => {
  it('records in one-second chunks with the chosen type', () => {
    const { recorder, fake } = setup();
    const start = vi.spyOn(fake, 'start');
    recorder.start();
    expect(start).toHaveBeenCalledWith(1000);
    expect(fake.options?.mimeType).toBe('video/mp4');
  });

  it('counts only the time it was recording', async () => {
    const { recorder, advance } = setup();
    recorder.start();
    advance(4000);
    recorder.setPaused(true);
    advance(10_000); // hidden tab: not part of the take
    expect(recorder.elapsedSec).toBe(4);
    recorder.setPaused(false);
    advance(6000);
    const take = await recorder.stop();
    expect(take.durationSec).toBe(10);
    expect(take.blob.size).toBe(3);
    expect(take.blob.type).toBe('video/mp4');
  });

  it('pauses and resumes idempotently', () => {
    const { recorder, fake } = setup();
    recorder.start();
    recorder.setPaused(true);
    recorder.setPaused(true);
    recorder.setPaused(false);
    recorder.setPaused(false);
    expect(fake.calls).toEqual(['start', 'pause', 'resume']);
  });

  it('rejects the take when the recorder reported an error', async () => {
    const onError = vi.fn();
    const recorder = new TakeRecorder(
      {} as MediaStream,
      { mimeType: 'video/webm', extension: 'webm' },
      { Recorder: FakeRecorder as unknown as typeof MediaRecorder, onError },
    );
    const fake = FakeRecorder.last;
    recorder.start();
    fake?.dispatchEvent(Object.assign(new Event('error'), { error: new Error('encoder died') }));
    expect(onError).toHaveBeenCalledWith('encoder died');
    await expect(recorder.stop()).rejects.toThrow('encoder died');
  });
});
