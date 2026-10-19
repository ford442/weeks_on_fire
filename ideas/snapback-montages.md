# Snapback Montages — serious room, loud hits, nobody saw anything

*Drawer, not a farm. Text only. 2026-10-19. `promote?: no` on every card.*

**Rules:** [`funny-rules.md`](funny-rules.md) · **Loop / clip neighbours:**
[`silly-packet-farm.md`](silly-packet-farm.md) · **Cast locks:**
[`../characters/building-cast.md`](../characters/building-cast.md) ·
[`../characters/bible/`](../characters/bible/)

**Model:** the news-set montage — a serious studio transforms into alien fairies, then
crystals, then cats, and hard-snaps back to the desk between each one. (That idea is not
written up anywhere in the repo yet; this sheet works from its description.) Four new
rooms use the same engine:

1. A **normal, serious-looking location**.
2. **Five or six transformations**, each triggered by a music hit, each bigger than the last.
3. A **hard snap back to normal** between every one. Someone in frame pretends nothing happened.
4. A **final transformation that does not snap back**.

The pretender is the deadpan; the room is the loud world. Every transformation is
visible with the sound off. No text on screen carries a joke.

---

## How to shoot it (Grok Imagine 6 / 10 / 15s)

The snapback only works if "normal" is **exactly** the same frame every time. So:

- **One normal plate.** Write one start still. Generate it once as a **15s clip** of the
  room being normal, with the pretender doing five small "nothing happened" actions
  (straighten, sip, page-turn, cough, nod) spaced through it. Slice that clip into the
  snapbacks. Every snapback is a hard cut to it, ~2s, no transition, no wipe, no flash.
- **Every transformation starts from the same normal still** (image-to-video), so the cut
  into each vignette matches. Early ones are **6s clips** trimmed to ~4s; later, bigger
  ones are **10s clips** trimmed to ~6s; the final is a **15s clip** that plays out whole.
- **Each transformation's last frame is its peak.** Cut away on the peak, not after it.
  The snapback is the punchline, so it must be sudden.
- **The hit lands on the first frame of each vignette.** Cut on the beat, never before.

Runtime lands at ~55–70s. Default still style for every prompt: *photoreal cinematic still,
2.39:1, Grok Imagine building-cast, no real actor names, locked camera, 35mm, fine grain,
Grok Imagine style.*

**Callbacks, spent as references** (`notes/callback-bank.md`): Dale gavels through
explosions, always seated, never acknowledges the smoke (#1) · forty folding chairs creak,
they do not clap (#1) · the Black Cat's second look and her one knock (#2) · the Pizza Guy
walks through at his usual pace and never looks at what's behind him (#3) · Rubella's
World's Okayest Tenant mug (#3) · "It's not broken. It's early." (#4).

---

## 1. `hoa-gavel-snapback` — Every Gavel Changes the Room

| field | value |
|---|---|
| location | HOA clubhouse, monthly meeting: fluorescent tubes, forty beige folding chairs, a podium table |
| pretender | **Dale**, seated, gavel in hand. Rubella in the front row with her mug, also pretending. |
| trigger | Each gavel strike = one music hit. A small puff of purple smoke every time, never acknowledged. |
| world | HOA clubhouse |
| runtime | ~62s |
| promote? | no |

**Laugh:** *Every time he bangs the hammer the room turns into something crazier, and he just keeps going.*

**Escalation**

| # | Hit | Transformation | Clip | Snapback (pretending) |
|---|-----|----------------|------|-----------------------|
| — | — | Open on the normal plate. | 15s plate, use 0–4s | — |
| 1 | gavel | The folding chairs become **pink flamingos**, residents sitting on their backs. | 6s → 4s | Dale clears his throat. |
| 2 | gavel | The carpet becomes a **ball pit**, everyone sunk to the waist in bright plastic balls. | 6s → 4s | Rubella sips from her mug. |
| 3 | gavel | The room is a **jungle**: vines, parrots on the light fittings, a monkey in Dale's lap. | 6s → 4s | Dale straightens his papers. |
| 4 | gavel | The room is **underwater**: chairs floating, a whale glides past the windows, bubbles from every mouth. | 10s → 6s | Rubella crosses her legs the other way. |
| 5 | gavel | The clubhouse is in **outer space**: no walls, chairs drifting among stars, Saturn behind the podium. | 10s → 6s | Dale nods once at nobody. |
| 6 | gavel — **no snap back** | The clubhouse becomes a **giant birthday cake**. Everyone sits on top of it among enormous lit candles; Dale's podium is a slice. He gavels once more. A candle relights. He keeps going. | 15s, whole | — |

**Start still:** a fluorescent-lit suburban clubhouse meeting room, forty beige steel
folding chairs in rows facing a podium table, a stern older man in a cardigan seated
behind the table holding a cracked wooden gavel raised mid-strike, a few residents seated
with bored faces, Rubella in the front row holding a mug, beige carpet, drop ceiling,
everything grey and serious.

**Last still:** the same people and chairs sitting on the frosted top of a giant
three-layer birthday cake the size of the room, enormous lit candles standing between the
rows like trees, sprinkles the size of shoes, the stern man still seated at his podium
table on a cake slice with the cracked gavel raised, a small puff of purple smoke beside
it, Rubella in the front row holding her mug, everybody calm.

**Song feel:** a stately brass-band processional, 96 bpm, instrumental. Each gavel is a
bass drum and cymbal crash; the band gets one instrument bigger every hit — tuba, then
timpani, then a full marching band by the cake.

**Do-not:** Dale is always seated and never acknowledges the smoke or the change. The
chairs creak where applause would go; they never clap. No agenda text, no minutes joke.
Not the purple light itself — just the gavel's puff.

---

## 2. `library-hush-snapback` — Every Shush Changes the Library

| field | value |
|---|---|
| location | Grand public library reading room: long oak tables, green banker's lamps, a domed ceiling |
| pretender | **Lillith**, reading at a table, turning pages. A stern librarian at the desk. |
| trigger | Each time the librarian puts a finger to her lips and shushes = one music hit. |
| world | the town's public library (one room) |
| runtime | ~58s |
| promote? | no |

**Laugh:** *Every time the librarian says "shh," the library goes wilder, and the reader just turns a page.*

**Escalation**

| # | Hit | Transformation | Clip | Snapback (pretending) |
|---|-----|----------------|------|-----------------------|
| — | — | Open on the normal plate. | 15s plate, use 0–4s | — |
| 1 | shh | Every book on the shelves flaps open and **flies like a bird**, circling the dome. | 6s → 4s | Lillith turns a page. |
| 2 | shh | The shelves become a **waterfall**, spilling into a river down the centre aisle, ducks floating on it. | 6s → 4s | Lillith licks a finger, turns a page. |
| 3 | shh | The reading tables are **bumper cars**, readers bumping gently, still reading. | 6s → 4s | The librarian adjusts her glasses. |
| 4 | shh | The whole room is a **roller coaster**: the tables ride a track around the dome, loop-the-loop. | 10s → 6s | Lillith marks her place with a ribbon. |
| 5 | shh | The dome opens and it's **snowing** inside — a full blizzard, a polar bear asleep in the stacks. | 10s → 6s | The librarian shushes nobody. |
| 6 | shh — **no snap back** | Every book **turns back into a tree**. The library becomes a deep green forest, birds singing, the oak tables now stumps. Lillith keeps reading on her stump. The Black Cat sits on the librarian's desk, looks at the forest, looks at the librarian, looks at the forest again, then knocks the desk bell off. | 15s, whole | — |

**Start still:** a grand old public library reading room, long oak tables in rows with
green banker's lamps, floor-to-ceiling bookshelves, a painted dome ceiling, a stern
librarian with a grey bun at a wooden desk holding one finger to her lips, Lillith in a
black lace dress seated at a table reading a hardback, perfectly calm, dust in the window
light, hushed and serious.

**Last still:** the same reading room become a deep, sunlit green forest, tall trees where
the shelves stood, tree-stump tables where the oak tables were, a few green banker's lamps
still glowing on the stumps, Lillith seated on a stump still reading her hardback calmly,
the librarian at a desk made of a fallen log, a small black cat on the log beside a brass
desk bell tipping off the edge, birds in the branches.

**Song feel:** a lone whistled melody over pizzicato strings, 104 bpm, light and tiptoeing.
Each shush is a soft snare hit and a string stab; by the forest a full woodwind section
and birdsong have joined the whistle.

**Do-not:** the Black Cat knocks one object, once, and gets no reaction shot after. She
stays a cat — she is not part of a transformation. No readable book titles, no signs.

---

## 3. `bank-lobby-snapback` — Every Bell Changes the Bank

| field | value |
|---|---|
| location | An old marble bank lobby: brass teller windows, velvet ropes, a vault door at the back |
| pretender | **A security guard** standing at the rope line. Rubella waiting in line with her mug. |
| trigger | Each time the teller taps the brass counter bell = one music hit. |
| world | the town bank lobby |
| runtime | ~64s |
| promote? | no |

**Laugh:** *Every time the bank lady rings her bell, the bank turns into something sillier, and at the end the whole bank turns into a pig and walks away.*

**Escalation**

| # | Hit | Transformation | Clip | Snapback (pretending) |
|---|-----|----------------|------|-----------------------|
| — | — | Open on the normal plate. | 15s plate, use 0–4s | — |
| 1 | bell | Every coin on the counter turns into a **butterfly** and flutters up to the chandelier. | 6s → 4s | The guard tucks in his shirt. |
| 2 | bell | The velvet ropes become a **conga line of ducks**, each holding the next one's tail. | 6s → 4s | Rubella sips her mug. |
| 3 | bell | The teller windows are a **carnival**: cotton-candy machines, a carousel horse in each booth. | 6s → 4s | The guard checks his watch. |
| 4 | bell | The vault door swings open on a **beach** — waves rolling across the marble floor, seagulls, a sandcastle by the rope line. | 10s → 6s | Rubella shuffles one step forward in line. |
| 5 | bell | The whole lobby is a **giant pinball machine**: flippers by the doors, the guard's hat pinging off bumpers. | 10s → 6s | The guard puts his hat back on, perfectly straight. |
| 6 | bell — **no snap back** | Exterior: the whole bank building **turns into a giant pink piggy bank**, stands up on four legs, and trots off down the street, a coin slot on its back. In front of it, a delivery man walks past at his usual pace, pizza box level at chest height, and never looks up. | 15s, whole | — |

**Start still:** a grand old marble bank lobby, brass teller windows, a teller in a grey
cardigan with her palm raised over a brass counter bell, velvet ropes on brass posts, a uniformed
security guard standing rigidly by the rope line, Rubella waiting in line holding a mug,
a round steel vault door at the back, high windows, quiet and serious, no readable signs.

**Last still:** a quiet town street in daylight, an enormous glossy pink piggy bank the
size of a three-storey building trotting away down the road on four little legs, a coin
slot on its back, the empty lot where the bank stood, Rubella standing on the pavement
holding her mug, the security guard beside her standing rigidly at attention, a delivery
man in a plain delivery uniform crossing the foreground carrying a pizza box level at chest height.

**Song feel:** a cool jazz walking-bass shuffle with finger snaps, 112 bpm, instrumental,
muted trumpet lead. Each bell is a rimshot and a horn stab; by the pig a full big band is
playing and the trumpet does one long fall-off as it trots away.

**Do-not:** no forms, no stamps, no paperwork joke, no readable document. The Pizza Guy is never named, never stops, never reacts; his name tag is
illegible. No robbery, no money gag beyond the butterflies.

---

## 4. `concert-hall-snapback` — Every Baton Tap Changes the Orchestra

| field | value |
|---|---|
| location | A formal concert hall: velvet seats, gold balconies, an orchestra in black tie |
| pretender | **The conductor**, who keeps conducting. Rubella in the front row of the audience. Lillith in the orchestra, second violin, calm. |
| trigger | Each tap of the conductor's baton on the music stand = one music hit. |
| world | the town concert hall |
| runtime | ~66s |
| promote? | no |

**Laugh:** *Every time the conductor taps his stick the orchestra turns into something weirder, and at the end the whole concert hall turns into a teapot and whistles.*

**Escalation**

| # | Hit | Transformation | Clip | Snapback (pretending) |
|---|-----|----------------|------|-----------------------|
| — | — | Open on the normal plate. | 15s plate, use 0–4s | — |
| 1 | tap | The violin section becomes **geese**, still holding their bows in their beaks. | 6s → 4s | The conductor smooths his hair. |
| 2 | tap | The whole audience becomes **penguins** in their seats, clapping flippers. | 6s → 4s | Rubella fans herself with a programme. |
| 3 | tap | The stage is an **ice rink**; the orchestra skates in circles, still playing. | 6s → 4s | Lillith retunes one string. |
| 4 | tap | The hall flips **upside down**: everyone sitting on the ceiling, the chandelier pointing up like a fountain. | 10s → 6s | The conductor turns a page of his score. |
| 5 | tap | The hall is inside a **giant jukebox**: the orchestra rides a spinning record, coloured lights everywhere. | 10s → 6s | Rubella checks the time on her wrist. |
| 6 | tap — **no snap back** | The whole concert hall **turns into a giant teapot** on a stove the size of the town. Steam rises from the spout. It whistles the melody, perfectly in tune. Inside, through a window, the conductor is still conducting. Rubella pours herself a cup from the spout. | 15s, whole | — |

**Start still:** a formal, gilded concert hall, red velvet seats, gold balconies, a full
orchestra in black tie on stage, a silver-haired conductor raising a white baton above
his music stand, Lillith in black lace seated calmly in the second violins, Rubella in the
front row of the audience with her hands folded, warm stage light, serious and hushed.

**Last still:** a giant cream-and-gold teapot the size of a concert hall sitting on a vast
iron stove at the edge of town, a great plume of steam whistling out of its spout, arched
concert-hall windows on its side glowing, the conductor visible through one window still
raising his baton, Rubella standing on the stove's edge holding a teacup under the spout,
calm.

**Song feel:** a light orchestral waltz, 3/4 at 138 bpm, instrumental, with the melody
whistled by a solo whistler doubling the flutes. Each baton tap is a triangle ting and a
full-orchestra chord; the final teapot plays the whistle melody alone, held, then the
orchestra comes in under it for the last bar.

**Do-not:** no real composer's piece — an original waltz only. No readable programme or
score text. The geese and penguins are polite and never chaos-for-chaos; they keep the
tempo. Lillith's outro, if a tag is wanted: *"It's not broken. It's early."*

---

## Status

Four montages, text only, `promote?: no` on all. No stills, no `content/` file, no
Suggestions card, no Minimax beds. Waiting on the owner's pick.
