"""Shared xAI Grok Imagine client pieces (stdlib only).

Used by `xai-generate.py` (one image) and `xai-batch.py` (every segment of a cutaway, as stills or,
with `--video`, as clips). Nothing here reads the environment or touches the network at import
time, and no key is ever written to a log, a manifest or an error message.

The request values the API accepts (aspect ratios, resolutions, quality, response format, clip
length, ...) live in `scripts/xai-api-spec.json`, which the cutaway `generationDefaults` schema in
`scripts/content-index/generation.ts` reads too, so the CLIs and the content can never disagree.
Model ids are not enumerated there: the server is the authority, so `--model` is not validated.

Image models (team-dependent):
  grok-imagine-image          cheapest ($0.02 / image per the xAI docs)
  grok-imagine-image-2.0      newer generation ($0.04 / image); the only one that takes `quality`
  grok-imagine-image-quality  the house default for stills

Images are one synchronous call (POST /v1/images/generations). Video is asynchronous: POST
/v1/videos/generations returns a `request_id`, then GET /v1/videos/{request_id} is polled until its
`status` is `done` (carrying `video.url`), `failed` or `expired`; `pending` means keep waiting.
Generated URLs are temporary, so they are downloaded straight away.

Cost: every successful response carries `usage.cost_in_usd_ticks` (10,000,000,000 ticks = $1).
`--json-log` appends it to `docs/generation-log.jsonl` as `costUsd`.
"""

from __future__ import annotations

import base64
import binascii
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
VIDEO_API_URL = "https://api.x.ai/v1/videos/generations"
VIDEO_STATUS_URL = "https://api.x.ai/v1/videos"  # GET <this>/<request_id>
UA = "Mozilla/5.0 (compatible; weeks-on-fire/1.0)"

SPEC_PATH = Path(__file__).resolve().with_name("xai-api-spec.json")
SPEC: dict[str, Any] = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
_IMAGE, _VIDEO = SPEC["image"], SPEC["video"]

DEFAULT_MODEL: str = _IMAGE["defaultModel"]
DEFAULT_ASPECT: str = _IMAGE["defaultAspectRatio"]
ASPECT_RATIOS: tuple[str, ...] = tuple(_IMAGE["aspectRatios"])
IMAGE_RESOLUTIONS: tuple[str, ...] = tuple(_IMAGE["resolutions"])
IMAGE_QUALITIES: tuple[str, ...] = tuple(_IMAGE["qualities"])
QUALITY_MODELS: tuple[str, ...] = tuple(_IMAGE["qualityModels"])
RESPONSE_FORMATS: tuple[str, ...] = tuple(_IMAGE["responseFormats"])
MAX_IMAGES: int = _IMAGE["maxCount"]

DEFAULT_VIDEO_MODEL: str = _VIDEO["defaultModel"]
DEFAULT_VIDEO_ASPECT: str = _VIDEO["defaultAspectRatio"]
VIDEO_ASPECT_RATIOS: tuple[str, ...] = tuple(_VIDEO["aspectRatios"])
VIDEO_RESOLUTIONS: tuple[str, ...] = tuple(_VIDEO["resolutions"])
VIDEO_MIN_SEC: int = _VIDEO["minDurationSec"]
VIDEO_MAX_SEC: int = _VIDEO["maxDurationSec"]

DEFAULT_RETRIES = 3
BACKOFF_BASE_SEC = 2.0
BACKOFF_CAP_SEC = 60.0
RETRY_AFTER_CAP_SEC = 120.0
VIDEO_POLL_INTERVAL_SEC = 5.0
VIDEO_POLL_TIMEOUT_SEC = 900.0
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


class VideoGone(ApiError):
    """A video request that will never finish: `failed`, `expired`, or unknown (404). Unlike a
    timeout or a network error, the request id is worthless afterwards, so a batch forgets it and
    the next run submits afresh."""


@dataclass
class GeneratedImage:
    """One image from a response: a temporary `url`, or inline `b64` when `response_format` is
    `b64_json`."""

    url: str | None = None
    b64: str | None = None


@dataclass
class Generation:
    images: list[GeneratedImage]
    usage: dict[str, Any] = field(default_factory=dict)
    attempts: int = 1

    @property
    def url(self) -> str:
        """The first image's URL ('' for an inline `b64_json` image)."""
        return (self.images[0].url if self.images else None) or ""


@dataclass
class VideoResult:
    request_id: str
    url: str
    duration: float | None = None
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


def image_payload(
    prompt: str,
    *,
    model: str,
    aspect_ratio: str,
    n: int = 1,
    resolution: str | None = None,
    quality: str | None = None,
    response_format: str | None = None,
) -> dict[str, Any]:
    """The JSON body for POST /v1/images/generations. Optional fields are left out when unset, so
    the API applies its own defaults (and a model that rejects `quality` never sees the key)."""
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "n": n,
        "aspect_ratio": aspect_ratio,
    }
    if resolution:
        payload["resolution"] = resolution
    if quality:
        payload["quality"] = quality
    if response_format:
        payload["response_format"] = response_format
    return payload


def quality_problem(model: str, quality: str | None) -> str | None:
    """`quality` is only accepted by some models (see QUALITY_MODELS). Checked before any request so
    a batch never spends a call, or a credit, finding that out one segment at a time."""
    if quality and model not in QUALITY_MODELS:
        return (
            f"--quality {quality} is only supported on {', '.join(QUALITY_MODELS)}, not {model}. "
            "Use --model grok-imagine-image-2.0, or drop --quality."
        )
    return None


def video_payload(
    prompt: str,
    *,
    model: str,
    aspect_ratio: str,
    resolution: str | None = None,
    duration: int | None = None,
) -> dict[str, Any]:
    """The JSON body for POST /v1/videos/generations (text-to-video). Unset fields are omitted."""
    payload: dict[str, Any] = {"model": model, "prompt": prompt, "aspect_ratio": aspect_ratio}
    if resolution:
        payload["resolution"] = resolution
    if duration is not None:
        payload["duration"] = duration
    return payload


def _json_request(
    url: str,
    *,
    api_key: str,
    payload: dict[str, Any] | None = None,
    timeout: float = 180,
) -> dict[str, Any]:
    """POST `payload` (or GET when None) and decode the JSON reply."""
    headers = {"Authorization": f"Bearer {api_key}", "User-Agent": UA, "Accept": "application/json"}
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST" if body else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode(errors="replace")
    try:
        result = json.loads(raw)
    except json.JSONDecodeError as exc:
        # A 200 with a non-JSON body is a flaky proxy or edge, not a bad request: retry it.
        raise http.client.HTTPException(f"response was not JSON ({exc.msg}): {raw[:120]!r}") from exc
    if not isinstance(result, dict):
        raise http.client.HTTPException(f"response was not a JSON object: {raw[:120]!r}")
    return result


def _usage(result: dict[str, Any]) -> dict[str, Any]:
    usage = result.get("usage")
    return usage if isinstance(usage, dict) else {}


def generate(
    prompt: str,
    *,
    model: str,
    aspect_ratio: str,
    api_key: str,
    n: int = 1,
    resolution: str | None = None,
    quality: str | None = None,
    response_format: str | None = None,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> Generation:
    """`n` images in one request. Returns each as a temporary URL (or inline base64 for
    `response_format="b64_json"`) plus the response's `usage` block."""
    payload = image_payload(
        prompt,
        model=model,
        aspect_ratio=aspect_ratio,
        n=n,
        resolution=resolution,
        quality=quality,
        response_format=response_format,
    )
    result, attempts = call_with_retries(
        lambda: _json_request(API_URL, api_key=api_key, payload=payload),
        retries=retries,
        what="generate",
        sleep=sleep,
        log=log,
    )
    images = [
        GeneratedImage(url=item.get("url") or None, b64=item.get("b64_json") or None)
        for item in (result.get("data") or [])
        if isinstance(item, dict) and (item.get("url") or item.get("b64_json"))
    ]
    if not images:
        raise ApiError(f"generate: unexpected response: {result!r}"[:500], attempts=attempts)
    return Generation(images=images, usage=_usage(result), attempts=attempts)


def fetch(
    url: str,
    *,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> tuple[bytes, int]:
    """Download a generated file (image or video). Returns `(bytes, attempts)`."""

    def call() -> bytes:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.read()

    return call_with_retries(call, retries=retries, what="download", sleep=sleep, log=log)


def image_bytes(
    image: GeneratedImage,
    *,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> tuple[bytes, int]:
    """The image's bytes: decoded in place for `b64_json`, else downloaded. Returns
    `(bytes, download_attempts)`; an inline image needs no download, so that is 0."""
    if image.b64:
        try:
            return base64.b64decode(image.b64, validate=False), 0
        except (binascii.Error, ValueError) as exc:
            raise ApiError(f"generate: b64_json image did not decode: {exc}") from exc
    if not image.url:
        raise ApiError("generate: image has neither a url nor b64_json")
    return fetch(image.url, retries=retries, sleep=sleep, log=log)


def submit_video(
    payload: dict[str, Any],
    *,
    api_key: str,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> tuple[str, int]:
    """Start one video. Returns `(request_id, attempts)`; the work happens on xAI's side, so poll
    it with `poll_video`.

    Retries follow `retries` like every other call. Note the cost of that: a timeout or 5xx that
    arrives *after* xAI accepted the job is retried as a fresh submit, i.e. a second paid video that
    nothing will ever poll. Pass `retries=0` where that matters more than a flaky network."""
    result, attempts = call_with_retries(
        lambda: _json_request(VIDEO_API_URL, api_key=api_key, payload=payload),
        retries=retries,
        what="video submit",
        sleep=sleep,
        log=log,
    )
    request_id = result.get("request_id")
    if not isinstance(request_id, str) or not request_id:
        raise ApiError(f"video submit: no request_id in response: {result!r}"[:500], attempts=attempts)
    return request_id, attempts


def check_video(
    request_id: str,
    *,
    api_key: str,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    log: Callable[[str], None] | None = None,
) -> VideoResult | None:
    """One look at GET /v1/videos/{request_id}: the finished video, or None while it is `pending`.

    `failed` / `expired` (and a 404, which means the same) raise VideoGone.
    """
    request_url = f"{VIDEO_STATUS_URL}/{request_id}"
    try:
        result, attempts = call_with_retries(
            lambda: _json_request(request_url, api_key=api_key, timeout=60),
            retries=retries,
            what=f"video poll {request_id}",
            sleep=sleep,
            log=log,
        )
    except ApiError as exc:
        if exc.status == 404:
            raise VideoGone(str(exc), status=404, attempts=exc.attempts) from exc
        raise
    status = result.get("status")
    if status == "done":
        video = result.get("video") if isinstance(result.get("video"), dict) else {}
        video_url = video.get("url")
        if not video_url:
            raise ApiError(
                f"video {request_id} is done but has no URL (it may have been moderated): {result!r}"[:500]
            )
        duration = video.get("duration")
        return VideoResult(
            request_id=request_id,
            url=video_url,
            duration=duration if isinstance(duration, (int, float)) else None,
            usage=_usage(result),
            attempts=attempts,
        )
    if status in ("failed", "expired"):
        raise VideoGone(f"video {request_id} {status}")
    return None  # `pending` (or anything not final yet): look again later


def poll_video(
    request_id: str,
    *,
    api_key: str,
    interval: float = VIDEO_POLL_INTERVAL_SEC,
    timeout: float = VIDEO_POLL_TIMEOUT_SEC,
    retries: int = 0,
    sleep: Callable[[float], None] | None = None,
    clock: Callable[[], float] = time.monotonic,
    log: Callable[[str], None] | None = None,
) -> VideoResult:
    """Poll one video until it is `done`. Running past `timeout` raises an ApiError that names the
    request id, so the job is not lost (the batch runner records it and the next run keeps polling
    the same id instead of paying for a new video)."""
    deadline = clock() + timeout
    while True:
        result = check_video(request_id, api_key=api_key, retries=retries, sleep=sleep, log=log)
        if result is not None:
            return result
        if clock() >= deadline:
            raise ApiError(
                f"video {request_id} still pending after {timeout:.0f}s; re-run to keep polling the same request"
            )
        (sleep or time.sleep)(interval)


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
