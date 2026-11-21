#!/usr/bin/env python3
"""Check the hero prompt library: prompts/hero/*.md against prompts/locks/*.lock.md (stdlib only).

Rules (prompts/README.md, "Hero prompts"):
  * every hero file has a shot id and at least three framings (wide / medium / close)
  * every framing is one paragraph, between the floor and the cap, with a correct Characters line
  * every declared lock is pasted verbatim; a trigger word (a character's name, "pizza delivery",
    "black cat") without that character's lock is an error, so continuity cannot drift silently
  * every framing declares a house-negative block (the avoid list)
  * no empty aesthetic adjectives ("stunning", "epic", ...) and no unfilled [PLACEHOLDER]

Usage:
  python3 scripts/check-hero-prompts.py              # check; exit 1 on any error
  python3 scripts/check-hero-prompts.py --write      # also rewrite Characters lines + the index
  python3 scripts/check-hero-prompts.py --print H07-M   # print one prompt (pipe it to xai-generate)
  python3 scripts/check-hero-prompts.py --cap 3000   # check against a tighter model limit
  python3 scripts/check-hero-prompts.py --write prompts/hero/ep03-pizza-guy-porch-reveal.md
                                                     # only these files (the index is left alone)

Regenerate one still:
  python3 scripts/xai-generate.py "$(python3 scripts/check-hero-prompts.py --print H07-M)" \\
      -o images/hero/h07-m.jpg
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import hero_prompts as hp


def write_counts(hero: hp.HeroFile, cap: int) -> bool:
    changed = False
    lines = list(hero.lines)
    for f in hero.framings:
        if f.chars_line < 0 or not f.prompt:
            continue
        want = f"- **Characters:** {hp.chars_label(f.length, cap)}"
        if lines[f.chars_line] != want:
            lines[f.chars_line] = want
            f.chars_text = hp.chars_label(f.length, cap)
            changed = True
    if changed:
        hero.path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        hero.lines = lines
    return changed


def write_index(index: Path, heroes: list[hp.HeroFile], cap: int) -> bool:
    text = index.read_text(encoding="utf-8")
    start, end = text.find(hp.INDEX_START), text.find(hp.INDEX_END)
    if start < 0 or end < start:
        print(f"{index}: no {hp.INDEX_START} … {hp.INDEX_END} markers; index not written", file=sys.stderr)
        return False
    new = text[: start + len(hp.INDEX_START)] + "\n\n" + hp.index_table(heroes, cap) + "\n\n" + text[end:]
    if new != text:
        index.write_text(new, encoding="utf-8")
        return True
    return False


def index_drift(index: Path, heroes: list[hp.HeroFile], cap: int) -> bool:
    if not index.exists():
        return False
    text = index.read_text(encoding="utf-8")
    start, end = text.find(hp.INDEX_START), text.find(hp.INDEX_END)
    if start < 0 or end < start:
        return False
    current = text[start + len(hp.INDEX_START) : end].strip()
    return current != hp.index_table(heroes, cap).strip()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="*", type=Path, help="hero files to check (default: all)")
    parser.add_argument("--write", action="store_true", help="rewrite Characters lines and the hero index")
    parser.add_argument("--print", dest="print_ref", metavar="Hnn-X", help="print one prompt and exit")
    parser.add_argument("--cap", type=int, default=hp.HOUSE_CAP, help=f"character cap (default {hp.HOUSE_CAP})")
    parser.add_argument("--locks-dir", type=Path, default=hp.LOCKS_DIR, help=argparse.SUPPRESS)
    parser.add_argument("--hero-dir", type=Path, default=hp.HERO_DIR, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)

    locks = hp.load_locks(args.locks_dir)
    heroes = [hp.parse_hero(p) for p in hp.hero_files(args.hero_dir)]
    index = args.hero_dir / "README.md"
    if args.files:
        wanted = {p.resolve() for p in args.files}
        missing = wanted - {h.path.resolve() for h in heroes}
        if missing:
            print(f"Not hero files: {', '.join(sorted(str(m) for m in missing))}", file=sys.stderr)
            return 2
        heroes = [h for h in heroes if h.path.resolve() in wanted]

    if args.print_ref:
        prompt = hp.find_prompt(heroes, args.print_ref)
        if prompt is None:
            print(f"No hero prompt {args.print_ref!r} (expected like H07-M)", file=sys.stderr)
            return 2
        print(prompt)
        return 0

    if args.write:
        for hero in heroes:
            if write_counts(hero, args.cap):
                print(f"updated counts: {hero.path.name}")
        if not args.files and index.exists() and write_index(index, heroes, args.cap):
            print(f"updated index: {index.name}")

    errors, warnings = hp.check(locks, heroes, args.cap)
    if not args.files and index_drift(index, heroes, args.cap):
        errors.append(f"{index.name}: hero index is out of date (run with --write)")
    for w in warnings:
        print(f"warn: {w}", file=sys.stderr)
    for e in errors:
        print(f"error: {e}", file=sys.stderr)
    total = sum(len(h.framings) for h in heroes)
    print(
        f"{len(heroes)} hero files · {total} prompts · {len(locks)} lock files · "
        f"{len(errors)} errors · {len(warnings)} warnings"
    )
    return 1 if errors else 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
