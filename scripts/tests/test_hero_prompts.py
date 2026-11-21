"""Tests for scripts/hero_prompts.py, scripts/check-hero-prompts.py and the max-density modes of
scripts/generate-prompts.py.

Stdlib only. Run from the repo root:  python3 -m unittest discover -s scripts/tests -v

The first test runs the checker against the real prompts/hero/ + prompts/locks/ library, so a lock
edited without updating the prompts that paste it (or a stale character count) fails `npm run
test:py`. The rest build a throwaway library in a temp dir.
"""

from __future__ import annotations

import importlib.util
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS))

import hero_prompts as hp  # noqa: E402


def _load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


checker = _load("check_hero_prompts", "check-hero-prompts.py")
generator = _load("generate_prompts", "generate-prompts.py")

FILLER = (
    "A hard 2700K bulb overhead drops the eye sockets into shadow while cool 4100K moonlight rakes "
    "wet grass, every leaf carrying a two-color specular edge, moths circling the caged fixture. "
)
NEGATIVE = "No text, no watermark, no extra fingers."
CAT = "the black cat, a sleek real cat with yellow eyeshine"


def lock_md(stem_title: str, triggers: str | None, blocks: dict[str, str]) -> str:
    out = [f"# {stem_title}", ""]
    if triggers:
        out += [f"**Trigger words:** {triggers}", ""]
    for name, text in blocks.items():
        out += [f"## Paste · {name}", "", "```text", text, "```", ""]
    return "\n".join(out)


def hero_md(shot: str, framings: dict[str, tuple[list[str], str, str | None]]) -> str:
    out = [f"# {shot} · Test shot", "", f"**Shot:** {shot}", ""]
    for code, (locks, prompt, chars) in framings.items():
        out += [f"### {code} · Frame {code}", ""]
        out.append("- **Locks:** " + ", ".join(f"`{r}`" for r in locks))
        out.append(f"- **Characters:** {chars if chars is not None else hp.chars_label(len(prompt))}")
        out += ["", "```text", prompt, "```", ""]
    out += ["## Negative twin", "", "```text", "text, watermark", "```", ""]
    return "\n".join(out)


class RealLibraryTest(unittest.TestCase):
    def test_library_passes_every_rule(self) -> None:
        stdout, stderr = io.StringIO(), io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            code = checker.main([])
        self.assertEqual(code, 0, stderr.getvalue())

    def test_every_hero_file_has_three_framings_and_the_two_are_locked(self) -> None:
        locks = hp.load_locks()
        self.assertGreaterEqual(len(locks), 4)
        for name in ("the-two-identity", "pizza-guy-identity", "house-negative"):
            self.assertIn(name, locks)
        heroes = [hp.parse_hero(p) for p in hp.hero_files()]
        self.assertGreaterEqual(len(heroes), 1)
        for hero in heroes:
            self.assertGreaterEqual(len(hero.framings), 3, hero.path.name)


class CheckerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.locks_dir = root / "locks"
        self.hero_dir = root / "hero"
        self.locks_dir.mkdir()
        self.hero_dir.mkdir()
        (self.locks_dir / "house-negative.lock.md").write_text(
            lock_md("House negative", None, {"still": NEGATIVE}), encoding="utf-8"
        )
        (self.locks_dir / "black-cat-identity.lock.md").write_text(
            lock_md("Cat", "black cat", {"small": CAT}), encoding="utf-8"
        )

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def prompt(self, *middle: str, filler: int = 12) -> str:
        return " ".join(["Photoreal cinematic film still.", *middle, FILLER * filler, NEGATIVE]).replace("  ", " ")

    def write(self, framings: dict[str, tuple[list[str], str, str | None]], shot: str = "H01") -> Path:
        path = self.hero_dir / f"{shot.lower()}.md"
        path.write_text(hero_md(shot, framings), encoding="utf-8")
        return path

    def run_check(self, *extra: str) -> tuple[int, str]:
        err = io.StringIO()
        with redirect_stdout(io.StringIO()), redirect_stderr(err):
            code = checker.main(["--locks-dir", str(self.locks_dir), "--hero-dir", str(self.hero_dir), *extra])
        return code, err.getvalue()

    def good(self) -> dict[str, tuple[list[str], str, str | None]]:
        p = self.prompt(CAT)
        refs = ["black-cat-identity/small", "house-negative/still"]
        return {"W": (refs, p, None), "M": (refs, p, None), "C": (refs, p, None)}

    def test_clean_library_passes(self) -> None:
        self.write(self.good())
        code, err = self.run_check()
        self.assertEqual(code, 0, err)

    def test_trigger_word_without_lock_fails(self) -> None:
        framings = self.good()
        bare = self.prompt("A black cat walks past.")
        framings["M"] = (["house-negative/still"], bare, None)
        self.write(framings)
        code, err = self.run_check()
        self.assertEqual(code, 1)
        self.assertIn("without a `black-cat-identity/…` lock", err)

    def test_declared_lock_must_be_verbatim(self) -> None:
        framings = self.good()
        edited = self.prompt(CAT.replace("sleek", "glossy"))
        framings["C"] = (["black-cat-identity/small", "house-negative/still"], edited, None)
        self.write(framings)
        code, err = self.run_check()
        self.assertEqual(code, 1)
        self.assertIn("not pasted verbatim", err)

    def test_missing_negative_block_fails(self) -> None:
        framings = self.good()
        framings["W"] = (["black-cat-identity/small"], framings["W"][1], None)
        self.write(framings)
        code, err = self.run_check()
        self.assertEqual(code, 1)
        self.assertIn("house-negative", err)

    def test_empty_adjective_fails(self) -> None:
        framings = self.good()
        framings["W"] = (framings["W"][0], self.prompt(CAT, "A stunning night."), None)
        self.write(framings)
        code, err = self.run_check()
        self.assertEqual(code, 1)
        self.assertIn("empty adjectives", err)

    def test_length_floor_cap_and_target(self) -> None:
        self.assertTrue(hp.length_problems(4000)[0])
        self.assertTrue(hp.length_problems(900)[0])
        errors, warnings = hp.length_problems(1300)
        self.assertEqual(errors, [])
        self.assertTrue(warnings)
        self.assertEqual(hp.length_problems(2500), ([], []))

    def test_two_framings_is_not_a_hero(self) -> None:
        framings = self.good()
        del framings["C"]
        self.write(framings)
        code, err = self.run_check()
        self.assertEqual(code, 1)
        self.assertIn("needs three", err)

    def test_write_fixes_stale_counts(self) -> None:
        framings = self.good()
        framings["M"] = (framings["M"][0], framings["M"][1], "0 / 3,500 cap")
        path = self.write(framings)
        code, err = self.run_check()
        self.assertEqual(code, 1)
        self.assertIn("run with --write", err)
        code, err = self.run_check("--write", str(path))
        self.assertEqual(code, 0, err)
        self.assertNotIn("0 / 3,500 cap", path.read_text(encoding="utf-8"))

    def test_print_returns_one_prompt(self) -> None:
        self.write(self.good())
        out = io.StringIO()
        with redirect_stdout(out):
            code = checker.main(["--locks-dir", str(self.locks_dir), "--hero-dir", str(self.hero_dir), "--print", "h01-m"])
        self.assertEqual(code, 0)
        self.assertEqual(out.getvalue().strip(), self.good()["M"][1])


class GeneratorTest(unittest.TestCase):
    def test_quick_mode_unchanged(self) -> None:
        self.assertEqual(len(generator.generate_prompts("night desert")), 3)

    def test_max_density_pastes_locks_and_emits_three_framings(self) -> None:
        locks = hp.load_locks()
        ref = "pizza-guy-identity/full"
        out = generator.max_density("a porch at night", {}, [ref, "house-negative/still"])
        self.assertEqual(set(out), {"W", "M", "C"})
        for code, text in out.items():
            self.assertIn(hp.lock_text(locks, ref), text, code)
            self.assertTrue(text.endswith(hp.lock_text(locks, "house-negative/still")), code)
            self.assertEqual(hp.word_hits(text, hp.EMPTY_ADJECTIVES), [])
            self.assertGreaterEqual(len(text), hp.FLOOR)
        self.assertIn("24mm", out["W"])
        self.assertIn("85mm", out["C"])

    def test_max_density_rejects_unknown_lock(self) -> None:
        with self.assertRaises(ValueError):
            generator.max_density("x", {}, ["nobody/none"])

    def test_variants_fill_frame_and_camera(self) -> None:
        out = generator.variants("Cinematic still, {FRAME}, of a woman under a sodium lamp. No text.")
        self.assertIn("wide establishing frame", out["W"])
        self.assertIn("close-up", out["C"])
        for text in out.values():
            self.assertNotIn("{FRAME}", text)
            self.assertLess(text.index("Camera:"), text.index(" No text"))


if __name__ == "__main__":
    unittest.main()
