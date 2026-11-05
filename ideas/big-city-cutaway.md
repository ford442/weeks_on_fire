# Big City — catalog musical cutaway

**Kind:** musical cutaway (catalog glam, not the Ultra Screech ad)  
**Lane:** Glam-Sham-Poo catalog single. Hair is the architecture. Product off-screen.  
**Catalog:** `content/cutaways/big-city.json` (`kind: musical`)  
**Prompts:** `prompts/big-city-segments.md`  
**Song:** `songs/Big_City.md`  
**Grok build:** `ai-contributions/grok-4.6/big-city-video.md`  
**Local board:** `artifacts/big_city_video.md`  
**Suggestions id:** `big-city`
**Sight bank (B-roll):** [`big-city-hair-incidents.md`](big-city-hair-incidents.md) — real-scale awkward hair incidents, 10–20s each

Bed in hand: local `big_city(option_a).mp3` (~2:46.82). Kenji tag lands **0:05–0:07**: *“The hair is in big city man.”* Use the take. Do not rewrite him. Binary is not in `songs/` yet.

Farm song notes on [#18](https://github.com/ford442/weeks_on_fire/issues/18) / [#33](https://github.com/ford442/weeks_on_fire/issues/33). Origin / splash thoughts on [#32](https://github.com/ford442/weeks_on_fire/issues/32). Picture notes on [#22](https://github.com/ford442/weeks_on_fire/issues/22). Do **not** dump on [#42](https://github.com/ford442/weeks_on_fire/issues/42).

Worlds do not mix: no Daisy tandem, no laundry-waterfall sleeve as the home plate, no night-lot cabinet, no Annex wings, no HSV table, no Ultra Screech bottle, no EyeWash bug.

---

## Lock

A-roll is a small Glamora club stage. Lillith starts. Rubella answers. Kenji plays and speaks the tag twice. Ladies stay modern black lace. Glam volume is in the hair, not a costume change. *(Main cut since 2026-11-02: the ladies reach the stage at the solo. See* Main cut — The Trip *below.)*

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

---

## Main cut — The Trip: Lace Waterfall gets to the gig (2026-11-02)

**This is now the main cut.** *The Appointment Day* (below) is kept as an alternate arc;
its prompts are filed under *Alternate plates* in `prompts/big-city-segments.md`.

**Story:** Lace Waterfall, Rubella and Lillith's band, have a gig tonight at a small club in
Glamora. They're travelling there with their stage hair already done: gigantic 1980s metal
hair. Plane, bus terminal, bus, taxi, stage door. The hair doesn't fit through anything.
They're late. The house guitarist (Kenji) covers the solo alone on stage until the curtain
moves, the hair comes through first, and Lace Waterfall walk on, plug in, and play the rest
of *Big City* as if it was theirs all along.

**laugh:** *Their hair is so big it won't fit on the plane, the bus or the taxi, and when
they finally get to the show it grows right through the roof.*
**drop: transforms.** Final chorus, on the dive bomb: their hair rises through the club's
skylight. Exterior: two new towers have joined the Glamora skyline, with stage lights
glowing in them.
**end reaction:** Kenji, last shot (K2): he looks up at their hair from the wings and says
the same sentence as the intro, unchanged.

### What changes from the original lock

- **The stage arrives halfway.** The ladies are not on stage until the solo (1:16). Before
  that, the song is the soundtrack to the trip. **No lip-sync while they travel.**
- **Kenji is the club's house guitarist, not in the band.** His bible and the *Lace
  Waterfall* song say the band is Lillith and Rubella only. That stays true: he's never on
  the banner, he stands in the wings, and he only takes centre stage for the solo because
  the band is late. When they walk on, he steps back into the shadows. *(Owner call: if
  even that is too close to "in the band," cut him to the wings for the whole solo and let
  the solo play over an empty stage.)*
- **The drummer is never seen.** Lace Waterfall is a duo. There's a drum kit on the riser
  with LACE WATERFALL on the kick drum, and their hair blocks the drummer completely in every
  shot. Nobody comments.
- **Sound vs. catalog:** Lace Waterfall's own records are 1970s space rock and heavy rock.
  Tonight they play the glam strut *Big City*. That's the gig. Nobody explains it.
- Everything else holds: modern black lace, glam volume in the hair rather than a costume,
  small club (not an arena), no bottle, no EyeWash bug, Riley off this record, and neon
  magenta and cyan only in the gaps between strands (on stage and in the city at night;
  daylight travel gets daylight).

### The look

**Lillith (Lace Waterfall):** modern black lace dress, silver studded wristband. **Hair:**
jet black, teased and crimped into a tall tower about three feet high, with one
electric-magenta streak and two drumsticks pushed through it like hairpins. **Guitar:** a
black angular pointed electric guitar with no brand or logo. Bright, conspiratorial
half-smile, flawless mascara.

**Rubella (Lace Waterfall):** modern black lace evening dress, blood-red lipstick. **Hair:**
long dark hair teased into a huge sideways mane like spread wings, about four feet across,
with one platinum-white streak and a few guitar picks pinned in it like sequins. **Bass:**
a white four-string bass with no brand or logo. Dry, exhausted, calm.

*(Black for Lillith and white for Rubella echoes the Spy vs. Spy split from the Monster
Mash finale, as a colour reference only.)*

**Hair physics:** photoreal, sprayed, individual strands, rigid enough to hold its shape and
soft enough to squash through a door and spring back. It's the largest thing about them and
the only impossible thing in each shot; doors, seats, bins and turnstiles stay real-size.

**Gear and set dressing:** two black road cases stencilled LACE WATERFALL in white, carried
everywhere. The kick drum head reads LACE WATERFALL. One full red fire extinguisher stands
beside Rubella's amp on stage, sealed, never used, never mentioned.

**Kenji:** teased glam hair, black leather fringe jacket, guitar, ALUMNI lanyard. Not the
bottle. In the wings, half in shadow.

### Beat map (main cut)

| Seg | Time | Song section | Shot | Lip-sync |
|---|---|---|---|---|
| A | 0:00–0:08 | intro, K1 | **Empty stage.** Two empty mics, the LACE WATERFALL kick drum, Kenji in the wings looking at a tour poster of the band's hair. He says the line. | Kenji (spoken) |
| B1 | 0:08–0:15 | verse 1 | **Airport security.** The hair won't fit through the scanner arch. The agent waves them round. The tray: bobby pins, more bobby pins, then a whole cymbal from Lillith's hair. | no |
| B2 | 0:15–0:23 | verse 1 | **Jet bridge and cabin.** Down the jet bridge with heads tilted 45 degrees in unison. In the cabin, the hair fills four overhead bins and the attendant closes a bin on a lock of it. | no |
| D2 | 0:23–0:31 | pre-chorus | **Window seat, landing.** The Glamora skyline rises in the window, a city made of hair, and Rubella's mane is pressed against the glass and bigger than it. | no |
| E | 0:31–0:38 | chorus open | **Skyline lock** (the original E, trimmed to 4 bars). | no |
| E3 | 0:38–0:46 | chorus | **Bus terminal.** They go round the revolving door twice. The departure board flips as the hair brushes it. Turnstiles: sideways, back a step, sideways again. A delivery man in red walks through the back at the same pace. | no |
| F2 | 0:46–1:01 | verse 2 | **The bus.** The hair won't go through the bus door, so they ride standing up through the roof hatch, hair streaming back like flags. A low overpass: they tilt their heads together and the hair combs the underside of the bridge. | no |
| G8 | 1:01–1:08 | pre-chorus 2 ("from the laundry") | **Taxi.** Hair out of the sunroof. They pass a laundromat, and their hair is reflected spinning in a row of dryer portholes. | no |
| G9 | 1:08–1:16 | chorus 2 ("the elevator yields") | **Stage door and freight elevator.** The doors open on a car that's too short. The elevator yields: the car politely sinks two feet so the hair fits. | no |
| H | 1:16–1:31 | solo | **Kenji covers.** He steps out of the wings and plays the solo alone at centre stage. The curtain bulges: the hair comes through first, then Lace Waterfall. They plug in, and Kenji steps back into the wings. | no |
| I | 1:31–1:46 | bridge | **On stage.** Rubella sings, Lillith answers. Drummer hidden behind the hair. | **yes** |
| J | 1:46–2:10 | final chorus | **Stage title hits** intercut with the crowd (normal-size hair, all looking up). | **yes** (title hits only) |
| J6 | 2:10–2:18 | dive bomb | **DROP.** Their hair rises up through the skylight. Exterior: two new towers in the Glamora skyline with stage light pouring out of them. | no |
| J7 | 2:18–2:39 | last chorus | **Skyline and stage intercut.** The crown keeps the keys: a window lit high in the hair. | stage only |
| K2 | 2:39–2:47 | outro | **Kenji in the wings,** looking up at their hair, says the same sentence. | Kenji (spoken) |

**Lip-sync budget:** Kenji's two spoken tags plus the bridge and the final-chorus title hits.
Nothing before 1:31 needs a mouth to work.

### Swap bank (extra trip gags)

Same rules: real-size world, the hair is the only variable, nobody comments.

- **Check-in desk:** the agent looks at the hair, then the luggage sizer, then the hair. She
  prints a second boarding pass for it.
- **Airport moving walkway:** the hair arrives at the end of the walkway three seconds
  before they do.
- **Baggage claim:** the hair goes round the carousel once while they wait beside it, calm.
- **Seatbelt sign:** the cabin light dings, and every passenger behind them leans into the
  aisle to see the screen.
- **Bus shelter:** they wait under it; the shelter roof is resting on the hair.
- **Taxi meter:** the driver adds a second fare for the hair. Neither woman objects.
- **Tunnel:** the taxi's sunroof hair brushes every light in a tunnel, and they flicker in a
  wave behind it.
- **Pedestrian bridge:** the hair clears it by an inch. A pigeon on the bridge rail steps
  onto the hair and rides one block.
- **Club cloakroom:** the attendant takes a guitar case, looks at the hair, and holds out a
  second ticket. Lillith shakes her head.
- **Dressing-room mirror:** the lights around the mirror only frame their chins.

### Callbacks spent

- **Spy vs. Spy, Lillith in black and Rubella in white:** the black and white streaks and
  the black guitar / white bass. Colour only, no trench coats.
- **Rubella's full extinguisher** stands by her amp on stage, never used.
- **The Pizza Guy walks through the back of someone else's wide at the same pace** (E3): red
  uniform, box at chest height, never looks at the hair.
- **The airport scanner's bobby-pin tray** from `big-city-hair-incidents.md`, escalated with a
  wrong third: the cymbal.

### Generate-first (main cut)

1. **A + K2** as a pair: same empty-then-full stage, same Kenji framing in the wings.
2. **B1 security:** the cymbal out of the hair sets the tone.
3. **F2 bus roof hatch:** the most visual trip shot.
4. **J6 drop:** the hair through the skylight, and two new towers outside.

---

## Alternate arc — The Appointment Day (2026-11-01)

The B-roll gets a spine. **Lillith books a hair appointment to get "a little lift." Every
appointment after that, meant to fix it, makes it bigger. Even washing it.** By the final
chorus her crown is the skyline.

**laugh:** *She keeps calling for hair appointments to fix her hair, and every one makes it
bigger, even the wash.*
**drop: transforms.** Final chorus: Rubella unwraps the towel and the flat, washed hair springs
up into a lit skyline (J3).
**end reaction:** Rubella, once, at 2:31–2:39: Lillith is on the phone booking next Tuesday.
Rubella takes the phone, ends the call with one thumb, and sets it face-down (J5).

### How it sits on the existing cut

- **Stage plates don't change.** A, B, D, F, I and K2 are exactly as written. The stage is the
  performance and has no place in the day's timeline. Stage hair stays at glam volume.
- **The arc lives in the B-roll windows** (C, E, G, H, J). The new inserts are alternates
  next to the existing hair-city plates, not replacements. The skyline lock at E stays.
- **Phone calls are silent.** Lillith listens and the other end talks, but we never hear
  it. She answers with one hand gesture: thumb and finger an inch apart, meaning "a little."
  No lip sync, so the B-roll rule holds. No caller ID or calendar text to read.
- **Real scale climbs to city scale.** Act 1 stays inside the incident-bank lock
  (`big-city-hair-incidents.md`: plausible, one inch too wide). The blowout breaks that
  scale on purpose, and the dry finishes at skyline scale. The escalation is the arc.
- **Salons have no product.** Shelves are out of focus or empty: no bottles, no labels, no
  text. The lane rule holds: product stays off-screen.
- **One world: Glamora city.** Street, café window, two salons, a corner. It's not the
  building, not Rubella and Lillith's unit, not the laundromat. The wash happens back at
  the first salon.
- **Lillith is calm and delighted.** Her energy goes into the hair she's building.
  **Rubella is calm and dry.** She carries things and makes one move at the end. Stylists
  are deadpan. Nobody screams, falls or names the hair.

### Beat map

| Slot | Time | Insert | Beat | Scale |
|---|---|---|---|---|
| C2 | 0:08–0:15 | **Call one: a little lift** | Morning café window. Lillith listens on the phone and shows "a little." | real |
| C3 | 0:15–0:23 | **Crown work** (alt to C) | Salon one. The stylist on a step stool teases on the snare. Rubella waits with the mug. Lillith stands, and her head clears the mirror frame. | real+ |
| E2 | 0:39–0:46 | **Out the salon door** | Doorway pause, sideways exit, a dinner-plate hair print on the glass. The receptionist wipes it without looking. | real+ |
| G5 | 0:54–1:01 | **Six blocks under it** | On Rubella's "six blocks" line: she walks in the shade of the back of Lillith's hair like a shop awning, carrying the full extinguisher. A pigeon lands up top and stays. | big |
| G6 | 1:01–1:08 | **Call two: speakerphone** | The phone won't reach her ear through the hair (it goes in up to the wrist), so she holds it flat on speaker. Same gesture, a little wider. | big |
| G7 | 1:08–1:16 | **The blowout** | Salon two. Round brush and dryer, and the hair rises like bread dough on every pass until it lifts a ceiling tile. Rubella stands by with the extinguisher and never uses it. | huge |
| H2 | 1:23–1:31 | **Call three: it's in there** | Lillith's phone is lost in her hair. Rubella calls it, and the ring glows magenta and cyan through the strands. Rubella reaches in elbow-deep: sunglasses, an earring, a pencil, then the phone (23% for one frame). | huge |
| J2 | 1:46–1:54 | **The wash** | Back at salon one, at the backwash sink. The whole thing goes flat under the tap. | flat |
| J3 | 2:02–2:10 | **It dries (DROP)** | Towel off on a gang "Big City." The hair springs up into lit towers past the ceiling lights. | city |
| J4 | 2:18–2:26 | **Skyline with a delivery** | Exterior. Her crown is the skyline, with one window lit. A tiny figure in a red delivery uniform climbs the fire-escape strand at a steady pace, box at chest height. | city |
| J5 | 2:31–2:39 | **Call four: next Tuesday** | On the salon steps at night she calls again and shows "a little." Rubella takes the phone and hangs up. | city |

Rule of three with a wrong third: call one books the lift, call two books the blowout, call
three is the phone ringing *inside the hair*. Call four is the out.

The lyrics already carry it, so nothing gets rewritten: *Crown work on a Tuesday* (C3),
*I walked under somebody's fringe / for six blocks* (G5), *You can wash it if you want to /
It'll still be a city when it dries* (J2 → J3, landing in the final chorus), and *the crown
still keeps the keys* (J4's lit window).

### Callbacks spent

- **Rubella's full extinguisher** (in full, out full, never mentioned): G5 and G7. Hair
  dryer heat is the reason it's there; it never goes off.
- **World's Okayest Tenant mug:** Rubella in the salon-one waiting chair (C3).
- **Twenty-three percent:** the found phone reads 23% for one frame (H2). It's set
  dressing, not a battery joke.
- **Pizza Guy walks through the back of someone else's wide at the same pace** (J4). Red
  uniform, box at chest height. He doesn't look at the hair, has no line, and doesn't
  knock.

### Generate-first (arc)

1. **G7 blowout.** It's the turn from real scale to huge, and the bread-dough rise has to
   read.
2. **J3 it dries.** This is the drop.
3. **H2 it's in there.** The wrong third, and neon in the gaps doing a story job.
4. **C2 + J5** as a pair: same gesture at the start and end. J5 carries the end reaction.

Prompts: `prompts/big-city-segments.md` § *Story arc inserts*. New real-scale incidents
for the gaps: `big-city-hair-incidents.md` § *Third pass — appointment day*.
