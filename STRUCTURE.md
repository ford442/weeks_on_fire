# weeks_of_fire Repository Structure

This document explains the organized layout for the short film series production hub.

## Core Folders

- `episodes/` – One subfolder per episode with synopsis, subtitles, scenes, and prompts
- `characters/` – Character profiles, reference images, and prompts
  - `characters/bible/` – **Character bible**: committed sheets for the on-screen cast (appearance anchors, personality matrix, voice guide, committed backstory, tone rules). Index and template: [`characters/bible/README.md`](characters/bible/README.md). Pairings: [`characters/bible/relationship-map.md`](characters/bible/relationship-map.md)
  - `characters/suggested-characters.md` – staging area for new character seeds; graduated entries link into `bible/`
  - `characters/the-two.md`, `characters/building-cast.md`, `characters/riley-smith.md` – overview / cluster files
  - Fictional **crew** (not cast) lives in `content/staff.json` + `characters/staff-portraits.md`
- `songs/` – Track lists, licensing, and music notes

## New Organizational Folders

- `ideas/` – Raw brainstorming, concepts, backlog
- `notes/` – **Quick-capture workspace** for scratchpad, scene suggestions, song ideas, and image prompt captures. Low-friction area to write new scenes, songs, and visuals before promoting to polished folders.
- `scripts/` – Automation tools (Python/shell)
- `prompts/` – All Grok Imagine prompts for easy reuse/regeneration
- `templates/` – Consistent starting files for new episodes
- `docs/` – Production logs and external references

## Why this structure?
Keeps creative chaos separate from polished production files while making everything easy to find and scale as the series grows. The new `notes/` folder specifically makes it more convenient and productive to brainstorm and draft new scenes, songs, and Grok Imagine visuals on the fly.

See individual README.md files in each folder (especially `notes/README.md`) for details and workflows.

Made with Grok Imagine magic ✨