# Bounce Castle — Imagine segments

Copy-ready **Grok Imagine** start stills, image-to-video motion text and last stills for the
Lace Waterfall song *Bounce Castle* (~2:23, 175 BPM, 13 segments of ~11 s).
Source and drop map: [`ideas/songs/2026-11-13-bounce-castle.md`](../ideas/songs/2026-11-13-bounce-castle.md).
Runbook: [`ideas/bounce-castle-agentic.md`](../ideas/bounce-castle-agentic.md).
Sibling, **do not share shots**: [`ideas/bounce-house-ring-war.md`](../ideas/bounce-house-ring-war.md).
Farm: songs → [#18](https://github.com/ford442/weeks_on_fire/issues/18) / [#33](https://github.com/ford442/weeks_on_fire/issues/33),
picture → [#22](https://github.com/ford442/weeks_on_fire/issues/22). Never [#42](https://github.com/ford442/weeks_on_fire/issues/42).
`promote?: no`. Drawer only: no cutaway JSON, no codegen.

**Laugh (kid words):** *Everything on the bouncy castle goes flying, and the singer goes up to
the sky and back without messing up her hair.*

## Character blocks (paste verbatim, first, into every prompt that features them)

**RUBELLA:**
`Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face.`

**LILLITH:**
`Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth.`

Canon black lace only. No coat, no mug, no safety glasses, no new costume. The bible's
"half-smile" is overridden for this video by the locked block above: Lillith's mouth stays closed.

**ROYAL COURT (one-off props for this video, not cast):** a king in a red velvet robe and a gold
crown, a queen in a blue storybook gown and a small tiara, a knight in silver storybook armour, a
jester in a red-and-yellow belled hat, and a brown felt pantomime horse with two pairs of human
legs in stripy tights. No names, no lines, no bios.

## Prompt policy

- Order inside every prompt: **subject → bodies → job → castle/room → light → lens/grade.**
- Long on purpose where the shot is complex (~800–1,300 characters). Inserts run shorter. If a
  generation comes back mushy, cut **village-green dressing** first, never the job, the hair
  lock or the light.
- Continuity tokens, repeated verbatim between prompts: **a giant red-and-yellow inflatable
  bouncy castle with puffy turrets and pennant flags on a bright English village green** ·
  **vintage chrome microphone on a stand** · **gloss-black electric guitar** · **small cream
  guitar amp** · **bright summer village green light**.
- Every prompt ends: photoreal cinematic, 16:9, no text, no logos.
- Mute all Imagine audio. Picture is cut to the MiniMax track.

## The physics lock (read before generating anything)

**One kick = one bounce.** 175 BPM is one kick every 0.34 s, so the bounce is a snap, not a
float: up and back down inside one beat, like a trampoline on fast-forward. Imagine will not hit
the grid by itself. Prompt for "even, snappy, rhythmic bounces," then retime in the edit so every
landing sits on a kick. Do not prompt slow motion; retime 55–65 % in the edit where a seed says so.

**Hair, lace and mic settle exactly back into place on every landing.** Not nearly. Exactly.
Rubella never looks down. Nobody on the castle smiles, screams, grabs a turret or reaches for a
flying thing. The only face in the song that reacts is the pigeon (08c).

**Mouths:** Rubella's mouth moves only on the chorus hooks (05a, 11b, 13a) and on the two spoken
breakdown lines (09a, 09c). Everywhere else her lips are closed. Lillith's mouth is closed in
every frame.

## Hardeners (reroll triggers)

- Hair or lace lands messy → `every strand of long dark hair and every fold of black lace falls back exactly into its starting place on landing`
- Rubella glances down → `eyes level to the front, chin level, never looks down`
- Lillith smiles or mugs → `calm closed mouth, no smile, no guitar-hero face`
- Castle reads pink, pastel, or indoors → `red-and-yellow vinyl, outdoors on a village green`. If a take shows ropes, streamers, a party hall or a cartoon band, it has drifted into Ring War: reroll.
- Anyone reacts to the chaos → `faces flat, mildly put out at most, nobody looks at the flying object`
- Pitched-up or chipmunk read of Rubella's lipsync → dry, unhurried, small mouth shapes, no belting

## Timeline

```
01  0:00–0:11  Intro           first kick at 0:05.5: everything up a metre
02  0:11–0:22  Verse 1 a       through the gate, up to the turret tops
03  0:22–0:33  Verse 1 b       court bounces; helmet rises; horseshoe pings off
04  0:33–0:44  Pre-Chorus      up / down hard cuts; the crown sails off
05  0:44–0:55  Chorus DROP     MULTIPLIES: bounces twice as high; crown lands on headstock
06  0:55–1:06  Chorus          flags shoot up, then the band does
07  1:06–1:17  Verse 2 a       cake past the trees, candles lit; dragon bounces out
08  1:17–1:28  Verse 2 b       Lillith upside down; Rubella passes the upset pigeon
09  1:28–1:39  Breakdown       everything down; "Shoes off, please"; horse in four socks
10  1:39–1:50  Solo            court in socks; horse on the krummhorn bars; turret shred
11  1:50–2:01  Final DROP      TRANSFORMS: the whole castle bounces off the lawn
12  2:01–2:12  Final Chorus    drone: across the countryside; every cow looks up
13  2:12–2:23  Outro           lands, deflates; the two-finger brush (spent once)
```

Generate-first order lives in the runbook: **01, 05, 08, 09, 11, 13.**

---

## 01 — Intro: First Kick (0:00–0:11)

**Job:** establish the castle, the band and the court standing dead still, then the first kick
throws all of it up a metre and puts it back exactly.
**Clip:** 10 s, trim to 6 s (shot seed 1). Freeze the clip's first frame for 0:00–0:05.5 over the
lute and fanfare (pennants are the only life; take them from the head of the clip if they move).
The first bounce lands on the kick at **0:05.5**, then even snaps on every kick to 0:11.
**Drop map:** not a drop. First kick. **Mouths:** both closed.

**Start still**
```
Photoreal cinematic wide shot, 16:9. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, one hand resting on the mic, eyes level to the front, lips closed. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She holds a gloss-black electric guitar on a strap, picking hand on the strings, a small cream guitar amp at her heel. Both stand flat-footed on the bouncy floor, completely still. Beside them, in storybook costume, a king in a red velvet robe and gold crown, a queen in a blue gown and small tiara, and a knight in silver armour, all standing on the castle, mildly put out. The castle: a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, a puffy arched gate at the front, vinyl seams and stitching visible, a ring of tall oak trees behind, a flint church tower far off. Bright summer village green light, high afternoon sun, small white clouds, warm bounce off the cut grass. Locked-off wide at eye level, 35mm, clean natural grade, crisp lace and vinyl detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off wide, continuous single take, no cut. For the first half everything is still; only the pennant flags flutter. Then, on one beat, everything on the castle rises one metre straight up at the same instant: Rubella with her microphone stand, Lillith with her black guitar, the amp, the king, the queen and the knight, and lands together on the bouncy floor. Then even, snappy, rhythmic bounces, about three a second, all in unison. Hair and lace settle exactly back into place on every landing. Rubella's mic stays at her mouth, her eyes stay level, she never looks down. Lillith's picking hand keeps moving. No one smiles, no one grabs anything. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic wide shot, 16:9, the same frame as the start a beat after a landing. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at the vintage chrome microphone on a stand, every strand of hair and fold of lace exactly where it began, lips closed, eyes front. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar in place, cream amp at her heel. The king, queen and knight in storybook costume a hand's width above the vinyl, coming down, mildly put out. A giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, pennants mid-flap, oak trees behind. Bright summer village green light, high sun, small white clouds. Locked-off wide, 35mm, clean natural grade, no text, no logos.
```

---

## 02 — Verse 1 a: The Gate (0:11–0:22)

**Job:** "I took one step inside the gate / And now I'm way up there." One step in, one kick, she
is level with the turret tops, and she comes down unchanged.
**Clip:** 15 s, trim to 11 s. Retime so the step lands on a downbeat and the launch on the next kick.
**Mouths:** Rubella closed (verse; she sings to the front, never down). Lillith closed.

**Start still**
```
Photoreal cinematic medium-wide, 16:9. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands on the grass just outside the puffy arched gate, carrying a vintage chrome microphone on a stand in one hand, the mic at her mouth, lips closed, eyes level to the front, one black heel lifted for the step onto the inflatable drawbridge. Behind her through the gate, Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She is playing a gloss-black guitar on the bouncy floor beside a small cream guitar amp. The gate is fat and pillowy, red with yellow trim, a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, the drawbridge a puffy red cushion. Bright summer village green light, high afternoon sun, small white clouds, soft warm bounce off the cut grass. Low tracking camera at hip height, 35mm, clean natural grade, crisp lace and vinyl detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Continuous single take. Rubella takes one even step through the puffy gate onto the inflatable drawbridge, microphone stand in hand. On the next beat the floor launches her straight up, in one snap, until she is level with the tops of the puffy turrets, and the camera tilts up with her. She hangs there for a heartbeat, upright, mic at her mouth, eyes level to the front, never looking down, then drops straight back to the bouncy floor and keeps bouncing evenly on every beat. Every strand of hair and every fold of lace lands exactly back in place. Her face does not change. Lillith keeps playing behind her. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic medium shot, 16:9, camera tilted up. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She is upright in mid-air level with the tops of the puffy turrets, vintage chrome microphone on a stand held at her mouth, lips closed, eyes level to the front, every hair in place, the lace hem perfectly still. Pennant flags at her shoulder height. Below and behind, the red-and-yellow vinyl of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, oak trees and blue sky. Bright summer village green light, high sun, small white clouds. 35mm, clean natural grade, crisp lace detail, no text, no logos.
```

---

## 03 — Verse 1 b: The Court (0:22–0:33)

**Job:** the court bounces in rhythm and comes apart a little: the king and queen go up and down
on an inflatable throne, the knight's helmet pops off and keeps rising, a horseshoe flies off the
pantomime horse. The court looks mildly put out. The band acts like nothing is happening.
**Clips:** 03a 10 s trim 6 s · 03b 6 s trim 5 s. Hard cut between them on a downbeat.
**Mouths:** all closed.

### 03a — Throne and helmet

**Start still**
```
Photoreal cinematic medium-wide, 16:9. A king in a red velvet robe and gold crown sits on a puffy red-and-yellow inflatable throne, a queen in a blue storybook gown and small tiara on a matching inflatable throne beside him, both upright and mildly put out. A knight in silver storybook armour stands next to them, helmet on, visor up, face patient. In the soft background, Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed, and Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She is playing a gloss-black guitar. All on the bouncy floor of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green. Bright summer village green light, high afternoon sun, small white clouds, warm bounce off the grass. Eye-level, 35mm, clean natural grade, crisp velvet and vinyl detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off, continuous single take. Everyone bounces in even, snappy unison on every beat: the king and queen go up and down on their inflatable thrones, the thrones bouncing with them. On one landing the knight's silver helmet pops off his head and keeps rising straight up out of the top of frame while he comes back down without it. He does not look up. The king and queen look mildly put out. In the background the band bounces too, playing as if nothing is happening, hair and lace settling exactly back into place each time. Photoreal, summer daylight.
```

**Last still**
```
Same frame as the start: the king in red velvet and gold crown and the queen in blue gown and tiara mid-bounce on their puffy red-and-yellow inflatable thrones, the knight in silver storybook armour now bareheaded, short grey hair, patient face, no helmet anywhere in frame. Background: Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. A giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green. Bright summer village green light. 35mm, clean natural grade, no text, no logos.
```

### 03b — The horse loses a shoe

**Start still**
```
Photoreal cinematic low close shot, 16:9, at floor level on red-and-yellow bouncy vinyl. The front legs of a brown felt pantomime horse, two human legs in stripy tights ending in big felt hooves, one shiny iron horseshoe nailed to the bottom of each hoof. The horse's felt head droops above, button eyes, stitched mouth, mildly put out. Behind, out of focus, the knight's silver sabatons and the hem of the queen's blue gown. The floor of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green. Bright summer village green light, high sun. Low angle, 50mm, clean natural grade, no text, no logos.
```

**Motion**
```
Locked-off, continuous take. The pantomime horse's front legs bounce evenly on every beat. On one landing a single iron horseshoe pops off the right hoof with one bright spark of light and spins away up and out of frame. The horse keeps bouncing on three shoes, in rhythm, unbothered. Photoreal, summer daylight.
```

**Last still:** same as start, minus the right front horseshoe; a bare felt hoof.

---

## 04 — Pre-Chorus: Up on the One (0:33–0:44)

**Job:** "Up on the one / Down on the two." Hard cuts on every quarter note: UP frame, DOWN frame,
UP, DOWN. On "Hold on to your crown" the king's crown lifts off and sails out the top of frame.
**Clips:** 04a is a start/last **still pair**, used as alternating stills (the motion clip is
backup only). 04b 6 s, trim 3 s, lands on "crown."
**Mouths:** closed. The vocal is flat and evenly spaced; the cutting carries the rhythm, not lips.

### 04a — Up / down pair

**Start still (DOWN frame)**
```
Photoreal cinematic wide shot, 16:9, locked-off at eye level. Everything on the castle at the bottom of a bounce, sitting low into the vinyl. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed, eyes front. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar, small cream guitar amp. The king in red velvet and gold crown, the queen in blue gown and tiara, the bareheaded knight in silver armour, the brown felt pantomime horse and a jester in a red-and-yellow belled hat, all knees soft, mildly put out. The floor pressed down under their weight. A giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, oak trees behind. Bright summer village green light, high afternoon sun, small white clouds. 35mm, clean natural grade, crisp detail, no text, no logos.
```

**Motion (backup)**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off wide, continuous take. One single even bounce: everyone on the castle rises together, about one metre, and the clip ends at the top. Hair and lace hold their shape. No one looks down. Photoreal, summer daylight.
```

**Last still (UP frame)**
```
Photoreal cinematic wide shot, 16:9, the identical locked-off frame, everything at the top of a bounce, one metre above the vinyl, all in the same poses as the down frame. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Her mic is at her mouth, eyes front, hair and lace exactly as below. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar, the cream amp floating at her heel. The king, queen, bareheaded knight, pantomime horse and jester in mid-air, mildly put out. A giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green below them. Bright summer village green light, high sun. 35mm, clean natural grade, no text, no logos.
```

### 04b — Hold on to your crown

**Start still**
```
Photoreal cinematic medium close-up, 16:9. The king in a red velvet robe and a heavy gold crown, at the top of a bounce, arms at his sides, mildly put out, eyes front. Behind him, soft, the red-and-yellow turrets and pennant flags of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, blue sky above. Bright summer village green light, high sun. 50mm, clean natural grade, no text, no logos.
```

**Motion**
```
Continuous take, camera locked. The king drops down out of frame on the beat, but his gold crown does not: it stays where it was, then lifts and sails straight up out of the top of frame, turning slowly. He does not reach for it. Photoreal, summer daylight.
```

**Last still:** empty sky and pennant tips; no king, no crown.

---

## 05 — Chorus: DROP 1, MULTIPLIES (0:44–0:55)

**Job:** **multiplies** — from the drop, every bounce is twice as high. Rubella is level with the
flagpoles. The crown comes back down and lands neatly on Lillith's headstock.
**Clips:** 05a 10 s trim 6 s (close-up, the hook) · 05b 6 s trim 5 s (the crown lands). Cut 05a
on the drop downbeat at 0:44.
**Mouths:** Rubella **on** for "Bounce castle / A castle that bounces" (05a). Lillith closed.

### 05a — Flagpole height

**Start still**
```
Photoreal cinematic close-up, 16:9. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Head and shoulders, at the very top of a bounce, level with the tips of the castle's flagpoles, a red pennant and a yellow pennant streaming beside her ear. A vintage chrome microphone on a stand held at her mouth, lips just parted on a word, no expression, eyes level to the front, never looking down. Every strand of long dark hair lying exactly in place, the black lace at her collarbone unruffled. Far below, out of focus, the red-and-yellow vinyl of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, tops of oak trees. Bright summer village green light, high afternoon sun, small white clouds, warm sun on her cheek. 85mm, shallow depth of field, clean natural grade, crisp lace and lipstick detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Continuous take, the camera rides with her. Rubella snaps down out of the sky and back up to flagpole height on every beat, twice as high as before, fast and even. At the top of each bounce she is singing, small flat mouth shapes, dry and unhurried, no belting, no expression, eyes level to the front, never looking down. Her hair and lace stay exactly in place through the whole bounce. The pennants flick past her ear each time. Photoreal, summer daylight.
```

**Last still:** same as start.

### 05b — The crown lands

**Start still**
```
Photoreal cinematic medium close-up, 16:9. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She plays a gloss-black electric guitar on the bouncy floor, the long headstock angled up and out to the side, picking hand mid-stroke, eyes on nothing in particular. Above the headstock, against blue sky, a gold crown is falling, turning slowly. Behind her, the red-and-yellow turrets and pennant flags of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green. Bright summer village green light, high sun, small white clouds. 50mm, clean natural grade, crisp mascara and lace detail, no text, no logos.
```

**Motion**
```
Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Continuous take, camera locked. The gold crown falls straight down and lands neatly on the end of Lillith's guitar headstock, settling there like it was placed. She does not look at it. Her picking hand never stops. She bounces evenly on the beat and the crown stays on the headstock. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic medium close-up, 16:9. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She is playing a gloss-black electric guitar, a gold crown resting neatly on the end of the headstock, her eyes not on it, picking hand mid-stroke. A giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green behind her. Bright summer village green light, high sun. 50mm, clean natural grade, no text, no logos.
```

---

## 06 — Chorus: Up Go the Flags (0:55–1:06)

**Job:** the whole castle pulses on every kick. On "Up go the flags" the pennants shoot up off
the turrets; on "And up goes the band" so does the band, both in exactly the same pose.
**Clip:** 15 s trim 11 s. Retime so the flags launch on "flags" and the band on "band."
**Mouths:** closed (wide; no lipsync read). Lillith's picking hand never stops.

**Start still**
```
Photoreal cinematic wide shot, 16:9, slightly low angle across the lawn. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed, eyes front. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar with a gold crown resting on the headstock, small cream guitar amp. Both at centre on the bouncy floor; the king, queen, bareheaded knight, jester and pantomime horse around the edges, mildly put out. The whole of a giant red-and-yellow inflatable bouncy castle with puffy turrets and pennant flags on a bright English village green, four fat turrets, a red or yellow pennant on a pole at the top of each, the walls bulging slightly as if mid-breath. Oak trees and a far flint church tower. Bright summer village green light, high afternoon sun, small white clouds, warm bounce off the cut grass. 28mm, clean natural grade, crisp vinyl seams, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off wide, continuous take. The whole castle pulses on every beat, walls and turrets swelling and snapping back, everyone on it bouncing in even unison. Partway through, all the pennant flags shoot straight up off the turret tops into the sky at once. A few beats later, Rubella and Lillith shoot straight up too, together, in exactly the same poses they were playing in, mic at Rubella's mouth, Lillith's picking hand still moving, then drop back to the floor and keep bouncing. Hair and lace settle exactly back into place. Nobody looks up at the flags. Photoreal, summer daylight.
```

**Last still:** same frame as the start, bare flagpoles on every turret, no pennants anywhere.

---

## 07 — Verse 2 a: Cake and Dragon (1:06–1:17)

**Job:** "The cake went up above the trees / The candles stayed alight / The dragon tried to
breathe some fire / And bounced clean out of sight." Nobody watches the cake.
**Clips:** 07a 6 s trim 5 s · 07b 10 s trim 6 s. Hard cut on the downbeat of line 3.
**Mouths:** closed.

### 07a — The cake

**Start still**
```
Photoreal cinematic medium-wide, 16:9. A tall three-tier white birthday cake with yellow icing swags, its candles lit, sitting on a small trestle table on the red-and-yellow bouncy floor. Behind it, Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed, eyes front, not looking at the cake; and Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar, gold crown on the headstock. A giant red-and-yellow inflatable bouncy castle with bare flagpoles on its puffy turrets on a bright English village green, tall oak trees behind. Bright summer village green light, high afternoon sun, small white clouds. 35mm, clean natural grade, crisp icing and lace detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Continuous take, camera tilts up. On one beat the bouncy floor launches the birthday cake straight up off its table, level and upright, and it keeps rising past the tops of the oak trees into the blue sky, every candle still lit, flames steady. The camera follows it up. Below, the band keeps bouncing and playing and does not look up. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic shot, 16:9, looking up. A tall three-tier white birthday cake with yellow icing swags hanging upright in blue sky above the tops of tall oak trees, every candle still lit, flames steady, small white clouds. Bright summer village green light, high sun. 35mm, clean natural grade, no text, no logos.
```

### 07b — The dragon

**Start still**
```
Photoreal cinematic medium-wide, 16:9. A small green inflatable dragon, puffy and round with stubby wings and a fat snout, standing on the red-and-yellow bouncy floor near the castle wall, mouth open, looking determined. Behind it, Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed; Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar. The puffy wall of a giant red-and-yellow inflatable bouncy castle with puffy turrets on a bright English village green, oak trees behind. Bright summer village green light, high sun. 35mm, clean natural grade, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Continuous take, camera locked. The inflatable dragon puffs out one tiny orange flame, the size of a match, which goes out at once. On the next beat the floor bounces it sideways into the puffy castle wall, it rebounds off the wall and sails clean out of frame. The band keeps bouncing and playing behind, faces flat, not looking. Photoreal, summer daylight.
```

**Last still:** same frame, no dragon.

---

## 08 — Verse 2 b: Upside Down, and the Pigeon (1:17–1:28)

**Job:** "My friend is playing upside down / Her face has not moved yet / I passed a pigeon going
up / The pigeon looked upset." The pigeon is the only face in the song that reacts.
**Clips:** 08a 10 s trim 4 s, retime to 60 % in the edit (shot seed 3) · 08b 6 s trim 4 s ·
08c 6 s trim 3 s. Hard cuts on downbeats.
**Mouths:** closed.

### 08a — Upside down (shot seed 3)

**Start still**
```
Photoreal cinematic medium shot, 16:9, mid-air at treetop height above an inflatable castle. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She is upside down, head toward the ground and heels toward the sky, still playing her gloss-black electric guitar, face completely calm, picking hand mid-stroke, the gold crown resting on her guitar headstock. Her long dark hair hangs neatly, her black lace dress keeps its shape, her mascara is flawless. Behind her, blue sky and the tops of oak trees; below, out of focus, the pennant poles and red-and-yellow turrets of a giant red-and-yellow inflatable bouncy castle with puffy turrets on a bright English village green. Bright summer village green light, high afternoon sun, small white clouds, sun on the lace. 50mm, clean natural grade, crisp mascara and lace detail, no text, no logos.
```

**Motion**
```
Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Continuous take. At the top of the bounce Lillith makes one slow half-turn in the air, still upside down and still playing, face calm, mouth closed, picking hand never stopping, the crown staying on the headstock. Then she drops straight down out of the bottom of frame, leaving blue sky and treetops. Do not prompt slow motion; normal speed. Photoreal, summer daylight.
```

**Last still:** blue sky and oak treetops, empty.

### 08b — Rubella passes the pigeon

**Start still**
```
Photoreal cinematic medium shot, 16:9, at treetop height. A grey city pigeon sitting on a leafy oak branch in the foreground left. Right of frame, rising past it, Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She is upright, vintage chrome microphone on a stand at her mouth, lips closed, eyes level to the front, not looking at the pigeon, every hair in place. Blue sky, the oak canopy around them. Bright summer village green light, high afternoon sun through the leaves, small white clouds. 50mm, clean natural grade, crisp feather and lace detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Continuous take, camera locked on the branch. Rubella rises straight up past the pigeon in one smooth snap and out of the top of frame, upright, mic at her mouth, eyes front, hair and lace unmoved. The pigeon's head follows her up. Photoreal, summer daylight.
```

**Last still:** the pigeon alone on its branch, head tipped up toward empty sky.

### 08c — The pigeon looks upset

**Start still**
```
Photoreal cinematic close-up, 16:9. A grey city pigeon on a leafy oak branch, head turned to camera, feathers puffed out, one orange eye wide, beak slightly open, looking upset. Soft green leaves and blue sky behind. Bright summer village green light, high sun through the leaves. 100mm macro, shallow depth of field, clean natural grade, no text, no logos.
```

**Motion**
```
Locked-off close-up. The pigeon ruffles its feathers once, pulls its head back and stares straight at camera, upset. A leaf trembles. Photoreal, summer daylight.
```

**Last still:** same as start.

---

## 09 — Breakdown: Shoes Off (1:28–1:39)

**Job:** the kick stops. Everything comes down and stays down. At ground level Rubella says "Shoes
off, please" into the mic. Cut to the entrance mat: a neat row of shoes has appeared. On "That
includes the horse," the pantomime horse is standing on the castle in four socks.
**Clips:** 09a 10 s trim 4 s · 09b 6 s, locked off (shot seed 2) · 09c 6 s trim 4 s.
**Timing:** line 1 over 09a. Then **one bar of pad, 1.4 s, written and timed, nothing filled**:
the shoe row holds still before the horseshoes drop. Line 2 over 09c.
**Mouths:** **spoken, not sung.** Rubella on for both lines, flat, close, dry. Lillith closed.
Rubella does not look at the horse.

### 09a — "Shoes off, please"

**Start still**
```
Photoreal cinematic medium close-up, 16:9, everything at rest. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands still on the flat bouncy floor at a vintage chrome microphone on a stand, close to the mic, lips just parting to speak, eyes level to the front, hair and lace perfectly in place. Beside her, Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar with the gold crown on the headstock, hand resting still on the strings. Behind them the court standing still, mildly put out. The castle has stopped moving: a giant red-and-yellow inflatable bouncy castle with bare flagpoles on its puffy turrets on a bright English village green, oak trees behind. Bright summer village green light, high afternoon sun, small white clouds. 50mm, clean natural grade, crisp lace and lipstick detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off, continuous take. Nobody bounces. Everything is still. Rubella says one short line into the microphone, flat and dry, small mouth shapes, no expression, eyes front, then closes her mouth and waits. Lillith does not move. A breeze barely moves the grass. Photoreal, summer daylight.
```

**Last still:** same as start, Rubella's lips closed.

### 09b — The shoe row (shot seed 2)

**Start still**
```
Photoreal cinematic close-up at ground level on the entrance mat of a red inflatable castle: a neat row of a pair of black stiletto heels, a second pair of black stiletto heels and a pair of silver knight's iron boots, all side by side, toes lined up exactly. The puffy red-and-yellow edge of the castle floor behind them, soft green lawn in front, a few blades of cut grass on the mat. Bright summer village green light, high afternoon sun, soft shadows under the shoes. Locked-off, 50mm, low angle, shallow depth of field, clean natural grade, crisp leather and steel detail, photoreal cinematic, 16:9, no text, no logos.
```

**Motion**
```
Locked-off, continuous take. Everything holds perfectly still for over a second. Then a fourth item drops in from the top of frame: four iron horseshoes, which land on the mat beside the iron boots in a tidy square and lie still. Nothing else moves. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic close-up at ground level on the entrance mat of a red inflatable castle: a neat row of a pair of black stiletto heels, a second pair of black stiletto heels, a pair of silver knight's iron boots, and four iron horseshoes laid in a tidy square, all side by side. Soft green lawn, bright summer village green light, high sun. Locked-off, 50mm, clean natural grade, photoreal cinematic, 16:9, no text, no logos.
```

### 09c — "That includes the horse"

**Start still**
```
Photoreal cinematic medium shot, 16:9. Foreground right, soft focus: Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, facing the camera, lips parting to speak, not looking behind her. Background left, sharp: the brown felt pantomime horse standing on the bouncy floor in four white socks, one on each felt hoof, button eyes, stitched mouth, standing very properly. A giant red-and-yellow inflatable bouncy castle with bare flagpoles on its puffy turrets on a bright English village green, oak trees behind. Bright summer village green light, high afternoon sun, small white clouds. 50mm, focus on the horse, clean natural grade, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Locked-off, continuous take, nobody bounces. Rubella says one short line into the microphone, flat and dry, no expression, eyes front, never turning to look at the horse. Behind her the pantomime horse shifts its weight once from one socked hoof to the other and stands still. Photoreal, summer daylight.
```

**Last still:** same as start, Rubella's lips closed.

---

## 10 — Solo: Socks On (1:39–1:50)

**Job:** the kick comes back and the whole court is back up, in socks. The pantomime horse bounces
exactly on the krummhorn's bars. Lillith shreds on a turret top with a flat face.
**Clips:** 10a 10 s trim 5.5 s (the krummhorn bars) · 10b 10 s trim 5.5 s (the guitar bars).
Cut between them where guitar and krummhorn trade.
**Mouths:** closed. No guitar-hero faces.

### 10a — The court in socks

**Start still**
```
Photoreal cinematic wide shot, 16:9. The king in a red velvet robe, bareheaded, the queen in a blue gown and tiara, the knight in silver armour with white socks on his feet, the jester in a red-and-yellow belled hat, and the brown felt pantomime horse in four white socks, all mid-bounce in the air above the bouncy floor, mildly put out. At the back, Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed, in stockinged feet; Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar with the gold crown on the headstock. A giant red-and-yellow inflatable bouncy castle with bare flagpoles on its puffy turrets on a bright English village green, oak trees behind. Bright summer village green light, high afternoon sun, small white clouds. 28mm, clean natural grade, crisp sock and vinyl detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off wide, continuous take. Everyone bounces in even, snappy rhythm on every beat, in socks. The pantomime horse bounces higher than the rest in a steady pattern of its own, up for a few beats, then down for a few beats, very precise, like a dancer counting. Nobody watches it. The band keeps playing at the back, hair and lace settling exactly back into place. Photoreal, summer daylight.
```

**Last still:** same frame, the horse at the top of its bounce.

### 10b — Turret shred

**Start still**
```
Photoreal cinematic low-angle medium-wide, 16:9. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She stands on top of one puffy red turret of the castle in stockinged feet, playing a fast guitar solo on a gloss-black electric guitar, fretting hand high on the neck, picking hand a blur, the gold crown still on the headstock, face completely flat, eyes on nothing. A bare flagpole beside her. Below her, the rest of a giant red-and-yellow inflatable bouncy castle with puffy turrets on a bright English village green, blue sky and small white clouds above. Bright summer village green light, high afternoon sun, rim light on her hair and lace. 24mm low angle, clean natural grade, crisp lace and mascara detail, no text, no logos.
```

**Motion**
```
Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Camera slowly circles a quarter turn around her, continuous take. Lillith plays a fast solo on top of the turret, bouncing on every beat, landing exactly on the turret top every time, fingers flying, face flat, mouth closed, no expression change at all. Her hair and lace settle exactly back into place on each landing. Photoreal, summer daylight.
```

**Last still:** same as start, camera a quarter turn round.

---

## 11 — Final Chorus: DROP 2, TRANSFORMS (1:50–2:01)

**Job:** **transforms** — on the key change, the whole castle bounces off the lawn like a ball and
clears the treeline with everyone on it. Rubella does not hold on to anything.
**Clips:** 11a 15 s trim 6 s (cut in on the key-change downbeat at 1:50) · 11b 10 s trim 5 s.
**Mouths:** Rubella **on** for the hook (11b). Lillith closed.

### 11a — The castle bounces off

**Start still**
```
Photoreal cinematic wide shot, 16:9, from the edge of the lawn. The whole of a giant red-and-yellow inflatable bouncy castle with puffy turrets and bare flagpoles on a bright English village green, squashed low against the grass at the bottom of a bounce, walls bulging. On its floor, small in the middle of frame: Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand; Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar with the gold crown on its headstock, small cream guitar amp; the king, queen, knight, jester and pantomime horse in socks around them. A ring of tall oak trees behind, a flint church tower far off, the cut grass pressed flat around the castle's base. Bright summer village green light, high afternoon sun, small white clouds, warm bounce off the grass. 24mm, clean natural grade, crisp vinyl seams, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off wide, continuous take. The whole castle springs off the lawn like a giant rubber ball, all of it, turrets, walls and floor, and sails up and over the ring of oak trees with everyone still standing on it in their places, the band playing, the court in socks. It leaves a flat rectangle of pressed grass on the green. No one holds on to anything. Hair and lace hold exactly. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic wide shot, 16:9, the same locked-off view of the village green: a flat pale rectangle of pressed grass where the castle stood, the ring of tall oak trees, and far above the treeline, small against blue sky and white clouds, a giant red-and-yellow inflatable bouncy castle with puffy turrets in mid-air. Bright summer village green light, high sun. 24mm, clean natural grade, no text, no logos.
```

### 11b — Over the trees, singing

**Start still**
```
Photoreal cinematic close-up, 16:9. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Head and shoulders, high in the air above the tops of oak trees, standing on the red-and-yellow floor of the flying castle, one hand on a vintage chrome microphone on a stand at her mouth, the other hand loose at her side, holding on to nothing. Lips just parted on a word, no expression, eyes level to the front, never looking down. Every strand of long dark hair exactly in place, black lace unruffled by the wind. Behind her, the edge of a red puffy turret and a bare flagpole, then blue sky and the green tops of trees far below. Bright summer village green light, high afternoon sun, small white clouds. 85mm, shallow depth of field, clean natural grade, crisp lace and lipstick detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Continuous take, the camera flies with her. The castle rises and falls on every beat and Rubella rides it standing, holding nothing but the microphone, singing in small flat dry mouth shapes, no belting, no expression, eyes front. The treetops drop away below. Her hair and lace do not move. Photoreal, summer daylight.
```

**Last still:** same as start, treetops further below.

---

## 12 — Final Chorus: Over the Land (2:01–2:12)

**Job:** drone shot (shot seed 4). The castle bounces across the countryside, over a river, a barn
and a field of cows. Every cow looks up together. "Up goes the castle / Over the land." The band
plays on, small in the middle of frame.
**Clip:** 15 s trim 10 s. Take the remaining 1 s from the tail of 11b or the head of 13a.
**Mouths:** not readable at this size; closed.

**Start still**
```
Photoreal cinematic aerial drone shot, 16:9. A giant red-and-yellow inflatable bouncy castle with puffy turrets and bare flagpoles in mid-air above green English fields, a winding river and a red barn below it, a herd of black-and-white cows grazing in a field. On the castle floor, small in the middle of frame, two tiny figures in black lace: Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a microphone stand. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. She is playing. Tiny storybook court figures around them. Hedgerows, a lane, patchwork fields to the horizon. Bright summer village green light carried over the countryside, high afternoon sun, small white clouds and their shadows on the fields. High drone angle, wide lens, clean natural grade, crisp hedgerow detail, no text, no logos.
```

**Motion**
```
Smooth drone follow, continuous take. The castle arcs down, touches a field near the cows with a soft squash, and bounces up again over the river and the barn. Every cow turns its head up at exactly the same time to watch it go. The tiny figures on the castle keep playing, upright, in place. Photoreal, summer daylight.
```

**Last still**
```
Photoreal cinematic aerial drone shot, 16:9. A giant red-and-yellow inflatable bouncy castle with puffy turrets rising away over green English fields, past a red barn and a winding river; below it a herd of black-and-white cows all with heads tipped up at the same angle, watching. Bright summer village green light, high sun, cloud shadows on the fields. Wide lens, clean natural grade, no text, no logos.
```

---

## 13 — Outro: A Castle That Bounced (2:12–2:23)

**Job:** the castle lands back on the same green and deflates slowly. The band sinks gently into
the vinyl, still in position. Rubella sings "A castle that bounced." **End reaction, spent once:**
she brushes a fold of vinyl off her lace with two fingers, downward. The last piano stab is cut
dead; hold black 0.5 s after it.
**Clips:** 13a 15 s trim 8 s · 13b 6 s trim 2.5 s (cut on the last stab, then black).
**Mouths:** Rubella on for the outro hook (13a), flat, past tense, no emphasis. Lillith closed.
**Not Ring War 15:** red-and-yellow outdoors, turrets folding over, no push to Lillith's eyes, no
tail, no pink. The end belongs to the brush.

### 13a — Landing and deflate

**Start still**
```
Photoreal cinematic wide shot, 16:9, the same view of the village green as the intro. A giant red-and-yellow inflatable bouncy castle with puffy turrets and bare flagpoles, just landed back on its pale rectangle of pressed grass on a bright English village green, walls still full. On its floor, in their starting positions: Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips just parted; Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar with the gold crown on the headstock, small cream guitar amp at her heel; the king, queen, knight, jester and pantomime horse in socks around them, mildly put out. The ring of oak trees, the far flint church tower. Bright summer village green light, late afternoon sun lower and warmer, long soft shadows on the grass. Locked-off wide at eye level, 35mm, clean natural grade, crisp vinyl and lace detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Locked-off wide, continuous take, nobody bounces. The castle slowly deflates: the turrets fold over one by one like sleepy ears, the bare flagpoles tip, the walls sag and the floor sinks. Rubella and Lillith sink gently down with it, still standing in exactly their positions, mic at Rubella's mouth as she sings one slow flat line, Lillith's hands still on the guitar, until they are standing ankle-deep in soft red-and-yellow folds of vinyl on the grass. The court sits down in the folds. No one reacts. Photoreal, warm late summer light.
```

**Last still**
```
Photoreal cinematic wide shot, 16:9, same locked-off view. A flat, crumpled red-and-yellow inflatable castle lying on a bright English village green, its turrets folded over, flagpoles tipped. Standing upright in the soft folds of vinyl, in exactly their starting positions: Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. She stands at a vintage chrome microphone on a stand, lips closed, one fold of red vinyl lying against the lace at her hip; Lillith: glamorous woman in black lace, flawless never-smudged mascara, electric guitar, calm closed mouth. Her gloss-black guitar with the gold crown on the headstock. The court sitting in the vinyl around them. Oak trees, warm late summer light, long shadows. 35mm, clean natural grade, no text, no logos.
```

### 13b — The brush (end reaction, spent once)

**Start still**
```
Photoreal cinematic close shot, 16:9, waist height. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Framed from shoulder to hip, a soft fold of red inflatable vinyl lying against the black lace at her hip, her right hand coming down toward it, index and middle finger together and extended. Her other hand on the vintage chrome microphone on a stand. Her chin and the edge of her flat face at the top of frame, eyes front, not looking down. Crumpled red-and-yellow vinyl around her, green grass beyond. Bright summer village green light, late afternoon sun, warm and low. 50mm, shallow depth of field, clean natural grade, crisp lace detail, no text, no logos.
```

**Motion**
```
Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Locked-off, continuous take. With two fingers, Rubella brushes the fold of vinyl off her lace once, a single short downward stroke, and the vinyl slides away. Her hand returns to her side. Nothing above her waist moves; she does not look down. Then stillness. Photoreal, warm late summer light.
```

**Last still**
```
Photoreal cinematic close shot, 16:9, waist height. Rubella: glamorous exhausted woman, long dark hair, blood-red lipstick, modern black lace evening dress, flat unbothered face. Framed from shoulder to hip, the black lace at her hip clean and unruffled, her right hand resting at her side, the other on the vintage chrome microphone on a stand, eyes front. Crumpled red-and-yellow vinyl around her, green grass beyond. Late afternoon summer light. 50mm, clean natural grade, no text, no logos.
```

Cut dead on the last piano stab. Black, 0.5 s. End.

---

*Weeks on Fire · Bounce Castle · Lace Waterfall · drawer, `promote?: no`. Farm #22 (picture), #18/#33 (song). Never #42.*
