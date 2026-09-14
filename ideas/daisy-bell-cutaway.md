# Daisy Bell — Flower Bicycle → Old London

Musical cutaway for **Rubella** and **Lillith** on a **living flower bicycle**, pedaling from a modern wildflower field into period London. The visual language does the time-slip: scratchy black-and-white film ↔ crisp full-color HD, flipping mid-verse like the pipeline cannot decide which century is real.

**Audio:** `songs/Daisy+Bell.mp3` · catalog notes `songs/Daisy_Bell.md`  
**Site board:** Daisy Bell page (nav tab) · data `src/data/daisyBell.ts`  
**Themes / indoor river / viewer seats:** `ideas/daisy-bell-themes.md`  
**Timing grid:** `ideas/daisy-bell-timing.md`  
**Per-shot nuance (C0–C19):** `ideas/daisy-bell-nuance.md`  
**End girl (the real Daisy):** `ideas/daisy-bell-girl.md`  
**Shared field paint:** `ideas/wildflower-paint-rivulets.md`  
**Farm:** [#22](https://github.com/ford442/weeks_on_fire/issues/22) · not #42

---

## Core sequence

1. **Color field** — modern wildflower sea, golden hour, black lace against chaotic color; flower bike half-swallowed by blooms. Thin wet **paint rivulets** already run between the stems (not on the petals). Empty wet tire rut before the bike arrives. No girl hero-framed here.
2. **First grain** — on the opening “Daisy, Daisy…”, film grain, vertical scratches, flicker; color begins to drain. Rivulets are the last chroma to leave.
3. **Full period Fleet Street** — scratched B&W toward St. Paul’s; horse traffic, bowlers; flower bike still too bright / edge-glow wrong against the monochrome world.
4. **Color snap, street stays Victorian** — scratches clear; full HD color of old London; living floral bicycle in modern photography of the past.
5. **Unstable flips** — on “bicycle built for two,” B&W ↔ HD a couple more times, each more unstable.
6. **Off-road unreal (optional climax room)** — they leave the road through trees into a riverside building that has the river flowing *inside*; old single-pane glass, drip, shallow current, tandem still a tandem. Full lock in `ideas/daisy-bell-themes.md`. Not the whipped-cream ocean. The girl is not in this room.
7. **Soft return + the name** — modern field again. She is already there, small. Focus moves to her. She takes the spent bloom the bike dropped. Tandem leaves. Fade on her in the rut. Full lock: `ideas/daisy-bell-girl.md`.

**Constant / joke:** the flower bike. Everything else glances at them like they do not belong.
**Title:** a child at the end. They borrowed the song. She keeps the name.

**Running threads** (lock these; do not re-invent per still): Lillith's pedal foot bare, Rubella's not · flower count rises then spends itself · empty rut at C0 / matching track at C11 / wet tire closes it at C18 · the spent bloom goes to the girl at C18–C19. Full tables in `ideas/daisy-bell-nuance.md` and `ideas/daisy-bell-girl.md`.

---

## Lyric-tied street sights

| Lyric beat | Sight |
|------------|--------|
| *I can’t afford a carriage* | Broken hansom, one wheel missing; resigned horse. Beggars on the curb; one holds up a single wilted daisy. Fancy closed carriage; curtains part for a confused stare. |
| *You’ll look sweet upon the seat* | Stylish women in feathered hats / walking suits (or black period bicycles); one long amused admiring glance. Society ladies in an open landau lean the same way at once. **Not** the child. |

### Other pass-bys (pick and choose)

- Flower girl freezes when she sees the bike *is* flowers — **same face as the end girl** if used.
- News boy: “Bicycle Built for Two Causes Sensation!”
- Chimney sweep tips cap; a white daisy petal drifts from the brush.
- Street organ monkey in a miniature black lace collar.
- Children chalk hopscotch daisy faces on cobbles — one of them may be her, not centered.
- Wedding procession; bride’s bouquet leans toward the bike.
- Policeman double-take, then pretends he saw nothing.
- Fog parts on St. Paul’s dome, closes behind them.
- Bicycle-sign run on the road into London (connecting motif).
- Cats, girl-doubles, overhead phone wires as a light extra layer — not the plot. Girl-doubles are not her.
- **Giant hair-dos (Big City / downtown act):** civic-scale Gibson Girls —
  roundabout, revolving-door compartment, cafe with no eye-line, sofa-width
  handshake instead of a kiss, pigeons roosting, wires as clothesline,
  landau sunroof, lantern in a curl, hair arrives in the lift first.
  Full dump: [`big-city-hairdos.md`](big-city-hairdos.md). Rubella & Lillith
  keep small hair. Not Glam-Sham-Poo.

---

## Still treatment tags

| Tag | Look |
|-----|------|
| **color** | Photoreal HD, soft modern light, pollen, full chroma (field + Victorian-in-color) |
| **period** | Scratchy nitrate / early film: grain, vertical scratches, flicker, soft focus, B&W or heavy sepia |
| **river-room** | Indoor river building: single-pane wavy glass, trees against the windows, shallow current, drip on the waltz |
| **paint-ground** | Field plates only: enamel rivulets between stems. See `ideas/wildflower-paint-rivulets.md` |

Mix color and period on the Daisy Bell page. Period stills should still let the flower bike read as *wrong* — slightly too sharp, edge glow, or residual color bloom if the pipeline allows a leak.

---

## Prototype defaults (HF Space)

1280×720 · **50 steps** (quota) · `/run_inference_and_upload_60` · `save_consent: false`  
If outputs land **720×1280**, the Space width/height args are reversed — swap and retry.

### Subject lock (every London still)

- **Rubella + Lillith:** body-conscious black lace, long dark hair, red lips — same as flower-field still. **No** corset hourglass, leg-of-mutton sleeves, or towering hats on them.
- **Feet:** Lillith's pedal foot bare; Rubella shod. Survives every treatment flip.
- **Bike:** tandem **completely covered** in living wildflowers/vines — bright, slightly too alive; **no bare metal**.
- **Street:** Fleet Street energy; **St. Paul’s** deep in the background.
- **Girl:** ordinary child, 7–10, never in their lace, never on the living tandem. See `ideas/daisy-bell-girl.md`.

### 1890–1896 fashion (everyone else)

| Role | Read |
|------|------|
| Stylish glance | Hourglass corset, **leg-of-mutton/gigot** sleeves, high collar, gored A-line skirt, **feathered/flowered hats**, Gibson pompadour, walking suits |
| Working / beggars | Worn wool, patched, cloth caps, shawls, practical boots — no giant sleeves |
| Men (background) | Top hats / bowlers + frock coats (better-off); cloth caps + jackets (working) |

### Strongest prototype pack (on site · `db-p01`…`db-p05`)

1. Wide — riding into B&W street as first grain/scratches appear  
2. Medium — beggars / broken carriage (“can’t afford a carriage”)  
3. Medium-close — stylish ladies glance (“you’ll look sweet”)  
4. Full-color HD of the same street; flower bike still glowing  
5. Reaction — flower girl (or policeman) double-take  

Shared prompt fragments live in `src/data/daisyBell.ts` as `daisyBellSubjectLock`, `daisyBellStylish1890s`, `daisyBellWorking1890s`.

### Expanded ride arc (`db-x01`…`db-x04`)

Field-consistent faces (long black hair + **bangs**, form-fitting black lace, dark red lips) through a geographic dissolve:

1. **Crowded downtown** — Fleet Street energy, stares + beggars + St. Paul’s haze  
2. **City thinning** — fewer carriages, grass creeping in  
3. **Open road** — verges of daisies/poppies, stylish woman looks back on ordinary bike  
4. **Closer reaction** — medium lace + living bike; full head-turn from 1890s women  

All color, 1280×720, 50 steps.

### Next stills to generate

1. Ground-only wildflower plate with paint rivulets (shared with the lion field).
2. **C0** field with empty wet tire rut (shared with C11 / C18).
3. Field tandem C1–C2: bare-foot lock + rising flower count.
4. **C11** doorway wide: worn doorstep, terminated phone line, matching rut.
5. Decide flip-climax vs room-climax **before** C12 plates.
6. Indoor-river doorway / drip medium if the room takes the peak.
7. **C16 / C18 / C19 girl plates** — she is small, then she takes the bloom, then she keeps the frame.
