# Waterslide — 28-segment slide-cam shot bank

Copy-ready prompts for **Grok Imagine** (start stills) and image-to-video (Grok Imagine
6 / 10 / 15s clips) for the music video to **"Waterslide"**. Visual bank, not a story: the
slides are the stars, the camera is the rider, and any two segments can be cut together
freely. Written for the owner's cut-between workflow.

**Working title:** Waterslide
**Owner picks (must stay in the cut):** 01 jungle (very tall) · 10 purple marble · 19 futuristic.
**Alt names for the file/series:** Slide-Cam Bank · Twenty-Eight Ways Down

Drafted from ~40 slides, curated to 28. Every segment has a different setting + material
combo; no two share one. Looks are mixed on purpose: photoreal, stylized-cartoon, and
stranger-3D, each labeled per segment.

---

## The song and the audio (analysis, not listening)

The audio is the owner's uploaded MiniMax render. It is **not in the repo** (no mp3 added).
Every timing below came from an energy/onset analysis of the file, **not from listening**.
Lyrics and vocals are unknown, so none are written here and every segment is rider-less /
mouths-off by default. Timings are +/-0.15s: **verify each cut against the waveform before
locking.**

- File length 79.33s; last audible sound ends ~77.5s, then ~1.8s of digital silence. **Cut
  the video at ~77.4s** (or add a splash tail).
- **Pulse grid:** kick/bass lands every **0.325s** (~185 per minute; feels like 92 BPM
  half-time). 4 pulses = 1.3s · 8 = 2.6s · 16 = 5.2s · 20 = 6.5s · 32 = 10.4s.
- All cut times below are snapped to a grid anchored on Drop 1: `g(k) = 19.25 + 0.325 k`.
  Every cut length and trim is given as **pulses + seconds**.

| Seconds | Section | What the picture should do |
|---|---|---|
| 0.0-19.0 | INTRO / verse, no bass, riser builds ~15-19 | Long takes. A long build INTO the drop. |
| 19.0-19.25 | PRE-DROP GAP (~0.25s near-silence) | Exit flash, hold on white, then hard cut. |
| **19.25** | **DROP 1**, bass enters hard | Picture drop lands exactly here. |
| 19.25-21.85 | light groove | Short takes. |
| 21.85-31.0 | GROOVE A, full groove locks at 21.85 | 8-10 pulse cuts. |
| 31.0-32.25 | mini-break, bass ducks ~1.2s, top end rises | Something hangs in the air; it falls when bass returns at 32.25. |
| 32.25-37.5 | GROOVE B (brighter) | 10-12 pulse cuts. |
| 37.5-40.0 | BREATHER, bass ducks 2.5s | Slow, dark, pulling in. A ramp that peaks on 40.0. |
| 40.0-51.75 | **PEAK**, loudest and densest | 4-pulse (1.3s) rapid cuts, drop on beat 3 of each cut. |
| **51.75** | **HARD STOP** | **Freeze** on a mid-air frame (hold ~0.25s). |
| 52.0-58.0 | BREAKDOWN, no bass, ~6s (20 pulses) | One long calm take. Dip at ~57.5 = second pre-drop gap. |
| **58.25** | **DROP 2**, bass slams back | **Hard cut + white flash.** |
| 58.25-69.0 | FINAL CHORUS, full energy | 4-pulse rapid cuts. |
| 69.0-73.75 | OUTRO groove, bass fades by ~73.75 | One slow, funny, low-level take. |
| 74.0-75.7 | near-silence tail | Quiet; the slide keeps going. |
| ~76.0 | final stinger | The tiny splash. |
| 76.0-77.5 | fade to nothing | Hold, fade, end ~77.4. |

Spacing facts the cut leans on: Drop 1 (19.25) to the hard stop (51.75) = 32.5s = exactly
**100 pulses**. Breakdown (51.75) to Drop 2 (58.25) = 6.5s = exactly **20 pulses**.

### Cut-length math (say it plainly)

28 segments across ~77.4s = **2.76s average, about 8.5 pulses each.** You cannot give every
clip its length. So:

- **6s clips are plenty for almost everything.** Any segment works as a **quick cut**: use the
  1.3s window `[drop - 0.65s, drop + 0.65s]` so the drop lands on beat 3 of a 4-pulse cut.
- **Long takes (only where one pays off):** 01 jungle as the 15s intro descent that exits on
  Drop 1 (14.95s) · 11 glass spire as the 6.25s breakdown take · 18 motel as the 8.45s outro +
  tail take. Everything else runs 1.3-3.9s.
- Run A uses 17 quick cuts (peak 9, final chorus 8), 7 mid cuts (2.6-3.9s), 3 long takes and
  one 12-pulse opener.

---

## Cut grammar (three tokens every clip carries)

Paste the token line into every motion prompt (it is already in each block below).

1. **BANK-RIGHT.** Every clip **ends** banking right (clockwise roll ~12 degrees, a short
   yaw right) in its last second, and every clip **opens** already banked right and levels
   out in its first second. A swing that never stops, so any hard cut feels like one move.
2. **SPRAY-FLASH.** Every clip **ends** in a <=0.3s white burst filling the frame (white-water
   spray; bloom or white-out where there is no water: space, hologram, paper) and **opens**
   clearing out of one. Nothing ends or begins on a calm frame. This is the cut wipe, and the
   gap-hold on Drop 1.
3. **SLIDE-CAM.** Camera **30 cm above the flow** (in the segment's own scale: macro for the
   ant), centered on the flow line, 20mm-equivalent wide lens, **never looks back**, no rider,
   hands or feet in frame. The slide centerline enters bottom-center; the **vanishing point
   sits at screen center (x 50%, y 42%)** at every cut. Travel is always **into the screen**.
   Only 01 and 11 open with a 3s drone-wide, then dive into slide-cam on the same right bank.

**Each block gives `in:` and `out:`** so you can match the surface color and shape across a
cut. **Tag key:** `wow:` = spectacle line. `laugh:` = kid-sentence for the silly ones.

---

## Shared visual lock (paste with every still)

16:9. Rider-less slide-cam: camera 30 cm above the water on the flow line, 20mm wide lens,
vanishing point at center, no people, no hands, no feet, no text, no logos, no brands, no
watermark. Water behavior and materials named concretely. One world per frame.

## Catalog

| # | id | Name | Look | Setting + material | Light / palette | Clip -> trim | Drop (clip second) | Line |
|---|---|---|---|---|---|---|---|---|
| 01 | `jungle-kapok-tower` (owner) | Kapok Tower | photoreal | rainforest canopy; lashed bamboo + hardwood + stone flume around a giant kapok | dawn mist; emerald, gold, white | 15 -> 10 / 6 | **appears** 12.2 (canopy breaks, macaws) | wow: the slide is taller than the clouds are low |
| 02 | `glacier-blue-chute` | Blue Chute | photoreal | glacier; sculpted blue ice | blue hour; cyan, white, sapphire | 10 -> 6 | **falls** 7.0 (ice slab calves) | wow: it slides under a frozen cathedral |
| 03 | `slot-canyon-beam` | Slot Beam | photoreal | red sandstone slot canyon; wet carved sandstone | noon beam; rust, gold, turquoise | 10 -> 6 | **appears** 5.0 (column of sun) | wow: the water turns to gold |
| 04 | `lava-tube-steam` | Steam Tube | photoreal | volcano flank; cooled basalt tube, glowing seams | dusk; black, orange, white | 6 | **transforms** 3.5 (steam whiteout) | wow: the water meets the fire |
| 05 | `glowworm-gallery` | Glowworm Gallery | photoreal | limestone cave; wet flowstone | near dark; teal, blue-green | 10 -> 6 | **multiplies** 6.0 | wow: ten stars become ten thousand |
| 06 | `baobab-spiral` | Hollow Baobab | photoreal | giant hollow baobab; polished wood spiral | savanna dusk; amber, umber | 10 -> 6 | **reverses** 6.5 (spin flips) | wow: the tree spins you out backward |
| 07 | `dry-run-white-dunes` | Dry Run | photoreal | white gypsum dunes; chalk-dry chute | high noon; white, sky blue | 10 -> 6 | **appears** 5.5 (water front) | laugh: the slide is dry until a whole river shows up |
| 08 | `cumulus-ribbon` | Cumulus Ribbon | stylized soft 3D | clouds; cloud-stuff, rain for water | sunrise; peach, lavender, gold | 6 | **falls** 3.4 | wow: you slide off the sky |
| 09 | `reef-plunge-tube` | Reef Plunge | photoreal | coral lagoon; clear acrylic tube | morning; turquoise, coral | 10 -> 6 | **transforms** 4.0 (air -> underwater) | wow: the slide dives into the sea |
| 10 | `purple-marble-stair` (owner) | Amethyst Stair | photoreal | palace hall; violet marble, gold-leaf seams | skylight morning; violet, gold, cream | 10 -> 6 | **multiplies** 5.5 (fountains) | wow: every lion turns the water on at once |
| 11 | `glass-spire-trough` | Glass Spire | photoreal | tower exterior; open low-iron glass trough | dusk; amber, steel blue | 15 -> 10 / 6 | **falls** 11.5 (also frost clears 5.5) | wow: you can see the whole city through your feet |
| 12 | `neon-rain-alley` | Neon Alley | photoreal | rain alley; glowing acrylic tubing | night rain; magenta, cyan | 6 | **multiplies** 3.0 | wow: the signs switch on as you pass |
| 13 | `rust-refinery-flume` | Rust Flume | photoreal | derelict refinery; corroded steel pipe | sodium dusk; orange, teal | 10 -> 6 | **falls** 7.0 | wow: the pipe just stops |
| 14 | `cedar-log-flume` | Log Flume | photoreal | pine valley; weathered cedar on trestles | late gold; amber, pine green | 10 -> 6 | **multiplies** 5.0 (logs) | laugh: one log, then three logs, then a hundred logs |
| 15 | `rock-candy-rapids` | Rock Candy | stylized clay/stop-motion | candy valley; boiled-sugar glass | bright pastel; pink, mint, lemon | 6 | **appears** 3.5 (sprinkle burst) | wow: the tunnel is full of sprinkles |
| 16 | `brutalist-concrete-chute` | Concrete Chute | photoreal | brutalist atrium; board-marked concrete | overcast; grey, white, moss | 10 -> 6 | **falls** 5.5 | wow: a gray slide with the cleanest drop |
| 17 | `gaslight-bath-slide` | Gaslight Bath | photoreal | Victorian bathhouse; glazed tile + cast iron | misty morning; white, bottle green, brass | 10 -> 6 | **appears** 4.5 (roof louvres, light shafts) | wow: the roof opens one pane at a time |
| 18 | `motel-baby-slide` | Baby Slide, Long Night | photoreal liminal | motel pool, 3:44 AM; turquoise fiberglass | sodium + neon; turquoise, amber | 10 | **transforms** 6.5 (slide loops the sign) | laugh: the baby slide is secretly very long |
| 19 | `skyline-ribbon` (owner) | Skyline Ribbon | photoreal sci-fi | floating-garden towers; white ceramic, light seam | sunrise; white, mint, cyan | 10 -> 6 | **transforms** 4.5 (water bridges the gap) | wow: the water holds its own shape |
| 20 | `zero-g-gutter` | Zero-G Gutter | photoreal | orbital station module; brushed-steel trough | lamp + Earth glow; steel, blue | 10 -> 6 | **falls** 6.5 (gravity returns) | laugh: all the water bubbles fall at once |
| 21 | `maglev-hover-sheet` | Hover Sheet | photoreal CGI | vacuum tunnel; black glass track | white tunnel, amber rings | 6 | **multiplies** 3.0 (1 -> 3 tracks) | wow: the water floats above the rail |
| 22 | `hologram-draft` | Draft Slide | stranger 3D (wireframe -> clay) | dark studio; cyan wireframe light | black, cyan -> white | 6 | **transforms** 3.5 (draws itself solid) | wow: the slide is drawn just ahead of you |
| 23 | `ant-leaf-queue` | Leaf Slide | photoreal macro | garden; one broad wet leaf | morning dew; green, silver | 6 | **falls** 3.6 (giant raindrop) | laugh: a raindrop as big as a bus lands on the ants' slide |
| 24 | `garden-hose-coil` | Hose Slide | photoreal | suburban lawn; green vinyl hose, from inside | bright afternoon; green, gold | 6 | **multiplies** 4.0 (jet -> mist) | laugh: the whole slide is a garden hose and somebody twists the nozzle |
| 25 | `watermelon-spiral` | Melon Spiral | hyperreal food-commercial | inside a giant watermelon; carved pink flesh | backlit; pink, black, green | 6 | **appears** 4.5 (burst through rind) | laugh: a slide inside a watermelon and the seeds go pew |
| 26 | `animal-lifeguards` | Wrong Third | stylized 3D feature | water park; molded plastic | sunny; primaries | 10 | **appears** 4.0 (the bear) | laugh: otter, heron, bear |
| 27 | `penrose-clay-loop` | Penrose Loop | stranger 3D (matte clay) | white void; matte white clay | soft studio; white, pale blue | 10 -> 6 | **reverses** 5.0 (wall becomes floor) | wow: it is always downhill and it comes back to the top |
| 28 | `origami-boat-fold` | Paper Boat | stylized paper-craft | paper diorama; folded white paper | warm lamp; white, ink blue | 6 | **transforms** 3.9 (slide folds into a boat) | laugh: the slide folds itself into a boat |

Drop-type spread: appears 7 · falls 7 · multiplies 6 · transforms 6 · reverses 2.

---

## RUN A — fully timed (escalation: tiny -> tall -> impossible -> tiny)

Cuts snap to `g(k)`. Every row names the segment, the clip trim and the audio event its drop
lands on. **Trim = clip-seconds in -> out**, taken from the segment's own timeline (see its
block). Retime by up to 8% if a clip's drop lands off-grid; otherwise re-roll.

| # | Song in -> out (s) | Pulses | Segment | Clip trim | Where the drop lands |
|---|---|---|---|---|---|
| 1 | 0.0 -> 3.975 | 12 (+0.075 lead) | **23** ant-leaf-queue | 0.0 -> 3.975 | raindrop at 3.65 (pulse 11); its splash is the wipe into 01 |
| 2 | 3.975 -> 18.925 | 46 | **01** jungle-kapok-tower | 0.0 -> 14.95 | drone dives at 6.975; macaws/canopy break at 16.2 inside the riser; flash 18.6 -> 18.925 |
| gap | 18.925 -> 19.25 | 1 | hold on pure white | none | the 0.25s near-silence |
| 3 | 19.25 -> 21.85 | 8 | **08** cumulus-ribbon | 3.4 -> 6.0 | falls off the cloud on **Drop 1 (19.25)** |
| 4 | 21.85 -> 25.1 | 10 | **10** purple-marble-stair | 5.5 -> 8.75 | fountains multiply on the **groove lock (21.85)** |
| 5 | 25.1 -> 28.35 | 10 | **07** dry-run-white-dunes | 3.55 -> 6.8 | water front at 27.05 (pulse 24) |
| 6 | 28.35 -> 30.95 | 8 | **12** neon-rain-alley | 1.7 -> 4.3 | signs multiply at 29.65 |
| 7 | 30.95 -> 33.55 | 8 | **20** zero-g-gutter | 5.2 -> 7.8 | globules hang through the duck; **fall at 32.25 (bass returns)** |
| 8 | 33.55 -> 37.45 | 12 | **26** animal-lifeguards | 0.6 -> 4.5 | the bear at 36.95 |
| 9 | 37.45 -> 40.05 | 8 | **05** glowworm-gallery | 3.4 -> 6.0 | multiply ramps through the breather, **full bloom on the peak (40.05)** |
| 10 | 40.05 -> 41.35 | 4 | **04** lava-tube-steam | 2.85 -> 4.15 | steam whiteout, beat 3 |
| 11 | 41.35 -> 42.65 | 4 | **13** rust-refinery-flume | 6.35 -> 7.65 | falls, beat 3 |
| 12 | 42.65 -> 43.95 | 4 | **03** slot-canyon-beam | 4.35 -> 5.65 | sun column, beat 3 |
| 13 | 43.95 -> 45.25 | 4 | **15** rock-candy-rapids | 2.85 -> 4.15 | sprinkle burst, beat 3 |
| 14 | 45.25 -> 46.55 | 4 | **21** maglev-hover-sheet | 2.35 -> 3.65 | tracks multiply, beat 3 |
| 15 | 46.55 -> 47.85 | 4 | **16** brutalist-concrete-chute | 4.85 -> 6.15 | the clean drop, beat 3 |
| 16 | 47.85 -> 49.15 | 4 | **22** hologram-draft | 2.85 -> 4.15 | draws solid, beat 3 |
| 17 | 49.15 -> 50.45 | 4 | **19** skyline-ribbon | 3.85 -> 5.15 | water bridges the gap, beat 3 |
| 18 | 50.45 -> 51.75 | 4 | **25** watermelon-spiral | 3.2 -> 4.5 | rind bursts **on the hard stop (51.75)** |
| freeze | 51.75 -> 52.0 | ~1 | freeze last frame of 25 | none | juice drops hang mid-air in the silence |
| 19 | 52.0 -> 58.25 | 19 | **11** glass-spire-trough | 6.0 -> 12.25 | calm clear-glass ride; tube floor **falls away at 57.5 (second pre-drop gap)**; edit a 4-frame white flash 58.1 -> 58.25 |
| 20 | 58.25 -> 59.55 | 4 | **09** reef-plunge-tube | 4.0 -> 5.3 | plunge splash is the **Drop 2 white flash (58.25)** |
| 21 | 59.55 -> 60.85 | 4 | **06** baobab-spiral | 5.85 -> 7.15 | spin reverses, beat 3 |
| 22 | 60.85 -> 62.15 | 4 | **02** glacier-blue-chute | 6.35 -> 7.65 | slab calves, beat 3 |
| 23 | 62.15 -> 63.45 | 4 | **17** gaslight-bath-slide | 3.85 -> 5.15 | louvres open, beat 3 |
| 24 | 63.45 -> 64.75 | 4 | **14** cedar-log-flume | 4.35 -> 5.65 | logs multiply, beat 3 |
| 25 | 64.75 -> 66.05 | 4 | **24** garden-hose-coil | 3.35 -> 4.65 | jet becomes mist, beat 3 |
| 26 | 66.05 -> 67.35 | 4 | **27** penrose-clay-loop | 4.35 -> 5.65 | wall becomes floor, beat 3 |
| 27 | 67.35 -> 68.975 | 5 | **28** origami-boat-fold | 3.25 -> 4.875 | fold at beat 3 |
| 28 | 68.975 -> 77.425 | 26 | **18** motel-baby-slide | 1.2 -> 9.65 | bends at 69.3 / 71.8; **loop through the sign at 74.3 in the near-silence; tiny splash on the 76.0 stinger**; hold, fade 77.4 |

All 28 segments appear exactly once. Cut at ~77.4s. The motel exit flash (clip 9.7) is
**not** used: the run ends on the settled pool, the 3:44 office clock in frame, fade out.

Run A hand-offs worth leaving alone: **23 -> 01** (splash wipes into the tower wide) ·
**01 -> 08** (macaws exit into open sky) · **08 -> 10** (peach rain into violet) ·
**11 -> 09** (glass floor falls, then the sea) · **04 -> 13** (orange steam into orange rust) ·
**22 -> 19** (white clay into white ceramic) · **25 -> freeze -> 11** (juice drops hang, then a
glowing quiet).

---

# THE SEGMENTS

Every block: a copy-ready **start still** (Grok Imagine) and a copy-ready **motion**
(image-to-video). Every motion prompt ends with the three cut tokens. Pulses/seconds under
`Run A` match the timed table above.

---

## NATURAL

## 01 · jungle-kapok-tower — Kapok Tower (owner pick: the very tall one)

- **Look:** photoreal · **Clip:** **15s** -> trim **10s** (keep 5.0-15.0, drop at 7.2) or **6s** (keep 9.0-15.0, drop at 3.2)
- **Unique:** rainforest canopy, lashed bamboo + dark hardwood + mossy stone, taller than the cloud base; dawn mist; emerald, gold, white. The only 15s that opens on a drone-wide.
- **Drop:** **appears** at 12.2s. The flume bursts out of the canopy: the whole forest floor drops away below and a flock of scarlet macaws launches up (3 -> ~60) around the lens.
- **wow:** the slide is taller than the clouds are low.
- **in:** drone-wide, dawn gold on mist, green-glass water, banked right. **out:** white spray burst over open air, banked right.
- **Chain:** last frame (spray over open golden sky) -> start still of **08**.
- **Run A:** song 3.975-18.925 (46 pulses), clip 0.0-14.95 (full). Dive at 6.975; canopy break at 16.2 sits inside the riser.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal drone-wide still looking straight down the full length of an enormous waterslide that spirals down the trunk of a giant kapok tree rising out of a rainforest canopy at dawn, the slide an open half-pipe flume built of lashed bamboo, dark hardwood planks and moss-covered stone, a glossy green-tinted sheet of water running down its centerline, hundreds of meters tall with the lower coils disappearing into the fog below, a waterfall feeding the top, lianas and orchids hanging off the supports, a few scarlet macaws as tiny specks in the mist, low dawn light turning the fog gold, deep emerald foliage, no people, no text, no logos, 35mm anamorphic look, Grok Imagine style
```

**Motion (image-to-video, 15s)**
```
0-3s: the drone-wide slowly descends toward the top of the flume and dives into a slide-cam POV, camera 30 cm above the water on the flow line, 20mm wide lens, banked right then leveling. 3-12s: a continuous fast descent spiraling down the trunk, vines whipping past, mist streaming, branches and ferns flashing by, small waterfalls crossing the flume, speed steady and rising. At 12.2s the flume bursts out of the canopy: the forest floor drops away far below and about sixty scarlet macaws launch up around the lens in one wave. 14.65-15s white-water spray floods the frame while the camera banks right about 12 degrees. No rider, no hands, no feet in frame, never looks back, vanishing point at screen center, travel into the screen, no cuts.
```

---

## 02 · glacier-blue-chute — Blue Chute

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 2.5-8.5, drop at 4.5)
- **Unique:** glacier, sculpted blue ice, blue hour. The cold segment: cyan, white, sapphire.
- **Drop:** **falls** at 7.0s. A house-sized slab of ice breaks off the glacier snout and falls into the fjord just ahead as the chute dives off the edge.
- **wow:** it slides through a frozen cathedral.
- **in:** blue-white spray clearing, banked right, ice surface. **out:** white spray over dark fjord water, banked right.
- **Match:** **02 -> 22** (cyan to cyan).
- **Run A:** song 60.85-62.15, clip 6.35-7.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still from the top of a smooth half-pipe waterslide chute carved into a blue glacier, camera 30 cm above a thin sheet of glass-clear meltwater running down the centerline, translucent sapphire ice walls on both sides glowing cyan from inside, a natural ice arch ahead with a pale snow rim above it, fine frozen mist in the air, blue-hour light, palette of cyan, white and deep sapphire, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
The camera glides forward fast along the ice chute, meltwater hissing, banked right and leveling in the first second. 0-2.5s open glacier surface, 2.5-6.4s inside a blue ice tunnel, the walls glowing and rippling with caustics. At 6.4s the tunnel mouth opens on the glacier snout above a dark fjord; at 7.0s a house-sized slab of ice breaks off just ahead-left and falls in slow heavy collapse into the water with a huge plume while the chute dives off the edge and the camera arcs down toward the fjord. 9.7-10s white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, vanishing point at screen center, no cuts.
```

---

## 03 · slot-canyon-beam — Slot Beam

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 1.5-7.5, drop at 3.5)
- **Unique:** red sandstone slot canyon, wet carved ribbed sandstone, noon beam; rust, gold, turquoise.
- **Drop:** **appears** at 5.0s. The slot opens overhead and a single column of white noon sun lands on the water: the stream goes gold and the spray turns to sparks.
- **wow:** the water turns to gold.
- **in:** orange-dark slot, spray clearing, banked right. **out:** gold spray flash, banked right.
- **Match:** **03 -> 07** (gold sun to white noon).
- **Run A:** song 42.65-43.95, clip 4.35-5.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still inside a narrow red sandstone slot canyon, a smooth waterslide channel carved in wet ribbed sandstone running down the middle with a thin sheet of turquoise water, camera 30 cm above the water on the centerline, towering curved walls glowing deep orange and rust from bounced light, the slot curving gently ahead into shadow, dust motes in the air, no sun yet, palette of rust, ochre and turquoise, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Fast glide forward along the sandstone slide, banked right and leveling in the first second, walls streaking past, water curling up the curves and flicking spray. 0-5s dim orange slot, the walls closing overhead. At 5.0s the slot opens overhead and one hard column of white noon sunlight drops straight onto the water: the stream turns liquid gold and the spray lifts as sparks. 5-9.7s the canyon widens into an open amphitheater under a natural stone arch. 9.7-10s white spray fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 04 · lava-tube-steam — Steam Tube

- **Look:** photoreal · **Clip:** 6s (no trim; drop at 3.5)
- **Unique:** volcano flank, cooled basalt tube with glowing seams, dusk; black, orange, white steam. Warm counterpart to 02.
- **Drop:** **transforms** at 3.5s. Every seam hisses at once and the tube fills with white steam, then clears onto a black glassy slope with orange rivers glowing downhill.
- **wow:** the water meets the fire and wins.
- **in:** orange glow, banked right. **out:** white steam/spray flash, banked right.
- **Match:** **04 -> 13** (orange into orange).
- **Dedupe note:** not the basalt-living-room cutaway; no house, no women, no leis. Outdoors, rider-less.
- **Run A:** song 40.05-41.35, clip 2.85-4.15.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still in a half-pipe tube of cooled black basalt on the flank of a volcano at dusk, camera 30 cm above a thin sheet of water running down the tube floor, glowing orange seams cracked along the walls, thin steam curling where the water crosses a seam, a purple-black dusk sky at the tube mouth far ahead, drifting ash, palette of black, ember orange and white steam, no people, no building, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Fast glide along the basalt tube, banked right and leveling in the first second, water hissing where it crosses glowing seams. 0-3.5s one steam jet, then two, then three along the seams. At 3.5s every seam vents at once and the whole tube fills with a wall of white steam, 3.5-4.3s near whiteout, then it clears onto an open black glassy slope with orange lava rivers glowing downhill under a purple sky. 5.7-6s white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 05 · glowworm-gallery — Glowworm Gallery

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 3.0-9.0, drop at 3.0)
- **Unique:** limestone cave, wet flowstone, near dark; teal and blue-green points of light. The darkest segment.
- **Drop:** **multiplies**, ramp 5.0-6.0s. About a dozen glowing points on the ceiling become thousands as the passage opens into a cavern, mirrored in the stream.
- **wow:** ten stars become ten thousand.
- **in:** near-black, banked right. **out:** blue-white spray flash, banked right.
- **Match:** **05 -> 20** (points of light to floating globules).
- **Run A:** song 37.45-40.05, clip 3.4-6.0; full bloom lands on the peak at 40.05.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still inside a limestone cave, a smooth half-pipe waterslide channel of wet flowstone running down the middle with a thin glossy stream of water, camera 30 cm above it on the centerline, stalactites dripping overhead, about a dozen tiny blue-green glowworm lights on the ceiling reflected in the water, everything else near black, a faint mineral sheen on the walls, palette of teal and blue-green on black, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Slow-then-quickening glide along the cave slide, banked right and leveling in the first second, water whispering, drips rippling the stream. 0-5s dark passage with the dozen lights drifting past. 5.0-6.0s the passage opens into a vast cavern and the glowworm lights multiply from a dozen to thousands across the ceiling and walls, all mirrored in the stream so the frame becomes a field of stars. 9.7-10s blue-white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 06 · baobab-spiral — Hollow Baobab

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 3.0-9.0, drop at 3.5)
- **Unique:** giant hollow baobab, polished wood spiral, savanna dusk; amber, umber, green. Spiral inside a thing.
- **Drop:** **reverses** at 6.5s. Clockwise down the inside, the flume exits through a root doorway and the camera swings counter-clockwise around the outside of the trunk.
- **wow:** the tree spins you out backward.
- **in:** amber glow, banked right. **out:** gold spray flash, banked right.
- **Match:** **06 -> 27** (spiral to loop).
- **Run A:** song 59.55-60.85, clip 5.85-7.15.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still inside the hollow trunk of a giant baobab tree, a honey-polished wooden spiral waterslide winding down the inner wall with a thin film of water, camera 30 cm above it on the centerline, shafts of low gold dusk light slanting through knotholes high above, dust motes, smooth ridged wood walls, root arches ahead, palette of amber, umber and warm green, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides fast around the inside spiral, clockwise, banked right and leveling in the first second, light shafts strobing past, water curving up the wall. At 6.5s the flume exits through a root doorway and the camera, now outside, swings counter-clockwise around the huge trunk at dusk: savanna, acacia silhouettes, orange sky, the spin direction visibly reversed. 9.7-10s gold spray fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 07 · dry-run-white-dunes — Dry Run

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 3.0-9.0)
- **Unique:** white gypsum dune field, chalk-dry polished chute, high noon; white and hard sky blue. The brightest, driest segment. **Run it dry first.**
- **Drop:** **appears** at 5.5s. A front of clear water appears under the camera and floods down the chute ahead, glittering. The slide was dry; now it is a river.
- **laugh:** the slide is dry until a whole river shows up.
- **5Q:** kid line yes · mute-the-music drop yes (dry to wet) · calmest thing in frame yes (no rider) · covers-words yes (no text) · one world yes.
- **in:** dry, banked right, heat shimmer. **out:** white spray flash, banked right.
- **Run A:** song 25.1-28.35 (10 pulses), clip 3.55-6.8; water front at 27.05.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still of a curving chalk-white polished waterslide chute carved into a field of white gypsum dunes, completely bone dry, camera 30 cm above the surface on the centerline, heat shimmer rising from the chalky floor, a few brittle desert shrubs on the dune crests, a hard deep blue sky with no clouds, harsh high-noon light, hard short shadows, palette of white and pale sky blue, no water, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides along the dry chute at rising speed, banked right and leveling in the first second, a dry hiss of sand blowing off the lip, heat shimmer wobbling, absolutely no water for 0-5.5s. At 5.5s a front of clear water appears under the camera and rushes down the chute ahead, lifting the camera and filling the chute with a glittering fast river; 5.5-6.5s the surface goes from dry chalk to flowing water. 9.7-10s white spray fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, vanishing point at screen center, no cuts.
```

---

## 08 · cumulus-ribbon — Cumulus Ribbon

- **Look:** stylized soft 3D (storybook, painterly, not photoreal) · **Clip:** 6s (no trim; drop at 3.4)
- **Unique:** clouds, cloud-stuff slide with rain for water, sunrise; peach, lavender, gold. The softest surface in the bank.
- **Drop:** **falls** at 3.4s. The cloud slide ends at the cloud's edge and the camera is thrown off into open sky; the stream becomes rain falling with us over a patchwork of fields.
- **wow:** you slide off the sky.
- **in:** peach-gold sky, banked right. **out:** white spray flash into a lake, banked right.
- **Chain:** start still = last frame of **01** (golden open sky). **Match:** 01 -> 08, 08 -> 10 (peach/lavender into violet).
- **Run A:** song 19.25-21.85 (8 pulses), clip 3.4-6.0; **falls on Drop 1.**

**Start still (Grok Imagine)**
```
Soft stylized 3D storybook render, 16:9, a wide glossy half-pipe slide sculpted out of white cumulus cloud winding across a sunrise sky, a thin sheet of rainwater running down its centerline, camera 30 cm above the water on the flow line, puffy lavender-shaded cloud walls on both sides, the slide ending ahead at a cloud's edge with open sky beyond, a tiny patchwork of green and gold fields very far below, peach and gold sunrise light, soft painterly shading, palette of peach, lavender and gold, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera glides along the cloud slide at gentle-then-fast speed, banked right and leveling in the first second, cloud puffs streaming past. At 3.4s the slide reaches the cloud's edge and the camera is thrown off into open sky: the stream of water turns into streaks of rain falling with the camera, fields rushing up below, a lake bright ahead. 5.7-6s a white splash bloom fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 09 · reef-plunge-tube — Reef Plunge

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 3.0-9.0, drop at 1.0)
- **Unique:** coral lagoon, clear acrylic tube, morning; turquoise, coral, silver. The only slide that changes medium: air to underwater.
- **Drop:** **transforms** at 4.0s. The tube dips into the sea in a bright splash and the ride becomes underwater, with fish.
- **wow:** the slide dives into the sea.
- **in:** bright sky and tube, banked right. **out:** white spray flash, banked right.
- **Match:** **11 -> 09** (glass floor falls, then the sea). Chain: start still = a clear-tube still over a lagoon.
- **Run A:** song 58.25-59.55, clip 4.0-5.3; the plunge splash **is** the Drop 2 white flash.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still inside a clear acrylic tube waterslide sloping down from a stilt platform into a turquoise coral lagoon, camera 30 cm above the thin sheet of water on the tube floor, sunlight pouring through the clear tube walls, the tube ahead dipping below the sea surface with a bright waterline across the lens ahead, a coral reef visible through the walls on both sides, a school of silver fish, morning light, palette of turquoise, coral pink and silver, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides down the clear tube at rising speed, banked right and leveling in the first second, coral and sea passing outside the walls. 0-4s above water, the lagoon wide beside the tube. At 4.0s the tube plunges below the surface in a bright white splash and the camera rides underwater: sunbeams striping through the tube walls, a school of silver fish swerving past, a coral head, a manta ray gliding overhead. 9.7-10s white bubble burst fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 10 · purple-marble-stair — Amethyst Stair (owner pick: purple marble)

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 2.5-8.5, drop at 3.0)
- **Unique:** palace hall, violet marble with white veins and gold-leaf seams, skylight morning; violet, gold, cream. **Stone marble, not glass marbles; no cabinet** (keeps clear of Marble Tick Tack).
- **Drop:** **multiplies** at 5.5s. A row of lion-head fountain spouts, dry until now, all spout at once and the water arches over the slide into a tunnel of jets.
- **wow:** every lion turns the water on at once.
- **Callback (reference only):** one orange traffic cone standing alone on the exit lip. No light, no sign, nobody comments (the purple light ends as a parking cone).
- **in:** violet gleam, banked right. **out:** white spray flash over the cone, banked right.
- **Match:** **10 -> 12** (violet to magenta; fountain spray to rain).
- **Run A:** song 21.85-25.1 (10 pulses), clip 5.5-8.75; fountains on the groove lock.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still on a wide waterslide of polished violet marble with white and gold-leaf veining, spiralling down a grand palace staircase hall, camera 30 cm above a thin glossy sheet of water on the centerline, gold-leaf seams between marble blocks, a colonnade of cream marble columns ahead with dry carved lion-head fountain spouts on the walls, a high glass skylight pouring soft morning light across the polished stone, palette of violet, gold and cream, no people, no text, no glass marbles, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides down the marble slide at rising speed, banked right and leveling in the first second, water curling up the polished curves. 0-2.5s the spiral around the grand stair, 2.5-5.5s passing a colonnade of dry lion-head spouts. At 5.5s every lion-head spout switches on at once and the water arcs over the slide into a tunnel of jets; 5.5-8.0s the camera rides through the arched water. 8.0-9.4s a final straight toward a gold-edged marble lip where a single orange traffic cone stands alone. 9.7-10s white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 11 · glass-spire-trough — Glass Spire (the second 15s)

- **Look:** photoreal · **Clip:** **15s** -> trim **10s** (keep 5.0-15.0, plunge at 6.5) or **6s** (keep 9.0-15.0, plunge at 2.5)
- **Unique:** tower exterior, open low-iron glass trough corkscrewing down the facade (an open trough with low glass sides, not a closed tube, so it stays distinct from 09); dusk; amber, steel blue. Two beats: frost clears at 5.5s; the floor falls away at 11.5s.
- **Drop:** **falls** at 11.5s (the trough ends and the camera is thrown into open air). Secondary: **transforms** at 5.5s (frosted floor clears to the city).
- **wow:** you can see the whole city through your feet.
- **in:** drone-wide, banked right, then frosted glow. **out:** white spray flash into open air, banked right.
- **Match:** **11 -> 09** (a fall, then the sea).
- **Run A:** song 52.0-58.25 (the breakdown, ~19 pulses), clip 6.0-12.25. Floor falls at 57.5 on the second pre-drop dip. Edit a 4-frame white flash 58.1-58.25.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal drone-wide still of a very tall glass skyscraper at dusk with an open waterslide trough of thick low-iron glass corkscrewing down the entire exterior of the tower, a thin glossy sheet of water on the glass floor catching the last amber light, steel-blue sky above and a sea of city lights glowing far below, wisps of cloud at the upper floors, mist at the glass edges, palette of amber and steel blue, no people, no text, no logos, 35mm anamorphic look, Grok Imagine style
```

**Motion (image-to-video, 15s)**
```
0-3s the drone-wide slowly descends toward the top of the glass trough and dives into a slide-cam POV, camera 30 cm above the water on the flow line, 20mm wide lens, banked right then leveling. 3-5.5s sliding through a sandblasted frosted section: milky glowing glass and nothing else visible. At 5.5s the frost clears in a wave running down the trough and the city appears 80 floors below through the clear glass floor, lights glittering. 5.5-11.5s a fast corkscrew ride down the tower, wind pulling the spray sideways. At 11.5s the trough ends at a lip and the camera is thrown into open air in a controlled fall past the glass facade, city lights rushing up. 14.6-15s white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 12 · neon-rain-alley — Neon Alley

- **Look:** photoreal · **Clip:** 6s (no trim; drop at 3.0)
- **Unique:** rain-slick alley, glowing acrylic tubing lit from inside, night rain; magenta and cyan reflected in puddles. Present-day night (not the futuristic ribbon).
- **Drop:** **multiplies** at 3.0s. Abstract glyph signs (no letters) ahead switch on one after another, 3 -> ~30, as the rain streaks flash.
- **wow:** the signs switch on as you pass.
- **Callback (reference only):** a sleek black cat sits on a fire-escape landing at the right edge around 1.8-2.6s, glowing yellow eyes, tail high, not reacting; no knock, same real cat. Town only.
- **do-not:** no readable text, no red EXIT sign, no named city.
- **in:** magenta glow, banked right. **out:** cyan spray flash, banked right.
- **Match:** **18 -> 12** (the neon ring of the motel sign into neon tubing).
- **Run A:** song 28.35-30.95 (8 pulses), clip 1.7-4.3; signs multiply at 29.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still in a narrow rain-slick city alley at night, a half-pipe waterslide made of glowing translucent acrylic tubing lit magenta from inside running down the middle, camera 30 cm above a thin sheet of water on it, wet black walls on both sides with unlit abstract glyph signs and no readable letters, steam rising from a grate, puddles reflecting magenta and cyan, a sleek black cat with glowing yellow eyes sitting on a fire-escape landing at the right edge with its tail high, falling rain streaking the air, palette of hot magenta, cyan and black, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera glides fast down the glowing acrylic slide, banked right and leveling in the first second, rain streaking, water spraying cyan and magenta off the curves, the black cat flicking past at 1.8-2.6s without reacting. At 3.0s the unlit abstract glyph signs ahead switch on one after another, three, then a dozen, then about thirty, flooding the alley with magenta and cyan and the puddles flashing. 5.7-6s cyan spray fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 13 · rust-refinery-flume — Rust Flume

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 3.0-9.0, drop at 4.0)
- **Unique:** derelict refinery, corroded steel half-pipe bolted along gantries, sodium dusk; orange, teal, flaking rust.
- **Drop:** **falls** at 7.0s. The pipe simply ends and the camera drops three meters into a steaming round tank.
- **wow:** the pipe just stops.
- **in:** orange sodium glow, banked right. **out:** white steam/spray flash, banked right.
- **Match:** **04 -> 13** (orange steam to orange rust).
- **Run A:** song 41.35-42.65, clip 6.35-7.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still inside a corroded steel half-round pipe flume bolted along the gantries of a derelict oil refinery at dusk, camera 30 cm above a thin sheet of rust-tinted water on the pipe floor, flaking orange rust and riveted seams on the walls, a ladder cage and valve wheels passing, steam venting from joints, sodium-orange lamps ahead against a teal evening sky, distant storage tanks, palette of burnt orange and teal, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides fast down the rusted pipe flume, banked right and leveling in the first second, water drumming on steel, steam puffing from joints, gantry lamps strobing past. At 7.0s the pipe ends at a lip and the camera drops about three meters into a wide round steaming tank, water bursting up around the lens. 9.7-10s white steam and spray fill the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 14 · cedar-log-flume — Log Flume

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 2.0-8.0, drop at 3.0)
- **Unique:** misty pine valley, weathered cedar V-trough on trestles, late afternoon gold; amber, pine green. The wooden one.
- **Drop:** **multiplies** at 5.0s. One log, then three, then a hundred logs slam in from a side chute and the camera is in the middle of a raft of bumping logs.
- **laugh:** one log, then three logs, then a hundred logs.
- **5Q:** kid line yes · mute-the-music drop yes (the flume suddenly fills) · calmest thing in frame yes (logs, no rider) · covers-words yes · one world yes.
- **in:** warm gold, banked right. **out:** gold spray flash, banked right.
- **Run A:** song 63.45-64.75, clip 4.35-5.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still in a weathered cedar log flume, a V-shaped wooden trough on tall timber trestles crossing a misty pine valley, camera 30 cm above the fast clear water on the centerline, one single peeled log floating ahead, silvered grain and iron bolts on the planks, rows of pines below in drifting mist, low late-afternoon gold light, palette of amber, silver wood and pine green, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides down the cedar flume at steady speed, banked right and leveling in the first second, the single log bobbing ahead. 2-4s two more logs slide in from side chutes, three in total. At 5.0s a side chute upstream releases a hundred logs and the flume fills with a rushing raft of bumping logs on all sides of the lens, water slapping up. 9.7-10s gold spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## BUILT

## 15 · rock-candy-rapids — Rock Candy

- **Look:** stylized clay / stop-motion (handmade, slightly lumpy, not glossy CG) · **Clip:** 6s (no trim; drop at 3.5)
- **Unique:** candy valley, boiled-sugar glass slide with white peppermint stripes and lemonade for water; pink, mint, lemon. The sweetest segment.
- **Drop:** **appears** at 3.5s. The slide enters a gumdrop tunnel and the tunnel bursts into a blast of sprinkles that hang in the air all around the lens.
- **wow:** the tunnel is full of sprinkles.
- **in:** pink-mint, banked right. **out:** pink spray flash, banked right.
- **Match:** **25 -> 15** (pink melon flesh into pink candy).
- **Run A:** song 43.95-45.25, clip 2.85-4.15.

**Start still (Grok Imagine)**
```
Handmade clay stop-motion style still, 16:9, a slide-cam view down a wide spiral waterslide of translucent boiled-sugar glass in pink with white peppermint stripes, camera 30 cm above a thin sheet of pale yellow lemonade on the centerline, a candy valley around it with gumdrop hills in mint and lemon, lollipop trees with swirled heads, a gumdrop tunnel ahead, slightly lumpy fingerprint-textured clay surfaces, bright pastel daylight, palette of pink, mint and lemon, no people, no text, no brand packaging, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera glides fast down the candy slide in choppy stop-motion cadence, banked right and leveling in the first second, lemonade splashing in lumpy clay waves. At 3.5s the slide enters the gumdrop tunnel and the tunnel bursts into a cloud of rainbow sprinkles that hang in the air around the lens, the camera riding through them. 5.7-6s a pink spray bloom fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 16 · brutalist-concrete-chute — Concrete Chute

- **Look:** photoreal, deadpan · **Clip:** 10s -> trim 6s (keep 2.5-8.5, drop at 3.0)
- **Unique:** brutalist atrium, board-marked raw concrete, flat overcast skylight; grey, white, moss. Symmetrical, monastic, silent.
- **Drop:** **falls** at 5.5s. The chute ends on a cantilever and the camera takes a single clean two-second freefall into a rectangular reflecting pool.
- **wow:** a gray slide with the cleanest drop.
- **Callback (reference only):** at the pool's edge, three identical recycling bins in three very slightly different blues, side by side. Nobody comments.
- **in:** grey, banked right. **out:** white spray flash, banked right.
- **Run A:** song 46.55-47.85, clip 4.85-6.15.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still down a wide waterslide chute of board-marked raw concrete running through the middle of a huge symmetrical brutalist atrium, camera 30 cm above a smooth sheet of water on the centerline, monolithic concrete walls with stepped terraces, a narrow slit skylight pouring flat overcast light, patches of moss in the seams, the chute ending far ahead on a bare cantilever above a rectangular reflecting pool, palette of grey, white and moss green, no people, no text, 20mm wide lens, vanishing point at center, perfectly symmetrical composition, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides at steady, silent speed down the concrete chute, banked right and leveling in the first second, the water a smooth unbroken sheet, the symmetrical walls sliding past. At 5.5s the chute ends on the cantilever and the camera takes one clean freefall of about two seconds toward the reflecting pool, three recycling bins in three slightly different blues lined up at its edge growing in frame, then a flat heavy splash at 7.4s. 9.7-10s white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 17 · gaslight-bath-slide — Gaslight Bath

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 1.5-7.5, drop at 3.0)
- **Unique:** Victorian bathhouse, white glazed tile with bottle-green bands, cast-iron columns, brass, glass roof, rolling steam; misty morning; white, bottle green, brass.
- **Drop:** **appears** at 4.5s. Roof louvres swing open one pane at a time and shafts of white light multiply across the steam.
- **wow:** the roof opens one pane at a time.
- **in:** warm gas glow, banked right. **out:** white steam flash, banked right.
- **Match:** **17 -> 24** (steam to a bright lawn).
- **Run A:** song 62.15-63.45, clip 3.85-5.15.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still down a wide waterslide of white glazed tile with bottle-green border bands inside a grand Victorian swimming bathhouse, camera 30 cm above a thin sheet of water on the centerline, cast-iron columns and balustrades, polished brass rails, glowing glass gas-lamp globes along the walls, a vaulted glass-and-iron roof high above holding drifting steam, soft misty morning light, palette of white, bottle green and brass, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides down the tiled slide at rising speed, banked right and leveling in the first second, steam rolling across the lens, brass fittings flashing past. At 4.5s the roof louvres swing open one pane after another down the length of the hall and shafts of white morning light multiply across the steam, gilding the water. 9.7-10s white steam and spray flood the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 18 · motel-baby-slide — Baby Slide, Long Night (the long take)

- **Look:** photoreal, liminal · **Clip:** **10s** (Run A uses 1.2-9.65; a quick version trims bend 1)
- **Unique:** motel pool at 3:44 AM, stubby turquoise fiberglass slide with a chrome ladder, sodium light and one neon sign; turquoise and amber. Wrong scale: a baby slide that goes everywhere.
- **Drop:** **transforms** at 6.5s: rule of three with a wrong third. Bend 1 (1.5s) wraps the ice machine, bend 2 (4.0s) runs under a parked station wagon, bend 3 (the wrong one) loops the loop through the ring of the neon sign. Then a tiny splash at 8.2s.
- **laugh:** the baby slide is secretly very long.
- **5Q:** kid line yes · mute-the-music drop yes (the loop through the sign) · calmest thing in frame yes (no rider, no people) · covers-words yes (the sign is an abstract ring and palm, no letters) · one world yes.
- **Callbacks (references only, all background, nobody comments):** a kraft paper bag with folded top and napkins peeking out sits on the white plastic pool table (the bag the Pizza Guy leaves; he is not here) · a blue CRT glow flickers in one room window (EyeWash is on somewhere) · the office wall clock behind the glass reads 3:44 (hands only) in the start still and again in the final hold (sign-off at 3:44, twice).
- **in:** sodium glow, banked right. **out:** settled pool, ripples, clock in frame (the 9.7s bloom exists for other orders; Run A stops at 9.65).
- **Run A:** song 68.975-77.425 (26 pulses), clip 1.2-9.65. Bend 1 at 69.3, bend 2 at 71.8 (outro groove), loop at 74.3 in the near-silence, tiny splash on the **76.0 stinger**, hold and fade.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal liminal slide-cam still from the top of a stubby turquoise fiberglass waterslide beside a kidney-shaped motel swimming pool at 3:44 in the morning, camera 30 cm above a thin trickle of water on the slide, the slide looking only two meters long with a chrome ladder beside it, a two-story motel with exterior walkways behind, sodium-orange lamps, a neon sign shaped like a glowing ring above a palm silhouette with no letters, a blue CRT television flicker in one room window, an office window showing an analog wall clock with hands at 3:44, a white plastic pool table with a folded kraft paper bag and napkins peeking out, no people, still night air, palette of turquoise and amber, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera slides off the top of the tiny slide, banked right and leveling in the first second, water chuckling. At 1.5s the slide does not end at the pool: it bends right around an ice machine alcove. At 4.0s it runs under a parked station wagon between painted parking lines. At 6.5s, the wrong third, it climbs the motel roof and loops the loop through the ring of the neon sign, the glowing ring flashing around the lens. At 8.2s it drops into the pool with one tiny splash, then 8.4-9.65s the water settles to slow ripples, the neon flickers faintly on the surface and the office clock at 3:44 is in frame. 9.7-10s a small white splash bloom fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## FUTURISTIC / SPACE

## 19 · skyline-ribbon — Skyline Ribbon (owner pick: the futuristic one)

- **Look:** photoreal sci-fi CGI · **Clip:** 10s -> trim 6s (keep 2.0-8.0, drop at 2.5)
- **Unique:** a city of floating-garden towers, seamless white ceramic ribbon with a thin glowing light seam, sunrise; white, mint, cyan.
- **Drop:** **transforms** at 4.5s. The ribbon ends mid-air with a 30 m gap and the water holds its own shape as a solid-looking arc across it; at 6.0s white track panels slide into place under the camera.
- **wow:** the water holds its own shape.
- **in:** white-cyan gleam, banked right. **out:** mint spray flash, banked right.
- **Match:** **19 -> 21** (white ceramic into white tunnel) and **22 -> 19**.
- **Run A:** song 49.15-50.45, clip 3.85-5.15.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal sci-fi slide-cam still on a seamless white ceramic ribbon waterslide with a thin cyan light seam along each edge, winding between floating-garden towers with terraces of trees and waterfalls hanging in a sunrise sky, camera 30 cm above a thin glowing sheet of water on the centerline, a few small silent camera drones drifting in the distance, soft peach sunrise rim light, smooth organic curves, palette of white, mint and cyan, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides at high speed along the white ribbon, banked right and leveling in the first second, the light seam streaking, tower terraces and waterfalls whipping past. At 4.5s the ribbon ends in mid-air and the water continues across a thirty-meter gap as a perfectly held glowing arc, the camera riding the arc over open sky; at 6.0s white ceramic panels slide into place under the water ahead and the ribbon reforms. 9.7-10s a mint spray bloom fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 20 · zero-g-gutter — Zero-G Gutter

- **Look:** photoreal · **Clip:** 10s -> trim 6s (keep 3.5-9.5, drop at 3.0)
- **Unique:** orbital station module with brushed-steel trough, lamp light and the blue curve of Earth through a round window; steel and blue. Water floats as globules.
- **Drop:** **falls** at 6.5s. Gravity switches on: about ten floating water globules fall at once and splash into the trough.
- **laugh:** all the water bubbles fall at once.
- **5Q:** kid line yes · mute-the-music drop yes (everything falls) · calmest thing in frame yes (nobody, only water) · covers-words yes · one world yes. No astronauts, no agency logos.
- **in:** steel-blue, banked right. **out:** white spray flash, banked right.
- **Match:** **20 -> 23** (a globule becomes a dewdrop).
- **Run A:** song 30.95-33.55 (8 pulses), clip 5.2-7.8. Globules hang through the bass duck and **fall at 32.25 when bass returns.**

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still in a long orbital space station module, a brushed-steel waterslide trough running down the middle of the floor with a thin film of water clinging to the steel, camera 30 cm above it on the centerline, about ten large wobbling spheres of water floating in mid-air above the trough, padded handrails and panel lights along the walls, a round window ahead showing the blue curve of Earth, warm lamp light and cool blue Earth glow, palette of steel grey and blue, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides smoothly along the steel trough, banked right and leveling in the first second, the film of water streaming, the floating globules wobbling, stretching and merging in silence, drifting past the lens. From 4.5s everything hangs almost still. At 6.5s gravity switches on: every globule falls at once with a rush and splashes into the trough, water bursting up around the lens, the camera sliding on. 9.7-10s white spray floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 21 · maglev-hover-sheet — Hover Sheet

- **Look:** photoreal CGI · **Clip:** 6s (no trim; drop at 3.0)
- **Unique:** long vacuum tunnel, black glass track, white walls with amber light rings; the water floats a finger-width above the rail and never touches it. No marbles, no London, no cabinet.
- **Drop:** **multiplies** at 3.0s. The one track splits into three parallel tracks, each with its own hovering sheet, camera on the middle one.
- **wow:** the water floats above the rail.
- **in:** white tunnel, banked right. **out:** white-out flash at the tunnel mouth, banked right.
- **Match:** **19 -> 21**.
- **Run A:** song 45.25-46.55, clip 2.35-3.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal CGI slide-cam still in a long white vacuum tunnel, a black glass maglev track running down the center with a thin sheet of water hovering a finger-width above the glass and rippling in place, camera 30 cm above the water sheet on the centerline, amber light rings set into the tunnel walls every few meters, a white-hot glow far ahead at the tunnel mouth, clean seamless panels, palette of white, black glass and amber, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera shoots forward at very high speed down the tunnel, banked right and leveling in the first second, the amber rings strobing past, the hovering water sheet rippling just above the glass. At 3.0s the single track splits into three parallel tracks, each carrying its own hovering sheet, the camera on the middle one with the others flickering past on both sides. 5.7-6s a white-out flash fills the frame as the tunnel mouth arrives, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 22 · hologram-draft — Draft Slide

- **Look:** stranger 3D (cyan wireframe light that renders itself into matte white clay) · **Clip:** 6s (no trim; drop at 3.5)
- **Unique:** dark studio void, a slide that is still being drawn; black, cyan, then white. No figures, no avatar, no cast hologram (this is an abstract wireframe path, not a person).
- **Drop:** **transforms** at 3.5s. The wireframe fills in solid white clay in a sweep running just ahead of the camera, soft shadows blooming under it. The water was real the whole time.
- **wow:** the slide is drawn just ahead of you.
- **in:** cyan lines on black, banked right. **out:** white-out bloom, banked right.
- **Match:** **02 -> 22** (cyan ice to cyan wire) and **22 -> 19** (white clay to white ceramic).
- **Run A:** song 47.85-49.15, clip 2.85-4.15.

**Start still (Grok Imagine)**
```
Cinematic 16:9 stylized 3D slide-cam still in a dark empty studio void, a slide drawn only as glowing cyan wireframe lines forming a curving half-pipe track ahead, camera 30 cm above the glossy ribbon of real water running down the centerline of the wireframe with no solid surface under it, cyan grid lines converging to the vanishing point, faint light haze, the wireframe fading to nothing behind, palette of black and cyan, no people, no avatar, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera glides fast along the wireframe slide, banked right and leveling in the first second, the ribbon of real water following the glowing lines with nothing under it. At 3.5s a wave of rendering sweeps ahead of the camera: the wireframe fills in as smooth matte white clay with soft ambient shadows, panel by panel, the water now sliding on a solid surface. 5.7-6s a white-out bloom fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## SILLY / IMPOSSIBLE

## 23 · ant-leaf-queue — Leaf Slide

- **Look:** photoreal macro · **Clip:** 6s (no trim; drop at 3.6)
- **Unique:** one broad wet garden leaf, morning dew, ant-scale camera (30 cm in ant-scale, so macro); green and silver. Wrong scale: the biggest thing in the frame is a raindrop.
- **Drop:** **falls** at 3.6s. A single raindrop the size of a beach ball falls and lands in front of the camera in a huge slow splash that fills the frame.
- **laugh:** a raindrop as big as a bus lands on the ants' slide.
- **5Q:** kid line yes · mute-the-music drop yes (the drop falls and splashes) · calmest thing in frame yes (a tidy line of ants, no panic) · covers-words yes · one world yes.
- **Dedupe note:** not the `ant-movers` couch gag. No furniture, no person, ants only queue.
- **in:** green dew, banked right. **out:** the raindrop splash fills the frame (the wipe into 01).
- **Chain:** 20 -> 23 (a floating globule becomes a dewdrop). **Run A:** song 0.0-3.975 (12 pulses), clip 0.0-3.975; splash wipes into 01.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal extreme macro slide-cam still from the top of a smooth waxy green leaf that acts as a waterslide, camera a few millimeters above a thin sheet of water running down the central vein, a perfectly tidy single-file line of about eight black ants waiting along the leaf margin on the right, each facing the same way, silver dewdrops clinging to the leaf, soft morning light with shallow depth of field and creamy bokeh, palette of green and silver, no people, no text, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera slides down the leaf's central vein at ant scale, banked right and leveling in the first second, the line of ants flicking past at the right edge in a neat file, dewdrops shivering. At 3.6s one single raindrop the size of a beach ball falls from the top of frame and lands just ahead of the lens in a huge slow splash. 3.7-4s the splash fills the frame white, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 24 · garden-hose-coil — Hose Slide

- **Look:** photoreal · **Clip:** 6s (no trim; drop at 4.0)
- **Unique:** the slide is a coiled green vinyl garden hose, camera inside the water; sunlit suburban lawn glimpsed through the walls; green, gold. Slide that is also something else.
- **Drop:** **multiplies** at 4.0s. Out through the nozzle: the jet breaks into ten thousand droplets in a fan, a small rainbow appears in the spray, the lawn spreads out below.
- **laugh:** the whole slide is a garden hose and somebody twists the nozzle.
- **5Q:** kid line yes · mute-the-music drop yes (jet to mist) · calmest thing in frame yes (no rider, no people) · covers-words yes · one world yes.
- **in:** green-gold, banked right. **out:** white mist flash, banked right.
- **Match:** **17 -> 24** (steam to bright lawn).
- **Run A:** song 64.75-66.05, clip 3.35-4.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 photoreal slide-cam still from inside a coiled translucent green vinyl garden hose, camera in the middle of a fast stream of clear water filling the tube, the curved hose walls glowing green with the sunlit lawn and sky blurred behind them, embossed ridge lines and a brass coupling on the wall, the hose looping ahead in a coil toward a nozzle, bright afternoon light, palette of green and gold, no people, no text, no logos, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera rushes along inside the hose at high speed, banked right and leveling in the first second, the coils curving past, the green walls flashing sunlight, air bubbles streaming. At 4.0s the nozzle twists open and the camera shoots out: the solid jet breaks into ten thousand droplets in a wide fan, a small rainbow flickering in the spray, a green lawn spreading out below. 5.7-6s white mist floods the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 25 · watermelon-spiral — Melon Spiral

- **Look:** hyperreal food-commercial (macro, backlit, a touch of stylization) · **Clip:** 6s (no trim; drop at 4.5)
- **Unique:** inside a giant watermelon, a spiral channel carved in glistening pink flesh with black seeds as bumpers; pink juice for water; pink, black, green. Food + spiral-inside-a-thing.
- **Drop:** **appears** at 4.5s. The camera bursts out through the green rind in a shower of juice and shards. **Freeze this frame at the 51.75 hard stop.**
- **laugh:** a slide inside a watermelon and the seeds go pew.
- **5Q:** kid line yes · mute-the-music drop yes (burst through the rind) · calmest thing in frame yes (no rider) · covers-words yes · one world yes.
- **in:** pink glow, banked right. **out:** juice spray flash, banked right.
- **Match:** **25 -> 15** (pink to pink).
- **Run A:** song 50.45-51.75, clip 3.2-4.5, ending on the burst; hold the frame to 52.0.

**Start still (Grok Imagine)**
```
Cinematic 16:9 hyperreal food-commercial slide-cam still inside a giant watermelon, a smooth spiral waterslide channel carved into glistening pink flesh, camera 30 cm above a thin stream of translucent pink juice running down the channel, black seeds embedded along the channel walls like bumpers, the green rind glowing from behind with bright sunlight so the whole interior is backlit in pink and gold, tiny juice droplets floating in the air, extreme macro texture on the flesh, palette of pink, black and green, no people, no text, no brand packaging, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera spirals fast down the carved channel, banked right and leveling in the first second, juice sloshing up the walls, a few black seeds popping out of the flesh and shooting past the lens one by one. At 4.5s the camera bursts out through the green rind in a shower of pink juice and rind shards into bright sunlight, droplets and fragments hanging in the air around the lens. 5.7-6s juice spray fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 26 · animal-lifeguards — Wrong Third

- **Look:** stylized 3D animated-feature (bright, soft, not photoreal) · **Clip:** 10s (no trim; the 6s version loses the first chair)
- **Unique:** sunny water park, molded yellow plastic slide, a row of lifeguard chairs along the deck. Rule of three with a wrong third. Animals deadpan, calmest thing in frame. **No goose, no seagull, no red visor, no whistle** (those belong to other files).
- **Drop:** **appears** at 4.0s. Chair 1: a sea otter with zinc on its nose holding a red rescue buoy (0.8s). Chair 2: a grey heron in an orange life vest standing on one leg (2.3s). Chair 3: a huge brown bear asleep in a chair far too small, arms around a rescue buoy like a teddy bear (4.0s). End reaction, spent once: at 5.5s the bear opens one eye.
- **laugh:** otter, heron, bear.
- **5Q:** kid line yes · mute-the-music drop yes (the bear is in the third chair) · calmest thing in frame yes (nobody moves) · covers-words yes · one world yes.
- **One deliberate nod, nothing more:** in the landing pool, six small penguins in swim rings look up, and far behind them a blue tube slide has one section bulging. The pop is not shown. That is the whole nod to `walrus-cork`; do not redo it.
- **in:** bright yellow, banked right. **out:** splash flash into the pool, banked right.
- **Run A:** song 33.55-37.45 (12 pulses), clip 0.6-4.5; the bear appears at 36.95.

**Start still (Grok Imagine)**
```
Stylized 3D animated-feature still, 16:9, a slide-cam view down a wide bright yellow molded plastic waterslide in a sunny water park, camera 30 cm above a clear sheet of water on the centerline, a row of tall white lifeguard chairs along the deck on the right with the first one holding a sea otter with zinc on its nose and a red rescue buoy, tidy blue pool and striped umbrellas, soft rounded shapes, sunny blue sky, palette of primary yellow, blue and red, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides at fast steady speed down the yellow slide, banked right and leveling in the first second, water splashing. 0.8s passing chair one: the sea otter sits upright, deadpan. 2.3s passing chair two: a grey heron in an orange life vest standing on one leg, deadpan. 4.0s passing chair three: a huge brown bear fast asleep in a chair far too small, hugging a rescue buoy like a teddy bear. 5.5s the bear opens one eye. 8-9.7s the slide runs out into a landing pool where six small penguins in swim rings float and look up, a blue tube slide with one bulging section far behind them. 9.7-10s white splash flash fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 27 · penrose-clay-loop — Penrose Loop

- **Look:** stranger 3D (matte white clay render, soft studio shadows, pale blue water) · **Clip:** 10s -> trim 6s (keep 2.5-8.5, drop at 2.5)
- **Unique:** white void, a slide of three straight runs and three right-angle corners that is always downhill and still closes into a loop. Impossible geometry. Not the chrome Mobius sequence: matte clay, daylight, a slide with water, no chrome.
- **Drop:** **reverses** at 5.0s. At the second corner the camera rolls 90 degrees so the wall becomes the floor and the water runs the new way. At ~9s the start of the slide is visible ahead: we are back at the top.
- **wow:** it is always downhill and it comes back to the top.
- **in:** white clay, banked right. **out:** white bloom, banked right.
- **Match:** **06 -> 27** (spiral to loop).
- **Run A:** song 66.05-67.35, clip 4.35-5.65.

**Start still (Grok Imagine)**
```
Cinematic 16:9 stylized 3D slide-cam still on a slide made of matte white clay with soft studio shadows floating in an endless white void, a wide rounded half-pipe running straight ahead then turning a right angle, camera 30 cm above a thin ribbon of pale blue water on the centerline, the slide visibly dropping at every section yet its far end curling back toward the near end, clay fingerprint softness, palette of white and pale blue, no people, no text, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 10s)**
```
Camera glides smoothly down the clay slide, banked right and leveling in the first second, the water ribbon following. 0-5s one long run and the first right-angle corner, always going downhill. At 5.0s the second corner rolls the camera 90 degrees: the wall becomes the floor and the water ribbon follows the new floor as if gravity had turned. 5-9s the third run drops again and the slide's starting point appears ahead, the camera arriving back at the top it left. 9.7-10s a white bloom fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

## 28 · origami-boat-fold — Paper Boat

- **Look:** stylized paper-craft diorama (folded paper, soft lamp shadows, shallow tilt-shift) · **Clip:** 6s (no trim; drop at 3.9)
- **Unique:** a paper-craft landscape, a slide of folded white paper with visible creases, ink-blue translucent paper for water, warm lamp light; white and ink blue.
- **Drop:** **transforms** at 3.9s. The end of the slide folds itself, crease by crease, into a paper boat that carries the camera out onto a rippling ink-blue paper sea.
- **laugh:** the slide folds itself into a boat.
- **5Q:** kid line yes · mute-the-music drop yes (the folding is the whole picture) · calmest thing in frame yes (no rider) · covers-words yes (blank paper, no printing) · one world yes.
- **in:** warm paper white, banked right. **out:** white paper flash, banked right.
- **Run A:** song 67.35-68.975 (5 pulses), clip 3.25-4.875; fold at beat 3.

**Start still (Grok Imagine)**
```
Cinematic 16:9 stylized paper-craft diorama slide-cam still, a waterslide made of folded white paper with crisp visible creases and facets curving down a small landscape of paper mountains and tiny paper pines, camera 30 cm above a ribbon of translucent ink-blue paper waves on the centerline, a warm desk-lamp glow with soft cast shadows and shallow tilt-shift depth of field, blank unprinted paper, palette of white and ink blue, no people, no text, no printing, 20mm wide lens, vanishing point at center, Grok Imagine style
```

**Motion (image-to-video, 6s)**
```
Camera glides down the folded paper slide in a slightly stepped stop-motion cadence, banked right and leveling in the first second, the paper waves rustling past. At 3.9s the end of the slide folds itself up crease by crease, in about a second, into a paper boat that carries the camera out onto a rippling ink-blue paper sea. 5.7-6s a white paper flash fills the frame, camera banks right about 12 degrees. No rider, no hands, no feet, never looks back, no cuts.
```

---

# CUTTING

## Good hard match-cuts (same surface color or shape across the cut)

Cut these pairs hard, on the pulse, with the spray-flash wipe. Each carries the same
bank-right and the same vanishing point, so the swing never breaks.

| Pair | Why it works |
|---|---|
| **23 -> 01** | the raindrop splash wipes into the tower wide (tiny to huge) |
| **01 -> 08** | macaws exit into open golden sky; the cloud slide starts in that sky (chain: last frame of 01 = start still of 08) |
| **08 -> 10** | peach and lavender rain into violet marble |
| **10 -> 12** | violet to magenta; fountain spray to night rain |
| **02 -> 22** | cyan ice into cyan wireframe |
| **04 -> 13** | orange steam into orange rust |
| **20 -> 23** | a floating water globule becomes a dewdrop (chain: last frame of 20 = start still of 23) |
| **25 -> 15** | pink melon flesh into pink candy |
| **11 -> 09** | the glass floor falls, then the sea (a fall into a splash) |
| **06 -> 27** | spiral inside a tree into the loop |
| **18 -> 12** | the neon ring of the motel sign into glowing tubing |
| **17 -> 24** | white steam into a bright green lawn |
| **19 -> 21** | white ceramic curves into the white tunnel |
| **22 -> 19** | white clay into white ceramic |
| **03 -> 07** | gold noon beam into white noon dunes |
| **05 -> 20** | points of light into floating globules |

## RUN B — contrast cuts (wet/dry, tiny/huge, warm/cold)

A lighter variant. Same grid, same section times as the map above. Trims are left to the
editor: put each clip's drop in the last third of its cut, or on the named event. Every cut is
a **contrast pair**: alternate temperature, scale, or wet/dry. Uses all 28.

| Section (s) | Cuts | Ids, in order | Contrast rule |
|---|---|---|---|
| Intro 0.0-18.925 | 20p / 16p / 10p, then riser 4p x3 | 07 (dry to wet) -> 02 (cold) -> 04 (hot); riser 23 (tiny) -> 01 (huge) -> 28 (tiny) | dry/wet, cold/hot, tiny/huge |
| gap 18.925-19.25 | 1p | hold white | none |
| Groove A 19.25-30.95 | 8 / 10 / 10 / 8p | 10 (warm) -> 09 (cold sea) -> 14 (warm) -> 12 (cold night) | warm/cold every cut |
| Mini-break + B 30.95-37.45 | 8p, 12p | 20 (falls at 32.25) -> 26 | bright steel to bright plastic |
| Breather 37.45-40.05 | 8p | 05 (ramps to the peak) | dark |
| Peak 40.05-51.75 | 9 x 4p | 13 -> 21 -> 03 -> 16 -> 15 -> 22 -> 06 -> 24 -> 25 | warm/cold alternating; 25 bursts on the **51.75 stop**, freeze to 52.0 |
| Breakdown 52.0-58.25 | long take | 11 (calm clear glass, floor falls at 57.5) | quiet |
| Final chorus 58.25-68.975 | 4 x 8p (+1p) | 08 (falls on Drop 2, mirror of 19.25) -> 19 -> 27 -> 17 | slower, paired contrast replaces the rapid cuts |
| Outro + tail 68.975-77.425 | one take | 18 (loop at 74.3, splash on the 76.0 stinger) | tiny/huge |

## RUN C — loop: ends where it began

A lighter variant. **The first frame and the last frame are the same still**: the motel slide
at 3:44, clock hands in frame. Escalates ground-level to impossible, then comes home. Uses all
28, plus an 8.45s reprise of 18's start still (a quiet hold, one tiny drop on the stinger). Same grid.

| Section (s) | Cuts | Ids, in order | Tier |
|---|---|---|---|
| Intro 0.0-18.925 | 20p, 10p, 10p, 8p, then riser 4p / 3p / 3p | 18 (first 6.5s, loop through the sign at 6.5) -> 24 -> 23 -> 14; riser 28 -> 17 -> 15 | ground-level and domestic |
| gap 18.925-19.25 | 1p | hold white | none |
| Groove A 19.25-30.95 | 8 / 10 / 10 / 8p | 03 -> 07 -> 06 -> 12 | open ground and street |
| Mini-break + B 30.95-37.45 | 8p, 12p | 20 (falls at 32.25) -> 26 | rule-of-three and zero-g |
| Breather 37.45-40.05 | 8p | 05 | dark |
| Peak 40.05-51.75 | 9 x 4p | 13 -> 16 -> 10 -> 04 -> 02 -> 09 -> 11 -> 08 -> 25 | built and huge; 25 on the **51.75 stop**, freeze to 52.0 |
| Breakdown 52.0-58.25 | long take | 27 (clip 0.0-6.25; the wall becomes the floor at ~57.0, inside the pre-drop dip) | impossible |
| Final chorus 58.25-68.975 | 8p, 8p, 8p, 9p | 19 (Drop 2 white flash) -> 21 -> 22 -> 01 (macaws at ~68.0) | futuristic, then the tallest |
| Outro + tail 68.975-77.425 | one 8.45s hold + fade | reprise of **18's start still**: same frame as 0.0, pool shimmering, one tiny drop leaves the slide lip and rings the pool on the 76.0 stinger | the loop closes |

---

## Generate order (hardest to get right first)

1. **11 glass-spire-trough** first. Clear glass with a city seen through the floor and two
   separate beats is the likeliest to come back as a closed tube or a mush. If 11 works, the
   vocabulary works.
2. **20 zero-g-gutter.** Floating globules that all fall at once; generators want a
   calm trough or a bubble screensaver.
3. **27 penrose-clay-loop.** Impossible geometry; expect a normal slide. Generate the still
   first and check that the end of the slide curls back toward the start.
4. **22 hologram-draft.** Wireframe that renders solid; expect it to stay one thing.
5. **18 motel-baby-slide.** Three bends and a loop through the sign, plus the clock hands at
   3:44. Chain from the still if the sign hoop fails.
6. **19 skyline-ribbon.** Water holding an arc over a gap.
7. **07 dry-run-white-dunes.** The model will fill the chute with water from frame 1. Keep
   "completely bone dry" at the front of the prompt.
8. **26 animal-lifeguards.** Three animals on a schedule, and no goose.
9. **01 jungle-kapok-tower.** 15s scale and consistency; check the drone-wide still before
   spending the 15s.
10. Then **09, 21, 28, 25, 24, 10, 16.** Medium difficulty: medium transitions and set pieces.
11. Last, the well-trodden looks: **02, 03, 04, 05, 06, 08, 12, 13, 14, 15, 17, 23.**

If a drop will not appear in-clip, put the **before** frame in the start still and generate the
**after** as a separate clip chained from the last frame (last frame of clip N is the start
still of clip N+1). Always pass the start still; do not rely on text-to-video for these.
Check each clip's drop second against the Run A trim before committing; retime up to 8%.

## Shared negative line (append to every prompt)

```
no people, no riders, no hands or feet in frame, no children, no swimsuits, no faces, no on-screen text, no readable signs, no logos, no brands, no watermarks, no real parks or landmarks, no HUD, no subtitles, no looking back, no cuts inside the clip, no lens-flare discs, no rainbow arc unless stated, no second slide in the frame unless stated
```

---

## Writers' notes

**Callbacks spent (references only, never sets):** napkin bag, EyeWash CRT and the 3:44
clock in **18** · the purple light's parking cone in **10** · Brad's three bins in three blues
in **16** · the black cat as a witness in **12** (town, no knock, no reaction) · the
`walrus-cork` nod in **26** (background only, the pop is not shown). Locks respected: the
Pizza Guy is not on screen and the bag is a prop; the cat is the real animal and not on the
ridge; the napkin bag stays out of the space segments (kill list); EyeWash is on in the
background and nobody comments; no cast on screen anywhere.

**Dedupe (grepped `ideas/`, `notes/`, `songs/`, `songs/_drawer/`, `prompts/`, `content/`):** no
file stages a waterslide beyond `content/cartoons/walrus-cork.json`. Variations made:
`Whistle_Twice` owns the goose lifeguard, the red visor and the whistle, so 26 uses an otter,
a heron and a bear and none of those · `The Bathtub Is the Ocean` owns the tub, so there is
no bathtub slide; 24 is a garden hose · `content/sequences/mobius-chrome.json` owns the chrome
Mobius, so 27 is a matte clay Penrose loop · `squeaky-knight` owns the sleeping dragon's
eye, so no dragon · `ant-movers` owns ants with a couch, so 23 only queues · `choose-your-basalt`
owns the lava tubes under a gothic house, so 04 is an outdoor volcano tube with no house ·
`marble-tick-tack-worlds` owns the London maglev with marbles, so 21 is a hover sheet with no
marbles, city or cabinet · `First_Light_Salt_Flats` is avoided for 07 · the hologram in the
Monster Mash and Riley files is a person, so 22 is an abstract wireframe with no figure.

**Five-question check (funny segments 07, 14, 18, 20, 23, 24, 25, 26, 28):** all nine pass
five of five (see each block). Spectacle segments carry a `wow:` line and are not scored as
jokes.

**Open and not done:** timings come from analysis of the owner's uploaded MiniMax render, not
from listening; verify cuts against the waveform (+/-0.15s). Lyrics and vocals are unknown, so
none are written, and every segment is rider-less and mouths-off. No song written, no stills
generated, no audio or video added. `promote?: no`. The deliberate nod to `walrus-cork` is a
background glance only.
