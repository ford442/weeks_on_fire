# Fictional Staff Portraits — Weeks on Fire

Grok Imagine portraits for the series crew (added 2026-07-22).

Hosted on the Contabo FTP deploy (`test.1ink.us`) under `public/cast/`, so they ship with every `npm run build` + `python3 scripts/deploy_storage.py`. Google Drive hotlinks were unreliable in browsers.

| Staff | Role | Image (relative) | Live FTP URL |
|-------|------|------------------|--------------|
| **Mara Vell** | Writer | `./cast/mara-vell.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/mara-vell.jpg) |
| **Julian Rook** | Producer | `./cast/julian-rook.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/julian-rook.jpg) |
| **Soren Kade** | Director | `./cast/soren-kade.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/soren-kade.jpg) |
| **Nova Chen** | Music Supervisor | `./cast/nova-chen.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/nova-chen.jpg) |
| **Elio Marsh** | Visual Designer | `./cast/elio-marsh.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/elio-marsh.jpg) |
| **Roley Voss** | Animation (Marble Tick Tack) | **pending** — no portrait yet | — |
| **Juno Halverd** | Stage Lighting Orchestrator (lasers) | **pending** — no portrait yet | — |

These are wired into `content/staff.json` (`imageFile`) and rendered in the Crew section of the production hub. Source files live in `public/cast/` and are copied into `dist/cast/` on build.

**Roley Voss** is not in `content/staff.json` and does not render in the Crew view until a real portrait exists. Long-form crew pages for all seven: [`../docs/crew/`](../docs/crew/README.md).

Made with Grok Imagine magic ✨

## Portrait prompt — Juno Halverd (text only, not yet run)

Candid production portrait of a woman in her early forties at a laser console backstage, short silver-streaked dark hair, black work jacket with rolled sleeves, safety goggles pushed up on her head, one hand on a fader. Behind her, through stage haze, a fan of green and violet laser beams sweeps a dark empty arena ceiling. Lit only by console LEDs and beam spill, cold green rim light, warm amber work lamp low on the desk. 35mm, shallow depth of field, grain, no beams crossing her face.
