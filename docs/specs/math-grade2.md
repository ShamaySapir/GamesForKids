# Spec: Numbers island, 2nd grade (Stage 4b)

- **Status:** Approved by user on 2026-11-02 — in progress
- **Stage:** 4b (docs/ROADMAP.md) — continues `docs/specs/math-k2.md` (skills 1–10, built)
- **Relies on:** DECISIONS D3, D6, D7, D8, D14 · docs/RESEARCH.md § "Math … NEW curriculum" (grade 2)

## Goal

2nd grade, new curriculum (from 2025‑26): numbers to 1,000 and place value, `<` `>` `=`, counting in steps to 1,000,
two-digit addition and subtraction, odd/even, and multiplication and division with the 2, 4, 5 and 10 tables —
on the same island, after the 1st-grade skills.

## Curriculum basis (new grade 2, [V] in RESEARCH.md)

- Numbers to 1,000; place value to hundreds, **flexible splits** (56 = 4 tens + 16 ones); `<` `>`.
- Counting by 10, 20, 50 to 1,000; by 10 and 100 from numbers that aren't multiples; number charts.
- **Full command of facts within 20**; adding/subtracting tens and two-digit numbers, first in a row; estimating first.
- Odd/even: even = a sum of two equal whole numbers, so 0 is even.
- Multiplication as repeated addition, arrays, equal jumps; **tables 2, 4, 5, 10 + division** (sharing and grouping).
- Not in grade 2 (left out): parentheses, divisibility rules, fractions, area, weight; column layout is optional (later).

## Skills (continuing the island's numbering)

| # | ID | Title | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 11 | `math.place-value` | אֲחָדוֹת, עֲשָׂרוֹת, מֵאוֹת | 2 | number-line | 🏠 | build-number, flexible, compare-signs |
| 12 | `math.count-1000` | סוֹפְרִים עַד 1000 | 2 | place-value | 🗺️ | skip-1000, hundred-chart |
| 13 | `math.within-100` | חִבּוּר וְחִסּוּר עַד 100 | 2 | tens, place-value | 🧮 | solve, missing, estimate |
| 14 | `math.facts-20` | עוּבְדוֹת עַד 20 בְּעַל פֶּה | 2 | within-20 | ⚡ | facts |
| 15 | `math.odd-even` | זוּגִי וְאִי זוּגִי | 2 | count-100 | 👟 | pairs, numbers |
| 16 | `math.times` | כֶּפֶל | 2 | facts-20 | ✖️ | array, groups, tables |
| 17 | `math.divide` | חִלּוּק | 2 | times | 🍪 | share, groups-of |

### Details

11. **Place value.** build-number: hear/see 347; build it in a place-value "house" with hundreds, tens and ones columns
    (+/− per column, ≤ 9 each). flexible: "56 = 4 tens and ? ones" (number pad), and the reverse. compare-signs: `342 ? 324` →
    `<` `>` `=` (pick); distractor pairs differ in one place (342/324, 340/430) to target the classic mistake.
12. **Count to 1,000.** skip-1000: a sequence by 10, 20, 50 or 100 with a gap, also starting from a non-multiple (37, 47, 57…).
    hundred-chart: a 10×10 chart (any hundred block, e.g. 301–400) with 3–5 empty cells; tap a cell and type its number.
13. **Within 100.** solve and missing with two-digit numbers, with and without crossing a ten (`47 + 25`, `83 − 38`); never
    negative, never over 100. estimate (aid and its own game): "is 47 + 25 more or less than 70?" before solving.
14. **Facts within 20 by heart.** Mixed addition/subtraction facts to 20, Leitner-reviewed (D7), the facts a child misses come back.
    **No timer** (grades ≤ 2): fluency shows as streaks of first-try answers, rewarded with a "lightning" badge per round.
15. **Odd/even.** pairs: objects pair up ("does everyone have a friend?") → זוּגִי / אִי זוּגִי; numbers: is 0…100 odd or even (0 is even).
16. **Times (2, 4, 5, 10).** array: an array of objects (rows × cols) → pick the exercise or the result. groups: equal groups ↔
    repeated addition ↔ `4 × 5`. tables: facts of the 2, 4, 5, 10 tables on the number pad, Leitner-reviewed.
17. **Divide.** share: share 12 cookies between 3 plates by dragging (equal shares) → `12 ÷ 3 = ?`. groups-of: "how many
    groups of 4 in 20?" with objects. Only facts from the 2, 4, 5, 10 tables; no remainders; never divide by 0.

## Spoken numbers

`numberPhrase` grows to 0–1,000: hundreds blocks `math.h.1–9` (מֵאָה, מָאתַיִם, שְׁלוֹשׁ מֵאוֹת … תְּשַׁע מֵאוֹת) joined by "וְ" before
the last part, as numbers are said (שְׁלוֹשׁ מֵאוֹת אַרְבָּעִים וְשֶׁבַע, שְׁלוֹשׁ מֵאוֹת וְשֶׁבַע), and `math.n.1000` (אֶלֶף). ≈ 20 new blocks.
Signs: `math.op.less` (קָטָן מִ…), `math.op.greater` (גָּדוֹל מִ…), `math.op.times` (כָּפוּל), `math.op.div` (לְחַלֵּק לְ).

## Games (mechanics)

| Component | Where | Used by |
|---|---|---|
| `PickGame` | shared; `ObjectGroup` gets `layout: 'array'` with `cols` | 11 (signs), 13 (estimate), 15, 16 (array, groups) |
| `NumberPadGame` | numbers island | 11 (flexible), 12 (skip), 13, 14, 16 (tables), 17 (groups-of) |
| `PlaceValueGame` | new | 11 (build-number) |
| `HundredChartGame` | new | 12 (hundred-chart) |
| `ShareGame` | new | 17 (share) |

## Phrases and recordings

≈ 20 number blocks + 4 signs + ~20 instructions ≈ **45 recordings**.

## Acceptance criteria

- `numberPhrase` for every number 0–1,000 (spot-checks: 100, 105, 120, 200, 347, 999, 1000).
- Generator tests over ≥ 200 seeds: answers reachable through each UI (house columns ≤ 9, hundred-chart blanks inside the block,
  shares always equal, no remainders); compare pairs differ in one place where intended; within-100 never negative or > 100;
  tables only 2, 4, 5, 10; 0 counted as even.
- E2E: place-value build by keyboard, a within-100 round, a share round by drag.
- Screenshots of the three new components (desktop + 390px, light + dark); "can a child get it right without the skill?" check.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | numberPhrase to 1,000 + blocks; `array` layout in shared Objects; new question types + IDs | planner | `src/subjects/math/{numbers,types,ids}.ts`, `content/numbers.ts`, `src/ui/pick/**` | — |
| T1 | Instructions/phrases (≈ 25 short lines — written by the planner in T0, no agent needed) | planner | `phrases.ts` | T0 |
| T2 | Generators for skills 11–17 + tests | builder | `generators-g2.ts`, `generators-g2.test.ts` | T0 |
| T3 | `PlaceValueGame`, `HundredChartGame`, `ShareGame` + tests | builder | `games-place.tsx`, `games-chart.tsx`, `games-share.tsx`, `math-g2.css`, tests | T0 |
| T4 | Wire into `index.ts`, E2E, screenshots, docs | planner | `index.ts`, `e2e/math.spec.ts` | T1–T3 |
