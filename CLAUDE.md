# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**weeks_of_fire** is a short film series combining musical cutaways with tracks from Minimax Music and visuals generated with Grok Imagine / x.ai. The repository is structured to keep production content organized and the clone lightweight.

### Key Principles
- **Respect the artistic vision**: This is a personal creative project with a specific cinematic and musical direction
- **Keep the repo lightweight**: All media files (images, videos) are externally hosted with links; only text content and small reference files are versioned
- **Production hub first**: The `index.html` serves as a live review page for collaborators and stakeholders

## Repository Structure

### Core Directories

**`episodes/`** — One subfolder per episode  
- `episode-N/synopsis.md` — narrative and tone overview
- `episode-N/scenes.md` — detailed 10-second segment descriptions for visual planning
- `episode-N/subtitles.srt` — timed transcript (SRT format for consistency)
- Media files (images, audio) stored here, but link to external hosting in markdown

**`characters/`** — Character profiles, reference images, emotional arcs  

**`songs/`** — Track lists, licensing info, Minimax Music track notes  

**`ideas/`** — Raw brainstorming, backlog, story concepts, unused ideas  

**`prompts/`** — All Grok Imagine prompts organized by episode for easy regeneration  

**`scripts/`** — Python automation tools:
  - `generate-prompts.py` — Turn a synopsis into batch Grok Imagine prompts
  - `srt-tools.py` — Validate and fix SRT timing/formatting
  - `update-index.py` — Auto-regenerate index.html (future)

**`templates/`** — Boilerplate files (synopsis-template.md, etc.) for new episodes  

**`docs/`** — Production logs, external references, crew notes  

## Common Development Tasks

### Generate Grok Imagine Prompts
```bash
python scripts/generate-prompts.py "your scene description"
```
Outputs three variations: wide shot, close-up, and dynamic action. Use these as starting points for Grok Imagine generation.

### Update/Create Episode Files
1. Create `episodes/episode-N/` folder (if new)
2. Add `synopsis.md` — 1-2 paragraphs of narrative tone and emotional beats
3. Add `scenes.md` — Break into 10-second segments with visual descriptions
4. Add `subtitles.srt` — Timed transcript in SRT format (00:00:00,000 --> 00:00:10,000)
5. Link external media in markdown using `![Alt](https://external-url)`

### Work with Subtitles
```bash
python scripts/srt-tools.py episodes/episode-01/subtitles.srt --validate
python scripts/srt-tools.py episodes/episode-01/subtitles.srt --fix-timing
```

### View the Production Hub
Open `index.html` in a browser to see the live review page. It's automatically served on GitHub Pages at https://ford442.github.io/weeks_of_fire when Pages is enabled.

### Commit and Push
```bash
bash git.sh  # Pulls latest, stages all, commits with "push fix", pushes
```
Or use git commands directly: `git add . && git commit -m "message" && git push`

## Media Management

**External Hosting Only** (keep repo <50MB)
- Upload Grok Imagine images/videos to Google Drive or Imgur
- Copy the public share link
- Embed in `.md` files as: `![Scene name](https://drive.google.com/...)`

**Local Reference Files Only**
- Character reference images (small, under 500KB)
- Audio files for Episode 3+ (or keep these external too)
- Placeholder images/screenshots for documentation

## Code Standards

- **Markdown**: Use consistent formatting in synopses and scenes; keep line length ~80 chars for readability
- **SRT Format**: Strict validation — timecode format `HH:MM:SS,mmm`, blank lines between entries, no gaps
- **Python Scripts**: Lightweight, well-commented, no dependencies beyond stdlib
- **Commit Messages**: Short and descriptive (e.g., "feat: add Episode 3 scenes", "fix: srt timing", "docs: update production log")

## GitHub Pages Setup

1. Go to repository **Settings** → **Pages**
2. Set source to **Deploy from a branch**
3. Select **main** branch, **root folder**
4. Save — site builds in ~1 min and appears at https://ford442.github.io/weeks_of_fire

The production hub is your live review surface. Update it when:
- New synopses are ready
- Visual direction shifts
- Collaborators need to see current state

## Workflows

### Adding a New Episode
1. Create `episodes/episode-N/` folder
2. Copy from `templates/synopsis-template.md` → `synopsis.md`
3. Draft 2-3 paragraph synopsis capturing tone and arc
4. Create `scenes.md` with 10-second segment descriptions
5. Create placeholder `subtitles.srt`
6. Commit: `git add episodes/episode-N && git commit -m "feat: add Episode N structure"`

### Iterating on a Scene
1. Update `episodes/episode-N/scenes.md` with new descriptions
2. Run `python scripts/generate-prompts.py "updated scene"` to get Grok prompts
3. Save prompts to `prompts/episode-N-prompts.md`
4. Share refined prompts with visual team or feed to Grok
5. Commit: `git add prompts/ episodes/episode-N/scenes.md && git commit -m "refine: Episode N scene descriptions"`

### Publishing Updates to Review Page
1. Update `index.html` with new episode links or status
2. Or let collaborators pull latest and refresh in browser (they see live .md files via GitHub)
3. Commit and push
4. Page updates within seconds (or minutes if Pages rebuild is queued)

## Notes for Collaborators

- **Artistic Direction**: Refer to `grok.md` for Grok AI guidelines and `README.md` for project context
- **Production Log**: Check `docs/production-log.md` for recent decisions and blockers
- **Media References**: All external links should be public; test them before committing
- **Episode Templates**: Use `templates/synopsis-template.md` as a starting point to ensure consistency
- **Questions about structure?** See `STRUCTURE.md` for detailed folder explanations

## Troubleshooting

**SRT validation fails**  
→ Check for missing blank lines between entries, incorrect timecode format (should be `HH:MM:SS,mmm`)

**Images not loading in index.html**  
→ Verify external links are public (Google Drive shares, Imgur, etc.); test the URL directly

**GitHub Pages not updating**  
→ Ensure **Settings** → **Pages** is set to deploy from main branch; rebuilds take 1–2 min

**Python scripts fail**  
→ Ensure Python 3.8+ is installed; scripts use only stdlib (no pip install needed)

---

Made with Grok Imagine magic ✨
