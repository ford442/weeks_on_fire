---
stream: video
status: draft
created: 2026-11-19
links: [waterslide]
promote?: no
---

# Waterslide — More Segments (seed drawer)

*Text only. `agent: claude`. `promote?: no`. Drawer only.*

**What this is:** extra seeds for the existing cut-between bank. It does **not** replace
the 28 in `prompts/waterslide-segments.md`, the 26 in `-a.md` / `-b.md`, Run A, or the cut
grammar. Every seed below drops into that bank as one more interchangeable clip.

**Inherited, not re-decided:**
- **No people.** No rider, hands, feet or cast. The only continuity object is the **one
  empty bright yellow inflatable inner tube**, riding alone in frame (or pure slide-cam with
  the tube just ahead on the flow line).
- **Cut grammar:** every motion prompt ends with the three tokens: **BANK-RIGHT ·
  SPRAY-FLASH · SLIDE-CAM** (vanishing point x 50% / y 42%, 20mm, camera 30 cm above the flow,
  never looks back, travel into the screen). Paste the shared visual lock and the shared
  negative line from `prompts/waterslide-segments.md` with every still.
- High forward speed always, except a seed that is built to **freeze or hang on a
  musical drop** (marked).
- **Mute Imagine audio.** Stack on the Waterslide song bed.
- Farm picture **#22**, never #42.
- **Worlds do not mix.** No Bounce House, Bounce Castle, mountain lion, Daisy, night-lot,
  Glam, Well Fall, Christina or Annex. Callbacks below are background props only.

**Token line (paste at the end of every motion prompt):**
```
Empty bright yellow inflatable inner tube rides alone just ahead of the camera on the flow line. Opens already banked right and levels in the first second, clearing out of a white spray burst. Ends with a <=0.3s white spray burst filling the frame while banking right about 12 degrees. Camera 30 cm above the flow, 20mm wide lens, vanishing point at screen center, travel into the screen, never looks back, no people, no rider, no hands, no feet, no cuts.
```

**Dedupe:** grepped `ideas/`, `prompts/`, `notes/`, `content/cartoons/`, `songs/`,
`songs/_drawer/` for each premise's nouns. Skipped as already owned: car wash
(`car-wash-windows-down`), snow globe (`snow-globe-field-report`), lighthouse
(`well-fall` and others), dominoes, gumballs/marble runs (Marble Tick Tack owns marbles),
piano keys (`well-fall`), rubber ducks (`kiddie-pool-shark`, `squeaky-knight`), bathtub
(`The Bathtub Is the Ocean`), fountains on marble (bank 10), hose (bank 24). None of the
seeds below shares a setting + material pair with any of the 28 or the A/B 26.

---

## Catalog

| # | id | Name | Look | Lane | Clip -> trim | Drop |
|---|---|---|---|---|---|---|
| M01 | `dam-spillway-face` | Spillway Face | photoreal | spectacle / **vertical plate** | 10 -> 6 | **falls** 5.2 |
| M02 | `cenote-sky-shaft` | Cenote Shaft | photoreal | spectacle / **vertical plate** | 10 -> 6 | **falls** 4.6 |
| M03 | `rice-terrace-cascade` | Terrace Steps | photoreal | spectacle | 10 -> 6 | **multiplies** 5.0 |
| M04 | `stone-aqueduct-run` | High Aqueduct | photoreal | spectacle | 10 -> 6 | **multiplies** 4.5 |
| M05 | `chalk-cliff-blowhole` | Blowhole | photoreal | spectacle | 6 | **appears** 3.3 |
| M06 | `wave-barrel-tube` | Inside the Wave | photoreal | spectacle | 6 | **transforms** 3.0 |
| M07 | `mangrove-root-tunnel` | Root Tunnel | photoreal | **loop candidate** | 6 | **appears** 3.0 |
| M08 | `bubble-wrap-dock` | Bubble Run | photoreal | kid-silly | 6 | **multiplies** 3.2 |
| M09 | `bendy-straw-lemonade` | Bendy Straw | hyperreal food | kid-silly | 6 | **falls** 3.5 |
| M10 | `house-gutter-downspout` | Gutter Run | photoreal macro-scale | kid-silly | 10 -> 6 | **falls** 5.0 |
| M11 | `toy-track-fishbowl` | Toy Track | stylized 3D | kid-silly | 10 -> 6 | **falls** 6.0 |
| M12 | `crayon-melt-chute` | Crayon Melt | stylized clay | kid-silly / strange 3D | 6 | **transforms** 3.4 |
| M13 | `pool-noodle-tunnel` | Noodle Tunnel | stranger 3D | **loop candidate** | 6 | **reverses** 3.0 |
| M14 | `sky-hang-insert` | The Hang | photoreal | **insert beat** (freeze/hang) | 6 | **falls** 4.2 |
| M15 | `sandbar-tide-flume` | Tide Flume | photoreal | **loop candidate** | 6 | **appears** 3.0 |

Drop spread: falls 5 · multiplies 3 · appears 3 · transforms 2 · reverses 1 · (plus the
M14 hang). Leans on "falls" on purpose: the bank asked for vertical plates.

---

## M01 · dam-spillway-face — Spillway Face (vertical drop plate)

- **wow:** the slide is the whole front of a dam, and it goes straight down.
- **Setting + material:** a giant curved gravity dam in a pine gorge; the run is the
  **stepped granite-block spillway** face, white water tumbling over every step.
- **Core visual:** slide-cam skims a flat calm reservoir lip toward the dam crest, the
  tube just ahead, mist rising from somewhere below the edge. The lip arrives, the tube
  tips over and the frame turns **vertical**: hundreds of meters of stepped white water
  straight down to a churning plunge pool and a rainbow in the spray.
- **Drop / change:** **falls** at 5.2s, the tube goes over the crest. Built to sit on a
  musical drop: Drop 1 (19.25) or Drop 2 (58.25) after the white gap hold.
- **Length:** 10s -> trim 6s (keep 2.0-8.0, drop at 3.2), or a 1.3s quick cut
  `[4.55, 5.85]`.
- **Lane:** real water, one empty tube, no people, no town. Differs from bank 16 (indoor
  brutalist board-marked concrete chute) by setting, material and the vertical turn.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still, camera 30 cm above a flat glassy reservoir surface flowing toward the crest of a giant curved granite dam in a pine gorge, an empty bright yellow inflatable inner tube floating just ahead on the flow line, the crest edge a sharp line across the frame with white mist rising beyond it, far canyon walls and pines, late morning light, no people, no text, no logos, 20mm wide lens, vanishing point at screen center
```
**Motion (10s)**
```
0-5s: fast skim across the reservoir lip toward the crest, mist thickening, speed rising. At 5.2s the tube tips over the crest and the camera follows: the frame pitches to vertical and reveals the stepped granite spillway falling hundreds of meters, white water exploding off every step, a plunge pool and a rainbow in the spray far below. 5.2-9.7s: steep fast descent down the steps. [token line]
```

---

## M02 · cenote-sky-shaft — Cenote Shaft (vertical drop plate)

- **wow:** the jungle has a hole in it, and the slide jumps in.
- **Setting + material:** a round open sinkhole in flat dry forest; a **carved
  terracotta-clay channel** runs across the ground to the rim; sun beams fall into
  turquoise water 30 m below; hanging roots.
- **Core visual:** fast run along the red clay channel through low scrub, the round dark
  mouth of the cenote ahead. The channel ends at the rim; the tube sails out, and the
  camera tips down a vertical sun-shaft toward a disc of glowing turquoise.
- **Drop / change:** **falls** at 4.6s. The splash at the bottom (about 5.8s) can be the
  SPRAY-FLASH itself. Second candidate for Drop 2, or the 57.5 dip into 58.25 if bank 11 is
  not used.
- **Length:** 10s -> 6s (keep 1.5-7.5).
- **Lane:** natural photoreal, no cave interior (bank 05 owns the wet limestone gallery),
  no figures in the water.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still along a carved red terracotta clay water channel running through low dry tropical scrub toward the round open mouth of a deep sinkhole, an empty bright yellow inflatable inner tube just ahead on the flow line, long roots hanging into the hole, a vertical beam of sun falling into it, hint of turquoise far below, noon light, no people, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (10s)**
```
0-4.5s: fast run along the clay channel, scrub flashing past, the sinkhole growing. At 4.6s the channel ends at the rim, the tube sails out and the camera pitches straight down a vertical beam of sunlight past hanging roots toward a glowing turquoise disc of water. 5.8s the tube hits the water in a white splash. [token line]
```

---

## M03 · rice-terrace-cascade — Terrace Steps

- **wow:** the whole mountain is stairs, and every stair is a pool.
- **Setting + material:** a mountainside of flooded rice terraces at sunrise; the run is
  **packed-mud terrace walls**, the tube skipping from paddy to paddy over little
  overflow waterfalls.
- **Core visual:** slide-cam over mirror-flat paddies reflecting pink sky; each terrace
  lip is a tiny drop and a bump. The steps accelerate.
- **Drop / change:** **multiplies** at 5.0s: the camera clears a ridge and the terraces
  multiply out to the horizon, hundreds of mirrors catching the sun at once.
- **Length:** 10s -> 6s; 1.3s quick cut `[4.35, 5.65]` for the peak.
- **Lane:** photoreal spectacle, no farmers, no animals, no huts with people. Not bank 14
  (cedar flume) or 15 (canyon).

**Start still**
```
Cinematic 16:9 photoreal slide-cam still skimming low over a flooded rice terrace at sunrise, an empty bright yellow inflatable inner tube just ahead at the lip of the terrace where water spills over a mud wall into the next terrace below, mirror-flat water reflecting pink and gold sky, green rice shoots, misty mountain ridges, no people, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (10s)**
```
Fast descent hopping terrace to terrace, a small splash and bump at every overflow lip, rhythm accelerating. At 5.0s the camera clears a ridge and hundreds of terraces spread to the horizon, every mirror flashing sunrise at once. [token line]
```

---

## M04 · stone-aqueduct-run — High Aqueduct

- **wow:** the bridge is a river, way up in the air.
- **Setting + material:** an ancient-style **dry-stone arched aqueduct** crossing a wide
  valley; open stone channel on top, clear water racing.
- **Core visual:** the channel is barely wider than the tube; the valley floor is far
  below on both sides. Sheep-sized fields, a river, tiny trees.
- **Drop / change:** **multiplies** at 4.5s: the camera sees the arches stack, one tier,
  then two, then **three tiers deep**, and the valley drops twice as far.
- **Length:** 10s -> 6s.
- **Lane:** no real landmark (generic, invented valley), no visitors, no vehicles.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still along the open water channel on top of a tall invented dry-stone arched aqueduct crossing a wide green valley, clear fast water, an empty bright yellow inflatable inner tube just ahead, the channel walls low so the valley floor is visible far below on both sides, warm afternoon light, no people, no landmarks, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (10s)**
```
Fast run along the narrow channel, stone joints flicking past. At 4.5s the valley widens and the arches below are revealed stacking in three tiers, the ground dropping much farther away. Wind spray off the edge. [token line]
```

---

## M05 · chalk-cliff-blowhole — Blowhole

- **wow:** the sea sneezes and the tube goes up.
- **Setting + material:** white chalk sea cliffs; a **smooth chalk-carved channel**
  running toward a rock hole near the edge; waves booming below.
- **Core visual:** a hard fast run along the white channel toward a round dark hole; the
  tube slows a hair as it reaches the hole.
- **Drop / change:** **appears** at 3.3s: a white geyser of sea spray blasts up out of
  the blowhole and launches the tube skyward; the burst is the SPRAY-FLASH.
- **Length:** 6s; quick cut `[2.65, 3.95]`.
- **Lane:** photoreal natural, no basalt (bank 04), no people on the cliff path.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still along a smooth carved white chalk water channel on top of white sea cliffs, an empty bright yellow inflatable inner tube just ahead approaching a round dark rock blowhole near the cliff edge, deep blue sea and surf below, bright windy day, no people, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
0-3s fast run down the chalk channel toward the blowhole. At 3.3s a huge white geyser of sea spray blasts up from the hole and launches the tube straight up, filling the frame with white. [token line]
```

---

## M06 · wave-barrel-tube — Inside the Wave

- **wow:** the slide is a wave and it rolls a roof over you.
- **Setting + material:** open ocean; the slide surface is the **face of a giant glassy
  green wave**, no board, just the tube.
- **Core visual:** slide-cam races along the wave face, sun through the water.
- **Drop / change:** **transforms** at 3.0s: the lip pitches over and the wave becomes a
  glowing green tunnel around the camera; the exit is a white burst of foam.
- **Length:** 6s. Loop-adjacent: the barrel holds well for a 1.3s peak cut.
- **Lane:** no surfer, no board, no beach crowd. Not bank 09 (acrylic reef tube): no
  built tube, only water.

**Start still**
```
Cinematic 16:9 photoreal still, camera 30 cm above the glassy green face of a giant ocean wave, an empty bright yellow inflatable inner tube riding just ahead along the face, sun shining through the translucent water, spray off the lip above, open ocean, no people, no surfboard, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Fast run along the wave face. At 3.0s the lip pitches over and the wave curls into a glowing green tunnel around the camera and tube, light rippling. The tunnel exit bursts white. [token line]
```

---

## M07 · mangrove-root-tunnel — Root Tunnel (loop candidate)

- **wow:** the trees hold hands over the water.
- **Setting + material:** tidal mangrove creek; **natural tannin-brown water** under
  arching stilt roots; a dappled green tunnel.
- **Core visual:** roots arch overhead at a steady rhythm, one every half second; the
  frame looks the same at 0s and 6s, so it loops clean.
- **Drop / change:** **appears** at 3.0s: a line of fireflies (or white egrets lifting)
  switches on along the tunnel, then the frame returns to plain roots for the loop seam.
- **Length:** 6s. Loop tile: matching first and last frame, no flash at the seam if used
  as a loop; normal SPRAY-FLASH when cut into a run.
- **Lane:** natural, no boat, no fishermen. Distinct from bank 12 (forest canopy) by
  water, roots and low angle.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still on a narrow tidal mangrove creek, tannin-brown water, arching stilt roots forming a green tunnel overhead, dappled light, an empty bright yellow inflatable inner tube just ahead on the flow line, no people, no boats, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Steady fast glide down the creek, root arches passing overhead at an even rhythm. At 3.0s a line of small lights switches on along the roots, then fades by 5s. The last frame matches the first for a loop. [token line]
```

---

## M08 · bubble-wrap-dock — Bubble Run (kid-silly)

- **laugh:** the slide is bubble wrap, and every bubble pops at once.
- **Setting + material:** the back loading dock of a corner store at 2 AM, sodium light;
  the slide is a **long sheet of giant bubble wrap** running down the ramp, wet and shiny.
- **Core visual:** the tube bounces bubble to bubble, each a small pop of spray. In the
  background, a glowing vending machine by the dock door with **one slot taped over**
  (callback, background only, nobody there, never featured).
- **Drop / change:** **multiplies** at 3.2s: one pop sets off the next and the whole sheet
  pops in a rippling chain ahead of the tube, a carpet of tiny spray bursts.
- **Length:** 6s; quick cut `[2.55, 3.85]`.
- **Lane:** a store dock, not a parking lot; no cars, no people, no store sign, no brands.
  Bubble wrap is not inflatable play equipment (no Bounce House).
- **Five questions:** say it back yes · mute, the chain is visible yes · no cast, tube is
  calm yes · no words needed yes · one world yes.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still at 2 AM down a loading-dock ramp behind a small corner store, the ramp covered in a long wet sheet of giant clear bubble wrap with bubbles the size of basketballs, an empty bright yellow inflatable inner tube just ahead, sodium orange light, a glowing vending machine by the dock door with one slot taped over in the background, no people, no cars, no readable signs, no logos, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Fast bouncy run down the bubble wrap, each bubble popping in a small spray under the tube. At 3.2s the popping races ahead in a chain reaction, the whole sheet bursting bubble after bubble in front of the camera. [token line]
```

---

## M09 · bendy-straw-lemonade — Bendy Straw (kid-silly)

- **laugh:** the tube goes down a bendy straw into a giant lemonade, and an ice cube
  cannonballs in first.
- **Setting + material:** wrong scale: a **striped bendy plastic straw** the size of a
  sewer pipe, seen from inside, then the inside of a huge glass of lemonade.
- **Core visual:** pink-and-white stripes spiral past inside the clear straw; the bend
  is a fast corkscrew; then the straw opens into a yellow sea of lemonade with lemon
  slices like islands.
- **Drop / change:** **falls** at 3.5s: a house-sized ice cube drops from above into the
  lemonade ahead of the tube, a huge clear splash.
- **Length:** 6s.
- **Lane:** food-scale silly, no mouth, no hand on the glass, no face. Not bank 25
  (watermelon). The tube is yellow on yellow: keep the lemonade pale so the tube reads.

**Start still**
```
Hyperreal food-commercial 16:9 still from inside a giant clear plastic bendy straw with pink and white stripes, fizzy pale lemonade rushing down it, an empty bright yellow inflatable inner tube just ahead entering the corkscrew bend, bright backlight through the plastic, no people, no hands, no mouth, no text, no logos, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Fast corkscrew down the striped bend, bubbles streaming. 2.5s the straw opens into a vast glass of pale lemonade with lemon slices like islands. At 3.5s a giant ice cube drops from above into the lemonade just ahead, a huge clear splash. [token line]
```

---

## M10 · house-gutter-downspout — Gutter Run (kid-silly, small vertical plate)

- **laugh:** the tube rides a house's rain gutter and goes down the drainpipe.
- **Setting + material:** wrong scale suburbia in rain: the tube is tiny, the slide is a
  **white aluminum roof gutter** running along the eave of a house.
- **Core visual:** rain sheets off shingles into the gutter; leaves and a seed pod
  flash past like boulders. Down below on the curb: **three wheelie bins in three
  slightly different blues** (callback). On the porch rail, the **black cat** looks at
  the gutter, then at the rain, then back at the gutter (the second look), and knocks one acorn into it. No reaction
  after.
- **Drop / change:** **falls** at 5.0s: the gutter ends at the downspout hole and the
  tube drops straight down the dark pipe, then shoots out the bottom elbow into a puddle
  in a white splash.
- **Length:** 10s -> 6s (keep 2.0-8.0).
- **Lane:** a town, which is where the cat lives; no Pizza Guy, no person in the window,
  no HOA scene. Bins and cat are background references only. Not bank 24 (garden hose).

**Start still**
```
Cinematic 16:9 photoreal miniature-scale slide-cam still inside a white aluminum roof rain gutter along the eave of a suburban house in the rain, an empty bright yellow inflatable inner tube tiny and just ahead on the rushing water, wet leaves like boulders, rain sheeting off shingles, below on the curb three wheelie bins in three slightly different blues, a black cat sitting on the porch rail, no people, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (10s)**
```
0-5s fast run along the gutter, leaves and an acorn bouncing past; the black cat glances at the gutter, at the rain, back at the gutter, and taps one acorn in. At 5.0s the gutter reaches the downspout hole and the tube drops straight down a dark pipe, then shoots out the bottom elbow into a puddle in a white splash. [token line]
```

---

## M11 · toy-track-fishbowl — Toy Track (kid-silly)

- **laugh:** the slide is a toy train track, and it ends in the goldfish's bowl.
- **Setting + material:** an empty living room seen from toy scale; the slide is
  **wooden toy train track** with a water channel, over a rug, a sofa cliff, a coffee
  table plateau.
- **Core visual:** the tube rattles over track joints, past a toy wooden bridge and a
  sock "mountain." The coffee table edge arrives; a fishbowl waits below.
- **Drop / change:** **falls** at 6.0s: the track ends at the table edge and the tube
  drops into the fishbowl; the goldfish turns to look at it (the very-end reaction,
  spent once: one turn, no more).
- **Length:** 10s -> 6s.
- **Lane:** no kid, no parent, no hands, no living-room TV (keeps EyeWash out of this
  one). Toy track is not a Marble Tick Tack set (no marbles, no cabinet, no clock).

**Start still**
```
Stylized 3D feature-animation 16:9 toy-scale slide-cam still along a wooden toy train track with a shallow water channel down its center, running across a patterned rug in an empty sunny living room, an empty bright yellow inflatable inner tube just ahead, a toy wooden bridge, a sofa like a cliff, a coffee table ahead with a round glass fishbowl and one goldfish, no people, no hands, no TV, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (10s)**
```
Fast rattling run over track joints, across the bridge, up a ramp onto the coffee table. At 6.0s the track ends at the table edge and the tube drops into the fishbowl with a splash; the goldfish turns once to look at the tube. [token line]
```

---

## M12 · crayon-melt-chute — Crayon Melt (kid-silly / strange 3D)

- **laugh:** the slide is made of crayons and the sun melts it into a rainbow river.
- **Setting + material:** a hot summer windowsill-sized world; the chute is **bundled wax
  crayons** laid side by side like a log flume.
- **Core visual:** stylized clay look, crayon paper sleeves (blank, no text), wax ridges
  under the water.
- **Drop / change:** **transforms** at 3.4s: the crayons soften and melt, and the clear
  water turns into striped rainbow wax that keeps flowing, tube riding on top.
- **Length:** 6s.
- **Lane:** no hands, no drawings of people, no text on the sleeves. Not bank 15 (rock
  candy).

**Start still**
```
Stylized clay stop-motion 16:9 slide-cam still along a chute built from giant wax crayons laid side by side in many colors with blank paper sleeves, clear water running down it, an empty bright yellow inflatable inner tube just ahead, hot bright summer sun, soft shadows, no people, no hands, no text, no logos, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Fast run down the crayon chute. At 3.4s the crayons soften and melt in the sun and the water turns into a striped rainbow river of melted wax, still flowing fast with the tube on top. [token line]
```

---

## M13 · pool-noodle-tunnel — Noodle Tunnel (loop candidate)

- **wow:** a tunnel of pool noodles that never ends.
- **Setting + material:** stranger 3D: an endless tunnel made of **foam pool noodles**
  bent into hoops, primaries and pastels, in a white void with water on the floor.
- **Core visual:** hoops pass at an even beat (one per pulse, 0.325s if retimed); the
  frame is self-similar, so 0s matches 6s.
- **Drop / change:** **reverses** at 3.0s: the color order of the hoops flips direction
  and the tunnel's spin reverses, without the camera slowing.
- **Length:** 6s loop tile.
- **Lane:** foam noodles, not an inflatable play structure. No bounce, no castle.

**Start still**
```
Stranger 3D 16:9 slide-cam still inside an endless tunnel made of foam pool noodles bent into hoops in red, yellow, blue and mint, a thin sheet of water on the floor, an empty bright yellow inflatable inner tube just ahead, soft even white studio light, no people, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Fast steady glide through the hoops, one hoop passing on every beat, tunnel slowly rotating clockwise. At 3.0s the rotation flips to counterclockwise and the color order reverses. The last frame matches the first for a loop. [token line]
```

---

## M14 · sky-hang-insert — The Hang (insert beat)

- **wow:** the tube stops in the sky for one breath, then drops.
- **Setting + material:** pure open sky, a few clouds, no slide in frame: the tube at
  the top of an arc after leaving any launch (M05 blowhole, M02 rim, bank 13's pipe end).
- **Core visual:** the camera rises with the tube; both slow to a hang, droplets around
  it hanging like glass beads, sun behind.
- **Drop / change:** this is the **deliberate stillness exception**, built for the
  31.0-32.25 mini-break or the 51.75 hard stop. It **falls** at 4.2s: the bass returns,
  droplets and tube drop at once, camera follows down into SPRAY-FLASH.
- **Length:** 6s; for the mini-break use `[3.0, 4.3]` with the fall on 32.25.
- **Lane:** no world props, so it never mixes; it borrows the bank's sky only.

**Start still**
```
Cinematic 16:9 photoreal still in open blue sky with a few white clouds, an empty bright yellow inflatable inner tube hanging at the top of its arc just ahead of the camera, water droplets suspended around it like glass beads, sun behind, no ground, no slide, no people, no text, 20mm wide lens, tube centered
```
**Motion (6s)**
```
0-2s the tube and droplets rise and slow. 2-4.2s they hang almost still. At 4.2s everything drops at once and the camera falls with them, sky streaking, into a white spray burst. [token line]
```

---

## M15 · sandbar-tide-flume — Tide Flume (loop candidate)

- **wow:** the beach draws its own slide as the tide goes out.
- **Setting + material:** a huge flat tidal sandbar at low sun; the slide is a **braided
  tidal channel cut in wet rippled sand**, sky mirrored in it.
- **Core visual:** long, low, fast, golden; sand ripples flicker under the tube.
- **Drop / change:** **appears** at 3.0s: the channel braids, new branches appear left
  and right all at once like a tree drawn in silver; loop seam returns to one channel.
- **Length:** 6s loop tile.
- **Lane:** not bank 04 (beach tube) or 25 (beach night): no tube ride along a beach
  edge, no surf, no people, no footprints.

**Start still**
```
Cinematic 16:9 photoreal slide-cam still skimming a shallow braided tidal channel cut into wet rippled sand on a vast flat sandbar at low golden sun, sky mirrored in the water, an empty bright yellow inflatable inner tube just ahead, no people, no footprints, no text, 20mm wide lens, vanishing point at screen center
```
**Motion (6s)**
```
Fast low glide along the channel. At 3.0s silver side branches appear left and right all at once like a drawn tree, then merge back to one channel by the last frame for a loop. [token line]
```

---

## Cutting notes (additive only)

- **Match-cuts worth trying:** M06 green barrel -> bank 09 reef (green into turquoise) ·
  M05 geyser white -> M14 hang -> M01 crest (launch, hang, fall) · M09 pale lemonade ->
  M12 rainbow wax · M10 downspout puddle splash -> M11 fishbowl splash (two small
  splashes; use one, not both, in the same run).
- **Vertical plates:** M01 and M02 are the only seeds built to land a Drop. M10's
  downspout is a small, funny vertical for a peak 1.3s cut.
- Do not stack two kid-silly seeds back to back in the PEAK; alternate with a spectacle.

---

## Generate-first four

1. **M01 dam-spillway-face** — the vertical plate. Hard test (the pitch to vertical),
   and the strongest alternate for Drop 1 or Drop 2 without touching Run A's order: swap
   in as a 1.3s quick cut or audition against 08 on 19.25.
2. **M14 sky-hang-insert** — cheapest to generate, and the bank has no dedicated hang.
   Drops straight into Run A's mini-break (31.0-32.25) as an A/B against 20, or the 51.75
   freeze.
3. **M08 bubble-wrap-dock** — the clearest kid laugh; the chain pop is visible on mute
   and lands on beat 3 of a 4-pulse peak cut.
4. **M13 pool-noodle-tunnel** — simplest geometry and a true loop tile; tests the
   self-similar loop for the short farm and slots into any A/B 6s gap with zero
   continuity risk.

---

## Writers' notes

**Callbacks spent (background props only, never sets):**
- **The vending machine** (one taped slot) in **M08**, a 2 AM exterior, unattended.
- **Brad's bin is the wrong blue** as three bins in three blues at the curb in **M10**.
  Never resolved, no folder, no Brad.
- **The Black Cat's second look** in **M10**: town only, one knock (an acorn), no
  reaction shot, no rescue, not near any exit of the Pizza Guy (he is absent).
- The **very-end reaction** engine is spent once, in **M11** (the goldfish turns).

**Open / not done:** no index entry added to `ideas/README.md` (task limited edits to this
file). No stills, video, audio or song. Timings are clip-internal; Run A placement is a
suggestion against the existing analysed grid. `promote?: no`.
