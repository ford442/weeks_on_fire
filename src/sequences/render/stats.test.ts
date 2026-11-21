import { describe, expect, it } from 'vitest';

import { FrameStatsWindow } from './stats';

const frame = (cpuMs: number, drawCalls = 4) => ({
  timeSec: 0,
  cpuMs,
  drawCalls,
  instances: drawCalls * 2,
  uniformCalls: 10,
  bufferUploads: 1,
  width: 640,
  height: 360,
});

describe('FrameStatsWindow', () => {
  it('is empty until a frame arrives', () => {
    expect(new FrameStatsWindow().summary()).toBeNull();
  });

  it('averages CPU time, keeps the max, and reports the latest counters', () => {
    const stats = new FrameStatsWindow();
    stats.push(frame(1, 9), 0);
    stats.push(frame(3, 5), 16);
    expect(stats.summary()).toMatchObject({
      frames: 2,
      cpuMsAvg: 2,
      cpuMsMax: 3,
      drawCalls: 5,
      instances: 10,
    });
  });

  it('measures fps from arrival times', () => {
    const stats = new FrameStatsWindow();
    for (let i = 0; i <= 30; i++) stats.push(frame(1), i * 20);
    expect(stats.summary()?.fps).toBeCloseTo(50, 5);
  });

  it('keeps only the newest frames', () => {
    const stats = new FrameStatsWindow(3);
    for (const ms of [100, 1, 1, 1]) stats.push(frame(ms), 0);
    expect(stats.summary()).toMatchObject({ frames: 3, cpuMsMax: 1 });
    stats.clear();
    expect(stats.summary()).toBeNull();
  });
});
