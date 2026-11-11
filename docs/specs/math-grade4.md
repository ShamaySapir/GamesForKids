# Spec: Numbers island, 4th grade (Stage 5b)

- **Status:** Draft, awaiting user approval
- **Stage:** 5b (docs/ROADMAP.md). Continues `docs/specs/math-grade3.md` (skills 18–28, built)
- **Relies on:** DECISIONS D7, D14, D19, **D23** · docs/RESEARCH.md § "Math, grades 3–6: NEW curriculum", grade 4 (cited `[G4 p.N]`)

## Goal

Grade 4 on the new curriculum. By the end, the child can:
- read, compare and round numbers up to a million, written with commas;
- add and subtract to a million;
- multiply many-digit numbers, through an area model;
- divide by a single digit, including a remainder in a real situation;
- recognise divisibility by 3, 6 and 9;
- use the order of operations with three operations;
- understand fractions: part of a whole and of a quantity, on the number line, comparing them, and adding or subtracting with like or related denominators;
- name quadrilaterals by their properties, and find parallel and perpendicular lines;
- convert between length units.

All of it lives on the numbers island, after grade 3.

## Curriculum basis (new grade 4, `[G4]` in RESEARCH.md)

- **Numbers to 1,000,000** [p.1–2]:
  - place value;
  - **digits in groups of three, separated by commas** (from grade 4 on, numbers of five digits or more are shown as 372,450);
  - comparing numbers;
  - number lines with ticks every 10,000 or 100,000;
  - rounding to thousands, ten-thousands and hundred-thousands.
- **+/− to a million** [p.2–4]:
  - several strategies, including the column layout and compensation (`4000 − 2397 = 3999 − 2396`);
  - estimation.
- **×** [p.4–6]:
  - mentally, whole tens, hundreds and thousands times a single digit, and times whole tens;
  - 2-digit × 1-digit, 2-digit × 2-digit and 3-digit × 1-digit, through the **rectangle (area) model** and the extended distributive law;
  - checking the last digit (76 × 5 ≠ 456) [p.6].
- **÷** [p.7–8]:
  - by a single digit, through the distributive law (splitting the dividend);
  - **division by 0 is not allowed**;
  - **a remainder in context**: a bus question rounds up.
- **Divisibility** by **3, 6 and 9** [p.9].
- **Order of operations** [p.9–11]: × and ÷ before + and −; same-level operations go left to right; parentheses first.
- **Fractions** [p.11–15]:
  - unit fractions and proper fractions;
  - fractions equal to 1, more than 1, and equal to 0;
  - part of a whole and part of a quantity;
  - the number line **from 0 to 1 only**;
  - comparing: unit fractions first, then by benchmarks (½, 1);
  - +/− with **like denominators**, and where one denominator is a **multiple** of the other;
  - whole × fraction.
  - Misconceptions the curriculum names:
    - "**1/3 < 1/4 because 3 < 4**";
    - half of 10 is not half of 20 [p.12–13].
- **Geometry** [p.16–21]:
  - parallel and perpendicular lines;
  - diagonals;
  - **quadrilaterals by their properties**: square, rectangle, rhombus, parallelogram and trapezoid, with **no inclusion** ("a square is a rectangle" is not taught);
  - length units **mm, cm, dm, m, km**, converting between **neighbouring units only**;
  - surface area of a box.
- **Left out of this stage** (see Out of scope):
  - the calendar (Gregorian and Hebrew), which goes to the clock island;
  - pie charts and misleading axes;
  - long division as a full written algorithm.

## Skills (continuing the island's numbering)

| # | ID | Title | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 29 | `math.million` | מִסְפָּרִים עַד מִילְיוֹן | 4 | place-10000 | 🏔️ | digit-value, compare-6, line-million, round-big |
| 30 | `math.add-million` | חִבּוּר וְחִסּוּר עַד מִילְיוֹן | 4 | add-10000, million | 🧮 | column-big, compensate, estimate-million |
| 31 | `math.multiply` | כֶּפֶל בְּמִסְפָּרִים גְּדוֹלִים | 4 | table, times-10 | 🟧 | round-times-2, area-model, last-digit |
| 32 | `math.divide-big` | חִלּוּק בְּמִסְפָּר חַד־סִפְרָתִי | 4 | remainder, multiply | 🚌 | split-divide, divide-pad, bus-story |
| 33 | `math.divisible-369` | מִתְחַלֵּק בְּ־3, 6, 9 | 4 | divisible | 🔎 | which-divides-369, sort-369 |
| 34 | `math.order-ops-2` | סֵדֶר פְּעֻלּוֹת 2 | 4 | order-ops | 🧠 | first-step-2, result-2 |
| 35 | `math.fractions` | מָה זֶה שֶׁבֶר? | 4 | divide | 🍕 | name-fraction, shade-fraction, part-of-quantity |
| 36 | `math.fraction-compare` | מַשְׁוִים שְׁבָרִים | 4 | fractions | ⚖️ | fraction-line, compare-fractions |
| 37 | `math.fraction-add` | חִבּוּר וְחִסּוּר שְׁבָרִים | 4 | fraction-compare | 🥧 | add-like, add-related, whole-times |
| 38 | `math.lines` | מַקְבִּילִים וּמְאֻנָּכִים | 4 | angles | 🛤️ | parallel-perpendicular, diagonals |
| 39 | `math.quadrilaterals` | מְרֻבָּעִים | 4 | lines | 🔷 | name-quad, quad-property |
| 40 | `math.length` | יְחִידוֹת אֹרֶךְ | 4 | times-10 | 📏 | convert-length, sensible-length |
| 41 | `math.box` | שֶׁטַח פְּנֵי תֵּבָה | 4 | area, multiply | 📦 | box-net |

Soft locks (D19) still apply: a grade 4 child starts at skill 29 or 38, and nothing is hard-locked.

### Details (content range, aid, distractors)

**29. Numbers to a million.** Numbers have five or six digits and are written with commas.
- *digit-value:* "what is the 7 worth in 372,450?" Pick from 70,000, 7,000, 700 or 7.
- *compare-6:* `<` `>` `=`. Pairs differ in one place or swap two digits; sometimes the pair has different lengths (99,999 vs 100,000).
- *line-million:* drag a marker to a target on a 0–1,000,000 line with ticks every 100,000.
- *round-big:* round to the nearest thousand, ten-thousand or hundred-thousand. Pick one of four. The distractors are the wrong place and the wrong direction.
- **Aid:** a place-value table with six columns.

**30. Adding and subtracting to a million.**
- *column-big:* the grade 3 `ColumnGame`, now up to six digits.
- *compensate:* `4000 − 2397 = 3999 − ?`, typed on the pad. The aid shows both numbers shifting by 1 on a number line.
- *estimate-million:* "is 238,400 + 415,900 more or less than 600,000?"

**31. Multiplying big numbers.**
- *round-times-2:* `300 × 4`, `40 × 30`, `2,000 × 5`, typed on the pad.
- *area-model:* `34 × 6` or `23 × 45` as a rectangle split into tens and ones. The child fills each part's product, then the total. This is the new `AreaModelGame`.
- *last-digit:* "can 76 × 5 be 456?" Pick yes or no. The aid circles the last digits (6 × 5 ends in 0).

**32. Dividing by a single digit.**
- *split-divide:* `84 : 4 = 80 : 4 + 4 : 4`. Pick the helpful split from three.
- *divide-pad:* 2–3-digit dividends with a single-digit divisor, typed on the pad. The quotient is whole, or there's a remainder shown in the grade 3 form "21, שְׁאֵרִית 3" (pick).
- *bus-story:* "100 children, 40 seats per bus: how many buses?" Read by the browser voice. The answer **rounds up**. The distractors are rounding down and the leftover itself.
- Never division by 0.

**33. Divisible by 3, 6 and 9.**
- The grade 3 `which-divides` and `SortGame`, with 3, 6 and 9.
- **Aid:** shows the digit sum (3 + 7 + 2 = 12). There is no rule text, so the child discovers it [p.9].

**34. Order of operations 2.**
- Three operations and one pair of parentheses, like `12 − 6 : 2 + 1` or `(12 − 6) : 2 + 1`.
- *first-step-2:* the grade 3 `FirstStepGame`.
- *result-2:* pick the result. The distractors are the plain left-to-right result and a wrong pairing.

**35. What is a fraction?**
- *name-fraction:* a shaded circle, rectangle or strip. Pick the fraction from four (3/4, 1/4, 4/3, 3/1).
- *shade-fraction:* tap parts of a strip to shade 3/5. This is the new `ShadeGame`.
- *part-of-quantity:* "1/3 of 12 apples" with objects, typed on the pad. Sometimes it's two wholes ("half of 10 and half of 20") [p.13].
- Denominators are 2–10, 12, and 100 for strips only.

**36. Comparing fractions.**
- *fraction-line:* place 3/4 on a 0–1 line divided into quarters. Uses the grade 1 `PlaceGame` with a fraction line.
- *compare-fractions:* `<` `>` `=`.
  - Unit fractions (1/3 ? 1/4: the curriculum's misconception).
  - Same denominator.
  - Benchmark to ½ or 1.
- **Aid:** two strips, one above the other.

**37. Adding and subtracting fractions.**
- *add-like:* `2/7 + 3/7 = ?`.
- *add-related:* `1/2 + 1/4 = ?`.
- *whole-times:* `3 × 1/4 = ?`.
- The answer is typed in the new `FractionPadGame`: a numerator box over a denominator box.
- The answer may be a mixed number or more than 1, and an equivalent fraction counts (2/4 = 1/2).
- **Aid:** strips showing both parts.

**38. Parallel and perpendicular.**
- *parallel-perpendicular:* pick the pair of lines that is parallel or perpendicular from three drawings, with random rotation.
- *diagonals:* "how many diagonals from one vertex?" for polygons with 4–8 sides, typed on the pad. The aid draws them.

**39. Quadrilaterals.**
- *name-quad:* pick the name of the shape shown: רִבּוּעַ, מַלְבֵּן, מְעֻיָּן, מַקְבִּילִית or טְרַפֵּז.
- *quad-property:* "which shape has two pairs of parallel sides and no right angle?" Pick from four drawings.
- Shapes are shown rotated, never only in the textbook position [p.18].
- Since the curriculum doesn't teach inclusion, every question has exactly one fitting answer. A square is never offered when "rectangle" is the answer.

**40. Length units.**
- *convert-length:* `3 מ׳ = ? ס״מ`, `40 מ״מ = ? ס״מ`, `2 ק״מ = ? מ׳`. Neighbouring units only [p.19].
- *sensible-length:* "how tall is a door?" Pick from 2 m, 20 cm, 200 m or 2 km.

**41. Surface area of a box.**
- *box-net:* a box's net on a grid. Type its area. Uses the grade 3 `GridAreaGame` with 6 rectangles.
- **Aid:** colours each pair of opposite faces the same.

## Shown and spoken numbers (D23)

- **Shown:** numbers of five digits or more get commas (372,450), as grade 4 teaches. Numbers of four digits stay plain.
- **Spoken up to 10,000:** the recorded blocks, as in grade 3.
- **Spoken above 10,000:** read whole by the browser voice.
  - A new `numberText(n)` writes the number in words with full nikud, through 1,000,000, so the voice says it correctly. Counting form: thousands are masculine (שְׁלוֹשׁ מֵאוֹת אַרְבָּעִים וּשְׁנַיִם אֶלֶף) and the rest feminine.
  - Content tests compare it with the recorded blocks up to 10,000.
- **Fractions** are spoken from recorded blocks, about 20 of them (רֶבַע, שְׁלוֹשָׁה רְבָעִים, חֲצִי, שְׁלִישׁ, …). The full list goes into the T0 phrases after a nikud check against the Academy.

## Games (mechanics)

| Component | Where | Used by | New? |
|---|---|---|---|
| `PickGame` | shared | 29, 30 estimate, 31 last-digit, 32 split/bus, 34 result, 35 name, 36 compare, 38, 39, 40 sensible | reuse |
| `NumberPadGame` | numbers island | 30 compensate, 31 round, 32 divide, 35 part-of, 38 diagonals, 40 convert | reuse |
| `ColumnGame` | numbers island | 30 (six digits) | extend |
| `SortGame`, `FirstStepGame`, `GridAreaGame`, `PlaceGame` | numbers island | 33, 34, 41, 29 and 36 | reuse, with small extensions |
| `AreaModelGame` | new | 31 area-model | new |
| `ShadeGame` | new | 35 shade-fraction | new |
| `FractionPadGame` | new | 37 | new |
| Shown fractions (stacked numerator over denominator) | shared, `src/ui/pick` | every fraction in prompts and options | new (T0, planner) |
| Art kit grade 4: fraction shapes, line pairs, polygons with diagonals, quadrilaterals | `art-g4.tsx` | 35, 36 aid, 38, 39 | new |

Keyboard, touch targets of 64px or more, reduced motion, RTL with digits and exercises LTR, and dark mode all follow the rules in CLAUDE.md. A mistake gives a hint and the child tries again.

## Phrases and recordings

**About 55 recordings** (D23: instructions only):
- about 30 instructions and hints;
- about 20 fraction blocks;
- 5 quadrilateral names;
- the length units, as full words such as מֶטֶר.

Word problems (*bus-story*) and numbers above 10,000 are read by the browser voice.

## Acceptance criteria

- **`numberText`:** matches the block text from 0 to 10,000. Spot checks: 10,001, 11,000, 20,000, 99,999, 100,000, 342,000, 372,450, 1,000,000. Nikud is checked by the content test.
- **Fraction display:** the shared display renders stacked fractions in prompts and options, with an accessible label such as "3 חלקי 4".
- **Generator tests over at least 200 seeds:**
  - every answer is reachable through its UI;
  - no duplicate options;
  - values stay in range, and comma formatting applies only from five digits;
  - no division by 0;
  - bus answers round up;
  - fraction answers are accepted when equivalent;
  - inclusion-free quadrilateral questions have exactly one fitting answer;
  - unit conversions are between neighbouring units only.
- **E2E:**
  - an area-model round by keyboard;
  - a fraction-pad round;
  - a shade-fraction round;
  - a quadrilateral round;
  - a grade 4 item on the parents' page.
- **Screenshots:** every new component at desktop and 390px, in light and dark, with no sideways scroll.

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 | Shared stacked-fraction display (prompt `expr` and options); comma formatting helper; `numberText`; grade 4 question types and IDs; all phrases (Academy-checked); bus stories | planner | `src/ui/pick/**`, `src/subjects/math/{types,ids,numbers,phrases}.ts`, `content/**` | — |
| T1 | Generators for skills 29–41, and tests | builder | `generators-g4.ts`, `generators-g4.test.ts` | T0 |
| T2 | `AreaModelGame`, `ShadeGame` and `FractionPadGame`, and tests | builder | `games-area-model.tsx`, `games-shade.tsx`, `games-fraction.tsx`, `math-g4.css`, tests | T0 |
| T3 | Art kit grade 4. Extensions: `ColumnGame` to six digits, `GridAreaGame` nets with face colours, `PlaceGame` fraction labels. Tests for all of it | builder | `art-g4.tsx`, `games-column.tsx`, `games-grid.tsx`, `games-line.tsx`, `math-g4-art.css`, tests | T0 |
| T4 | Wire it into `index.ts` with `describeItem` rules. E2E, screenshots, content and nikud review, docs | planner | `index.ts`, `e2e/math-g4.spec.ts` | T1–T3 |

## Out of scope

- **The calendar (Gregorian and Hebrew; months, weeks, days) [p.20–21].** Proposed for the clock island, next to `clock.digital`, in BACKLOG.
- **Pie charts, double bar charts and misleading axes [p.21–23].** These go to a later data pass covering grades 3–6.
- **Long division as a full written algorithm.** Grade 4 practises it through splitting the dividend and estimation.
- **Drawing parallel lines with a ruler.**
