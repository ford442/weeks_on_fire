---
id: neon-nightfall
title: Neon Nightfall
added: 2026-11-06
genre: "Pop & synth-pop"
subgenre: cyberpunk chase synth-wave
description: Thirty-second neo-noir alley chase — drone pass, billboard flash freeze, mouths off, diegetic rain and siren.
episode: visual
slot: Neon Nightfall (alley plate)
tags: [cyberpunk, chase, neon, rain, drone, synth-wave, cutaway, 30-seconds, mouths-off]
instrumental: false
audioFile: null
---
STYLE:

Synth-wave and dark synth-pop chase bed, 108 BPM locked (no drift), E minor, 4/4, straight eighths, exactly 0:30. Tight side-chain pumping on the kick, analog sub bass on the root, gated reverb snare on two and four after the intro, wide shimmering pads (magenta-tinted left, cyan-tinted right), one metallic portamento lead for the hook, short plate reverb on a single close female vocal — breathy, cool, not belting, never ad-libs, never crowd. Intro 0:00–0:08: low arpeggiated pulse and pads only, no snare. At 0:08.0 **hard mute** the entire bed for 2.0s (drone swoop slot — no kick, no tail, no reverb wash). At 0:10.0 bed returns with snare and verse energy. Verse 0:10–0:18: vocal rides the stride, bass walks in eighths. At 0:18.0 **full silence** for 2.0s (billboard flash — absolutely nothing from the song, not even a drone note). At 0:20.0 chorus slams in: doubled hook, brighter lead, sub drops an octave on the downbeat. 0:24–0:30: distant siren is **not** in the Minimax render — leave headroom for a picture siren stem. End on a sustained hook note that is **cut dead** at 0:30.0 with no fade. No EDM festival riser, no trap hats, no guitar, no choir, no spoken word, no male vocal, no copyrighted artist reference. Professionally neutral, never wink. Original melody.


LYRICS:

[Intro]

[Verse]
Neon veins, they pulse, we're racing through the night
Rain-kissed streets, reflected light, a thousandfold sight

[Pre-Chorus]
Drone above, humming cold, a silver scar
Heartbeats sync to the synth, we're chasing far

[Chorus]
Flash — the billboard burns, a moment frozen thin
Silence bleeds, then beats return, we dive in

[Outro]


NOTES:

### Picture (cutaway)
**Neon Nightfall** — `content/cutaways/neon-nightfall.json`, board
`prompts/neon-nightfall-segments.md`. One rain-slick megacity alley, one hooded runner with white
LED trim, one matte-grey surveillance drone, one abstract billboard at the vanishing point. Series
cast does not appear; this is its own neo-noir world.

### Video use map (`docs/song-method.md`, item 1)
- **Target length:** 0:30 wall clock, five segments A–E on the board. 108 BPM = 1.8 beats per second
  (54 beats total); treat segment boundaries as **hard cuts**, not crossfades.
- **Pattern:** continuous low bed on the sprint (A) · **full bed out** on the drone pass (B) ·
  verse-on-action chase (C) · **full bed silent** on the billboard flash (D) · chorus-on-action
  to the tag (E).
- **Breaks:** mute 0:08.0–0:10.0 for rotor whir; mute 0:18.0–0:20.0 for electric buzz and rain;
  no ducking elsewhere — picture sounds sit under the vocal when the bed plays.
- **Mouths:** OFF all 30s. Vocal is off-picture narration / interior; the hood hides any face; no
  lip-sync. Allowed because the singer never addresses anyone on screen and nothing in frame has a
  mouth to contradict.

### Diegetic sound (`docs/song-method.md`, item 2)
Picture sounds are laid in the edit; Minimax supplies only the song stem.

| Sound | When | Through picture or scored? | What the bed does |
|---|---|---|---|
| Rain on asphalt | 0:00–0:30 | Picture, constant under-bed, loudest in B and D | Nothing; never imitate rain in the synth |
| Rotor swoop | 0:08–0:09 | Picture, loudest event in B | **Muted** 0:08–0:10 |
| Footfalls in puddles | 0:10–0:18, 0:20–0:28 | Picture, syncopated under verse and chorus | Groove sits over; do not add kick fills that mimic steps |
| Billboard buzz | 0:18–0:19 | Picture, sharp electric tick | **Silent** 0:18–0:20 |
| Distant siren | 0:24–0:30 | Picture, fades in, never resolves | Chorus under; no siren in Minimax prompt |
| Speech | — | None | — |

Item 2 in `docs/song-method.md` is still truncated after this heading in the owner lock; no extra
rules were invented beyond the table above.

### Minimax generation (`docs/song-method.md`, item 3)
- **Genre:** synth-wave chase interrupt — neon noir, side-chain, metallic lead. Chosen because the
  plate is night rain and strobing signage, not glam metal or cabaret.
- **Paste:** use the `STYLE:` and `LYRICS:` blocks above as-is. Expect to hard-cut mutes at 0:08
  and 0:18 in the DAW if the model keeps playing through the drops.
- Item 3 in `docs/song-method.md` is still truncated mid-sentence (“what the video suggests…”); any
  steps after item 3 in the owner paste are still missing and were not guessed.

### Flow / picture-sound
The board treats the alley as the drummer: the drone pass and billboard flash are the two places
the song must go completely quiet so rotor whir, rain, and buzz can land. The verse and chorus ride
the runner’s stride in C and E while the LED trim keeps pulsing even during the “freeze” in D — the
picture’s structural flaw, held. A distant siren stem finishes the last six seconds under the hook
without resolving, so the cutaway can exit still chased.

### Callbacks (references, not spends)
Wet asphalt and neon that lies — house sonic brief (`notes/song-suggestions.md`), as atmosphere only.
No cast callbacks, no Lace Waterfall, no EyeWash, no E X I hero prop (negatived on the board).

### Open questions
Whether the runner is pursuer or pursued; whether the drone is police or private; whether the
billboard glyphs imply a story or stay abstract. Owner to lock before picture generate.