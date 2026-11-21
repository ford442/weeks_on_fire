# House negative lock (the avoid list)

**Canon:** prompts/README.md, "Hero prompts" rule 2 (avoid list last) · bible "never" rules for every
character · CLAUDE.md (no large binaries; text prompts only)

**Used by:** every hero prompt. The checker fails a framing that does not declare one of these.

Grok Imagine has no separate negative field, so the avoid list rides at the **end** of the
positive prompt as a "No …" sentence (`still`, `still-stated-text`, `poster`). For tools that do take a
negative prompt, each hero file also carries a **negative twin**: the same list as bare
comma-separated terms, with the shot's own extras appended. Start the twin from `twin` here.

## What the blocks lock (and why)

- **Text is the first thing that breaks a still.** House numbers, name tags, channel numbers,
  clipboard stickers, car badges: every one is "unreadable" or "no text" unless a shot is
  specifically about the text. Only two hero framings are: H07-C (the phone at 23%) and H10-C
  (Karen's clipboard sticker). They use `still-stated-text`, which allows exactly the text the
  prompt spells out and nothing else.
- **No real brands.** The car in H03 is described, not named; logos are unreadable.
- **Anatomy failures** (extra fingers, fused hands, doubled heels) are the second thing that
  breaks a still, so they are named on every prompt.
- **Style drift:** a photoreal hero still must not slide into illustration, 3D render, anime or
  "AI glossy" skin. The 1990s cel register (Ep4 chase) is not a hero register and has no block.
- **No HDR halos, no oversharpening:** a filmic grade is mostly about what the highlights do.

## Paste · still

```text
No text, no captions, no watermark, no signature, no readable logos or brand names, no legible house numbers or name tags, no extra or fused fingers, no extra limbs, no duplicated faces, no warped hands on props, no illustration, no cartoon, no 3D render look, no anime, no plastic airbrushed skin, no HDR halos, no oversharpening, no lens-flare spam, no modern smartphone UI unless stated.
```

## Paste · still-stated-text

```text
No text anywhere except the exact words or numbers spelled out above, no captions, no watermark, no signature, no readable logos or brand names, no legible house numbers or name tags, no extra or fused fingers, no extra limbs, no duplicated faces, no warped hands on props, no illustration, no cartoon, no 3D render look, no anime, no plastic airbrushed skin, no HDR halos, no oversharpening, no lens-flare spam.
```

## Paste · poster

```text
No title text, no credits block, no tagline, no watermark, no readable logos or brand names, keep the reserved title area clean and free of fine detail, no extra or fused fingers, no extra limbs, no duplicated faces, no illustration, no cartoon, no 3D render look, no plastic airbrushed skin, no HDR halos, no oversharpening.
```

## Paste · twin

```text
text, captions, watermark, signature, logo, brand name, readable house number, readable name tag, extra fingers, fused fingers, extra limbs, duplicated face, warped hands, illustration, cartoon, 3d render, anime, airbrushed skin, plastic skin, hdr halos, oversharpened, lens flare spam
```
