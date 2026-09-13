# Fictional Staff Portraits — Weeks on Fire

Grok Imagine portraits for the series crew (added 2026-07-22).

Hosted on the Contabo FTP deploy (`test.1ink.us`) under `public/cast/`, so they ship with every `npm run build` + `python deploy.py`. Google Drive hotlinks were unreliable in browsers.

| Staff | Role | Image (relative) | Live FTP URL |
|-------|------|------------------|--------------|
| **Mara Vell** | Writer | `./cast/mara-vell.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/mara-vell.jpg) |
| **Julian Rook** | Producer | `./cast/julian-rook.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/julian-rook.jpg) |
| **Soren Kade** | Director | `./cast/soren-kade.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/soren-kade.jpg) |
| **Nova Chen** | Music Supervisor | `./cast/nova-chen.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/nova-chen.jpg) |
| **Elio Marsh** | Visual Designer | `./cast/elio-marsh.jpg` | [view](https://test.1ink.us/weeks-on-fire/cast/elio-marsh.jpg) |

These are wired into `content/staff.json` (`imageFile`) and rendered in the Crew section of the production hub. Source files live in `public/cast/` and are copied into `dist/cast/` on build.

Made with Grok Imagine magic ✨
