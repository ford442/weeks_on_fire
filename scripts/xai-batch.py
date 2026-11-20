#!/usr/bin/env python3
"""Generate the Grok Imagine still (or clip) for every segment of one cutaway (stdlib only).

Usage:
  export XAI_API_KEY=xai-...
  python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md --dry-run
  python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md \\
      --model grok-imagine-image-quality --aspect 16:9 --out images/glam-sham-poo/
  python3 scripts/xai-batch.py mv-ultra-screech --only A,B --json-log   # by cutaway id
  python3 scripts/xai-batch.py mv-ultra-screech --only A --video --dry-run   # a clip instead

TARGET is a `prompts/*-segments.md` file or a cutaway id. Segments (and their ids) come from the
generated catalog `public/catalog/cutaways/<id>.json`, i.e. exactly what the Suggestions view
shows, parsed by the same codegen that owns the markdown format. Run `npm run codegen` after
editing a prompts file; the script refuses to run against a catalog that has drifted from it.

What it does, per segment:
  * sends the segment's Grok Imagine prompt (one request per segment; `n` images per request)
  * saves it as <out>/<segment-id>.<jpg|png|webp>  (default out: images/<name>/); extra images of
    an `n > 1` request are <segment-id>-2.<ext>, ...
  * skips it when that file already exists (resume), when the cutaway already registers a still
    for it (`segmentStills`), when it has no Grok prompt, or when the prompt still contains a
    `[PLACEHOLDER]` to fill in. --force regenerates; --only A,B / <segment-id> narrows the run.
  * writes <out>/manifest.json after every image: segment id -> file path + prompt SHA-256
    (plus model, aspect, resolution, quality, size, cost, time), so a crashed run loses nothing
    and a stale image is spotted when the prompt or the settings later change.

Settings. Each segment is generated with, in order of precedence:
  1. the flags you pass (--model --aspect --resolution --quality --response-format --n)
  2. the segment's `generation.image` in the catalog: the cutaway's `generationDefaults`, merged
     with any `segmentGeneration` override, authored in content/cutaways/<id>.json (see
     content/README.md). This is what the Suggestions "copy generate command" button reads.
  3. the built-in defaults in scripts/xai-api-spec.json (model, 16:9); everything else is left
     unsent, so the API applies its own.
So one run can mix aspect ratios: set them per segment in the content, not on the command line.
`quality` is only accepted by grok-imagine-image-2.0; the script refuses (before any request) a
segment that asks for it on another model. --response-format b64_json returns the image inline.

Clips: --video generates a video per segment instead (POST /v1/videos/generations, asynchronous).
Every segment is submitted first and then all of them are polled, so a cutaway costs about one
clip's wait, not N. Flags: --model (default grok-imagine-video) --aspect --resolution
(480p/720p/1080p) --duration (1-15 s; default the content's `generation.video.durationSec`, else
the segment's own timed length, else the API's 8) and `generation.video` from the catalog. Output
goes to videos/<name>/<segment-id>.mp4 (gitignored; host big files on Drive / Imgur). The request
id is saved in the manifest the moment it is submitted: if the run dies or --poll-timeout
(default 900 s) passes, re-running polls the same request instead of paying for a new clip. The
prompt is the segment's Grok Imagine prompt, i.e. text-to-video.

--dry-run prints the plan, the settings and every prompt, makes no API call, and writes nothing.
--retries N retries 429 / 5xx / network errors with exponential backoff (default 3). A 401 / 403
stops the whole batch (bad key or no credits would fail every segment the same way).
--json-log [PATH] appends one JSON line per request to PATH (default docs/generation-log.jsonl),
with the response's usage and cost. Prompt text and key are never logged.

Models, aspect ratios and the other allowed values: scripts/xai-api-spec.json.

After a still run it prints the `segmentStills` block for content/cutaways/<id>.json; paste it,
then `npm run codegen`, to put the stills on the segment rows. Only commit stills you mean to ship
(keep the clone lightweight; see AGENTS.md).

Never commit API keys. Prefer env XAI_API_KEY.
"""

from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
import textwrap
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import xai_api
from xai_api import ApiError

REPO_ROOT = xai_api.REPO_ROOT
IMAGE_EXTS = ("jpg", "jpeg", "png", "webp")
MANIFEST_NAME = "manifest.json"
MANIFEST_VERSION = 1
VIDEO_EXT = "mp4"
# `[SIGHT]`, `[DANCER]`, `[PLACE HOLDER]`: a bracketed ALL-CAPS token is a slot the writer has not
# filled yet (well-fall-segments.md). Sending it would spend credits on a literal "[SIGHT]".
PLACEHOLDER = re.compile(r"\[[A-Z][A-Z0-9 _/'-]{1,30}\]")


class UsageError(Exception):
    """Bad input or an out-of-date catalog: exit 2 before any API call."""


@dataclass
class Segment:
    id: str
    label: str
    start: str
    end: str
    prompt: str
    duration_sec: float = 0  # the segment's timed length in the edit; 0 for a still
    generation: dict[str, Any] = field(default_factory=dict)  # catalog `generation`: {image?, video?}


@dataclass
class Cutaway:
    id: str
    source: str | None  # `segmentsSource`, when segments are parsed from markdown
    segments: list[Segment]
    stills: dict[str, str] = field(default_factory=dict)  # `segmentStills`: id -> repo path
    note: str | None = None


@dataclass
class ImageSettings:
    model: str
    aspect: str
    resolution: str | None = None
    quality: str | None = None
    n: int = 1
    response_format: str | None = None

    def describe(self) -> str:
        parts = [self.model, self.aspect]
        if self.resolution:
            parts.append(self.resolution)
        if self.quality:
            parts.append(f"quality {self.quality}")
        if self.n != 1:
            parts.append(f"n={self.n}")
        if self.response_format:
            parts.append(self.response_format)
        return " · ".join(parts)


@dataclass
class VideoSettings:
    model: str
    aspect: str
    resolution: str | None = None
    duration: int | None = None  # seconds; None leaves it to the API's default

    def describe(self) -> str:
        parts = [self.model, self.aspect]
        if self.resolution:
            parts.append(self.resolution)
        parts.append(f"{self.duration}s" if self.duration is not None else "API default length")
        return " · ".join(parts)


Settings = ImageSettings | VideoSettings


@dataclass
class Planned:
    segment: Segment
    status: str  # generate | resume | exists | registered | no-prompt | placeholder
    path: Path | None = None  # existing file, or where the new one will go (extension provisional)
    note: str = ""
    settings: Settings | None = None  # set for `generate` / `resume`: what the request will carry


# ---------------------------------------------------------------------------- catalog lookup


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise UsageError(f"{path} is not valid JSON: {exc}") from exc


def load_cutaway(repo: Path, target: str) -> Cutaway:
    """Resolve TARGET (a prompts file or a cutaway id) and load its segments from the catalog."""
    records: dict[str, dict[str, Any]] = {}
    for file in sorted((repo / "content" / "cutaways").glob("*.json")):
        record = _read_json(file)
        records[record["id"]] = record
    by_source = {r["segmentsSource"]: r["id"] for r in records.values() if r.get("segmentsSource")}

    note: str | None = None
    if target.endswith(".md"):
        candidate = Path(target)
        try:
            rel = candidate.resolve().relative_to(repo.resolve()).as_posix()
        except ValueError:
            rel = target.replace("\\", "/")
        if rel in by_source:
            cutaway_id = by_source[rel]
        else:
            stem_id = re.sub(r"-segments\.md$", "", Path(rel).name)
            if stem_id not in records:
                raise UsageError(
                    f"No cutaway uses {rel} as its segmentsSource. It may be a standalone prompt "
                    "doc (content/standalone-prompts.json): those have no segment ids to batch. "
                    f"Prompt files with a cutaway: {', '.join(sorted(by_source)[:5])}, ..."
                )
            cutaway_id = stem_id
            note = (
                f"{rel} is a companion doc: segments come from the inline `segments` of "
                f"content/cutaways/{cutaway_id}.json, not from the markdown."
            )
    else:
        if target not in records:
            close = difflib.get_close_matches(target, list(records), n=3)
            hint = f" Did you mean: {', '.join(close)}?" if close else ""
            raise UsageError(f"Unknown cutaway id {target!r}.{hint}")
        cutaway_id = target

    record = records[cutaway_id]
    catalog = repo / "public" / "catalog" / "cutaways" / f"{cutaway_id}.json"
    if not catalog.exists():
        raise UsageError(f"{catalog.relative_to(repo)} is missing. Run `npm run codegen`.")
    full = _read_json(catalog)
    segments = [
        Segment(
            id=s["id"],
            label=s.get("label", s["id"]),
            start=s.get("start", ""),
            end=s.get("end", ""),
            prompt=(s.get("grokImaginePrompt") or "").strip(),
            duration_sec=s.get("durationSec") or 0,
            generation=s.get("generation") or {},
        )
        for s in full.get("segments") or []
    ]
    if not segments:
        raise UsageError(f"Cutaway {cutaway_id} has no segments.")
    ids = [s.id for s in segments]
    if len(set(ids)) != len(ids):
        raise UsageError(f"Cutaway {cutaway_id} has duplicate segment ids; files would collide.")

    source = record.get("segmentsSource")
    if source:
        markdown = (repo / source).read_text(encoding="utf-8")
        drifted = [s.id for s in segments if s.prompt and s.prompt not in markdown]
        if drifted:
            raise UsageError(
                f"public/catalog/cutaways/{cutaway_id}.json is out of date with {source} "
                f"(prompt text differs for: {', '.join(drifted)}). Run `npm run codegen` first, "
                "so the images are made from the prompts you can see in the file."
            )

    return Cutaway(
        id=cutaway_id,
        source=source,
        segments=segments,
        stills=dict(record.get("segmentStills") or {}),
        note=note,
    )


def default_out_dir(repo: Path, cutaway: Cutaway, *, video: bool = False) -> Path:
    name = re.sub(r"-segments\.md$", "", Path(cutaway.source).name) if cutaway.source else cutaway.id
    return repo / ("videos" if video else "images") / name  # videos/ is gitignored


# ----------------------------------------------------------------------------------- settings


def _first(*values: Any) -> Any:
    """The first value that is not None: flag, then catalog, then built-in default."""
    return next((value for value in values if value is not None), None)


def image_settings(segment: Segment, args: argparse.Namespace) -> ImageSettings:
    """Flags win over the segment's catalog `generation.image`, which wins over the built-ins."""
    catalog = segment.generation.get("image") or {}
    return ImageSettings(
        model=_first(args.model, catalog.get("model"), xai_api.DEFAULT_MODEL),
        aspect=_first(args.aspect, catalog.get("aspectRatio"), xai_api.DEFAULT_ASPECT),
        resolution=_first(args.resolution, catalog.get("resolution")),
        quality=_first(args.quality, catalog.get("quality")),
        n=_first(args.n, catalog.get("n"), 1),
        response_format=_first(args.response_format, catalog.get("responseFormat")),
    )


def video_duration(segment: Segment, catalog: dict[str, Any], flag: int | None) -> int | None:
    """Flag, else the content's `durationSec`, else the segment's own timed length (clamped to the
    API's range), else None: a still-length (0 s) segment leaves it to the API default."""
    chosen = _first(flag, catalog.get("durationSec"))
    if chosen is not None:
        return int(chosen)
    if segment.duration_sec > 0:
        return max(xai_api.VIDEO_MIN_SEC, min(xai_api.VIDEO_MAX_SEC, round(segment.duration_sec)))
    return None


def video_settings(segment: Segment, args: argparse.Namespace) -> VideoSettings:
    catalog = segment.generation.get("video") or {}
    return VideoSettings(
        model=_first(args.model, catalog.get("model"), xai_api.DEFAULT_VIDEO_MODEL),
        aspect=_first(args.aspect, catalog.get("aspectRatio"), xai_api.DEFAULT_VIDEO_ASPECT),
        resolution=_first(args.resolution, catalog.get("resolution")),
        duration=video_duration(segment, catalog, args.duration),
    )


def settings_problem(settings: Settings) -> str | None:
    """Why these settings cannot be sent, or None. Catches what argparse cannot see: a value that
    came from the catalog, and combinations (quality on a model that does not take it, an image-only
    aspect ratio on a clip)."""
    if isinstance(settings, VideoSettings):
        if settings.aspect not in xai_api.VIDEO_ASPECT_RATIOS:
            return f"aspect {settings.aspect} is not available for video ({', '.join(xai_api.VIDEO_ASPECT_RATIOS)})"
        if settings.resolution and settings.resolution not in xai_api.VIDEO_RESOLUTIONS:
            return f"resolution {settings.resolution} is not available for video ({', '.join(xai_api.VIDEO_RESOLUTIONS)})"
        return None
    if settings.resolution and settings.resolution not in xai_api.IMAGE_RESOLUTIONS:
        return f"resolution {settings.resolution} is not available for images ({', '.join(xai_api.IMAGE_RESOLUTIONS)})"
    if not 1 <= settings.n <= xai_api.MAX_IMAGES:
        return f"n must be 1-{xai_api.MAX_IMAGES}, got {settings.n}"
    return xai_api.quality_problem(settings.model, settings.quality)


# ----------------------------------------------------------------------------------- planning


def select_only(cutaway: Cutaway, only: list[str]) -> list[Segment]:
    """Segments named by `--only`: a full id, or the letter / label prefix before ' — '."""
    if not only:
        return cutaway.segments
    wanted = [token.strip().lower() for chunk in only for token in chunk.split(",") if token.strip()]
    keep: list[Segment] = []
    unmatched = []
    for token in wanted:
        hits = [
            s
            for s in cutaway.segments
            if s.id.lower() == token or s.label.split(" — ")[0].strip().lower() == token
        ]
        if not hits:
            unmatched.append(token)
        keep.extend(h for h in hits if h not in keep)
    if unmatched:
        valid = ", ".join(f"{s.label.split(' — ')[0].strip()}={s.id}" for s in cutaway.segments)
        raise UsageError(f"--only matched no segment for: {', '.join(unmatched)}. Valid: {valid}")
    return [s for s in cutaway.segments if s in keep]


def find_existing(out_dir: Path, segment_id: str) -> Path | None:
    for ext in IMAGE_EXTS:
        candidate = out_dir / f"{segment_id}.{ext}"
        if candidate.is_file():
            return candidate
    return None


def settings_drift(entry: dict[str, Any], settings: Settings) -> str:
    """What differs between the settings an existing file was made with (recorded in the manifest)
    and what this run would use. Keys an older manifest never recorded are not compared."""
    current = {"model": settings.model, "aspect": settings.aspect, "resolution": settings.resolution}
    if isinstance(settings, ImageSettings):
        current["quality"] = settings.quality
    return ", ".join(
        f"{key} {entry[key] or 'unset'} -> {value or 'unset'}"
        for key, value in current.items()
        if key in entry and entry[key] != value
    )


def plan(
    repo: Path,
    cutaway: Cutaway,
    segments: list[Segment],
    out_dir: Path,
    manifest: dict[str, Any],
    args: argparse.Namespace,
    *,
    force: bool,
    video: bool = False,
) -> list[Planned]:
    planned: list[Planned] = []
    entries = manifest.get("segments", {})
    for segment in segments:
        if not segment.prompt:
            planned.append(Planned(segment, "no-prompt", note="no Grok Imagine prompt in the source"))
            continue
        slots = PLACEHOLDER.findall(segment.prompt)
        if slots:
            planned.append(
                Planned(segment, "placeholder", note=f"fill in {', '.join(sorted(set(slots)))} first")
            )
            continue
        settings = video_settings(segment, args) if video else image_settings(segment, args)
        entry = entries.get(segment.id) or {}
        current_hash = xai_api.prompt_hash(segment.prompt)
        clip = out_dir / f"{segment.id}.{VIDEO_EXT}"
        if video:
            existing = clip if clip.is_file() else None
        else:
            existing = find_existing(out_dir, segment.id)
        if existing and not force:
            notes = []
            if entry.get("promptSha256") and entry["promptSha256"] != current_hash:
                notes.append("prompt changed since this was made")
            drift = settings_drift(entry, settings)
            if drift:
                notes.append(f"settings changed ({drift})")
            note = f"{'; '.join(notes)}; --force to regenerate" if notes else ""
            planned.append(Planned(segment, "exists", existing, note))
            continue
        if video:
            # A clip submitted by an earlier run that never finished downloading: keep polling it.
            if (
                not force
                and entry.get("status") == "pending"
                and entry.get("requestId")
                and entry.get("promptSha256") == current_hash
            ):
                planned.append(
                    Planned(
                        segment,
                        "resume",
                        clip,
                        f"request {entry['requestId']}",
                        settings,
                    )
                )
                continue
            planned.append(Planned(segment, "generate", clip, settings=settings))
            continue
        registered = cutaway.stills.get(segment.id)
        if registered and (repo / registered).is_file() and not force:
            planned.append(Planned(segment, "registered", repo / registered, f"segmentStills: {registered}"))
            continue
        planned.append(Planned(segment, "generate", out_dir / f"{segment.id}.jpg", settings=settings))
    return planned


# ------------------------------------------------------------------------------------ manifest


def repo_rel(repo: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(repo.resolve()).as_posix()
    except ValueError:
        return str(path)


def load_manifest(out_dir: Path, cutaway: Cutaway, *, video: bool = False) -> dict[str, Any]:
    path = out_dir / MANIFEST_NAME
    kind = "video" if video else "image"
    empty: dict[str, Any] = {
        "version": MANIFEST_VERSION,
        "cutawayId": cutaway.id,
        "source": cutaway.source,
        **({"kind": "video"} if video else {}),  # stills manifests keep their original shape
        "segments": {},
    }
    if not path.exists():
        return empty
    manifest = _read_json(path)
    if not isinstance(manifest, dict) or not isinstance(manifest.get("segments"), dict):
        raise UsageError(f"{path} is not a manifest this script wrote; move it aside or fix it.")
    if manifest.get("cutawayId") != cutaway.id:
        raise UsageError(
            f"{path} belongs to cutaway {manifest.get('cutawayId')!r}, not {cutaway.id!r}. "
            "Use a different --out."
        )
    if manifest.get("kind", "image") != kind:
        raise UsageError(
            f"{path} holds {manifest.get('kind', 'image')} entries, and this run makes {kind}s. "
            "Use a different --out."
        )
    manifest.setdefault("version", MANIFEST_VERSION)
    manifest["source"] = cutaway.source
    return manifest


def save_manifest(out_dir: Path, cutaway: Cutaway, manifest: dict[str, Any]) -> None:
    """Segment order follows the cutaway; ids it no longer has are kept at the end."""
    entries = manifest["segments"]
    order = [s.id for s in cutaway.segments]
    ordered = {sid: entries[sid] for sid in order if sid in entries}
    ordered.update({sid: entry for sid, entry in entries.items() if sid not in ordered})
    manifest["segments"] = ordered
    text = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    xai_api.write_atomic(out_dir / MANIFEST_NAME, text.encode("utf-8"))


def adopt_existing(repo: Path, planned: list[Planned], manifest: dict[str, Any]) -> bool:
    """Record images already in the folder (made by hand, or by a run that predates the manifest)
    so it covers every file. Their prompt hash is unknown, so it is left null."""
    changed = False
    for item in planned:
        if item.status == "exists" and item.path and item.segment.id not in manifest["segments"]:
            manifest["segments"][item.segment.id] = {
                "path": repo_rel(repo, item.path),
                "promptSha256": None,
                "adopted": True,
            }
            changed = True
    return changed


# ---------------------------------------------------------------------------------- reporting


SKIP_REASON = {
    "exists": "exists",
    "registered": "already registered",
    "no-prompt": "no prompt",
    "placeholder": "placeholder",
}
STATUS_TEXT = {
    "generate": "GENERATE",
    "resume": "RESUME (keep polling the request an earlier run submitted)",
    **{k: f"SKIP ({v})" for k, v in SKIP_REASON.items()},
}
TODO = ("generate", "resume")


def print_skips(planned: list[Planned]) -> None:
    for item in planned:
        if item.status not in TODO:
            note = f" [{item.note}]" if item.note else ""
            print(f"skip {item.segment.id}: {SKIP_REASON[item.status]}{note}")


def print_plan(repo: Path, cutaway: Cutaway, planned: list[Planned]) -> None:
    total = len(planned)
    for index, item in enumerate(planned, start=1):
        seg = item.segment
        span = f" ({seg.start}–{seg.end})" if seg.start else ""
        print(f"[{index}/{total}] {seg.id}  {seg.label}{span}")
        where = f" -> {repo_rel(repo, item.path)}" if item.path else ""
        note = f"  [{item.note}]" if item.note else ""
        print(f"      {STATUS_TEXT[item.status]}{where}{note}")
        if item.settings:
            print(f"      with {item.settings.describe()}")
        if seg.prompt:
            print(textwrap.fill(seg.prompt, width=100, initial_indent="      | ", subsequent_indent="      | "))


def summarize(planned: list[Planned]) -> str:
    counts: dict[str, int] = {}
    for item in planned:
        counts[item.status] = counts.get(item.status, 0) + 1
    skipped = sum(n for status, n in counts.items() if status not in TODO)
    parts = [f"{counts.get('generate', 0)} to generate"]
    if counts.get("resume"):
        parts.append(f"{counts['resume']} to resume")
    if skipped:
        detail = ", ".join(f"{n} {status}" for status, n in counts.items() if status not in TODO)
        parts.append(f"{skipped} skipped ({detail})")
    return ", ".join(parts)


def stills_snippet(repo: Path, cutaway: Cutaway, manifest: dict[str, Any]) -> str | None:
    """`segmentStills` as it would read after registering this run's images (None if none)."""
    new = {
        sid: entry["path"]
        for sid, entry in manifest["segments"].items()
        if sid in {s.id for s in cutaway.segments} and not Path(entry["path"]).is_absolute()
    }
    if not new:
        return None
    merged = {**cutaway.stills, **new}
    ordered = {s.id: merged[s.id] for s in cutaway.segments if s.id in merged}
    return json.dumps({"segmentStills": ordered}, indent=2)


# ------------------------------------------------------------------------------------- runner


def say(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def settings_record(settings: Settings) -> dict[str, Any]:
    """Settings as written to the manifest and the log. Unset options are recorded as null in the
    manifest (so a later change from unset to set is noticed) but left out of the log."""
    if isinstance(settings, VideoSettings):
        return {
            "model": settings.model,
            "aspect": settings.aspect,
            "resolution": settings.resolution,
            "durationSec": settings.duration,
        }
    return {
        "model": settings.model,
        "aspect": settings.aspect,
        "resolution": settings.resolution,
        "quality": settings.quality,
        "responseFormat": settings.response_format,
        **({"n": settings.n} if settings.n != 1 else {}),
    }


def log_record(cutaway: Cutaway, segment: Segment, settings: Settings, kind: str) -> dict[str, Any]:
    return {
        "ts": xai_api.utc_now(),
        "tool": "xai-batch",
        **({"kind": "video"} if kind == "video" else {}),
        "cutawayId": cutaway.id,
        "segmentId": segment.id,
        **{k: v for k, v in settings_record(settings).items() if v is not None},
        "promptSha256": xai_api.prompt_hash(segment.prompt),
    }


def log_failure(log_path: Path | None, record: dict[str, Any], exc: ApiError, started: float) -> None:
    if log_path:
        xai_api.append_jsonl(
            log_path,
            {
                **record,
                "ok": False,
                "error": str(exc)[:300],
                "status": exc.status,
                "attempts": exc.attempts,
                "elapsedSec": round(time.monotonic() - started, 2),
            },
        )


def write_image(out_dir: Path, name: str, data: bytes) -> Path:
    ext = xai_api.sniff_extension(data)
    if ext is None:
        say(f"  warning: {name}: unrecognised image format; saved as .jpg, check it")
        ext = "jpg"
    dest = out_dir / f"{name}.{ext}"
    xai_api.write_atomic(dest, data)
    for other in IMAGE_EXTS:  # a regenerated image in another format leaves no twin behind
        twin = out_dir / f"{name}.{other}"
        if twin != dest and twin.is_file():
            twin.unlink()
    return dest


def run(
    repo: Path,
    cutaway: Cutaway,
    planned: list[Planned],
    out_dir: Path,
    manifest: dict[str, Any],
    args: argparse.Namespace,
    api_key: str,
) -> int:
    """Stills: one request per segment, in order."""
    log_path = Path(args.json_log) if args.json_log else None
    generated = 0
    failed: list[str] = []
    spent = 0.0
    todo = [p for p in planned if p.status == "generate"]

    try:
        for index, item in enumerate(todo, start=1):
            seg = item.segment
            cfg = item.settings
            assert isinstance(cfg, ImageSettings)
            print(f"[{index}/{len(todo)}] {seg.id} ({cfg.describe()}) ...", flush=True)
            started = time.monotonic()
            record = log_record(cutaway, seg, cfg, "image")
            try:
                generation = xai_api.generate(
                    seg.prompt,
                    model=cfg.model,
                    aspect_ratio=cfg.aspect,
                    api_key=api_key,
                    n=cfg.n,
                    resolution=cfg.resolution,
                    quality=cfg.quality,
                    response_format=cfg.response_format,
                    retries=args.retries,
                    log=say,
                )
                blobs: list[bytes] = []
                download_attempts = 0
                for image in generation.images:
                    data, attempts = xai_api.image_bytes(image, retries=args.retries, log=say)
                    blobs.append(data)
                    download_attempts += attempts
            except ApiError as exc:
                failed.append(seg.id)
                say(f"  FAILED {seg.id}: {exc}")
                log_failure(log_path, record, exc, started)
                if exc.fatal:
                    say("  Stopping: this error would repeat for every remaining segment.")
                    break
                continue

            paths = [
                write_image(out_dir, seg.id if i == 0 else f"{seg.id}-{i + 1}", data)
                for i, data in enumerate(blobs)
            ]
            cost = xai_api.cost_usd(generation.usage)
            spent += cost or 0.0
            manifest["segments"][seg.id] = {
                "path": repo_rel(repo, paths[0]),
                "promptSha256": record["promptSha256"],
                **settings_record(cfg),
                "bytes": len(blobs[0]),
                "generatedAt": record["ts"],
                **({"variants": [repo_rel(repo, path) for path in paths[1:]]} if len(paths) > 1 else {}),
                **({"costUsd": cost} if cost is not None else {}),
                **({"usage": generation.usage} if generation.usage else {}),
            }
            save_manifest(out_dir, cutaway, manifest)
            generated += 1
            cost_text = f", ${cost:.4f}" if cost is not None else ""
            for path, data in zip(paths, blobs):
                print(f"  wrote {repo_rel(repo, path)} ({len(data)} bytes{cost_text})", flush=True)
                cost_text = ""
            if log_path:
                xai_api.append_jsonl(
                    log_path,
                    {
                        **record,
                        "ok": True,
                        "path": repo_rel(repo, paths[0]),
                        "bytes": sum(len(data) for data in blobs),
                        "attempts": generation.attempts,
                        "downloadAttempts": download_attempts,
                        "elapsedSec": round(time.monotonic() - started, 2),
                        "usage": generation.usage,
                        "costUsd": cost,
                    },
                )
    except KeyboardInterrupt:
        say("\nInterrupted. Finished images and the manifest are saved; re-run to resume.")
        save_manifest(out_dir, cutaway, manifest)
        return 130

    save_manifest(out_dir, cutaway, manifest)
    summary = f"\nDone: {generated} generated, {len(failed)} failed"
    if spent:
        summary += f", ${spent:.4f} spent"
    print(summary)
    if failed:
        print(f"Failed: {', '.join(failed)}. Re-run the same command to retry just those.")
    print(f"Manifest: {repo_rel(repo, out_dir / MANIFEST_NAME)}")
    snippet = stills_snippet(repo, cutaway, manifest)
    if snippet and generated:
        print(
            f"\nTo show these on the Suggestions rows, put this in content/cutaways/{cutaway.id}.json "
            f"and run `npm run codegen`:\n{snippet}"
        )
    return 1 if failed else 0


@dataclass
class Job:
    """A clip that has been submitted and is being polled."""

    item: Planned
    request_id: str
    record: dict[str, Any]
    started: float


def run_videos(
    repo: Path,
    cutaway: Cutaway,
    planned: list[Planned],
    out_dir: Path,
    manifest: dict[str, Any],
    args: argparse.Namespace,
    api_key: str,
) -> int:
    """Clips: submit every segment, then poll them all together, so the wait is one clip's, not N.

    The request id is written to the manifest as `pending` the moment it is submitted. It stays
    there through a crash, a timeout or a failed download, so the next run resumes it (status
    `resume`) rather than paying for another clip; it is dropped only when xAI says the request
    `failed` or `expired`, i.e. it will never produce a file.
    """
    log_path = Path(args.json_log) if args.json_log else None
    # Always go through manifest["segments"]: save_manifest() replaces that dict with a re-ordered
    # one, so a reference taken here would silently stop reaching the file after the first save.
    todo = [p for p in planned if p.status in TODO]
    jobs: dict[str, Job] = {}
    generated = 0
    failed: list[str] = []
    spent = 0.0
    stop = False

    def finish(job: Job, result: xai_api.VideoResult) -> None:
        nonlocal generated, spent
        seg, cfg = job.item.segment, job.item.settings
        assert isinstance(cfg, VideoSettings)
        data, download_attempts = xai_api.fetch(result.url, retries=args.retries, log=say)
        dest = out_dir / f"{seg.id}.{VIDEO_EXT}"
        xai_api.write_atomic(dest, data)
        cost = xai_api.cost_usd(result.usage)
        spent += cost or 0.0
        manifest["segments"][seg.id] = {
            "path": repo_rel(repo, dest),
            "promptSha256": job.record["promptSha256"],
            **settings_record(cfg),
            **({"durationSec": result.duration} if result.duration is not None else {}),
            "requestId": job.request_id,
            "bytes": len(data),
            "generatedAt": xai_api.utc_now(),
            **({"costUsd": cost} if cost is not None else {}),
            **({"usage": result.usage} if result.usage else {}),
        }
        save_manifest(out_dir, cutaway, manifest)
        generated += 1
        cost_text = f", ${cost:.4f}" if cost is not None else ""
        print(f"  wrote {repo_rel(repo, dest)} ({len(data)} bytes{cost_text})", flush=True)
        if log_path:
            xai_api.append_jsonl(
                log_path,
                {
                    **job.record,
                    "ok": True,
                    "path": repo_rel(repo, dest),
                    "requestId": job.request_id,
                    "bytes": len(data),
                    "downloadAttempts": download_attempts,
                    "elapsedSec": round(time.monotonic() - job.started, 2),
                    "usage": result.usage,
                    "costUsd": cost,
                },
            )

    try:
        for index, item in enumerate(todo, start=1):
            seg, cfg = item.segment, item.settings
            assert isinstance(cfg, VideoSettings)
            record = log_record(cutaway, seg, cfg, "video")
            started = time.monotonic()
            if item.status == "resume":
                request_id = manifest["segments"][seg.id]["requestId"]
                print(f"[{index}/{len(todo)}] {seg.id} resuming request {request_id}", flush=True)
            else:
                print(f"[{index}/{len(todo)}] {seg.id} ({cfg.describe()}) submitting ...", flush=True)
                try:
                    request_id, _ = xai_api.submit_video(
                        xai_api.video_payload(
                            seg.prompt,
                            model=cfg.model,
                            aspect_ratio=cfg.aspect,
                            resolution=cfg.resolution,
                            duration=cfg.duration,
                        ),
                        api_key=api_key,
                        retries=args.retries,
                        log=say,
                    )
                except ApiError as exc:
                    failed.append(seg.id)
                    say(f"  FAILED {seg.id}: {exc}")
                    log_failure(log_path, record, exc, started)
                    if exc.fatal:
                        say("  Stopping: this error would repeat for every remaining segment.")
                        stop = True
                        break
                    continue
                manifest["segments"][seg.id] = {
                    "status": "pending",
                    "requestId": request_id,
                    "promptSha256": record["promptSha256"],
                    **settings_record(cfg),
                    "submittedAt": xai_api.utc_now(),
                }
                save_manifest(out_dir, cutaway, manifest)
            jobs[seg.id] = Job(item, request_id, record, started)

        deadline = time.monotonic() + args.poll_timeout
        last_report = time.monotonic()
        while jobs and not stop:
            for seg_id, job in list(jobs.items()):
                try:
                    result = xai_api.check_video(
                        job.request_id, api_key=api_key, retries=args.retries, log=say
                    )
                    if result is None:
                        continue
                    finish(job, result)
                except xai_api.VideoGone as exc:
                    manifest["segments"].pop(seg_id, None)  # never going to finish: the next run submits afresh
                    save_manifest(out_dir, cutaway, manifest)
                    failed.append(seg_id)
                    say(f"  FAILED {seg_id}: {exc}")
                    log_failure(log_path, job.record, exc, job.started)
                except ApiError as exc:
                    failed.append(seg_id)  # pending entry kept: a re-run resumes this request
                    say(f"  FAILED {seg_id}: {exc}")
                    log_failure(log_path, job.record, exc, job.started)
                    if exc.fatal:
                        say("  Stopping: this error would repeat for every remaining segment.")
                        stop = True
                del jobs[seg_id]
                if stop:
                    break
            if not jobs or stop:
                break
            if time.monotonic() >= deadline:
                for seg_id, job in jobs.items():
                    failed.append(seg_id)
                    say(
                        f"  TIMED OUT {seg_id}: request {job.request_id} still pending after "
                        f"{args.poll_timeout:.0f}s; re-run to keep polling it"
                    )
                break
            if time.monotonic() - last_report >= 30:
                say(f"  waiting on {len(jobs)} clip(s): {', '.join(jobs)}")
                last_report = time.monotonic()
            time.sleep(args.poll_interval)
    except KeyboardInterrupt:
        say("\nInterrupted. Submitted requests are saved in the manifest; re-run to resume them.")
        save_manifest(out_dir, cutaway, manifest)
        return 130

    save_manifest(out_dir, cutaway, manifest)
    summary = f"\nDone: {generated} generated, {len(failed)} failed"
    if spent:
        summary += f", ${spent:.4f} spent"
    print(summary)
    if failed:
        print(f"Failed: {', '.join(failed)}. Re-run the same command to retry (or resume) just those.")
    print(f"Manifest: {repo_rel(repo, out_dir / MANIFEST_NAME)}")
    return 1 if failed else 0


# ----------------------------------------------------------------------------------------- cli


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate Grok Imagine stills (or, with --video, clips) for every segment of one cutaway",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Flags override the cutaway's generationDefaults / segmentGeneration, which override the "
            "built-in defaults (scripts/xai-api-spec.json).\n"
            "Run with --dry-run first: it lists every prompt and setting and spends nothing."
        ),
    )
    parser.add_argument("target", help="prompts/<name>-segments.md, or a cutaway id")
    parser.add_argument(
        "--video",
        action="store_true",
        help="Generate a clip per segment instead of a still (out: videos/<name>/, gitignored)",
    )
    parser.add_argument(
        "--model",
        help=f"Model id (default: the segment's generation.model, else {xai_api.DEFAULT_MODEL}; "
        f"{xai_api.DEFAULT_VIDEO_MODEL} with --video)",
    )
    parser.add_argument(
        "--aspect",
        choices=xai_api.ASPECT_RATIOS,
        metavar="RATIO",
        help=f"Aspect ratio (default: the segment's generation aspectRatio, else {xai_api.DEFAULT_ASPECT}; "
        f"one of: {', '.join(xai_api.ASPECT_RATIOS)}; clips accept {', '.join(xai_api.VIDEO_ASPECT_RATIOS)})",
    )
    parser.add_argument(
        "--resolution",
        choices=(*xai_api.IMAGE_RESOLUTIONS, *xai_api.VIDEO_RESOLUTIONS),
        help=f"Stills: {'/'.join(xai_api.IMAGE_RESOLUTIONS)}. Clips: {'/'.join(xai_api.VIDEO_RESOLUTIONS)}. "
        "Not sent when unset",
    )
    parser.add_argument(
        "--quality",
        choices=xai_api.IMAGE_QUALITIES,
        help=f"Stills only; only on {', '.join(xai_api.QUALITY_MODELS)}. Not sent when unset",
    )
    parser.add_argument(
        "--response-format",
        choices=xai_api.RESPONSE_FORMATS,
        help="Stills only: url (downloaded) or b64_json (returned inline)",
    )
    parser.add_argument(
        "--n",
        type=int,
        metavar="N",
        help=f"Stills only: images per segment, 1-{xai_api.MAX_IMAGES} (extras saved as <segment-id>-2.<ext>, ...)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        metavar="SEC",
        help=f"Clips only: seconds, {xai_api.VIDEO_MIN_SEC}-{xai_api.VIDEO_MAX_SEC} "
        "(default: the content's durationSec, else the segment's timed length)",
    )
    parser.add_argument(
        "--poll-interval",
        type=float,
        default=xai_api.VIDEO_POLL_INTERVAL_SEC,
        metavar="SEC",
        help=f"Clips only: seconds between status checks (default {xai_api.VIDEO_POLL_INTERVAL_SEC:g})",
    )
    parser.add_argument(
        "--poll-timeout",
        type=float,
        default=xai_api.VIDEO_POLL_TIMEOUT_SEC,
        metavar="SEC",
        help=f"Clips only: stop waiting after this long; a re-run resumes (default {xai_api.VIDEO_POLL_TIMEOUT_SEC:g})",
    )
    parser.add_argument("--out", help="Output folder (default: images/<name>/, or videos/<name>/ with --video)")
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="IDS",
        help="Only these segments: ids or letters, comma-separated or repeated (e.g. A,C)",
    )
    parser.add_argument("--force", action="store_true", help="Regenerate even if the file exists")
    parser.add_argument(
        "--dry-run", action="store_true", help="List the plan, settings and prompts; no API calls, no files"
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=xai_api.DEFAULT_RETRIES,
        help=f"Retries on 429 / 5xx / network errors, exponential backoff (default {xai_api.DEFAULT_RETRIES})",
    )
    parser.add_argument(
        "--json-log",
        nargs="?",
        const=str(xai_api.DEFAULT_LOG),
        default=None,
        metavar="PATH",
        help="Append a JSON line per request to PATH (default docs/generation-log.jsonl in the repo)",
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("XAI_API_KEY", ""),
        help="Or set XAI_API_KEY env var (not needed for --dry-run)",
    )
    return parser


def check_flags(args: argparse.Namespace) -> None:
    """Flags that make no sense for the chosen mode, and out-of-range numbers, before anything runs."""
    if args.retries < 0:
        raise UsageError("--retries must be >= 0")
    if args.n is not None and not 1 <= args.n <= xai_api.MAX_IMAGES:
        raise UsageError(f"--n must be 1-{xai_api.MAX_IMAGES}")
    if args.duration is not None and not xai_api.VIDEO_MIN_SEC <= args.duration <= xai_api.VIDEO_MAX_SEC:
        raise UsageError(f"--duration must be {xai_api.VIDEO_MIN_SEC}-{xai_api.VIDEO_MAX_SEC} seconds")
    if args.poll_interval < 0 or args.poll_timeout < 0:
        raise UsageError("--poll-interval and --poll-timeout must be >= 0")
    if args.video:
        still_only = (("--quality", args.quality), ("--response-format", args.response_format), ("--n", args.n))
        wrong = [flag for flag, value in still_only if value is not None]
        if wrong:
            raise UsageError(f"{', '.join(wrong)} only apply to stills; drop them or drop --video")
        if args.aspect and args.aspect not in xai_api.VIDEO_ASPECT_RATIOS:
            allowed = ", ".join(xai_api.VIDEO_ASPECT_RATIOS)
            raise UsageError(f"--aspect {args.aspect} is not available for clips ({allowed})")
        if args.resolution and args.resolution not in xai_api.VIDEO_RESOLUTIONS:
            allowed = ", ".join(xai_api.VIDEO_RESOLUTIONS)
            raise UsageError(f"--resolution {args.resolution} is not available for clips ({allowed})")
    else:
        if args.duration is not None:
            raise UsageError("--duration only applies to clips; add --video")
        if args.resolution and args.resolution not in xai_api.IMAGE_RESOLUTIONS:
            allowed = ", ".join(xai_api.IMAGE_RESOLUTIONS)
            raise UsageError(f"--resolution {args.resolution} is not available for stills ({allowed})")


def check_planned(cutaway: Cutaway, planned: list[Planned]) -> None:
    """Refuse the whole run, before any request, if a segment about to be sent has settings the API
    would reject (so a bad model/quality pairing never costs one credit per segment to find out)."""
    problems = [
        f"{item.segment.id}: {problem}"
        for item in planned
        if item.status in TODO and item.settings and (problem := settings_problem(item.settings))
    ]
    ids = {s.id for s in cutaway.segments}
    for item in planned:
        extras = item.settings.n if isinstance(item.settings, ImageSettings) and item.status in TODO else 1
        clash = [f"{item.segment.id}-{k}" for k in range(2, extras + 1) if f"{item.segment.id}-{k}" in ids]
        if clash:
            problems.append(f"{item.segment.id}: n={extras} would save over the files of segment {', '.join(clash)}")
    if problems:
        raise UsageError("cannot send:\n  " + "\n  ".join(problems))


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    repo = REPO_ROOT
    try:
        check_flags(args)
        cutaway = load_cutaway(repo, args.target)
        out_dir = Path(args.out).resolve() if args.out else default_out_dir(repo, cutaway, video=args.video)
        manifest = load_manifest(out_dir, cutaway, video=args.video)
        segments = select_only(cutaway, args.only)
        planned = plan(repo, cutaway, segments, out_dir, manifest, args, force=args.force, video=args.video)
        check_planned(cutaway, planned)
    except UsageError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    source = f" ({cutaway.source})" if cutaway.source else ""
    print(f"Cutaway {cutaway.id}{source}")
    if cutaway.note:
        print(f"note: {cutaway.note}")
    mode = "DRY RUN, no API calls, nothing written" if args.dry_run else "live"
    what = "clips" if args.video else "stills"
    print(f"{what} · out {repo_rel(repo, out_dir)}/ · {mode}\n")
    if args.dry_run:
        print_plan(repo, cutaway, planned)
    else:
        print_skips(planned)  # the segments that will run report their own progress
    print(f"\n{summarize(planned)}")

    if args.dry_run:
        if not args.video:
            print("(image extension follows the format the API returns; jpg shown)")
        return 0
    if adopt_existing(repo, planned, manifest):
        save_manifest(out_dir, cutaway, manifest)
    if not any(p.status in TODO for p in planned):
        print("Nothing to generate.")
        return 0

    api_key = xai_api.require_api_key(args.api_key)
    if api_key is None:
        return 2
    print()
    runner = run_videos if args.video else run
    return runner(repo, cutaway, planned, out_dir, manifest, args, api_key)


if __name__ == "__main__":
    raise SystemExit(main())
