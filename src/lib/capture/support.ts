/**
 * What the browser can record, checked without loading the recorder itself (the Record buttons
 * need the answer on first paint; the recorder is a lazy chunk).
 */

export interface RecordingFormat {
  mimeType: string;
  extension: 'webm' | 'mp4';
}

/** Best first. WebM is the target; MP4 is for Safari, whose MediaRecorder has no WebM. */
const VIDEO_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
const AUDIO_VIDEO_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

export const DEFAULT_CAPTURE_FPS = 30;
export function pickRecordingFormat(
  withAudio: boolean,
  isTypeSupported: (type: string) => boolean = (type) => MediaRecorder.isTypeSupported(type),
): RecordingFormat | null {
  const mimeType = (withAudio ? AUDIO_VIDEO_TYPES : VIDEO_TYPES).find((type) => {
    try {
      return isTypeSupported(type);
    } catch {
      return false;
    }
  });
  if (!mimeType) return null;
  return { mimeType, extension: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm' };
}

/** Why this browser cannot record a take, or null when it can. */
export function captureUnsupportedReason(): string | null {
  if (typeof MediaRecorder !== 'function') return 'This browser has no MediaRecorder.';
  if (
    typeof HTMLCanvasElement !== 'function' ||
    typeof HTMLCanvasElement.prototype.captureStream !== 'function'
  ) {
    return 'This browser cannot capture a canvas as video.';
  }
  if (!pickRecordingFormat(false)) return 'This browser cannot encode WebM or MP4 video.';
  return null;
}
