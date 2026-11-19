# Scripts

TypeScript codegen for the React hub, plus stdlib Python helpers for prompts and episode scaffolding.

## TypeScript (typechecked by `tsc -b`)

| Script                             | npm                                       | Purpose                                                          |
| ---------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `content-index/index.ts`           | `npm run codegen` / `codegen:check`       | Zod-validate `content/` + `songs/`, emit `src/data/generated/`   |
| `content-index/emit-agent-docs.ts` | `npm run agent-docs` / `agent-docs:check` | Emit `public/llms.txt`, `llms-full.txt`, `sitemap.xml`           |
| `content-index/migrate-from-ts.ts` | `npm run migrate:content`                 | One-time legacy export (do not use for new work)                 |
| `check-index-encoding.ts`          | part of `npm run build`                   | Dist `index.html` must be UTF-8 without BOM/`<base>` (read-only) |
| `emit-link-index.ts`               | part of `npm run build`                   | Write `dist/1ink.1ink` (UTF-16 LE copy of `index.html`)          |
| `check-bundle-size.ts`             | `npm run build:check` / CI                | Main JS chunk size gate                                          |

ESLint and Prettier cover `scripts/` (generated files under `src/data/generated/` stay ignored).

## Python (stdlib only)

| Script                        | Purpose                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `generate-prompts.py`         | Three Grok Imagine variations (wide / close-up / action) from a scene string |
| `xai-generate.py`             | One xAI Grok Imagine image (`XAI_API_KEY`); `--retries`, `--json-log`        |
| `xai-batch.py`                | Every segment of one cutaway → `images/<name>/` + `manifest.json`            |
| `xai_api.py`                  | Shared client for the two above (retries, cost, atomic writes); not a CLI    |
| `assemble-daisy-slideshow.py` | ffmpeg slideshow over `songs/Daisy+Bell.mp3`                                 |
| `create_episode.py`           | Scaffold `episodes/episode-NN/` from `templates/`                            |
| `eyewash_idents_generator.py` | Markdown table for EyeWash idents                                            |
| `cat_pov_generator.py`        | Markdown outline for a cat-POV cutaway                                       |

```bash
python3 scripts/generate-prompts.py "night desert, laser serpent"
python3 scripts/create_episode.py 05 "Title"
python3 scripts/xai-batch.py prompts/glam-sham-poo-segments.md --dry-run
python3 -m unittest discover -s scripts/tests        # or: npm run test:py
```

`xai-batch.py` takes a `prompts/*-segments.md` file or a cutaway id, reads the segments (and their
ids) from the generated catalog, and writes one still per segment plus a manifest. It skips what
exists, what has no Grok prompt and what still has a `[PLACEHOLDER]`. Full behaviour and flags:
the script header, and [AGENTS.md](../AGENTS.md#batch-generating-cutaway-stills-xai-batchpy).

There is no `srt-tools.py` or `update-index.py`.

`deploy_storage.py` is a manual VPS deploy (`DEPLOY_TOKEN`, needs `pip install requests`); CI does not use it. Keep new Python tools dependency-free. Keep new hub logic in TypeScript.
