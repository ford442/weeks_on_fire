/**
 * Writes `Segment > Info > Duration` into a MediaRecorder WebM.
 *
 * Chromium's MediaRecorder streams WebM with an unknown-size Segment and no Duration, so
 * `video.duration` reads `Infinity`, the file has no seek bar until it is scanned, and an editor
 * cannot tell how long the take is. The fix only touches the first few hundred bytes: the Info
 * element gains a Duration child (or has a zero one overwritten), and everything after Info is
 * passed through unchanged.
 *
 * EBML in one paragraph: every element is `ID` + `size` + `data`. Both ID and size are VINTs: the
 * number of leading zero bits in the first byte, plus one, is the length in bytes. An ID keeps its
 * marker bit; a size drops it, and a size whose value bits are all ones means "unknown" (streamed).
 */

const EBML_HEADER = 0x1a45dfa3;
const SEGMENT = 0x18538067;
const SEEK_HEAD = 0x114d9b74;
const INFO = 0x1549a966;
const CLUSTER = 0x1f43b675;
const TIMECODE_SCALE = 0x2ad7b1;
const DURATION = 0x4489;
/** Matroska's default: Info times are in milliseconds. */
const DEFAULT_TIMECODE_SCALE = 1_000_000;

interface Vint {
  value: number;
  length: number;
  unknown: boolean;
}

interface Element {
  id: number;
  /** Offset of the ID's first byte. */
  start: number;
  /** Offset of the first data byte. */
  dataStart: number;
  /** One past the last data byte; `Infinity` for an unknown-size element. */
  end: number;
  sizeLength: number;
  unknownSize: boolean;
}

function vintLength(first: number): number {
  for (let length = 1; length <= 8; length += 1) {
    if (first & (0x80 >> (length - 1))) return length;
  }
  return 0;
}

function readId(bytes: Uint8Array, pos: number): Vint | null {
  const first = bytes[pos];
  if (first === undefined) return null;
  const length = vintLength(first);
  if (length === 0 || length > 4 || pos + length > bytes.length) return null;
  let value = 0;
  for (let i = 0; i < length; i += 1) value = value * 256 + (bytes[pos + i] ?? 0);
  return { value, length, unknown: false };
}

function readSize(bytes: Uint8Array, pos: number): Vint | null {
  const first = bytes[pos];
  if (first === undefined) return null;
  const length = vintLength(first);
  if (length === 0 || pos + length > bytes.length) return null;
  let value = first & (0xff >> length);
  let allOnes = value === 0xff >> length;
  for (let i = 1; i < length; i += 1) {
    const byte = bytes[pos + i] ?? 0;
    value = value * 256 + byte;
    if (byte !== 0xff) allOnes = false;
  }
  return { value, length, unknown: allOnes };
}

function readElement(bytes: Uint8Array, pos: number): Element | null {
  const id = readId(bytes, pos);
  if (!id) return null;
  const size = readSize(bytes, pos + id.length);
  if (!size) return null;
  const dataStart = pos + id.length + size.length;
  return {
    id: id.value,
    start: pos,
    dataStart,
    end: size.unknown ? Infinity : dataStart + size.value,
    sizeLength: size.length,
    unknownSize: size.unknown,
  };
}

/** A size VINT at least `minLength` bytes long (all-ones is reserved for "unknown"). */
export function encodeSize(value: number, minLength = 1): Uint8Array | null {
  for (let length = Math.max(1, minLength); length <= 8; length += 1) {
    if (value < 2 ** (7 * length) - 1) {
      const out = new Uint8Array(length);
      let rest = value;
      for (let i = length - 1; i >= 0; i -= 1) {
        out[i] = rest % 256;
        rest = Math.floor(rest / 256);
      }
      out[0] = (out[0] ?? 0) | (0x80 >> (length - 1));
      return out;
    }
  }
  return null;
}

function readUint(bytes: Uint8Array, start: number, end: number): number {
  let value = 0;
  for (let i = start; i < end; i += 1) value = value * 256 + (bytes[i] ?? 0);
  return value;
}

function readFloat(bytes: Uint8Array, start: number, end: number): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset + start, end - start);
  if (end - start === 4) return view.getFloat32(0);
  if (end - start === 8) return view.getFloat64(0);
  return null;
}

function float64(value: number): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value);
  return out;
}

interface InfoLocation {
  segment: Element;
  info: Element;
  hasSeekHead: boolean;
  timecodeScale: number;
  duration: Element | null;
}

/** Finds `Segment > Info` in the head of a WebM. Null when the bytes are not a WebM we can patch. */
function locateInfo(bytes: Uint8Array): InfoLocation | null {
  const header = readElement(bytes, 0);
  if (!header || header.id !== EBML_HEADER || header.unknownSize) return null;
  const segment = readElement(bytes, header.end);
  if (!segment || segment.id !== SEGMENT) return null;

  let hasSeekHead = false;
  let pos = segment.dataStart;
  while (pos < Math.min(bytes.length, segment.end)) {
    const child = readElement(bytes, pos);
    // An unknown-size child before Info, or Info past the bytes we were given: give up.
    if (!child || child.unknownSize || child.end > bytes.length) return null;
    if (child.id === CLUSTER) return null;
    if (child.id === SEEK_HEAD) hasSeekHead = true;
    if (child.id === INFO) {
      let timecodeScale = DEFAULT_TIMECODE_SCALE;
      let duration: Element | null = null;
      let inner = child.dataStart;
      while (inner < child.end) {
        const field = readElement(bytes, inner);
        if (!field || field.unknownSize || field.end > child.end) return null;
        if (field.id === TIMECODE_SCALE)
          timecodeScale = readUint(bytes, field.dataStart, field.end);
        if (field.id === DURATION) duration = field;
        inner = field.end;
      }
      return { segment, info: child, hasSeekHead, timecodeScale, duration };
    }
    pos = child.end;
  }
  return null;
}

/** Duration in seconds from a WebM's Info, or null when there is none (or it is zero). */
export function readWebmDurationSec(bytes: Uint8Array): number | null {
  const found = locateInfo(bytes);
  if (!found?.duration) return null;
  const value = readFloat(bytes, found.duration.dataStart, found.duration.end);
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return (value * found.timecodeScale) / 1e9;
}

export interface WebmHeadPatch {
  /** Replaces the first `consumed` bytes of the file. */
  head: Uint8Array<ArrayBuffer>;
  consumed: number;
}

/**
 * Patches the head of a WebM so Info carries `durationSec`. Returns null when there is nothing to
 * do (a positive Duration is already there) or the file is not one this can patch safely: a
 * SeekHead (its offsets would shift), or a sized Segment whose size field cannot grow in place.
 */
export function patchWebmDuration(bytes: Uint8Array, durationSec: number): WebmHeadPatch | null {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return null;
  const found = locateInfo(bytes);
  if (!found) return null;
  const { segment, info, timecodeScale, duration } = found;
  if (timecodeScale <= 0) return null;
  const value = (durationSec * 1e9) / timecodeScale;

  if (duration) {
    const current = readFloat(bytes, duration.dataStart, duration.end);
    if (current === null || current > 0) return null;
    const head = bytes.slice(0, info.end);
    const view = new DataView(head.buffer, duration.dataStart, duration.end - duration.dataStart);
    if (duration.end - duration.dataStart === 4) view.setFloat32(0, value);
    else view.setFloat64(0, value);
    return { head, consumed: info.end };
  }

  // Adding bytes after Info moves every later element, which only a SeekHead would notice.
  if (found.hasSeekHead) return null;

  const durationElement = new Uint8Array([0x44, 0x89, 0x88, ...float64(value)]);
  const infoSize = info.end - info.dataStart + durationElement.length;
  const infoSizeField = encodeSize(infoSize, info.sizeLength);
  if (!infoSizeField) return null;
  const growth = infoSizeField.length - info.sizeLength + durationElement.length;

  let segmentSizeField: Uint8Array | null = null;
  if (!segment.unknownSize) {
    segmentSizeField = encodeSize(segment.end - segment.dataStart + growth, segment.sizeLength);
    if (!segmentSizeField || segmentSizeField.length !== segment.sizeLength) return null;
  }

  const infoIdLength = info.dataStart - info.sizeLength - info.start;
  const parts: Uint8Array[] = [];
  if (segmentSizeField) {
    const segmentIdEnd = segment.dataStart - segment.sizeLength;
    parts.push(bytes.subarray(0, segmentIdEnd), segmentSizeField);
    parts.push(bytes.subarray(segment.dataStart, info.start));
  } else {
    parts.push(bytes.subarray(0, info.start));
  }
  parts.push(bytes.subarray(info.start, info.start + infoIdLength), infoSizeField);
  parts.push(bytes.subarray(info.dataStart, info.end), durationElement);

  const head = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    head.set(part, offset);
    offset += part.length;
  }
  return { head, consumed: info.end };
}

/** How much of a take is read to find Info. MediaRecorder puts it in the first ~100 bytes. */
const HEAD_BYTES = 64 * 1024;

/** `blob` with its Duration set, or `blob` itself when it already has one or cannot be patched. */
export async function withWebmDuration(blob: Blob, durationSec: number): Promise<Blob> {
  try {
    const bytes = new Uint8Array(await blob.slice(0, HEAD_BYTES).arrayBuffer());
    const patch = patchWebmDuration(bytes, durationSec);
    if (!patch) return blob;
    return new Blob([patch.head, blob.slice(patch.consumed)], { type: blob.type });
  } catch {
    return blob;
  }
}
