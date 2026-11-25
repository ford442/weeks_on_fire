# Weeks on Fire — weekly plan

## Today's focus

**2026-11-25 · Fix First.** The Pages deploy has failed on every main push since Dependabot #211 (runs 276, 280, 285; last green: run 274 on 2026-11-21). `npm ci` exits EUSAGE: "Missing: @typescript/native@7.1.0-dev.20261125.1 from lock file". The bumped typescript-eslint packages declare an optional peer `@typescript/native: npm:typescript@>=7.1.0-dev.20261009.1 || >=7.1.0-beta <7.1.0-dev`, which root's pin `npm:typescript@7.0.2` doesn't satisfy, so npm wants a fresh nightly that the lock never has. The live hub is frozen at 2026-11-21: Errands (#215) and the EyeWash handoff (#217) never shipped, and `wof-pipeline` PR #213 is red for the same reason.

## Show desk

**Lens (2026-11-25): cast & characters** (previous: promotion & audience).

1. The 2026-11-24 packet's only song, *Hic, Up He Goes*, is an animal short with no recurring cast. Give the kid block a host: The Black Cat (`characters/bible/animals-and-bots.md`) as the silent viewer who sits through each kid short and does the single end reaction. That gives you one recurring face across Egg Xylophone / Hic / Eight Arms / Last Down the Slide at no cost to their one-reaction rule.
2. The Ep3 ensemble (Justine, Jackalyn, Madelin, Qing Rao) has bible sheets, but only Daisy Bell and The Long Way Up have scene boards. Make the next `content/scenes/` board an Ep3 pairing from `relationship-map.md` written to its own test: two incompatible methods, same event, both right.
3. `content/characters.json` lists Scarlet, who has no sheet in `characters/bible/`, while the HOA and EyeWash staff have sheets but no characters.json card. Proposal only: decide whether Scarlet gets a sheet or the card is cut, and give Oz (EyeWash) a card now that the station schedule is a hub view.

**Pipeline steering**
- Mon songs: one non-kid song for an existing adult cast member (Rubella/Lillith building pair), video first. The drawer already has 4 kid-silly songs; quota met.
- Thu review: Egg Xylophone and Eight Arms, Two Mittens have been on hold since 2026-11-19 for the same note (the title isn't sung). Run the wof-writer pass, or cut one this Thursday. Also review All the Way Down and Last Down the Slide.
- Fire **WoF · Lore create**, appending: "Lore for The Black Cat as the silent host of the kid-silly block: where it sits, what it watches, its one allowed reaction per short. Proposal for characters/bible/animals-and-bots.md, no edits."

## Ideas

- Tie long-form segment prompt docs into a first-class "long-form" view rather than forcing a cutaway link.
- Lock `@typescript/native` and other optional peers with Dependabot grouping or ignore rules so a bump can't break `npm ci` again.

## Backlog

- [Fix First] `npm ci` lockfile drift from #211; deploy red since 2026-11-21.
- `/crew/` still returns HTTP 404 (it isn't in the per-route HTML emitter); the other deep routes now return 200.
- Errands (#215) and the EyeWash handoff (#217) are merged but undeployed.
- Egg Xylophone and Eight Arms, Two Mittens have been held since 2026-11-19 (title not sung).

## Done

- 2026-11-25: per-route HTML for deep links (cdd5c4a), standalone prompt allowlist (4cd1e0a, last week's Fix First), Overview + Finalized views (#191/#192), sequence graph v2 + editor (#210), capture/Record (#209), Errands (#215, undeployed). Packet 2026-11-24 shipped one song (Hic, Up He Goes). The wof-pipeline branch was recreated (#213).
- 2026-11-18: #176 WoF pipeline (rolling) merged; #178 music projects page, #179 Well Fall/Mountain Lion long-form prompts, #180 French cabaret ideas, #181 fire girls idea bank merged.

## Last run

- 2026-11-25 · mode: Fix First · focus: repair package-lock drift from Dependabot #211 so `npm ci` and the Pages deploy pass.
- Issue B: "Add /crew to per-route HTML emission and assert every route returns 200".
- Lens: cast & characters. Next: writing craft.
- Next run, check first: the deploy conclusion on main, whether Errands is live, and whether Egg Xylophone / Eight Arms were promoted or cut.
