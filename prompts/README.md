# Prompts

Store all Grok Imagine prompts here for reproducibility and iteration.

## Organization
- `hero/` – **max-density hero shots**: 14 key frames across the series, each with wide / medium / close-up siblings that share locks and change only framing. Index with character counts: [`hero/README.md`](hero/README.md). Rules: [Hero prompts](#hero-prompts) below.
- `locks/` – paste blocks that every hero prompt of a character or place carries **verbatim** (The Two, Pizza Guy, Black Cat, Rubella, the Ep3 yard, EyeWash master control, the house avoid list). `python3 scripts/check-hero-prompts.py` fails a prompt that names a locked character without its block.
- Every `*-segments.md` that a cutaway uses can be rendered to stills in one pass: `python3 scripts/xai-batch.py prompts/<name>-segments.md --dry-run` lists the prompts it would send; drop `--dry-run` (with `XAI_API_KEY` set) to generate. See `AGENTS.md`.
- `characters/` – reusable character portrait/action prompts
- `episodes/` – per-episode scene prompts
- `templates/` – base prompt templates you copy and customize
- `choose-your-basalt-segments.md` – timed Grok Imagine + Gemini Omni prompts for the Choose Your Basalt cutaway (also on the site Suggestions view)
- `spooky-telephone-poles-segments.md` – timed Grok Imagine + Gemini Omni prompts for the Halloween dialog cutaway *Spooky Telephone Poles* (Lillith, Rubella & Scarlet)
- `monster-mash-finale-segments.md` – timed Grok Imagine + Gemini Omni prompts for the Ep3 Halloween finale *Monster Mash* (Rubella cover + Amy & Alec cameo dance + Thriller werewolf moonwalk + Spy vs. Spy reveal) — long-form maxed-detail prompts
- `molten-silver-sphere-segments.md` – three maxed-detail Grok Imagine + Gemini Omni video prompt variations for the abstract *Molten Silver Sphere* cave cutaway (also on the site Suggestions view)
- `studio-huddle-segments.md` – timed Grok Imagine + Gemini Omni prompts for the Ep2 meta dialog *The 480p Studio Huddle* (Mara, Rubella & Lillith) — also on the site Suggestions view
- `the-long-way-up-segments.md` – hour-by-hour Grok Imagine + Gemini Omni prompts for the *Episode 5 candidate* wordy-episode dialog scene *The Long Way Up* (Rubella, Lillith & Riley Smith) — 2:10 PM flat sun through 9:40 PM firelight; every prompt names its light so the day can't collapse into one hour. Quiet-mile insert (no separate prompt file yet): `notes/scenes/no-other-human-sounds.md`. Episode 4 spine is HOA (`docs/season-arc.md`).
- `eyewash-idents-segments.md` – six 5–10s EyeWash Station bumpers (Please Stand By, Rinse Cycle, Unscheduled Programming, Aspect Ratio Matters, We Always Return, 3:44 Again)
- `cat-pov-segments.md` – silent black-cat witness cutaway (~70–90s, no dialog; same animal as Episode 3)
- `glam-sham-poo-segments.md` – timed Grok Imagine + Gemini Omni prompts for the *Ultra Screech* joke-commercial cutaway (Kenji, Rubella & Lillith) — ten segments conformed to the ~2:51 `Ultra_Screech_2_with_scream.mp3` bed, beat-by-beat board, ten stills-to-video packets, a joke-network graphics layer and a reusable 4s chant sting
- `big-city-segments.md` – timed Grok Imagine audio-stem packets for the *Big City* catalog single (~2:47 option_a bed): small Glamora club stage A-roll + hair-as-skyline B-roll (fire-escape strand, fringe canopy, lunch-volume dos, ELO afro argument). Mouths on for stage, mouths off for hair-city. Not the Ultra Screech ad.
- `the-soft-gyre-segments.md` – 30s psychedelic 3D abstract: glowing gel blob above anvil clouds, sparks + jello weather; eight-slot prompt stack + five 6s shots
- `chroma-bath-segments.md` – eight timed Grok Imagine + Gemini Omni prompts for *Chroma Bath* (~2:00), the pure-color abstract with no object in it at all. One processing dialect per segment: ink bleed → video feedback → slit-scan → datamosh → refraction → print misregistration → granulation → bleach. Includes an eight-slot prompt stack (FIELD / FORM / PROCESS / PALETTE / GRAIN / EDGE / CAMERA / MICRO), a detail bank, a full-run single-take prompt, and a generate order that starts with the hardest shot. Sibling to *Molten Silver Sphere* and *The Soft Gyre*. Suggestions id `chroma-bath`.
- `mountain-lion-wildflowers-segments.md` – 8 timed Grok Imagine + Gemini Omni clips for the POV-leash *Mountain Lion Wildflower Field* cutaway (~2:20): flowers → ocean crossing (which is also the two-bed crossfade) → far-shore flowers → multi-lion clearing. Includes a drag-corridor swap bank and alternate destinations.
- `marble-tick-tack-segments.md` – 13 timed Grok Imagine + Gemini Omni clips for the *Marble Tick Tack* animation bridge (cabinet → Rodin cyclotron → jump gap into magnetic gears → lawn tower / three-phase orbit + rod tumble → ferrofluid rain → bound pair home → jump gap into the Gauss chain). 136 BPM lock, cylinder bodies, jump-gap rules and a dancer bank. Written long on purpose; per-clip job/feel/dancer notes sit above each prompt pair.
- `marble-tick-tack-worlds-segments.md` – 15 timed Grok Imagine + Gemini Omni clips for the sibling *Marble Tick Tack: Wrong Sets* (cabinet HUD → desert Halbach → woods lion → ice Meissner → space bottle → London maglev → Seoul gears → souvenir chain)
- `home-sweet-void-segments.md` – timed Grok Imagine + Gemini Omni I2V packets for the *Home Sweet Void* table cutaway (bag greeting → space-speeding talk → floor sneak → sit-up cut → coffee-house callback → cat glow-stop). Dialog visual experiment, not a musical. Suggestions id `home-sweet-void`.
- `well-fall-segments.md` – timed Grok Imagine + Gemini Omni packets for *Well Fall* (~90s instrumental heavy metal). Lip locked; six open fall-sights plus an open bottom. Replace `[SIGHT]` after filling `ideas/well-fall.md`. Suggestions id `well-fall`.
- `riley-space-cop-segments.md` – timed stills-to-video packets for *Riley Was a Space Cop* (table door + Annex years + scenery holds). Suggestions id `riley-space-cop`.
- `short-packet-farm-segments.md` – boards for the three generate-first short packets on the joke / strange-3D shelf: `bag-at-chest-height` (5s seamless loop tile, mail room), `we-will-stand` (7s joke interrupt, HOA clubhouse) and `the-approval-desk` (30s strange-3D gag, honey-oak office). Beat lists, continuity tokens, 4–6 long-form stills each, motion prompts, loop in/out notes and clip_stacker blocks. Catalog: [`ideas/short-packet-farm.md`](../ideas/short-packet-farm.md); loop rules: [`ideas/loop-grammar.md`](../ideas/loop-grammar.md).
- `seed-casts-twice-segments.md` – Reiniger shadow-puppet visual experiment *The Seed Casts Twice* (30s silent gag, Desmet amber field): parser-conformed S0–S4 with long-form Imagine start/last pairs for S1 split and the S3→S4 hold, numbered paper generations G0–G3 as swap plates, replacement-puppet disc close-up. Catalog: [`ideas/seed-casts-twice.md`](../ideas/seed-casts-twice.md). Paper Lung queued, not required. Suggestions id `seed-casts-twice`.
- `magnet-clack-voyage-a-motion.md` – *Magnet Clack / Voyage A* visual experiment (not a cutaway, no song): paste-ready start/last/motion jobs for C2 corner, D beach and H lava, failure modes, shared negative line, silent stack order. Held rooms A/B/E/F/G not written yet.
- `waterslide-segments-a.md` – cut-between bank File A (segments 01–13) for the Waterslide song. No people; one empty yellow inner tube only. Placeholder timing until drop map. User seeds: tall jungle (01), futuristic (02), purple marble (03).
- `waterslide-segments-b.md` – cut-between bank File B (segments 14–26). Same rules. 26 ends the bank: splash into kiddie pool at the base of slide 01.
- `waterslide-segments.md` – 28 slide-cam Grok Imagine start stills + motion prompts for the *Waterslide* music video (rider-less, mouths off; jungle, glacier, purple marble, futuristic, hologram, motel baby slide and 22 more). Catalog table, three shared cut tokens (bank-right, spray-flash, slide-cam height), a drop beat per clip, match-cut pairs, a fully timed Run A against the ~77.4s render's pulse grid (0.325s) and section map, lighter Runs B and C, a generate-hardest-first order and a shared negative line. Audio is the owner's upload and is not in the repo.
This folder makes it easy to regenerate or evolve visuals later.

---

## Hero prompts

Most prompts in this folder are timed segments. A **hero prompt** is the other kind: one key frame
written to the edge of what the model will hold, so a regenerate months later lands on the same
picture. They live in [`hero/`](hero/), one shot per file, and share [`locks/`](locks/).

### 1. Length

- **Target 1,500–3,500 characters** per framing. The house cap is **3,500**; the checker errors
  above it and below **1,200**, and warns below 1,500.
- **The cap is ours, not the API's.** xAI publishes no prompt-length limit for
  `POST /v1/images/generations` (docs.x.ai, checked 2026-11-21: pricing is flat "regardless of
  prompt length"). If a model with a real limit is used, check against it minus ~5%:
  `python3 scripts/check-hero-prompts.py --cap 3000`.
- The segment files' older guidance (~1,000–1,300) still holds for **timed segments**, where many
  prompts must cut together. Hero prompts are single frames and can afford the full run.
- **Trim order** when a model drops detail or truncates: micro-detail → background props → grade
  adjectives → environment layers. **Never** a lock block, never the lighting sentence.

### 2. Structure (one paragraph, in this order)

A short format header first (`Photoreal cinematic film still, 16:9 medium shot …`), then:

1. **Subject identity locks**: the lock block(s), pasted verbatim
2. **Action / pose / relationship** in frame: who is where, what the hands hold, who looks where
3. **Environment**: architecture, era, decay, weather, set dressing
4. **Lighting**: motivated sources with color temperatures; what each source hits
5. **Camera**: lens mm, height, move or lock-off, aperture or depth of field
6. **Material & micro-detail**: weave, condensation, dust, moths, fingerprints
7. **Grade / film stock / atmosphere**
8. **Style anchors**: photoreal, cinematic still, not illustration
9. **Avoid list**: the `house-negative` block, last, as a "No …" sentence

One paragraph, one line in the file. Bullet "locks" live in the lock files, not in the prompt.

### 3. Continuity blocks

- Every character or place that recurs has a lock file in [`locks/`](locks/) with named
  `## Paste · <name>` blocks (`full`, `face`, `distant` …). A prompt declares the blocks it uses on
  its `- **Locks:**` line and must contain each one **verbatim**.
- A lock file can list **trigger words** (a name, "pizza delivery", "black cat"). A prompt that
  contains a trigger word without that file's block fails the check. That is how "The Two and
  Pizza Guy locks wherever those characters appear" is enforced rather than hoped for.
- Change a character's look **in the lock**, then run `--write` and fix every prompt the checker
  flags. Never hand-edit the look in one prompt.

### 4. Variants

Each hero shot has three framings that share the same locks and lighting sentence and change
only framing, lens and what is legible: **W · Wide**, **M · Medium**, **C · Close-up**. Key art
uses **H · Horizontal 16:9**, **V · Vertical 2:3**, **S · Square 1:1** instead. Each file also
carries a **negative twin** (for tools with a separate negative field), a **video companion**
(Grok Imagine I2V / Gemini Omni, starting from one of the stills) and **regenerate notes**.

### 5. No empty adjectives

Every adjective implies a visible material or a light behavior. "Moody" is not a light;
"a hard 2700K bulb directly overhead dropping the eye sockets into shadow" is. The checker bans
the worst offenders outright: *stunning, beautiful, gorgeous, breathtaking, masterpiece, amazing,
awesome, epic, majestic, ethereal, dreamy, mesmerizing, 8k, 4k, trending on artstation*.

### 6. Text

Text is the first thing that breaks a still. House numbers, name tags, badges, channel numbers:
unreadable, every time (`house-negative/still`). The only framings allowed legible text are the
ones whose prompt spells it out and uses `house-negative/still-stated-text` (H07-C's 23%, H10-C's
clipboard sticker). Titles on key art are added in post; the prompt reserves the space.

### Tooling (stdlib only)

```bash
python3 scripts/check-hero-prompts.py            # all rules above; exit 1 on any error
python3 scripts/check-hero-prompts.py --write    # rewrite Characters lines + hero/README.md index
python3 scripts/check-hero-prompts.py --print H07-M
python3 scripts/xai-generate.py "$(python3 scripts/check-hero-prompts.py --print H07-M)" -o images/hero/h07-m.jpg
python3 scripts/generate-prompts.py --max-density "night laundromat, two strangers" --lock house-negative/still
python3 scripts/generate-prompts.py --variants prompts/drafts/my-hero.txt
python3 scripts/generate-prompts.py --count "any prompt text"
```

`npm run test:py` runs the checker against the real library, so a drifted lock fails CI.

