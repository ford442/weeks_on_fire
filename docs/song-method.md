# Song method (owner lock)

**Status:** owner lock. Agents follow it; they do not re-decide it.
**Applies to:** every new song, sketch or pitch, for any agent (Claude, Cursor, Grok, Kimi, GPT).
**Source:** pasted by the owner. Items 2 and 3 below arrived with `...` where the paste
was cut. Those gaps are the owner's to fill. Do not invent the missing text.

---

## Method (owner lock)

The **video concept comes first**. It can be anything — existing cutaway, new stills-to-video packet, short loop, commercial interrupt, micro-duel, visual experiment, or a plate the owner names. The video guides length, pattern, breaks, and genre.

Then build the song around it:

1. **Video use map** — how the song sits on the picture.
   - Target length (match the video, or name the hold/cut points).
   - Pattern: continuous bed, verse-on-action / chorus-on-hold, hard cuts on action beats, silent stretches for diegetic sound, etc.
   - Breaks: where the music drops, ducks, or stops so picture sound can come through.
   - Mouths on / mouths off rule for the picture.

2. **Diegetic sound from the video** — possible sounds that come through the picture, including speech.
   ...

3. **Minimax Music generation** as the primary vocal / lyric / STYLE source. Genre is free — the agent chooses what the video suggests...

---

## Open gaps (owner to fill)

- Item 2: the paste stops after the heading line.
- Item 3: the paste stops mid-sentence after "what the video suggests".
- Any steps after 3, if there were any.

Until the owner fills these, follow items 1–3 as written and leave the gaps open in your
report rather than guessing.

## How this meets the existing song files

- A song **sketch** in `songs/_drawer/` starts from a named video: say which cutaway, packet,
  loop or plate it sits on, then give the video use map (item 1) before the `STYLE:` block.
- The existing `STYLE:` / `LYRICS:` / timed-treatment shape in `songs/*.md` and
  `notes/issue-minimax-song-pack-body.md` stays. The method decides length, pattern and
  breaks *before* those blocks are written.
- The sonic rules in `notes/song-suggestions.md` still apply to the sound.
