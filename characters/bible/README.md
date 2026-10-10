# Character Bible — Weeks on Fire

Production-ready sheets for the **on-screen cast**. One file per character (or per tight
ensemble). Every sheet uses the same template so a writer, a prompt engineer, or an agent
can open any page and get the same five things in the same order: what they look like,
where they sit on the axes, how they talk, what happened to them, and what we will never
do with them.

> **This folder is for cast.** The fictional *crew* (Mara Vell, Julian Rook, Soren Kade,
> Nova Chen, Elio Marsh) lives in `content/staff.json` and `../staff-portraits.md` and is
> rendered in the site's Crew view. Long-form crew pages — plus **Roley Voss**, who has no
> portrait and is not in `staff.json` — live in [`../../docs/crew/`](../../docs/crew/README.md).
> Do not mix them.

---

## The three tiers of character doc

| Tier | Where | What it is |
|---|---|---|
| **Staging** | [`../suggested-characters.md`](../suggested-characters.md) | Seeds. One paragraph, a look, three sample lines. Anyone may add here. |
| **Bible** *(this folder)* | `characters/bible/` | Committed. Backstory is decided, voice is fingerprinted, tone rules are enforceable. |
| **Catalog** | `content/characters.json` → `src/data/generated/characters.ts` | What the hub actually renders. Short. Codegen only — never hand-edit the generated file. |

A character graduates staging → bible when somebody needs to write three pages of them and
cannot afford to re-decide who they are. A character graduates bible → catalog when they
have a portrait or an episode.

---

## Status legend

Every sheet's header carries one:

| Status | Means | Obligation |
|---|---|---|
| **concept** | Committed on the page, not yet on screen. | Nothing yet. Do not contradict the sheet. |
| **active** | In at least one drafted scene or episode. | Changes to voice/look need a note in the sheet's changelog line. |
| **recurring** | Appears across episodes as a motif, not a plot. | The **Do / Don't** section is binding. Breaking it is a series-level decision. |
| **retired** | Deliberately finished. | Do not revive without a written reason. |

---

## Index

| Sheet | Status | Primary episodes |
|---|---|---|
| [Vivienne Vale](vivienne-vale.md) | recurring | Ep1 · Ep4 (back wall) · House of Mirrors Rally |
| [Liliane Vale](liliane-vale.md) | recurring | Ep1 · Ep4 (back wall) · House of Mirrors Rally |
| [The Pizza Guy](the-pizza-guy.md) | recurring | Ep3 · Ep4 · every crossover |
| [Justine](justine.md) | active | Ep3 (Monster Mash, ping-pong) |
| [Qing Rao](qing-rao.md) | active | Ep3 (Monster Mash) · building lobby cameo |
| [Jackalyn](jackalyn.md) | active | Ep3 (ping-pong, wellness) |
| [Madelin](madelin.md) | active | Ep3 (Monster Mash, ping-pong) |
| [HOA Cast](hoa-cast.md) — Karen · Brad · Dale · [Peggy Babcock](hoa-cast.md#peggy-babcock) | recurring (Peggy: concept) | Ep4 |
| [EyeWash Staff](eyewash-staff.md) — Oz · Continuity Voice · Marguerite Flood · S&P Skeleton | concept → active | Master Control, 4 AM · idents |
| [Animals & Bots](animals-and-bots.md) — Black Cat · Biscuit · Pong-Bot 3000 | active | Ep3 · Ep4 · Cat POV |
| [Christina](christina.md) — alias *Christine* · the house | recurring | Sweden heart cutaway (Christina hill) — pages only |
| [Kenji "Shred" Sato](kenji-sato.md) | active | Ultra Screech commercial · Big City cutaway · the 4-second sting |
| [Liminal Cutaways](liminal-cutaways.md) — Night Laundromat Attendant · Velvet Rope Bouncer · Laundromat Saints | active (Bouncer: concept) | 2AM Laundromat Slow Dance · Velvet Rope (Ep5 opener candidate) |
| [Strand](strand.md) — the Home Sweet Void coffee-house snake | active | Home Sweet Void table packet |
| [Relationship Map](relationship-map.md) | — | all |

Also cast, documented elsewhere and **not duplicated here**:

- **Rubella Vale & Lillith Vale** — [`../building-cast.md`](../building-cast.md) (plus Madelyn, Qing).
- **Riley Smith** — [`../riley-smith.md`](../riley-smith.md). That file is already bible-grade; treat it as one of these.
- **The Radio Voice (Episode 2)** — documented at the bottom of
  [`eyewash-staff.md`](eyewash-staff.md#the-radio-voice-episode-2), because the only thing
  anyone needs to know about him is his relationship to the Continuity Voice.
- **Scarlet** (silent third in black lace, Ep3 *Spooky Telephone Poles*) — catalog entry only,
  `content/characters.json`; cameo rules in `notes/callback-bank.md`. No sheet yet.
- **Staging:** as of 2026-10-10 every seed in
  [`../suggested-characters.md`](../suggested-characters.md) carries a 🎓 marker. New seeds
  start there.

---

## How to use a sheet

**Writing a scene.** Read *Voice guide* and *Do / Don't*. The personality matrix is for when
two characters are in the room and you need to know who yields.

**Writing a prompt.** Copy the **Appearance** bullets verbatim into the Grok Imagine prompt.
They are written to be pasted. The "never change without a story reason" list is what keeps
a character recognizable across four generators and eleven months.

**Adding a line.** If it contradicts *Do / Don't*, the line is wrong, not the sheet. If the
line is better than the sheet, change the sheet in the same commit and say so.

**Adding a character.** Copy [the template](#sheet-template) below. Do not ship a sheet with
a multi-option backstory — that is what staging is for.

---

## Canon decisions made in this bible

These resolve real contradictions across existing files. They are reversible; they are
recorded here so a reversal is deliberate rather than accidental.

### 1. There are two Vale pairs, and the show never explains it

| Pair | Who | Register | Home files |
|---|---|---|---|
| **The Two** | Vivienne Vale · Liliane Vale | Glamour-apocalypse. Ballrooms, galas, burning towns, the back wall of an HOA meeting. | [`../the-two.md`](../the-two.md), this bible, `notes/scenes/house-of-mirrors-rally.md` |
| **The building pair** | Rubella Vale · Lillith Vale | Exhausted domestic. Laundry rooms, elevators, lawns, ridge roads. | [`../building-cast.md`](../building-cast.md), `content/characters.json`, `notes/scenes/` |

Four women, one surname, no stated relation. **Nobody on screen ever remarks on the name.**
Do not write a scene that asks. Do not write a scene that answers. If the four are ever in
one frame, the joke is that the framing treats it as unremarkable.

*(Catalog: `content/characters.json` carries all four Vales, each with its own entry —
Vivienne and Liliane with `bibleSheet` links to this folder.)*

### 2. Qing Rao is one person, and she is the one with the skull

`../building-cast.md` describes Qing Rao as a male ex-systems engineer with noodles;
`../suggested-characters.md`, `content/characters.json`, and
`episodes/episode-03/monster-mash-finale.md` describe her as the woman on the Halloween lawn
with the crystal skull. **Committed: she/her, the lawn version.** The lobby-with-noodles
cameo in *Car Twelve, This Is Twelve* is the same woman on a different night; the systems
knowledge is real and is now hers. The male reading is filed under *Rejected / alternate* in
[her sheet](qing-rao.md#rejected--alternate).

### 3. Madelin and Madelyn are two different people

- **Madelin** — Episode 3 lawn and ping-pong. Tote bag, gravity, cheerful disaster. [Sheet here](madelin.md).
- **Madelyn** — the building's laminated HOA enforcer in [`../building-cast.md`](../building-cast.md). Never seen; a voice on an intercom and a piece of laminate.

They are one letter apart and they are not the same character. This is a **production
hazard, not a mystery** — see [Open questions](#open-questions-do-not-resolve-casually) for the rename proposal.

### 4. Backstory for The Two is committed

*The Swappers* (gala-revenge pact) is now canon for Vivienne and Liliane. The four other
hooks in `../the-two.md` are retained as a *Rejected / alternate* appendix on each sheet so
nothing is lost, but they are no longer live options.

---

## Open questions (do not resolve casually)

| Question | Status | Who decides |
|---|---|---|
| Rename building-cast **Madelyn** (proposal: **Marilyn Ocasek**, or fold her into Karen, whom she already shares three lines with) | Open — recommended | Series owner |
| Add Vivienne and Liliane to `content/characters.json` so the hub's Characters view carries all four Vales | **Done** — both entries exist with `bibleStatus` + `bibleSheet` | — |
| Whether the Continuity Voice and the Radio Voice are the same person | **Locked as unresolved.** `docs/season-arc.md`. Never confirm on screen. | Nobody. It stays open. |
| Whether the Pizza Guy knows | **Locked as unresolved on screen.** The sheet commits an answer for the writers' room only; it is never spoken. | Nobody. |
| Cast UI (`src/data/cast.ts` + a Cast view beside Staff) | **Mostly covered** — the Characters view (`src/components/Characters.tsx`) already renders `bibleStatus` badges and links each `bibleSheet`. A separate Cast view is only needed if ensemble sheets (HOA, EyeWash, liminal) need their own cards. | Catalog maintainer |
| Rubella and Lillith called **"Vale sisters"** in `episodes/episode-02/studio-huddle.md:292` (a production note). Canon is *no stated relation*; Rubella says "roommate" in *Rubella Stand-Up*. Scarlet's catalog role also says "third sister." | Open — recommend rewording both notes to "Vale pair" / "silent third" | Series owner |
| The **third woman in black lace** on the Ep3 finale couch (`episodes/episode-03/monster-mash-finale.md`, "three women in black lace + Justine") is never named. Scarlet is the obvious candidate. | Open | Series owner |
| **Karen holds swatches** in the Ep4 911 beat (`episodes/episode-04/scenes.md`, *Call Forty-Seven*). Swatches are Brad's prop everywhere else ("He always has swatches"). | Open — recommend Karen's clipboard instead; bible sheets unchanged | Series owner |
| Pizza Guy's Ep4 doorway uniform: "slightly wrong uniform" (`episodes/episode-04/scenes.md`) vs. "red uniform" (`notes/scenes/item-three-decorative-accent.md`). | Open — either reading fits the rotation rules; pick one before the shoot | Series owner |

---

## Sheet template

Copy this whole block into a new file. Delete nothing; write "—" if a row is genuinely empty.

```markdown
# Name

**Status:** concept | active | recurring | retired
**Primary episodes:**
**Role in one sentence:**

## Logline bio

Two or three sentences. Production-hub ready — this is what a stranger reads first.

## Appearance (consistent prompt anchors)

- Hair / face / wardrobe anchors — bullet list, copy-paste for Grok Imagine
- Signature props
- **Never change without a story reason:** …

## Personality matrix

| Axis | Pole A | Pole B | Where they sit |
|------|--------|--------|----------------|
| Control | | | |
| Empathy | | | |
| Chaos tolerance | | | |
| Verbal style | short | ornate | |

## Voice guide

- **Sentence length:**
- **Vocabulary (overuses / refuses):**
- **Humor type:**
- **Sample monologue** (6–10 lines, in character)
- **Sample exchanges** (at least two, with different partners)

## Backstory (committed)

- **Origin:**
- **Formative incident (series-relevant):**
- **Secret they protect:**
- **What would break them on screen:**

## Arc hooks

Three or more episode seeds.

## Music / song affinity

Which Minimax tracks or moods fit them.

## Do / Don't
```

### House rules for every sheet

- **Committed, not multi-choice.** One backstory. Alternates go in a *Rejected / alternate*
  appendix at the bottom, clearly marked dead.
- **Three or more sample monologues or exchanges** for a core character. One-liners are
  staging material; a sheet needs paragraphs so a writer can hear the rhythm.
- **Portrait prompts are text.** No new large binaries in this repo — see `CLAUDE.md`.
  Write the prompt; run it later.
- **The sheet is not the screenplay.** Bible sheets inform future rewrites. They do not
  change `episodes/*/screenplay.md` or `episodes/*/scenes.json`.

---

*Made with Grok Imagine magic ✨*
