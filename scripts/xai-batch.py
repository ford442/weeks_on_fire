#!/usr/bin/env python3
"""Generate the Grok Imagine still for every segment of one cutaway (stdlib only).

Usage:
  export XAI_API_KEY=xai-...
  python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md --dry-run
  python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md \\
      --model grok-imagine-image-quality --aspect 16:9 --out images/glam-sham-poo/
  python3 scripts/xai-batch.py mv-ultra-screech --only A,B --json-log   # by cutaway id

TARGET is a `prompts/*-segments.md` file or a cutaway id. Segments (and their ids) come from the
generated catalog `public/catalog/cutaways/<id>.json`, i.e. exactly what the Suggestions view
shows, parsed by the same codegen that owns the markdown format. Run `npm run codegen` after
editing a prompts file; the script refuses to run against a catalog that has drifted from it.

What it does, per segment:
  * sends the segment's Grok Imagine prompt (one request, one image)
  * saves it as <out>/<segment-id>.<jpg|png|webp>  (default out: images/<name>/)
  * skips it when that file already exists (resume), when the cutaway already registers a still
    for it (`segmentStills`), when it has no Grok prompt, or when the prompt still contains a
    `[PLACEHOLDER]` to fill in. --force regenerates; --only A,B / <segment-id> narrows the run.
  * writes <out>/manifest.json after every image: segment id -> file path + prompt SHA-256
    (plus model, aspect, size, time), so a crashed run loses nothing and a stale image is spotted
    when the prompt later changes.

--dry-run prints the plan and every prompt, makes no API call, and writes nothing.
--retries N retries 429 / 5xx / network errors with exponential backoff (default 3). A 401 / 403
stops the whole batch (bad key or no credits would fail every segment the same way).
--json-log [PATH] appends one JSON line per request to PATH (default docs/generation-log.jsonl),
with the response's usage and cost. Prompt text and key are never logged.

Models and aspect ratios: see scripts/xai_api.py. Aspect is one value for the whole run; the
prompts files do not carry a per-segment aspect. Mixed-ratio runs: use --only per ratio.

After a run it prints the `segmentStills` block for content/cutaways/<id>.json; paste it, then
`npm run codegen`, to put the stills on the segment rows. Only commit stills you mean to ship
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


@dataclass
class Cutaway:
    id: str
    source: str | None  # `segmentsSource`, when segments are parsed from markdown
    segments: list[Segment]
    stills: dict[str, str] = field(default_factory=dict)  # `segmentStills`: id -> repo path
    note: str | None = None


@dataclass
class Planned:
    segment: Segment
    status: str  # generate | exists | registered | no-prompt | placeholder
    path: Path | None = None  # existing file, or where the new one will go (extension provisional)
    note: str = ""


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


def default_out_dir(repo: Path, cutaway: Cutaway) -> Path:
    name = re.sub(r"-segments\.md$", "", Path(cutaway.source).name) if cutaway.source else cutaway.id
    return repo / "images" / name


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


def plan(
    repo: Path,
    cutaway: Cutaway,
    segments: list[Segment],
    out_dir: Path,
    manifest: dict[str, Any],
    *,
    force: bool,
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
        existing = find_existing(out_dir, segment.id)
        if existing and not force:
            note = ""
            recorded = (entries.get(segment.id) or {}).get("promptSha256")
            if recorded and recorded != xai_api.prompt_hash(segment.prompt):
                note = "prompt changed since this image was made; --force to regenerate"
            planned.append(Planned(segment, "exists", existing, note))
            continue
        registered = cutaway.stills.get(segment.id)
        if registered and (repo / registered).is_file() and not force:
            planned.append(Planned(segment, "registered", repo / registered, f"segmentStills: {registered}"))
            continue
        planned.append(Planned(segment, "generate", out_dir / f"{segment.id}.jpg"))
    return planned


# ------------------------------------------------------------------------------------ manifest


def repo_rel(repo: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(repo.resolve()).as_posix()
    except ValueError:
        return str(path)


def load_manifest(out_dir: Path, cutaway: Cutaway) -> dict[str, Any]:
    path = out_dir / MANIFEST_NAME
    empty: dict[str, Any] = {
        "version": MANIFEST_VERSION,
        "cutawayId": cutaway.id,
        "source": cutaway.source,
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
STATUS_TEXT = {"generate": "GENERATE", **{k: f"SKIP ({v})" for k, v in SKIP_REASON.items()}}


def print_skips(planned: list[Planned]) -> None:
    for item in planned:
        if item.status != "generate":
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
        if seg.prompt:
            print(textwrap.fill(seg.prompt, width=100, initial_indent="      | ", subsequent_indent="      | "))


def summarize(planned: list[Planned]) -> str:
    counts: dict[str, int] = {}
    for item in planned:
        counts[item.status] = counts.get(item.status, 0) + 1
    skipped = sum(n for status, n in counts.items() if status != "generate")
    parts = [f"{counts.get('generate', 0)} to generate"]
    if skipped:
        detail = ", ".join(f"{n} {status}" for status, n in counts.items() if status != "generate")
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


def run(
    repo: Path,
    cutaway: Cutaway,
    planned: list[Planned],
    out_dir: Path,
    manifest: dict[str, Any],
    args: argparse.Namespace,
    api_key: str,
) -> int:
    log_path = Path(args.json_log) if args.json_log else None
    generated = 0
    failed: list[str] = []
    spent = 0.0
    todo = [p for p in planned if p.status == "generate"]

    def say(message: str) -> None:
        print(message, file=sys.stderr, flush=True)

    try:
        for index, item in enumerate(todo, start=1):
            seg = item.segment
            print(f"[{index}/{len(todo)}] {seg.id} ...", flush=True)
            started = time.monotonic()
            record: dict[str, Any] = {
                "ts": xai_api.utc_now(),
                "tool": "xai-batch",
                "cutawayId": cutaway.id,
                "segmentId": seg.id,
                "model": args.model,
                "aspect": args.aspect,
                "promptSha256": xai_api.prompt_hash(seg.prompt),
            }
            try:
                generation = xai_api.generate(
                    seg.prompt,
                    model=args.model,
                    aspect_ratio=args.aspect,
                    api_key=api_key,
                    retries=args.retries,
                    log=say,
                )
                data, download_attempts = xai_api.fetch(generation.url, retries=args.retries, log=say)
            except ApiError as exc:
                failed.append(seg.id)
                say(f"  FAILED {seg.id}: {exc}")
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
                if exc.fatal:
                    say("  Stopping: this error would repeat for every remaining segment.")
                    break
                continue

            ext = xai_api.sniff_extension(data)
            if ext is None:
                say(f"  warning: {seg.id}: unrecognised image format; saved as .jpg, check it")
                ext = "jpg"
            dest = out_dir / f"{seg.id}.{ext}"
            xai_api.write_atomic(dest, data)
            for other in IMAGE_EXTS:  # a regenerated image in another format leaves no twin behind
                twin = out_dir / f"{seg.id}.{other}"
                if twin != dest and twin.is_file():
                    twin.unlink()
            cost = xai_api.cost_usd(generation.usage)
            spent += cost or 0.0
            manifest["segments"][seg.id] = {
                "path": repo_rel(repo, dest),
                "promptSha256": record["promptSha256"],
                "model": args.model,
                "aspect": args.aspect,
                "bytes": len(data),
                "generatedAt": record["ts"],
            }
            save_manifest(out_dir, cutaway, manifest)
            generated += 1
            cost_text = f", ${cost:.4f}" if cost is not None else ""
            print(f"  wrote {repo_rel(repo, dest)} ({len(data)} bytes{cost_text})", flush=True)
            if log_path:
                xai_api.append_jsonl(
                    log_path,
                    {
                        **record,
                        "ok": True,
                        "path": repo_rel(repo, dest),
                        "bytes": len(data),
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


# ----------------------------------------------------------------------------------------- cli


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate Grok Imagine stills for every segment of one cutaway",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Run with --dry-run first: it lists every prompt and spends nothing.",
    )
    parser.add_argument("target", help="prompts/<name>-segments.md, or a cutaway id")
    parser.add_argument(
        "--model",
        default=xai_api.DEFAULT_MODEL,
        help=f"Model id (default: {xai_api.DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--aspect",
        default=xai_api.DEFAULT_ASPECT,
        choices=xai_api.ASPECT_RATIOS,
        metavar="RATIO",
        help=f"Aspect ratio for the whole run (default {xai_api.DEFAULT_ASPECT}; one of: {', '.join(xai_api.ASPECT_RATIOS)})",
    )
    parser.add_argument("--out", help="Output folder (default: images/<name>/ in the repo)")
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        metavar="IDS",
        help="Only these segments: ids or letters, comma-separated or repeated (e.g. A,C)",
    )
    parser.add_argument("--force", action="store_true", help="Regenerate even if the image exists")
    parser.add_argument(
        "--dry-run", action="store_true", help="List the plan and prompts; no API calls, no files"
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


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    repo = REPO_ROOT
    try:
        if args.retries < 0:
            raise UsageError("--retries must be >= 0")
        cutaway = load_cutaway(repo, args.target)
        out_dir = Path(args.out).resolve() if args.out else default_out_dir(repo, cutaway)
        manifest = load_manifest(out_dir, cutaway)
        segments = select_only(cutaway, args.only)
    except UsageError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    planned = plan(repo, cutaway, segments, out_dir, manifest, force=args.force)

    source = f" ({cutaway.source})" if cutaway.source else ""
    print(f"Cutaway {cutaway.id}{source}")
    if cutaway.note:
        print(f"note: {cutaway.note}")
    mode = "DRY RUN, no API calls, nothing written" if args.dry_run else "live"
    print(f"model {args.model} · aspect {args.aspect} · out {repo_rel(repo, out_dir)}/ · {mode}\n")
    if args.dry_run:
        print_plan(repo, cutaway, planned)
    else:
        print_skips(planned)  # the segments that will run report their own progress
    print(f"\n{summarize(planned)}")

    if args.dry_run:
        print("(image extension follows the format the API returns; jpg shown)")
        return 0
    if adopt_existing(repo, planned, manifest):
        save_manifest(out_dir, cutaway, manifest)
    if not any(p.status == "generate" for p in planned):
        print("Nothing to generate.")
        return 0

    api_key = xai_api.require_api_key(args.api_key)
    if api_key is None:
        return 2
    print()
    return run(repo, cutaway, planned, out_dir, manifest, args, api_key)


if __name__ == "__main__":
    raise SystemExit(main())
