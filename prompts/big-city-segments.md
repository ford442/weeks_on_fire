# Big City — Segment Prompts

Treatment: [`ideas/big-city-cutaway.md`](../ideas/big-city-cutaway.md).  
Song: [`songs/Big_City.md`](../songs/Big_City.md).  
Grok packet: [`ai-contributions/grok-4.6/big-city-video.md`](../ai-contributions/grok-4.6/big-city-video.md).  
Local board: `artifacts/big_city_video.md`.  
Suggestions id `big-city` after codegen.

Bed: local `big_city(option_a).mp3` (~2:46.82). 126 BPM. 1 bar = 1.905s. Default clip = **4 bars ≈ 7.6s**. Kenji tag on this take: *“The hair is in big city man.”* at 0:05–0:07.

Grok Imagine audio prompt = that exact stem, hard-cut, no fade, plus start frame + last frame. Do not feed the full 2:47 to one generate.

---

## Continuity lock (paste into every take)

Lillith: dark hair, modern black lace, brighter, committed to the song.  
Rubella: dark hair, same modern black lace, dry cabaret.  
Kenji: teased glam hair, leather fringe, guitar in hand. Spoken tag only. Not sold.

Hair is architecture. Neon magenta and cyan sit in the *gaps between strands*, never as a logo on the hair. Photoreal glam volume. Not cartoon beehives.

Stage is a small Glamora club. Not an arena. No logo wall.

Negatives (every take): no shampoo bottle, no EyeWash bug, no ¥???, no Ultra Screech scream, no Daisy tandem, no living-flower bike, no night-lot cabinet, no Annex wings, no Form 7-09, no Riley starting the song, no product type on the buildings.

---

## Audio-prompt rule

| Plate | Audio stem | Prompt must say |
|---|---|---|
| Club stage | vocal section of option_a | they are singing this record; snare = micro-push |
| Hair-city B-roll | **same** stem | **No lip sync. No one is singing. The hair performs the beat.** |
| Kenji tag | spoken sentence + a bar of riff each side | mouth barely open, not sold, looking at someone else's hair |

Mute Imagine-baked audio in the stack. Ride option_a as master. Keep baked audio only if a stage take actually locks lips.

Working stem times are on *this* 2:46 file. Nudge after an ear pass. Do not change the two Kenji sentences.

---

## Timing sheet (~2:47)

| Beat | Time | Dur | Plate | Mouths |
|------|------|-----|-------|--------|
| A | 0:00–0:08 | 8s | Stage wide + Kenji tag | Kenji spoken |
| B | 0:08–0:23 | 15s | Stage, Lillith verse 1 | Lillith |
| C | 0:15–0:23 | 8s | Fire-escape strand (overlap B-roll) | none |
| D | 0:23–0:31 | 8s | Stage pre-chorus lift | Lillith + Rubella under |
| E | 0:31–0:46 | 15s | Hair skyline chorus lock | none |
| F | 0:46–1:01 | 15s | Stage, Rubella verse 2 | Rubella |
| G | 0:54–1:16 | 22s | Under the fringe / lunch dos / laundry look-through | none |
| H | 1:16–1:31 | 15s | Kenji solo → hair-blocks + ELO afro argument | none |
| I | 1:31–1:46 | 15s | Stage bridge | Rubella; Lillith answers |
| J | 1:46–2:47 | ~61s as 8s stems | Final chorus intercut + Kenji tag K2 | stage mouths on; city off |

Generate-first: A, E, G (fringe or lunch), then H.

---

## Story arc inserts

*The Appointment Day*, added 2026-11-01. Lock and beat map:
[`ideas/big-city-cutaway.md`](../ideas/big-city-cutaway.md) § *Story arc*. These are
**B-roll alternates** inside the C / E / G / H / J windows. Each one is filed next to
the slot it belongs to, in time order, so the Suggestions preview plays them in sequence.
Stage plates A, B, D, F, I and K2 don't change.

| Insert | Time | Window | Replaces / sits beside | Chain |
|---|---|---|---|---|
| C2 Call one | 0:08–0:15 | B (stage verse 1) | a cutaway inside B | — |
| C3 Crown work | 0:15–0:23 | C | alternate to C (fire-escape strand) | — |
| E2 Out the door | 0:39–0:46 | E, back half | sits after E's skyline lock | — |
| G5 Six blocks | 0:54–1:01 | G | alternate to G1 (under the fringe) | — |
| G6 Call two | 1:01–1:08 | G | alternate to G3 (laundry) | → G7 by hard cut (new room) |
| G7 Blowout | 1:08–1:16 | G | alternate to G2 / G4 | — |
| H2 Call three | 1:23–1:31 | H, back half | after the headstock → hair-blocks | — |
| J2 The wash | 1:46–1:54 | J | first city stem | **J2 last frame = J3 start** |
| J3 It dries (drop) | 2:02–2:10 | J | city stem on a gang "Big City" | → J4 by cut to exterior |
| J4 Skyline + delivery | 2:18–2:26 | J | variant of J-skyline | — |
| J5 Call four | 2:31–2:39 | J, last city stem | lands right before K2 | → K2 on stage |

Times are approximate, worked from the timing sheet above. Nudge them after listening to
the track.

**Arc continuity (paste into every insert, after the continuity lock):**
Lillith in modern black lace, dark hair, calm and delighted. The hair is her project.
Rubella in matching black lace, dry, carries things. Glamora city, modern, night or flat
daylight. Salons: shelves out of focus or empty, no bottles, no labels, no text. Phone calls
are silent. Lillith listens and does not speak, and answers with one gesture: thumb and
finger an inch apart. **No lip sync. No one is singing. The hair performs the beat.**

**Clip budget:** generate 10s, trim to 4 bars (7.6s) on the snare. Chain clips where the
table says so: last frame of one = start frame of the next.

**Arc negatives (add to the standard list):** no shampoo or spray bottle in any salon, no
product shelf in focus, no screen text except the one-frame 23%, no caller ID, no calendar,
no one shouting, no one falling, no ceiling damage beyond one lifted tile, not the building,
not the laundromat.

---

## A — Kenji tag, stage (0:00–0:08)

**Start / last:** same small-club wide. Kenji in frame. Ladies present, not yet selling.  
**Motion:** he speaks the line. Guitar down or just finding the riff.  
**Audio stem:** 0:00–0:08 of option_a.  
**Mouths:** Kenji spoken only.

**Grok Imagine**
```
Start from a small nightclub stage, not an arena: two women in modern black lace at two mics, one brighter, one dry, a glam guitarist with teased hair and leather fringe stage right, guitar down at his side. Magenta and cyan light only in the gaps of the backline, no logo wall, no shampoo bottle, no EyeWash bug. He looks at someone else's enormous hair and speaks one dry sentence, mouth barely open, not shouting, not smiling. 8 seconds. Gated snare is a micro-push not a whip pan. No Daisy bicycle, no marble cabinet, Grok Imagine style
```

**Hardeners**

- He sells it → `mouth barely open, spoken not sung, not sold, not announced`
- Bottle appears → `no shampoo bottle, no product, unlabeled nothing`

---

## B — Lillith verse 1, stage (0:08–0:23)

**Start / last:** Lillith at left mic. Rubella one stop down. Kenji working.  
**Motion:** she sings crown work / fire-escape verse. Looks up.  
**Audio stem:** 0:08–0:23.  
**Mouths:** Lillith on.

**Grok Imagine**
```
Start from the locked small Glamora club stage: Lillith in modern black lace at the left silver mic, brighter face, looking up as if the hair above the room were a neon tube she just poured, Rubella in matching black lace one stop darker at the right mic, Kenji stage right playing guitar, leather fringe, teased hair. Magenta and cyan only in backline gaps. No logo wall, no bottle. She sings. Camera locked with micro-pushes on the gated snare. 15 seconds. Photoreal glam, not cartoon beehives, no Daisy tandem, Grok Imagine style
```

**Hardeners**

- Arena creeps in → `small club, low platform, no festival LED wall`
- Third singer → `only Lillith sings, Rubella waits, Kenji does not sing`

---

## C2 — Call one, a little lift (0:08–0:15)

**Start:** morning café window on a Glamora street. Lillith with a phone to her ear, her
dark hair teased but at human scale.
**Motion:** she listens, nods once, and holds up thumb and finger an inch apart.
**Last:** the gesture, held. It's the start still for C3's mirror.
**Mouths:** none. She listens.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal morning on a modern city street, a woman with dark teased hair at ordinary human size in a modern black lace dress stands at a café takeaway window holding a phone to her ear, calm, delighted, listening and not speaking; she nods once, then holds up her free hand with thumb and forefinger one inch apart, meaning "just a little". Flat daylight, faint magenta and cyan neon in the gaps of her hair only, no text on the window, no logos, no bottle. Locked camera. 10 seconds, Grok Imagine style
```

---

## C — Fire-escape strand (0:15–0:23)

**Start / last:** one lock of photoreal hair climbing a brick wall like a fire escape.  
**Motion:** wind combs; neon sits in the gaps; strand climbs on the snare.  
**Audio stem:** same 0:15–0:23 slice as the late half of B.  
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Night alley, wet brick, one enormous lock of photoreal glam hair climbing the wall like a fire escape, neon magenta and cyan sitting only in the gaps between strands, never painted on the hair as a logo. Wind combs the strand on the gated snare. No faces required. No shampoo bottle, no cartoon beehive, no concert stage in this frame. 8 seconds. Grok Imagine style
```

**Hardeners**

- Extras sing → `no faces singing, no mouths, hair only`
- Beehive cartoon → `photoreal hair, individual strands, not a cartoon wig`

---

## C3 — Crown work (0:15–0:23)

Alternate to C (fire-escape strand). Lyric: *Crown work on a Tuesday*.

**Start:** salon one. Lillith in the chair facing a mirror. A deadpan stylist on a two-step
stool with a teasing comb. Rubella in a waiting chair behind, holding a "World's Okayest
Tenant" mug.
**Motion:** the crown rises about an inch on every snare hit. On the last bar Lillith
stands, and her head clears the top of the mirror frame.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal small modern hair salon, a woman in a modern black lace dress sits in a salon chair facing a mirror while a deadpan stylist standing on a two-step stool teases her dark hair upward with a comb, the crown rising about an inch on every snare hit; behind them in a waiting chair a second woman in matching black lace with long dark hair and blood-red lipstick holds a mug and watches with a dry expression. Salon shelves blurred and empty, no bottles, no labels, no text. On the last beat the seated woman stands and her hair rises past the top of the mirror frame. Locked camera. 10 seconds, Grok Imagine style
```

**Hardeners**

- Bottles appear → `empty shelves, no product, no spray can, no bottle anywhere`
- Stylist reacts → `stylist deadpan, working, does not look at camera`

---

## D — Pre-chorus lift, stage (0:23–0:31)

**Start / last:** both at mics. Hair volume rises like a comb through a crown.  
**Motion:** Lillith leaps the pre; Rubella under.  
**Audio stem:** 0:23–0:31.  
**Mouths:** both.

**Grok Imagine**
```
Start from the same small club stage, two women in modern black lace at two silver mics, Lillith brighter leaping the pre-chorus, Rubella dry underneath, Kenji working stage right. Their teased hair lifts like a comb through a crown on the snare, still photoreal, not a cartoon. Magenta and cyan only in the gaps. No logo, no bottle. 8 seconds. Micro-push on the cowbell if it hits, Grok Imagine style
```

---

## E — Hair skyline chorus lock (0:31–0:46)

**Start / last:** night street, upper third is teased hair reading as towers. Two small figures looking up.  
**Motion:** towers hold; neon in the gaps pulses on title hits.  
**Audio stem:** 0:31–0:46.  
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal night city street looking up: the skyline is enormous teased glam hair reading as towers and fire escapes, not a cartoon beehive. Magenta and cyan neon sits in the gaps BETWEEN strands, never as a logo on the hair. Two small figures on wet asphalt looking up. Title hits brighten building-lights in the hair, not signage. No shampoo bottle, no concert stage, no billboard product. 15 seconds. Grok Imagine style
```

**Hardeners**

- Logo on the towers → `no type on the hair, no brand, lights only in the gaps`
- People perform → `figures only look up, they do not sing, they do not dance a chorus`

---

## E2 — Out the salon door (0:39–0:46)

Back half of the chorus window. E's skyline lock still opens the chorus.

**Start:** inside salon one, Lillith at the glass door, crown now about two feet tall.
**Motion:** she stops short, turns her shoulders 45 degrees, ducks, and goes out sideways.
Her crown presses a print the size of a dinner plate onto the glass. The receptionist
wipes it without looking up. Rubella follows through the door normally.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal salon entrance from inside, a woman in modern black lace with enormous teased dark hair about two feet tall stops short at a glass door, turns her shoulders sideways, ducks, and steps out onto the street; her hair presses a round smudge print the size of a dinner plate onto the glass as she passes; a deadpan receptionist at the desk wipes the print with a cloth without looking up; a second woman in matching black lace follows through the door at a normal height, dry. No text on the door, no bottles, magenta and cyan only in the gaps between strands. Locked camera. 10 seconds, Grok Imagine style
```

---

## F — Rubella verse 2, stage (0:46–1:01)

**Start / last:** Rubella at the mic. Dry.  
**Motion:** she sings the fringe / HOA / standing-in-line verse.  
**Audio stem:** 0:46–1:01.  
**Mouths:** Rubella.

**Grok Imagine**
```
Start from the locked small club stage: Rubella in modern black lace at the right mic, dry cabaret, she is in the city and she did not ask for a skyline on her head, Lillith one step back, Kenji playing. Honest skin under backline gaps of magenta and cyan. She sings. 15 seconds. No smile for camera, no bottle, no logo wall, Grok Imagine style
```

---

## G — Fringe / lunch / laundry (0:54–1:16)

Three B-roll options. Shoot fringe first. Lunch-volume and ELO afros sit here and on the solo, not on Kenji tags.

**Mouths:** none on all three.

### G1 — Under the fringe

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Street-level walk under a colossal photoreal glam hair fringe that forms a canopy over a city block, shopfront fluorescents underneath. A woman in modern black lace walks in line under the fringe, dry expression. Split ends catch window light like open windows. Magenta neon only in far gaps. No product bottle, no stage. 8 seconds. Grok Imagine style
```

### G2 — Lunch engagement

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Cramped diner lunch. Two people sit across a small table with normal-scale club sandwiches. Their glam-metal hair is inappropriately enormous, the size of furniture, occupying the neighboring chairs until the menus disappear. The hairdos lean into each other like they are the ones having lunch. Magenta and cyan only in the gaps between strands. No shampoo bottle, no cartoon beehive, no concert stage. 8 seconds. Grok Imagine style
```

### G3 — Laundry look-through

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Close on a laundromat porthole: a gold-to-green skyline made of teased hair warps in the suds behind the glass. The machine is a window, not a gag. Fluorescent green-white tubes over the row. No bottle, no faces singing. 8 seconds. Grok Imagine style
```

### G4 — ELO afro argument (slow picture)

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Lunch booth, two enormous Jeff Lynne / ELO-member afro volumes facing each other across a diner table, each afro the size of a weather system, leaning in as if arguing. Faces if visible are small and secondary. Coffee cups normal scale. Slow-motion bounce in the picture only — do not time-stretch the audio stem. Magenta and cyan only in tiny strand gaps. No stage, no bottle. 8 seconds. Grok Imagine style
```

**Hardeners**

- Afros sing → `no mouths, hair is the character, argument is bounce not lyric`
- Scale collapses → `food stays normal scale, hair stays furniture-scale`

---

## G5 — Six blocks under it (0:54–1:01)

Lyric: *I walked under somebody's fringe / for six blocks*. G1's anonymous fringe becomes
Lillith's.

**Start:** daylight sidewalk. Lillith walks ahead. The back of her hair overhangs the
sidewalk behind her like a shop awning.
**Motion:** Rubella walks in its shade at the same pace, carrying a full red fire
extinguisher in one hand and her mug in the other. A pigeon lands on top of the crown,
looks around, and stays.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal modern city sidewalk in flat daylight, a woman in modern black lace walks away from camera with enormous teased dark hair whose back overhangs the pavement behind her like a shop awning, casting real shade; a second woman in matching black lace with long dark hair and blood-red lipstick walks underneath it in the shade at the same pace, dry, carrying a full red fire extinguisher in one hand and a mug in the other; one grey pigeon lands on top of the hair, looks around and settles. Shopfronts at normal size, no signage text, no bottles. Slow tracking at walking pace. 10 seconds, Grok Imagine style
```

**Hardeners**

- Extinguisher sprays → `the extinguisher is carried, sealed, unused, pin in`
- Pigeon multiplies → `exactly one pigeon`

---

## G6 — Call two, speakerphone (1:01–1:08)

**Start:** street corner. Lillith lifts her phone toward her ear.
**Motion:** the phone and her hand sink into the hair up to the wrist. She draws them back
out, holds the phone flat in front of her on speaker like a walkie-talkie, and listens.
Gesture: thumb and finger, a little wider this time. Rubella beside her, dry.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal city street corner, a woman in modern black lace with very large teased dark hair raises a phone toward her ear and her hand disappears into the hair up to the wrist; she pulls it back out and holds the phone flat in front of her mouth like a walkie-talkie on speaker, listening, not speaking, then holds up thumb and forefinger two inches apart; a second woman in matching black lace stands beside her with a dry expression. No screen text visible, no logos, magenta and cyan only in the gaps between strands. Locked camera. 10 seconds, Grok Imagine style
```

---

## G7 — The blowout (1:08–1:16)

Chain: G6 last frame → a hard cut to salon two is fine (new room, same day).

**Start:** salon two. Lillith in the chair. A deadpan stylist with a round brush and a
large hair dryer. Rubella standing beside the chair holding the full extinguisher at the
ready.
**Motion:** every pass of the dryer makes the hair rise like bread dough rising in an oven,
on the beat. On the last pass the crown reaches the ceiling and lifts one ceiling tile
half an inch. Nobody looks up.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal modern hair salon, a woman in modern black lace sits in a salon chair while a deadpan stylist blow-dries her dark hair with a round brush and a large hair dryer; with every pass of the dryer the hair swells upward like bread dough rising, on the beat, until the crown touches the ceiling and lifts one white ceiling tile half an inch; beside the chair a second woman in matching black lace with long dark hair and blood-red lipstick stands holding a full red fire extinguisher at the ready, unused, dry expression; nobody looks up. Empty blurred shelves, no bottles, no labels, no text. Locked camera. 10 seconds, Grok Imagine style
```

**Hardeners**

- Hair explodes or flies → `rises smoothly like dough, stays attached, photoreal strands`
- Tile falls → `one tile lifts half an inch and settles, nothing falls`

---

## H — Solo: headstock → hair-blocks (1:16–1:31)

**Start:** Kenji headstock macro.  
**Last:** wide hair-blocks / optional ELO booth still in the city.  
**Audio stem:** 1:16–1:31.  
**Mouths:** none.

**Grok Imagine**
```
No lip sync. Kenji's hands and a guitar headstock fill the first seconds, leather fringe in frame, then the camera finds a wide night street where city blocks are photoreal teased-hair towers. Dive bomb is a vertical slam in the hair, not a whip pan. Magenta and cyan in the gaps only. No bottle, no meter-as-prop, no logo. 15 seconds. Grok Imagine style
```

---

## H2 — Call three, it's in there (1:23–1:31)

The wrong third. Second half of the solo window, after Kenji's headstock → hair-blocks.

**Start:** dusk sidewalk. Lillith pats her pockets; the phone is gone. Rubella dials on her
own phone.
**Motion:** deep inside Lillith's enormous hair, a ringing glow pulses magenta and cyan
through the strands on the beat. Rubella reaches in elbow-deep without looking and pulls
out, one at a time, a pair of sunglasses, a hoop earring and a pencil. Then the phone. Its
screen reads 23% for one frame. She hands it over.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal city sidewalk at dusk, a woman in modern black lace with enormous teased dark hair pats her empty pockets, calm; a second woman in matching black lace with long dark hair and blood-red lipstick holds her own phone to her ear, and deep inside the first woman's hair a ringing glow pulses magenta and cyan between the strands on the beat; the second woman reaches into the hair up to her elbow without looking and pulls out, one at a time, a pair of sunglasses, a single hoop earring, a yellow pencil, and finally a glowing phone, which she hands over with a dry expression. Neon light only from inside the hair, no signage text. Locked camera. 10 seconds, Grok Imagine style
```

**Hardeners**

- More than four items → `exactly four objects: sunglasses, earring, pencil, phone`
- Glow becomes a logo → `light only between strands, no shapes, no text`

---

## I — Bridge on stage (1:31–1:46)

**Start / last:** two-shot. Map, not bottle.  
**Motion:** Rubella dry; Lillith high answer. Blocks hold. Quiet slot stays taped.  
**Audio stem:** 1:31–1:46.  
**Mouths:** both.

**Grok Imagine**
```
Start from the locked small club two-shot: Rubella dry at the mic, Lillith answering high, Kenji thinned back. They wanted a formula; she gave them a map. No bottle in frame. Magenta and cyan only in gaps. 15 seconds. Photoreal glam, Grok Imagine style
```

---

## J — Final chorus intercut + K2 (1:46–2:47)

Generate as 8-second stems. Intercut stage title-hits with hair-skyline in clip_stacker. Land on stage for Kenji's second tag.

**J-stage**
```
Start from the locked small club: both women stacked on the title Big City, Kenji playing, gang off-camera. Micro-push on each title hit. Same hem, same mics. No logo wall, no bottle. 8 seconds. Grok Imagine style
```

**J-skyline**
```
No lip sync. No one is singing. The hair performs the beat. Hair-tower skyline at night, top-floor window lit in the crown after the street has gone to sleep, empty sidewalk. Magenta and cyan only in the gaps. Crown keeps the keys. 8 seconds. Grok Imagine style
```

**K2 — same sentence**
```
Return to the K1 stage wide. Same room, same hem. Kenji looks at someone else's hair and speaks the same dry sentence, mouth barely open, not sold. One strand from the intro still standing. Riff thins. 8 seconds. No bottle, Grok Imagine style
```

---

## J2 — The wash (1:46–1:54)

Back at salon one. The lyric was planted in verse 2: *You can wash it if you want to*.

**Start:** salon one's backwash sink. Lillith leaning back. The stylist from C3 with the
tap.
**Motion:** the whole tower goes flat under the water in one long, slow collapse. Rubella
holds a folded towel ready.
**Last:** Lillith sits up with flat wet hair, and Rubella wraps it in the towel. This is the
J3 start frame.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal salon backwash sink, a woman in modern black lace leans back while a deadpan stylist runs the tap over her enormous teased dark hair, and the whole tower slowly collapses flat and wet into the basin in one long settling motion; a second woman in matching black lace stands by holding a folded white towel; at the end the first woman sits up with flat wet hair and the towel is wrapped around her head like a turban. No bottles, no labels, empty shelves. Locked camera. 10 seconds, Grok Imagine style
```

---

## J3 — It dries (2:02–2:10)

**THE DROP: transforms.** Lyric payoff: *It'll still be a city when it dries*. Land the
towel coming off on a gang "Big City."

**Start:** = J2 last frame. Lillith in the salon chair, towel turban, calm.
**Motion:** Rubella unwraps the towel. On the hit, the hair springs up out of her head as
a cluster of teased towers, rising past the ceiling lights. Tiny windows in the hair light
up one by one, magenta and cyan in the gaps.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal salon at night, a woman in modern black lace sits in a salon chair with a white towel wrapped around her head; a second woman in matching black lace unwraps the towel and on the beat the dark hair springs upward into a cluster of teased hair towers like a city skyline, rising past the hanging ceiling lights, tiny warm windows lighting up one by one inside the strands, magenta and cyan neon in the gaps between them; the seated woman stays calm and pleased, the second woman holds the towel, dry. No bottles, no text. Locked camera. 10 seconds, Grok Imagine style
```

**Hardeners**

- Ceiling breaks → `hair rises past the lights and out of frame, ceiling intact`
- Turns cartoon → `photoreal individual strands, towers made of hair, not buildings`

---

## J4 — Skyline with a delivery (2:18–2:26)

Variant of J-skyline. The skyline is now Lillith's crown (unstated, just the same lit
windows as J3).

**Start / last:** J-skyline at night with one lit window high in the crown. Halfway up the
fire-escape strand, a tiny figure in a red delivery uniform climbs at a steady pace with a
pizza box held level at chest height.
**Motion:** he climbs one flight. He doesn't look at anything. The window stays lit.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal night city skyline made of enormous teased dark hair towers, one warm window lit high in the crown, magenta and cyan neon only in the gaps between strands; halfway up a strand shaped like a fire escape, a tiny man in a clean red pizza delivery uniform climbs at a steady unhurried pace holding a pizza box level at chest height, not looking around; empty wet street below. Name tag unreadable, no logos, no text. Locked wide. 10 seconds, Grok Imagine style
```

---

## J5 — Call four, next Tuesday (2:31–2:39)

**End reaction, spent once.** Then K2 on stage.

**Start:** salon one's front steps at night. Lillith sits, her skyline hair rising out of
frame. Phone to her ear. Rubella beside her.
**Motion:** Lillith listens, then holds up thumb and finger an inch apart: *a little*.
Rubella takes the phone from her hand, ends the call with one thumb press, and sets it
face-down on the step. Lillith doesn't object.
**Mouths:** none.

**Grok Imagine**
```
No lip sync. No one is singing. The hair performs the beat. Photoreal night, the front steps of a small salon, a woman in modern black lace sits with enormous teased dark hair rising out of the top of the frame, phone to her ear, calm and delighted, listening; she holds up thumb and forefinger one inch apart; beside her a second woman in matching black lace with long dark hair and blood-red lipstick takes the phone from her hand, ends the call with one thumb press, and sets it face-down on the step, dry expression; the first woman lets her. Magenta and cyan in the hair gaps only, no text, no bottles. Locked camera. 10 seconds, Grok Imagine style
```

---

## clip_stacker

```
intent:          intercut stage title-hits with hair-skyline; land on Kenji
tool:            intercut + master-audio
inputs:          A = stage chorus clip    B = hair-skyline clip
clock:           parallel
consume:         targetDuration
freq:            snapCutsToBeats: yes
audioPolicy:     silent clips + masterAudio
masterAudio:     big_city(option_a).mp3 @ 0:00
land:            forceFinal = stage K2
do-not:          Ultra Screech picture, Daisy tandem, night-lot, bottle hero, EyeWash
```

---

*Grok 4.6 · 2026-09-11. Catalog glam. Worlds do not mix.*
