# MiniMax Audio Music 2.6 — Prompting Guide for `weeks_of_fire`

> A practical reference for writing style prompts that actually work with MiniMax Music 2.6, based on official documentation, community findings, and first-hand project experience.

---

## 1. What the Model Is

MiniMax Music 2.6 generates full-length songs (up to ~4–6 minutes) from:
- A **style prompt** (up to 2,000 characters)
- **Lyrics** with structural tags (up to 3,500 characters)

It supports instrumental-only mode, auto-generated lyrics, and precise BPM/key control.

---

## 2. How Tokenization Works

The model does not "read" your prompt like a human. It tokenizes descriptive words into weighted style vectors:

| What you write | What the model hears |
|----------------|----------------------|
| `haunting acoustic solo piano` | strong weight on "haunting" + "acoustic" + "solo piano" |
| `dark cabaret` | a specific genre blend token |
| `60 BPM` | tempo lock (reportedly 99%+ accurate when specified) |
| `female vocal` | weak/generic vocal token |
| `soft melancholic solo female vocals, outdoor without microphone` | strong vocal character + recording context |

**Takeaway:** Specific, concrete descriptors steer the model predictably. Vague terms like "good," "nice," or "emotional" without context are essentially noise.

---

## 3. The Inflection Mark Trap

**Problem:** AI assistants (and humans) often add parenthetical performance directions to lyrics, like:

```
(softly) I walk alone
[whispered] Can you hear me?
```

**What MiniMax does:** It frequently **sings the directions as actual lyrics** — you will hear the words "softly" or "whispered" in the vocal track.

**Why:** The lyrics field is primarily treated as text-to-be-sung, not as a stage script. Only the **official structural tags** are reliably parsed as non-vocal instructions.

**Safe structural tags (use these):**
```
[Intro] [Verse] [Pre Chorus] [Chorus] [Post Chorus]
[Hook] [Drop] [Bridge] [Solo] [Inst] [Build Up]
[Interlude] [Break] [Transition] [Outro]
```

**Rules for safe tags:**
- Capitalize exactly as shown.
- Place each tag on its own line.
- Put a blank line before the lyrics that follow.

**If you need performance variation:** Describe it in the **style prompt**, not the lyrics:

```
Style prompt: "...soft melancholic solo female vocals, intimate close-mic delivery,
whispered verses building to full-voice chorus..."
```

---

## 4. Dense Prompts vs. Minimal Prompts

Official MiniMax guidance says: *"Write prompts as vivid English sentences, not comma-separated tags."*

**However**, in practice — and in this project — two approaches yield very different results:

### Approach A: Minimal / Sparse Prompt
```
Piano ballad, sad, female vocal
```
**Result:** Highly variable. The model fills in gaps with its own assumptions. Good for happy accidents, bad for consistency.

### Approach B: Dense / Token-Rich Prompt
```
Haunting acoustic solo piano, minor-key progression, dark cabaret, eerie atmosphere,
subtle dissonance, slow tempo, 60 BPM, cinematic, expressive dynamics, delicate,
gothic waltz, lingering sustain, soft melancholic solo female vocals, outdoor without
microphone. Use my Rubella voice.
```
**Result:** Much more predictable and specific. Every additional descriptive token narrows the possibility space.

**Project convention:** The `weeks_of_fire` song prompts use dense, comma-separated tag lists because:
1. The project blends niche genres (dark cabaret, hypnagogic jazz, Eurodance) that need precise steering.
2. Cinematic production requires specific instrumentation and production cues.
3. Dense prompts reduce the randomness that would clash with the visual/narrative tone of each episode.

**Recommendation:** Start dense. Once you have a sound you like, you can try trimming tokens to see which ones are essential.

---

## 5. Recommended Prompt Order

This is the order that seems to produce the most coherent results:

```
[Genre / sub-genre] → [BPM + Key] → [Mood / Atmosphere] → [Vocal style] →
[Key instruments] → [Production / Recording style]
```

**Example breakdown:**
```
French Cabaret, Nu-Jazz, Electro-Chanson        ← Genre anchor
75 BPM lullaby tempo                            ← Tempo lock
sleepy/half-conscious, hypnagogic night drive   ← Mood / scene
female chanteuse vocals, close whispered delivery ← Vocal character
brushed snare, vibraphone, upright bass, accordion ← Instrumentation
tape saturation, AM radio bandwidth restriction, vinyl crackle ← Production texture
```

---

## 6. Structural Tags in Lyrics

Use these to control arrangement. They are **not** sung when formatted correctly.

```markdown
[Verse]
Rain is falling on this Halloween night so still

[Pre-Chorus]
In this moment walls come tumbling down

[Chorus]
Whatever lets us be so open-minded
```

**Tips:**
- Always separate tags and lyrics with a blank line.
- Do not invent custom tags — unsupported tags may be sung.
- `[Inst]` and `[Solo]` create instrumental passages without vocals.
- For purely instrumental tracks, set `is_instrumental: true` and skip lyrics entirely.

---

## 7. Lyrics Best Practices

- **Line length:** 4–8 words per line sings most naturally.
- **Phrasing:** Simple, conversational language works better than complex vocabulary or tongue twisters.
- **Match tone:** Sad lyrics + "upbeat party" prompt = confused output. Align lyrical mood with style mood.
- **Character limit:** Stay under 3,500 characters. For a 4-minute song, you have plenty of room — use structural tags and instrumental breaks rather than stuffing in more words.

---

## 8. Quick Reference

| Element | Good Example | Bad Example |
|---------|-------------|-------------|
| Genre | `dark cabaret, gothic waltz` | `weird music` |
| Vocal | `soft melancholic solo female vocals` | `female vocal` |
| Tempo | `60 BPM` | `slow` |
| Instrument | `upright bass with slow bowed long tones` | `bass` |
| Production | `tape saturation and wow/flutter` | `lo-fi` |
| Mood | `eerie atmosphere, subtle dissonance` | `scary` |

---

## 9. Project Examples

See the existing song files in `songs/` for working prompts:

- **`Les_Ondes_Courtes.md`** — Extremely dense, texture-heavy prompt (hypnagogic jazz, tape effects, AM radio restriction).
- **`Twilight_Time.md`** — Genre-forward prompt with era-specific instrumentation (TB-303, TR-909, Korg M1).
- **`Whatever_Lets_Us_Be.md`** — Sparse but targeted (solo piano, minor key, specific vocal delivery).

Compare the density of these prompts to the outputs to develop intuition for which tokens matter most.

---

*Guide version: 1.0 — based on MiniMax Music 2.6 official docs + `weeks_of_fire` project experience.*
