---
id: silent-night
title: Silent Night
genre: Parlor-hymn lilt, electric-blower reed organ and nylon guitar, one low voice (public-domain carol)
description: "The traditional carol, sung straight from the next room, gets clearer every time Lillith puts a Christmas stocking on a noisy thing. The last stocking falls over the whole building, the song stops on that frame, and Rubella finishes her tea."
episode: Drawer / Christmas set (not promoted)
tags: [drawer, christmas, carol, public-domain, lilt, video-first, rubella, lillith, silly, building]
instrumental: false
audioFile: null
---
# Silent Night — drawer sketch (video: *Hung with Care*)

**Drawer.** `promote?: no`. Not in `songs/` proper, not codegen'd, no `songId` bound. The
folder README is the owner's. Farm: [#18](https://github.com/ford442/weeks_on_fire/issues/18) /
[#33](https://github.com/ford442/weeks_on_fire/issues/33). Not #42.

| field | value |
|---|---|
| lane | video-first Christmas carol, public-domain text |
| video | **Hung with Care** (the ladies' building unit, Christmas Eve night) |
| bpm / key / length | 60 (dotted-quarter pulse, 6/8) / B♭ major / 0:40 sung, then 8 s of picture alone = 0:48 |
| who sings | one low woman's voice, off-picture, the score's own; nobody on screen ever opens a mouth |
| neighbor it must not replace | `songs/Mysterium.md` (the show's Christmas song) · `songs/Just_a_Sunday.md` (silence by hard cut) |
| one-line job | The carol gets clearer every time a noise gets a stocking. |
| start JOB → last JOB | first radiator clank → the empty mug tips |
| world | ladies' building unit, living room and kitchen corner, night. Not Christina's house (see NOTES). |

## The video first (`docs/song-method.md`)

**Hung with Care.** Christmas Eve. The unit is loud: a radiator that clanks like a dropped
toolbox, a wall clock that hammers, a tap that plonks, a fridge that groans and walks. Rubella
sits in the armchair with her tea and her book. Lillith comes in with a basket of red knitted
Christmas stockings and puts one on each noisy thing, small to big: the clock, the tap, the
radiator, the fridge. Each one goes quiet. The carol, sung from the next room at the same
level the whole time, gets clearer with every stocking. Then Lillith opens the curtain, pulls a
red clothesline, and a stocking as tall as the building falls down over the window. The street goes quiet
too. Rubella drinks her tea to the bottom, and the one noise left in the world is her swallow.

Card (`ideas/funny-rules.md` shape):
- **id:** `hung-with-care` · **world:** the ladies' building unit at night; one room, one window onto the snowy street · **length:** 48.0s, does not loop
- **laugh:** *She put Christmas socks on all the noisy things, even the building.* (second laugh, for the mix: *the more socks she put on, the louder the singing got.*)
- **drop:** **falls.** At 40.0s the giant stocking falls over the building past the window and the song stops on that frame.
- **end reaction:** Rubella, once, in the last two seconds: she tips the empty mug at Lillith's last tiny stocking and looks at her over the rim. Spent here, once.
- **do-not:** no text on screen, no readable clock face; no nativity imagery (no manger, baby, star, halo, cross or sacred candle) and the picture never reacts to a word of the carol; no bells of any kind (that is *Silver Bells* and *Sleigh Ride* territory); no speech, humming, sigh or whisper from either woman; nobody looks at camera or comments on the frame; no Pizza Guy, no Madelyn memo, no EyeWash set, no cat, no extinguisher; nobody names the stockings, the hush or the building; nothing is haunted and nobody says "unscheduled".
- **promote?:** no.

### Video use map (`docs/song-method.md`, item 1)
- **Target length:** 48.0s = 24 bars of 6/8 at 60 BPM counted in two dotted-quarter pulses (bar 2.0s, pulse 1.0s). The sung song is 40.0s (bars 1-20); bars 21-24 are picture alone.
- **Pattern:** a continuous quiet bed at one fixed level, one sung line to every four bars (0.0, 8.0, 16.0, 24.0, 32.0), each line sitting on one stage of the picture: line 1 the clock, line 2 the tap, line 3 the radiator, line 4 the fridge, line 5 the window. The picture sound is loud at first and leaves one stage at a time, so the carol is a murmur under the racket in line 1 and the clearest thing in the room by line 4. The song never gets louder; the room gets quieter.
- **Breaks:** one. A hard stop at 40.0 (the downbeat of bar 21), on the frame the white fur cuff of the giant stocking first shows at the top of the window. No fade, no tail, no ring-out. The sixth line of the verse (the second "Sleep in heavenly peace") is not sung; the picture takes its four bars. **Silence is built by the cut, not by Minimax:** the model will not stop on an exact second, so generate a take that runs past 0:40, cut it at 40.0, and take the organ hum with it.
- **Mouths:** OFF for all 48.0s. Rubella and Lillith are closed-mouth in every frame: no lip-sync, no hum, no sigh, no whisper. Lillith's half-smile is closed-lip. Rubella's swallow at 44.7 is a drink, not a voice.
- **Whose voice, and why that is allowed:** the score's own, unnamed. It is mixed dark and dry, as if from the next room, so nobody on screen answers it; it describes no one and never says stocking, noise, quiet, cold or house. It is not Rubella, not Lillith, not a neighbor and not the Continuity Voice. Whether the room hears it stays open.

### Diegetic sound from the picture (`docs/song-method.md`, item 2)
Picture sounds are laid by hand on contact frames (mute the render's own audio). Minimax makes the song only. None of these is on the bar grid: the room does not keep time with the carol.

| Sound | Loud state | Leaves | Through the picture, or scored? |
|---|---|---|---|
| Wall clock | TOCK once a second, hammer on anvil, +12 dB over the carol | stocking contact 6.0; one soft "tup" at 6.5 and 7.5; gone at 8.0 | Picture. The pendulum keeps swinging inside the wool, silent, to the end. |
| Tap | PLONK like a stone in a bucket, uneven, about every 2.8s | contact 12.0; one "pf" at 13.2; gone at 13.6 | Picture. A drop still forms and falls inside the wool, silent. |
| Radiator | CLANK like a dropped toolbox, rattle and hiss, uneven 2-3.5s | sleeve goes on 16.5-19.0; "bff" at 18.0; gone at 19.2 | Picture. It keeps shuddering under the red sleeve, silent. |
| Fridge | rising groan for 2.5s, then a THUMP as it walks an inch, about every 5s | contact 27.0; muffled "fumf" at 28.8; gone at 29.2 | Picture. |
| Street through the glass | siren, bus rumble, plough scrape; first audible at 30.0, because the room had been hiding it | cut off as the cuff crosses the glass, 40.4 | Picture. |
| Wool pulls | one dry "fff" per stocking, one longer for the radiator sleeve and the fridge | n/a | Picture, laid on contact. |
| Clothesline at the window | a plain red clothesline drawn through her hands and over the sill, a dry rope rasp, 33.0-39.8 | n/a | Picture. |
| Rubella's page | one paper turn, 35.0 | n/a | Picture. |
| The giant knit falling | a heavy soft "fffoomp" 40.2-43.0, one wool bounce at 43.1 | n/a | Picture. The only loud thing after the cut, and it is soft. |
| The swallow | one dry close gulp, +6 dB, 44.7 | n/a | Picture. The only hard sound in the last eight seconds. |

Sung instead of sounded: nothing. The carol never copies a picture sound. Speech: none. The mix rule is the whole gag: **one fader for the voice and organ from 0.0 to 40.0, never moved.** If it sounds like the singer got louder, the picture sound was moved by hand, not the voice.

STYLE:

Parlor-hymn lilt for a front room late at night, 60 BPM locked (two dotted-quarter pulses to the bar, no drift, no rubato, no ritardando), 6/8, B-flat major, exactly twenty bars and 0:40 long (2.0 seconds a bar), a hard stop at 0:40.0 with no tail and no fade. Instruments only: one electric-blower reed organ, a home harmonium with a small motor, holding soft sustained chords; one nylon-string guitar fingerpicked in a slow rocking 6/8, bass note then chord then chord, twice to the bar. No drums, no percussion, no bells, no chimes, no strings, no pad, no choir, no synth and no sound effects. One plain low woman's voice, an alto, close-miked but heard as if sung in the next room: dark top end, rolled-off highs, dry, no reverb tail, no vibrato, no belt, no ornaments, no ad-libs, no backing voices, no smile in the voice, nearly spoken, sung completely straight as a night-time lullaby for a house. The voice enters on beat one of bar 1, no intro, and sings five lines, one line to every four bars, entering on bars 1, 5, 9, 13 and 17. Every syllable is long and the last note of each line is held to its bar line. Volume is fixed and quiet from the first note to the last: no swell, no crescendo, no lift on the last line. **Structural flaw:** the organ's electric blower hums at 60 cycles, steady, from bar 1 to the cut, and 60 Hz is a quarter-tone above B-flat, so the hum and the key disagree for the whole track and beat slowly against the organ. Do not tune the organ to the hum, do not filter it, fade it or duck it, and do not add a note to cover it. Mood: a lit front room, a late hour, nothing wrong. Small dry room, close mics, tape-warm, dark top end, low dynamic range, mixed to sit under picture. Original arrangement of the traditional text. Professionally neutral, never wink.


LYRICS:

[Verse]
Silent night, holy night
All is calm, all is bright
Round yon Virgin, Mother and Child
Holy Infant, so tender and mild

[Outro]
Sleep in heavenly peace


NOTES:

### What the song is
A hymn for a front room, sung from the next room, in a house where somebody is putting
socks on the furniture. The carol is the only thing in the piece that never changes: same
level, same pace, same voice, five lines. Everything else gets quieter around it until it is
the only thing left, and then it stops, and the picture finishes the verse by itself. The
last line of the carol is not sung. The silence is the last line.

The song never mentions a stocking, a noise, a clock, a fridge or a house, and nobody in the
picture answers it. The carol is sung with complete respect; the stockings are the secular
part and the picture never touches the words.

### Public-domain text, not original lyrics
This is the traditional English text, verse 1 only, from the 1859 translation of Joseph
Mohr's 1816 text (tune by Franz Xaver Gruber, 1818). Public domain. It is sung as printed in
that translation: no modern arrangement's or recording's changes, no added words, no
repeats. The second "Sleep in heavenly peace" is deliberately not sung (picture takes it).
Minimax writes its own tune for the text; if it lands on the 1818 tune that is fine, also
public domain. No parenthetical marks anywhere in the lyric block.

### The video: *Hung with Care* (clip plan)
Photoreal live action, 16:9, locked-off wide from the back of the room at chest height, warm
amber lamplight, snow falling in the black window. Rubella and Lillith are the calmest
things in frame; the radiator, clock, tap, fridge and street are the loud world.

Character anchors. There is no bible **Appearance** sheet for the building pair (see Open
questions), so these are the established anchor lines pasted verbatim from
`ideas/ten-joke-scenes.md` and `ideas/literal-idioms-drawer.md`:
- **Rubella** = a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress.
- **Lillith** = a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile.

**Start still (copy-ready, Grok Imagine image prompt):**
Photoreal cinematic live-action still, 16:9, a lived-in apartment living room with a kitchen corner at night on Christmas Eve, warm amber lamplight from a floor lamp at the left, a string of small warm fairy lights along the top of a tall window at the back with soft snow falling in the black glass behind a half-drawn curtain, the end of a length of plain red clothesline hanging down beside the curtain from a small gap at the top of the window frame, a very small bare artificial tree with a few red ornaments on a sideboard. Locked-off wide shot from the back of the room at chest height, 35mm lens, f/4, everything sharp, fine grain. Left-centre in a worn green velvet armchair with her legs crossed, a hardback book open on her knee with a blank cover and a plain white mug three-quarters full of tea on the chair arm: Rubella, a glamorous, exhausted woman with long dark hair and blood-red lipstick in a modern black lace evening dress, mouth closed, face flat and unbothered. On the back wall above her a round wooden wall clock with plain marks and no numerals and a long brass pendulum caught mid-swing. Below the window a long cast-iron radiator with blistered cream paint, a wisp of steam at its valve, caught mid-shudder. In the kitchen corner at right a deep white sink with a chrome tap and one drop hanging from the spout, and beside it a tall old cream refrigerator with rounded corners, tilted a hair on a worn lino floor as if it has just moved. On the arm of a velvet couch at the right, one huge rolled-up red knitted Christmas stocking bundle the size of a duvet with a white fur cuff showing at one end. In the kitchen archway at right, stepping in carrying a wicker laundry basket full of red knitted Christmas stockings with white fur cuffs in three sizes, two small and one as long as a sleeve: Lillith, a glamorous woman in black lace with flawless, never-smudged mascara and a bright, conspiratorial half-smile, mouth closed, nothing in her hair and nothing over her shoulder. The room looks loud and both women look completely calm. No text anywhere, no numerals, no readable labels, no other people, no animals. Grok Imagine style.

**Clip plan: five chained clips, 48.0s, plus two optional cut-ins.** Chain by last frame: the
exact last frame of clip N is the start still of clip N+1. Retime a clip by at most 8% to
put a contact on its time (slowing is the safe direction), otherwise reroll. The music never
moves; **40.0 is the only hard sync.** Every other time is a target with a tolerance of
plus or minus 0.5s.

| # | Clip | Timeline | Trims to | Starts from | What happens |
|---|---|---|---|---|---|
| 1 | 10s | 0.0-10.0 | 10.0 | the start still above | Loud room. Lillith enters 1.5, stocking onto the clock at **6.0**, steps back and watches it. |
| 2 | 10s | 10.0-20.0 | 10.0 | exact last frame of clip 1 | Tap stocking at **12.0**. Radiator sleeve on at 16.5-19.0. She turns to the couch. |
| 3 | 10s | 20.0-30.0 | 10.0 | exact last frame of clip 2 | She carries the giant roll past Rubella (feet up, one two-finger brush at 24.0). Over the fridge at **27.0**, down by 29.0. One pat. |
| 4 | 10s | 30.0-40.0 | 10.0 | exact last frame of clip 3 | Hush. Curtain open at 32.0. She takes the red clothesline end hanging at the top of the window and draws it taut. Page turn 35.0. She pulls once at 39.0-39.6. **First inch of white cuff at the top of the glass between 39.7 and 40.3.** |
| 5 | 10s | 40.0-48.0 | **8.0** (cut the last 2s) | exact last frame of clip 4 | **The drop, 40.0.** The giant stocking falls down the glass by 43.0, one bounce. Rubella lifts the mug 44.0, empties it, gulp 44.7. Lillith offers the tiny stocking 46.0. Rubella tips the empty mug 46.5 and looks at her. Cut at 48.0. |
| I-A | 6s, optional | replaces 5.6-7.6 | 2.0 | its own still (below) | Macro on the clock: the stocking slides over it, the pendulum swings on inside the wool. |
| I-B | 6s, optional | replaces 44.4-46.4 | 2.0 | its own still (below) | Low close-up on the mug: it tips to empty; a black-lace hand with a tiny stocking enters at the edge. |

Cut-ins replace picture, they do not add to it: the total stays 48.0s.

**Clip 1 motion (10s, copy-ready).** Continuous locked-off wide shot, no camera movement, 10 seconds. The room is violently noisy: from 0 to 10 seconds the radiator shudders and rattles, the pendulum of the wall clock swings hard, the tap drips heavily and the refrigerator trembles and slides a few millimetres across the lino at about 3 and 8 seconds. Rubella never reacts: she keeps reading, mouth closed, face flat. From 1.5 seconds Lillith walks in unhurried from the kitchen archway and sets the basket on the couch at 3.5. From 3.5 to 5.5 she takes out the smaller red knitted stocking and walks to the wall clock. At 6.0 seconds she slides the stocking down over the whole clock like a hat, so it is a red knitted lump with a white fur cuff and the pendulum keeps swinging inside it as a moving bulge. From 7.0 to 10.0 she lowers her arm, steps back one pace and watches it with a calm closed-mouth half-smile, as if it went to plan. Nobody speaks, hums or sighs and nobody looks at the camera.

**Clip 2 motion (10s).** Same shot, 10 seconds. The radiator and fridge still shudder; the clock lump swings quietly. From 0 to 2 seconds Lillith takes the second small stocking from the basket and walks to the sink. At 2.0 seconds she slides it over the tap's spout; the drop still forms and falls inside the wool. From 3.6 to 6.5 she goes back to the basket and takes out the long stocking. At 6.5 seconds she slides its mouth over one end of the radiator and, from 6.5 to 9.0, pulls it along the whole length like a sleeve, so the radiator is a long red knitted tube, still shuddering. At 9.0 she straightens and turns toward the huge bundle on the couch. Rubella turns no page and does not look up.

**Clip 3 motion (10s).** Same shot, 10 seconds. The fridge groans and shudders hard, sliding an inch at 2.5 seconds. From 0.5 seconds Lillith lifts the huge rolled stocking off the couch in both arms like a rolled carpet and carries it across the room in front of Rubella's chair. At 3.5 seconds Rubella lifts her feet a few inches without lifting her eyes from the page and sets them down again; at 4.0 seconds the roll brushes her sleeve and she brushes it off once, downward, with two fingers. At 7.0 seconds Lillith hoists the cuff end up over the top of the refrigerator and, from 7.0 to 9.0, unrolls the wool down over it to the floor on all sides until the fridge is a red knitted boot-shaped monolith with a white fur cuff, still trembling. At 9.5 she pats it once and dusts her hands once.

**Clip 4 motion (10s).** Same shot, 10 seconds. The room is still; the radiator, clock and fridge lumps move a little inside the wool. At 2.0 seconds Lillith crosses to the window and pulls the curtain fully open on a snowy street at night with a bus passing and a distant blue-red glow. From 3.0 to 6.5 she takes the end of the plain red clothesline hanging beside the curtain from a small gap at the top of the window frame and draws the slack through her hands until the line goes taut upward. At 5.0 seconds Rubella turns a page. From 7.0 to 9.0 Lillith holds the clothesline end in both hands, looks up once, and waits. From 9.0 to 9.6 she pulls it once, gently, hand over hand, and the line goes slack and begins to slide up out of the gap. In the last 0.3 seconds the first inch of a white fur cuff appears at the top edge of the window glass. Mouths closed, nobody looks at the camera.

**Clip 5 motion (10s, trim to 8).** Same shot, 10 seconds. From 0.0 the slack clothesline whips up out of frame and a vast red knitted stocking, as tall as the building, falls down the outside of the window like a theatre curtain, its white fur cuff leading and the red wool following, covering the street, the bus and the glow until the whole window is a wall of red knit with the weave visible, reaching the sill at 3.0 seconds and bouncing once. Snow dusts the top edge. The room fills with a warm red light through the stitches. From 3.0 Lillith lowers her hands and stands watching the window with her closed-mouth half-smile, as if it went to plan. At 4.0 seconds Rubella lifts the white mug and, from 4.4 to 5.2, drinks it empty in one long swallow. At 5.2 Lillith turns her head, takes one tiny red knitted stocking out of her pocket and holds it out toward the mug at 6.0. At 6.5 seconds Rubella lowers the mug and tips it toward Lillith to show it is empty, and looks at her over the rim, face flat. Hold to 8.0. Nobody speaks or hums; nobody looks at the camera.

**I-A start still (optional).** Photoreal macro still, 85mm, f/2.8: the round wooden wall clock with plain marks and no numerals, a long brass pendulum mid-swing, and in front of it a hand in a black lace cuff holding a small red knitted Christmas stocking with a white fur cuff an inch from the clock face. Warm lamplight, shallow depth, no text. Motion: at 1.0s she slides the stocking over the clock; the pendulum swings on as a bulge in the wool; the hand withdraws.

**I-B start still (optional).** Photoreal low close-up at arm height: a pale hand with blood-red nails holding a plain white mug three-quarters full of tea on the arm of a green velvet chair; behind it, out of focus, a black-lace arm at the edge of frame holding a tiny red knitted stocking. Warm lamplight, no text, no label on the mug. Motion: the mug lifts and tips until empty; the black-lace hand with the stocking moves toward it; the mug tilts toward the lens to show the bottom is empty.

**Reroll rules.** A mouth opens, hums or shows teeth on either woman; either woman looks at the camera; Rubella reacts above the waist other than the single two-finger brush; Lillith hurries, laughs or shows a big smile; a stocking is too small to cover its object (the fridge must read as covered, the clock as a lump); the giant stocking reads as fog, a curtain or a banner and not as knitted wool with a white cuff; the cuff appears outside 39.7-40.3; text, numerals or a readable label appear; a third person, pet or Pizza Guy appears; Lillith wears safety glasses or carries a coil of wire, a tool or a tube (her kit is not spent in this file); a gift, ribbon or box is placed under the tree (it is not that kind of Christmas); the camera moves; any nativity imagery appears.

### Timed treatment

| Time | Bar | Picture | Picture sound (laid) | Music | Sung |
|---|---|---|---|---|---|
| 0.0-8.0 | 1-4 | Clip 1. Loud room. Lillith enters 1.5. Stocking onto the clock at 6.0. | Radiator, clock, tap and fridge at full. Tock stops at 6.0, tups at 6.5 and 7.5. | Organ, guitar and voice in on beat one at the fixed level. A murmur under the racket. | "Silent night, holy night" |
| 8.0-16.0 | 5-8 | Clip 2. Tap stocking at 12.0. She fetches the long stocking. | Plonk stops at 12.0; "pf" 13.2. Radiator and fridge still loud. | Same level. | "All is calm, all is bright" |
| 16.0-24.0 | 9-12 | Radiator sleeve 16.5-19.0. She turns to the couch. Clip 3 from 20.0: the giant roll comes off the couch. | Clank stops at 18.0; "bff"; gone 19.2. Fridge groans on. | Same level. A few words are clear now. | "Round yon Virgin, Mother and Child" |
| 24.0-32.0 | 13-16 | Past Rubella (brush 24.0). Over the fridge at 27.0, down by 29.0. One pat. | Fridge "fumf" 28.8; gone 29.2. The room is silent from 29.2. | Same level, and now the loudest thing in the room. | "Holy Infant, so tender and mild" |
| 32.0-40.0 | 17-20 | Clip 4. Curtain open at 32.0. Clothesline taut. Page turn 35.0. Pull at 39.0. | Street leaks in from 30.0: siren, bus, plough. Rope rasp. One page. | Same level. The last held note, "peace", ends exactly on the bar line. | "Sleep in heavenly peace" |
| 40.0 | 21 | **The drop.** First inch of the white fur cuff at the top of the glass. | Street cut off at 40.4. | **Hard stop on 40.0.** Voice, organ, guitar and hum all dead on the same frame. | |
| 40.0-43.0 | 21-22 | Clip 5. The giant stocking falls down the window. | Heavy soft "fffoomp"; bounce at 43.1. | Nothing. | |
| 43.0-44.0 | 22 | Red light through the stitches. Lillith watches. | Nothing. | Nothing. | |
| 44.0-45.2 | 23 | Rubella lifts the mug and drinks it empty. | The gulp, 44.7. | Nothing. | |
| 45.2-46.5 | 23-24 | Lillith takes out the tiny stocking and holds it toward the mug. | Wool, almost nothing. | Nothing. | |
| 46.5-48.0 | 24 | Rubella tips the empty mug and looks at her. Cut. | Nothing. | Nothing. | |

If a render lands a contact elsewhere, retime the clip (at most 8%) or reroll; do not move the music.

### Minimax generation (`docs/song-method.md`, item 3)
- **Genre:** a parlor hymn. The picture is a small domestic job done with a straight face, so the song is the plainest, most careful thing it can be: a home harmonium, a nylon guitar rocking in 6/8, and one low voice that sounds as if she is singing the house to sleep from down the hall. Slow 6/8 lilt, 60 BPM, no drums, no bells.
- **Locked:** 60 BPM, 6/8, B-flat major, five lines on bars 1, 5, 9, 13 and 17, hard stop at 40.0. Instruments: electric-blower reed organ, nylon guitar. One alto. Traditional text, original arrangement, official section tags, no parentheses.
- **Expect to fix in the edit.** Minimax will not reliably put five lines on those bar lines, hold the last note to the bar, or stop dead. Make several takes and keep the one whose line 1 and line 5 are cleanest. Cut the voice into lines and set each on its bar line; hard-cut organ, guitar and voice together at 40.0 and kill any tail. If the hum is missing or in tune, build it: a 60.0 Hz sine (or a recorded transformer hum) at about -32 dB under the organ stem from 0.0 to 40.0, cut with the music. The edit decides the seconds; the prompt only asks for them.

### The structural flaw (held, never fixed)
**The organ's blower hum is a quarter-tone out of the key.** The carol is in B-flat. The mains
hum is 60 Hz, which is about 51 cents above B-flat1 (58.27 Hz), so it beats against the organ
about 1.7 times a second for the whole track. It is not a pedal tone the arranger chose; it
is the instrument's motor. It is never tuned to, never filtered, never ducked, and nothing is
added to cover it. The last thing before the cut is still the hum, under a held note. It
is a different kind of fault from the earlier ones: not a count (`Box_Box_Hat`), not a
missing pitch (`Just_a_Sunday`, the dead tine), not an empty slot (`Pans_Down`), not a late
entry (`Eleven_Stops_Since_Thursday`). It is a machine in the room that disagrees with the
song, and the picture is a room full of machines.

### Callbacks spent (`notes/callback-bank.md`, all as references, none as a set)
- **Lillith's speaker wire, safety glasses, soldering iron, the 6BQ5: deliberately NOT spent here.** The owner spent Lillith's kit once for the whole Christmas set, in `Sleigh_Ride.md` (the marmot harness). The giant stocking's cord is a plain red clothesline hanging at the window; no coil of wire, no safety glasses on or off her head, no soldering iron, no 6BQ5, in any frame or any prompt. The hum is the organ's motor, not her repair.
- **World's Okayest Tenant mug (the scene's clock).** Spent: three-quarters full at 0.0, drunk empty by 45.2 and shown empty at 46.5, and empty means the scene ends now. Locks kept: the mug's own text is never legible in any frame; Madelyn's "World's Best Supervisor" mug is a different mug and is not here; no detergent, and no extinguisher (spent on this branch).
- **Rubella & Lillith (the building pair), reaction rules.** Spent: Rubella brushes an impact once, downward, two fingers (24.0), and never flinches above the waist; Lillith does not turn around for anything; neither laughs. Lock kept: no third voice in their two-hander, no Rubella lecture.
- **The building (6-C is Lillith's; hallways rearrange; Madelyn never seen).** Spent: the unit, unnumbered on screen, and a building that wears a stocking. Locks kept: nobody ever establishes the building as safe or unsafe; no Madelyn memo, no intercom.
- **Worlds do not mix (the lane rule).** One unit, one window. No Christina, no cliff, no laundromat, no Big City.
- **Not spent:** Nothing happening, extremely well (spent on this branch; the ending here is picture action, not a written hold), Juxtaposition (the wrong channel), the ping-pong table, the 24-hour laundromat thump, the extinguisher, EyeWash's corner CRT (a stocked CRT would give the station a motive), "Indoor weather" (spent in `Pans_Down` and the snow globe card), Rubella's pseudoscience correction (never touched).
- **Character locks checked.** Lillith hears a building like a mechanic hears an engine and her improvements start with a noise nobody else noticed: that is the whole project. She does it for the installation, not for Rubella; it is not a gift that works, and Rubella refuses the last stocking, so the "somebody does something for her and it works" break is not spent. No one is told no. Rubella is dry, raspy and rationed: she has no spoken line.

### Why it is not the neighbors
- **Not Mysterium** (`songs/Mysterium.md`). That is the show's Christmas song: 128 BPM bubblegum Italo-pop, a choir, a key lift. This is one voice and a harmonium at 60 BPM with no lift and no key change.
- **Not Just a Sunday** (`songs/Just_a_Sunday.md`). That one drops the song and the picture sound to silence for ten seconds in the middle of 20 and then the lullaby returns word for word. Here nothing returns: the picture sound leaves gradually, one object at a time, under a fixed-level song; the song stops once, at the end, and the last line is replaced by the picture. Its flaw is a missing note; this one is a hum.
- **Not Box, Box, Hat, Pans Down, Thank You for the Lava or Eleven Stops.** None of them has a picture whose sound is taken away; none counts, kits, growls or modulates; and none of their flaws is a pitch disagreement between a machine and the key.
- **Not `ideas/snow-globe-field-report.md`.** Same two women, snow and a wintry shelf, but a snow globe, a weather lecture and the Black Cat. This has no lecture, no globe, no cat and no weather report.
- **Not the library hush snapback** (`ideas/snapback-montages.md` #2). There a shush is a music hit and the room transforms; here no gesture is a hit, nothing transforms, the sound is taken away, and the only change of scale is the last one.
- **Not `content/cutaways/no-other-human-sounds.json`.** That owns wind-only silence at the cliff. This is a loud room made quiet by objects, in the building.
- **Not Nine Percent Battery or the neutral-zone laundry bed.** No smoke detector chirp, no laundry room, no intercom chime. The hum here is the organ's, not the building's.
- **Not `content/cartoons/octopus-mittens.json`.** There garments go on a cartoon animal; here a photoreal room gets them, to take sound away.
- **Not `Quiet_on_the_Landing`** (`songs/_drawer/accordion-pop/`). Both use a reed organ; that is a bright pop song with an intercom a bar late on a landing. This is a hymn at 60 BPM with no intercom, no landing and no lateness.

### Five questions (`ideas/funny-rules.md`)
1. A 9-year-old can say the laugh back: "She put Christmas socks on all the noisy things, even the building!" Yes.
2. Mute the music: the stockings still go on one by one, the giant one still falls down the window, and the empty mug still tips. Yes.
3. The calmest thing in frame is Rubella, then Lillith: the radiator, clock, tap, fridge, street and the falling wool all move, and neither woman's face does. Yes.
4. Cover every word on screen: there are none. Yes.
5. One world: the ladies' unit and its own window. Yes.

### Sonic rules checked
Nobody acts: no belting, no vibrato, no winking; emotion arrives through the room getting quieter. One structural flaw, held and never fixed: the quarter-tone hum. Top end dark, space real (the voice from the next room, a small dry front room, a motor under the organ). Carol sung straight, public-domain text, no modern wording, no real artists, no copyrighted lyrics.

## Other videos this song could sit on

All three use the same 0:40 take and the same bar-21 cut. Different location, cast and engine from the main pick.

### 1. *The Ledge Choir* (a granite shelf above five thousand feet, Riley)
- **Picture:** Christmas Eve at blue dusk, snow, flat grey-blue light. Riley sits on her belted pack on an unnamed granite shelf high on the ridge, with her field book and a tin cup of instant coffee, one pencil. No table, no sign, no rail. Across a narrow cleft the far granite wall steps down in ledges, and mountain goats stand on them in tiers like a choir on risers, facing her, mouths shut. One tier fills on each sung line (bars 1, 5, 9, 13, 17), and for every goat she makes one pencil tick on the page.
- **Drop (multiplies, 40.0):** the carol stops and a sixth, top tier, which was empty, fills all at once: nineteen goats in all, every mouth shut. In the silence the smallest kid steps out from behind a rock and says *baa*, once. Riley adds one more tick and writes **twenty** under it without looking up. She was right when she counted nineteen.
- **Laugh:** *A whole choir of goats stands on a cliff and none of them says baa, except the little one.*
- **Engine and cast:** animals doing human jobs plus a number she gets right. Riley alone (look per `characters/riley-smith.md`, Look), above five thousand feet; no tower in frame, no lamp pulse, no lions, no "Around", no retrieval; she does not start the song. The page is never readable: what shows is the extra tick.
- **Cliff-lane check (run by the coordinator at the owner's request):** checked against `content/cutaways/no-other-human-sounds.json`, `notes/scenes/no-other-human-sounds.md` and the Kestrel Ridge / Forest Road 4N22 / Pulpit Overlook block of the callback bank. There is no lock against goats or other animals at the ridge (the only animal rule is mountain lions at six-forty, seasonal; the no-birds and no-jay lines cover the woods and the eight-second stop). This is **not the Pulpit Overlook plate**: an unnamed shelf, no bolted 1962 picnic table, no 400-ft-drop hero composition, no golden-hour frame, and not the wind-only Beat H. Verdict: clear.
- **Five questions:** a 9-year-old can say it back (the laugh above) · on mute, five tiers and then the whole cliff still fill with goats and the extra tick still shows · Riley and the goats are the calmest things in frame · cover every word and nothing is lost, because the page is never readable · one world, one shelf.

### 2. *Night Shift* (the coffee house, Madelin)
- **Picture:** A coffee house at closing time on Christmas Eve, fairy lights in the window, snow outside, empty tables, dark rafters. Three small owls in green aprons run the counter and bring Madelin's cup on silent wings. Madelin sits with the tote on her shoulder, grinning. Every time she shifts the tote the floorboards creak and one owl turns its head to look: 90 degrees at bar 5, 180 at bar 13, then all the way round at bar 17.
- **Drop (appears, 40.0):** the carol stops, and the dark rafters blink open: dozens of owls, every head already turned toward her. She shifts the bag. One last creak.
- **Laugh:** *She moved her bag and the floor creaked, and the whole ceiling was owls.*
- **Engine and cast:** a rule of three with a wrong third, plus a silence broken by one tiny thing. Madelin only (MADELIN, not Madelyn): tote never on the ground, never opened, zero retrievals this time, one grin, no speech. The coffee house is a late one on Clement Street, not the snake's coffee house in `home-sweet-void` and not the Barista Safehouse; the owls inform on nobody.
- **Five questions:** yes · the rafters fill with owls on mute · Madelin is cheerful but the owls and the room are calmer than she is · no words on screen · one coffee house.

## Open and not answered
- **Which house.** The brief said "the house". Christina's house is a thirty-second threshold, a separate world, and Rubella and Lillith never stay the night there (`ideas/christina-frozen-house.md`, `ideas/christina-house-company.md`). The ladies' building unit is theirs (`ideas/possible-ladies-house.md`), so this uses the unit. Not Christina's house, not 12-A.
- **No bible Appearance sheet for Rubella or Lillith.** There is none in `characters/bible/`; the anchors above are the established lines from two drawer files. Flagged, not invented.
- **Who sings, and who can hear it.** Left open on purpose.
- **Where the giant stocking came from, who hung it, and whether the building is better under it.** Left open. Nobody says "unscheduled", nobody calls it weather, nobody rules.
- **The missing sixth line.** The second "Sleep in heavenly peace" is not sung. The owner may want it back after the sip; that loses the silent end, so it is the owner's call.
- **Method gaps.** `docs/song-method.md` items 2 and 3 arrive truncated (item 2 stops after its heading line, item 3 stops mid-sentence after "what the video suggests") and any steps after 3 are missing; items 1-3 were followed as written and the missing text was not invented.

*Drawer. 2026-11-09. promote?: no.*
