#!/usr/bin/env python3
"""Generate one image via the xAI Grok Imagine API (stdlib only).

Usage:
  export XAI_API_KEY=xai-...
  python3 scripts/xai-generate.py "your prompt" -o images/out.jpg
  python3 scripts/xai-generate.py "prompt" -o images/out.jpg --model grok-imagine-image-quality --aspect 16:9
  python3 scripts/xai-generate.py "prompt" -o images/out.jpg --retries 5 --json-log

Every segment of a cutaway at once: scripts/xai-batch.py (same flags, plus a manifest).

Models (team-dependent):
  grok-imagine-image          cheapest ($0.02 / image per the xAI docs)
  grok-imagine-image-2.0      newer generation ($0.04 / image per the xAI docs)
  grok-imagine-image-quality  default

--aspect takes any ratio the API documents (1:1, 16:9, 9:16, 4:3, 3:4, ... or auto).
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


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.retries < 0:
        print("ERROR: --retries must be >= 0", file=sys.stderr)
        return 2

    api_key = xai_api.require_api_key(args.api_key)
    if api_key is None:
        return 2

    log_record = {
        "ts": xai_api.utc_now(),
        "tool": "xai-generate",
        "model": args.model,
        "aspect": args.aspect,
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
            retries=args.retries,
            log=log,
        )
        data, download_attempts = xai_api.fetch(generation.url, retries=args.retries, log=log)
        xai_api.write_atomic(dest, data)
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

    print(f"Wrote {dest} ({len(data)} bytes)")
    if generation.usage:
        print(f"usage: {generation.usage}")
    if args.json_log:
        xai_api.append_jsonl(
            Path(args.json_log),
            {
                **log_record,
                "ok": True,
                "bytes": len(data),
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
