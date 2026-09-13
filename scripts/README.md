# Scripts

TypeScript codegen for the React hub, plus stdlib Python helpers for prompts and episode scaffolding.

## TypeScript (typechecked by `tsc -b`)

| Script                             | npm                                       | Purpose                                                        |
| ---------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `content-index/index.ts`           | `npm run codegen` / `codegen:check`       | Zod-validate `content/` + `songs/`, emit `src/data/generated/` |
| `content-index/emit-agent-docs.ts` | `npm run agent-docs` / `agent-docs:check` | Emit `public/llms.txt`, `llms-full.txt`, `sitemap.xml`         |
| `content-index/migrate-from-ts.ts` | `npm run migrate:content`                 | One-time legacy export (do not use for new work)               |
| `check-index-encoding.ts`          | part of `npm run build`                   | Dist `index.html` must be UTF-8 without BOM/`<base>`           |
| `check-bundle-size.ts`             | `npm run build:check` / CI                | Main JS chunk size gate                                        |

ESLint and Prettier cover `scripts/` (generated files under `src/data/generated/` stay ignored).

## Python (stdlib only)

| Script                        | Purpose                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `generate-prompts.py`         | Three Grok Imagine variations (wide / close-up / action) from a scene string |
| `xai-generate.py`             | xAI Grok Imagine HTTP client (`XAI_API_KEY`)                                 |
| `assemble-daisy-slideshow.py` | ffmpeg slideshow over `songs/Daisy+Bell.mp3`                                 |
| `create_episode.py`           | Scaffold `episodes/episode-NN/` from `templates/`                            |
| `eyewash_idents_generator.py` | Markdown table for EyeWash idents                                            |
| `cat_pov_generator.py`        | Markdown outline for a cat-POV cutaway                                       |

```bash
python3 scripts/generate-prompts.py "night desert, laser serpent"
python3 scripts/create_episode.py 05 "Title"
```

There is no `srt-tools.py` or `update-index.py`.

Keep new Python tools dependency-free. Keep new hub logic in TypeScript.
