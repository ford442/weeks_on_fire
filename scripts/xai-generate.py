#!/usr/bin/env python3
"""Generate one image via the xAI Grok Imagine API (stdlib only).

Usage:
  export XAI_API_KEY=xai-...
  python3 scripts/xai-generate.py "your prompt" -o images/out.jpg
  python3 scripts/xai-generate.py "prompt" -o images/out.jpg --model grok-imagine-image-quality --aspect 16:9
  python3 scripts/xai-generate.py "prompt" -o images/out.jpg --model grok-imagine-image-2.0 \
      --resolution 2k --quality medium --response-format b64_json
  python3 scripts/xai-generate.py "prompt" -o images/out.jpg --retries 5 --json-log

Every segment of a cutaway at once: scripts/xai-batch.py (same flags, plus a manifest, and the
cutaway's own `generationDefaults`). Clips: `xai-batch.py --video`.

Models (team-dependent):
  grok-imagine-image          cheapest ($0.02 / image per the xAI docs)
  grok-imagine-image-2.0      newer generation ($0.04 / image per the xAI docs); only one with --quality
  grok-imagine-image-quality  default

--aspect takes any ratio the API documents (1:1, 16:9, 9:16, 4:3, 3:4, ... or auto);
--resolution 1k / 1.5k / 2k; --quality low / medium / auto (grok-imagine-image-2.0 only);
--response-format url (default; downloaded for you) or b64_json (returned inline, nothing to
download). Unset options are not sent, so the API applies its own defaults. The allowed values are
listed in scripts/xai-api-spec.json.
--n N asks for N images (1-10): saved as out.jpg, out-2.jpg, ...
--retries N retries 429 / 5xx / network errors with exponential backoff (default 3).
--json-log [PATH] appends one JSON line per call (model, aspect, prompt hash, usage, cost) to
PATH, default docs/generation-log.jsonl. The prompt text and the key are never logged.

Never commit API keys. Prefer env XAI_API_KEY.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import xai_api
from xai_api import ApiError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="xAI Grok Imagine image generation")
    parser.add_argument("prompt", help="Text prompt")
    parser.add_argument("-o", "--output", required=True, help="Output image path")
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
        help=f"Aspect ratio (default {xai_api.DEFAULT_ASPECT}; one of: {', '.join(xai_api.ASPECT_RATIOS)})",
    )
    parser.add_argument(
        "--resolution",
        choices=xai_api.IMAGE_RESOLUTIONS,
        help="Image resolution (not sent when omitted)",
    )
    parser.add_argument(
        "--quality",
        choices=xai_api.IMAGE_QUALITIES,
        help=f"Quality (only on {', '.join(xai_api.QUALITY_MODELS)}; not sent when omitted)",
    )
    parser.add_argument(
        "--response-format",
        choices=xai_api.RESPONSE_FORMATS,
        help="url (default: the image is downloaded) or b64_json (returned inline)",
    )
    parser.add_argument(
        "--n",
        type=int,
        default=1,
        metavar="N",
        help=f"Images per request, 1-{xai_api.MAX_IMAGES} (default 1); extras are saved as <name>-2.<ext>, ...",
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
        help="Append a JSON line per call to PATH (default docs/generation-log.jsonl in the repo)",
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("XAI_API_KEY", ""),
        help="Or set XAI_API_KEY env var",
    )
    return parser


def numbered(dest: Path, index: int) -> Path:
    """`out.jpg` for the first image, `out-2.jpg`, `out-3.jpg`, ... for the rest."""
    return dest if index == 0 else dest.with_name(f"{dest.stem}-{index + 1}{dest.suffix}")


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.retries < 0:
        print("ERROR: --retries must be >= 0", file=sys.stderr)
        return 2
    if not 1 <= args.n <= xai_api.MAX_IMAGES:
        print(f"ERROR: --n must be 1-{xai_api.MAX_IMAGES}", file=sys.stderr)
        return 2
    problem = xai_api.quality_problem(args.model, args.quality)
    if problem:
        print(f"ERROR: {problem}", file=sys.stderr)
        return 2

    api_key = xai_api.require_api_key(args.api_key)
    if api_key is None:
        return 2

    log_record = {
        "ts": xai_api.utc_now(),
        "tool": "xai-generate",
        "model": args.model,
        "aspect": args.aspect,
        **{
            key: value
            for key, value in (
                ("resolution", args.resolution),
                ("quality", args.quality),
                ("responseFormat", args.response_format),
                ("n", args.n if args.n != 1 else None),
            )
            if value
        },
        "promptSha256": xai_api.prompt_hash(args.prompt),
        "path": args.output,
    }
    started = time.monotonic()
    dest = Path(args.output)

    def log(message: str) -> None:
        print(message, file=sys.stderr)

    try:
        generation = xai_api.generate(
            args.prompt,
            model=args.model,
            aspect_ratio=args.aspect,
            api_key=api_key,
            n=args.n,
            resolution=args.resolution,
            quality=args.quality,
            response_format=args.response_format,
            retries=args.retries,
            log=log,
        )
        written: list[tuple[Path, int]] = []
        download_attempts = 0
        for index, image in enumerate(generation.images):
            data, attempts = xai_api.image_bytes(image, retries=args.retries, log=log)
            download_attempts += attempts
            target = numbered(dest, index)
            xai_api.write_atomic(target, data)
            written.append((target, len(data)))
    except ApiError as exc:
        print(f"API error: {exc}", file=sys.stderr)
        if args.json_log:
            xai_api.append_jsonl(
                Path(args.json_log),
                {
                    **log_record,
                    "ok": False,
                    "error": str(exc)[:300],
                    "status": exc.status,
                    "attempts": exc.attempts,
                    "elapsedSec": round(time.monotonic() - started, 2),
                },
            )
        return 1

    for target, size in written:
        print(f"Wrote {target} ({size} bytes)")
    if generation.usage:
        print(f"usage: {generation.usage}")
    if args.json_log:
        xai_api.append_jsonl(
            Path(args.json_log),
            {
                **log_record,
                "ok": True,
                "bytes": sum(size for _, size in written),
                "attempts": generation.attempts,
                "downloadAttempts": download_attempts,
                "elapsedSec": round(time.monotonic() - started, 2),
                "usage": generation.usage,
                "costUsd": xai_api.cost_usd(generation.usage),
            },
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
