# Screenplay Template — *Weeks on Fire* Series

*A lightweight Fountain-style template for all episodes.*  
*Copy this file to `episodes/episode-N/screenplay.md` and fill in your content.*

---

## How to Use This Template

- Replace all `[BRACKETED PLACEHOLDERS]` with your actual content.
- Keep `<!-- GROK -->` and `<!-- MUSIC -->` comment blocks adjacent to the scenes they annotate — these are production notes, not dialogue.
- Preserve `FADE IN:`, `CUT TO:`, and `FADE OUT:` for editorial clarity.
- Scene headings follow the format: `INT./EXT. LOCATION — TIME`
- Character names appear in ALL CAPS when first introduced in action lines, and as headings before their dialogue.
- Keep action lines lean: what we *see*, what we *hear*, what matters.

---

```
WEEKS ON FIRE
Episode [N]: [TITLE]

Written by [AUTHOR]
Draft: [DATE]

Based on original material in episodes/episode-[N]/synopsis.md
```

---

`FADE IN:`

---

### Scene 1 — [SCENE TITLE]

```
INT./EXT. [LOCATION] — [DAY/NIGHT/DUSK/etc.]

[Action paragraph: describe what we see. One to four sentences. 
Present tense. Active voice. What matters visually.]

[CHARACTER NAME]
(parenthetical if needed)
Dialogue line.

[SECOND CHARACTER]
Response. Keep it short.
```

> <!-- GROK: "[Full Grok Imagine prompt for this scene/shot]" -->  
> <!-- MUSIC: [Cue description — e.g. "Soft synth arpeggio enters, ~0:00. Low piano swells at ~0:30."] -->

`CUT TO:`

---

### Scene 2 — [SCENE TITLE]

```
INT./EXT. [LOCATION] — [TIME]

[Action lines...]

[CHARACTER NAME]
Dialogue.
```

> <!-- GROK: "[Prompt seed]" -->  
> <!-- MUSIC: [Cue note] -->

`CUT TO:`

---

*(Continue adding scenes. Use `SMASH CUT TO:` for hard transitions,  
`DISSOLVE TO:` for time passage, `INTERCUT WITH:` for parallel action.)*

---

`FADE OUT.`

---

## Production Notes Section

Include at the bottom of each screenplay file:

```markdown
## Production Notes

**Episode Runtime (target):** [X min]
**Music Sync Summary:**
- Scene 1: [cue]
- Scene N: [cue]

**Grok Imagine Priority Shots:**
1. [Shot description + prompt seed]
2. ...

**The Two (Vivienne & Liliane) — Appears:** [Yes/No — Scene N]
**Pizza Guy — Appears:** [Yes/No — Scene N]
**Key Props:** [list]
**Status:** [Draft / Revised / Ready for Asset Gen]
```

---

## Reference Conventions

| Element | Convention |
|---|---|
| Scene heading | `INT. LOCATION — NIGHT` (all caps) |
| Character cue | `CHARACTER NAME` (all caps, centered) |
| Parenthetical | `(quietly)` or `(to Liliane)` — brief, one line max |
| Action line | Present tense, lean, visual |
| Music cue | `<!-- MUSIC: ... -->` comment block |
| Grok Imagine prompt | `<!-- GROK: "..." -->` comment block |
| Transition | `CUT TO:` / `FADE TO:` / `SMASH CUT TO:` |
| V.O. | `CHARACTER (V.O.)` |
| O.S. | `CHARACTER (O.S.)` — off screen, heard but not seen |

---

*This template is part of the Weeks on Fire production hub. See `index.html` for the full asset overview.*
