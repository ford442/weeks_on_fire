#!/usr/bin/env python3
"""Assemble Daisy Bell stills into a timed MP4 over songs/Daisy+Bell.mp3.

Cue map follows ideas/daisy-bell-timing.md (energy-based form).

For any other cutaway use scripts/assemble-cutaway.py (docs/cutaway-assembly.md).

Usage:
  python3 scripts/assemble-daisy-slideshow.py
  # output: videos/daisy-bell-slideshow.mp4
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SONG = ROOT / "songs" / "Daisy+Bell.mp3"
IMG = ROOT / "images" / "daisy-bell"
OUT = ROOT / "videos" / "daisy-bell-slideshow.mp4"
WORK = Path("/tmp/daisy_slides")

# (start_s, end_s, image filename or None for black)
SLIDES = [
    (0.00, 8.00, "db-xai-01-tandem-field.jpg"),
    (8.00, 18.00, "db-01-field-tandem.webp"),
    (18.00, 28.00, "db-g01-open-road-grok.jpg"),
    (28.00, 41.00, "db-02-first-grain.webp"),
    (41.00, 58.00, "db-xai-03-bw-scratch.jpg"),
    (58.00, 75.00, "db-p02-carriage-beggars.webp"),
    (75.00, 100.00, "db-g03-bw-fleet-grain-grok.jpg"),
    (100.00, 118.00, "db-xai-02-london-tandem.jpg"),
    (118.00, 140.00, "db-x01-crowded-downtown.webp"),
    (140.00, 155.00, "db-p03-stylish-glance.webp"),
    (155.00, 170.00, "db-x03-open-road-flowers.webp"),
    (170.00, 185.00, "db-p01-wide-grain-entry.webp"),
    (185.00, 200.00, "db-p04-street-hd-color.webp"),
    (200.00, 215.00, "db-g05-field-to-london-edit.jpg"),
    (215.00, 223.00, "db-p05-flower-girl-doubletake.webp"),
    (223.00, 225.00, "db-g04-gyre-street-hybrid-grok.jpg"),
    (225.00, 243.00, "db-g02-london-crowded-grok.jpg"),
    (243.00, 245.00, None),
    (245.00, 258.50, "db-01-field-tandem.webp"),
    (258.50, 260.26, "db-xai-01-tandem-field.jpg"),
]

W, H, FPS = 1280, 720, 24


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1200:], file=sys.stderr)
        raise SystemExit(f"command failed: {' '.join(cmd[:6])}...")


def main() -> None:
    if not SONG.exists():
        raise SystemExit(f"missing song: {SONG}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)

    black = WORK / "black.png"
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=black:s={W}x{H}:d=1",
            "-frames:v",
            "1",
            str(black),
        ]
    )

    clips: list[Path] = []
    for i, (start, end, name) in enumerate(SLIDES):
        dur = round(end - start, 3)
        clip = WORK / f"clip_{i:02d}.mp4"
        src = black if name is None else IMG / name
        if not src.exists():
            raise SystemExit(f"missing image: {src}")
        vf = (
            f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
            f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black,"
            f"setsar=1,fps={FPS},format=yuv420p"
        )
        print(f"[{i+1}/{len(SLIDES)}] {start:.1f}-{end:.1f}s  {name or 'BLACK'}", flush=True)
        run(
            [
                "ffmpeg",
                "-y",
                "-loop",
                "1",
                "-i",
                str(src),
                "-t",
                str(dur),
                "-vf",
                vf,
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "18",
                "-pix_fmt",
                "yuv420p",
                "-an",
                str(clip),
            ]
        )
        clips.append(clip)

    lst = WORK / "list.txt"
    lst.write_text("".join(f"file '{c}'\n" for c in clips))
    concat_vid = WORK / "video_only.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(concat_vid)])
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(concat_vid),
            "-i",
            str(SONG),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(OUT),
        ]
    )

    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration,size",
            "-of",
            "json",
            str(OUT),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(probe.stdout)
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1e6:.1f} MB, {info['format'].get('duration')}s)")


if __name__ == "__main__":
    main()
