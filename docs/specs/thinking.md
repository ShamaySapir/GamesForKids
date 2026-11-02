# Spec: Thinking island, ages 4–6 (אִי הַחֲשִׁיבָה)

- **Status:** Approved by user on 2026-11-02 — in progress
- **Stage:** 4c (docs/ROADMAP.md)
- **Relies on:** DECISIONS D3, D6, D7, D8, D11, D14 · docs/RESEARCH.md § Math (gan curriculum)
- **Origin:** the user's son's workbook for ages 4–5 (odd one out, symmetry, quantity matching), extended to 12 ideas

## Goal

Ages 4–6 (טְרוֹם חוֹבָה and גַּן חוֹבָה). Visual perception, logical and spatial thinking — the "before reading and
math" skills: noticing differences, symmetry, patterns, order, categories and position words. Every idea has
**at least 6 different examples** and uses **drawings made for this age**: original SVG illustrations where the idea
needs precise control (direction, symmetry, a missing part), emoji only where the picture is unambiguous.

## Curriculum basis

The kindergarten math curriculum (2010, pp.12–14) names repeating patterns, 2D shapes, mirror symmetry, simple maps,
sorting by a rule and position/size words. Visual discrimination (direction, orientation) is the perceptual
groundwork for telling look-alike letters apart (ב/כ, ד/ר), which the letters island practices later.
No timers; no reading required — every instruction is spoken and every answer is a picture.

## New age level

`Grade` gains `-1` = טְרוֹם חוֹבָה (age 4). The profile picker offers it; island screens label it "טרום חובה".
Skills marked −1 are unlocked from the start; skills marked 0 follow them on the path.

## Skills (one per idea)

| # | ID | Title | Age | Requires | Sticker | Game | Examples |
|---|---|---|---|---|---|---|---|
| 1 | `think.odd-one` | מִי שׁוֹנֶה? | −1 | — | 🦄 | pick | ≥ 30 sets: 6+ each by direction, color, size, shape, kind |
| 2 | `think.twin` | מִצְאוּ אֶת הַתְּאוֹם | −1 | — | 👯 | pick | ≥ 12 sets of 4 near-identical drawings |
| 3 | `think.shadows` | צְלָלִים | −1 | — | 🌑 | pick | ≥ 20 objects; silhouettes drawn from the same art |
| 4 | `think.patterns` | מָה בָּא אַחַר כָּךְ? | −1 → 0 | — | 🔁 | pick | AB, AAB, ABB, ABC (6+ each), then growing ●, ●●, ●●● (6+) |
| 5 | `think.where` | אֵיפֹה זֶה? | −1 | — | 📦 | pick | 8 position words × 6+ scenes: עַל, מִתַּחַת, בְּתוֹךְ, לְיַד, בֵּין, לִפְנֵי, מֵאֲחוֹרֵי, לְמַעְלָה/לְמַטָּה |
| 6 | `think.memory` | זִכָּרוֹן | −1 | — | 🧠 | memory | 6+ card themes; 3 pairs (age 4) → 6 pairs (age 6) |
| 7 | `think.symmetry` | סִימֶטְרִיָּה | 0 | odd-one | 🦋 | pick + complete | ≥ 12 symmetric drawings: match the other half; complete the missing half |
| 8 | `think.sequence` | מָה קָרָה קֹדֶם? | 0 | patterns | 🌱 | order | ≥ 12 picture sequences of 3–4 steps (seed → sprout → flower) |
| 9 | `think.sorting` | מְמַיְּנִים | 0 | odd-one | 🧺 | sort | ≥ 12 boards: by kind (fruit / vehicles / animals), then by a rule (color, size) |
| 10 | `think.missing` | מָה חָסֵר? | 0 | twin | 🪑 | pick | ≥ 12 drawings with one part missing (a chair with three legs, a face with one eye) |
| 11 | `think.differences` | מִצְאוּ אֶת הַהֶבְדֵּלִים | 0 | twin | 🔍 | differences | ≥ 8 scene pairs with 3–5 differences each |
| 12 | `think.maze` | מָבוֹךְ | 0 | where | 🐭 | maze | ≥ 10 mazes, 5×5 → 7×7, lead a character to its goal |

### Details and distractor rules

1. **Odd one out.** 4 pictures, 3 identical in the varying property, one different. *Direction* uses the same drawing
   mirrored (a dog facing right among three facing left — the workbook's example). Only one property varies per set.
2. **Twin.** A sample and 4 candidates, 3 of which differ by one small detail (a missing button, a different stripe).
3. **Shadows.** An object and 3 silhouettes (or a silhouette and 3 objects); distractors have similar outlines.
   Silhouettes are generated from the same SVG (fill set to the shadow color), so they always match exactly.
4. **Patterns.** A row of 5–8 items with the next one missing; pick it of 3. Distractors are items from the pattern.
5. **Where is it?** The owl asks "where is the ball? *under* the table" — pick the picture of 3 that matches the
   position word; the three pictures show the same objects in different positions.
6. **Memory.** Flip two cards; matching pairs stay open. A wrong pair is not a mistake (that is how memory works):
   it does not count as a miss; the round ends when all pairs are found.
7. **Symmetry.** match: half a drawing and 3 candidate halves (one mirrors it). complete: tap the cells of a
   grid to complete a symmetric pattern (age 6).
8. **Sequence.** 3–4 pictures of a process, shuffled; order them (reuses the reading island's `OrderGame`, D11).
9. **Sorting.** 6 cards into 2 baskets (reuses the letters island's `SortGame`, D11) by kind, then by a rule.
10. **What's missing?** A drawing with a part missing; pick the missing part of 3.
11. **Differences.** Two drawings side by side; tap each difference in the right-hand one; a circle marks it.
    Wrong taps are gentle ("לֹא כָּאן") and count as a miss only after three in a row.
12. **Maze.** Move a character with arrows / swipe / tap an adjacent cell to its goal (mouse → cheese).
    No dead-end penalty; the path drawn so far stays visible.

## Art

An original **SVG art kit** in `src/subjects/thinking/art/`: simple, friendly, flat drawings with thick outlines in theme
colors, each a React component with props for the variations the games need (`facing`, `color`, `size`,
`missing` part, `silhouette`). About 40 drawings: animals, toys, food, furniture, vehicles, nature, a face, a house.
Emoji are used only where the variation does not matter (memory cards, sorting by kind, maze characters).
Drawings must read clearly at 90px on a phone and in dark mode.

## Games (mechanics)

| Component | Where | Used by |
|---|---|---|
| `PickGame` | shared (D14), with a new option/prompt kind `art` (an art-kit drawing + props) | 1, 2, 3, 4, 5, 7 (match), 10 |
| `OrderGame` | reading island (D11) | 8 |
| `SortGame` | letters island (D11) | 9 |
| `MemoryGame` | new | 6 |
| `SymmetryGridGame` | new | 7 (complete) |
| `DifferencesGame` | new | 11 |
| `MazeGame` | new | 12 |

## Phrases and recordings

Instructions (~20), position words in context (~16), names of drawings used in sentences (~40), feedback
("לֹא כָּאן", "מְצָאתֶם אֶת כֻּלָּם!") — about **80 short recordings**.

## Acceptance criteria

- Content test: example counts per idea as in the table; every odd-one set varies exactly one property; every pattern
  has a unique correct continuation; every sequence has a single sensible order; every maze is solvable.
- Generator tests over ≥ 200 seeds: answer reachable; no distractor also correct; the "can a child get it right
  without the skill?" check (PLAYBOOK) — e.g. the odd one is never always in the same slot, silhouettes never differ in size.
- E2E: one pick round (odd one), one memory board, one maze — by mouse and by keyboard.
- Screenshots of every game and of the art kit sheet (desktop + 390px, light + dark), checked for clarity at a glance.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | `Grade −1` in core + profile + labels; `art` kind in shared PickQ; thinking types + IDs contract; island skeleton | planner | `src/core/engine/types.ts`, `src/app/**`, `src/ui/pick/**`, `src/subjects/thinking/{types,ids}.ts` | — |
| T1 | SVG art kit (~40 drawings with variation props) + an art sheet test page | builder (art) | `src/subjects/thinking/art/**` | T0 |
| T2 | Content: sets, patterns, scenes, sequences, sorting boards, mazes, phrases + content test | content | `content/**`, `phrases.ts`, `content.test.ts` | T0 (art IDs from T1's list in the contract) |
| T3 | Generators for all 12 skills + tests | builder | `generators.ts`, tests | T0 |
| T4 | `MemoryGame`, `SymmetryGridGame`, `DifferencesGame`, `MazeGame` + tests | builder | `games-*.tsx`, `thinking.css`, tests | T0 |
| T5 | Wire `index.ts`, E2E, screenshots, Hebrew review, docs | planner + reviewer | `index.ts`, `e2e/thinking.spec.ts` | T1–T4 |

## Out of scope

Timed games, scoring by speed, free drawing, letters and numbers (other islands), anything that needs reading.
