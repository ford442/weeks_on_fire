#!/usr/bin/env python3
"""
Generate Grok Imagine prompts from a synopsis or scene description (stdlib only).

Quick mode (unchanged): three short variations.
  python3 scripts/generate-prompts.py "your synopsis here"

Max-density mode: expand a short scene into the nine-slot hero structure (prompts/README.md,
"Hero prompts"), paste lock blocks verbatim, and emit wide / medium / close-up siblings with a
character count for each. Slots you do not pass are filled with house defaults; replace them.
  python3 scripts/generate-prompts.py --max-density "night laundromat, two strangers fold a sheet" \\
      --lock house-negative/still --environment "24-hour laundromat, twelve washers, rain on glass" \\
      --lighting "harsh 4000K fluorescents above, warm 2700K dryer glow below"

Variants mode: one finished hero paragraph -> W / M / C. Put {FRAME} where the framing words go
(otherwise the framing sentence is put first) and {CAMERA} where the lens sentence goes
(otherwise it goes before the final "No ..." sentence).
  python3 scripts/generate-prompts.py --variants path/to/hero.txt

Count mode: character count and the floor / target / cap warnings for any prompt.
  python3 scripts/generate-prompts.py --count "prompt text"      # or a file path, or - for stdin
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import hero_prompts as hp  # noqa: E402

FRAMINGS = {
    "W": (
        "Wide",
        "16:9 wide establishing frame",
        "Camera: 24mm spherical lens at chest height, deep focus from foreground to background, "
        "locked off, horizon level.",
    ),
    "M": (
        "Medium",
        "16:9 medium shot framed from mid-thigh up",
        "Camera: 50mm at chest height, f/2.8, focus on the eyes, background soft but readable.",
    ),
    "C": (
        "Close-up",
        "16:9 close-up framed from the crown to mid-chest",
        "Camera: 85mm portrait lens at eye level, f/1.8, focus on the near eye, one out-of-focus "
        "foreground element crossing the frame edge.",
    ),
}

# House defaults for every slot the caller leaves empty. Each one names a light behavior or a
# material, never a bare mood word, so a draft is already legal under rule 5. Replace them.
DEFAULTS = {
    "action": "Blocking: the subject holds still in the center third, hands busy with one prop, "
    "eyes on something just off frame.",
    "environment": "Environment: a real lived-in location with era-specific fixtures, scuffed "
    "floors, one practical lamp in frame, and background layers that recede in three planes.",
    "lighting": "Lighting: one motivated practical as the key at about 2700K, a cooler 4100K "
    "ambient fill from a window or sky, a thin haze that catches both, shadows falling in one "
    "consistent direction.",
    "materials": "Micro-detail: visible fabric weave and pilling, dust motes in the key light, "
    "fingerprints on glass, condensation where cold meets warm.",
    "grade": "Grade: filmic, fine 35mm grain, soft highlight roll-off, true blacks, no beauty "
    "retouch.",
    "style": "Style: a cinematic photograph with real optics, not illustration, not a render.",
}

SLOTS = ("action", "environment", "lighting", "materials", "grade", "style")


def read_arg(value: str) -> str:
    if value == "-":
        return sys.stdin.read().strip()
    path = Path(value)
    try:
        if path.is_file():
            return path.read_text(encoding="utf-8").strip()
    except OSError:
        pass
    return value.strip()


def generate_prompts(text: str) -> list[str]:
    return [
        f"Cinematic wide shot, {text}, dramatic lighting, filmic color grade, high detail, Grok Imagine style",
        f"Close-up emotional moment, {text}, intense atmosphere, detailed textures, cinematic",
        f"Dynamic action sequence, {text}, motion blur, epic composition, vibrant yet moody tones",
    ]


def sentence(text: str) -> str:
    text = text.strip()
    return text if text.endswith((".", "!", "?")) else text + "."


def max_density(scene: str, slots: dict[str, str | None], lock_refs: list[str]) -> dict[str, str]:
    """Nine-slot hero paragraph per framing. Raises ValueError on an unknown lock."""
    locks = hp.load_locks()
    subject_blocks: list[str] = []
    negative = None
    for ref in lock_refs:
        text = hp.lock_text(locks, ref)
        if text is None:
            raise ValueError(f"unknown lock {ref!r}")
        if ref.startswith("house-negative/"):
            negative = text
        else:
            subject_blocks.append(text)
    if negative is None:
        negative = hp.lock_text(locks, "house-negative/still") or ""
    subject = "; ".join(subject_blocks)
    body = [sentence(slots.get(name) or DEFAULTS[name]) for name in SLOTS]
    out: dict[str, str] = {}
    for code, (_, frame, camera) in FRAMINGS.items():
        head = f"Photoreal cinematic film still, {frame}, of {scene.strip().rstrip('.')}"
        if subject:
            head += f": {subject}"
        parts = [sentence(head), body[0], body[1], body[2], camera, body[3], body[4], body[5]]
        if negative:
            parts.append(negative)
        out[code] = " ".join(p for p in parts if p)
    return out


def variants(paragraph: str) -> dict[str, str]:
    paragraph = " ".join(paragraph.split())
    out: dict[str, str] = {}
    for code, (_, frame, camera) in FRAMINGS.items():
        text = paragraph
        if "{FRAME}" in text:
            text = text.replace("{FRAME}", frame)
        else:
            text = f"Photoreal cinematic film still, {frame}. {text}"
        if "{CAMERA}" in text:
            text = text.replace("{CAMERA}", camera)
        else:
            cut = text.rfind(" No ")
            text = f"{text[:cut]} {camera}{text[cut:]}" if cut > 0 else f"{text} {camera}"
        out[code] = text
    return out


def report(code: str, label: str, text: str, cap: int) -> bool:
    errors, warnings = hp.length_problems(len(text), cap)
    bad = hp.word_hits(text, hp.EMPTY_ADJECTIVES)
    if bad:
        errors.append(f"empty adjectives {bad}")
    print(f"### {code} · {label}\n- **Characters:** {hp.chars_label(len(text), cap)}\n")
    print(f"```text\n{text}\n```\n")
    for w in warnings:
        print(f"warn: {code}: {w}", file=sys.stderr)
    for e in errors:
        print(f"error: {code}: {e}", file=sys.stderr)
    return not errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("text", nargs="*", help="scene description (quick and --max-density modes)")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--max-density", action="store_true", help="nine-slot hero prompt, W / M / C")
    mode.add_argument("--variants", metavar="TEXT|FILE|-", help="one hero paragraph -> W / M / C")
    mode.add_argument("--count", metavar="TEXT|FILE|-", help="character count + warnings")
    parser.add_argument("--lock", action="append", default=[], metavar="STEM/NAME", help="paste a lock block (repeatable)")
    for name in SLOTS:
        parser.add_argument(f"--{name}", help=f"{name} slot (default: a house placeholder)")
    parser.add_argument("--cap", type=int, default=hp.HOUSE_CAP, help=f"character cap (default {hp.HOUSE_CAP})")
    args = parser.parse_args(argv)

    if args.count is not None:
        text = read_arg(args.count)
        errors, warnings = hp.length_problems(len(text), args.cap)
        print(hp.chars_label(len(text), args.cap))
        for m in warnings:
            print(f"warn: {m}", file=sys.stderr)
        for m in errors:
            print(f"error: {m}", file=sys.stderr)
        return 1 if errors else 0

    if args.variants is not None:
        ok = True
        for code, text in variants(read_arg(args.variants)).items():
            ok = report(code, FRAMINGS[code][0], text, args.cap) and ok
        return 0 if ok else 1

    if not args.text:
        parser.print_usage()
        print("Usage: python generate-prompts.py 'scene description or synopsis'")
        return 0
    scene = " ".join(args.text)

    if args.max_density:
        try:
            out = max_density(scene, {n: getattr(args, n) for n in SLOTS}, args.lock)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2
        unset = [n for n in SLOTS if not getattr(args, n)]
        if unset:
            print(f"note: house defaults used for {', '.join(unset)}; replace them before generating", file=sys.stderr)
        ok = True
        for code, text in out.items():
            ok = report(code, FRAMINGS[code][0], text, args.cap) and ok
        return 0 if ok else 1

    for i, p in enumerate(generate_prompts(scene), 1):
        print(f"Prompt {i}:\n{p}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
