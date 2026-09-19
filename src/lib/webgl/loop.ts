export interface LoopState {
  playing: boolean;
  documentHidden: boolean;
  contextLost: boolean;
}

/** Whether the rAF loop should keep ticking. Paused / hidden / lost players draw on demand only. */
export function shouldAnimate(state: LoopState): boolean {
  return state.playing && !state.documentHidden && !state.contextLost;
}
