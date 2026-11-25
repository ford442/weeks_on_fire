# EyeWash Station — Six Idents + Fake Sponsors

*Package bible. Stills and audio are not generated here — this is the spec that Suggestions can air.*

**Runtime:** 5–10 seconds each  
**Network:** EyeWash Station, Channel 12½  
**Song bed:** [Rinse Cycle](../songs/Rinse_Cycle.md) ident variants  
**Diegesis:** slides — never comment on-screen (`docs/season-arc.md`, `ideas/eyewash-station.md`)  
**Prompts:** `prompts/eyewash-idents-segments.md`  
**Catalog:** `content/cutaways/eyewash-idents.json`

These are the cheapest tone-per-second in the project: one still, one sting, one Continuity Voice line. Play them completely straight.

---

## The six

| # | Title | Still | Audio sting | Continuity Voice |
|---|-------|-------|-------------|------------------|
| A | **Please Stand By** | Full-frame 1980s TECHNICAL DIFFICULTIES card, 8s not 60s | Late-resolving Rhodes chord | “We’ll return to your program. We always do.” |
| B | **Rinse Cycle** | Tiled 15-minute countdown that resets at 14:59 | Soft tick + four bars of *Rinse Cycle* | “Fifteen minutes. Do not blink.” |
| C | **Unscheduled Programming** | Master-control wall; one CRT a second ahead of the room | Rack hum, 60Hz | “This program may be haunted or unscheduled.” |
| D | **Aspect Ratio Matters** | Industrial eyewash fixture; twin chrome nozzles turn toward camera | Four bars of Twilight Time pad + one wrong bar | “We are not liable for what you saw. We are liable for the aspect ratio.” |
| E | **We Always Return** | Biscuit trots a blank studio floor with the station card in her mouth; logo exits; show just starts | Warm pad that does not resolve | “We’ll return to your program. We always do.” *(same line, different room)* |
| F | **3:44 Again** | Sign-off card over cul-de-sac stock; clock stuck at 3:44 | Anthem a bar too long | “We now conclude our broadcast day.” |

**Please Stand By** already exists as a 60-second hold (`content/cutaways/please-stand-by.json`). This ident is the **bumper** — same card, eight seconds, then we cut. Do not replace the long hold.

**Rinse Cycle** the ident is not the 90-second sign-off song. Same DNA, no verses.

**We Always Return** reuses Continuity Voice’s best line on purpose. The joke is the dog, not a new slogan.

## Generation handoff

No stills or audio stings have been generated. This environment has no `XAI_API_KEY`, and the
repository has no configured Minimax audio-generation integration. Do not add placeholder media or
change the cutaway from `ready-to-generate`.

The still batch is reproducible once an xAI key is available:

```bash
python3 scripts/xai-batch.py prompts/eyewash-idents-segments.md --dry-run
python3 scripts/xai-batch.py prompts/eyewash-idents-segments.md --out images/eyewash-idents/
```

The dry run confirms six separate stills and their id-derived output names:

| Ident | Still output | Audio sting |
|-------|--------------|-------------|
| A | `images/eyewash-idents/eyewash-idents-a-please-stand.jpg` | Not generated |
| B | `images/eyewash-idents/eyewash-idents-b-rinse-cycle.jpg` | Not generated |
| C | `images/eyewash-idents/eyewash-idents-c-unscheduled-programming.jpg` | Not generated |
| D | `images/eyewash-idents/eyewash-idents-d-aspect-ratio.jpg` | Not generated |
| E | `images/eyewash-idents/eyewash-idents-e-we-always.jpg` | Not generated |
| F | `images/eyewash-idents/eyewash-idents-f-3-44.jpg` | Not generated |

Audio remains blocked on a configured Minimax generation service. Use the individual 5–10 second
directions in `prompts/eyewash-idents-segments.md` and the four sonic variants in
`songs/Rinse_Cycle.md`; do not render the full sign-off song six times or present it as a sting.
The existing song `audioFile` field represents one song file, not six segment stings, so do not
attach one sting there as though it covered the package. Once real assets exist, register the
stills in `segmentStills`, integrate each sting with a segment-level mapping, and update status only
after verifying all twelve files. Continuity Voice stays audio-only; do not identify it as the
Episode 2 Radio Voice.

---

## Continuity Voice (never seen)

Warm, over-rehearsed, institutional. Reads apocalyptic copy in the cadence of a tire commercial. Not Rubella. Not on camera. Optional half-step flat against the pad.

Do not confirm this is the Episode 2 Radio Voice.

---

## Fake sponsor package (15s copy, play straight)

Three local ads that can sit under a future Suggestions schedule UI. No animation required. One still + VO.

### 1. Perpetual Optics

> Because you’re going to keep looking.  
> Perpetual Optics — lenses for the second glance.  
> *(small print, unread)* Not a medical device. Do not rinse the eye with the product. Use the station.

**Still:** Chrome eyeglass display in a fluorescent optician, one lens showing the laser-snake backyard in miniature.

### 2. Brad’s Bins

> Every shade of blue. One of them is correct.  
> Brad’s Bins — municipal, democratic, and the one under the sodium lamp.  
> *(small print, unread)* Not affiliated with the HOA. The HOA is affiliated with us.

**Still:** A suburban driveway at golden hour. Three recycling bins in three slightly different blues. One has a parking ticket.

### 3. Public service announcement

> If you see a purple light in your driveway, that’s a decorative accent.  
> Do not report it. Enjoy it.  
> This message paid for by the cul-de-sac.

**Still:** Dawn driveway, faint purple residue, a “NO PARKING” cone in front of a perfectly round scorch mark. No people.

Other sponsor names in reserve (not this pack): Quarter to Seventy-Five Financial, Napkin Corp, The Vale Sisters’ Home Collection, Ultra-Refreshed Water Lab.

---

## Production notes

- Generate as **six separate short clips**, not one montage.
- Same analog texture on all six: VHS chroma bleed, scan lines, 60Hz hum.
- S&P Skeleton would stamp these PROBABLY FINE except the folding chairs, which do not appear.
- Pair with Suggestions as `kind: scene`, tags `eyewash-station` + `ident`. Do not invent a new filter kind.

**Status:** Spec ready. Stills and Minimax stings still to generate ([#41](https://github.com/ford442/weeks_on_fire/issues/41)).
