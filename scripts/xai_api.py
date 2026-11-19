"""Shared xAI Grok Imagine client pieces (stdlib only).

Used by `xai-generate.py` (one image) and `xai-batch.py` (every segment of a cutaway).
Nothing here reads the environment or touches the network at import time, and no key is
ever written to a log, a manifest or an error message.

Models (team-dependent; the server is the authority, so `--model` is not validated here):
  grok-imagine-image          cheapest ($0.02 / image per the xAI docs)
  grok-imagine-image-2.0      newer generation ($0.04 / image per the xAI docs)
  grok-imagine-image-quality  the house default for stills

Aspect ratios accepted by the API (docs.x.ai, POST /v1/images/generations):
  1:1 3:4 4:3 9:16 16:9 2:3 3:2 9:19.5 19.5:9 9:20 20:9 1:2 2:1 21:9 5:2 auto

Cost: every successful response carries `usage.cost_in_usd_ticks` (10,000,000,000 ticks = $1).
`--json-log` appends it to `docs/generation-log.jsonl` as `costUsd`.
"""

from __future__ import annotations

import hashlib
import http.client
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, TypeVar

API_URL = "https://api.x.ai/v1/images/generations"
UA = "Mozilla/5.0 (compatible; weeks-on-fire/1.0)"

DEFAULT_MODEL = "grok-imagine-image-quality"
DEFAULT_ASPECT = "16:9"
ASPECT_RATIOS = (
    "1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "9:19.5", "19.5:9",
    "9:20", "20:9", "1:2", "2:1", "21:9", "5:2", "auto",
)  # fmt: skip

DEFAULT_RETRIES = 3
BACKOFF_BASE_SEC = 2.0
BACKOFF_CAP_SEC = 60.0
RETRY_AFTER_CAP_SEC = 120.0
TICKS_PER_USD = 10_000_000_000

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LOG = REPO_ROOT / "docs" / "generation-log.jsonl"

T = TypeVar("T")


class ApiError(Exception):
    """A failed API or download call, after retries.

    `fatal` marks errors that every later request in a batch would hit too (bad key, no
    credits), so a batch should stop instead of failing the same way N more times.
    """

    def __init__(
        self,
        message: str,
        *,
        status: int | None = None,
        retryable: bool = False,
        fatal: bool = False,
        attempts: int = 1,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.retryable = retryable
        self.fatal = fatal
        self.attempts = attempts


@dataclass
class Generation:
    url: str
    usage: dict[str, Any] = field(default_factory=dict)
    attempts: int = 1


def is_retryable_status(status: int) -> bool:
    return status == 429 or 500 <= status <= 599


def backoff_delay(
    attempt: int,
    retry_after: float | None = None,
    *,
    base: float = BACKOFF_BASE_SEC,
    cap: float = BACKOFF_CAP_SEC,
    rng: Callable[[], float] = random.random,
) -> float:
    """Seconds to wait before retry number `attempt + 1` (attempt is 0-based).

    Exponential (base * 2^attempt, capped) plus up to 25% jitter. A server `Retry-After`
    wins when it asks for longer, up to RETRY_AFTER_CAP_SEC.
    """
    delay = min(cap, base * (2**attempt))
    delay += delay * 0.25 * rng()
    if retry_after is not None and retry_after > delay:
        delay = min(retry_after, RETRY_AFTER_CAP_SEC)
    return delay


def _parse_retry_after(value: str | None) -> float | None:
    if not value:
        return None
    try:
        seconds = float(value)
    except ValueError:
        return None  # HTTP-date form: not worth a parser, fall back to our own backoff
    return seconds if seconds >= 0 else None


def call_with_retries(
    fn: Callable[[], T],
    *,
    retries: int,
    what: str = "request",
    sleep: Callable[[float], None] | None = None,
    rng: Callable[[], float] = random.random,
    log: Callable[[str], None] | None = None,
) -> tuple[T, int]:
    """Run `fn`, retrying 429 / 5xx / network errors up to `retries` extra times.

    Returns `(result, attempts)`. Raises ApiError with `.attempts` set when it gives up.
    401 / 403 and other 4xx are never retried; 401 / 403 are marked `fatal`.
    """
    attempt = 0
    while True:
        retry_after: float | None = None
        try:
            return fn(), attempt + 1
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")[:600]
            retry_after = _parse_retry_after(exc.headers.get("Retry-After") if exc.headers else None)
            error = ApiError(
                f"{what}: HTTP {exc.code}: {body}",
                status=exc.code,
                retryable=is_retryable_status(exc.code),
                fatal=exc.code in (401, 403),
            )
        except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.HTTPException) as exc:
            reason = getattr(exc, "reason", exc)
            error = ApiError(f"{what}: network error: {reason}", retryable=True)

        error.attempts = attempt + 1
        if not error.retryable or attempt >= retries:
            raise error
        delay = backoff_delay(attempt, retry_after, rng=rng)
        if log:
            log(f"  {error} - retry {attempt + 1}/{retries} in {delay:.1f}s")
        (sleep or time.sleep)(delay)
        attempt += 1


def generate(
    prompt: str,
    *,
    model: str,
    aspect_ratio: str,
    api_key: str,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> Generation:
    """One image. Returns the temporary image URL plus the response's `usage` block."""
    payload = {
        "model": model,
        "prompt": prompt,
        "n": 1,
        "aspect_ratio": aspect_ratio,
    }
    body = json.dumps(payload).encode()

    def call() -> dict[str, Any]:
        req = urllib.request.Request(
            API_URL,
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": UA,
                "Accept": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read().decode(errors="replace")
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            # A 200 with a non-JSON body is a flaky proxy or edge, not a bad request: retry it.
            raise http.client.HTTPException(f"response was not JSON ({exc.msg}): {raw[:120]!r}") from exc

    result, attempts = call_with_retries(call, retries=retries, what="generate", sleep=sleep, log=log)
    items = result.get("data") or []
    url = items[0].get("url") if items and isinstance(items[0], dict) else None
    if not url:
        raise ApiError(f"generate: unexpected response: {result!r}"[:500], attempts=attempts)
    usage = result.get("usage")
    return Generation(url=url, usage=usage if isinstance(usage, dict) else {}, attempts=attempts)


def fetch(
    url: str,
    *,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> tuple[bytes, int]:
    """Download the generated image. Returns `(bytes, attempts)`."""

    def call() -> bytes:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.read()

    return call_with_retries(call, retries=retries, what="download", sleep=sleep, log=log)


def sniff_extension(data: bytes) -> str | None:
    """File extension from magic bytes, so the name never lies about the format."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def write_atomic(dest: Path, data: bytes) -> None:
    """Write via a temp file so an interrupted run never leaves a truncated image behind
    (a resume would treat it as finished)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(dest.name + ".part")
    tmp.write_bytes(data)
    os.replace(tmp, dest)


def prompt_hash(prompt: str) -> str:
    return hashlib.sha256(prompt.strip().encode("utf-8")).hexdigest()


def cost_usd(usage: dict[str, Any]) -> float | None:
    ticks = usage.get("cost_in_usd_ticks")
    if isinstance(ticks, bool) or not isinstance(ticks, (int, float)):
        return None
    return round(ticks / TICKS_PER_USD, 6)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def append_jsonl(path: Path, record: dict[str, Any]) -> None:
    """Append one JSON object as one line (single write, so concurrent runs don't interleave)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(record, ensure_ascii=False) + "\n"
    with path.open("a", encoding="utf-8") as handle:
        handle.write(line)


def require_api_key(cli_value: str) -> str | None:
    """The key from `--api-key` / `XAI_API_KEY`, or None after printing the standard error."""
    if cli_value:
        return cli_value
    print("ERROR: set XAI_API_KEY or pass --api-key", file=sys.stderr)
    return None
