"""Shared parsing and rules for the hero prompt library (stdlib only; not a CLI).

Read by scripts/check-hero-prompts.py (the checker) and scripts/generate-prompts.py (the
max-density builder). The rules themselves are documented in prompts/README.md, "Hero prompts";
this module is what makes them mechanical.

Layout it reads:

  prompts/locks/<stem>.lock.md   one lock file per character / place
      **Trigger words:** Vivienne, Liliane      (optional; any hit in a prompt requires this lock)
      ## Paste · <name>                         a paste block, referenced as `<stem>/<name>`
      ```text
      ...verbatim text pasted into every prompt that declares it...
      ```

  prompts/hero/<name>.md         one hero shot per file (README.md is the index, not a shot)
      **Shot:** H07
      ### W · Wide                              one heading per framing (letter · label)
      - **Locks:** `pizza-guy-identity/full`, `house-negative/still`
      - **Characters:** 2,914 / 3,500 cap
      ```text
      ...one paragraph...
      ```
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LOCKS_DIR = REPO_ROOT / "prompts" / "locks"
HERO_DIR = REPO_ROOT / "prompts" / "hero"
HERO_INDEX = HERO_DIR / "README.md"

# xAI publishes no prompt-length limit for POST /v1/images/generations (checked 2026-11-21:
# docs.x.ai's image guide only says pricing is flat "regardless of prompt length"). So the cap
# is a house number, not the API's: long enough for a full hero frame, short enough that the
# last clause still lands. Override per run with --cap when a model with a real limit is used.
HOUSE_CAP = 3500
FLOOR = 1200  # below this it is not a hero prompt; error
TARGET = 1500  # below this, warn: the shot has room it is not using

# Rule 5: no aesthetic adjective on its own. These words describe a reaction, not a material
# or a light behavior, so they are banned outright. Say what the light or the surface does.
EMPTY_ADJECTIVES = (
    "stunning",
    "beautiful",
    "gorgeous",
    "breathtaking",
    "masterpiece",
    "amazing",
    "awesome",
    "epic",
    "majestic",
    "ethereal",
    "dreamy",
    "mesmerizing",
    "trending on artstation",
    "best quality",
    "8k",
    "4k",
    "ultra hd",
)

# Same token xai-batch.py refuses to send: a bracketed ALL-CAPS slot nobody filled.
PLACEHOLDER = re.compile(r"\[[A-Z][A-Z0-9 _/'-]{1,30}\]")

PASTE_HEADING = re.compile(r"^## Paste · ([a-z0-9][a-z0-9-]*)\s*$")
FRAMING_HEADING = re.compile(r"^### ([A-Z]) · (.+?)\s*$")
SHOT_LINE = re.compile(r"^\*\*Shot:\*\*\s*(H\d{2})\b")
TRIGGER_LINE = re.compile(r"^\*\*Trigger words:\*\*\s*(.+)$")
LOCKS_LINE = re.compile(r"^- \*\*Locks:\*\*\s*(.+)$")
CHARS_LINE = re.compile(r"^- \*\*Characters:\*\*\s*(.*)$")
LOCK_REF = re.compile(r"`([a-z0-9-]+/[a-z0-9-]+)`")


@dataclass
class LockFile:
    stem: str
    path: Path
    triggers: list[str] = field(default_factory=list)
    blocks: dict[str, str] = field(default_factory=dict)  # name -> verbatim text


@dataclass
class Framing:
    code: str  # W / M / C (or H / V / S for key art)
    label: str
    locks: list[str]
    chars_line: int  # 0-based index of the "- **Characters:**" line in the file, or -1
    chars_text: str
    prompt: str
    line: int  # 1-based line of the heading, for messages

    @property
    def length(self) -> int:
        return len(self.prompt)


@dataclass
class HeroFile:
    path: Path
    shot: str
    title: str
    framings: list[Framing]
    lines: list[str]


def _fenced_text(lines: list[str], start: int) -> tuple[str | None, int]:
    """Return (text, index after closing fence) for the first ```text fence at or after start."""
    i = start
    while i < len(lines) and lines[i].strip() != "```text":
        if lines[i].startswith("#"):
            return None, i
        i += 1
    if i >= len(lines):
        return None, i
    body: list[str] = []
    i += 1
    while i < len(lines) and lines[i].strip() != "```":
        body.append(lines[i])
        i += 1
    return "\n".join(body).strip(), i + 1


def load_locks(locks_dir: Path = LOCKS_DIR) -> dict[str, LockFile]:
    locks: dict[str, LockFile] = {}
    for path in sorted(locks_dir.glob("*.lock.md")):
        stem = path.name[: -len(".lock.md")]
        lock = LockFile(stem=stem, path=path)
        lines = path.read_text(encoding="utf-8").splitlines()
        i = 0
        while i < len(lines):
            line = lines[i]
            trig = TRIGGER_LINE.match(line)
            if trig:
                lock.triggers = [t.strip() for t in trig.group(1).split(",") if t.strip()]
            paste = PASTE_HEADING.match(line)
            if paste:
                text, i = _fenced_text(lines, i + 1)
                if text is not None:
                    lock.blocks[paste.group(1)] = text
                continue
            i += 1
        locks[stem] = lock
    return locks


def lock_text(locks: dict[str, LockFile], ref: str) -> str | None:
    stem, _, name = ref.partition("/")
    lock = locks.get(stem)
    return lock.blocks.get(name) if lock else None


def parse_hero(path: Path) -> HeroFile:
    lines = path.read_text(encoding="utf-8").splitlines()
    shot = ""
    title = ""
    framings: list[Framing] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not title and line.startswith("# "):
            title = line[2:].strip()
        m = SHOT_LINE.match(line)
        if m and not shot:
            shot = m.group(1)
        head = FRAMING_HEADING.match(line)
        if head:
            heading_line = i + 1
            locks: list[str] = []
            chars_line, chars_text = -1, ""
            j = i + 1
            while j < len(lines) and lines[j].strip() != "```text" and not lines[j].startswith("#"):
                lm = LOCKS_LINE.match(lines[j])
                if lm:
                    locks = LOCK_REF.findall(lm.group(1))
                cm = CHARS_LINE.match(lines[j])
                if cm:
                    chars_line, chars_text = j, cm.group(1)
                j += 1
            text, after = _fenced_text(lines, j)
            framings.append(
                Framing(
                    code=head.group(1),
                    label=head.group(2),
                    locks=locks,
                    chars_line=chars_line,
                    chars_text=chars_text,
                    prompt=text or "",
                    line=heading_line,
                )
            )
            i = max(after, i + 1)
            continue
        i += 1
    return HeroFile(path=path, shot=shot, title=title, framings=framings, lines=lines)


def hero_files(hero_dir: Path = HERO_DIR) -> list[Path]:
    return sorted(p for p in hero_dir.glob("*.md") if p.name != "README.md")


def chars_label(length: int, cap: int = HOUSE_CAP) -> str:
    return f"{length:,} / {cap:,} cap"


def length_problems(length: int, cap: int = HOUSE_CAP) -> tuple[list[str], list[str]]:
    """(errors, warnings) for a prompt of this many characters."""
    errors: list[str] = []
    warnings: list[str] = []
    if length > cap:
        errors.append(f"{length:,} characters is over the {cap:,} cap; cut background layers first")
    elif length < FLOOR:
        errors.append(f"{length:,} characters is under the {FLOOR:,} floor for a hero prompt")
    elif length < TARGET:
        warnings.append(f"{length:,} characters is under the {TARGET:,} target")
    return errors, warnings


def word_hits(text: str, words: list[str] | tuple[str, ...]) -> list[str]:
    hits = []
    for word in words:
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(word)}(?![A-Za-z0-9])", text, re.IGNORECASE):
            hits.append(word)
    return hits


def check(
    locks: dict[str, LockFile],
    heroes: list[HeroFile],
    cap: int = HOUSE_CAP,
) -> tuple[list[str], list[str]]:
    """Every rule in prompts/README.md "Hero prompts" that a script can see. (errors, warnings)."""
    errors: list[str] = []
    warnings: list[str] = []
    if "house-negative" not in locks:
        errors.append("prompts/locks/house-negative.lock.md is missing")
    for stem, lock in locks.items():
        if not lock.blocks:
            errors.append(f"{lock.path.name}: no '## Paste · <name>' blocks")
        for name, text in lock.blocks.items():
            if "\n\n" in text:
                errors.append(f"{stem}/{name}: a paste block must be one paragraph")
    shots: dict[str, Path] = {}
    for hero in heroes:
        rel = hero.path.name
        if not hero.shot:
            errors.append(f"{rel}: missing '**Shot:** Hnn' line")
        elif hero.shot in shots:
            errors.append(f"{rel}: shot id {hero.shot} already used by {shots[hero.shot].name}")
        else:
            shots[hero.shot] = hero.path
        if len(hero.framings) < 3:
            errors.append(f"{rel}: {len(hero.framings)} framings; a hero shot needs three")
        codes = [f.code for f in hero.framings]
        if len(set(codes)) != len(codes):
            errors.append(f"{rel}: duplicate framing letters {codes}")
        for f in hero.framings:
            where = f"{rel}:{f.line} {hero.shot}-{f.code}"
            if not f.prompt:
                errors.append(f"{where}: no ```text prompt under the heading")
                continue
            if "\n" in f.prompt:
                errors.append(f"{where}: the prompt must be one paragraph (one line)")
            if f.chars_line < 0:
                errors.append(f"{where}: missing '- **Characters:**' line")
            elif f.chars_text.strip() != chars_label(f.length, cap):
                errors.append(
                    f"{where}: Characters line says '{f.chars_text.strip()}', prompt is "
                    f"{chars_label(f.length, cap)} (run with --write)"
                )
            e, w = length_problems(f.length, cap)
            errors += [f"{where}: {m}" for m in e]
            warnings += [f"{where}: {m}" for m in w]
            if not f.locks:
                errors.append(f"{where}: missing '- **Locks:**' line")
            if not any(ref.startswith("house-negative/") for ref in f.locks):
                errors.append(f"{where}: every hero prompt declares a house-negative block")
            for ref in f.locks:
                text = lock_text(locks, ref)
                if text is None:
                    errors.append(f"{where}: unknown lock `{ref}`")
                elif text not in f.prompt:
                    errors.append(f"{where}: lock `{ref}` is declared but not pasted verbatim")
            declared_stems = {ref.split("/", 1)[0] for ref in f.locks}
            for stem, lock in locks.items():
                if stem in declared_stems or not lock.triggers:
                    continue
                hits = word_hits(f.prompt, lock.triggers)
                if hits:
                    errors.append(
                        f"{where}: mentions {', '.join(repr(h) for h in hits)} without a "
                        f"`{stem}/…` lock"
                    )
            bad = word_hits(f.prompt, EMPTY_ADJECTIVES)
            if bad:
                errors.append(f"{where}: empty adjectives {bad}; describe the light or material")
            if PLACEHOLDER.search(f.prompt):
                errors.append(f"{where}: unfilled placeholder {PLACEHOLDER.search(f.prompt).group(0)}")
    return errors, warnings


def find_prompt(heroes: list[HeroFile], ref: str) -> str | None:
    """`H07-M` -> that framing's prompt text."""
    shot, _, code = ref.upper().partition("-")
    for hero in heroes:
        if hero.shot == shot:
            for f in hero.framings:
                if f.code == code:
                    return f.prompt
    return None


INDEX_START = "<!-- hero-index:start -->"
INDEX_END = "<!-- hero-index:end -->"


def index_table(heroes: list[HeroFile], cap: int = HOUSE_CAP) -> str:
    rows = [
        "| Shot | File | Framing | Characters | Locks |",
        "| --- | --- | --- | ---: | --- |",
    ]
    for hero in sorted(heroes, key=lambda h: h.shot):
        for f in hero.framings:
            locks = ", ".join(f"`{r}`" for r in f.locks if not r.startswith("house-negative/"))
            rows.append(
                f"| {hero.shot}-{f.code} | [{hero.path.name}]({hero.path.name}) | {f.label} "
                f"| {f.length:,} | {locks or '—'} |"
            )
    lengths = [f.length for h in heroes for f in h.framings]
    if lengths:
        rows.append("")
        rows.append(
            f"{len(lengths)} prompts · shortest {min(lengths):,} · longest {max(lengths):,} · "
            f"mean {round(sum(lengths) / len(lengths)):,} characters · house cap {cap:,}."
        )
    return "\n".join(rows)
