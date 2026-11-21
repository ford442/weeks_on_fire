import type { FrameStats } from './core';

export interface StatsSummary {
  /** Frames in the window. */
  frames: number;
  /** Drawn frames per second over the window, from arrival times on the main thread. */
  fps: number;
  cpuMsAvg: number;
  cpuMsMax: number;
  /** The latest frame's counters (they are per frame, not averaged). */
  drawCalls: number;
  instances: number;
  uniformCalls: number;
  bufferUploads: number;
  width: number;
  height: number;
}

/** Rolling window of the last `size` drawn frames, for the `?stats` overlay. */
export class FrameStatsWindow {
  private readonly frames: FrameStats[] = [];
  private readonly arrivals: number[] = [];

  constructor(private readonly size = 60) {}

  push(stats: FrameStats, arrivedAtMs: number): void {
    this.frames.push(stats);
    this.arrivals.push(arrivedAtMs);
    if (this.frames.length > this.size) {
      this.frames.shift();
      this.arrivals.shift();
    }
  }

  clear(): void {
    this.frames.length = 0;
    this.arrivals.length = 0;
  }

  summary(): StatsSummary | null {
    const latest = this.frames[this.frames.length - 1];
    if (!latest) return null;
    let total = 0;
    let max = 0;
    for (const frame of this.frames) {
      total += frame.cpuMs;
      max = Math.max(max, frame.cpuMs);
    }
    const first = this.arrivals[0] ?? 0;
    const last = this.arrivals[this.arrivals.length - 1] ?? 0;
    const spanSec = (last - first) / 1000;
    return {
      frames: this.frames.length,
      fps: spanSec > 0 ? (this.arrivals.length - 1) / spanSec : 0,
      cpuMsAvg: total / this.frames.length,
      cpuMsMax: max,
      drawCalls: latest.drawCalls,
      instances: latest.instances,
      uniformCalls: latest.uniformCalls,
      bufferUploads: latest.bufferUploads,
      width: latest.width,
      height: latest.height,
    };
  }
}
