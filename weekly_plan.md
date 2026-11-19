# Weeks on Fire — weekly plan

## Today's focus

**2026-11-18 · Fix First.** Pages deploy has failed on every main push since #180/#181 (runs 211, 212): `npm run codegen:check` rejects three orphan prompt files — `prompts/bounce-castle-segments.md`, `prompts/waterslide-segments.md`, `prompts/well-fall-locked-segments.md` — with no cutaway `segmentsSource`. The live hub is frozen on an older build until they're wired to cutaways (or the validator gets an explicit opt-out for standalone long-form prompt docs).

## Show desk

**Lens (2026-11-18): promotion & audience** (first run; rotation starts here).

1. Clip-first: cut one finished Episode 3 drop moment to a 10s vertical with the drop at 0:04, and link it to its hub Songs page. Do this only once the deploy is green, so the link shows current content.
2. The hub's deep links (`/songs`, `/episodes`, …) return HTTP 404 status (the SPA 404.html fallback renders the page, but crawlers and link previews see a 404). Fixing that is a promotion item, not just tech. See Backlog.
3. Lace Waterfall: the new music projects/albums page (#178) is the natural SoundCloud landing page. Once it deploys, add one canonical album URL to the OG/llms.txt output.

**Pipeline steering**
- Mon songs: the drawer holds 3 kid-silly drafts (Egg Xylophone, Hic Up He Goes, Eight Arms Two Mittens), so the kid-silly quota is met. Next Monday: one non-kid song built from a locked Well Fall or Bounce Castle video (video first, per docs/song-method.md).
- Thu review: review those 3 drafts. The 2026-11-17 packet was empty because nothing was `reviewed`.
- Fire **WoF · Picture ideas create**, appending: "Pair a picture plan to each of Egg Xylophone, Hic Up He Goes and Eight Arms Two Mittens, so Thursday can promote them with clips attached."

## Ideas

- Fix SPA deep-link HTTP 404s on Pages (generated per-route index.html), for SEO and link previews.
- Tie long-form segment prompt docs into a first-class "long-form" view rather than forcing a cutaway link.

## Backlog

- [Fix First] Orphan prompts break codegen:check, so the deploy is red (see Today's focus).
- Deep routes serve with status 404 (the fallback works for humans).
- MiniMax packet 2026-11-17 was empty: 3 songs stuck at `draft`.
- `wof-pipeline` branch is gone from origin after #176 merged; the next pipeline task must recreate it.

## Done

- 2026-11-18: #176 WoF pipeline (rolling) merged; #178 music projects page, #179 Well Fall/Mountain Lion long-form prompts, #180 French cabaret ideas, #181 fire girls idea bank merged.

## Last run

- 2026-11-18 · mode: Fix First · focus: unblock the Pages deploy (orphan prompts vs. codegen:check).
- Issue B: "Serve real per-route HTML for SPA deep links on GitHub Pages".
- Lens: promotion & audience. Next: cast & characters.
- Next run, check first: deploy run conclusion on main, and whether the 3 kid-silly drafts reached `reviewed`.
