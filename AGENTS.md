# AGENTS.md — weeks_of_fire

> Read this first if you are an AI coding agent working on this repository.

---

## Project Overview

`weeks_of_fire` is a **creative short-film series production hub**. It is **not** a traditional software application or web service. The project organizes synopses, subtitles, music metadata, AI-generated image prompts, and a single static HTML page for production review.

- **Concept**: A personal short-film series that blends musical cutaways (Minimax Music), AI-generated visuals (Grok Imagine / x.ai), and narrative scenes.
- **Live hub**: `https://ford442.github.io/weeks_of_fire` (GitHub Pages from repo root).
- **Creative guide**: See `grok.md` for artistic direction and common creative tasks.

---

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Presentation | HTML5 + CSS3 | Single file: `index.html`. No JavaScript framework. Uses Google Fonts (Inter, Playfair Display). |
| Automation | Python 3 | One helper script (`scripts/generate-prompts.py`). No dependencies. |
| Documentation | Markdown | All creative content, synopses, logs, and song lyrics are Markdown. |
| Subtitles | SRT | Standard SubRip format. |
| Version Control | Git | No hooks, no CI/CD, no GitHub Actions. |

**Important**: There is **no build system**, **no package manager**, and **no configuration file** such as `package.json`, `pyproject.toml`, `Cargo.toml`, etc. Do not add one unless explicitly asked.

---

## Directory Layout

```
weeks_of_fire/
├── episodes/           # One subfolder per episode
│   ├── episode-01/     # synopsis.md, subtitles.srt, transcript files
│   ├── episode-02/
│   └── episode-03/     # Also contains scenes.md, laser_snakes.md, and some binary assets
├── characters/         # Character reference images (webp, jpg, png)
├── songs/              # Music tracks (mp3) + lyrics/style descriptions (md)
├── ideas/              # Raw brainstorming, backlog, concepts
├── scripts/            # Lightweight Python automation tools
├── prompts/            # Grok Imagine prompts for reproducibility
├── templates/          # Starter files for new episodes
├── docs/               # Production logs and references
├── index.html          # Cinematic production hub page (GitHub Pages entry point)
├── grok.md             # Creative AI assistant guide (artistic direction)
├── git.sh              # One-liner push helper
├── README.md           # Human-facing project intro
└── STRUCTURE.md        # Human-facing directory explanation
```

### Key files per episode
Each `episodes/episode-NN/` folder typically contains:
- `synopsis.md` — Scene-by-scene breakdown. Uses **YAML frontmatter** with keys: `title`, `episode`, `status`, `runtime_approx`.
- `subtitles.srt` — Subtitle file. Often a placeholder copied from `templates/subtitles-template.srt`.
- `NoteGPT_TRANSCRIPT_Weeks on Fire - Episode NN.srt` — Full transcript export.
- `NoteGPT_TRANSCRIPT_Weeks on Fire - Episode NN.txt` — Plain-text transcript export.

Episode 03 is the most developed example: it includes `scenes.md` (detailed scene breakdowns with Grok Imagine prompts per shot) and `laser_snakes.md`.

---

## File Formats and Conventions

### Markdown with YAML frontmatter (synopses)
```markdown
---
title: "Episode 1"
episode: 1
status: "synopsis ready / srt placeholder"
runtime_approx: "~4 min"
---

# Episode 1 — Synopsis
```

### SRT subtitles
Follow the standard SubRip format:
```
1
00:00:00,000 --> 00:00:05,000
[Opening music sting]
```

### Media storage policy
The repository **prefers external hosting** for all media (images, audio, video) to keep clones fast. Use public links (Google Drive, Imgur, etc.) and reference them in Markdown or `index.html`. Some binary files are already committed (e.g., `songs/*.mp3`, `episodes/episode-03/*.wav`, `characters/*`), but avoid adding more large binaries without explicit user approval.

### Language
All documentation, comments, and code are in **English**.

---

## Build, Test, and Deploy

### Build
There is no build step. `index.html` is served as-is.

### Local preview
Open `index.html` directly in a browser, or run any static file server from the repo root:
```bash
python3 -m http.server 8000
```

### Testing
There are no automated tests. Validate changes manually:
- Open `index.html` and check layout/responsiveness.
- Verify `synopsis.md` files render correctly as Markdown.
- Check SRT files for valid timing syntax.

### Deploy
Deployment is through **GitHub Pages**:
1. Push changes to the `main` branch.
2. GitHub Pages deploys automatically from the root folder.

A helper script exists for quick pushes:
```bash
bash git.sh
```
Note: `git.sh` uses the hard-coded message `"push fix"`. For meaningful commits, use standard `git commit` instead.

---

## Code Style Guidelines

### Python scripts
- Keep scripts **lightweight and dependency-free**.
- Include a module docstring explaining usage.
- Accept CLI arguments via `sys.argv` (the existing script does this).
- Print human-readable output to stdout.

### HTML/CSS
- The `index.html` uses inline styles within a single `<style>` block. This is intentional to avoid extra HTTP requests.
- Prefer semantic HTML and simple CSS Grid / Flexbox for layout.
- When adding new episode cards, copy the existing card pattern inside the `asset-grid` container.

### Markdown
- Use consistent header levels (`#` for title, `##` for sections, `###` for sub-sections).
- Preserve YAML frontmatter exactly as shown in existing synopses.

---

## How to Add a New Episode

1. **Create folder**: `mkdir episodes/episode-04`
2. **Copy templates**:
   ```bash
   cp templates/synopsis-template.md episodes/episode-04/synopsis.md
   cp templates/subtitles-template.srt episodes/episode-04/subtitles.srt
   ```
3. **Fill in content**: Edit `synopsis.md` with YAML frontmatter and scene breakdowns. Update `subtitles.srt` with timed transcripts.
4. **Update `index.html`**: Add a new episode card in the Episodes section, mirroring the existing card structure.
5. **Commit and push**.

---

## Security and Size Considerations

- **Do not commit secrets** (API keys, tokens, passwords). The project currently has none.
- **Avoid bloating the repo**: Do not commit large video files, high-resolution image batches, or uncompressed audio. Link externally instead.
- **No server-side code**: Everything is static. There are no databases, auth systems, or backend services.

---

## Relationship to `grok.md`

- **`grok.md`** is the **creative** AI assistant guide. It covers artistic vision, asset management storytelling, and visual polish.
- **`AGENTS.md`** (this file) is the **technical** guide. It covers repository structure, conventions, and how to make safe code changes.

When in doubt about creative direction, consult `grok.md`. When in doubt about where to put a file or how to edit safely, consult this file.

---

## Quick Reference

| Task | Command / Location |
|------|-------------------|
| Preview site locally | `python3 -m http.server 8000` then open `http://localhost:8000` |
| Generate image prompts | `python3 scripts/generate-prompts.py "scene description"` |
| Add new episode | Copy `templates/synopsis-template.md` + `subtitles-template.srt` into `episodes/episode-NN/` |
| Update production hub | Edit `index.html` directly |
| Quick git push | `bash git.sh` (uses message `"push fix"`) |
| Production log | `docs/production-log.md` |
