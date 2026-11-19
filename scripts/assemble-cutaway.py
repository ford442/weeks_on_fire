#!/usr/bin/env python3
"""Assemble a cutaway's stills into a timed MP4 preview over its song (ffmpeg, stdlib only).

Generalizes scripts/assemble-daisy-slideshow.py: one still per segment, cut on the segment times,
optional Ken Burns move, the song underneath.

Usage:
  python3 scripts/assemble-cutaway.py --manifest content/cutaways/mv-ultra-screech.json --dry-run
  python3 scripts/assemble-cutaway.py --manifest content/cutaways/mv-ultra-screech.json
  python3 scripts/assemble-cutaway.py --manifest videos/my-cut.json --out videos/my-cut.mp4

--manifest is one of two things:

  * a cutaway record (content/cutaways/<id>.json). Segment ids and times come from the generated
    catalog (public/catalog/cutaways/<id>.json, i.e. what Suggestions shows; run `npm run codegen`
    after editing a prompts file), the audio from the linked song, and each still from the
    segment's registered still (`segmentStills`) or else images/<name>/<segment-id>.<jpg|png|webp>,
    which is where scripts/xai-batch.py puts them. Output: videos/<id>-preview.mp4.

  * an assembly manifest you wrote or derived with --write-manifest: explicit images, start / end
    seconds, optional pan per segment. Use it when the catalog times are not clean (a segment whose
    time reads "5:40 PM"), when stills live under unconventional names, or to add Ken Burns moves.
    Field reference: docs/cutaway-assembly.md.

Timing: segments are cut on frame boundaries computed from absolute times (no drift over a long
cut). A gap between segments, or before the first, plays black; an overlap is an error. The video
ends at the last segment's end; the song is padded with silence or trimmed to match.

It makes one ffmpeg pass (no temp clips), writes to <out>.partial.mp4 and renames on success, and
by default writes under videos/ (gitignored). It never uploads: host a big preview on Drive / Imgur
and record the link in the manifest's `previewUrl`.

Needs ffmpeg and ffprobe on PATH. --dry-run prints the plan and the ffmpeg command and writes
nothing. Exit codes: 0 ok, 1 ffmpeg failed, 2 bad input (nothing was written).
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_VERSION = 1
IMAGE_EXTS = ("jpg", "jpeg", "png", "webp")
DEFAULT_SIZE = (1280, 720)
DEFAULT_FPS = 24
# zoompan crops whole pixels; scaling the still up first keeps a slow push from stair-stepping.
PAN_UPSCALE = 4
# Seconds of slack when comparing segment boundaries (catalog times are whole seconds; this only
# absorbs float noise in hand-written ones).
EPS = 1e-3

TOP_KEYS = {
    "version",
    "cutaway",
    "audio",
    "size",
    "fps",
    "out",
    "previewUrl",
    "defaultPan",
    "note",
    "segments",
}
SEGMENT_KEYS = {"id", "label", "image", "start", "end", "pan", "note"}


class UsageError(Exception):
    """Bad input: exit 2 before anything is written."""


# ------------------------------------------------------------------------------------- pan


@dataclass(frozen=True)
class Pan:
    """A Ken Burns move: zoom and focal point (fractions of the still) at the first and last frame."""

    z0: float
    x0: float
    y0: float
    z1: float
    x1: float
    y1: float


_ZOOM = 1.15
_SHIFT = 0.08
PAN_PRESETS: dict[str, Pan | None] = {
    "none": None,
    "push": Pan(1.0, 0.5, 0.5, _ZOOM, 0.5, 0.5),
    "pull": Pan(_ZOOM, 0.5, 0.5, 1.0, 0.5, 0.5),
    # `left` moves the camera left, so the window slides toward the image's left edge.
    "left": Pan(_ZOOM, 0.5 + _SHIFT, 0.5, _ZOOM, 0.5 - _SHIFT, 0.5),
    "right": Pan(_ZOOM, 0.5 - _SHIFT, 0.5, _ZOOM, 0.5 + _SHIFT, 0.5),
    "up": Pan(_ZOOM, 0.5, 0.5 + _SHIFT, _ZOOM, 0.5, 0.5 - _SHIFT),
    "down": Pan(_ZOOM, 0.5, 0.5 - _SHIFT, _ZOOM, 0.5, 0.5 + _SHIFT),
}
AUTO_CYCLE = ("push", "left", "pull", "right")


def _number(value: Any, where: str, lo: float, hi: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise UsageError(f"{where} must be a number, got {value!r}")
    if not lo <= value <= hi:
        raise UsageError(f"{where} must be between {lo:g} and {hi:g}, got {value:g}")
    return float(value)


def _pan_point(data: Any, where: str) -> tuple[float, float, float]:
    if not isinstance(data, dict):
        raise UsageError(f"{where} must be an object like {{\"zoom\": 1.2, \"x\": 0.5, \"y\": 0.4}}")
    extra = set(data) - {"zoom", "x", "y"}
    if extra:
        raise UsageError(f"{where} has unknown key(s): {', '.join(sorted(extra))} (zoom, x, y)")
    return (
        _number(data.get("zoom", 1.0), f"{where}.zoom", 1.0, 4.0),
        _number(data.get("x", 0.5), f"{where}.x", 0.0, 1.0),
        _number(data.get("y", 0.5), f"{where}.y", 0.0, 1.0),
    )


def parse_pan(value: Any, where: str) -> Pan | None:
    """`pan`: a preset name, or {"from": {zoom,x,y}, "to": {zoom,x,y}}. None means a still hold."""
    if isinstance(value, str):
        if value not in PAN_PRESETS:
            raise UsageError(f"{where}: unknown pan {value!r} (one of: {', '.join(PAN_PRESETS)})")
        return PAN_PRESETS[value]
    if not isinstance(value, dict) or set(value) != {"from", "to"}:
        raise UsageError(f"{where} must be a preset name or an object with `from` and `to`")
    z0, x0, y0 = _pan_point(value["from"], f"{where}.from")
    z1, x1, y1 = _pan_point(value["to"], f"{where}.to")
    return Pan(z0, x0, y0, z1, x1, y1)


def pan_name(pan: Pan | None) -> str:
    """The preset a move equals, else "custom" (None is "none")."""
    return next((name for name, preset in PAN_PRESETS.items() if preset == pan), "custom")


def pan_to_json(pan: Pan | None) -> str | dict[str, Any]:
    name = pan_name(pan)
    if name != "custom" or pan is None:
        return name
    return {
        "from": {"zoom": pan.z0, "x": pan.x0, "y": pan.y0},
        "to": {"zoom": pan.z1, "x": pan.x1, "y": pan.y1},
    }


# ------------------------------------------------------------------------------------ times

_CLOCK = re.compile(r"(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)")


def parse_time(value: Any, where: str) -> float:
    """Seconds from a number, "12.5", "M:SS" or "H:MM:SS"."""
    if isinstance(value, bool):
        raise UsageError(f"{where}: {value!r} is not a time")
    if isinstance(value, (int, float)):
        seconds = float(value)
    elif isinstance(value, str):
        text = value.strip()
        clock = _CLOCK.fullmatch(text)
        if clock:
            hours, minutes, secs = clock.groups()
            if float(secs) >= 60 or (hours is not None and int(minutes) >= 60):
                raise UsageError(f"{where}: {value!r} is not a valid time")
            seconds = int(hours or 0) * 3600 + int(minutes) * 60 + float(secs)
        else:
            try:
                seconds = float(text)
            except ValueError:
                raise UsageError(f"{where}: {value!r} is not a time (use seconds or M:SS)") from None
    else:
        raise UsageError(f"{where}: {value!r} is not a time")
    if not math.isfinite(seconds) or seconds < 0:
        raise UsageError(f"{where}: {value!r} must be a finite time >= 0")
    return seconds


def clock(seconds: float) -> str:
    whole, tenth = divmod(round(seconds * 10), 10)
    return f"{whole // 60}:{whole % 60:02d}.{tenth}"


def frame_at(seconds: float, fps: int) -> int:
    """Frame boundary for a time. Half rounds up (not banker's) so 0.5 s at 3 fps is frame 2."""
    return int(math.floor(seconds * fps + 0.5))


# --------------------------------------------------------------------------------- the plan


@dataclass
class Segment:
    id: str
    start: float
    end: float
    image: Path | None  # None: black (a deliberate `"image": null`, or a still that is missing)
    pan: Pan | None = None
    pan_explicit: bool = False  # set in the manifest, so --pan / defaultPan leave it alone
    label: str = ""
    missing: str | None = None  # repo-relative path the still should have (only when image is None)


@dataclass
class Plan:
    name: str
    segments: list[Segment]
    audio: Path | None
    audio_note: str | None  # why there is no audio (shown when it is required)
    out: Path
    width: int
    height: int
    fps: int
    source: str
    cutaway: str | None = None
    preview_url: str | None = None
    default_pan: str = "none"


@dataclass
class Options:
    """CLI overrides; every field is optional so tests can build a plan without argparse."""

    audio: str | None = None
    out: str | None = None
    images: str | None = None
    size: str | None = None
    fps: int | None = None
    pan: str | None = None
    allow_missing: bool = False
    no_audio: bool = False


def repo_rel(repo: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(repo.resolve()).as_posix()
    except ValueError:
        return str(path)


def resolve_path(repo: Path, text: str) -> Path:
    """Repo-relative (the convention everywhere in content/), or absolute."""
    path = Path(text).expanduser()
    return path if path.is_absolute() else repo / path


def parse_size(text: str) -> tuple[int, int]:
    match = re.fullmatch(r"(\d{2,5})x(\d{2,5})", text.strip().lower())
    if not match:
        raise UsageError(f"size must look like 1280x720, got {text!r}")
    width, height = int(match.group(1)), int(match.group(2))
    if width % 2 or height % 2:
        raise UsageError(f"size {text} has an odd side; H.264 4:2:0 needs even width and height")
    return width, height


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise UsageError(f"{path} does not exist") from None
    except json.JSONDecodeError as exc:
        raise UsageError(f"{path} is not valid JSON: {exc}") from exc


def find_still(directory: Path, segment_id: str) -> Path | None:
    for ext in IMAGE_EXTS:
        candidate = directory / f"{segment_id}.{ext}"
        if candidate.is_file():
            return candidate
    return None


def song_audio(repo: Path, cutaway: dict[str, Any]) -> tuple[Path | None, str | None]:
    """The linked song's audio file, or (None, why not)."""
    song_id = cutaway.get("songId")
    if not song_id:
        return None, f"cutaway {cutaway.get('id')} has no songId"
    path = repo / "public" / "catalog" / "songs" / f"{song_id}.json"
    if not path.is_file():
        return None, f"song {song_id!r} is not in the catalog (run `npm run codegen`)"
    audio_file = _read_json(path).get("audioFile")
    if not audio_file:
        return None, f"song {song_id!r} has no audio file yet"
    audio = repo / "songs" / audio_file
    if not audio.is_file():
        return None, f"songs/{audio_file} is listed for {song_id!r} but is not in the repo"
    return audio, None


def load_catalog_cutaway(repo: Path, cutaway_id: str) -> dict[str, Any]:
    path = repo / "public" / "catalog" / "cutaways" / f"{cutaway_id}.json"
    if not path.is_file():
        raise UsageError(f"{repo_rel(repo, path)} is missing. Run `npm run codegen`.")
    data = _read_json(path)
    if not isinstance(data, dict):
        raise UsageError(f"{repo_rel(repo, path)} is not a cutaway record")
    return data


def plan_from_cutaway(repo: Path, record: dict[str, Any], opts: Options) -> Plan:
    cutaway_id = record["id"]
    full = load_catalog_cutaway(repo, cutaway_id)
    catalog_segments = full.get("segments") or []
    if not catalog_segments:
        raise UsageError(f"Cutaway {cutaway_id} has no segments, so there is nothing to assemble.")

    source = record.get("segmentsSource")
    name = re.sub(r"-segments\.md$", "", Path(source).name) if source else cutaway_id
    images_dir = resolve_path(repo, opts.images) if opts.images else repo / "images" / name

    segments: list[Segment] = []
    bad: list[str] = []
    for raw in catalog_segments:
        seg_id = raw["id"]
        times: dict[str, float] = {}
        for key in ("start", "end"):
            try:
                times[key] = parse_time(raw.get(key), f"{seg_id} {key}")
            except UsageError as exc:
                bad.append(str(exc))
        if len(times) < 2:
            continue
        start, end = times["start"], times["end"]
        still = raw.get("stillImagePath")
        image: Path | None = None
        expected: str | None = None
        if still and resolve_path(repo, still).is_file():
            image = resolve_path(repo, still)
        else:
            found = find_still(images_dir, seg_id)
            if found:
                image = found
            else:
                expected = still or repo_rel(repo, images_dir / f"{seg_id}.jpg")
        segments.append(
            Segment(
                id=seg_id,
                start=start,
                end=end,
                image=image,
                label=raw.get("label", ""),
                missing=expected,
            )
        )
    if bad:
        raise UsageError(
            f"{cutaway_id}: the catalog has segment times this script cannot read:\n  - "
            + "\n  - ".join(bad)
            + "\nWrite an assembly manifest with explicit times "
            "(--write-manifest derives a starting point). See docs/cutaway-assembly.md."
        )

    audio, audio_note = song_audio(repo, full)
    width, height = DEFAULT_SIZE
    return Plan(
        name=cutaway_id,
        segments=segments,
        audio=audio,
        audio_note=audio_note,
        out=repo / "videos" / f"{cutaway_id}-preview.mp4",
        width=width,
        height=height,
        fps=DEFAULT_FPS,
        source=f"cutaway {cutaway_id}" + (f" ({source})" if source else ""),
        cutaway=cutaway_id,
    )


def plan_from_manifest(repo: Path, data: dict[str, Any], manifest_path: Path) -> Plan:
    if data.get("version") != MANIFEST_VERSION:
        raise UsageError(
            f"{manifest_path.name}: expected \"version\": {MANIFEST_VERSION} (an assembly manifest) "
            "or a cutaway record from content/cutaways/."
        )
    extra = set(data) - TOP_KEYS
    if extra:
        raise UsageError(
            f"{manifest_path.name}: unknown key(s): {', '.join(sorted(extra))} "
            f"(allowed: {', '.join(sorted(TOP_KEYS))})"
        )
    raw_segments = data.get("segments")
    if not isinstance(raw_segments, list) or not raw_segments:
        raise UsageError(f"{manifest_path.name}: `segments` must be a non-empty list")

    segments: list[Segment] = []
    problems: list[str] = []
    cursor = 0.0
    seen: set[str] = set()
    for index, raw in enumerate(raw_segments, 1):
        where = f"segments[{index}]"
        try:
            if not isinstance(raw, dict):
                raise UsageError(f"{where} must be an object")
            where = f"segments[{index}] ({raw['id']})" if isinstance(raw.get("id"), str) else where
            extra = set(raw) - SEGMENT_KEYS
            if extra:
                raise UsageError(f"{where} has unknown key(s): {', '.join(sorted(extra))}")
            seg_id = raw.get("id")
            if not isinstance(seg_id, str) or not seg_id:
                raise UsageError(f"{where} needs a string `id`")
            if seg_id in seen:
                raise UsageError(f"{where}: duplicate segment id")
            seen.add(seg_id)
            if "end" not in raw:
                raise UsageError(f"{where} needs an `end` time")
            start = parse_time(raw["start"], f"{where}.start") if "start" in raw else cursor
            end = parse_time(raw["end"], f"{where}.end")
            if end <= start:
                raise UsageError(f"{where}: end ({end:g}s) must be after start ({start:g}s)")
            image: Path | None = None
            missing: str | None = None
            if "image" not in raw:
                raise UsageError(f"{where} needs `image` (a path, or null for black)")
            if raw["image"] is not None:
                if not isinstance(raw["image"], str) or not raw["image"]:
                    raise UsageError(f"{where}.image must be a path string or null")
                path = resolve_path(repo, raw["image"])
                if path.is_file():
                    image = path
                else:
                    missing = raw["image"]
            pan = parse_pan(raw["pan"], f"{where}.pan") if "pan" in raw else None
            segments.append(
                Segment(
                    id=seg_id,
                    start=start,
                    end=end,
                    image=image,
                    pan=pan,
                    pan_explicit="pan" in raw,
                    label=str(raw.get("label", "")),
                    missing=missing,
                )
            )
            cursor = end
        except UsageError as exc:
            problems.append(str(exc))
    if problems:
        raise UsageError(f"{manifest_path.name}:\n  - " + "\n  - ".join(problems))

    cutaway_id = data.get("cutaway")
    if cutaway_id is not None and (not isinstance(cutaway_id, str) or not cutaway_id):
        raise UsageError(f"{manifest_path.name}: `cutaway` must be a cutaway id string")

    audio: Path | None = None
    audio_note: str | None = "the manifest has no `audio` and no `cutaway` to take it from"
    if data.get("audio") is not None:
        if not isinstance(data["audio"], str):
            raise UsageError(f"{manifest_path.name}: `audio` must be a path string")
        audio = resolve_path(repo, data["audio"])
        audio_note = None
        if not audio.is_file():
            raise UsageError(f"{manifest_path.name}: audio file not found: {data['audio']}")
    elif cutaway_id:
        record = load_catalog_cutaway(repo, cutaway_id)
        audio, audio_note = song_audio(repo, record)

    width, height = parse_size(data["size"]) if "size" in data else DEFAULT_SIZE
    fps = data.get("fps", DEFAULT_FPS)
    if isinstance(fps, bool) or not isinstance(fps, int) or not 1 <= fps <= 120:
        raise UsageError(f"{manifest_path.name}: `fps` must be a whole number from 1 to 120")
    preview_url = data.get("previewUrl")
    if preview_url is not None and not (
        isinstance(preview_url, str) and re.match(r"https?://", preview_url)
    ):
        raise UsageError(f"{manifest_path.name}: `previewUrl` must be an http(s) URL")
    default_pan = data.get("defaultPan", "none")
    if default_pan != "auto":
        parse_pan(default_pan, "defaultPan")
    if "out" in data and not isinstance(data["out"], str):
        raise UsageError(f"{manifest_path.name}: `out` must be a path string")

    name = cutaway_id or manifest_path.stem
    return Plan(
        name=name,
        segments=segments,
        audio=audio,
        audio_note=audio_note,
        out=resolve_path(repo, data["out"]) if "out" in data else repo / "videos" / f"{name}-preview.mp4",
        width=width,
        height=height,
        fps=fps,
        source=f"manifest {repo_rel(repo, manifest_path)}",
        cutaway=cutaway_id,
        preview_url=preview_url,
        default_pan=default_pan,
    )


def apply_options(repo: Path, plan: Plan, opts: Options) -> Plan:
    """CLI flags win over the manifest; then the default pan lands on segments that set none."""
    if opts.audio:
        plan.audio = resolve_path(repo, opts.audio)
        plan.audio_note = None
        if not plan.audio.is_file():
            raise UsageError(f"audio file not found: {opts.audio}")
    if opts.no_audio:
        plan.audio, plan.audio_note = None, "--no-audio"
    if opts.out:
        plan.out = resolve_path(repo, opts.out)
    if opts.size:
        plan.width, plan.height = parse_size(opts.size)
    if opts.fps is not None:
        if not 1 <= opts.fps <= 120:
            raise UsageError("--fps must be from 1 to 120")
        plan.fps = opts.fps
    if opts.pan:
        if opts.pan != "auto":
            parse_pan(opts.pan, "--pan")
        plan.default_pan = opts.pan

    steady = 0
    for seg in plan.segments:
        if seg.pan_explicit or seg.image is None:
            continue
        if plan.default_pan == "auto":
            seg.pan = PAN_PRESETS[AUTO_CYCLE[steady % len(AUTO_CYCLE)]]
            steady += 1
        else:
            seg.pan = parse_pan(plan.default_pan, "defaultPan")
    return plan


def check_plan(plan: Plan, opts: Options) -> list[str]:
    """Refuse a plan that would render something other than what was asked for.

    Returns warnings (things that render fine but deserve a look)."""
    missing = [seg for seg in plan.segments if seg.missing]
    if missing and not opts.allow_missing:
        lines = "\n".join(f"  - {seg.id}: {seg.missing}" for seg in missing)
        hint = (
            f"Generate them first: python3 scripts/xai-batch.py {plan.cutaway} "
            "(see docs/cutaway-assembly.md), or "
            if plan.cutaway
            else ""
        )
        raise UsageError(
            f"{len(missing)} of {len(plan.segments)} segment(s) have no still:\n{lines}\n"
            f"{hint}pass --allow-missing to play black for them."
        )
    if plan.audio is None and not opts.no_audio:
        raise UsageError(
            f"No audio: {plan.audio_note}. Pass --audio PATH, or --no-audio for a silent video."
        )
    warnings = [f"no still for {seg.id}: black ({seg.missing})" for seg in missing]
    return warnings


# ------------------------------------------------------------------------------- timeline


@dataclass
class Span:
    """One run of frames: a still (with optional pan) or black."""

    start_frame: int
    end_frame: int
    image: Path | None
    pan: Pan | None
    segment_id: str

    @property
    def frames(self) -> int:
        return self.end_frame - self.start_frame


def build_timeline(segments: list[Segment], fps: int) -> tuple[list[Span], list[str]]:
    """Contiguous spans from frame 0 to the last segment's end, black filling any gap.

    Boundaries are rounded from absolute times, so the cut never drifts from the audio."""
    spans: list[Span] = []
    notes: list[str] = []
    cursor = 0
    prev_end = 0.0
    for seg in segments:
        if seg.start < prev_end - EPS:
            raise UsageError(
                f"{seg.id} starts at {clock(seg.start)}, before the previous segment ends "
                f"({clock(prev_end)}). Segments must be in time order and must not overlap."
            )
        start = frame_at(seg.start, fps)
        end = frame_at(seg.end, fps)
        if start > cursor:
            notes.append(f"gap before {seg.id}: black {clock(prev_end)}-{clock(seg.start)}")
            spans.append(Span(cursor, start, None, None, "(gap)"))
        start = max(start, cursor)  # float noise inside EPS
        if end <= start:
            raise UsageError(f"{seg.id} is shorter than one frame at {fps} fps")
        spans.append(Span(start, end, seg.image, seg.pan, seg.id))
        cursor = end
        prev_end = seg.end
    return spans, notes


# ------------------------------------------------------------------------------ ffmpeg


def _num(value: float) -> str:
    return f"{value:.6g}"


def pan_expressions(pan: Pan, frames: int) -> tuple[str, str, str]:
    """zoompan `z`, `x`, `y` for a linear move over `frames` output frames (`on` is the frame index)."""
    progress = f"(on/{max(frames - 1, 1)})"
    zoom = f"({_num(pan.z0)}+({_num(pan.z1)}-{_num(pan.z0)})*{progress})"
    cx = f"({_num(pan.x0)}+({_num(pan.x1)}-{_num(pan.x0)})*{progress})"
    cy = f"({_num(pan.y0)}+({_num(pan.y1)}-{_num(pan.y0)})*{progress})"
    # Window origin = focal point minus half the window, kept inside the picture.
    x = f"clip({cx}*iw-iw/{zoom}/2,0,iw-iw/{zoom})"
    y = f"clip({cy}*ih-ih/{zoom}/2,0,ih-ih/{zoom})"
    return zoom, x, y


def segment_chain(index: int, span: Span, input_index: int | None, plan: Plan) -> str:
    width, height, fps = plan.width, plan.height, plan.fps
    if span.image is None:
        return (
            f"color=c=black:s={width}x{height}:r={fps},trim=end_frame={span.frames},"
            f"setsar=1,format=yuv420p[v{index}]"
        )
    # Every still goes through zoompan, even a hold (z=1): a single input frame comes out as
    # exactly `d` frames, which is what keeps the cut on its frame boundaries.
    if span.pan is None:
        canvas_w, canvas_h = width, height
        z, x, y = "1", "0", "0"
    else:
        canvas_w, canvas_h = width * PAN_UPSCALE, height * PAN_UPSCALE
        z, x, y = pan_expressions(span.pan, span.frames)
    return (
        f"[{input_index}:v]scale={canvas_w}:{canvas_h}:force_original_aspect_ratio=decrease,"
        f"pad={canvas_w}:{canvas_h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={span.frames}:s={width}x{height}:fps={fps},"
        f"format=yuv420p[v{index}]"
    )


def build_command(plan: Plan, spans: list[Span], out: Path, ffmpeg: str = "ffmpeg") -> list[str]:
    command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y"]
    chains: list[str] = []
    inputs = 0
    for index, span in enumerate(spans):
        input_index = None
        if span.image is not None:
            command += ["-i", str(span.image)]
            input_index = inputs
            inputs += 1
        chains.append(segment_chain(index, span, input_index, plan))

    total_frames = spans[-1].end_frame
    total_seconds = total_frames / plan.fps
    labels = "".join(f"[v{i}]" for i in range(len(spans)))
    chains.append(f"{labels}concat=n={len(spans)}:v=1:a=0[v]")

    maps = ["-map", "[v]"]
    codecs = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p"]
    if plan.audio is not None:
        command += ["-i", str(plan.audio)]
        chains.append(
            f"[{inputs}:a]apad=whole_dur={_num(total_seconds)},atrim=end={_num(total_seconds)},"
            "asetpts=PTS-STARTPTS[a]"
        )
        maps += ["-map", "[a]"]
        codecs += ["-c:a", "aac", "-b:a", "192k"]
    command += ["-filter_complex", ";".join(chains), *maps, *codecs]
    command += ["-r", str(plan.fps), "-movflags", "+faststart", str(out)]
    return command


def probe_duration(path: Path) -> float | None:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return None
    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return None


def audio_warnings(plan: Plan, total_seconds: float) -> list[str]:
    if plan.audio is None:
        return []
    audio_seconds = probe_duration(plan.audio)
    if audio_seconds is None:
        return []
    if audio_seconds < total_seconds - 0.5:
        return [
            f"audio is {audio_seconds:.1f}s but the cut runs {total_seconds:.1f}s: "
            "the last stretch will be silent"
        ]
    if audio_seconds > total_seconds + 1.0:
        return [
            f"audio is {audio_seconds:.1f}s but the cut ends at {total_seconds:.1f}s: "
            "the song is trimmed there"
        ]
    return []


# --------------------------------------------------------------------------- manifest out


def plan_to_manifest(repo: Path, plan: Plan) -> dict[str, Any]:
    """The assembly manifest equivalent to `plan`, to edit and pass back with --manifest."""
    manifest: dict[str, Any] = {"version": MANIFEST_VERSION}
    if plan.cutaway:
        manifest["cutaway"] = plan.cutaway
    if plan.audio is not None:
        manifest["audio"] = repo_rel(repo, plan.audio)
    manifest["size"] = f"{plan.width}x{plan.height}"
    manifest["fps"] = plan.fps
    manifest["out"] = repo_rel(repo, plan.out)
    if plan.preview_url:
        manifest["previewUrl"] = plan.preview_url
    if plan.default_pan != "none":
        manifest["defaultPan"] = plan.default_pan
    segments = []
    for seg in plan.segments:
        entry: dict[str, Any] = {"id": seg.id}
        if seg.label:
            entry["label"] = seg.label
        image = repo_rel(repo, seg.image) if seg.image else seg.missing
        entry["image"] = image
        entry["start"] = round(seg.start, 3)
        entry["end"] = round(seg.end, 3)
        if seg.pan_explicit:
            entry["pan"] = pan_to_json(seg.pan)
        segments.append(entry)
    manifest["segments"] = segments
    return manifest


# ------------------------------------------------------------------------------------ CLI


def load_plan(repo: Path, manifest_arg: str, opts: Options) -> Plan:
    path = Path(manifest_arg)
    if not path.is_file() and (repo / manifest_arg).is_file():
        path = repo / manifest_arg
    data = _read_json(path)
    if not isinstance(data, dict):
        raise UsageError(f"{path} must contain a JSON object")
    if "songId" in data and "id" in data:
        plan = plan_from_cutaway(repo, data, opts)
    else:
        if opts.images:
            raise UsageError("--images only applies when --manifest is a cutaway record")
        plan = plan_from_manifest(repo, data, path)
    return apply_options(repo, plan, opts)


def print_plan(repo: Path, plan: Plan, spans: list[Span]) -> None:
    total = spans[-1].end_frame / plan.fps
    print(f"{plan.source} · {len(plan.segments)} segments · {clock(total)} ({total:.1f}s)")
    print(f"{plan.width}x{plan.height} @ {plan.fps} fps")
    audio = repo_rel(repo, plan.audio) if plan.audio else f"none ({plan.audio_note})"
    print(f"audio {audio}")
    print(f"out   {repo_rel(repo, plan.out)}\n")
    width = max(len(span.segment_id) for span in spans)
    print(f"  {'#':>2}  {'segment':<{width}}  {'start':>7}  {'end':>7}  {'frames':>6}  pan    image")
    by_id = {seg.id: seg for seg in plan.segments}
    for number, span in enumerate(spans, 1):
        start, end = span.start_frame / plan.fps, span.end_frame / plan.fps
        pan = pan_name(span.pan)
        seg = by_id.get(span.segment_id)
        if span.image is not None:
            image = repo_rel(repo, span.image)
        elif seg is not None and seg.missing:
            image = f"BLACK (missing {seg.missing})"
        else:
            image = "BLACK"
        print(
            f"  {number:>2}  {span.segment_id:<{width}}  {clock(start):>7}  {clock(end):>7}"
            f"  {span.frames:>6}  {pan:<6} {image}"
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Assemble a cutaway's stills into a timed MP4 preview over its song",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Run with --dry-run first: it prints the plan and the ffmpeg command, writes nothing.",
    )
    parser.add_argument(
        "--manifest",
        required=True,
        metavar="PATH",
        help="A cutaway record (content/cutaways/<id>.json) or an assembly manifest",
    )
    parser.add_argument("--audio", metavar="PATH", help="Audio file (default: the cutaway's song)")
    parser.add_argument("--out", metavar="PATH", help="Output MP4 (default: videos/<id>-preview.mp4)")
    parser.add_argument(
        "--images",
        metavar="DIR",
        help="Folder of <segment-id>.<jpg|png|webp> stills (cutaway record only; default images/<name>/)",
    )
    parser.add_argument("--size", metavar="WxH", help="Frame size (default 1280x720)")
    parser.add_argument("--fps", type=int, metavar="N", help=f"Frame rate (default {DEFAULT_FPS})")
    parser.add_argument(
        "--pan",
        metavar="MOVE",
        help=f"Ken Burns for segments that set none: auto (rotates {', '.join(AUTO_CYCLE)}) or one of "
        f"{', '.join(PAN_PRESETS)} (default none)",
    )
    parser.add_argument(
        "--allow-missing", action="store_true", help="Play black for segments with no still"
    )
    parser.add_argument("--no-audio", action="store_true", help="Make a silent video")
    parser.add_argument(
        "--dry-run", action="store_true", help="Print the plan and ffmpeg command; write nothing"
    )
    parser.add_argument(
        "--write-manifest",
        metavar="PATH",
        help="Write the plan as an editable assembly manifest and stop (no video)",
    )
    return parser


def run_ffmpeg(command: list[str], out: Path) -> int:
    """Run the command into <out>.partial.mp4, then rename, so a failure never leaves a bad MP4."""
    partial = out.with_name(f"{out.stem}.partial{out.suffix}")
    command = [*command[:-1], str(partial)]
    interactive = sys.stderr.isatty()
    if interactive:
        command.insert(1, "-stats")  # live progress; otherwise keep stderr for the failure message
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = subprocess.run(
            command, stdin=subprocess.DEVNULL, capture_output=not interactive, text=True
        )
    except KeyboardInterrupt:
        partial.unlink(missing_ok=True)
        print("\nInterrupted; nothing written.", file=sys.stderr)
        return 130
    if result.returncode != 0:
        partial.unlink(missing_ok=True)
        tail = (result.stderr or "")[-1500:]
        print(f"ERROR: ffmpeg failed (exit {result.returncode}).\n{tail}", file=sys.stderr)
        return 1
    partial.replace(out)
    return 0


def main(argv: list[str] | None = None, repo: Path = REPO_ROOT) -> int:
    args = build_parser().parse_args(argv)
    opts = Options(
        audio=args.audio,
        out=args.out,
        images=args.images,
        size=args.size,
        fps=args.fps,
        pan=args.pan,
        allow_missing=args.allow_missing,
        no_audio=args.no_audio,
    )
    try:
        plan = load_plan(repo, args.manifest, opts)
        if args.write_manifest:
            text = json.dumps(plan_to_manifest(repo, plan), indent=2, ensure_ascii=False) + "\n"
            target = resolve_path(repo, args.write_manifest)
            if args.dry_run:
                print(f"(dry run) would write {repo_rel(repo, target)}:\n{text}", end="")
                return 0
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
            print(f"Wrote {repo_rel(repo, target)} ({len(plan.segments)} segments).")
            return 0
        warnings = check_plan(plan, opts)
        spans, notes = build_timeline(plan.segments, plan.fps)
        warnings += notes + audio_warnings(plan, spans[-1].end_frame / plan.fps)
        if not args.dry_run and not shutil.which("ffmpeg"):
            raise UsageError("ffmpeg is not on PATH (apt install ffmpeg / brew install ffmpeg)")
    except UsageError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print_plan(repo, plan, spans)
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    command = build_command(plan, spans, plan.out)
    if args.dry_run:
        print("\n(dry run: nothing written)\nffmpeg command:\n  " + " ".join(_quote(c) for c in command))
        return 0

    print()
    code = run_ffmpeg(command, plan.out)
    if code != 0:
        return code
    size_mb = plan.out.stat().st_size / 1e6
    print(f"Wrote {repo_rel(repo, plan.out)} ({size_mb:.1f} MB, {spans[-1].end_frame / plan.fps:.1f}s)")
    if plan.preview_url:
        print(f"Hosted copy (manifest previewUrl): {plan.preview_url}")
    return 0


def _quote(text: str) -> str:
    return text if re.fullmatch(r"[\w@%+=:,./-]+", text) else "'" + text.replace("'", "'\\''") + "'"


if __name__ == "__main__":
    raise SystemExit(main())
