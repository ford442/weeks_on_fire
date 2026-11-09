# Yacht Guitar Orchestra — Imagine segments

Treatment: [`ideas/yacht-guitar-orchestra.md`](../ideas/yacht-guitar-orchestra.md).  
Songs: [`songs/Yacht_Guitar_Orchestra.md`](../songs/Yacht_Guitar_Orchestra.md) (daylight) · [`songs/Nofo_i_te_Vai.md`](../songs/Nofo_i_te_Vai.md) (dark island) · [`songs/Seoul_at_Night.md`](../songs/Seoul_at_Night.md) (Busan night).  
Local board: `artifacts/yacht_guitar_orchestra.md`.  
Suggestions id `yacht-guitar-orchestra` after codegen.

Silent start/last pairs. Mute Imagine audio. Stack on the three beds. Hard cuts between songs.

Shared motion line on every clip:  
“gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land.”

Register: a luxury-yacht travel film played completely straight. Elegant, slightly uncanny, deadpan. Nobody acknowledges the picture. No gag needs explaining and none is forced in. This is a visual experiment, not a joke card.

---

## Working timeline (about 3:24)

None of the three songs states a length. Every time below is a **working time**: nudge it after an ear pass, the way `prompts/big-city-segments.md` does. Each bed is an excerpt cut to its scenes (edit the bed to the picture, loop or trim in whole bars), not the full song. Bar math: daylight 96 BPM, 1 bar = 2.5s (4 bars = 10s). Dark island 88 BPM, 1 bar = 2.73s (4 bars = 10.9s). Busan night 128 BPM, 1 bar = 1.875s (8 bars = 15s).

Imagine clips are 6, 10 or 15 seconds. Generate the clip length in the table, trim to the scene length on the downbeat. Twenty clips, 226s generated, 204s used.

| Scene | Time | Dur | Imagine clip → trims to | Bed · layer | Chain |
|---|---|---|---|---|---|
| A Open ocean | 0:00–0:15 | 15s | 15s → 15s (6 bars) | Yacht Guitar Orchestra · Clean Line | — |
| B The sway | 0:15–0:25 | 10s | 10s → 10s (4 bars) | Clean Line | — |
| C Prow and wake | 0:25–0:35 | 10s | 10s → 10s (4 bars) | Clean Line | — |
| D Chord ripple | 0:35–0:45 | 10s | 10s → 10s (4 bars) | Harmonic Choir stacks in | — |
| E Lenses | 0:45–0:55 | 10s | 10s → 10s (4 bars) | Harmonic Choir | last frame → F start |
| F Shore | 0:55–1:05 | 10s | 10s → 10s (4 bars) | Harmonic Choir | start = E last frame |
| G Pick over the rail | 1:05–1:10 | 5s | 6s → 5s (2 bars) | Low Orbit stacks in | last frame → H start |
| H Dolphin leap | 1:10–1:20 | 10s | 10s → 10s (4 bars) | Low Orbit | start = G last frame |
| I Parrots and cannons | 1:20–1:30 | 10s | 10s → 10s (4 bars) | Low Orbit | — |
| **HARD CUT 1:30** | daylight bed stops dead, no tail, no crossfade | | | | |
| J Lights in the vines | 1:30–1:41 | 11s | 15s → 11s (4 bars) | Nofo i te Vai | last frame → K start |
| K Fire on the black beach | 1:41–1:52 | 11s | 15s → 11s (4 bars) | Nofo i te Vai | start = J last frame |
| L Faces in firelight | 1:52–2:00 | 8s | 10s → 8s (3 bars) | Nofo i te Vai | — |
| M Cannon asleep | 2:00–2:08 | 8s | 10s → 8s (3 bars) | Nofo i te Vai | — |
| N Parrots leave | 2:08–2:16 | 8s | 10s → 8s (3 bars) | Nofo i te Vai | — |
| O Lounges in the dark | 2:16–2:24 | 8s | 10s → 8s (3 bars) | Nofo i te Vai | — |
| **HARD CUT 2:24** | dark-island bed stops dead, no tail, no crossfade | | | | |
| P Busan night | 2:24–2:39 | 15s | 15s → 15s (8 bars) | Seoul at Night | — |
| Q Same chairs | 2:39–2:46 | 7s | 10s → 7s (about 4 bars) | Seoul at Night | — |
| R Light on the hull | 2:46–2:54 | 8s | 10s → 8s (about 4 bars) | Seoul at Night | — |
| S Ring from above | 2:54–3:09 | 15s | 15s → 15s (8 bars) | Seoul at Night | last frame → T start |
| T The gap | 3:09–3:24 | 15s | 15s → 15s (8 bars) | Seoul at Night | start = S last frame |

Per bed: daylight 90s (nine scenes, five of them new), dark island 54s (six scenes, four new), Busan night 60s (five scenes, four new). Q and R together are 8 bars; set their split on the ear pass.

**Mouths: closed in all twenty scenes, A through T.** There is no lip-sync anywhere, including on the sung Wallisian and Korean beds. The vocals are off-picture. The guitar line never opens its mouth, and the two on the lounges never speak.

**Chains** (last frame of N = start still of N+1, upload the exported last frame as the start image and paste the next prompt): E → F, G → H, J → K, S → T. Everything else is a hard cut inside its bed.

**If a bed runs short**, cut in this order: daylight G+H then C; dark island O then N; Busan night R then Q. If a bed runs long, hold the last scene, do not add scenes.

---

## Repair note (the original A–E)

The first A–E had bed names where the timed range belongs, no scene C header, and no prompts, so the parser read start "Clean Line", E as start "K" / end "pop bed", every duration as 0, and dropped C. They are re-headed to timed ranges, the bed names moved to a `**Bed:**` line, and C's inserts folded into two timed scenes. Their original Start / Last / Motion lines are kept word for word. Letters now run in time order, so they moved:

| Original | Now |
|---|---|
| A — Open ocean (Clean Line) | **A** Open ocean (0:00–0:15) |
| B — Shore (Harmonic Choir) | **F** Shore (0:55–1:05) |
| C — Strange inserts | **H** Dolphin leap (1:10–1:20) and **I** Parrots and cannons (1:20–1:30) |
| D — Dark island (Wallisian bed) | **J** Lights in the vines (1:30–1:41) and **K** Fire on the black beach (1:41–1:52) |
| E — Busan night (K-pop bed) | **P** Busan night (2:24–2:39) |

New scenes: B C D E G (daylight), L M N O (dark island), Q R S T (Busan night).

---

## Continuity lock (paste into every take)

The yacht: one long, sleek white luxury motor yacht, white hull, pale decks, glass-and-chrome rail, no name or lettering anywhere on it. The same boat in every take. The yacht is white so that every world can paint it: sun, firelight, RGB.

Rubella and Lillith lie side by side on two white lounges on the aft sun deck, Rubella port, Lillith starboard, always the same two lounges. Modern black lace, dark sunglasses, not performing, faces calm. They never stand, walk the deck, gesture or speak. They are the only dark shapes on a white boat.  
Rubella: a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress.  
Lillith: a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile.

The guitar line (working wardrobe, not in the Lock; change it once a first still is chosen): a living orchestra of women in plain ivory sleeveless deck dresses, one every arm's length along the entire deck rail, each holding a clean electric guitar (Stratocasters and Telecasters) at playing height, facing outward, calm faces, eyes open, lips closed. No sunglasses on the line. No amps, no cables, no speakers, no drummer, no singer. Ivory takes the light of each bed: sun, firelight, RGB.

The sway: unison, a few degrees left then right, one full cycle every five seconds (two bars of the daylight bed). **It stays that slow on every bed.** It does not speed up for the Wallisian or K-pop beds. Right hands rest on the strings, no strumming.

The island (days and nights): vine-covered volcanic island, black volcanic-sand beach, two rusted iron cannons half-buried at the tideline, one tiny white plume of steam by day. The cannons are rusted, sealed and inert: no smoke, no flash, no fire from a muzzle, no one touches them.

Island ladder, daylight: A a speck at the horizon · B small between two guitar necks · C mid-distance · E large in a lens · F the beach and cannons at two boat-lengths · I telephoto, near. It only ever gets closer.

Light: daylight is bright midday on turquoise. The dark island is deep blue night with **orange and red only** (vine lights, beach fires). Busan is black water with **RGB LED color only** (green, magenta, blue), no orange.

Camera: locked, slow glide, slow push or slow crane only. No whip pans, no handheld shake, no cuts inside a clip. Frame 16:9, photoreal, 35mm, fine grain.

Continuity props (references, not a set; omit if the frame clutters, never the subject of a shot, never mentioned): from the dark island on, a full red marine fire extinguisher stands beside Rubella's lounge, pin and seal intact, untouched. A plain white mug, text turned away from camera, three-quarters full at the dark island and empty at Busan. At Busan only, a vacuum tube wrapped in a white dish towel like an egg on the side table by Lillith's lounge.

Anchor rule: where Rubella and Lillith read as faces or lace, the Grok block pastes their anchor lines verbatim (the repo's lead anchors, as in `ideas/crab-ground-crew.md` and `ideas/silly-packet-farm.md`; `characters/building-cast.md` and `characters/bible/` have no Appearance block for them yet). Where they are specks or silhouettes, the block says "two small figures in black lace".

---

## Negatives (every take)

No landing, no docking, no pier, no tender, no anchor on camera. No one boards or leaves, no crew, no captain, no swimmer. Cannons rusted, sealed, inert: no smoke, no flash, no fire from a muzzle. The boat never lands. No lip sync, no open mouths, no singer, no choir. No amps, no cables, no speakers. No Daisy tandem or living-flower bicycle. No Glam bottle, no shampoo, no Ultra Screech. No Lace floor. No Christina house, no marble, no gilt. No Home Sweet Void table or space lounge. No Lightning Strike, no lightning. No laser snakes, no laser weapons. No EyeWash bug, station card or frame (the yacht is not an EyeWash frame). No Pizza Guy, no delivery. No brands, no logos, no yacht name, no on-screen text, no subtitles. No real people, no real artists. No Seoul skyline, no Pyongyang (both rejected for Busan). No other boats at Busan. No orange at Busan, no RGB color on the dark island.

---

## Picture-sound rule

Imagine audio is muted in the stack. Picture sounds are laid in the edit, 24 to 30 dB under the bed, never rhythmic: the bed owns all rhythm. Each **Sound** block below says which picture sound comes through and where the bed stays. At both hard cuts the previous bed stops dead and the next bed starts on the downbeat of bar one.

Lyric glosses in the Sound blocks are for picture matching only. The Korean lines are paraphrased from `songs/Seoul_at_Night.md`. The Wallisian glosses are a **working reading of a working-version lyric** and have not been checked by a Fakaʻuvea speaker; verify before they appear anywhere public.

---

## A — Open ocean (0:00–0:15)

**Bed:** Yacht Guitar Orchestra, Clean Line. **Clip:** 15s, trims to 15s (6 bars). **Chain:** none, first scene.  
**Start:** white yacht, turquoise open ocean, two black-lace sunbathers on lounges, guitar line on the rail, no island.  
**Last:** same yacht, small vine-covered island on the horizon, tiny white volcano plume.  
**Motion:** slow approach, island grows, guitar line sways gently.

**On screen:** A white yacht on open turquoise water, a guitar line on the rail, two black-lace sunbathers, and an island rising at the horizon.

**Sound**
```
Bed: Yacht Guitar Orchestra, Clean Line alone from the first downbeat (96 BPM, D major). Picture sound laid in the edit: soft hull hiss and open-water wash, very low. No gulls, no engine. The bed stays on top the whole scene.
```

**Grok Imagine**
```
Start from a wide, bright midday shot filmed by a drone gliding alongside the starboard side of a sleek white luxury motor yacht at deck height, on glassy turquoise open ocean with an empty horizon. A living orchestra of women in plain ivory sleeveless deck dresses stands an arm's length apart along the entire deck rail, each holding a clean electric guitar (Stratocasters and Telecasters) at playing height, facing outward toward camera, calm faces, eyes open, lips closed. On the aft sun deck, Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, lie on white lounges in dark sunglasses, not performing, faces calm. Slow approach: in the last third a small vine-covered volcanic island rises at the far horizon with one tiny white plume of steam. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 15 seconds, Grok Imagine style
```

**Prompt variations**
- Low on the water ahead of the bow, the yacht gliding toward camera with the line facing us, lounges hidden behind the superstructure, empty horizon, no island yet, mouths closed, Grok Imagine
- Locked wide on the horizon alone: turquoise ocean, a small vine-covered volcanic island with one tiny white plume, the white bow rail cutting the bottom of frame, 6 seconds, Grok Imagine

---

## B — The sway (0:15–0:25)

**Bed:** Clean Line. **Clip:** 10s, trims to 10s (4 bars). **Chain:** none, hard cut from A.  
**Start:** deck level, inboard side of the rail, behind the guitar line; open sea; the island small between two guitar necks.  
**Last:** same glide, the whole line leaned the other way; the island unchanged, still small.  
**Motion:** slow lateral glide behind the line; two full sway cycles in ten seconds, identical on every player.

**On screen:** The sway. Seen from behind, the whole line leans together toward the sea and the small island.

**Sound**
```
Bed: Clean Line continues, long sustained chords (96 BPM). Picture sound laid in the edit: a faint breeze across the strings and the deck, nothing rhythmic, well under the bed. No amp hum, no pick noise.
```

**Grok Imagine**
```
Start from deck level on the inboard side of the rail of a white luxury motor yacht in bright midday sun, a slow lateral glide at hip height behind a living orchestra of women in plain ivory sleeveless deck dresses, seen from behind, standing an arm's length apart, each holding a clean electric guitar (Stratocasters and Telecasters) at playing height, all facing the open turquoise sea. They sway together a few degrees left and then right in perfect unison, like one slow metronome, one full cycle every five seconds, hair stirring in the same breeze. Beyond them, small on the horizon, a vine-covered volcanic island with one tiny white plume of steam. Soft and out of focus at the left edge of frame, Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, lie on white lounges in dark sunglasses, not performing, faces calm. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Same glide from the opposite direction, right to left, island dead center between two guitar necks, no lounges in frame, Grok Imagine
- Low angle at deck level looking up the line, ivory dresses against pure blue sky, guitar bodies tilting together in one long diagonal, no horizon, Grok Imagine

---

## C — Prow and wake (0:25–0:35)

**Bed:** Clean Line. **Clip:** 10s, trims to 10s (4 bars). **Chain:** none.  
**Start:** camera low over the water beside the prow, the white bow cutting turquoise water, the island ahead at mid-distance.  
**Last:** the camera has slid aft along the hull; the wake fans out behind in white lace.  
**Motion:** one slow move aft along the hull. The line at the bow faces forward, necks pointing out to sea.

**On screen:** The prow cutting turquoise water, a row of guitar necks pointing out to sea like masts, then the long white wake.

**Sound**
```
Bed: Clean Line, long chords opening like a horizon (96 BPM). Picture sound laid in the edit: bow wave and water along the hull, the only picture sound, fading down on the last bar as the wake falls behind. No engine, no gulls.
```

**Grok Imagine**
```
Start from a low camera skimming just above turquoise water beside the prow of a sleek white luxury motor yacht in bright midday sun, the white hull slicing the sea in a clean curl of bow wave and a lace of white foam. High above on the bow rail a row of women in plain ivory sleeveless deck dresses stand an arm's length apart, each holding a clean electric guitar (Stratocasters and Telecasters) at playing height, facing forward over the water, guitar necks pointing out to sea like a row of masts, calm faces, lips closed. Ahead, at mid-distance, a vine-covered volcanic island with one tiny white plume of steam, noticeably nearer than before. The camera slides slowly aft along the hull until the wake fans out behind the yacht in white lace on turquoise. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, no name on the hull, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Stern view: camera low behind the yacht, the wake stretching to the horizon like a white road, the women at the stern rail facing back along it, swaying, empty ocean, no island, Grok Imagine
- Straight down on the bow tip: white deck, bow wave breaking beneath, a fan of guitar necks pointing out over the water, mouths closed, Grok Imagine

---

## D — Chord ripple (0:35–0:45)

**Bed:** Harmonic Choir stacks in over Clean Line on the first downbeat. **Clip:** 10s, trims to 10s (4 bars). **Chain:** none.  
**Start:** telephoto down the row of necks on the rail, every fretting hand in the same open chord shape.  
**Last:** a new shape, arriving at the far end of the line last.  
**Motion:** one chord change travels from the nearest player to the farthest, one beat (0.625s) apart each. A right-hand little finger rolls a volume knob up on the swell.

**On screen:** Hands on fretboards. A chord change ripples down the line of necks one player at a time, like a wave through a colonnade.

**Sound**
```
Bed: Harmonic Choir stacks in over Clean Line on the first downbeat (fifths and ninths, volume swells, 96 BPM). Picture sound laid in the edit: one soft fretboard slide per chord change, barely there, panned along with the ripple. Everything else is the bed.
```

**Grok Imagine**
```
Start from a long telephoto shot down a row of electric guitars on the sunlit deck of a white luxury motor yacht: the fretting hands of women in plain ivory sleeveless deck dresses all making the same open chord shape on the necks of clean Stratocasters and Telecasters, right hands resting on the strings without strumming, thumbs steady, one right-hand little finger slowly rolling a volume knob up for a gentle swell. When the chord shape changes, the new shape ripples down the line one player at a time, each a beat after her neighbor, like a wave passing through a colonnade, the compressed row of necks receding into soft focus with turquoise sea glitter beyond the rail. Faces out of frame or soft, lips closed. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Macro on a single fretting hand sliding from one open chord shape to the next on a sunburst Stratocaster neck, white deck and sea glitter out of focus, no face, Grok Imagine
- Macro on a pickup selector switch clicking from position to position on a row of guitars, the same beat on each, ivory sleeves, sunlit chrome, no face, Grok Imagine

---

## E — Lenses (0:45–0:55)

**Bed:** Harmonic Choir. **Clip:** 10s, trims to 10s (4 bars). **Chain:** last frame = start still of F.  
**Start:** an extreme close two-shot of the pair's dark lenses, the island small in each.  
**Last:** one lens fills the frame and the reflected shore fills the lens: green vines on dark rock, black sand, two rusted cannons. This is F's start still.  
**Motion:** slow push-in on Lillith's left lens. Nobody moves.

**On screen:** Sunglasses reflecting the shore. The island grows in the lenses until one lens holds the whole beach.

**Sound**
```
Bed: Harmonic Choir over Clean Line (96 BPM). Picture sound laid in the edit: nothing for the first bar, then a slow lap of water that swells under the push-in and carries straight on into F with no break.
```

**Grok Imagine**
```
Start from an extreme close two-shot on the sun deck of a white luxury motor yacht, filmed from the rail looking back past the soft shoulders and guitar necks of two out-of-focus women in ivory dresses. Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, lie side by side on white lounges in dark sunglasses, not performing, faces calm, neither moving. In each dark lens, a small reflection of a vine-covered volcanic island with one tiny white plume, growing as the yacht nears. Slow push-in on Lillith's left lens until the reflected shore fills the entire frame: green vines over dark rock, a black-sand beach, two rusted cannons half-buried at the tideline. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Sunglasses folded on a white lounge cushion, the whole vine island with its tiny white plume reflected in the dark glass, shallow focus, no people in frame, Grok Imagine
- A single dark lens with a sliver of cheek and the corner of a blood-red lip, the reflected island growing slowly, nothing else moves, Grok Imagine

---

## F — Shore (0:55–1:05)

**Bed:** Harmonic Choir. **Clip:** 10s, trims to 10s (4 bars). **Chain:** start still = E last frame.  
**Start:** yacht closer, vines on the rock, rusted cannons half-buried.  
**Last:** closer hold, cannons larger, vines thick.  
**Motion:** closes distance and holds. Cannons inert. Seen from the island side, so the line faces us.

**On screen:** The shore. The yacht slides in, stops off the black sand, and the rusted cannons come into focus.

**Sound**
```
Bed: Harmonic Choir with Clean Line under it (96 BPM). Picture sound laid in the edit: surf on black sand, soft, and one slow draw-back as the yacht stops. No cannon sound of any kind, no splash, no chain.
```

**Grok Imagine**
```
Start from the reflected shore filling the frame, now unbent from the lens: the black-sand beach of a vine-covered volcanic island in bright midday sun, two rusted iron cannons half-buried at the tideline in the soft foreground, thick green vines hanging over dark rock, turquoise water beyond. A sleek white luxury motor yacht glides into frame from the left and slows to a stop about two boat-lengths off the surf, its whole deck rail lined with women in plain ivory sleeveless deck dresses holding clean electric guitars, facing outward toward the island and the camera, swaying together, calm faces, lips closed. On the aft deck, Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, are two small figures on white lounges in dark sunglasses, not performing, faces calm. As the yacht settles, focus eases to the cannons in the foreground, larger and sharper, rusted, vine-wrapped and utterly inert. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Same beach with the yacht already holding offshore from the first frame, deck figures too small to read; only the focus moves, from the sea to the nearest cannon, 6 seconds, Grok Imagine
- The vines on the rock face lean left and right in time with the line on the yacht though there is no wind, the cannons still, Grok Imagine

---

## G — Pick over the rail (1:05–1:10)

**Bed:** Low Orbit stacks in under the other two on the first downbeat. **Clip:** 6s, trims to 5s (2 bars). **Chain:** none in; last frame = start still of H.  
**Start:** a hand on a guitar neck at the rail, a tortoiseshell pick loosening at the fingertip.  
**Last:** ripples spreading on the water beside the hull where the pick landed.  
**Motion:** the pick slides free, falls down the hull spinning, lands with one tiny splash. Nobody looks down.

**On screen:** A guitar pick slips over the rail, tumbles down the white hull and lands in the sea with one tiny splash.

**Sound**
```
Bed: Low Orbit stacks in under Clean Line and Harmonic Choir on the first downbeat (low drones and palm-muted pulses, 96 BPM). Picture sound laid in the edit: one tiny splash on the landing, nothing before it. The splash tail carries into H.
```

**Grok Imagine**
```
Start from a close side view at the glass-and-chrome rail of a sleek white luxury motor yacht in bright midday sun: a woman's hand in the foreground on the neck of a clean electric guitar, a small tortoiseshell guitar pick loosening at her fingertip. The pick slides free, tumbles over the rail, drops past the glossy white hull spinning in the sunlight, and lands on the turquoise water with one tiny splash, concentric ripples spreading against the hull's soft reflection. Slow motion, the camera follows the pick down. Her face is out of frame; the line of women in ivory dresses keeps swaying in the soft background and no one looks down. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 6 seconds, Grok Imagine style
```

**Prompt variations**
- The same fall seen from below: camera on the water looking up the white hull as the pick tumbles down toward the lens, sun flaring past the rail, Grok Imagine
- Close on the pick floating on its edge in the ripples, the slow wake carrying it along the white hull, sun glints on the water, 5 seconds, Grok Imagine

---

## H — Dolphin leap (1:10–1:20)

**Bed:** Low Orbit. **Clip:** 10s, trims to 10s (4 bars). **Chain:** start still = G last frame.  
**Start:** dolphin synchronized leap beside the yacht; ripples on the water beside the hull.  
**Last:** a single ring where the dolphin went in.  
**Motion:** one dolphin, one leap, in time with the sway: it rises as the line leans, peaks as it leans back. The line never turns to look.

**On screen:** One dolphin leaps beside the yacht in time with the sway, and the guitar line does not turn its heads.

**Sound**
```
Bed: Low Orbit holds the drone under Clean Line and Harmonic Choir (96 BPM). Picture sound laid in the edit: one clean water-break as the dolphin rises, then almost nothing on the re-entry. No dolphin calls, no splash gag.
```

**Grok Imagine**
```
Start from a low camera just above turquoise water beside the white hull of a sleek luxury motor yacht, small ripples spreading on the surface. A single grey dolphin rises beside the yacht and leaps in one clean arc, exactly in time with the slow sway of the guitar line on the rail above: as the women lean left the dolphin rises, as they lean back it reaches the top of its arc, and it re-enters the water ahead of the bow wave with almost no splash, one ring spreading where it went in. The women in plain ivory sleeveless deck dresses holding clean electric guitars stay facing outward, calm faces, lips closed, and none of them turns to watch. Slow motion, bright midday sun. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Wide from the water: the dolphin's arc crosses the full length of the white hull while the line on the rail sways the same direction, the island small beyond the bow, Grok Imagine
- The dolphin at the top of its arc, hanging, backlit by the sun, the hull and a row of guitar necks soft in the background, 6 seconds, Grok Imagine

---

## I — Parrots and cannons (1:20–1:30)

**Bed:** Low Orbit. **Clip:** 10s, trims to 10s (4 bars). **Chain:** none. Last scene before the hard cut.  
**Start:** parrot close on vines and cannons: telephoto from the yacht, a rusted barrel with a row of parrots on it, the vines behind crowded with far too many.  
**Last:** a tighter hold on the nearest barrel; nothing has moved but wings.  
**Motion:** slow push-in with a gentle rack focus from the cannon to the vines. Cannons inert.

**On screen:** Far too many bright parrots on the vines and along a rusted cannon barrel, all facing the sea, all still.

**Sound**
```
Bed: Low Orbit with the full daylight stack (96 BPM). Picture sound laid in the edit: a murmur of wing-shuffle, very low, and no squawks. The bed is the last thing heard before the hard cut at 1:30; end the cut on the bar line.
```

**Grok Imagine**
```
Start from a bright midday telephoto from the sea: a black-sand shore of a vine-covered volcanic island, a rusted iron cannon half-buried at the tideline with a row of bright parrots perched along its barrel, and far too many more parrots, dozens in scarlet, blue-and-yellow and green, packed along the thick green vines on the dark rock behind, all perched still and facing the sea, only the occasional wing-shuffle. A tiny white plume of steam rises from the peak far behind. Slow push-in with a gentle rack focus from the cannon to the crowded vines. The cannon is rusted, sealed and inert; no smoke, no fire. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Extreme close on one scarlet parrot on a rusted cannon barrel, vines behind it, eyes calm, the barrel's rust and one vine tendril in sharp focus, Grok Imagine
- Wide telephoto of the vine wall so crowded with parrots that the green is mostly color, the tiny white plume rising behind the ridge, Grok Imagine

---

## J — Lights in the vines (1:30–1:41)

**Bed:** Nofo i te Vai, hard cut from daylight on the downbeat. **Clip:** 15s, trims to 11s (4 bars at 88 BPM). **Chain:** last frame = start still of K.  
**Start:** night, lights begin to glow from inside the vines, fog low.  
**Last:** lights brighter into the fog.  
**Motion:** lights emerge. Same people, same boat. Hard cut from daylight.  
**Lyric note (working gloss):** [Verse] fire on the black sand, light in the trees.

**On screen:** Hard cut to night. Orange and red lights come on one by one inside the island's vines and bleed into the fog.

**Sound**
```
Bed: Nofo i te Vai, [Verse], on the hard cut (88 BPM, log drums and pate, slack-key guitar). The daylight bed stops dead on the bar line, no tail. Picture sound laid in the edit: low surf and a faint creak of vines, well under the drums. Vocals are off-picture; every mouth on screen stays closed.
```

**Grok Imagine**
```
Start from deep blue night, a vine-covered volcanic island seen across black water from a white yacht's rail, low white fog lying along the shore. In the soft dark foreground the silhouettes of a row of women holding electric guitars sway together slowly, facing the island. One by one small orange and red lights begin to glow from inside the vines on the island's rock face, like embers behind leaves, spreading up the curtains of vine and bleeding warm color into the fog, brighter by the end of the shot. Two rusted cannons are barely visible as dark shapes on the beach. Slow and steady, no flicker, no flash. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, no blue or green neon, 15 seconds, Grok Imagine style
```

**Prompt variations**
- Locked close on the vine wall alone: three lights glow inside the leaves, then twenty, fog drifting across, no yacht in frame, Grok Imagine
- Same island, camera low on the water, the silhouettes sway along the bottom edge of frame and each light blooms a beat after the sway, Grok Imagine

---

## K — Fire on the black beach (1:41–1:52)

**Bed:** Nofo i te Vai. **Clip:** 15s, trims to 11s (4 bars). **Chain:** start still = J last frame.  
**Start:** J's last frame, lights bright in the fog.  
**Last:** controlled fire on the black beach near the cannons.  
**Motion:** fire appears, a row of small flames, evenly spaced, untended. The cannons stay inert.  
**Lyric note (working gloss):** [Verse] red mist, leave the line.

**On screen:** A straight row of small, steady fires lights itself along the black beach beside the rusted cannons. Nobody tends it.

**Sound**
```
Bed: Nofo i te Vai continues, end of [Verse] (88 BPM). Picture sound laid in the edit: soft fire crackle that grows one flame at a time, no pops, and the surf drawing back through the reflections. No gunshot, no boom, no cannon sound.
```

**Grok Imagine**
```
Start from the same night view: orange and red lights glowing in the vines and fog above a black volcanic beach. At the foot of the island, beside two rusted half-buried cannons, small controlled fires ignite one after another along the tideline until a straight row of evenly spaced low flames burns steadily, no one tending them, no sparks flying, nothing spreading; the wet black sand mirrors each flame as an orange thread, a slow wave slides in and draws back, fog drifts through the vines above. The cannons stand dark and inert, lit orange on one side. Silhouettes of the guitar line sway slightly in the soft foreground. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, orange and red light only, 15 seconds, Grok Imagine style
```

**Prompt variations**
- Long lens on the row of flames alone on the wet black sand, each reflected as an orange thread, surf drawing back through the reflections, no cannons in frame, Grok Imagine
- The same fires seen from straight above the beach, a dotted line of orange on black sand with one rusted cannon at the end of the line, Grok Imagine

---

## L — Faces in firelight (1:52–2:00)

**Bed:** Nofo i te Vai. **Clip:** 10s, trims to 8s (3 bars). **Chain:** none.  
**Start:** water level, the front of the yacht's rail seen from the island side, the line facing the camera.  
**Last:** the glide has crossed several players; the same calm faces, the same orange.  
**Motion:** one slow lateral glide at water level. Mouths closed. The sway stays as slow as in daylight.  
**Lyric note (working gloss):** [Chorus] stay on the water, no landing, no staying.

**On screen:** Calm faces in a row, lit orange by the beach fires, a line of flame in every open eye. Lips closed.

**Sound**
```
Bed: Nofo i te Vai, [Chorus] (88 BPM). Picture sound laid in the edit: slow water against the hull and a thread of fire crackle, both very low. Nothing from the faces. Vocals are off-picture.
```

**Grok Imagine**
```
Start from night, a slow lateral glide at water level across the front of a white yacht's deck rail, seen from the island side: a row of women in plain ivory sleeveless deck dresses stand an arm's length apart holding clean electric guitars, facing the camera and the island beyond it, their calm faces and ivory dresses lit warm orange by a row of fires on a beach behind the camera, a tiny line of flame reflected in each pair of open eyes, strings and pickguards glinting, lips closed, swaying together very gently; thin fog passes between the camera and the hull; black water below. Orange and red light only. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Close on one face in profile, the orange line of the fires in her open eye, the strings below catching the light, lips closed, fog passing, Grok Imagine
- The same glide seen from the deck behind the line: ivory backs turning orange, the row of fires small on the black beach beyond, Grok Imagine

---

## M — Cannon asleep (2:00–2:08)

**Bed:** Nofo i te Vai. **Clip:** 10s, trims to 8s (3 bars). **Chain:** none.  
**Start:** close tracking along a rusted cannon half-buried in black sand, a vine through its touch-hole.  
**Last:** the camera has drifted past the muzzle to a second cannon and, far out on the black water, the small white yacht.  
**Motion:** one slow track along the barrel. The cannon is inert.  
**Lyric note (working gloss):** [Verse 2] the cannon sleeps.

**On screen:** Firelight slides along a rusted cannon with a vine grown through it. It does nothing. The yacht is a small white shape on the water.

**Sound**
```
Bed: Nofo i te Vai, [Verse 2] (88 BPM). Picture sound laid in the edit: very low fire crackle, and wet sand ticking as the surf draws off. No cannon sound of any kind, not even a creak.
```

**Grok Imagine**
```
Start from night, a close tracking shot along a rusted iron cannon half-buried in black volcanic sand, orange firelight from a row of small fires further down the beach sliding along the pitted barrel, a green vine grown through the touch-hole and coiled around the muzzle with a soft orange glow inside its leaves, low fog creeping across the sand. The camera drifts past the muzzle to find a second cannon and, far out on the black water, the small white yacht with a faint line of swaying guitar silhouettes along its rail. The cannons are rusted, silent, sealed and inert; no smoke, no spark, no flash. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, orange and red light only, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Macro on the muzzle: a vine tendril curled in the bore, orange glow behind the leaves, fog drifting past, nothing moves but the light, Grok Imagine
- Wide, low on the sand: two cannons in silhouette against the row of fires, the yacht a pale shape on the water behind them, Grok Imagine

---

## N — Parrots leave (2:08–2:16)

**Bed:** Nofo i te Vai. **Clip:** 10s, trims to 8s (3 bars). **Chain:** none.  
**Start:** the vine wall glowing orange in the fog, the same crowd of parrots perched in it.  
**Last:** the vines settled and empty, the lights in them still glowing.  
**Motion:** the parrots lift in one slow wave and stream away along the shore, away from the yacht. None crosses to the boat.  
**Lyric note (working gloss):** [Verse 2] the bird goes.

**On screen:** The too-many parrots lift out of the glowing vines in one slow wave and stream away along the shore.

**Sound**
```
Bed: Nofo i te Vai, [Verse 2] (88 BPM). Picture sound laid in the edit: soft wing-beats passing and panning away from the yacht side, nothing else. No squawks.
```

**Grok Imagine**
```
Start from night, fog and warm orange light in the vines of a volcanic island, dozens of bright parrots in scarlet, blue-and-yellow and green perched still in the glowing leaves. They lift out of the vines together in one slow rising wave, their colors muted to silhouettes with sparks of feather color in the orange glow, and stream low along the shoreline away from the yacht, none flying toward it; the vines settle and the lights inside them keep glowing. In the soft lower foreground the silhouettes of the guitar line sway on the yacht's rail. Slow motion, quiet. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, orange and red light only, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Locked wide: the parrot wave crossing the foggy shoreline left to right, the row of beach fires low in frame, the yacht not in shot, Grok Imagine
- Close on the vines the moment after: a few leaves still trembling, the lights inside them steady, one last scarlet feather drifting down, Grok Imagine

---

## O — Lounges in the dark (2:16–2:24)

**Bed:** Nofo i te Vai. **Clip:** 10s, trims to 8s (3 bars). **Chain:** none. Last scene before the hard cut.  
**Start:** a locked low shot at the foot of the two white lounges, the line in silhouette beyond them.  
**Last:** the same shot; only the firelight has shifted.  
**Motion:** nothing moves but the sway behind them and the flicker on their skin. The same framing idea as E, at night: E's lenses held the island, these hold the fires.  
**Lyric note (working gloss):** [Verse 2] the drum waits, night comes.

**On screen:** Rubella and Lillith in the same places, firelight on their lenses, a full extinguisher by one lounge. Nothing else moves.

**Sound**
```
Bed: Nofo i te Vai, end of [Verse 2] into the tail (88 BPM). Picture sound laid in the edit: water lap only. The bed is the last thing heard before the hard cut at 2:24; end the cut on the bar line.
```

**Grok Imagine**
```
Start from night, a locked camera low at the foot of two white lounges on the aft deck of a white yacht, looking along them toward the rail. Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, lie side by side in dark sunglasses, not performing, faces calm, warm orange firelight from the island flickering faintly on their skin and the black lace; in each dark lens two thin orange horizontal lines, the reflection of a row of beach fires. Beside the lounges, on a small table, a plain white mug with its text turned away, three-quarters full, and a full red marine fire extinguisher standing upright with its pin and seal intact, untouched. Behind them the silhouettes of the guitar line sway together against low fog and an orange glow over black water. Nothing else moves. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, no text, orange and red light only, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Tighter: only Lillith's profile and half-smile, the two orange lines in her lens, the extinguisher a soft red shape at the edge of frame, Grok Imagine
- Wide from the rail looking back: the lounges small in the foreground, the whole line in silhouette, the island's fires low and orange on the water beyond, Grok Imagine

---

## P — Busan night (2:24–2:39)

**Bed:** Seoul at Night, hard cut from the dark island on the downbeat. **Clip:** 15s, trims to 15s (8 bars at 128 BPM). **Chain:** none.  
**Start:** night open water, Gwangan Bridge and Marine City just becoming visible.  
**Last:** bridge fully lit in RGB LEDs, Marine City towers bright, strong reflections.  
**Motion:** yacht approaches. No docking. Hard cut from dark island.  
**Lyric note (paraphrase):** [Verse] a city on the water, lasers split the dark.

**On screen:** Hard cut to Busan. The Gwangan Bridge and the Marine City towers light up ahead across black water. The yacht keeps its distance.

**Sound**
```
Bed: Seoul at Night enters on the hard cut (128 BPM, bright synth leads, tight electronic drums). The dark-island bed stops dead on the bar line, no overlap, no tail. Picture sound laid in the edit: water slap under the bow and a faint hum from the bridge that grows as the lights come up. No crowd, no horns, no fireworks. Vocals are off-picture; every mouth on screen stays closed.
```

**Grok Imagine**
```
Start from night at sea, filmed from the bow of a white yacht looking ahead over the shoulders and guitar necks of a row of women in ivory dresses seen from behind, swaying together, soft in the foreground. At first only a dark horizon with a faint dotted glow. Over fifteen seconds a long double-deck suspension bridge appears, the Gwangan Bridge in Busan, its main cables and hangers sweeping with RGB LED color in slow waves of green, magenta and blue, and behind it the glass towers of Marine City, windows lighting, until the bridge is fully lit and the towers are bright, with long strong reflections shimmering on the black water. The yacht approaches steadily but the city stays far ahead; no dock, no harbor, no other boats. No text on the bridge or towers. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, RGB LED color only, no orange, 15 seconds, Grok Imagine style
```

**Prompt variations**
- Low on the water, the bow wave glowing faintly with reflected color, the bridge and towers appearing over the waterline, no yacht deck in frame, Grok Imagine
- Locked wide on the bridge alone at the moment all its cables light, RGB waves running along the main cables from pylon to pylon, no yacht, no other boats, Grok Imagine

---

## Q — Same chairs (2:39–2:46)

**Bed:** Seoul at Night. **Clip:** 10s, trims to 7s (about 4 bars). **Chain:** none.  
**Start:** a slow slide along the two lounges at night, green and magenta light rolling over the pair and the glass balustrade.  
**Last:** the slide ends on Lillith's lens, the bridge's cables small and sharp in the dark glass.  
**Motion:** one slow slide from Rubella to Lillith. Neither woman moves. Same chairs, same places.  
**Lyric note (paraphrase):** [Verse / Pre-chorus] the same chair, the same place; green and magenta on the railing, on the glass; no one gets off.

**On screen:** The same two lounges, now washed in green and magenta. The bridge sits small in a dark lens. Nobody gets up.

**Sound**
```
Bed: Seoul at Night, end of [Verse] into [Pre-chorus] (128 BPM). Picture sound laid in the edit: a low water slap and the cable hum from P, a little closer. No glass clinks, no voices.
```

**Grok Imagine**
```
Start from night, a slow slide along two white lounges on the aft deck of a white yacht. Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, lie in the same places as before in dark sunglasses, not performing, faces calm. Bands of green, magenta and blue light from a distant lit bridge roll across their black lace, their skin and the glass balustrade at the deck edge, and the bridge's glowing cables are reflected small and sharp in their dark lenses. On the side table between them, a plain white mug, empty, its text turned away, and a vacuum tube wrapped in a white dish towel like an egg; a full red marine fire extinguisher stands untouched at the foot of Rubella's lounge. Beyond the glass rail the silhouettes of the guitar line sway. Neither woman moves. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, RGB LED color only, no orange, no text, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Close on the side table only: a plain white mug, empty, text turned away, and a vacuum tube wrapped in a white dish towel like an egg, colored light rolling over both, shallow focus, no people, Grok Imagine
- Close on the glass balustrade at the deck edge, green and magenta bands rolling across the glass, the silhouette of a guitar neck crossing behind it, no people in focus, Grok Imagine

---

## R — Light on the hull (2:46–2:54)

**Bed:** Seoul at Night. **Clip:** 10s, trims to 8s (about 4 bars). **Chain:** none.  
**Start:** water level, the white hull at night, the first band of green light arriving on it.  
**Last:** the hull washed magenta, its reflection stretching on the black water.  
**Motion:** colored light slides along the hull like color over a screen. The line above catches the same colors and keeps its slow sway.  
**Lyric note (paraphrase):** [Chorus] we don't anchor; light on the hull.

**On screen:** Green, magenta and blue slide over the white hull and stretch into ribbons on the black water.

**Sound**
```
Bed: Seoul at Night, [Chorus] (128 BPM). Picture sound laid in the edit: water along the hull, low, nothing else. The hum from the bridge drops out here so the chorus has room.
```

**Grok Imagine**
```
Start from night, a camera low over black water alongside the glossy white hull of a yacht moving slowly. Slow bands of green, magenta and blue light from a distant lit bridge slide along the white hull like color passing over a screen, and the same colors stretch into wobbling ribbons on the water below. Above on the rail the ivory dresses and guitar necks of the line catch the same colors and sway together. No text on the hull, no name, no logo. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, RGB LED color only, no orange, 10 seconds, Grok Imagine style
```

**Prompt variations**
- Close on the waterline: the white hull meeting black water, color ribbons wobbling where the reflection breaks, no deck in frame, Grok Imagine
- From the water ahead of the bow, looking back along the hull as color bands run aft over the white, guitar necks tilting together above, Grok Imagine

---

## S — Ring from above (2:54–3:09)

**Bed:** Seoul at Night. **Clip:** 15s, trims to 15s (8 bars). **Chain:** last frame = start still of T.  
**Start:** straight overhead, a white yacht on black water, a ring of women at the deck edge like beads on a necklace, two black-lace figures inside it.  
**Last:** a high wide view with the horizon, the lit bridge and towers ahead, the yacht small and alone on the dark water.  
**Motion:** slow crane up with a slow rotation, tilting forward until the horizon appears. Colored light travels around the ring from bead to bead.  
**Lyric note (paraphrase):** [Chorus] the edge keeps playing.

**On screen:** Seen from above, the guitar line forms a ring around the whole deck edge. Colored light travels around it, then the city appears ahead.

**Sound**
```
Bed: Seoul at Night, [Chorus] (128 BPM). Picture sound laid in the edit: none for the first four bars, then a long, low water wash under the rise. The bed carries the scene.
```

**Grok Imagine**
```
Start from night, a slow crane-up and orbit starting straight overhead: a white luxury yacht on black water seen from directly above, a ring of women in ivory dresses holding electric guitars spaced evenly all the way around the deck edge like beads on a necklace, all facing outward, and inside the ring two small figures in black lace, Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, and Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, on white lounges in dark sunglasses, not performing. Colored light from a distant bridge, green, magenta and blue, washes over the ring and travels around it from bead to bead. The camera rises, slowly rotating and tilting forward until the horizon appears with the glowing double-deck suspension bridge and the Marine City towers ahead, the yacht small and alone on the dark water. No other boats. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, RGB LED color only, no orange, no text, 15 seconds, Grok Imagine style
```

**Prompt variations**
- Straight overhead only, no tilt: the ring of women at the deck edge turning slowly in frame, light traveling around it bead to bead, 10 seconds, Grok Imagine
- The same orbit in daylight, turquoise water, the ring of ivory dresses and guitar bodies at the deck edge, the sun glinting off each pickguard in turn (a possible daylight alternate for B), Grok Imagine

---

## T — The gap (3:09–3:24)

**Bed:** Seoul at Night, final chorus. **Clip:** 15s, trims to 15s (8 bars). **Chain:** start still = S last frame. Last scene of the cutaway.  
**Start:** S's last frame, the high wide: the yacht small on dark water, the lit bridge and towers ahead.  
**Last:** a locked hold just above the water; a strip of black water between the yacht and the lights, unchanged.  
**Motion:** the camera descends to the water ahead of the yacht and holds for the last five seconds. The yacht has stopped. No docking.  
**Lyric note (paraphrase):** [Chorus] we stay.

**On screen:** The yacht has stopped far from the lights. A strip of black water lies between it and the city, and it does not close.

**Sound**
```
Bed: Seoul at Night, final [Chorus] to the end (128 BPM). Picture sound laid in the edit: a low water wash that fades to nothing on the held frame. End on the bed's last bar; no title, no card, no credit over this scene.
```

**Grok Imagine**
```
Start from the high wide night view: a small white yacht on dark water, the lit Gwangan suspension bridge and the glass towers of Marine City ahead. The camera descends toward the black water ahead of the yacht until it hangs just above the surface. The yacht has come to a stop far from the shore. The lit bridge and the towers hold across the whole far side of the frame, their green, magenta and blue LED colors and window lights mirrored in long unbroken streaks on the water; a wide strip of unlit black water lies between the yacht and the lights and never closes. On the yacht the ring of guitar silhouettes along the rail sways together and the two small figures in black lace hold their places on the white lounges. The last five seconds are a locked hold. No dock, no pier, no other boats, no landing. Gentle synchronized sway of the guitar line as if playing long sustained chords, mouths closed, no frantic strumming, no one boards or leaves the yacht, cannons rusted and still, boat does not land. Photoreal, 16:9, 35mm, fine grain, RGB LED color only, no orange, no text, 15 seconds, Grok Imagine style
```

**Prompt variations**
- Lower and tighter: the water surface fills the bottom half of the frame, the reflected bridge and towers shimmering, the yacht a small white shape at the left with the guitar silhouettes just readable, Grok Imagine
- Pull away: from a hold close to the yacht's stern the camera drifts backward over the water until the yacht is small and the gap to the lights is the whole frame, Grok Imagine

---

Dedupe, checked 2026-11-08 across `ideas/`, `notes/`, `prompts/`, `content/cartoons/`, `songs/` and `songs/_drawer/`: no other file stages a yacht, a guitar line, a dolphin, a pick, a prow or wake, a bridge or Marine City. Parrots elsewhere are a jungle room in `ideas/snapback-montages.md` and one flightless parrot in a drawer song; cannons elsewhere are confetti, vortex and pirate-laser props. None is this island.

Farm #22 picture. Not #42.
