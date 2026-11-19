"""Tests for scripts/assemble-cutaway.py.

Stdlib only. Run from the repo root:  python3 -m unittest discover -s scripts/tests -v

Most tests are pure: they build a throwaway repo (catalog JSON, songs, empty "stills") and check
the plan, the timeline and the ffmpeg command. The smoke tests at the bottom run the real ffmpeg on
tiny fixtures they generate themselves (nothing binary is committed) and are skipped when ffmpeg
is not installed. CI sets REQUIRE_FFMPEG=1 so a missing ffmpeg fails there instead of skipping.
"""

from __future__ import annotations

import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent
REPO = SCRIPTS.parent


def load_script(filename: str, name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module  # @dataclass resolves string annotations through sys.modules
    spec.loader.exec_module(module)
    return module


asm = load_script("assemble-cutaway.py", "assemble_cutaway")
UsageError = asm.UsageError

HAVE_FFMPEG = bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))
REQUIRE_FFMPEG = os.environ.get("REQUIRE_FFMPEG") == "1"


class TempRepo(unittest.TestCase):
    """A scratch repo root per test, with helpers to drop files into it."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.repo = Path(self._tmp.name)

    def write(self, rel: str, content: bytes | str | dict | list = b"") -> Path:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, (dict, list)):
            path.write_text(json.dumps(content), encoding="utf-8")
        elif isinstance(content, str):
            path.write_text(content, encoding="utf-8")
        else:
            path.write_bytes(content)
        return path

    def catalog_cutaway(self, segments: list[dict], song_id: str | None = "demo-song") -> dict:
        """Write a catalog cutaway + its content record; returns the content record."""
        record = {"id": "demo", "kind": "musical", "songId": song_id or "", "segmentsSource": "prompts/demo-segments.md"}
        self.write("content/cutaways/demo.json", record)
        self.write("public/catalog/cutaways/demo.json", {**record, "segments": segments})
        return record

    def catalog_song(self, audio_file: str | None = "demo.mp3", song_id: str = "demo-song") -> None:
        self.write(f"public/catalog/songs/{song_id}.json", {"id": song_id, "audioFile": audio_file})
        if audio_file:
            self.write(f"songs/{audio_file}", b"mp3")


def seg(seg_id: str, start: str, end: str, **extra) -> dict:
    return {"id": seg_id, "label": seg_id.upper(), "start": start, "end": end, **extra}


# --------------------------------------------------------------------------- time and pan


class TimeTests(unittest.TestCase):
    def test_accepts_the_formats_the_catalog_and_hand_manifests_use(self) -> None:
        cases = [(6, 6.0), (6.5, 6.5), ("6.5", 6.5), ("0:06", 6.0), ("1:15", 75.0), ("2:51", 171.0), ("1:02:03", 3723.0), ("0:06.5", 6.5)]
        for value, expected in cases:
            with self.subTest(value=value):
                self.assertEqual(asm.parse_time(value, "t"), expected)

    def test_rejects_what_the_markdown_parser_sometimes_leaves_in_the_catalog(self) -> None:
        for value in ["5:40 PM", "Button", "hero", "", "0:75", "1:61:00", -1, True, None, float("nan")]:
            with self.subTest(value=value), self.assertRaises(UsageError):
                asm.parse_time(value, "t")

    def test_frame_boundaries_round_half_up(self) -> None:
        self.assertEqual(asm.frame_at(0.5, 3), 2)  # banker's rounding would say 2 here too...
        self.assertEqual(asm.frame_at(1.5, 3), 5)  # ...but 4.5 -> 4 under round()
        self.assertEqual(asm.frame_at(171, 24), 4104)

    def test_clock_shows_tenths(self) -> None:
        self.assertEqual(asm.clock(171.0), "2:51.0")
        self.assertEqual(asm.clock(6.5), "0:06.5")


class PanTests(unittest.TestCase):
    def test_presets_and_none(self) -> None:
        self.assertIsNone(asm.parse_pan("none", "p"))
        push = asm.parse_pan("push", "p")
        self.assertEqual((push.z0, push.z1), (1.0, 1.15))

    def test_left_slides_the_window_toward_the_left_edge(self) -> None:
        left = asm.parse_pan("left", "p")
        self.assertLess(left.x1, left.x0)

    def test_object_defaults_to_a_centered_still_zoom(self) -> None:
        pan = asm.parse_pan({"from": {}, "to": {"zoom": 2}}, "p")
        self.assertEqual((pan.z0, pan.x0, pan.y0, pan.z1, pan.x1, pan.y1), (1.0, 0.5, 0.5, 2.0, 0.5, 0.5))

    def test_rejects_bad_pans(self) -> None:
        bad = ["spin", {"from": {}}, {"from": {}, "to": {"zoom": 0.5}}, {"from": {}, "to": {"x": 2}}, {"from": {}, "to": {"zoomm": 2}}, 3]
        for value in bad:
            with self.subTest(value=value), self.assertRaises(UsageError):
                asm.parse_pan(value, "p")

    def test_pan_round_trips_through_json(self) -> None:
        custom = asm.parse_pan({"from": {"zoom": 1, "x": 0.3}, "to": {"zoom": 1.3, "x": 0.6, "y": 0.4}}, "p")
        for pan in [None, asm.parse_pan("pull", "p"), custom]:
            with self.subTest(pan=pan):
                self.assertEqual(asm.parse_pan(asm.pan_to_json(pan), "p"), pan)


# ------------------------------------------------------------------------------- timeline


def plain(seg_id: str, start: float, end: float) -> "asm.Segment":
    return asm.Segment(id=seg_id, start=start, end=end, image=Path(f"{seg_id}.png"))


class TimelineTests(unittest.TestCase):
    def test_contiguous_segments_become_contiguous_spans(self) -> None:
        spans, notes = asm.build_timeline([plain("a", 0, 6), plain("b", 6, 21)], 24)
        self.assertEqual([(s.start_frame, s.end_frame) for s in spans], [(0, 144), (144, 504)])
        self.assertEqual(notes, [])

    def test_boundaries_come_from_absolute_times_so_nothing_drifts(self) -> None:
        # 0.4 s is 9.6 frames: rounding each duration gives 10 + 10 + 10 = 30, but the cut ends at
        # 1.2 s = 28.8 -> 29 frames, which is where the audio ends.
        spans, _ = asm.build_timeline([plain("a", 0, 0.4), plain("b", 0.4, 0.8), plain("c", 0.8, 1.2)], 24)
        self.assertEqual(spans[-1].end_frame, 29)
        self.assertEqual(sum(s.frames for s in spans), 29)

    def test_gaps_and_a_late_start_play_black(self) -> None:
        spans, notes = asm.build_timeline([plain("a", 1, 2), plain("b", 3, 4)], 10)
        self.assertEqual([(s.segment_id, s.frames, s.image is None) for s in spans],
                         [("(gap)", 10, True), ("a", 10, False), ("(gap)", 10, True), ("b", 10, False)])
        self.assertEqual(len(notes), 2)

    def test_overlap_is_an_error(self) -> None:
        with self.assertRaisesRegex(UsageError, "before the previous segment ends"):
            asm.build_timeline([plain("a", 0, 6), plain("b", 5, 9)], 24)

    def test_out_of_order_is_an_error(self) -> None:
        with self.assertRaises(UsageError):
            asm.build_timeline([plain("b", 6, 9), plain("a", 0, 6)], 24)

    def test_a_segment_shorter_than_a_frame_is_an_error(self) -> None:
        with self.assertRaisesRegex(UsageError, "shorter than one frame"):
            asm.build_timeline([plain("a", 0, 0.01)], 24)


# --------------------------------------------------------------------------- assembly manifest


class ManifestTests(TempRepo):
    def manifest(self, **overrides) -> dict:
        self.write("images/a.png")
        self.write("images/b.png")
        self.write("songs/x.mp3")
        data = {
            "version": 1,
            "audio": "songs/x.mp3",
            "segments": [
                {"id": "a", "image": "images/a.png", "end": 2},
                {"id": "b", "image": "images/b.png", "end": "0:05"},
            ],
        }
        data.update(overrides)
        return data

    def plan(self, data: dict, name: str = "cut.json") -> "asm.Plan":
        path = self.write(name, data)
        return asm.plan_from_manifest(self.repo, data, path)

    def test_a_manifest_becomes_a_plan_with_defaults(self) -> None:
        plan = self.plan(self.manifest())
        self.assertEqual([(s.id, s.start, s.end) for s in plan.segments], [("a", 0.0, 2.0), ("b", 2.0, 5.0)])  # start = previous end
        self.assertEqual((plan.width, plan.height, plan.fps), (1280, 720, 24))
        self.assertEqual(plan.audio, self.repo / "songs" / "x.mp3")
        self.assertEqual(plan.out, self.repo / "videos" / "cut-preview.mp4")

    def test_null_image_is_deliberate_black_but_a_missing_file_is_not(self) -> None:
        data = self.manifest()
        data["segments"][0]["image"] = None
        data["segments"][1]["image"] = "images/not-there.png"
        plan = self.plan(data)
        self.assertIsNone(plan.segments[0].image)
        self.assertIsNone(plan.segments[0].missing)
        self.assertEqual(plan.segments[1].missing, "images/not-there.png")

    def test_unknown_keys_and_bad_values_are_all_reported_together(self) -> None:
        data = self.manifest()
        data["segments"][0]["strat"] = 0
        data["segments"][1]["pan"] = "spin"
        with self.assertRaises(UsageError) as caught:
            self.plan(data)
        message = str(caught.exception)
        self.assertIn("segments[1] (a) has unknown key(s): strat", message)
        self.assertIn("unknown pan 'spin'", message)

    def test_rejections(self) -> None:
        cases = {
            "wrong version": {"version": 2},
            "top-level typo": {"fsp": 24},
            "no segments": {"segments": []},
            "fps": {"fps": 0},
            "fps type": {"fps": "24"},
            "size": {"size": "1281x720"},
            "previewUrl": {"previewUrl": "drive.google.com/x"},
            "defaultPan": {"defaultPan": "spin"},
            "missing audio file": {"audio": "songs/nope.mp3"},
            "cutaway type": {"cutaway": 3},
        }
        for label, override in cases.items():
            with self.subTest(label), self.assertRaises(UsageError):
                self.plan(self.manifest(**override))

    def test_segment_level_rejections(self) -> None:
        for label, change in {
            "no end": lambda s: s.pop("end"),
            "end before start": lambda s: s.update(start=9),
            "no image key": lambda s: s.pop("image"),
            "duplicate id": lambda s: s.update(id="b"),
        }.items():
            data = self.manifest()
            change(data["segments"][0])
            with self.subTest(label), self.assertRaises(UsageError):
                self.plan(data)

    def test_manifest_round_trips_through_write_manifest(self) -> None:
        data = self.manifest(defaultPan="auto", previewUrl="https://example.com/x.mp4", fps=12, size="640x360")
        data["segments"][0]["pan"] = {"from": {"zoom": 1, "x": 0.3}, "to": {"zoom": 1.3, "x": 0.6}}
        data["segments"][1]["pan"] = "none"
        plan = self.plan(data)
        again = self.plan(asm.plan_to_manifest(self.repo, plan), "again.json")
        self.assertEqual(
            [(s.id, s.start, s.end, s.image, s.pan, s.pan_explicit) for s in again.segments],
            [(s.id, s.start, s.end, s.image, s.pan, s.pan_explicit) for s in plan.segments],
        )
        self.assertEqual((again.fps, again.width, again.height, again.audio, again.preview_url, again.default_pan),
                         (12, 640, 360, plan.audio, "https://example.com/x.mp4", "auto"))

    def test_audio_can_come_from_the_named_cutaway(self) -> None:
        self.catalog_cutaway([seg("demo-a", "0:00", "0:02")])
        self.catalog_song()
        data = self.manifest(cutaway="demo")
        del data["audio"]
        self.assertEqual(self.plan(data).audio, self.repo / "songs" / "demo.mp3")


class OptionTests(TempRepo):
    def plan_with(self, pans: list, **kw) -> "asm.Plan":
        segments = [
            asm.Segment(id=f"s{i}", start=i, end=i + 1, image=None if pan == "black" else Path("x.png"),
                        pan=None if pan in ("black", None) else asm.parse_pan(pan, "p"), pan_explicit=pan not in ("black", None))
            for i, pan in enumerate(pans)
        ]
        self.write("songs/x.mp3")
        return asm.Plan("demo", segments, self.repo / "songs/x.mp3", None, self.repo / "out.mp4", 1280, 720, 24, "test", **kw)

    def test_auto_pan_rotates_over_stills_and_leaves_explicit_and_black_alone(self) -> None:
        plan = self.plan_with([None, None, "black", "pull", None, None, None], default_pan="auto")
        asm.apply_options(self.repo, plan, asm.Options())
        names = [asm.pan_name(s.pan) for s in plan.segments]
        self.assertEqual(names, ["push", "left", "none", "pull", "pull", "right", "push"])

    def test_cli_pan_overrides_the_manifest_default(self) -> None:
        plan = self.plan_with([None, None], default_pan="push")
        asm.apply_options(self.repo, plan, asm.Options(pan="down"))
        self.assertEqual([asm.pan_name(s.pan) for s in plan.segments], ["down", "down"])

    def test_cli_flags_override(self) -> None:
        plan = self.plan_with([None])
        asm.apply_options(self.repo, plan, asm.Options(size="640x360", fps=12, out="videos/y.mp4"))
        self.assertEqual((plan.width, plan.height, plan.fps, plan.out), (640, 360, 12, self.repo / "videos/y.mp4"))

    def test_bad_flags(self) -> None:
        for opts in [asm.Options(fps=0), asm.Options(size="big"), asm.Options(pan="spin"), asm.Options(audio="nope.mp3")]:
            with self.subTest(opts=opts), self.assertRaises(UsageError):
                asm.apply_options(self.repo, self.plan_with([None]), opts)


# ----------------------------------------------------------------------- from a cutaway record


class CutawayRecordTests(TempRepo):
    def test_segments_times_audio_and_default_stills_dir_come_from_the_catalog(self) -> None:
        record = self.catalog_cutaway([seg("demo-a", "0:00", "0:06"), seg("demo-b", "0:06", "1:15")])
        self.catalog_song()
        self.write("images/demo/demo-a.jpg")
        self.write("images/demo/demo-b.webp")
        plan = asm.plan_from_cutaway(self.repo, record, asm.Options())
        self.assertEqual([(s.id, s.start, s.end) for s in plan.segments], [("demo-a", 0, 6), ("demo-b", 6, 75)])
        self.assertEqual([s.image for s in plan.segments], [self.repo / "images/demo/demo-a.jpg", self.repo / "images/demo/demo-b.webp"])
        self.assertEqual(plan.audio, self.repo / "songs/demo.mp3")
        self.assertEqual(plan.out, self.repo / "videos/demo-preview.mp4")
        self.assertEqual(plan.cutaway, "demo")

    def test_a_registered_still_beats_the_generated_one(self) -> None:
        record = self.catalog_cutaway([seg("demo-a", "0:00", "0:06", stillImagePath="ideas/demo/shot.jpg")])
        self.write("ideas/demo/shot.jpg")
        self.write("images/demo/demo-a.jpg")
        plan = asm.plan_from_cutaway(self.repo, record, asm.Options())
        self.assertEqual(plan.segments[0].image, self.repo / "ideas/demo/shot.jpg")

    def test_images_flag_changes_the_folder(self) -> None:
        record = self.catalog_cutaway([seg("demo-a", "0:00", "0:06")])
        self.write("elsewhere/demo-a.png")
        plan = asm.plan_from_cutaway(self.repo, record, asm.Options(images="elsewhere"))
        self.assertEqual(plan.segments[0].image, self.repo / "elsewhere/demo-a.png")

    def test_missing_stills_name_the_expected_path_and_the_fix(self) -> None:
        record = self.catalog_cutaway([seg("demo-a", "0:00", "0:06"), seg("demo-b", "0:06", "0:12")])
        self.catalog_song()
        self.write("images/demo/demo-a.jpg")
        plan = asm.plan_from_cutaway(self.repo, record, asm.Options())
        with self.assertRaises(UsageError) as caught:
            asm.check_plan(plan, asm.Options())
        message = str(caught.exception)
        self.assertIn("1 of 2 segment(s) have no still", message)
        self.assertIn("demo-b: images/demo/demo-b.jpg", message)
        self.assertIn("xai-batch.py demo", message)
        warnings = asm.check_plan(plan, asm.Options(allow_missing=True))
        self.assertEqual(len(warnings), 1)

    def test_unreadable_catalog_times_are_listed_with_the_way_out(self) -> None:
        record = self.catalog_cutaway([seg("demo-a", "0:00", "0:06"), seg("demo-b", "5:40 PM", "Button")])
        with self.assertRaises(UsageError) as caught:
            asm.plan_from_cutaway(self.repo, record, asm.Options())
        message = str(caught.exception)
        self.assertIn("demo-b start", message)
        self.assertIn("demo-b end", message)
        self.assertIn("assembly manifest", message)

    def test_no_audio_is_an_error_with_the_reason_unless_silent_is_asked_for(self) -> None:
        record = self.catalog_cutaway([seg("demo-a", "0:00", "0:06")])
        self.catalog_song(audio_file=None)
        self.write("images/demo/demo-a.png")
        plan = asm.plan_from_cutaway(self.repo, record, asm.Options())
        with self.assertRaisesRegex(UsageError, "no audio file yet"):
            asm.check_plan(plan, asm.Options())
        asm.check_plan(plan, asm.Options(no_audio=True))

    def test_missing_catalog_says_to_run_codegen(self) -> None:
        self.write("content/cutaways/demo.json", {"id": "demo", "songId": "s"})
        with self.assertRaisesRegex(UsageError, "npm run codegen"):
            asm.load_plan(self.repo, "content/cutaways/demo.json", asm.Options())

    def test_images_flag_is_refused_for_an_assembly_manifest(self) -> None:
        self.write("m.json", {"version": 1, "segments": []})
        with self.assertRaisesRegex(UsageError, "--images only applies"):
            asm.load_plan(self.repo, "m.json", asm.Options(images="x"))

    def test_the_real_glam_sham_poo_cutaway_plans_from_the_committed_catalog(self) -> None:
        if not (REPO / "public/catalog/cutaways/mv-ultra-screech.json").is_file():
            self.skipTest("catalog not generated")
        plan = asm.load_plan(REPO, "content/cutaways/mv-ultra-screech.json", asm.Options(allow_missing=True))
        self.assertEqual(len(plan.segments), 10)
        self.assertEqual((plan.segments[0].start, plan.segments[-1].end), (0.0, 171.0))
        self.assertEqual(plan.audio, REPO / "songs/glam-sham-poo.mp3")
        spans, notes = asm.build_timeline(plan.segments, plan.fps)
        self.assertEqual((spans[-1].end_frame, notes), (171 * 24, []))


# ------------------------------------------------------------------------------ the command


class CommandTests(TempRepo):
    def plan_and_spans(self, *, audio: bool = True, pans=(None, "push", None)):
        a, b = self.write("a.png"), self.write("b.png")
        song = self.write("x.mp3")
        segments = [
            asm.Segment("a", 0, 1, a, asm.parse_pan(pans[0], "p") if pans[0] else None),
            asm.Segment("b", 1, 2, b, asm.parse_pan(pans[1], "p") if pans[1] else None),
            asm.Segment("c", 3, 4, None),  # black, after a one-second gap
        ]
        plan = asm.Plan("demo", segments, song if audio else None, None, self.repo / "out.mp4", 160, 90, 10, "test")
        spans, _ = asm.build_timeline(segments, plan.fps)
        return plan, spans

    def test_one_input_per_still_plus_the_audio_and_none_for_black(self) -> None:
        plan, spans = self.plan_and_spans()
        command = asm.build_command(plan, spans, plan.out)
        inputs = [command[i + 1] for i, token in enumerate(command) if token == "-i"]
        self.assertEqual(inputs, [str(self.repo / "a.png"), str(self.repo / "b.png"), str(self.repo / "x.mp3")])
        graph = command[command.index("-filter_complex") + 1]
        self.assertIn(f"concat=n={len(spans)}:v=1:a=0[v]", graph)
        self.assertEqual(graph.count("color=c=black"), 2)  # the gap and the black segment
        self.assertIn("apad=whole_dur=4", graph)
        self.assertIn("atrim=end=4", graph)
        self.assertEqual(command[-1], str(plan.out))

    def test_every_span_is_exactly_its_frame_count(self) -> None:
        plan, spans = self.plan_and_spans()
        graph = asm.build_command(plan, spans, plan.out)[asm.build_command(plan, spans, plan.out).index("-filter_complex") + 1]
        self.assertEqual(graph.count("d=10:"), 2)  # two stills of 10 frames
        self.assertEqual(graph.count("trim=end_frame=10"), 2)

    def test_a_hold_uses_unit_zoom_and_a_pan_scales_the_still_up_first(self) -> None:
        plan, spans = self.plan_and_spans()
        graph = asm.build_command(plan, spans, plan.out)[asm.build_command(plan, spans, plan.out).index("-filter_complex") + 1]
        hold, pan = graph.split(";")[0], graph.split(";")[1]
        self.assertIn("scale=160:90", hold)
        self.assertIn("zoompan=z='1'", hold)
        self.assertIn(f"scale={160 * asm.PAN_UPSCALE}:{90 * asm.PAN_UPSCALE}", pan)
        self.assertIn("on/9", pan)  # progress runs 0..1 across the 10 frames

    def test_silent_video_has_no_audio_input_or_map(self) -> None:
        plan, spans = self.plan_and_spans(audio=False)
        command = asm.build_command(plan, spans, plan.out)
        self.assertNotIn("[a]", command)
        self.assertNotIn("-c:a", command)
        self.assertEqual(command.count("-i"), 2)

    def test_paths_with_spaces_stay_one_argument(self) -> None:
        plan, spans = self.plan_and_spans()
        plan.segments[0].image = self.write("with space.png")
        spans, _ = asm.build_timeline(plan.segments, plan.fps)
        self.assertIn(str(self.repo / "with space.png"), asm.build_command(plan, spans, plan.out))


# --------------------------------------------------------------------------------- the CLI


class CliTests(TempRepo):
    def run_main(self, *argv: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = asm.main(list(argv), repo=self.repo)
        return code, out.getvalue(), err.getvalue()

    def cutaway(self) -> None:
        self.catalog_cutaway([seg("demo-a", "0:00", "0:02"), seg("demo-b", "0:02", "0:05")])
        self.catalog_song()
        self.write("images/demo/demo-a.png")
        self.write("images/demo/demo-b.png")

    def test_dry_run_prints_the_plan_and_command_and_writes_nothing(self) -> None:
        self.cutaway()
        code, out, _ = self.run_main("--manifest", "content/cutaways/demo.json", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("2 segments", out)
        self.assertIn("images/demo/demo-b.png", out)
        self.assertIn("ffmpeg -hide_banner", out)
        self.assertFalse((self.repo / "videos").exists())

    def test_bad_input_exits_2_with_one_error_line_block(self) -> None:
        code, _, err = self.run_main("--manifest", "nope.json")
        self.assertEqual(code, 2)
        self.assertTrue(err.startswith("ERROR: "))

    def test_write_manifest_then_dry_run_the_written_manifest(self) -> None:
        self.cutaway()
        code, out, _ = self.run_main("--manifest", "content/cutaways/demo.json", "--pan", "auto", "--write-manifest", "videos/demo.json")
        self.assertEqual(code, 0)
        written = json.loads((self.repo / "videos/demo.json").read_text())
        self.assertEqual(written["version"], 1)
        self.assertEqual(written["defaultPan"], "auto")
        self.assertEqual([s["image"] for s in written["segments"]], ["images/demo/demo-a.png", "images/demo/demo-b.png"])
        code, out, _ = self.run_main("--manifest", "videos/demo.json", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("push", out)

    def test_dry_run_write_manifest_writes_nothing(self) -> None:
        self.cutaway()
        code, out, _ = self.run_main("--manifest", "content/cutaways/demo.json", "--write-manifest", "videos/demo.json", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("would write videos/demo.json", out)
        self.assertFalse((self.repo / "videos").exists())

    def test_audio_length_mismatch_is_a_warning_not_an_error(self) -> None:
        # Without ffprobe the check is skipped; with it, a 3-byte "mp3" probes as unreadable (None).
        plan = asm.Plan("d", [plain("a", 0, 5)], self.write("x.mp3"), None, self.repo / "o.mp4", 160, 90, 10, "t")
        self.assertEqual(asm.audio_warnings(plan, 5.0), [])


# ------------------------------------------------------------------------- ffmpeg smoke


@unittest.skipUnless(HAVE_FFMPEG or REQUIRE_FFMPEG, "ffmpeg/ffprobe not installed")
class FfmpegSmokeTests(TempRepo):
    """Assemble real (tiny) clips: 160x90, 12 fps, fixtures made by ffmpeg itself."""

    def setUp(self) -> None:
        super().setUp()
        if REQUIRE_FFMPEG and not HAVE_FFMPEG:
            self.fail("REQUIRE_FFMPEG=1 but ffmpeg/ffprobe are not on PATH")
        self.make("white.png", "color=c=white:s=160x90:d=1", ["-frames:v", "1"])
        self.make("gray.png", "color=c=gray:s=160x90:d=1", ["-frames:v", "1"])
        self.make("tone.wav", "sine=frequency=440:duration=2.5", [])

    def make(self, name: str, source: str, extra: list[str]) -> None:
        result = subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", source, *extra, str(self.repo / name)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def probe(self, path: Path) -> dict:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-count_frames", "-show_entries",
             "stream=codec_type,width,height,nb_read_frames,duration:format=duration", "-of", "json", str(path)],
            capture_output=True, text=True, check=True,
        )
        info = json.loads(result.stdout)
        streams = {s["codec_type"]: s for s in info["streams"]}
        return {"streams": streams, "duration": float(info["format"]["duration"])}

    def mean_luma(self, path: Path, at: float) -> float:
        raw = subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", str(at), "-i", str(path), "-frames:v", "1",
             "-vf", "format=gray", "-f", "rawvideo", "-"],
            capture_output=True, check=True,
        ).stdout
        return sum(raw) / len(raw)

    def assemble(self, data: dict, *extra: str) -> tuple[int, Path]:
        manifest = {"version": 1, "size": "160x90", "fps": 12, "audio": "tone.wav", "out": "videos/cut.mp4", **data}
        self.write("cut.json", manifest)
        code = asm.main(["--manifest", "cut.json", *extra], repo=self.repo)
        return code, self.repo / "videos" / "cut.mp4"

    def quiet(self, fn, *args):
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            return fn(*args)

    def test_two_segments_over_audio_hit_the_exact_frame_count_and_duration(self) -> None:
        code, out = self.quiet(self.assemble, {"segments": [
            {"id": "a", "image": "white.png", "end": 1},
            {"id": "b", "image": "gray.png", "end": 2, "pan": "push"},
        ]})
        self.assertEqual(code, 0)
        info = self.probe(out)
        video, audio = info["streams"]["video"], info["streams"]["audio"]
        self.assertEqual((video["width"], video["height"], video["nb_read_frames"]), (160, 90, "24"))
        self.assertAlmostEqual(info["duration"], 2.0, delta=0.1)
        self.assertAlmostEqual(float(audio["duration"]), 2.0, delta=0.1)  # 2.5 s of tone, trimmed
        self.assertFalse(list(out.parent.glob("*.partial.*")))

    def test_gap_and_late_start_play_black_between_stills(self) -> None:
        code, out = self.quiet(self.assemble, {"segments": [
            {"id": "a", "image": "white.png", "start": 0.5, "end": 1.5},
            {"id": "b", "image": "white.png", "start": 2, "end": 3},
        ]})
        self.assertEqual(code, 0)
        self.assertEqual(self.probe(out)["streams"]["video"]["nb_read_frames"], "36")
        self.assertLess(self.mean_luma(out, 0.2), 30)   # leading black
        self.assertGreater(self.mean_luma(out, 1.0), 200)  # first still
        self.assertLess(self.mean_luma(out, 1.75), 30)  # the gap
        self.assertGreater(self.mean_luma(out, 2.5), 200)  # second still

    def test_silent_video_with_a_deliberate_black_segment(self) -> None:
        code, out = self.quiet(self.assemble, {"segments": [
            {"id": "a", "image": None, "end": 1},
            {"id": "b", "image": "gray.png", "end": 2},
        ]}, "--no-audio")
        self.assertEqual(code, 0)
        self.assertNotIn("audio", self.probe(out)["streams"])

    def test_a_missing_still_stops_before_ffmpeg_unless_allowed(self) -> None:
        data = {"segments": [{"id": "a", "image": "gone.png", "end": 1}]}
        code, out = self.quiet(self.assemble, data)
        self.assertEqual(code, 2)
        self.assertFalse(out.exists())
        code, out = self.quiet(self.assemble, data, "--allow-missing")
        self.assertEqual(code, 0)
        self.assertLess(self.mean_luma(out, 0.5), 30)

    def test_a_still_of_another_aspect_is_fitted_with_bars_not_stretched(self) -> None:
        self.make("square.png", "color=c=white:s=90x90:d=1", ["-frames:v", "1"])  # 1:1 into a 16:9 frame
        code, out = self.quiet(self.assemble, {"segments": [{"id": "a", "image": "square.png", "end": 1}]}, "--no-audio")
        self.assertEqual(code, 0)
        row = subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", "0.5", "-i", str(out), "-frames:v", "1",
             "-vf", "format=gray,crop=160:1:0:45", "-f", "rawvideo", "-"],
            capture_output=True, check=True,
        ).stdout
        self.assertLess(row[3], 30)  # left bar
        self.assertGreater(row[80], 200)  # the square, centered
        self.assertLess(row[156], 30)  # right bar

    def test_a_failed_encode_leaves_no_output_and_no_partial_file(self) -> None:
        self.write("broken.png", b"this is not an image")
        code, out = self.quiet(self.assemble, {"segments": [{"id": "a", "image": "broken.png", "end": 1}]})
        self.assertEqual(code, 1)
        self.assertEqual(list((self.repo / "videos").glob("*")), [])


if __name__ == "__main__":
    unittest.main()
