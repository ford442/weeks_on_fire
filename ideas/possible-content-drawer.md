# Possible Content Drawer — songs, shorts, jokes (promote?: no)

*Mara Vell. Pages, not picture. 2026-09-28.*

A drawer, not a farm sheet. Every card below is **text only**, has **no still attached**, no
cutaway id, no Suggestions id, no `content/` file and no bound `songId`. Nothing here is on
the live picker. `promote?: no` on every card. Most of these stay in the drawer, and that is
the drawer working.

**Session:** F · **Farm:** songs [#18](https://github.com/ford442/weeks_on_fire/issues/18) /
[#33](https://github.com/ford442/weeks_on_fire/issues/33) · picture
[`notes/issue-22-possible-drawer.md`](../notes/issue-22-possible-drawer.md) (#22) ·
**not** [#42](https://github.com/ford442/weeks_on_fire/issues/42) · Glam echo only via #32
and only as *not a second ad* (no card below touches Glam, so #32 is not invoked).
**Siblings:** [`possible-ladies-house.md`](possible-ladies-house.md) ·
[`possible-joke-commercials.md`](possible-joke-commercials.md) ·
song sketches [`../songs/_drawer/`](../songs/_drawer/)
**Parents:** [`short-packet-farm.md`](short-packet-farm.md) · [`loop-grammar.md`](loop-grammar.md) ·
[`../characters/building-cast.md`](../characters/building-cast.md)

## What it is

Twenty-two cards across five shelves: four song sketches, four short animations, four
jokes, four joke commercials (own file), six beats at the ladies' building unit (own file).
One card per idea. Each names a **type**, a **shelf**, and a **start JOB → last JOB** in
words. The four types of the series hold: musical cutaway, commercial interrupt, micro duel,
visual experiment. Nothing here is an episode.

## What it is not

Not a second Ultra Screech, not Rinse Formula, not a Glam College ad. Not a new Daisy
girl or a new Daisy theme. Not a third Christina aria. Not a Riley retrieval. Not a Night
Grove rematch. Not the long HOA / EyeWash / Laundromat season (#19 stays parked). Not
twelve more 90s animals. Not codegen.

## Locks

- Worlds do not mix: Daisy field / night-lot / HSV table / Annex / Christina hill / Night
  Grove / Glamora / Lightning warehouse / ladies' building unit. Every card names one.
- Night-lot appears only in Roley's lane. No card below uses it.
- Ladies stay Grok Imagine building-cast. No real actor names, ever.
- Song sketches are sketches: no `songs/*.md` at the top level, no `audioFile`, no bound
  `songId`. Promotion is a copy into `songs/` **after** a Nova pass, then codegen by whoever
  promotes.
- Loops obey [`loop-grammar.md`](loop-grammar.md): last frame = first frame, one moving
  system, rest pose, silent picture but for one click.
- One echo per joke, at most. Allowed echoes: *"That's not even a planet."* / *"We're expected
  back down to Earth. Right away."* / *"The bag stays at chest height."* / *"You're walking?"* /
  the Rubella yawn.

---

## Songs (4) — `songs/_drawer/`

Farm: #18 / #33. None replaces a neighbor. None is Daisy, Hanshaw, Ultra Screech, Big
City, Lightning, or Well Fall. Skip Nova (Night Side and Cue Sheets exist).

| id | lane | bpm / key / length | who sings | start JOB → last JOB | neighbor it must not replace | promote? |
|----|------|--------------------|-----------|----------------------|------------------------------|----------|
| `wet-enamel` | musical-cutaway | 96 / B♭m / ~1:40 | instrumental; one Rubella spoken tag at the out | colour enters the grout → colour reaches the drain and stops | *Hanshaw Underscore* (indoor heart) · *Motif Refuses the Peak* | **no** |
| `neutral-zone-laundry-bed` | house-bed | 92 / D / 34s loop | instrumental + one detuned intercom chime | first dryer thunk → last intercom tick | *The Laundromat Saints* · *Rinse Cycle* | **no** |
| `bed-with-a-door` | crew-album (Julian Rook: *Slate*, no file yet) | 100 / Gm / 1:10 | instrumental | count-in on a clipboard → one latch at 1:08 and it is over | *Cue Sheets* (sung, Nova) · *Marble Tick Tack* (Roley) | **no** |
| `sting-form-received` | sting | ~108 feel / no key / 10s | nobody | rubber stamp → chair creak → intercom tick | *Sting, Four Frames Late* (Nova) · the 4s GLAM-SHAM-POO sting (untouched) | **no** |

Full sketches (STYLE 8–14 lines, tags, why-not list): [`../songs/_drawer/wet-enamel.md`](../songs/_drawer/wet-enamel.md) ·
[`../songs/_drawer/neutral-zone-laundry-bed.md`](../songs/_drawer/neutral-zone-laundry-bed.md) ·
[`../songs/_drawer/bed-with-a-door.md`](../songs/_drawer/bed-with-a-door.md) ·
[`../songs/_drawer/sting-form-received.md`](../songs/_drawer/sting-form-received.md)

---

## Short animations / 3D (4)

Siblings of `bag-at-chest-height`, `tare-loop`, `honeycomb-drip-tray`, `pneumatic-return`
and the cabinet-slide job. Same materials: porcelain, honey-oak, brass, geometric white
panels. Locked camera. Not the marble cabinet. No night-lot.

| id | shelf | length | Job | Picture world (one room) | Audio | Do-not | promote? |
|----|-------|--------|-----|--------------------------|-------|--------|----------|
| `lint-tray-tare` | loop | 6s | A porcelain hand pulls a dryer lint screen. The screen is clean. It slides back and latches. Start JOB: pull. Last JOB: latch. | Ladies' building laundry, one dryer, honey-oak trim | Silent + one latch | Never any lint. Never a second dryer. Not the tare-loop scale — nothing is weighed. | **no** |
| `mail-slot-return` | loop | 5s | A brass hallway mail slot lifts; an envelope goes in; the slot lowers; the same envelope is already back in the porcelain hand. Start JOB: lift. Last JOB: lower. | Ladies' building hallway, one door, brass slot | Silent + one flap | Envelope never opens, never a second envelope, never a name. Not the pneumatic tube — no carrier. | **no** |
| `thats-not-even-a-planet` | gag-30 (strange-3D) | ~30s | A lobby directory board has a brass globe where the "you are here" dot should be. A porcelain hand rotates it one click per beat. The label under it changes with each click: a country, a sea, a moon, a floor number. On the floor number, off camera, Rubella: *"That's not even a planet."* One line. Start JOB: first click. Last JOB: the line lands and the globe holds. | Ladies' building lobby, directory board, one lamp | Silent picture, one click per beat, chirp laugh track on the line | Nobody on camera. The globe never spins free. No stars, no space, no HSV table. Off-hub echo: the line does not exist on the hub yet; this card is where it enters. | **no** |
| `elevator-form-at-chest` | loop | 8s | A clipboard rides an elevator car up one floor and down again. It is held at exactly chest height by a porcelain hand that is never attached to a body. The doors are the only cut. Start JOB: doors close. Last JOB: doors open on the same floor. | Ladies' building elevator, brass panel, one laminate | Silent + one door chime | Form never signed, never read. No counteroffer (that is `elevator-counteroffer`). No night-lot, no marble cabinet. | **no** |

---

## Jokes (4) — 6–10s, one object, one room

Rooms: hallway, elevator, laundry, lobby, intercom. Audio: prior-scene echo (at most one)
plus the chirp / click laugh track. No new Minimax. Not cowboy-chimp, not the Looney cat,
not the bird flock, not Night Grove.

| id | room | length | Joke | Echo used | Do-not | promote? |
|----|------|--------|------|-----------|--------|----------|
| `hallway-thermostat` | hallway | 8s | A wall thermostat dial has three settings: COOL · HEAT · HOA. A porcelain hand turns it to HOA. The hallway light dims one step. Start JOB: reach. Last JOB: the click. | none | No slip, no meeting, no Madelyn. Not the purple-light permit. | **no** |
| `elevator-descent-notice` | elevator | 8s | A laminate on the elevator panel reads *EXPECTED BACK DOWN TO EARTH. RIGHT AWAY.* The floor indicator goes **up**. Start JOB: laminate in focus. Last JOB: indicator ticks past the top. | *"We're expected back down to Earth. Right away."* — on paper only; Riley is not in the building | No Riley, no Annex, no moons. The line is signage, not a voice. | **no** |
| `laundry-coin-return` | laundry | 7s | A washer's coin return spits one quarter back out. A porcelain hand catches it at chest height and holds it there. Nothing else happens. Start JOB: coin drops. Last JOB: hold. | *"The bag stays at chest height."* (off camera, Pizza Guy register, if at all) | No bag. No pizza. The quarter never goes back in. | **no** |
| `intercom-yawn` | intercom | 6s | The intercom buzzes. Close on the brass grille. The reply is one Rubella yawn — long, dry, on the beat — then the click. Start JOB: buzz. Last JOB: click. | Rubella yawn (first use; this card establishes it) | No face. No second line. No song under it. | **no** |

---

## Joke commercials (4)

Own file: [`possible-joke-commercials.md`](possible-joke-commercials.md) — Chest-Height
Delivery Academy · Neutral-Zone Laundry Minutes · Elevator Inspection Notice · Decorative
Accent Removal. Not Ultra Screech, not Big City, not the EyeWash telethon.

## Ladies' house (6)

Own file: [`possible-ladies-house.md`](possible-ladies-house.md) — intercom vs laundry
music · elevator form at chest height · Qing identifies the mailbox · pizza at the door ·
dryer eats one lace glove · mailbox folder for Christina returned unopened.

---

## Refused (8) — on purpose

1. **Rinse Formula / Ultra Screech 2.** Kill-listed on the farm sheet. A sting that echoes
   the ad is allowed; a sequel is not. Nothing here echoes it either.
2. **Glam College enrolment spot.** The college exists only inside the one Ultra Screech
   commercial ("Applications still open" is Kenji's accident, not a product).
3. **Riley retrieves the lace glove.** No retrieval plot. Riley stays above 5,000 ft and
   does not visit the unit.
4. **Christina comes to dinner.** Worlds mix. She is a fridge postcard at most, and the
   folder to her comes back unopened.
5. **Night Grove rematch.** Parked world. No duel, no rematch, no grove.
6. **Third Christina aria as a house-bed.** No third aria. Her twins wait on a Nova pass.
7. **Twelve more 90s animals for the lobby.** Banned outright. One brass globe is the
   only "creature" in this drawer and it is furniture.
8. **HOA meeting in the laundry.** That is the #19 season. House cards are 20–40s micros
   with one slip and no meeting.

---

## Promotion path (for later, not now)

A card leaves the drawer only when someone says *promote*. Then: Julian slates (needs a
picture job or a bed with a door), the card gets a `content/` file or a `songs/*.md`,
`npm run codegen` runs, and Suggestions picks it up. None of that happens in this pass.

*Weeks on Fire. Mara Vell. Harden first.*
