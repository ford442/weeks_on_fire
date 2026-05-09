# Minimax Music 2.6 Prompting Guide

A guide for writing effective song prompts for Minimax Music 2.6, based on hands-on experimentation with the weeks_of_fire project.

## Overview

Minimax Music 2.6 has specific behaviors around tokenization, inflection handling, and prompt density that differ from other AI music generators. This guide documents what works and what doesn't.

---

## Tokenization & Prompt Length

### Key Findings

**Minimal vs. Verbose Prompts:**
- **Few words**: [Add observations here]
- **Detailed descriptive chains**: [Add observations here]
- **Optimal range**: [What length/token count seems to work best?]

**Example Comparisons:**
```
Minimal prompt: 
[Add your example]

Detailed prompt:
[Add your example]

Result difference:
[What changed in the output?]
```

---

## Inflection Marks & Special Characters

### The Inflection Problem

Minimax sings inflection marks `(inflection)` as literal lyrics, unlike some other generators.

**What doesn't work:**
```
"Verse with (soft inflection) on this word"
→ Minimax output: "...on this word soft inflection..." (sung as text)
```

**Workarounds tested:**
- [What have you tried instead?]
- [Did removing them entirely help?]
- [Any alternative notation that works?]

**Current best practice:**
[What's your recommendation for avoiding this?]

---

## Prompt Structure & Phrasing

### Genre & Style Chains

How does Minimax respond to different styles of genre/mood description?

**Example styles:**
```
Style 1: [Your phrasing here]
Result: [What it produced]

Style 2: [Your phrasing here]
Result: [What it produced]

Style 3: [Your phrasing here]
Result: [What it produced]
```

### Adjective Density

Does Minimax prefer:
- **Sparse**: "upbeat, melancholic" (fewer tokens)
- **Detailed**: "upbeat synthpop with melancholic undertones, 90s nostalgia, major key" (more tokens)
- **Poetic**: "midnight rain meets electric joy" (metaphorical)

**Your findings:**
[Add observations]

---

## What Works Well

### Successful Prompt Patterns

Patterns that consistently produce good results:

1. [Pattern + example + outcome]
2. [Pattern + example + outcome]
3. [Pattern + example + outcome]

---

## What Doesn't Work

### Common Failures & Gotchas

Things that break or produce unexpected results:

1. **[Issue name]**
   - Symptom: [What happens]
   - Why: [Your theory about why]
   - Workaround: [What to do instead]

2. **[Issue name]**
   - Symptom: [What happens]
   - Why: [Your theory about why]
   - Workaround: [What to do instead]

---

## Prompt Template for weeks_of_fire Episodes

Based on your experimentation, here's a template for writing song prompts:

```
[Your recommended structure here]

Example for Episode 3:
[Add a real example from your work]
```

---

## Tokenization Tips

### Token Efficiency

- **Average tokens per word**: [If you know this]
- **Optimal prompt length**: [Tokens or word count]
- **Diminishing returns after**: [Point where more description doesn't help]

### Descriptor Prioritization

When you're at the token limit, which descriptors matter most?
1. [Most important]
2. [Second]
3. [Third]

---

## Testing & Iteration

### How to Validate a Prompt

Your process for testing:
1. [Step]
2. [Step]
3. [Step]

### Metrics You Track

What do you listen for?
- [Metric/quality indicator]
- [Metric/quality indicator]
- [Metric/quality indicator]

---

## Quick Reference: Do's & Don'ts

| Do | Don't |
|----|-------|
| [What works] | [What doesn't] |
| [What works] | [What doesn't] |
| [What works] | [What doesn't] |

---

## Related Files

- `prompts/` — Saved Minimax prompts by episode
- `songs/` — Track notes and Minimax generation log
- `scripts/generate-prompts.py` — (Could be extended for Minimax music prompts)

---

**Last Updated**: [Date]  
**Based on Minimax Music 2.6 version**: [Version if applicable]

---

Made with Grok Imagine magic ✨ (and Minimax Music harmony 🎵)
