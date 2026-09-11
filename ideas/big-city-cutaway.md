# Big City — catalog musical cutaway

**Kind:** musical cutaway (catalog glam, not the Ultra Screech ad)  
**Lane:** Glam-Sham-Poo catalog single. Hair is the architecture. Product off-screen.  
**Catalog:** `content/cutaways/big-city.json` (`kind: musical`)  
**Prompts:** `prompts/big-city-segments.md`  
**Song:** `songs/Big_City.md`  
**Grok build:** `ai-contributions/grok-4.6/big-city-video.md`  
**Local board:** `artifacts/big_city_video.md`  
**Suggestions id:** `big-city`

Bed in hand: local `big_city(option_a).mp3` (~2:46.82). Kenji tag lands **0:05–0:07**: *“The hair is in big city man.”* Use the take. Do not rewrite him. Binary is not in `songs/` yet.

Farm song notes on [#18](https://github.com/ford442/weeks_on_fire/issues/18) / [#33](https://github.com/ford442/weeks_on_fire/issues/33). Origin / splash thoughts on [#32](https://github.com/ford442/weeks_on_fire/issues/32). Picture notes on [#22](https://github.com/ford442/weeks_on_fire/issues/22). Do **not** dump on [#42](https://github.com/ford442/weeks_on_fire/issues/42).

Worlds do not mix: no Daisy tandem, no laundry-waterfall sleeve as the home plate, no night-lot cabinet, no Annex wings, no HSV table, no Ultra Screech bottle, no EyeWash bug.

---

## Lock

A-roll is a small Glamora club stage. Lillith starts. Rubella answers. Kenji plays and speaks the tag twice. Ladies stay modern black lace. Glam volume is in the hair, not a costume change.

B-roll is Big City hairdos in poses and situations: skyline, fire-escape strand, crown work, walk under a fringe, laundry spin-cycle look-through, elevator that yields, lunch-volume dos, two ELO-scale afros arguing in slow motion, crown-keeps-the-keys window.

Cut on the gated snare and on every gang **Big City**. Land on stage before both Kenji tags.

Not a second commercial. No bottle hero. No `¥???`. No scream-sting. Riley stays off this record.

---

## Imagine audio prompt

Grok Imagine accepts the song as an audio prompt. It is a motion clock and a mouth clock.

- Do **not** feed the full 2:47 to one generate.
- Slice stems to the clip budget. 126 BPM → 1 bar = 1.905s. Default **4 bars ≈ 7.6s**.
- Each generate: start frame + last frame + that exact stem (hard-cut, no fade) + a line that says whether mouths may work.
- Stage stems: mouths on. Hair-city stems: **no lip sync; the hair performs the beat.**
- Edit master stays option_a. Mute Imagine-baked audio in the stack unless a stage take actually locks lips.

Stem windows and paste prompts: `prompts/big-city-segments.md`.

---

## Generate-first

1. Stage wide pair for K1 / K2 (same room, same hem, Kenji in frame).
2. Hair-skyline pair for chorus lock.
3. Fire-escape strand or under-the-fringe cutaway.
4. Then lunch-volume / ELO-afro B-roll on verse 2 and the solo.

Codegen after merge so Suggestions sees `big-city` and Songs sees `big-city`.
