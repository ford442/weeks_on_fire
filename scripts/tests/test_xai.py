"""Tests for scripts/xai_api.py, scripts/xai-generate.py and scripts/xai-batch.py.

Stdlib only. Run from the repo root:  python3 -m unittest discover -s scripts/tests -v

The HTTP tests talk to a throwaway local server that stands in for api.x.ai (the module's
API_URL is pointed at it), so retries, headers, payloads and downloads go through the real
urllib code path. Nothing here needs a key or the network.
"""

from __future__ import annotations

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

JPEG = b"\xff\xd8\xff\xe0" + b"jpeg-bytes" * 8
PNG = b"\x89PNG\r\n\x1a\n" + b"png-bytes" * 8
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"webp" * 8


class FakeXai:
    """A local stand-in for api.x.ai. `script` is a list of (status, headers) for generation
    requests, consumed in order; once it runs out every request succeeds."""

    def __init__(self) -> None:
        self.script: list[tuple[int, dict[str, str]]] = []
        self.requests: list[dict] = []
        self.auth_headers: list[str] = []
        self.image = JPEG
        self.cost_ticks: int | None = 400_000_000
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):  # silence
                pass

            def do_POST(self):
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length) or b"{}")
                owner.requests.append(body)
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
                reply: dict = {"data": [{"url": f"http://127.0.0.1:{owner.port}/img/{len(owner.requests)}"}]}
                if owner.cost_ticks is not None:
                    reply["usage"] = {"cost_in_usd_ticks": owner.cost_ticks}
                payload = json.dumps(reply).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-Length", str(len(owner.image)))
                self.end_headers()
                self.wfile.write(owner.image)

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)

    def __enter__(self) -> "FakeXai":
        self.thread.start()
        self._patch = mock.patch.object(xai_api, "API_URL", f"http://127.0.0.1:{self.port}/v1/images/generations")
        self._patch.start()
        return self

    def __exit__(self, *exc) -> None:
        self._patch.stop()
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
        planned = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, force=False)
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
        planned = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, force=False)
        self.assertEqual(planned[0].status, "exists")
        forced = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, force=True)
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
        planned = batch.plan(self.repo, cutaway, cutaway.segments, self.out, manifest, force=False)
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
