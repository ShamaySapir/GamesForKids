# Spec: Numbers island, kindergarten – 1st grade (אִי הַמִּסְפָּרִים)

- **Status:** Approved by user on 2026-11-01 for skills 1–10 (kindergarten + 1st grade); skills 11–14 (2nd grade) moved to Stage 4b
- **Stage:** 4 (docs/ROADMAP.md)
- **Relies on:** DECISIONS D3, D6, D7, D8, D11 · docs/RESEARCH.md § "Math, kindergarten – 2nd grade: NEW curriculum"
- **Replaces:** the `comingSoon` placeholder in `src/subjects/math/`

## Goal

Ages 5–7. The child counts and recognises quantities, builds number sense to 100, masters the splits of 10 and
addition/subtraction within 20, adds and subtracts whole tens, and handles money to 20 ₪ — following the **new**
ministry curriculum for grade 1 (from 2024‑25) and the kindergarten curriculum. The user asked to start smaller:
**this stage is skills 1–10**; the 2nd-grade skills 11–14 below are kept as the plan for Stage 4b.

## Curriculum basis

- Gan: counting objects to 20, symbols 0–10, comparing groups, joining/separating within 10 with objects, dot dice.
- Grade 1: numbers to 100, counting by 10s/5s/2s, subitizing, the number line (exact and approximate placement,
  misplaced number), **all splits of 10**, add/subtract within 20 with any strategy, missing numbers on either side,
  whole tens by analogy, money to 20 ₪. ×/÷, odd/even and `<` `>` are **not** grade 1 in the new curriculum.
- Grade 2: numbers to 1,000 and place value, `<` `>`, **facts within 20 by heart**, two-digit add/subtract,
  odd/even (0 is even), multiplication as arrays and repeated addition, **2, 4, 5, 10 tables** and division.
- Representations are the ones the documents name: objects and dot dice, the number line, the hundred chart,
  coins, arrays, place-value "house". Any reasonable strategy is accepted; fluency means command, never speed (no timers).
- Item formats mirror the curriculum examples: "who am I?", missing numbers on a line or chart, misplaced number,
  missing addend on either side, compare without solving, odd one out, money change.

## Skills

| # | ID | Title (child-facing) | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 1 | `math.count-10` | סוֹפְרִים עַד 10 | Gan | — | 🍎 | how-many, show-me |
| 2 | `math.numerals-10` | מַכִּירִים מִסְפָּרִים | Gan | — | 🔢 | hear-number, match, domino |
| 3 | `math.compare` | אֵיפֹה יוֹתֵר? | Gan | count-10 | ⚖️ | more-less, most |
| 4 | `math.stories-10` | סִפּוּרֵי חֶשְׁבּוֹן | Gan | count-10 | 🧺 | join-separate |
| 5 | `math.count-100` | סוֹפְרִים עַד 100 | 1 | numerals-10 | 💯 | next-before, skip-count, who-am-i |
| 6 | `math.number-line` | יְשַׁר הַמִּסְפָּרִים | 1 | count-100 | 📏 | place, which-number, misplaced |
| 7 | `math.splits-10` | חֲבֵרִים שֶׁל 10 | 1 | stories-10 | 🤝 | hidden, all-splits |
| 8 | `math.within-20` | חִבּוּר וְחִסּוּר עַד 20 | 1 | splits-10 | ➕ | solve, missing |
| 9 | `math.tens` | עֲשָׂרוֹת שְׁלֵמוֹת | 1 | within-20, count-100 | 🔟 | tens-analogy |
| 10 | `math.money` | קוֹנִים בַּחֲנוּת | 1 | within-20 | 🪙 | pay, change |
| *4b* | | *2nd grade — Stage 4b, not built now* | | | | |
| 11 | `math.place-value` | אֲחָדוֹת, עֲשָׂרוֹת, מֵאוֹת | 2 | number-line | 🏠 | build-number, compare-signs |
| 12 | `math.within-100` | חִבּוּר וְחִסּוּר עַד 100 | 2 | tens, place-value | 🧮 | solve, missing |
| 13 | `math.odd-even` | זוּגִי וְאִי זוּגִי | 2 | count-100 | 👟 | pairs |
| 14 | `math.times` | כֶּפֶל וְחִלּוּק | 2 | within-20 | ✖️ | array, groups, share |

### Skill details (ranges, mechanics, distractors)

1. **Count to 10.** how-many: objects (one emoji kind) shown in a row, scattered, or as a dice pattern; pick the
   number of 3–4. Small quantities (≤ 5) in dice patterns invite subitizing. show-me: hear/see a number, tap a basket
   to add objects (tap an object to remove), then Check. Distractors: ±1, ±2.
2. **Numerals to 10.** hear-number: hear "שֶׁבַע", pick 7 of 4 (look-alike digits 6/9, 1/7 among distractors).
   match: a numeral and 3 quantity pictures. domino: a domino-style dot pattern (1–6, dice layout); pick the one of 3
   with the same number of dots, drawn in a *different* arrangement (scatter or row), so the child matches quantity, not shape.
   (Added 2026-11-01 from the user's workbook for ages 4–5.)
3. **More / fewer.** more-less: two groups (≤ 10 each, never equal); "where are there more/fewer?" Aid: pairs lines
   between items (one-to-one matching), as the gan curriculum describes. most: three groups of the same object, all
   different counts (differences ≥ 1, ≤ 10); "where are there the most?" (Added from the user's workbook.)
4. **Join/separate stories within 10.** A short spoken story with objects ("3 birds on the tree, 2 more came")
   shown as pictures; pick the result. Separation shows the leaving objects faded. No symbols in gan.
5. **Count to 100.** next-before: "what comes after 39?" / before; skip-count: a sequence by 10s, 5s or 2s with a
   gap (also backward by 2s from ≤ 50); who-am-i: "1 more than 84", "between 42 and 44". Answers via a number pad (0–9 keys, ⌫, ✓).
6. **Number line.** place: drag a marker to where a number belongs on a line 0–10, 0–20 or 0–100 (ticks every 1 or 10;
   tolerance: exact on 0–20, ±3 on 0–100). which-number: a marked point, pick the number of 3. misplaced: one label is
   wrong — tap it. Lines are drawn left-to-right with an arrow (numbers stay LTR inside RTL UI).
7. **Splits of 10.** hidden: 10 dots, some under a cup ("7 outside — how many hidden?"); answer with the number pad.
   all-splits: find all pairs that make 10 (tap pairs on a board until all 6 are found, 0+10 … 5+5, order-free).
8. **Within 20.** solve: `8 + 5 = ?`, `13 − 6 = ?`; missing: `? + 6 = 14`, `15 − ? = 9`, blank on either side.
   Aid: a number line 0–20 with jumps drawn. Item key: the fact (`8+5`), Leitner-reviewed (D7).
9. **Whole tens.** `20 + 60 = ?`, `90 − 30 = ?` shown next to `2 + 6` (analogy), with 10-₪ coins as the picture.
10. **Money to 20 ₪.** pay: a toy with a price; drag coins (1, 2, 5, 10 ₪; original SVG drawings) into the wallet to pay
    exactly; any combination works. change: "you paid 20, it costs 13 — how much change?" (number pad).
11. **Place value.** build-number: hear/see 347, build it with hundreds/tens/ones in a place-value "house" (+/− per
    column); flexible splits accepted where asked ("56 = 4 tens and ? ones"). compare-signs: `342 ? 324` → pick `<`, `>` or `=`.
12. **Within 100.** two-digit add/subtract mentally, with and without crossing a ten; missing numbers; estimate first
    (optional aid: "is it more or less than 50?"). Column layout is out of scope for now.
13. **Odd/even.** pairs: objects pair up (shoes, socks); "is there a friend for everyone?" → זוגי / אי זוגי; then numbers to 100. 0 is even.
14. **Times.** array: an emoji grid (e.g. 4 rows of 5) → pick the exercise or the result; groups: equal groups
    ↔ repeated addition ↔ `4 × 5`; share: share 12 cookies among 3 plates (drag) → `12 ÷ 3`. Tables 2, 4, 5, 10 only.

Numbers are always shown in digits, LTR; exercises use `+ − × ÷ = < >`, LTR inside the RTL page.

## Games (mechanics)

| Component | Where | Used by |
|---|---|---|
| `PickGame` | promoted from the letters island to shared UI (T0), extended with prompt kinds `objects` (count + layout) and `expr` (LTR exercise) and `number` / `objects` options | 1, 2 (incl. domino), 3 (incl. most), 4, 6 (which) |
| `NumberPadGame` | new | 5, 7 (hidden), 8, 9, 10 (change) |
| `NumberLineGame` | new | 6 (place, misplaced) |
| `TapBuildGame` | new: tap to add/remove objects, then Check | 1 (show-me) |
| `CoinsGame` | new: drag coins into a wallet | 10 (pay) |
| `PairsBoardGame` | new: find all pairs on a board | 7 (all-splits) |

Stage 4b will add `grid` prompts, a place-value builder and `ShareGame`.

All new components support mouse, touch and keyboard, like the existing ones.

## Spoken numbers

`numberPhrase(n)` (0–100) composes recordings from blocks, in the feminine counting form used for numbers:
units `math.n.0–9` (אֶפֶס, אַחַת, שְׁתַּיִם…), teens `math.n.10–19`, tens `math.n.20…90`, "and"-units `math.and.1–9`
(וְאַחַת, וּשְׁתַּיִם…), and `math.n.100` (מֵאָה). ≈ 38 blocks cover 0–100; Stage 4b adds hundreds to reach 1,000.
Operators: `math.op.plus` (וְעוֹד), `minus` (פָּחוֹת), `times` (כָּפוּל), `div` (לְחַלֵּק לְ), `equals` (שָׁוֶה), `more`/`less`.

## Phrases and recordings

≈ 38 number blocks + 6 operators + ~25 instructions + ~25 join/separate stories + ~15 money items ≈ **110 recordings**, mostly short.

## Acceptance criteria

- `numberPhrase` test for every number 0–100 (only declared phrases; spot-checks of correct Hebrew: 0, 2, 12, 21, 40, 99, 100).
- Generator tests over ≥ 200 seeds: answer reachable; no duplicate options; distractors never equal the answer; ranges per
  skill respected; facts within 20 never exceed 20 or go below 0; compare groups never equal; money combinations always
  payable with the offered coins; all-splits boards contain every split of 10 exactly once.
- E2E: a count round (gan), a within-20 round with the number pad by keyboard, and a number-line placement by drag.
- Screenshots of every component (desktop + 390px, light + dark); numbers and exercises read LTR inside RTL.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Promote `PickGame` + its types to `src/ui/pick/` (letters and reading islands import from there), add `objects`/`expr` prompts and `number` options; math types + phrase-ID contract; `numberPhrase` + number blocks | planner | `src/ui/pick/**`, `src/subjects/{hebrew,reading}/**` imports, `src/subjects/math/{types,ids,numbers,numbers.test}.ts` | — |
| T1 | Instructions, stories, money items, phrases + content test | content | `src/subjects/math/content/**`, `phrases.ts` (non-number phrases), `content.test.ts` | T0 |
| T2 | Generators for skills 1–10 + tests | builder A | `generators.ts`, `generators.test.ts` | T0 |
| T3a | `NumberPadGame`, `NumberLineGame`, `TapBuildGame` + tests | builder B | `games-pad.tsx`, `games-line.tsx`, `games-build.tsx`, `math.css`, tests | T0 |
| T3b | `CoinsGame`, `PairsBoardGame` + coin SVGs + tests | builder C | `games-coins.tsx`, `games-pairs.tsx`, `coins.tsx`, `math-coins.css`, tests | T0 |
| T4 | Wire `index.ts`, E2E, screenshots, docs | planner + reviewer | `index.ts`, `e2e/math.spec.ts` | T1–T3 |

T1, T2, T3a, T3b run in parallel (four agents; above the usual three because their files never overlap).

## Out of scope

Everything in skills 11–14 (Stage 4b), column addition/subtraction layout, measurement (length, perimeter, solids), geometry, data, word problems beyond the
join/separate and money ones, the hundred chart as its own game, grades 3–6 (Stage 5).
