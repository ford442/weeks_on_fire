"""Tests for scripts/xai_api.py, scripts/xai-generate.py and scripts/xai-batch.py.

Stdlib only. Run from the repo root:  python3 -m unittest discover -s scripts/tests -v

The HTTP tests talk to a throwaway local server that stands in for api.x.ai (the module's
API_URL is pointed at it), so retries, headers, payloads and downloads go through the real
urllib code path. Nothing here needs a key or the network.
"""

from __future__ import annotations

import base64
import importlib.util
import io
import json
import sys
import tempfile
import threading
import unittest
import urllib.error
from contextlib import redirect_stderr, redirect_stdout
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parent.parent
REPO = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))

import xai_api  # noqa: E402


def load_script(filename: str, name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module  # @dataclass resolves string annotations through sys.modules
    spec.loader.exec_module(module)
    return module


batch = load_script("xai-batch.py", "xai_batch")
generate_cli = load_script("xai-generate.py", "xai_generate")

MP4 = b"\x00\x00\x00\x18ftypmp42" + b"mp4-bytes" * 8
JPEG = b"\xff\xd8\xff\xe0" + b"jpeg-bytes" * 8
PNG = b"\x89PNG\r\n\x1a\n" + b"png-bytes" * 8
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"webp" * 8


class FakeXai:
    """A local stand-in for api.x.ai. `script` is a list of (status, headers) for POSTs (image or
    video), consumed in order; once it runs out every request succeeds.

    Images come back as URLs (or inline base64 when the request asks for `b64_json`), `n` at a time.
    Videos: a POST to /v1/videos/generations returns `req-1`, `req-2`, ...; each GET of
    /v1/videos/<id> pops the next reply from `video_polls[<id>]` and, once that is empty, says
    `done` with a downloadable clip."""

    def __init__(self) -> None:
        self.script: list[tuple[int, dict[str, str]]] = []
        self.video_polls: dict[str, list[tuple[int, dict]]] = {}
        self.video_requests: list[dict] = []
        self.polls: list[str] = []
        self.downloads: list[str] = []
        self.requests: list[dict] = []
        self.auth_headers: list[str] = []
        self.image = JPEG
        self.cost_ticks: int | None = 400_000_000
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):  # silence
                pass

            def reply_json(self, status: int, reply: dict) -> None:
                payload = json.dumps(reply).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def do_POST(self):
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length) or b"{}")
                is_video = self.path.startswith("/v1/videos")
                (owner.video_requests if is_video else owner.requests).append(body)
                owner.auth_headers.append(self.headers.get("Authorization", ""))
                status, headers = owner.script.pop(0) if owner.script else (200, {})
                if status != 200:
                    payload = json.dumps({"error": f"scripted {status}"}).encode()
                    self.send_response(status)
                    for key, value in headers.items():
                        self.send_header(key, value)
                    self.send_header("Content-Length", str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
                    return
                if is_video:
                    self.reply_json(200, {"request_id": f"req-{len(owner.video_requests)}"})
                    return
                if body.get("response_format") == "b64_json":
                    items = [{"b64_json": base64.b64encode(owner.image).decode()} for _ in range(body.get("n", 1))]
                else:
                    items = [
                        {"url": f"http://127.0.0.1:{owner.port}/img/{len(owner.requests)}-{k}"}
                        for k in range(body.get("n", 1))
                    ]
                reply: dict = {"data": items}
                if owner.cost_ticks is not None:
                    reply["usage"] = {"cost_in_usd_ticks": owner.cost_ticks}
                payload = json.dumps(reply).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def do_GET(self):
                if self.path.startswith("/v1/videos/"):
                    request_id = self.path.rsplit("/", 1)[1]
                    owner.polls.append(request_id)
                    queue = owner.video_polls.get(request_id, [])
                    if queue:
                        status, reply = queue.pop(0)
                    else:
                        reply = {
                            "status": "done",
                            "video": {"url": f"http://127.0.0.1:{owner.port}/vid/{request_id}", "duration": 6},
                            "usage": {"cost_in_usd_ticks": 3_000_000_000},
                        }
                        status = 200
                    self.reply_json(status, reply)
                    return
                owner.downloads.append(self.path)
                data = MP4 if self.path.startswith("/vid/") else owner.image
                self.send_response(200)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)

    def __enter__(self) -> "FakeXai":
        self.thread.start()
        base = f"http://127.0.0.1:{self.port}/v1"
        self._patches = [
            mock.patch.object(xai_api, "API_URL", f"{base}/images/generations"),
            mock.patch.object(xai_api, "VIDEO_API_URL", f"{base}/videos/generations"),
            mock.patch.object(xai_api, "VIDEO_STATUS_URL", f"{base}/videos"),
        ]
        for patch in self._patches:
            patch.start()
        return self

    def __exit__(self, *exc) -> None:
        for patch in self._patches:
            patch.stop()
        self.server.shutdown()
        self.server.server_close()


class BackoffTests(unittest.TestCase):
    def test_exponential_with_cap(self):
        no_jitter = lambda: 0.0  # noqa: E731
        delays = [xai_api.backoff_delay(n, rng=no_jitter) for n in range(7)]
        self.assertEqual(delays, [2.0, 4.0, 8.0, 16.0, 32.0, 60.0, 60.0])

    def test_jitter_adds_at_most_a_quarter(self):
        self.assertEqual(xai_api.backoff_delay(0, rng=lambda: 1.0), 2.5)

    def test_retry_after_wins_when_longer_but_is_capped(self):
        no_jitter = lambda: 0.0  # noqa: E731
        self.assertEqual(xai_api.backoff_delay(0, 30, rng=no_jitter), 30)
        self.assertEqual(xai_api.backoff_delay(3, 1, rng=no_jitter), 16.0)
        self.assertEqual(xai_api.backoff_delay(0, 9999, rng=no_jitter), xai_api.RETRY_AFTER_CAP_SEC)

    def test_retry_after_header_parsing(self):
        self.assertEqual(xai_api._parse_retry_after("7"), 7.0)
        self.assertIsNone(xai_api._parse_retry_after("Wed, 21 Oct 2026 07:28:00 GMT"))
        self.assertIsNone(xai_api._parse_retry_after(None))
        self.assertIsNone(xai_api._parse_retry_after("-3"))


class HelperTests(unittest.TestCase):
    def test_sniff_extension(self):
        self.assertEqual(xai_api.sniff_extension(JPEG), "jpg")
        self.assertEqual(xai_api.sniff_extension(PNG), "png")
        self.assertEqual(xai_api.sniff_extension(WEBP), "webp")
        self.assertIsNone(xai_api.sniff_extension(b"<html>"))

    def test_prompt_hash_is_stable_and_ignores_outer_whitespace(self):
        self.assertEqual(xai_api.prompt_hash("a cat"), xai_api.prompt_hash("  a cat\n"))
        self.assertNotEqual(xai_api.prompt_hash("a cat"), xai_api.prompt_hash("a dog"))
        self.assertEqual(len(xai_api.prompt_hash("a cat")), 64)

    def test_cost_usd(self):
        self.assertEqual(xai_api.cost_usd({"cost_in_usd_ticks": 400_000_000}), 0.04)
        self.assertIsNone(xai_api.cost_usd({}))
        self.assertIsNone(xai_api.cost_usd({"cost_in_usd_ticks": "4"}))
        self.assertIsNone(xai_api.cost_usd({"cost_in_usd_ticks": True}))

    def test_write_atomic_leaves_no_partial_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "nested" / "a.jpg"
            xai_api.write_atomic(dest, JPEG)
            self.assertEqual(dest.read_bytes(), JPEG)
            self.assertEqual([p.name for p in dest.parent.iterdir()], ["a.jpg"])

    def test_append_jsonl_appends_one_line_each(self):
        with tempfile.TemporaryDirectory() as tmp:
            log = Path(tmp) / "docs" / "log.jsonl"
            xai_api.append_jsonl(log, {"a": 1})
            xai_api.append_jsonl(log, {"b": "é"})
            lines = log.read_text(encoding="utf-8").splitlines()
            self.assertEqual([json.loads(line) for line in lines], [{"a": 1}, {"b": "é"}])


class RetryTests(unittest.TestCase):
    def http_error(self, code: int, retry_after: str | None = None) -> urllib.error.HTTPError:
        headers = {"Retry-After": retry_after} if retry_after else {}
        return urllib.error.HTTPError("http://x", code, "err", headers, io.BytesIO(b"boom"))  # type: ignore[arg-type]

    def run_calls(self, outcomes: list, retries: int):
        sleeps: list[float] = []
        calls = iter(outcomes)

        def fn():
            outcome = next(calls)
            if isinstance(outcome, BaseException):
                raise outcome
            return outcome

        try:
            return xai_api.call_with_retries(
                fn, retries=retries, sleep=sleeps.append, rng=lambda: 0.0
            ), sleeps, None
        except xai_api.ApiError as exc:
            return None, sleeps, exc

    def test_retries_429_and_5xx_then_succeeds(self):
        result, sleeps, err = self.run_calls(
            [self.http_error(429), self.http_error(503), "ok"], retries=3
        )
        self.assertIsNone(err)
        self.assertEqual(result, ("ok", 3))
        self.assertEqual(sleeps, [2.0, 4.0])

    def test_honours_retry_after(self):
        _, sleeps, _ = self.run_calls([self.http_error(429, "30"), "ok"], retries=1)
        self.assertEqual(sleeps, [30.0])

    def test_gives_up_after_retries_and_reports_attempts(self):
        _, sleeps, err = self.run_calls([self.http_error(500)] * 3, retries=2)
        assert err is not None
        self.assertEqual(err.attempts, 3)
        self.assertEqual(err.status, 500)
        self.assertFalse(err.fatal)
        self.assertEqual(len(sleeps), 2)

    def test_client_errors_are_not_retried(self):
        _, sleeps, err = self.run_calls([self.http_error(400), "never"], retries=5)
        assert err is not None
        self.assertEqual((err.status, err.attempts, err.retryable, err.fatal), (400, 1, False, False))
        self.assertEqual(sleeps, [])

    def test_auth_errors_are_fatal_and_not_retried(self):
        for code in (401, 403):
            _, sleeps, err = self.run_calls([self.http_error(code)], retries=5)
            assert err is not None
            self.assertTrue(err.fatal)
            self.assertEqual(sleeps, [])

    def test_network_errors_are_retried(self):
        result, sleeps, err = self.run_calls(
            [urllib.error.URLError("reset"), TimeoutError("slow"), ConnectionResetError(), "ok"], retries=3
        )
        self.assertIsNone(err)
        self.assertEqual(result, ("ok", 4))
        self.assertEqual(len(sleeps), 3)

    def test_zero_retries_means_one_attempt(self):
        _, sleeps, err = self.run_calls([self.http_error(503), "never"], retries=0)
        assert err is not None
        self.assertEqual((err.attempts, sleeps), (1, []))


class GenerateHttpTests(unittest.TestCase):
    def test_sends_documented_payload_and_key_and_returns_usage(self):
        with FakeXai() as fake:
            gen = xai_api.generate("a cat", model="m1", aspect_ratio="9:16", api_key="secret-key")
            data, attempts = xai_api.fetch(gen.url)
        self.assertEqual(
            fake.requests, [{"model": "m1", "prompt": "a cat", "n": 1, "aspect_ratio": "9:16"}]
        )
        self.assertEqual(fake.auth_headers, ["Bearer secret-key"])
        self.assertEqual(gen.usage, {"cost_in_usd_ticks": 400_000_000})
        self.assertEqual((data, attempts), (JPEG, 1))

    def test_retries_429_through_real_http(self):
        with FakeXai() as fake, mock.patch("time.sleep") as sleep:
            fake.script = [(429, {"Retry-After": "1"}), (503, {})]
            gen = xai_api.generate("p", model="m", aspect_ratio="16:9", api_key="k", retries=3)
        self.assertEqual(gen.attempts, 3)
        self.assertEqual(len(fake.requests), 3)
        self.assertEqual(sleep.call_count, 2)

    def test_unexpected_shape_is_an_error(self):
        with FakeXai() as fake:
            fake.script = []
            with mock.patch.object(xai_api, "call_with_retries", return_value=({"data": []}, 1)):
                with self.assertRaises(xai_api.ApiError):
                    xai_api.generate("p", model="m", aspect_ratio="16:9", api_key="k")


class GenerateCliTests(unittest.TestCase):
    def run_cli(self, argv: list[str]) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = generate_cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_writes_image_and_log(self):
        with FakeXai() as fake, tempfile.TemporaryDirectory() as tmp:
            dest, log = Path(tmp) / "out.jpg", Path(tmp) / "log.jsonl"
            code, out, _ = self.run_cli(
                ["a cat", "-o", str(dest), "--api-key", "k", "--aspect", "1:1", "--json-log", str(log)]
            )
            self.assertEqual(code, 0)
            self.assertEqual(dest.read_bytes(), JPEG)
            self.assertEqual(fake.requests[0]["aspect_ratio"], "1:1")
            record = json.loads(log.read_text())
            self.assertTrue(record["ok"])
            self.assertEqual(record["costUsd"], 0.04)
            self.assertEqual(record["promptSha256"], xai_api.prompt_hash("a cat"))
            self.assertNotIn("a cat", log.read_text())  # hash only, never the prompt
            self.assertNotIn("k", record.get("apiKey", ""))

    def test_failure_is_logged_and_nonzero(self):
        with FakeXai() as fake, tempfile.TemporaryDirectory() as tmp:
            fake.script = [(400, {})]
            dest, log = Path(tmp) / "out.jpg", Path(tmp) / "log.jsonl"
            code, _, err = self.run_cli(
                ["x", "-o", str(dest), "--api-key", "k", "--retries", "0", "--json-log", str(log)]
            )
            self.assertEqual(code, 1)
            self.assertFalse(dest.exists())
            self.assertIn("HTTP 400", err)
            record = json.loads(log.read_text())
            self.assertFalse(record["ok"])
            self.assertEqual(record["status"], 400)

    def test_missing_key_and_bad_aspect(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            code, _, err = self.run_cli(["x", "-o", "/tmp/never.jpg", "--api-key", ""])
        self.assertEqual(code, 2)
        self.assertIn("XAI_API_KEY", err)
        with self.assertRaises(SystemExit), redirect_stderr(io.StringIO()):
            self.run_cli(["x", "-o", "/tmp/never.jpg", "--aspect", "7:5"])


# ----------------------------------------------------------------------------- batch fixtures

SEGMENT_MD = """# Demo

## A — Cold Open (0:00–0:06)

**Grok Imagine**
```
Prompt for A
```

## B — Middle (0:06–0:12)

**Grok Imagine**
```
Prompt for B
```

## C — Open Slot (0:12–0:18)

**Grok Imagine**
```
Prompt for C with [SIGHT] still unfilled
```

## D — No Still (0:18–0:24)

**Gemini Omni**
```
video only
```

## E — Registered (0:24–0:30)

**Grok Imagine**
```
Prompt for E
```
"""


def make_repo(root: Path) -> None:
    """A miniature repo: one cutaway whose catalog JSON mirrors what codegen would write."""
    (root / "prompts").mkdir()
    (root / "content" / "cutaways").mkdir(parents=True)
    (root / "public" / "catalog" / "cutaways").mkdir(parents=True)
    (root / "images").mkdir()
    (root / "prompts" / "demo-segments.md").write_text(SEGMENT_MD, encoding="utf-8")
    (root / "images" / "e-registered.jpg").write_bytes(JPEG)
    record = {
        "id": "mv-demo",
        "segmentsSource": "prompts/demo-segments.md",
        "segmentStills": {"mv-demo-e-registered": "images/e-registered.jpg"},
    }
    (root / "content" / "cutaways" / "mv-demo.json").write_text(json.dumps(record), encoding="utf-8")
    prompts = {"A": "Prompt for A", "B": "Prompt for B", "C": "Prompt for C with [SIGHT] still unfilled",
               "D": "", "E": "Prompt for E"}
    titles = {"A": "Cold Open", "B": "Middle", "C": "Open Slot", "D": "No Still", "E": "Registered"}
    segments = [
        {
            "id": f"mv-demo-{letter.lower()}-{titles[letter].lower().replace(' ', '-')}",
            "label": f"{letter} — {titles[letter]}",
            "start": "0:00",
            "end": "0:06",
            "grokImaginePrompt": prompt,
        }
        for letter, prompt in prompts.items()
    ]
    full = {"id": "mv-demo", "segments": segments}
    (root / "public" / "catalog" / "cutaways" / "mv-demo.json").write_text(json.dumps(full), encoding="utf-8")


A_ID, B_ID = "mv-demo-a-cold-open", "mv-demo-b-middle"


class BatchBase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.repo = Path(self._tmp.name).resolve()
        make_repo(self.repo)
        patcher = mock.patch.object(batch, "REPO_ROOT", self.repo)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.out = self.repo / "images" / "demo"

    def run_batch(self, *argv: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = batch.main([*argv])
        return code, out.getvalue(), err.getvalue()

    def manifest(self) -> dict:
        return json.loads((self.out / "manifest.json").read_text(encoding="utf-8"))

    def args(self, *flags: str):
        """The parsed CLI namespace `batch.plan` takes, as a real run would build it."""
        return batch.build_parser().parse_args(["mv-demo", *flags])


class BatchPlanTests(BatchBase):
    def test_resolves_by_path_and_by_id_to_the_same_segments(self):
        by_path = batch.load_cutaway(self.repo, "prompts/demo-segments.md")
        by_id = batch.load_cutaway(self.repo, "mv-demo")
        self.assertEqual([s.id for s in by_path.segments], [s.id for s in by_id.segments])
        self.assertEqual(by_path.segments[0].prompt, "Prompt for A")

    def test_unknown_targets_are_usage_errors(self):
        with self.assertRaisesRegex(batch.UsageError, "Did you mean: mv-demo"):
            batch.load_cutaway(self.repo, "mv-demos")
        with self.assertRaisesRegex(batch.UsageError, "standalone"):
            batch.load_cutaway(self.repo, "prompts/nothing-segments.md")

    def test_refuses_a_catalog_that_drifted_from_the_markdown(self):
        md = self.repo / "prompts" / "demo-segments.md"
        md.write_text(SEGMENT_MD.replace("Prompt for A", "Edited prompt for A"), encoding="utf-8")
        with self.assertRaisesRegex(batch.UsageError, "npm run codegen"):
            batch.load_cutaway(self.repo, "mv-demo")

    def test_statuses(self):
        cutaway = batch.load_cutaway(self.repo, "mv-demo")
        manifest = batch.load_manifest(self.out, cutaway)
        planned = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, self.args(), force=False)
        self.assertEqual(
            [p.status for p in planned],
            ["generate", "generate", "placeholder", "no-prompt", "registered"],
        )
        self.assertIn("[SIGHT]", planned[2].note)

    def test_existing_file_is_skipped_and_force_regenerates(self):
        cutaway = batch.load_cutaway(self.repo, "mv-demo")
        self.out.mkdir(parents=True)
        (self.out / f"{A_ID}.png").write_bytes(PNG)  # any image extension counts
        manifest = batch.load_manifest(self.out, cutaway)
        planned = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, self.args(), force=False)
        self.assertEqual(planned[0].status, "exists")
        forced = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, self.args(), force=True)
        self.assertEqual(forced[0].status, "generate")
        self.assertEqual(forced[4].status, "generate")  # force also reaches registered stills

    def test_only_accepts_letters_and_ids(self):
        cutaway = batch.load_cutaway(self.repo, "mv-demo")
        self.assertEqual([s.id for s in batch.select_only(cutaway, ["b"])], [B_ID])
        self.assertEqual([s.id for s in batch.select_only(cutaway, ["A,mv-demo-b-middle"])], [A_ID, B_ID])
        with self.assertRaisesRegex(batch.UsageError, "matched no segment for: z"):
            batch.select_only(cutaway, ["Z"])

    def test_default_out_dir_comes_from_the_prompts_file_name(self):
        cutaway = batch.load_cutaway(self.repo, "mv-demo")
        self.assertEqual(batch.default_out_dir(self.repo, cutaway), self.repo / "images" / "demo")


class BatchDryRunTests(BatchBase):
    def test_lists_prompts_without_api_calls_or_files(self):
        with mock.patch.object(xai_api, "generate", side_effect=AssertionError("API called")), \
             mock.patch.object(xai_api, "fetch", side_effect=AssertionError("API called")):
            code, out, _ = self.run_batch("mv-demo", "--dry-run", "--api-key", "")
        self.assertEqual(code, 0)
        self.assertIn("DRY RUN", out)
        self.assertIn("Prompt for A", out)
        self.assertIn("Prompt for B", out)
        self.assertIn("SKIP (placeholder)", out)
        self.assertIn("2 to generate, 3 skipped", out)
        self.assertFalse(self.out.exists())  # nothing written, not even the folder

    def test_dry_run_needs_no_key(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            code, _, err = self.run_batch("mv-demo", "--dry-run")
        self.assertEqual((code, err), (0, ""))


class BatchRunTests(BatchBase):
    def test_generates_all_segments_and_writes_a_valid_manifest(self):
        with FakeXai() as fake:
            code, out, _ = self.run_batch("prompts/demo-segments.md", "--api-key", "k", "--retries", "0")
        self.assertEqual(code, 0, out)
        self.assertEqual([r["prompt"] for r in fake.requests], ["Prompt for A", "Prompt for B"])
        self.assertTrue(all(r["aspect_ratio"] == "16:9" for r in fake.requests))

        manifest = self.manifest()
        self.assertEqual(manifest["cutawayId"], "mv-demo")
        self.assertEqual(manifest["source"], "prompts/demo-segments.md")
        # ids in the manifest are exactly the site's segment ids
        catalog = json.loads((self.repo / "public/catalog/cutaways/mv-demo.json").read_text())
        site_ids = {s["id"] for s in catalog["segments"]}
        self.assertEqual(set(manifest["segments"]), {A_ID, B_ID})
        self.assertTrue(set(manifest["segments"]) <= site_ids)
        entry = manifest["segments"][A_ID]
        self.assertEqual(entry["path"], f"images/demo/{A_ID}.jpg")  # repo-relative, POSIX
        self.assertEqual(entry["promptSha256"], xai_api.prompt_hash("Prompt for A"))
        self.assertEqual((entry["model"], entry["aspect"]), ("grok-imagine-image-quality", "16:9"))
        self.assertEqual((self.repo / entry["path"]).read_bytes(), JPEG)
        self.assertIn('"segmentStills"', out)  # the paste-in block for content/cutaways/*.json
        self.assertIn(f'"{A_ID}": "images/demo/{A_ID}.jpg"', out)
        self.assertIn('"mv-demo-e-registered": "images/e-registered.jpg"', out)  # merged, not lost

    def test_resume_skips_finished_and_makes_no_requests(self):
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k")
            self.assertEqual(len(fake.requests), 2)
            code, out, _ = self.run_batch("mv-demo", "--api-key", "k")
        self.assertEqual(code, 0)
        self.assertEqual(len(fake.requests), 2)
        self.assertIn("Nothing to generate", out)

    def test_resume_after_a_partial_run_only_does_the_rest(self):
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
            self.assertEqual(len(fake.requests), 1)
            self.run_batch("mv-demo", "--api-key", "k")
        self.assertEqual([r["prompt"] for r in fake.requests], ["Prompt for A", "Prompt for B"])
        self.assertEqual(set(self.manifest()["segments"]), {A_ID, B_ID})

    def test_force_regenerates_and_replaces_a_twin_in_another_format(self):
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
            fake.image = PNG
            code, _, _ = self.run_batch("mv-demo", "--api-key", "k", "--only", "A", "--force")
        self.assertEqual(code, 0)
        self.assertEqual(len(fake.requests), 2)
        self.assertFalse((self.out / f"{A_ID}.jpg").exists())
        self.assertEqual((self.out / f"{A_ID}.png").read_bytes(), PNG)
        self.assertEqual(self.manifest()["segments"][A_ID]["path"], f"images/demo/{A_ID}.png")

    def test_changed_prompt_is_flagged_not_silently_regenerated(self):
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
        cutaway = batch.load_cutaway(self.repo, "mv-demo")
        cutaway.segments[0].prompt = "A different prompt"
        manifest = batch.load_manifest(self.out, cutaway)
        planned = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, self.args(), force=False)
        self.assertEqual(planned[0].status, "exists")
        self.assertIn("prompt changed", planned[0].note)

    def test_hand_placed_images_are_adopted_into_the_manifest(self):
        self.out.mkdir(parents=True)
        (self.out / f"{B_ID}.webp").write_bytes(WEBP)
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k")
        self.assertEqual([r["prompt"] for r in fake.requests], ["Prompt for A"])
        adopted = self.manifest()["segments"][B_ID]
        self.assertEqual(adopted, {"path": f"images/demo/{B_ID}.webp", "promptSha256": None, "adopted": True})

    def test_one_failed_segment_does_not_stop_the_others(self):
        with FakeXai() as fake:
            fake.script = [(400, {})]  # first request (A) is rejected
            code, out, err = self.run_batch("mv-demo", "--api-key", "k", "--retries", "0")
        self.assertEqual(code, 1)
        self.assertEqual(len(fake.requests), 2)  # B was still attempted
        self.assertIn(f"FAILED {A_ID}", err)
        self.assertIn(A_ID, out)  # re-run hint names the failure
        self.assertEqual(set(self.manifest()["segments"]), {B_ID})
        self.assertFalse(any(self.out.glob(f"{A_ID}.*")))

    def test_auth_failure_stops_the_whole_batch(self):
        with FakeXai() as fake:
            fake.script = [(401, {})]
            code, _, err = self.run_batch("mv-demo", "--api-key", "bad")
        self.assertEqual(code, 1)
        self.assertEqual(len(fake.requests), 1)  # B was not even tried
        self.assertIn("Stopping", err)

    def test_transient_errors_are_retried_inside_the_batch(self):
        with FakeXai() as fake, mock.patch("time.sleep"):
            fake.script = [(429, {}), (500, {})]
            code, _, _ = self.run_batch("mv-demo", "--api-key", "k", "--only", "A", "--retries", "3")
        self.assertEqual(code, 0)
        self.assertEqual(len(fake.requests), 3)

    def test_json_log_records_cost_and_hash_but_not_prompt_or_key(self):
        log = self.repo / "docs" / "generation-log.jsonl"
        with FakeXai():
            self.run_batch("mv-demo", "--api-key", "super-secret", "--json-log", str(log))
        text = log.read_text(encoding="utf-8")
        records = [json.loads(line) for line in text.splitlines()]
        self.assertEqual([r["segmentId"] for r in records], [A_ID, B_ID])
        self.assertTrue(all(r["ok"] and r["costUsd"] == 0.04 and r["cutawayId"] == "mv-demo" for r in records))
        self.assertEqual(records[0]["usage"], {"cost_in_usd_ticks": 400_000_000})
        self.assertNotIn("super-secret", text)
        self.assertNotIn("Prompt for A", text)

    def test_missing_key_is_a_usage_error_before_any_request(self):
        with FakeXai() as fake, mock.patch.dict("os.environ", {}, clear=True):
            code, _, err = self.run_batch("mv-demo")
        self.assertEqual(code, 2)
        self.assertIn("XAI_API_KEY", err)
        self.assertEqual(fake.requests, [])

    def test_foreign_manifest_is_never_overwritten(self):
        self.out.mkdir(parents=True)
        (self.out / "manifest.json").write_text(json.dumps({"cutawayId": "other", "segments": {}}))
        code, _, err = self.run_batch("mv-demo", "--dry-run")
        self.assertEqual(code, 2)
        self.assertIn("belongs to cutaway 'other'", err)

    def test_custom_aspect_model_and_out(self):
        with FakeXai() as fake:
            elsewhere = self.repo / "somewhere"
            self.run_batch(
                "mv-demo", "--api-key", "k", "--only", "A", "--aspect", "9:16",
                "--model", "grok-imagine-image", "--out", str(elsewhere),
            )
        self.assertEqual((fake.requests[0]["model"], fake.requests[0]["aspect_ratio"]), ("grok-imagine-image", "9:16"))
        self.assertTrue((elsewhere / f"{A_ID}.jpg").is_file())


# ------------------------------------------------------------------- generation options (images)


class ImagePayloadTests(unittest.TestCase):
    def test_unset_options_are_not_sent(self):
        self.assertEqual(
            xai_api.image_payload("p", model="m", aspect_ratio="1:1"),
            {"model": "m", "prompt": "p", "n": 1, "aspect_ratio": "1:1"},
        )

    def test_set_options_use_the_apis_field_names(self):
        payload = xai_api.image_payload(
            "p", model="m", aspect_ratio="1:1", n=3, resolution="2k", quality="low", response_format="b64_json"
        )
        self.assertEqual(
            payload,
            {"model": "m", "prompt": "p", "n": 3, "aspect_ratio": "1:1", "resolution": "2k",
             "quality": "low", "response_format": "b64_json"},
        )

    def test_quality_is_only_for_models_that_take_it(self):
        self.assertIsNone(xai_api.quality_problem("grok-imagine-image-2.0", "medium"))
        self.assertIsNone(xai_api.quality_problem(xai_api.DEFAULT_MODEL, None))
        problem = xai_api.quality_problem(xai_api.DEFAULT_MODEL, "low")
        self.assertIn("grok-imagine-image-2.0", problem)
        self.assertIn(xai_api.DEFAULT_MODEL, problem)

    def test_spec_is_the_single_source_for_the_allowed_values(self):
        spec = json.loads((SCRIPTS / "xai-api-spec.json").read_text(encoding="utf-8"))
        self.assertEqual(list(xai_api.ASPECT_RATIOS), spec["image"]["aspectRatios"])
        self.assertEqual(list(xai_api.VIDEO_RESOLUTIONS), spec["video"]["resolutions"])
        self.assertTrue(set(xai_api.VIDEO_ASPECT_RATIOS) <= set(xai_api.ASPECT_RATIOS))
        self.assertIn(xai_api.DEFAULT_ASPECT, xai_api.ASPECT_RATIOS)


class GenerateOptionsHttpTests(unittest.TestCase):
    def test_options_reach_the_wire_and_n_images_come_back(self):
        with FakeXai() as fake:
            gen = xai_api.generate(
                "a cat", model="grok-imagine-image-2.0", aspect_ratio="3:2", api_key="k",
                n=2, resolution="2k", quality="medium", response_format="url",
            )
        self.assertEqual(
            fake.requests,
            [{"model": "grok-imagine-image-2.0", "prompt": "a cat", "n": 2, "aspect_ratio": "3:2",
              "resolution": "2k", "quality": "medium", "response_format": "url"}],
        )
        self.assertEqual(len(gen.images), 2)
        self.assertEqual(gen.url, gen.images[0].url)

    def test_b64_json_is_decoded_in_place_with_no_download(self):
        with FakeXai() as fake:
            gen = xai_api.generate("p", model="m", aspect_ratio="1:1", api_key="k", response_format="b64_json")
            data, download_attempts = xai_api.image_bytes(gen.images[0])
        self.assertEqual(data, JPEG)
        self.assertEqual(download_attempts, 0)
        self.assertEqual(fake.downloads, [])
        self.assertEqual(gen.url, "")  # nothing to fetch

    def test_a_reply_with_neither_url_nor_b64_is_an_error(self):
        with FakeXai():
            with mock.patch.object(xai_api, "call_with_retries", return_value=({"data": [{}]}, 1)):
                with self.assertRaises(xai_api.ApiError):
                    xai_api.generate("p", model="m", aspect_ratio="16:9", api_key="k")

    def test_garbage_base64_is_an_api_error(self):
        with self.assertRaises(xai_api.ApiError):
            xai_api.image_bytes(xai_api.GeneratedImage(b64="%%%not base64%%%"))


class GenerateCliOptionTests(unittest.TestCase):
    def run_cli(self, argv: list[str]) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = generate_cli.main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_flags_become_request_fields_and_log_fields(self):
        with FakeXai() as fake, tempfile.TemporaryDirectory() as tmp:
            dest, log = Path(tmp) / "out.jpg", Path(tmp) / "log.jsonl"
            code, _, _ = self.run_cli(
                ["a cat", "-o", str(dest), "--api-key", "k", "--model", "grok-imagine-image-2.0",
                 "--resolution", "2k", "--quality", "low", "--response-format", "b64_json", "--json-log", str(log)]
            )
            self.assertEqual(code, 0)
            body = fake.requests[0]
            self.assertEqual((body["resolution"], body["quality"], body["response_format"]), ("2k", "low", "b64_json"))
            self.assertEqual(dest.read_bytes(), JPEG)
            record = json.loads(log.read_text())
            self.assertEqual((record["resolution"], record["quality"], record["responseFormat"]), ("2k", "low", "b64_json"))

    def test_n_writes_numbered_files(self):
        with FakeXai(), tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "out.jpg"
            code, out, _ = self.run_cli(["p", "-o", str(dest), "--api-key", "k", "--n", "3"])
            self.assertEqual(code, 0)
            self.assertEqual(sorted(p.name for p in Path(tmp).iterdir()), ["out-2.jpg", "out-3.jpg", "out.jpg"])
            self.assertEqual(out.count("Wrote "), 3)

    def test_quality_on_a_model_without_it_is_refused_before_any_request(self):
        with FakeXai() as fake, tempfile.TemporaryDirectory() as tmp:
            code, _, err = self.run_cli(["p", "-o", str(Path(tmp) / "o.jpg"), "--api-key", "k", "--quality", "low"])
        self.assertEqual(code, 2)
        self.assertIn("grok-imagine-image-2.0", err)
        self.assertEqual(fake.requests, [])

    def test_out_of_range_n_and_unknown_values_are_refused(self):
        with FakeXai() as fake:
            code, _, err = self.run_cli(["p", "-o", "/tmp/never.jpg", "--api-key", "k", "--n", "11"])
            self.assertEqual(code, 2)
            self.assertIn("--n must be 1-10", err)
            for bad in (["--resolution", "4k"], ["--quality", "high"], ["--response-format", "png"]):
                with self.assertRaises(SystemExit), redirect_stderr(io.StringIO()):
                    self.run_cli(["p", "-o", "/tmp/never.jpg", *bad])
        self.assertEqual(fake.requests, [])


# ------------------------------------------------------------------------- video client


class VideoClientTests(unittest.TestCase):
    def test_payload_omits_unset_options(self):
        self.assertEqual(
            xai_api.video_payload("p", model="v", aspect_ratio="16:9"),
            {"model": "v", "prompt": "p", "aspect_ratio": "16:9"},
        )
        self.assertEqual(
            xai_api.video_payload("p", model="v", aspect_ratio="9:16", resolution="720p", duration=6),
            {"model": "v", "prompt": "p", "aspect_ratio": "9:16", "resolution": "720p", "duration": 6},
        )

    def test_submit_returns_the_request_id_and_sends_the_key(self):
        with FakeXai() as fake:
            request_id, attempts = xai_api.submit_video(
                xai_api.video_payload("p", model="v", aspect_ratio="16:9", duration=5), api_key="secret"
            )
        self.assertEqual((request_id, attempts), ("req-1", 1))
        self.assertEqual(fake.video_requests, [{"model": "v", "prompt": "p", "aspect_ratio": "16:9", "duration": 5}])
        self.assertEqual(fake.auth_headers, ["Bearer secret"])
        self.assertEqual(fake.requests, [])  # not the image endpoint

    def test_submit_without_a_request_id_is_an_error(self):
        with mock.patch.object(xai_api, "call_with_retries", return_value=({"oops": 1}, 1)):
            with self.assertRaisesRegex(xai_api.ApiError, "no request_id"):
                xai_api.submit_video({}, api_key="k")

    def test_check_returns_none_while_pending_then_the_finished_video(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending", "progress": 40})]
            self.assertIsNone(xai_api.check_video("req-1", api_key="k"))
            result = xai_api.check_video("req-1", api_key="k")
        self.assertTrue(result.url.endswith("/vid/req-1"))
        self.assertEqual(result.duration, 6)
        self.assertEqual(xai_api.cost_usd(result.usage), 0.3)

    def test_failed_expired_and_unknown_requests_are_gone_for_good(self):
        with FakeXai() as fake:
            fake.video_polls["a"] = [(200, {"status": "failed"})]
            fake.video_polls["b"] = [(200, {"status": "expired"})]
            fake.video_polls["c"] = [(404, {"error": "no such request"})]
            for request_id in "abc":
                with self.assertRaises(xai_api.VideoGone):
                    xai_api.check_video(request_id, api_key="k")

    def test_done_without_a_url_is_an_error_not_a_success(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "done", "video": {"respect_moderation": False}})]
            with self.assertRaisesRegex(xai_api.ApiError, "no URL"):
                xai_api.check_video("req-1", api_key="k")

    def test_poll_waits_between_looks_and_gives_up_naming_the_request(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending"})] * 50
            sleeps: list[float] = []
            ticks = iter(range(0, 1000, 10))
            with self.assertRaisesRegex(xai_api.ApiError, "req-1 still pending after 30s"):
                xai_api.poll_video(
                    "req-1", api_key="k", interval=7, timeout=30, sleep=sleeps.append, clock=lambda: next(ticks)
                )
        # The clock reads 0 (deadline 30), then 10, 20, 30 after each look: three looks, two waits.
        self.assertEqual(sleeps, [7, 7])
        self.assertEqual(len(fake.polls), 3)

    def test_poll_returns_as_soon_as_done(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending"}), (200, {"status": "pending"})]
            result = xai_api.poll_video("req-1", api_key="k", interval=0, sleep=lambda _s: None)
        self.assertEqual(len(fake.polls), 3)
        self.assertTrue(result.url.endswith("/vid/req-1"))


# ------------------------------------------------------------------- batch: settings per segment


class BatchSettingsBase(BatchBase):
    def set_catalog(self, generation: dict[str, dict] | None = None, duration: dict[str, float] | None = None) -> None:
        """Put `generation` / `durationSec` on the catalog's segments, keyed by letter, the way
        codegen emits them."""
        path = self.repo / "public" / "catalog" / "cutaways" / "mv-demo.json"
        full = json.loads(path.read_text(encoding="utf-8"))
        for segment in full["segments"]:
            letter = segment["label"][0]
            if generation and letter in generation:
                segment["generation"] = generation[letter]
            if duration and letter in duration:
                segment["durationSec"] = duration[letter]
        path.write_text(json.dumps(full), encoding="utf-8")


class BatchImageSettingsTests(BatchSettingsBase):
    def test_catalog_settings_are_sent_per_segment_so_one_run_can_mix_aspects(self):
        self.set_catalog(
            {
                "A": {"image": {"model": "grok-imagine-image-2.0", "aspectRatio": "9:16", "resolution": "2k", "quality": "medium"}},
                "B": {"image": {"aspectRatio": "1:1", "responseFormat": "b64_json"}},
            }
        )
        with FakeXai() as fake:
            code, _, _ = self.run_batch("mv-demo", "--api-key", "k", "--only", "A,B")
        self.assertEqual(code, 0)
        a, b = fake.requests
        self.assertEqual(
            (a["model"], a["aspect_ratio"], a["resolution"], a["quality"]),
            ("grok-imagine-image-2.0", "9:16", "2k", "medium"),
        )
        self.assertNotIn("response_format", a)
        self.assertEqual((b["model"], b["aspect_ratio"], b["response_format"]), (xai_api.DEFAULT_MODEL, "1:1", "b64_json"))
        self.assertNotIn("quality", b)  # never invented
        self.assertEqual(fake.downloads.count("/img/1-0"), 1)  # A downloaded...
        self.assertEqual(len(fake.downloads), 1)  # ...B came back inline

    def test_flags_beat_the_catalog_which_beats_the_defaults(self):
        self.set_catalog({"A": {"image": {"aspectRatio": "9:16", "resolution": "2k"}}, "B": {"image": {"aspectRatio": "1:1"}}})
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A,B", "--aspect", "21:9")
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A", "--force", "--resolution", "1k")
        self.assertEqual([r["aspect_ratio"] for r in fake.requests[:2]], ["21:9", "21:9"])  # flag wins for both
        self.assertEqual(fake.requests[2]["aspect_ratio"], "9:16")  # catalog fills what the flag left
        self.assertEqual(fake.requests[2]["resolution"], "1k")  # flag beats catalog

    def test_without_any_settings_the_old_defaults_apply(self):
        with FakeXai() as fake:
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
        self.assertEqual(
            fake.requests, [{"model": xai_api.DEFAULT_MODEL, "prompt": "Prompt for A", "n": 1, "aspect_ratio": "16:9"}]
        )

    def test_quality_on_the_default_model_is_refused_before_any_request_even_in_a_dry_run(self):
        self.set_catalog({"B": {"image": {"quality": "low"}}})
        with FakeXai() as fake:
            for extra in ([], ["--dry-run"]):
                code, _, err = self.run_batch("mv-demo", "--api-key", "k", *extra)
                self.assertEqual(code, 2)
                self.assertIn(f"{B_ID}: --quality low is only supported on grok-imagine-image-2.0", err)
        self.assertEqual(fake.requests, [])
        self.assertFalse(self.out.exists())

    def test_a_segment_that_is_not_going_to_run_cannot_block_the_rest(self):
        self.set_catalog({"B": {"image": {"quality": "low"}}})  # B is excluded below
        with FakeXai() as fake:
            code, _, _ = self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
        self.assertEqual(code, 0)
        self.assertEqual(len(fake.requests), 1)

    def test_dry_run_prints_each_segments_effective_settings(self):
        self.set_catalog({"A": {"image": {"model": "grok-imagine-image-2.0", "resolution": "2k", "quality": "low", "n": 2}}})
        code, out, _ = self.run_batch("mv-demo", "--dry-run", "--only", "A,B")
        self.assertEqual(code, 0)
        self.assertIn("with grok-imagine-image-2.0 · 16:9 · 2k · quality low · n=2", out)
        self.assertIn(f"with {xai_api.DEFAULT_MODEL} · 16:9", out)

    def test_manifest_records_the_settings_cost_and_usage(self):
        self.set_catalog({"A": {"image": {"model": "grok-imagine-image-2.0", "resolution": "2k", "quality": "medium"}}})
        with FakeXai():
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
        entry = self.manifest()["segments"][A_ID]
        self.assertEqual(
            (entry["model"], entry["aspect"], entry["resolution"], entry["quality"]),
            ("grok-imagine-image-2.0", "16:9", "2k", "medium"),
        )
        self.assertEqual(entry["promptSha256"], xai_api.prompt_hash("Prompt for A"))
        self.assertEqual((entry["costUsd"], entry["usage"]), (0.04, {"cost_in_usd_ticks": 400_000_000}))

    def test_changed_settings_on_an_existing_image_are_flagged_not_silently_regenerated(self):
        with FakeXai():
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
        self.set_catalog({"A": {"image": {"model": "grok-imagine-image-2.0", "resolution": "2k"}}})
        code, out, _ = self.run_batch("mv-demo", "--only", "A")
        self.assertEqual(code, 0)
        self.assertIn("settings changed", out)
        self.assertIn("model grok-imagine-image-quality -> grok-imagine-image-2.0", out)
        self.assertIn("resolution unset -> 2k", out)
        self.assertIn("--force to regenerate", out)
        self.assertIn("1 skipped (1 exists)", out)

    def test_n_saves_variants_and_lists_them_in_the_manifest(self):
        self.set_catalog({"A": {"image": {"n": 3}}})
        with FakeXai() as fake:
            code, _, _ = self.run_batch("mv-demo", "--api-key", "k", "--only", "A")
        self.assertEqual((code, fake.requests[0]["n"]), (0, 3))
        self.assertEqual(sorted(p.name for p in self.out.glob("*.jpg")), [f"{A_ID}-2.jpg", f"{A_ID}-3.jpg", f"{A_ID}.jpg"])
        entry = self.manifest()["segments"][A_ID]
        self.assertEqual(entry["path"], f"images/demo/{A_ID}.jpg")
        self.assertEqual(entry["variants"], [f"images/demo/{A_ID}-2.jpg", f"images/demo/{A_ID}-3.jpg"])
        self.assertEqual(entry["n"], 3)
        self.assertEqual(self.run_batch("mv-demo", "--only", "A")[2].count("FAILED"), 0)  # resume skips it

    def test_n_that_would_overwrite_another_segments_file_is_refused(self):
        path = self.repo / "public" / "catalog" / "cutaways" / "mv-demo.json"
        full = json.loads(path.read_text(encoding="utf-8"))
        full["segments"][1]["id"] = f"{A_ID}-2"
        full["segments"][0]["generation"] = {"image": {"n": 2}}
        path.write_text(json.dumps(full), encoding="utf-8")
        with FakeXai() as fake:
            code, _, err = self.run_batch("mv-demo", "--api-key", "k", "--only", f"{A_ID}")
        self.assertEqual(code, 2)
        self.assertIn(f"would save over the files of segment {A_ID}-2", err)
        self.assertEqual(fake.requests, [])

    def test_image_only_flags_and_clip_only_flags_are_kept_to_their_mode(self):
        for argv, message in (
            (["--video", "--quality", "low"], "only apply to stills"),
            (["--video", "--n", "2"], "only apply to stills"),
            (["--video", "--aspect", "auto"], "not available for clips"),
            (["--video", "--resolution", "2k"], "not available for clips"),
            (["--duration", "5"], "--duration only applies to clips"),
            (["--resolution", "720p"], "not available for stills"),
            (["--duration", "99", "--video"], "--duration must be 1-15"),
        ):
            with self.subTest(argv=argv):
                code, _, err = self.run_batch("mv-demo", "--dry-run", *argv)
                self.assertEqual(code, 2)
                self.assertIn(message, err)


# ---------------------------------------------------------------------- batch: clips (--video)


class BatchVideoTests(BatchSettingsBase):
    def setUp(self) -> None:
        super().setUp()
        self.out = self.repo / "videos" / "demo"
        self.set_catalog(duration={"A": 6, "B": 20, "C": 6, "E": 0.4})

    def test_dry_run_shows_the_clip_settings_and_derives_the_length_from_the_segment(self):
        self.set_catalog({"A": {"video": {"resolution": "720p", "aspectRatio": "9:16"}}})
        code, out, _ = self.run_batch("mv-demo", "--video", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("clips · out videos/demo/ · DRY RUN", out)
        self.assertIn(f"with {xai_api.DEFAULT_VIDEO_MODEL} · 9:16 · 720p · 6s", out)  # A: its own 0:00-0:06
        self.assertIn(f"with {xai_api.DEFAULT_VIDEO_MODEL} · 16:9 · 15s", out)  # B: 20 s clamps to the API max
        self.assertIn(f"{xai_api.DEFAULT_VIDEO_MODEL} · 16:9 · 1s", out)  # E: 0.4 s rounds up to the minimum
        self.assertFalse(self.out.exists())

    def test_explicit_length_beats_the_segments_timing(self):
        self.set_catalog({"A": {"video": {"durationSec": 4}}})
        _, out, _ = self.run_batch("mv-demo", "--video", "--dry-run", "--only", "A")
        self.assertIn("· 4s", out)
        _, out, _ = self.run_batch("mv-demo", "--video", "--dry-run", "--only", "A", "--duration", "9")
        self.assertIn("· 9s", out)

    def test_a_segment_with_no_timing_leaves_the_length_to_the_api(self):
        self.set_catalog(duration={"A": 0})
        _, out, _ = self.run_batch("mv-demo", "--video", "--dry-run", "--only", "A")
        self.assertIn("API default length", out)

    def test_submits_every_segment_then_polls_and_writes_clips_and_a_manifest(self):
        self.set_catalog({"A": {"video": {"resolution": "720p"}}})
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending", "progress": 10})]
            code, out, _ = self.run_batch(
                "mv-demo", "--video", "--api-key", "k", "--only", "A,B", "--poll-interval", "0"
            )
        self.assertEqual(code, 0, out)
        self.assertEqual(fake.requests, [])  # no stills
        self.assertEqual(
            fake.video_requests,
            [
                {"model": xai_api.DEFAULT_VIDEO_MODEL, "prompt": "Prompt for A", "aspect_ratio": "16:9",
                 "resolution": "720p", "duration": 6},
                {"model": xai_api.DEFAULT_VIDEO_MODEL, "prompt": "Prompt for B", "aspect_ratio": "16:9", "duration": 15},
            ],
        )
        # B was submitted before A was polled: one wait for the whole cutaway, not one per clip.
        self.assertEqual(fake.polls, ["req-1", "req-2", "req-1"])
        self.assertEqual((self.out / f"{A_ID}.mp4").read_bytes(), MP4)
        self.assertEqual((self.out / f"{B_ID}.mp4").read_bytes(), MP4)
        manifest = self.manifest()
        self.assertEqual(manifest["kind"], "video")
        entry = manifest["segments"][A_ID]
        self.assertEqual(entry["path"], f"videos/demo/{A_ID}.mp4")
        self.assertEqual(entry["promptSha256"], xai_api.prompt_hash("Prompt for A"))
        self.assertEqual((entry["requestId"], entry["resolution"], entry["durationSec"]), ("req-1", "720p", 6))
        self.assertEqual(entry["costUsd"], 0.3)
        self.assertNotIn("status", entry)  # no longer pending
        self.assertIn("$0.6000 spent", out)

    def test_the_request_id_is_saved_before_the_wait_and_a_timeout_keeps_it(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending"})] * 20
            code, out, err = self.run_batch(
                "mv-demo", "--video", "--api-key", "k", "--only", "A", "--poll-interval", "0", "--poll-timeout", "0"
            )
        self.assertEqual(code, 1)
        self.assertIn("TIMED OUT", err)
        self.assertIn("req-1", err)
        entry = self.manifest()["segments"][A_ID]
        self.assertEqual((entry["status"], entry["requestId"]), ("pending", "req-1"))
        self.assertFalse((self.out / f"{A_ID}.mp4").exists())

    def test_a_rerun_resumes_the_pending_request_instead_of_paying_again(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending"})] * 20
            self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A", "--poll-interval", "0", "--poll-timeout", "0")
            fake.video_polls["req-1"] = []  # xAI has finished it by now
            _, dry, _ = self.run_batch("mv-demo", "--video", "--only", "A", "--dry-run")
            code, out, _ = self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A", "--poll-interval", "0")
        self.assertIn("RESUME", dry)
        self.assertIn("1 to resume", dry)
        self.assertEqual(code, 0)
        self.assertEqual(len(fake.video_requests), 1)  # still only the one submit
        self.assertIn("resuming request req-1", out)
        self.assertEqual((self.out / f"{A_ID}.mp4").read_bytes(), MP4)
        self.assertNotIn("status", self.manifest()["segments"][A_ID])

    def test_a_changed_prompt_does_not_resume_a_stale_request(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending"})] * 20
            self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A", "--poll-interval", "0", "--poll-timeout", "0")
        cutaway = batch.load_cutaway(self.repo, "mv-demo")
        cutaway.segments[0].prompt = "A different prompt"
        planned = batch.plan(self.repo, cutaway, cutaway.segments[:1], self.out,
                             batch.load_manifest(self.out, cutaway, video=True), self.args("--video"),
                             force=False, video=True)
        self.assertEqual(planned[0].status, "generate")

    def test_force_submits_afresh_even_with_a_pending_request(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "pending"})] * 20
            self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A", "--poll-interval", "0", "--poll-timeout", "0")
            code, _, _ = self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A", "--force", "--poll-interval", "0")
        self.assertEqual(code, 0)
        self.assertEqual(len(fake.video_requests), 2)

    def test_a_failed_request_is_forgotten_so_the_next_run_resubmits(self):
        with FakeXai() as fake:
            fake.video_polls["req-1"] = [(200, {"status": "failed"})]
            code, _, err = self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A,B", "--poll-interval", "0")
        self.assertEqual(code, 1)
        self.assertIn(f"FAILED {A_ID}: video req-1 failed", err)
        manifest = self.manifest()
        self.assertNotIn(A_ID, manifest["segments"])  # not left pending
        self.assertIn(B_ID, manifest["segments"])  # the other clip still finished
        self.assertTrue((self.out / f"{B_ID}.mp4").exists())
        with FakeXai() as fake:
            code, _, _ = self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A", "--poll-interval", "0")
        self.assertEqual((code, len(fake.video_requests)), (0, 1))

    def test_auth_failure_on_submit_stops_the_batch(self):
        with FakeXai() as fake:
            fake.script = [(401, {})]
            code, _, err = self.run_batch("mv-demo", "--video", "--api-key", "bad", "--retries", "0", "--poll-interval", "0")
        self.assertEqual(code, 1)
        self.assertIn("Stopping", err)
        self.assertEqual(len(fake.video_requests), 1)  # not one per segment
        self.assertEqual(fake.polls, [])

    def test_a_failed_submit_does_not_stop_the_others(self):
        with FakeXai() as fake:
            fake.script = [(400, {})]
            code, _, err = self.run_batch("mv-demo", "--video", "--api-key", "k", "--only", "A,B", "--retries", "0", "--poll-interval", "0")
        self.assertEqual(code, 1)
        self.assertIn(f"FAILED {A_ID}", err)
        self.assertTrue((self.out / f"{B_ID}.mp4").exists())

    def test_existing_clips_are_skipped_and_a_still_manifest_is_never_mixed_in(self):
        self.out.mkdir(parents=True)
        (self.out / f"{A_ID}.mp4").write_bytes(MP4)
        _, out, _ = self.run_batch("mv-demo", "--video", "--only", "A", "--dry-run")
        self.assertIn("SKIP (exists)", out)
        with FakeXai():
            self.run_batch("mv-demo", "--api-key", "k", "--only", "A", "--out", str(self.out))  # a still run
        code, _, err = self.run_batch("mv-demo", "--video", "--only", "B", "--dry-run", "--out", str(self.out))
        self.assertEqual(code, 2)
        self.assertIn("holds image entries, and this run makes videos", err)

    def test_json_log_marks_clips_and_never_holds_the_prompt_or_key(self):
        log = self.repo / "docs" / "log.jsonl"
        with FakeXai():
            self.run_batch("mv-demo", "--video", "--api-key", "sekrit", "--only", "A", "--poll-interval", "0", "--json-log", str(log))
        text = log.read_text(encoding="utf-8")
        record = json.loads(text)
        self.assertEqual((record["kind"], record["ok"], record["requestId"], record["costUsd"]), ("video", True, "req-1", 0.3))
        self.assertNotIn("Prompt for A", text)
        self.assertNotIn("sekrit", text)

    def test_no_key_needed_to_plan_but_required_to_run(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            self.assertEqual(self.run_batch("mv-demo", "--video", "--dry-run")[0], 0)
            code, _, err = self.run_batch("mv-demo", "--video", "--only", "A", "--api-key", "")
        self.assertEqual(code, 2)
        self.assertIn("XAI_API_KEY", err)


class RealRepoTests(unittest.TestCase):
    """The committed catalog must stay consumable: every cutaway resolves, ids are the site's."""

    def test_every_prompts_file_with_a_cutaway_resolves_to_the_site_segment_ids(self):
        checked = 0
        for file in sorted((REPO / "content" / "cutaways").glob("*.json")):
            record = json.loads(file.read_text(encoding="utf-8"))
            source = record.get("segmentsSource")
            if not source:
                continue
            cutaway = batch.load_cutaway(REPO, source)  # raises if the catalog drifted
            catalog = json.loads((REPO / "public/catalog/cutaways" / f"{record['id']}.json").read_text())
            self.assertEqual([s.id for s in cutaway.segments], [s["id"] for s in catalog["segments"]])
            checked += 1
        self.assertGreater(checked, 10)

    def test_glam_sham_poo_is_ten_segments(self):
        cutaway = batch.load_cutaway(REPO, "prompts/glam-sham-poo-segments.md")
        self.assertEqual(cutaway.id, "mv-ultra-screech")
        self.assertEqual(len(cutaway.segments), 10)
        self.assertTrue(all(s.prompt for s in cutaway.segments))


if __name__ == "__main__":
    unittest.main()
