---
id: all-the-way-down
title: All the Way Down
added: 2026-11-23
genre: 1959 doo-wop slow-dance ballad, sincere, over a literal fall
description: "A prom-night crooner sings about falling for you, all the way down, while the Well Fall POV really falls. Six sights go past. At the last one, a bat at the poker table finally looks up."
episode: Drawer / alternate score for a locked video (not promoted)
tags: [drawer, well, fall, doo-wop, ballad, alternate-score, wrong-channel, adult-dry, pov]
instrumental: false
audioFile: null
---
# All the Way Down — drawer sketch

**Drawer.** `promote?: no`. Not in `songs/` proper, not codegen'd, no `songId` bound.
Register: **dry / adult** (not kid-silly). Planner steering: the one non-kid song this week.

## Video first

**Sits on:** `content/cutaways/well-fall.json` (Musical, Suggestions id `well-fall`),
edit timeline and continuity lock in `prompts/well-fall-segments.md`. A is locked; this
sketch proposes fills for open slots B–H from the existing `sightBank` (no new sights).

**Deliberate variation, and what changed:** `songs/Well_Fall.md` is the instrumental metal
bed and stays the cutaway's song. This is an **alternate score for the same picture**, the
wrong-channel engine: a sincere 1959 slow-dance ballad about "falling for you" laid over a
real, endless fall. Same 1:32 edit, same beat boundaries, so the owner can A/B the two
tracks on one cut. It does not replace Well Fall, and it is not a second song bound to
the cutaway until the owner says so. One sight is modified: `bats-poker` says "none of
them look up"; here, one bat looks up on the very last frame. That is the end reaction.

`laugh:` A man sings a love song about falling while we really fall down a well, and the bats are too busy playing cards to notice.
`drop:` **Transforms.** At 0:10 the lip becomes a tunnel and the pigeons on the pipe all turn their heads at once as the band comes in.
`end reaction:` one bat at the poker table looks up as we pass (G, 1:19). Spent once.
`do-not:` show the singer or any mouth; put a band, a face or text in the well; let the song land on the tonic; let anything at a sight react except the one bat (the drop's pigeon head-turn at 0:10 is the only other allowed reaction); fade out.
`promote?:` no.

## Video use map

- **Target length:** 1:32, matching the `well-fall` edit timeline exactly (A 10s, B 10s,
  C–H 12s each). 66 BPM in 12/8 shuffle, one 12/8 bar ≈ 3.64s, so each 12s sight is about
  three and a third bars; cut on the nearest bar line, picture leads.
- **Clips (Grok Imagine, chained):** A = 10s, used whole (locked still `images/well-fall/wf-a-lip.jpg`).
  B = 10s, used whole. C–G = 15s each, trimmed to 12s (drop the first 1.5s and last 1.5s).
  H = 15s, trimmed to 12s. Chain rule: the last frame of each clip (shaft only, no sight in
  view) is the start still of the next. Paste the continuity lock into every take.
- **Pattern:** verse on the fall, chorus on the sight. Each chorus line "all the way down"
  lands as a sight enters frame; the shaft between sights carries the verse.
- **Breaks:** (1) 0:00–0:08, the doo-wop "intro" is one held bass vocal note and the well
  drip only. (2) 1:08–1:10, the band stops for two seconds; the drip comes through alone.
  (3) **written silence, 1:28–1:32, four seconds, unscored**: the final chorus is cut off
  mid-word at 1:28 and the picture keeps falling in silence. Never filled, never faded.
- **Mouths:** **off**. No faces in the well except the bats and the two diners, who never
  open their mouths. The singer is off-screen and non-diegetic, like the metal.
- **Diegetic sound:** the well drip, air in the shaft, the vending machine's hum as we pass
  E (two seconds), a single poker chip click at G. Nothing else.

## Sight fills (from the existing sightBank)

| beat | time | sight id | note |
|---|---|---|---|
| B | 0:10–0:20 | `pigeons-on-pipe` | the drop: every head turns as the band enters |
| C | 0:20–0:32 | `balcony-dinner` | two diners, candle, not looking down; the "dance" sight |
| D | 0:32–0:44 | `shower-course` | one ring of clean grout |
| E | 0:44–0:56 | `vending-machine` | humming, fully stocked, one row empty. We do not stop |
| F | 0:56–1:08 | `moon-window` | the moon in the brick, for the moon line |
| G | 1:08–1:20 | `bats-poker` | full table, hanging bulb; on the last frame one bat looks up |
| H | 1:20–1:32 | none (still falling) | the bottom never arrives; silence from 1:28 |

## Drop map (picture time = song time)

| time | picture | sound |
|---|---|---|
| 0:00–0:10 | A: the lip, the tip, the commit. | One held bass "ooo", the drip. Piano triplets in at 0:08. |
| 0:10.0 | **DROP.** Lip becomes tunnel; pigeons turn their heads. | Full band in: brushed kit, upright bass, tenor sax, backing "ooh-wah". Verse 1. |
| 0:20–0:32 | Dinner on the brick. | Chorus: "All the way down". |
| 0:32–0:56 | Shower tile, then the vending machine. | Verse 2, then the hum alone for two beats. |
| 0:56–1:08 | Moon in the brick. | Bridge (tagged [Breakdown]), sax answers. |
| 1:08–1:10 | Shaft, bats coming up. | Band out, drip only. |
| 1:10–1:19 | Bats at poker. One chip click. One bat looks up. | Final chorus. |
| 1:20–1:28 | More shaft. | Final chorus continues, key unresolved. |
| 1:28–1:32 | Still falling. | **Silence.** Cut mid-word. No fade. |

## Callbacks spent

- **Juxtaposition: the wrong channel, full commitment** (bank). A prom ballad on a well fall,
  never acknowledged, sung completely straight.
- **The vending machine** (bank). Sight E, one row empty, we do not stop. "The coil does not
  negotiate" holds: no product falls, nothing is bought.
- **Nothing happening, extremely well** (bank). The 1:28 four-second written silence,
  labelled with its length, never scored.

STYLE:

1959 doo-wop slow-dance ballad, 66 BPM, 12/8 shuffle, B-flat major, about one minute thirty-two, sincere and romantic with no wink, warm male lead tenor crooning close to the mic, four-part male backing vocals on ooh and wah, a deep bass vocal holding one note alone in the intro, piano playing gentle triplet chords, upright bass, brushed snare and soft kick, a breathy tenor sax answering the lead between lines, mono-leaning vintage room sound with light spring reverb, the melody keeps stepping down and never resolves to the home chord, the final chorus stops dead mid-word with no fade and no ending chord, no modern drums, no synths, no comedy sound effects, no spoken lines

LYRICS:

[Intro]
Ooo

[Verse 1]
I stepped up to the edge tonight
The porch light far away
I didn't look, I didn't think
I didn't need to stay

[Chorus]
All the way down
I'm falling for you
All the way down
The sky's getting small
All the way down
I never touch ground
I'm falling for you
All the way down

[Verse 2]
I passed a couple eating dinner
They didn't look my way
I passed a light still humming
I didn't stop to pay

[Breakdown]
The moon is in the wall, my darling
The moon is in the wall
I'll tell you when I land, my darling
If I land at all

[Final Chorus]
All the way down
I'm falling for you
All the way down
The sky's just a dot
All the way down
I never touch ground
I'm falling for you
All the way

NOTES:

- **Not Well Fall.** No metal, no riff, no double-kick. Same picture, other channel. Well Fall
  stays the bound song; this is an A/B alternate for the owner.
- **Not Hold the Note / Heavy Water / Lace Waterfall** (the other well-tagged songs): no cast
  vocal, no Lace Waterfall, no Rubella. The singer is an unnamed off-screen crooner.
- **Hook = title**, sung eight times. The final "All the way" is cut before "down" on
  purpose: the bottom never arrives, which is Well Fall's structural flaw, kept.
- **Open questions stay open:** what is at the bottom, and whether there is one.
- STYLE is one comma line, about 820 characters.

Farm: songs → #18/#33, picture pairing → #22, never #42
