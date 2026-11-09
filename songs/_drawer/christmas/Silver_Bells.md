---
id: silver-bells
title: Silver Bells
genre: Mid-1960s girl-group Christmas soul-pop, handbells, sustain pedal stuck down
description: "A whispered plan at a coffee-house window, then one spoon tap on a mug and the whole street rings its bells back. Nothing stops ringing until the band does."
episode: Drawer / Christmas pack (not promoted)
tags: [drawer, christmas, soul-pop, girl-group, handbells, coffee-house, lillith, madelin, rubella, silly, appears]
instrumental: false
audioFile: null
---
# Silver Bells (working title: Ding for the Mug) — drawer sketch

**Drawer.** `promote?: no`. Not in `songs/` proper, not codegen'd, no `songId` bound. One of four Christmas-pack
slots the owner named (Sleigh Ride, Silver Bells, Silent Night, The First Noel). The slot title is the owner's;
the lyric, melody, rhymes and hook here are original and take nothing from any existing song of that name.
Method (`docs/song-method.md`, owner lock): **video first, song built around it.** The video comes first below;
the `STYLE:` block comes after the use map and the picture's sound.

| field | value |
|---|---|
| lane | musical cutaway, Christmas pack, silly register |
| video | **Tap the Mug.** 38.4s edit from six Grok Imagine clips, plus 0.6s of ring on black |
| bpm / key / song length | 100 / G major / 0:33.6 (14 bars at 2.4s). The picture runs to 38.4; the last 4.8s are picture-only |
| who sings | Verses: an uncredited whispered lead, off picture, Lillith-compatible. Chorus: Lillith and Madelin in plain unison, mouths on in two bars only. Rubella speaks one word. |
| neighbor it must not replace | *Mysterium* (the show's Christmas song: Italo bubblegum, 128, choir, key lift) · *Home Sweet Void* (the snake's coffee house) · *My Coffee Is So Strong It Walked Away* (`ideas/silly-songs-drawer.md` #6) |
| one-line job | One spoon on one mug, and the whole street answers. |
| start JOB → last JOB | the spoon is hidden under the counter → the spoon lifts again |
| world | one plain Earth coffee house on a snowy Christmas Eve, and the street outside its window. Not the Home Sweet Void snake room, not the Barista Safehouse. |
| structural flaw | the sustain pedal is stuck down; nothing is ever damped |
| promote? | no |

---

## 1. Video: Tap the Mug

Photoreal live action, 16:9, blue hour, snow. A small warm coffee house on Christmas Eve. Three women sit and stand
at its long window-counter facing a window so frosted that nobody can see out of it: Rubella, with her mug at
three-quarters; Lillith, with a wooden stirrer and a plan; Madelin, with the tote on her shoulder. Lillith taps the
mug with the stirrer. It goes *thock*. She holds out her palm without looking. Madelin goes in to the elbow and
comes out with a heavy silver spoon, exactly the right one. Lillith hides it under the counter and looks at the
ceiling. The barista steams milk. The steam stops. Lillith lifts the spoon over Rubella's mug, holds it, and taps.
*Tink.* Hard cut: the street outside is full of neighbors in coats and scarves, twenty-six of them, in two loose rows
in the snow, each with one silver handbell held level at chest height, all facing the window. They have
been standing there the whole time. They swing together and the street rings. Inside, the mugs hop, the coffee
shows rings, the string lights swing, a slab of snow slides off the awning. The three sip. Six chorus bars of this.
Then the band cuts dead. In the silence, from half a block away, one man with a bell the size of a trash can swings
his, and the BONG arrives half a second late. Rubella sets her mug down and slides it an inch toward Lillith. "Again."
Lillith lifts the spoon. *Tink.* Cut to black. The street rings on black.

```
id: tap-the-mug (song: Silver Bells)
world: one coffee house, plain Earth, Christmas Eve, and its street
length: 38.4s edit + 0.6s ring on black; does not loop
laugh: She tapped her friend's mug with a spoon, and a whole street full of people rang their bells back.
second laugh: One guy brought a way bigger bell, and it came in late.
drop: APPEARS. At 19.2s the picture cuts from three people at a frosted window to the street that has been full
  the whole time, and twenty-six bells swing at once. The mugs hop and ring on the same frame.
end reaction: Rubella, one word, "Again." with a nudge of the mug. Spent once. Lillith and Madelin get none.
do-not: no text on screen (menu board, mug, test card all unreadable); Madelin never rummages, never sets the tote
  down or opens it to camera, one retrieval only; nobody looks to camera or at the CRT; no faces in the crowd (backs
  only), no crowd mouths, the crowd never sings on camera; nobody presses a bell to a coat to damp it; no snake, wool
  coat, informant baristas or "we had it figured out"; no Pizza Guy, Riley, Jackalyn or Madelyn; no pseudoscience
  lecture; no church, nativity, choir robes, carol text, Santa, reindeer or sleigh; no ear protection; no tube box, wire, horn,
  amp or safety glasses on Lillith (her kit is spent once, in Sleigh_Ride.md); the barista
  never turns around; nobody remarks on the crowd.
promote?: no
```

### Cast anchors (paste under the base prompt)

- **RUBELLA** (left stool): elegant deadpan; a long dark coat open over a plain dark dress; both hands round a plain white diner mug, three-quarters full, text on it too small to read.
- **LILLITH** (middle stool): a black lace dress under an open black coat; a wooden coffee stirrer in one hand.
- **MADELIN** (standing at the right end of the counter, tote on her shoulder, never on anything). Bible Appearance bullets, verbatim from `characters/bible/madelin.md`:
  - Layered, cheerful, slightly mismatched — a cardigan over a print, a scarf chosen at a different temperature. Warm colors. She is the only bright thing in the frame after dark
  - Hair doing whatever it is doing. This is not a note to fix
  - Wide, genuine, undimmable grin. She grins *during* the disaster, not after
  - **The tote:** an enormous beige canvas bag with a huge moulded 3D skull on the side. It is heavier than it can possibly be and she never adjusts her posture for it
  - Both hands busy. Madelin is always mid-retrieval

Rubella and Lillith have no Appearance block in the bible; their anchors above come from the prop lists in
`content/characters.json` (Rubella's mug, Lillith's black lace dress and coat). Lillith's workshop kit is deliberately left off (see Callbacks).

**BASE-INT** (paste first on every interior still): Photoreal cinematic live-action still, 16:9, a small warm independent coffee house on a snowy Christmas Eve at dusk. Dark painted wood counter, mismatched wooden stools, white string lights across the ceiling, a paper garland over the till, a chrome espresso machine, a barista seen only from behind or as hands, a chalkboard menu with no readable text, a small old CRT television on a shelf above the pastry case showing a plain grey test card with no text. Along the front wall a long window with a wooden window-counter and three stools, heavy frost over the whole pane lit blue-white from the street behind it, warm amber light inside, a little steam in the air, soft film grain, 35mm lens, everything sharp. On the window-counter: a white diner mug three-quarters full. No readable text, no logos, no ear protection, no animals. Grok Imagine style.

**BASE-EXT** (paste first on every exterior still): Photoreal cinematic live-action still, 16:9, a narrow snowy small-town street at blue hour on Christmas Eve, snow falling slowly, strings of white lights across the street, one street lamp at the far corner. On the right, a coffee house with a lit amber window frosted over, three small silhouettes sitting side by side at a window-counter, a thick shelf of snow on the awning. No readable text, no logos, no vehicles. Grok Imagine style.

### Clip plan: six clips, 62s generated, 38.4s used

Mute every render's own audio; every sound is laid by hand (section 3). Retime a clip by at most 8% (slowing is the
safe direction) to put its contact frame on the bar line, otherwise reroll. The music never moves. Chain by last
frame only where one shot continues (1 to 2); the other clips are cut-ins with their own stills.

| # | Length → trims to | Used for | Start still (copy-ready; paste BASE and the cast anchors first) | Motion prompt (copy-ready) |
|---|---|---|---|---|
| 1 | 15s → 15.0s | 0.0-15.0 (bars 1-6, verse). The stirrer must hit the mug at 5.7s (accept 5.4-6.0) and the spoon must be in Lillith's palm by 9.0s (accept 8.7-9.3). | BASE-INT. Camera inside the room behind and to the right of the three, locked, seeing their backs and three-quarter profiles as they face the frosted window; barista at the left of frame steaming milk. Rubella (left) holds the mug; Lillith (middle) holds the stirrer; Madelin (standing, right) has one hand on the tote strap and the other half inside the tote, grin aimed at the window. No face toward the lens. | Continuous locked shot, no camera move, 15 seconds. Nobody speaks and no face turns to the camera. 0-3.0: steam hisses at the espresso machine; Rubella lifts her mug, sips, lowers it. 3.0-4.5: Lillith leans toward Madelin as if whispering, her head turned away so her mouth is hidden, then straightens. At 5.7 she taps the rim of Rubella's mug once with the wooden stirrer, a dull tap, and looks at the stirrer. Rubella lifts her mug an inch and sets it down. At 6.6 Lillith holds out an open palm sideways without looking. 7.2-8.4: Madelin's right arm goes into the tote to the elbow, the tote hanging from her shoulder and touching nothing, and at 8.4 her hand comes out with a long heavy silver spoon and lays it in Lillith's palm at 9.0. 9.6-11.0: Lillith slides the spoon under the counter edge, sits back and looks innocently at the ceiling. 11.0-15.0: all three face the window; steam keeps hissing; the string lights sway very slightly. |
| 2 | 6s → 4.2s | 15.0-19.2 (bar 7 end and bar 8, the break). The spoon must touch the rim at exactly 4.2s, which is 19.2 overall (accept 4.0-4.4). | The exact last frame of clip 1. | Continuous locked shot, same camera, no cut. 0-1.8: steam hisses; at 1.8 the barista's hand turns the wand off and the hiss stops; the room goes quiet. 1.8-2.6: Lillith brings the silver spoon up from under the counter and holds it four inches above the rim of Rubella's mug, perfectly still. 2.6-3.4: Rubella lifts the mug and takes one slow sip, lowers it, and the mug is again directly under the spoon. 3.4-4.0: the spoon holds. 4.0-4.2: the spoon drops and touches the rim at 4.2. Nobody turns to the camera; no mouth is visible. |
| 3 | 15s → three pieces of 2.4s | 19.2-21.6 (bar 9, the drop) from the swing at 0.5; 24.0-26.4 (bar 11) from the swing at 5.3; 28.8-31.2 (bar 13) from the swing at 7.7. Each piece starts on the low point of a swing. | BASE-EXT. Camera across the street, behind a crowd of exactly twenty-six people in winter coats, scarves and hats, standing in two loose rows of thirteen in the snow, seen from behind, all facing the café window. Each holds one silver handbell at chest height, level: twenty-six bells in all. A woman in a bus-driver's cap, a man with flour on his coat, and a man with a short stepladder under one arm and a bell tied to its top rung are among them. Far left, a tiny figure under the street lamp, who is not one of the twenty-six. Everyone is perfectly still. Count heads and bells in the still before generating: twenty-six of each, or reroll the still. | Continuous locked shot, no camera move, 15 seconds. Snow falls throughout. Nobody turns around, nobody looks at the camera, nobody speaks. The whole crowd swings its bells down together once and back up to chest height, reaching the bottom of the swing at 0.5 seconds and again every 2.4 seconds (0.5, 2.9, 5.3, 7.7, 10.1, 12.5), all in unison, bells level at the top, never held against a coat. On each swing the snow on the awning shivers; at 1.1 and again at 8.9 a slab of snow slides off the awning. The three silhouettes in the window do not move. The tiny figure at the far left does not move. |
| 4 | 10s → two pieces of 2.4s | 21.6-24.0 (bar 10) and 26.4-28.8 (bar 12). Mouths on in these two pieces only. | BASE-INT. Camera low on the window-counter among the mugs, locked, looking back at Lillith (seated, left of centre) and Madelin (standing, right, tote on shoulder) from about three feet; they face the lens, lit blue-white from the frosted window behind the camera, warm room behind them. Rubella's shoulder in the left foreground, face cropped out. | Continuous locked shot, 10 seconds. Lillith and Madelin sing the same line at the same moment, straight, in plain unison, looking at the window (the lens) and never at each other; each line is 2.4 seconds, and every line opens on a wide "ding, ding" mouth, then closes down. Madelin grins throughout; Lillith is bright and level. On the first beat of every 2.4 seconds (0.0, 2.4, 4.8, 7.2) the mugs on the counter hop a quarter-inch and ripple in rings and the women's hair lifts slightly; nothing else moves. |
| 5 | 10s → 7.2s | 31.2-38.4 (bar 14 through the end). Contact on the rim at 7.2s of the clip (accept 7.0-7.4). The 1.4s from 33.6 to 35.0 is covered by clip 6. | BASE-INT. Camera inside the room, locked, over Rubella's left shoulder, chest-up: her cheek and ear toward us, her face turned to the frosted window; the mug in both hands on the counter, coffee rippling in rings; the edge of Lillith's shoulder at the right with the silver spoon lying on the counter beside her hand. No mouth visible. | Continuous locked shot, 10 seconds. 0-0.3: the mug hops and rings of ripple spread across the coffee. 0.8: Rubella lifts the mug. 1.8: the rim reaches her lips (turned away; cheek only). 2.4-3.8: she holds it there, still. 3.8: she lowers the mug to the counter. 4.3: she pushes it one inch toward Lillith with two fingers. 4.9: she turns her head slightly toward the window and her lips are not seen. 5.4: Lillith's hand takes up the silver spoon and lifts it over the mug. 6.6: the spoon holds at the top. 6.6-7.2: the spoon descends and touches the rim at 7.2. Nobody looks at the camera. |
| 6 | 6s → 1.4s | 33.6-35.0, laid over clip 5 (a cut-away, not a cut). | BASE-EXT, long lens. The far corner of the street under the lamp: a man in a flat cap holding a bell rope beside a wooden hand-truck that carries a brass bell the size of a trash can on a frame, the bell at the bottom of its swing; snow falling; nobody else in shot. | Locked long-lens shot, 6 seconds. The shot opens on the strike: the huge bell is at the bottom of its swing and his hands are low at the end of one pull of the rope. It keeps swaying through a wide, slowing arc; at 0.2 a little snow shakes off the lamp. Nothing else moves. |

Reroll rules: any face to camera, any crowd face; the tote touches anything or is seen into; more than one retrieval or
a rummage; the silver spoon is not the object retrieved; a mouth moves outside clip 4; the crowd bells are not
level or are pressed to a coat; the swings are not in unison; text readable anywhere; the barista turns; the crowd is not exactly twenty-six (recount the still).

### Lip-sync plan (mouths on for the chorus only)

- Mouths are on screen in exactly two bars: 21.6-24.0 and 26.4-28.8 (4.8s of the 14.4s chorus). The other four chorus bars are the crowd from behind, and Rubella's mug.
- Every on-camera line opens on the same "ding, ding": one repeated open-vowel shape that Grok can fake without a visible mismatch, then a short phrase that is closed down by the cut.
- Cut on the bar line, never mid-word. No piece is held past 2.4s. Both women look at the window (the lens), so there is no eye line to a partner whose mouth would also have to match.
- If a render's mouth shape is wrong, swap that bar's piece for the street shot of the same bar (the lyric is the same either way) or cover the mouth with wand steam or frost glare. The chorus stays sung; only the mouth is hidden.
- The verses never need a mouth: the voice is off picture and the three face a window with their backs to the lens.
- Rubella's "Again." is over her turned cheek, never a face.

---

## 2. Video use map (`docs/song-method.md`, item 1)

- **Target length:** 38.4s of picture = 16 bars of 4/4 at 100 BPM (bar 2.4s, beat 0.6s, eighth 0.3s), plus 0.6s of ring on black (39.0s). The Minimax track is 33.6s: it ends dead on the bar 15 downbeat and bars 15-16 are picture-only.
- **Pattern:** bar 1 bed alone under the café; bars 2-7 verse-on-action (a whispered line a bar over bass, brushes and felt piano, no bells at all); bar 8 the break (steam off, bass on one low G, spoon up); bar 9 the drop (the tap, the cut, the full band, the bells); bars 9-14 chorus-on-reveal, cutting between the street and the window on the bar line; bar 15 the hard stop and one late BONG; bar 16 the tag.
- **Breaks (stops, not ducks):** (1) the steam wand stops at 16.8, and so does the band: only the low G is left, plus whatever the stuck pedal is still ringing; (2) the band, the voices and the bells all stop dead at 33.6 with no tail; the next 2.4s are the pastry-case hum, snow, the BONG at 34.1 and the mug sliding at 35.5; (3) "Again." sits in the silence at 36.1. Nothing is cross-faded. The only ducking is the café's steam at about -14 dB under the whisper.
- **Mouths:** OFF everywhere except bars 10 and 12 (21.6-24.0, 26.4-28.8), where Lillith and Madelin sing the chorus line straight to the window in plain unison. The whisper in the verses is off picture and nobody's lips move. "Again." is spoken over the back of Rubella's cheek. The crowd never sings on camera.
- **Whose voice, and why that is allowed:** the verse is an uncredited whisper, the score's own voice, mixed close and dry like a thought. It is allowed because (1) no mouth moves under it; (2) it states the plan and never addresses the camera or any of the three; (3) it is not a character: no name, no body. It is Lillith-compatible and not asserted to be her. In the chorus it hands over to Lillith and Madelin, who are on camera and in the room. It is not Rubella, the Continuity Voice, the Radio Voice or the Pizza Guy. Whose whisper it is stays open.

## 3. Diegetic sound from the picture (`docs/song-method.md`, item 2)

Picture sounds are laid in the edit. The render's own audio is muted. Minimax makes the song only. Times in seconds.

| Sound | When | Through the picture, or scored? | What the music does |
|---|---|---|---|
| Steam wand and milk hiss, grinder tick | 0.0-16.8; wand off at 16.8 | Picture, low (-14 dB) | Sits under the whisper. When it stops, the break starts. |
| Pastry-case compressor hum (mains) | 0.0-39.0, constant | Picture. It is the room. It outlasts the music and is still there under the BONG. | Nothing. |
| Wooden stirrer on the mug, one dull *thock* | 5.7 | Picture. Deliberately the wrong sound. | Lands off the brush stroke; the bed does not react. |
| Canvas rustle, then the heavy clink of the spoon in Lillith's palm | 7.5-9.0 | Picture | Piano offbeat chord covers the rustle. |
| Silver spoon on the mug rim, one pure *tink* pitched to G5 | 19.2 | Picture, laid on the contact frame | The full band lands on the same frame; the tink is audible for a moment on top of the first handbell chord. |
| Crowd handbell swing (twenty-six bells): wool-sleeve swish and a clapper tick only | beat 1 of bars 9-14 (19.2, 21.6, 24.0, 26.4, 28.8, 31.2) | Foley under the track. The bells' pitch is scored, not sounded: the handbell chord stab in the bed. | The track's stab lands on the same frame as the swing's low point. |
| Mugs hop and clack, six times | same six frames | Picture, -12 dB | Nothing. |
| Window glass hum, 0.3s each | same six frames | Picture | Nothing. |
| Snow slides off the awning | 19.8 and 30.0 | Picture, soft slump | Nothing. |
| One BONG: the far man's big bell, pitched G2, 3s decay | 34.1 (the swing is at 33.6, so it is half a second late) | Picture. The only musical sound in the dead bar. | Silent. The band has been cut at 33.6. |
| Mug set down; mug slid one inch | 35.0 and 35.5 | Picture | Silent. |
| Rubella: "Again." Dry, raspy, close, no reverb, over her turned cheek | 36.1 | Speech (rationed; the only word any of the three says). | Silent. |
| Silver spoon tink, then the street ring on black (the same stems as 19.2: the tink and the crowd swish; no track) | 38.4-39.0 | Picture | Silent. The song does not return. |

Sung instead of sounded: nothing. The lyric never copies a picture sound. Speech: only "Again."

Stems to build: (1) steam wand and milk, 17s, loopable; (2) pastry-case hum, 39s, constant; (3) wooden stirrer on ceramic, one dull tap; (4) silver spoon on a ceramic rim at G5, one pure tink; (5) twenty-six handbell swishes in wool, laid as one stem, three variations; (6) ceramic mug hop, six variations; (7) plate-glass hum; (8) snow slump, two; (9) one brass bell the size of a trash can at G2, 3s ring; (10) ceramic mug slid on wood.

Tolerance for the edit: a sound may sit up to about 40ms before or 120ms after its contact frame. The BONG is deliberately 500ms after the swing. Never move the music; retime or reroll the clip.

---

## 4. Minimax Music (`docs/song-method.md`, item 3)

STYLE:

Mid-1960s girl-group soul-pop, a small-room Christmas record, 100 BPM locked (no drift, no swing, no tempo change), G major, 4/4, straight eighths, exactly 14 bars and 0:33.6 long (2.4 seconds a bar). Instruments: one upright bass playing the root on beat 1 and the fifth on beat 3 of every bar; one felt-damped upright piano playing soft block chords on the offbeats (the and of 2 and the and of 4); a brushed snare on beats 2 and 4 and no other drums until the chorus; from the chorus a felt kick on 1 and 3 and one tambourine on 2 and 4; and a set of handbells that plays one chord stab on beat 1 of each chorus bar and nothing before the chorus. No guitar, strings, horns, synth, choir, sleigh bells, jingle bells, glockenspiel, vibraphone or sound effects. Bar 1 is bass, brushes and piano only, no voice. Verse, bars 2 to 7: one female whispered lead, bright and conspiratorial, close-miked at about four inches, breathy and nearly spoken, no vibrato, no belt, no smile in the voice, one short line per bar, entering on beat 1 of bar 2. At 0:16.8, on the downbeat of bar 8, everything stops except one low G on the upright bass, held for the whole bar, with no voice, no brushes and no new piano chord; whatever is still ringing is allowed to keep ringing. At 0:19.2, on the downbeat of bar 9, the full band lands at once: handbells, felt kick, tambourine, brushes, big block piano chords, and two female voices singing in plain unison on the same notes in the same octave, one brighter and one warmer, straight and level, with no harmony, no ad-libs, no backing voices, no crowd and no handclaps. Chorus, bars 9 to 14: one line per bar, chords G, C, G, D, C, then D to G. Everything stops dead at 0:33.6, on the downbeat after bar 14, with no tail, no ring-out, no fade and no final chord. **Structural flaw:** the sustain pedal on the piano is stuck down from the first chord to the last, and the handbells are never damped, so every chord and every bell keeps ringing under the next one; the sound blurs and accumulates through the verses and the chorus and nothing is ever cleaned up. Do not release the pedal, do not damp the bells, do not thin the wash for the break, do not add a clean last chord: the track ends where a power cut would end it. Mixed like a 1966 record dubbed to cassette: tape hiss, top end rolled off above 6 kHz, the handbells heard as if through a plate-glass window, a small wood-and-tile room, low dynamic range. Nobody is acting: sung and played straight, professionally neutral, never wink. Original melody: the verse sits on D, E and G in a near-whisper; the chorus tune is "ding, ding" on a repeated D, then a short stepwise line down to G.

LYRICS:

[Intro]

[Verse]
Window table, third from the door
Mug at three-quarters, nothing more
Garland on the till, lamps turned low
Hold the spoon, don't let it show

[Verse]
Wait for the steam, wait for the hush
One good tap and not too much

[Break]

[Chorus]
Ding, ding, for the baker
Ding, ding, for the bus
Ding, ding, for the ladder
Ding, ding, for all of us
Ding, ding, for the street
Ding, ding, for the mug

NOTES:

### What the song is
A plan, then an answer. Verse one and two are a whispered plan at a window table: where it is, what is in the mug, hold the spoon, keep it quiet. Nothing in the verses says what is about to happen; the song never says bell, ring, crowd, neighbor, Christmas or snow. The street hears the tap the way the plan says it should: it waits for the steam to stop. The chorus is the street answering: a roll call of everyone who came, sung in plain unison by the two women who set it up, and it ends on the thing that got tapped. The rule-of-three has a wrong third (baker, bus, ladder); the picture has all three in the crowd. The last "ding" is for the mug.

Christmas lives in the picture and the bells: string lights, a paper garland, snow, scarves, neighbors with handbells. It is a street gathering for a mug. There is no church, no nativity, no carol text and no choir robes. The joke is a spoon and a street, and nothing in it is at the expense of anybody's faith.

### The structural flaw (held, never fixed): nothing ever stops ringing
The piano's sustain pedal is down from the first chord to the last, and the handbells are never damped. Every chord is still sounding under the next; by the chorus the track is a warm blur, and the bell stabs pile up inside it. In bar 8 the band stops and the wash from bar 7 is left to decay under one bass note. The track ends on a gate, not a release: it is cut, like a power cut, and the pedal is never lifted. It is never fixed: no damped bell, no clean chord, no "let the room clear" bar, no tidy button. (The picture rhymes with it, it does not explain it: the ripples in the mugs keep going between rings; nobody in picture ever presses a bell to a coat.) It is a different kind from the five branch songs: not a miscount (`Box_Box_Hat`), a missing pitch (`Just_a_Sunday`), a wrong-size cymbal (`Thank_You_for_the_Lava`), an empty slot (`Pans_Down`) or a late voice (`Eleven_Stops_Since_Thursday`). Nearest drawer neighbour: the organ in `songs/Heavy_Water.md` that holds its last chord a bar too long, which is one chord per chorus; this is the whole record.

### Minimax expectations
- **Genre:** a mid-1960s girl-group Christmas record, which is what a coffee house would actually play on Christmas Eve. The picture is deadpan and the record is warm and sincere; the record is what the street answers. The singers are not asked to be funny.
- **Locked:** 100 BPM, G major, 4/4, straight eighths, 14 bars, 0:33.6 (bar 2.4s, so the bar lines and the swings match the 2.4s cycle in the clip prompts). Instruments: upright bass, felt piano, brushes, kick and tambourine in the chorus, handbells. A whispered lead in the verses; two women in plain unison in the chorus. Original melody, original lyric, official section tags, no parentheses.
- **Expect to fix in the edit.** Minimax will not reliably leave a bar with only one bass note, hold the pedal down, or stop dead. Make several takes and keep the muddiest one (the one that fails to clean up is the right one). If a take damps the bells or releases the pedal, pick another; do not repair it with EQ. Cut the audio at 33.6 with a gate, no fade. If the take puts bells in the verses, mute them: the first handbell is the drop. If the chorus is harmonised, keep the unison take or fold the harmony to mono. Rubella's "Again." is laid in the edit, not generated. Reject any take that adds sleigh bells (that is another song's lane).
- **Gaps in the method:** `docs/song-method.md` items 2 and 3 arrive truncated and any steps after 3 are missing; items 1-3 were followed as written and the missing text was not invented.

### Timed treatment

| Time | Bar | Picture (clip) | Picture sound | Music / voice | Sung |
|---|---|---|---|---|---|
| 0.0-2.4 | 1 | The room. Rubella sips, the barista steams (1) | Steam, hum | Bass, brushes, piano. | |
| 2.4-7.2 | 2-3 | Lillith whispers to Madelin, mouth hidden; stirrer on mug at 5.7; palm out at 6.6 (1) | Steam; *thock* 5.7 | Whisper enters at 2.4. | "Window table, third from the door" · "Mug at three-quarters, nothing more" |
| 7.2-12.0 | 4-5 | Madelin's arm goes in; the silver spoon is handed over at 9.0; Lillith hides it and looks at the ceiling (1) | Rustle, clink at 9.0 | Same. | "Garland on the till, lamps turned low" · "Hold the spoon, don't let it show" |
| 12.0-16.8 | 6-7 | Everyone waits; the barista steams; wand off at 16.8 (1, then 2) | Steam to 16.8 | Same. | "Wait for the steam, wait for the hush" · "One good tap and not too much" |
| 16.8-19.2 | 8 | **The break.** The spoon rises and holds over the mug; Rubella sips (2) | Hum only | Everything stops except one low G; the pedal wash decays. | |
| 19.2-21.6 | 9 | **The drop.** The spoon touches the mug at 19.2. Hard cut: the street, twenty-six bells swing (3) | Tink 19.2; swish; mugs hop; snow slump 19.8 | Full band lands; handbell stab; both voices. | "Ding, ding, for the baker" |
| 21.6-24.0 | 10 | Lillith and Madelin sing to the window, mugs hop (4) **mouths on** | Hop, glass hum | Chorus. | "Ding, ding, for the bus" |
| 24.0-26.4 | 11 | The street again: the ladder man (3) | Swish | Chorus. | "Ding, ding, for the ladder" |
| 26.4-28.8 | 12 | Lillith and Madelin again (4) **mouths on** | Hop | Chorus. | "Ding, ding, for all of us" |
| 28.8-31.2 | 13 | The street, wide (3) | Swish; snow slump 30.0 | Chorus. | "Ding, ding, for the street" |
| 31.2-33.6 | 14 | Rubella's mug rings; she lifts it; the rim reaches her lips on "mug" (5) | Hop at 31.2 | Chorus. | "Ding, ding, for the mug" |
| 33.6-35.0 | 15 | **The stop.** Everything cuts. The far man's big bell is at the bottom of its swing (6, over 5); Rubella holds the mug at her lips | Hum; BONG at 34.1 | Nothing. | |
| 35.0-36.0 | 15 | Rubella sets the mug down (35.0) and slides it an inch toward Lillith (35.5) (5) | Mug on wood | Nothing. | |
| 36.0-38.4 | 16 | "Again." Lillith lifts the spoon; it descends (5) | "Again." 36.1 | Nothing. | |
| 38.4-39.0 | | Contact. Cut to black on the frame. The street rings on black. | Tink; ring | Nothing. | |

If a render lands the tap or the contact somewhere else, move the picture to the bar line (retime at most 8%), not the music.

### Callbacks spent (`notes/callback-bank.md`, all as references, none as a set)
- **Madelin's bag has extra gravity.** One retrieval of two: a long silver spoon, exactly the right one when the stirrer goes *thock*. Locks kept: plausible not impossible, the joke is "why do you have that" and no one asks how; no rummage; the tote never touches anything and is never seen into; the spoon stays in Lillith's hand to the end (contents persist, nobody gives it back); the second retrieval is unspent and the third is still the finale's.
- **World's Okayest Tenant mug / mug three-quarters full as the clock.** Rubella's mug is the bell. The text is unreadable. It is three-quarters at the start and about half at the end (three sips); it is never emptied, so the scene ends on a tap, not on an empty mug. The full extinguisher is not used.
- **Lillith's kit (speaker wire, safety glasses, soldering iron, the vacuum tube in a dish towel) is deliberately NOT spent here.** It is spent once for the whole Christmas set, in `Sleigh_Ride.md`. In this file Lillith has no wire, no tube box, no horn, no amp and no glasses beat: her props are a wooden stirrer and, borrowed from Madelin's tote, a silver spoon. The ping-pong table, its weather and the 6BQ5 are not named.
- **Bag at chest height.** The crowd holds twenty-six bells level at chest height, uncommented, and the spoon is passed palm-up at chest height.
- **EyeWash is always on somewhere in frame.** A small CRT with a plain grey test card above the pastry case. Nobody looks at it, comments on it or changes it. No station card, no voice.
- **Worlds do not mix (the lane rule).** A plain Earth coffee house. No snake, no wool coat, no paper-cup heating, no "we had it figured out" (`ideas/home-sweet-void.md`); no coded informant baristas, no "Regular?" (`episodes/episode-02/studio-huddle.md`, Barista Safehouse). The barista is a back and a pair of hands.
- **Echo, not claimed.** The tap and the tink at 19.2 and again at 38.4 use the same stems twice, the same portable form as "a cue plays twice identically on purpose" that `Just_a_Sunday` already spent; it is flagged and not counted as a spend.
- **Not spent, because the branch has them:** the ping-pong table predicting weather, the 24-hour laundromat thump, "Nothing happening, extremely well", Rubella's full extinguisher, "Juxtaposition, the wrong channel". Also kept: Rubella's pseudoscience (corrected exactly once, ever), the Pizza Guy, Madelin's object-backstory.

### Why it is not the neighbors
- **Not Mysterium** (`songs/Mysterium.md`, `Mysterium_A_Cappella.md`). That is the Christmas song: Italo bubblegum, 128, a choir, Latin, a key lift. This is 100 BPM girl-group soul-pop, plain unison, no choir, no Latin, no key change, a street of neighbors instead of a piazza.
- **Not Box, Box, Hat or Just a Sunday.** Neither has a crowd. Sunday's silence is ten seconds and bar-locked, with ear defenders on a man who mows; here the stop is one bar and the BONG, and nobody wears ear protection.
- **Not Thank You for the Lava, Pans Down or Eleven Stops.** Not metal, not rap, not synth-pop; the picture is not the kit; the flaw is a pedal, not a cymbal, a slot or a key change.
- **Not Home Sweet Void's coffee house.** That one is the snake's, a paper cup and a space table. This one has no snake and no packet.
- **Not My Coffee Is So Strong It Walked Away** (`ideas/silly-songs-drawer.md` #6). That is Rubella's mug walking off, no café, no barista. Here the mug stays put and gets tapped.
- **Not Whistle Twice or Not a Car.** A goose lifeguard and a night valet; both are building-world and have a hard-stop interrupt. This is an Earth café with a reveal.

### Five questions (`ideas/funny-rules.md`)
1. A 9-year-old can say the laugh back: "She tapped her friend's mug with a spoon and a whole street rang their bells back." Yes. They can also say "Ding for the ladder!" and "The big bell came in late."
2. Mute the music: the cut to twenty-six people with bells, the mugs hopping with rings in the coffee, the snow sliding off the awning and the late bell swing are all still visible. Yes.
3. The calmest thing in frame is Rubella, then Lillith and Madelin: the mugs hop, the string lights swing, snow falls off the roof, twenty-six bells swing, and the three sip. Yes.
4. Cover every word on screen: there are none that matter (menu board, mug and test card are unreadable). Yes.
5. One world: one coffee house and its street. Yes.

### Sonic rules checked (`notes/song-suggestions.md`, series sonic bible)
Nobody is acting: a whisper that does not smile, two women in plain unison, no belt, no ad-lib, no wink. One structural flaw, held and never fixed: the stuck pedal. Dark top end: cassette hiss, rolled off above 6 kHz, the bells heard through a plate-glass window; the pastry-case hum and the room are real and under everything. Original lyric and melody; no real artists, brands, public figures or existing lyrics.

---

## Other videos this song could sit on

**B. Forty Bells (the building curb).** *Rubella and Lillith only, no Madelin, no Riley.* The building's curb at night in snow, bulk-pickup night: forty tagged folding chairs in a row, Rubella with her mug at three-quarters. Lillith ties one small silver bell to the top rail of the first chair; it jingles once; Rubella watches. **Drop (multiplies):** on the chorus downbeat (19.2) every chair has a bell, and the whole row creeps one inch back in unison with one jingle, once a bar, until by bar 14 the row is at Rubella's heels and she has not stepped. **Laugh:** *every chair got a bell, and they all scooted back at once and nobody clapped.* Engine: things that keep happening; the chairs creak and do not clap and creep back an inch in unison (callback-bank lock). Mouths: both sing the chorus in cold breath-fog, seen from behind or three-quarter back, so the lips are hidden by the breath. The stuck pedal rhymes with the chairs that never stop creeping.

**C. The Bear Has the Bell (Riley's saddle).** *Riley alone and one black bear; a snow saddle above five thousand feet, not the café and not the building.* Riley's hiker's bear bell ticks on her pack strap as she walks. Around a boulder comes a bear walking toward her on the narrow trail with a tiny bell on a red collar, ticking too: each is warning the other. **Drop (reverses):** on the downbeat the roles flip. The bear stops, steps off the trail and waits with his paws together to let her pass; she steps off the same way; both step across; the third time he lies flat and she steps over him. **Laugh:** *the bear wears a bell so he won't scare her.* Engine: animals doing human jobs, rule of three with a wrong third (lie down). Mouths off throughout: Riley does not start songs and does not sing on camera, so the chorus is the two bells and the paws, with the voices off picture; the score enters at the saddle, not before (the Ep5 candidate's rule). She says nothing; if anything is said it is a flat number off screen. Do not touch the antenna.

---

## Open and not answered
- Whose whisper the verse is, and whether the three can hear it; who the unseen band is.
- How Lillith got twenty-six neighbors, a baker, a bus driver and a man with a ladder to stand in the snow; whether they were told or just knew; why the man half a block off, who is not one of the twenty-six, has a bell the size of a trash can.
- How the street hears a spoon through frosted glass. The plan says wait for the hush, the steam stops at 16.8, and the tink is then the only sound in the room. Nothing else is shown or said.
- Whether Madelin knew about the street (she only brought a spoon); why she has a silver spoon at all; what else is in the tote (never inventoried).
- Whether this is the same Earth coffee house as the snake's in `ideas/home-sweet-void.md`. It is plain here and nothing says either way.
- Why Rubella's mug is the one that gets tapped, and why she slides it back.
- Canon gap: Rubella and Lillith have no Appearance block in `characters/bible/`. The anchors above come from the prop lists in `content/characters.json`. If the owner adds sheets, change the cast block, not the picture.
- Method gaps: `docs/song-method.md` items 2 and 3 arrive truncated and any steps after 3 are missing; items 1-3 were followed as written and the missing text was not invented.

*Drawer. `promote?: no`. Christmas pack. Text only; no stills, no mp3.*
