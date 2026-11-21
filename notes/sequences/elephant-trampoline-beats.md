# Elephant Trampoline — beat sheet (3D Sequence)

Record: [`content/sequences/elephant-trampoline.json`](../../content/sequences/elephant-trampoline.json).
Promoted from the cartoon seed [`content/cartoons/everyone-else-bounces.json`](../../content/cartoons/everyone-else-bounces.json).
In-hub procedural WebGL. This sheet is the brief for the scene graph; it is not the graph.
Authored by claude, 2026-11-21. Text only, no codegen (notes/ is not codegen'd). `promote?: no`.

## Card

- **id:** `elephant-trampoline`
- **world:** the cul-de-sac back yards (HOA-adjacent; nobody from the HOA on screen)
- **length:** 12.0 s, seamless loop (frame at 12.0 s = frame at 0.0 s)
- **laugh:** *The elephant jumps on the trampoline and everybody else goes flying.*
- **drop:** **falls** — at 5.0 s the whole street falls *up* into the sky; at 9.2 s all four fall back home at the same instant, each on the exact spot it left.
- **engine:** wrong scale (the heaviest thing pushes, the lightest things go) + things that keep happening (small bounce, big bounce, loop)
- **end reaction:** the elephant, one slow blink, 11.20–11.45 s. Spent once.
- **do-not:** the elephant's feet never leave the mat · the trampoline never moves, the mat never dips, no dust under it · no shocked faces (the seed's "shocked faces" are overruled by funny-rules rule 1: dot eyes never change) · no mouths, no text, no fingers · nobody looks at the glowing window · the mailman is not the Pizza Guy (no red, no brown parcel uniform, no phone, no napkins) · the dachshund is not Biscuit (no bandana) · the grandma is not Karen or Peggy · no purple light · no scorch.

## Stage and camera

- **Units:** house height **H = 1.0** (wall 0.6 + pyramid roof 0.4). Ground y = 0.
- **Layout (x left to right, z toward camera):** five yards, centres at x = −4, −2, 0, +2, +4. House backs at z = −3. Lawn z = −2.5 … 0. Back fence line at z = 0. Alley floor z = 0 … 1.5.
- **Camera:** locked, 3/4. Sits in the alley at (x −1.5, y 0.5, z 6.5), yawed 20° to look up-row toward x +1, tilted up 6°. Frame: house roofs in the lower 40%, sky above. Apex of the big hang (y ≈ 2.6) sits about 8% under the top edge. No orbit, no dolly — the loop needs a locked frame. Vignette on.
- **Shading:** cel, one hard shadow tone per colour, ink-weight outline where the engine allows.

## Who is where, and what colour (plain words)

| Thing | Position | Colour | Primitives (neighbours ≤ 6) |
|---|---|---|---|
| Sky | backdrop | flat light blue | flat plane |
| Houses ×5 | x −4…+4, z −3 | cream walls, brown pyramid roofs (4-sided lathed cone), dark brown back doors | one instanced batch |
| Glowing window | grandma's house (x +4), back wall | pale blue-white with three faint colour bars, slow flicker | flat plane |
| Lawns | each yard | two greens, checker | flat checker plane |
| Picket posts | between yards and along z = 0 | white | one instanced batch of thin boxes |
| Alley | z 0 … 1.5 | mid grey | flat plane |
| **Elephant** | x 0, on the trampoline | mid grey, darker grey shadow, pink inner ears, black dot eyes | body sphere, head sphere, ear pair (flattened spheres, instanced), trunk hose, four leg hoses, tail hose, eye pair |
| **Trampoline** | x 0, z −1.2, radius 0.8, mat height 0.25 | black mat, bright green padded rim, silver legs | flat disc, torus, six instanced cylinders |
| **Mailman** | x −4, z −0.8 | navy cap and body, peach head, tan bag, white letters | head sphere, body cylinder, cap (one lathed crown+brim), bag box, strap hose, eye pair (6) + white flecks emitter |
| **Dachshund** | x −2, z −1.0, sitting | reddish brown, dark brown ears, black dot eyes | long capsule body, head sphere, ear pair (instanced), tail cylinder, four leg stubs (instanced), eye pair (6) |
| **Bathtub man** | x +2, z −1.2 | white tub, brass feet, pink head, yellow duck | lathed clawfoot tub, four feet (instanced), head sphere, duck body sphere, duck head sphere, eye pair (6) + pale blue splash emitter |
| **Grandma** | x +4, z −1.0 | green lawn chair, lavender body, peach head, grey bun, pale yellow lemonade | chair boxes (instanced pair), body sphere, head sphere, bun sphere, glass cylinder, eye pair (6) |
| Wheelie bins ×3 | x −3.15, −2.8, −2.45, alley edge z 0.6 (built: moved from x +0.9…+1.6, where they hid the bathtub man from the camera) | three different blues: sky blue, royal blue, greyish blue | three boxes |
| Cone | x −0.3, z 0.5, in front of the elephant's back gate | orange with one white band | lathed cone + torus |
| Lamp post | x +5.3, z 1.0 (frame right edge) | grey pole, cold white glowing head | cylinder + sphere, additive glow |

Particle emitters (one colour each, additive): **tan dust puffs** (under neighbours only), **white letter flecks** (mailman's bag), **pale blue splash** (tub). Afterimage ghosts: three echoes, 0.06 s apart, on the four neighbours only, big rise and big fall only.

## Beats (seconds)

| Time | Beat |
|---|---|
| **0.00–0.80** | Idle, everyone calm. Mailman holds still with his bag. Dachshund sits, tail wags ±15° at 2 Hz (wag runs whenever it is on the ground). Duck bobs ±0.02 in the tub at 1 Hz. Grandma's glass on her lap. Elephant stands, trunk down. Window flickers. |
| **0.80–1.40** | **Small wind-up.** Elephant body squashes 15% (shorter, wider, volume kept); leg hoses shorten; trunk rises to 45°. Feet stay pinned to the mat. |
| **1.40–1.50** | Elephant stretches 10% tall. |
| **1.50** | **Small boom.** Elephant squashes 25%. Mat stays perfectly flat. Under each of the four neighbours, one small tan dust puff. |
| **1.50–2.10** | All four neighbours rise straight up (stretched 15% on the way) to **y 1.2** — just over their own roof ridges. Bins and cone hop 0.15, land back on their spots at 1.90. Picket posts jelly-wobble in a wave running out from x 0 (0.05 s delay per unit of distance); lamp post wobbles. Elephant unsquashes with a jelly wobble, settled by 2.20. |
| **2.10–2.30** | Short hang at y 1.2, squashed round. |
| **2.30–2.80** | Fall, stretched. |
| **2.80** | All four land in their own yards at once, on the spot they left. Squash 20%, small tan dust puffs. No splash, no letters. |
| **2.80–3.40** | Jelly settle (decaying wobble). Posts and lamp settled. |
| **3.40–4.00** | Idle. Same as 0.00. |
| **4.00–4.90** | **Big wind-up.** Elephant squashes 30%, trunk to straight up (90°), ears flare out 40°. |
| **4.80–4.95** | Elephant stretches 20% tall. |
| **5.00** | **Big boom — the drop.** Elephant squashes 45% (a wide grey disc on legs). Mat still flat; no dust under it. Big tan dust puff under each neighbour. |
| **5.00–6.40** | All four shoot straight up, stretched 30%, three afterimage ghosts each, to **y 2.6** (high in the sky, well over the roofs). Bins and cone hop 0.4, land back on their spots at 5.70. Big post wave and lamp wobble, settled by 6.40. Elephant unsquashes 5.00–5.80 with jelly wobble; trunk lowers 5.80–6.40. Ghosts end at 6.40. |
| **6.40** | At the apex everyone squashes round (10%) and holds. Dachshund ears snap straight up; tail stops. |
| **6.40–8.60** | **The hang.** Each neighbour bobs ±0.03 (slow, 0.5 Hz, out of phase with each other). 6.60: white letter flecks lift out of the mailman's bag and hang in a loose cloud around him. 6.60: the duck floats 0.3 up out of the tub and hangs there; the water stays in. 7.40–7.90: grandma's glass rises to her head and tips 20° (a sip); 7.90–8.20 back to her lap. Elephant stands perfectly still, trunk down. Window flickers. |
| **8.60–9.20** | Fall, stretched 30%, three ghosts each. 8.80–9.30: the letter flecks fall back *into* the bag. Duck follows the tub a beat behind. |
| **9.20** | All four land at the same instant, each on its own spot. Squash 35%. Big tan dust puffs. Pale blue splash from the tub. Bins and cone do not move. |
| **9.30** | Dachshund ears flop down; tail wag resumes. |
| **9.35** | Duck plops back into the tub (small pale blue splash). |
| **9.20–10.40** | Jelly settle on all four, decaying to still. Dust fades out by 11.0. |
| **10.40–11.20** | Idle. Nothing happens, well. |
| **11.20–11.45** | **End reaction.** The elephant blinks once: dot eyes squash flat, then back. Nothing else moves. |
| **11.45–12.00** | Idle, all state equal to 0.00 (tail-wag phase and duck bob phase must land back on their 0.00 values; 2 Hz and 1 Hz both close at 12.0). Loop. |

**Loop check:** at 12.0 every position, squash, particle count (zero) and wobble (zero) equals 0.00. The small bounce at 1.5 s reads as the echo of the big landing the viewer just saw, so the loop seam is the "things that keep happening".

## Callbacks spent (from `notes/callback-bank.md`)

1. **Brad's bin is the wrong blue** — portable form "bins in three blues at any curb": three wheelie bins at the alley edge, three blues, never resolved. They hop on each boom and land exactly where they were.
2. **Decorative accent / cul-de-sac feature** and the season thread *purple → decorative accent → parking cone* — an orange cone (no lettering) at the elephant's back gate, as if the elephant were an approved feature. No scorch, no purple light, nobody names anything.
3. **EyeWash is always on somewhere in frame** — grandma's back window glows pale blue-white with a faint test pattern. Nobody looks at it, nobody changes the channel, it does not air this show.
4. **The HOA clubhouse place block** (the lamp at the end of Fenwick, an LED since March) — the lamp post at frame right glows cold white and wobbles; it never launches. Unnamed on screen.

Not spent: Pizza Guy (cameo would need a character id and he never flinches or flies), Biscuit, the Black Cat, the Item numbers (text-only).

## Five-question check

1. A 9-year-old says it back: *the elephant jumps and everybody else goes flying.* Yes.
2. Muted: the street leaving the ground at 5.0 s and landing at 9.2 s is visible. Yes.
3. Calmest in frame: the elephant (dot eyes, one blink) and four neighbours who keep sipping, bathing and sitting while they fly. Yes.
4. No words on screen. Yes.
5. One world: the cul-de-sac back yards. Yes.

## Cut in the room

- The trampoline mat dipping a little — breaks the lock. Cut.
- Houses bouncing — budget, and it dilutes "everyone else". Cut.
- A third, enormous bounce that throws everyone out of frame — breaks the loop and "come down in their own yard". Cut.
- Neighbours swapping yards on the landing — fun, but breaks the seed lock. Cut (possible separate seed).

## Optional Grok Imagine clip plan (reference only, not the in-hub film)

Two 6 s clips, chained. Clip 1 (6 s) = 0.0–6.0 s, ends on the big launch nearly at apex; its last frame is clip 2's start still. Clip 2 (6 s) = 6.0–12.0 s, ends on the idle frame. Start still for clip 1 is the record's `grokImaginePrompt` with the neighbours on the ground (replace "high in the flat light-blue sky above the rooftops" with "each in its own yard" and "trunk straight up" with "trunk down"). No cast bible members appear, so no Appearance blocks.
