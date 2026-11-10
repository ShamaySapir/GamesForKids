# Spec: Numbers island, 3rd grade (Stage 5a)

- **Status:** Built 2026-11-10, awaiting user play-test. Approved by user on 2026-11-10 (numbers to 10,000 recorded as blocks; digital clock moved to the clock island)
- **Stage:** 5a (docs/ROADMAP.md). Continues `docs/specs/math-grade2.md` (skills 11–17, built)
- **Relies on:** DECISIONS D3, D6, D7, D14, D18, **D23** · docs/RESEARCH.md § "Math, grades 3–6: NEW curriculum" (grade 3, cited `[G3 p.N]`)

## Goal

This spec covers grade 3 on the new curriculum (in schools from 2026‑27). By the end, the child can:
- read, build, compare and round numbers to 10,000, and count in big jumps;
- add and subtract to 10,000, in a row and in columns;
- know the whole 10×10 multiplication table, with an optional timed arena for beating their own record;
- divide with a remainder;
- multiply and divide by 10, 100 and 1,000;
- use the order of operations;
- name angle and triangle types and find a rectangle's area.

All of it lives on the same island, after the grade 2 skills.

## Curriculum basis (new grade 3, `[G3]` in RESEARCH.md)

- **Numbers to 10,000** [p.1–3]:
  - place value to the thousands, including flexible splits (2,356 = 23 hundreds + 56 ones);
  - comparing with `<` `>` `=`;
  - counting by 20, 25, 50, 200, 500 and 1,000, forward and back;
  - placing numbers on number lines;
  - sequences, including finding the mistake in one [p.4].
- **Adding and subtracting to 10,000** [p.5–6]:
  - in a row and in columns;
  - estimating with `≈`;
  - equations with the `=` sign on the **left** (`___ = 4,000 + 300`), because children misread `=` as "the answer comes next" [p.6–7].
- **The 10×10 table:** "completing and consolidating" the table [p.7]. Grade 2 built the 2, 4, 5 and 10 tables, so grade 3 adds 3, 6, 7, 8 and 9, then mixes the whole table. Mental calculation is stressed [p.9, p.13]. The arena is our choice (D23).
- **Division with a remainder**, inside the table with a single-digit divisor [p.9–10]:
  - written `13 : 4 = 3 + (1 : 4)` or "3, and 1 is left over";
  - **never** written `3(1)` [p.9];
  - one of the document's own questions doubles as a distractor: can the remainder be 3 when dividing by 2? [p.10]
- **Divisibility by 2, 5 and 10**, found by looking at the numbers rather than taught as a rule [p.9].
- **Order of operations and parentheses** [p.10–11].
- **×/÷ by 10, 100 and 1,000**, and multiplying whole tens by whole hundreds (20 × 300) [p.11–12]. The document warns against the "just add a 0" rule [p.11], so the aid shows digits moving between place-value columns instead.
- **Rounding** to tens, hundreds and thousands, on a number line; 5 or more rounds up [p.13].
- **Angles** [p.13–15]:
  - straight, obtuse, right and acute, judged by comparing with a right angle (no protractor);
  - triangles named by their angles and by their sides;
  - children often judge an angle by the **length of its arms**, so arm lengths and orientations vary [p.14].
- **Area** [p.15–18]: counting squares, then rectangle area with whole-number sides, in cm².
- **Number format:** grade 3 writes numbers without a separator (3456, 10000). Commas in groups of three start in grade 4 [G4 p.1].
- **Left for later or another island** (see Out of scope):
  - digital 12- and 24-hour clocks and durations [p.18–19], which belong on the clock island;
  - double bar charts and pictograms [p.19];
  - box nets [p.18];
  - open "find all solutions" problems.

## Skills (continuing the island's numbering)

| # | ID | Title | Grade | Requires | Sticker | Games |
|---|---|---|---|---|---|---|
| 18 | `math.place-10000` | מִסְפָּרִים עַד 10000 | 3 | place-value | 🏰 | build-4, flexible-4, compare-4, line-10000 |
| 19 | `math.skip-10000` | קְפִיצוֹת גְּדוֹלוֹת | 3 | count-1000, place-10000 | 🦘 | skip-big, find-mistake |
| 20 | `math.round` | מְעַגְּלִים | 3 | place-10000 | 🎯 | closer-to, round-pick |
| 21 | `math.add-10000` | חִבּוּר וְחִסּוּר עַד 10000 | 3 | within-100, place-10000 | 🧱 | column, missing-left, estimate-big |
| 22 | `math.table` | לוּחַ הַכֶּפֶל | 3 | times | 🏅 | table-new, missing-factor, array-big, **arena** |
| 23 | `math.remainder` | חִלּוּק עִם שְׁאֵרִית | 3 | divide, table | 🧁 | share-left, remainder-pick, remainder-story |
| 24 | `math.divisible` | מִתְחַלֵּק בְּ‑2, 5, 10 | 3 | table | 🔍 | which-divides, sort-divides |
| 25 | `math.times-10` | כּוֹפְלִים בְּ‑10, 100, 1000 | 3 | table, place-10000 | 🚀 | times-ten, round-times |
| 26 | `math.order-ops` | סֵדֶר פְּעֻלּוֹת | 3 | table | 🧩 | first-step, result |
| 27 | `math.angles` | זָוִיּוֹת וּמְשֻׁלָּשִׁים | 3 | — (grade 3 entry) | 📐 | angle-type, triangle-angles, triangle-sides |
| 28 | `math.area` | שֶׁטַח | 3 | table | 🟩 | count-squares, length-width |

The soft locks of D19 still apply: a grade 3 child starts at skill 18 or 27, and nothing is hard-locked.

### Details (content range, aid, distractors)

**18. Numbers to 10,000.**
- *build-4:* the grade 2 place-value house gets a thousands column. Build 3,407 (0–9 per column).
- *flexible-4:* "2,356 is 23 hundreds and ? ones", and the reverse.
- *compare-4:* pick `<` `>` or `=` for a pair like `3,042 ? 3,402`. Pairs differ in one place, or swap two digits.
- *line-10000:* drag a marker on a 0–10,000 line with ticks every 1,000. The answer counts within ±250. A harder version uses a line from one thousand to the next with ticks every 100.
- **Aid:** the house with each column's value written under it (3 × 1000, 4 × 100…).

**19. Big jumps.**
- *skip-big:* a sequence with steps of 20, 25, 50, 200, 500 or 1,000, forward or back, and two gaps to fill on the number pad. It may start from a number that isn't a multiple of the step (130, 150, 170…). Values stay within 0–10,000 and never go negative.
- *find-mistake:* one number in the sequence is wrong. Tap it [p.4].
- **Aid:** jump arcs drawn over the sequence, each labelled `+25`.

**20. Rounding.**
- *closer-to:* "347 — closer to 300 or to 400?", with the number marked on a line between the two.
- *round-pick:* "round 3,650 to the nearest thousand", pick from 3,000, 4,000, 3,600 or 3,700.
  - Distractors: the same number rounded to the wrong place, or rounded down when it should go up.
  - A 5 always rounds up.
- **Aid:** the line with a midpoint mark.

**21. Adding and subtracting to 10,000.**
- *column:* a vertical exercise. The child types digits **from the ones column leftward**, each column in turn. Carries and borrows show as small digits above the column.
  - The board stays LTR inside the RTL page, like every digit layout (D17).
  - Results stay within 0–10,000, with up to two carries or borrows.
- *missing-left:* `___ = 2,300 + 400` or `5,000 = 4,600 + ___`. The empty box is often on the **left** of `=` [p.6–7].
- *estimate-big:* "is 2,890 + 3,150 more or less than 6,000?" [p.5].
- **Aid:** the column board highlights the next column and shows its digit sum.
- Never 0 as the number being subtracted from [p.6].

**22. The multiplication table.**
- *table-new:* facts from the 3, 6, 7, 8 and 9 tables on the number pad, reviewed with Leitner (D7).
  - Once the child knows the new tables, it mixes the whole 10×10 table.
  - Facts with 0 and 1 are included (properties of 0 and 1 [p.7]).
- *missing-factor:* `? × 7 = 56` and `56 : 7 = ?`. × and : are inverses [p.7].
- *array-big:* the grade 2 array with up to 10 × 10 dots, split by a line into two easy parts, like 7 × 8 = 7 × 5 + 7 × 3. Pick the exercise.
- **arena:** optional and timed (D23); see *The arena* below. It is not needed for mastery.
- **Aid** (normal games only): an array of the fact, with the split line.

**23. Division with a remainder.**
- *share-left:* the grade 2 share game, where some cookies **don't fit**. They go to a "left over" bowl, and the instruction asks how many each plate gets and how many are left.
- *remainder-pick:* `17 : 5 = ?`. Pick "3, שְׁאֵרִית 2" from four options.
  - Distractors: a remainder bigger than or equal to the divisor ("2, and 7 is left over"), a quotient off by one, and the remainder and quotient swapped.
  - Only from the 10×10 table, with a divisor of 2–9, never dividing by 0 [p.8].
- *remainder-story:* a short word problem, read by the browser voice (D23): "23 children in boats of 4. How many full boats? How many children are left?" The answer is picked like *remainder-pick*.
- The written form is "3, שְׁאֵרִית 2" (no verb agreement to get wrong). The `3(2)` form is never used [p.9].

**24. Divisible by 2, 5 and 10.**
- *which-divides:* "which number divides by 5 with nothing left?" Pick one of four numbers up to 1,000.
  - Distractors end in a digit close to the right one, like 52 or 56 next to 55.
- *sort-divides:* drag eight numbers into two bins ("divides by 10" / "doesn't").
- No rule is stated up front. After the child answers, the aid circles the last digit, so the child notices the pattern [p.9].

**25. ×/÷ by 10, 100 and 1,000.**
- *times-ten:* `34 × 100 = ?` and `4,500 : 10 = ?` on the number pad. Results stay at 10,000 or below.
- *round-times:* `20 × 300`, `600 : 3` and `80 : 4`, whole tens and hundreds [p.11–12].
- **Aid:** a place-value house where the digits **slide** one or two columns. No "add a 0" text anywhere [p.11].

**26. Order of operations.**
- *first-step:* `3 + 4 × 2`, tap the part to do first. Parentheses change the answer: `(3 + 4) × 2`.
- *result:* the same exercises, pick the result.
  - Distractors: the left-to-right result (14 for `3 + 4 × 2`), and the result with the parentheses ignored.
  - Numbers stay small (single-digit factors, results ≤ 100), so the skill is the order, not the arithmetic.

**27. Angles and triangles.** Every drawing is generated as SVG, with random rotation and arm lengths [p.13–14].
- *angle-type:* pick חַדָּה, יְשָׁרָה, קֵהָה or שְׁטוּחָה.
  - Angles are 20–70°, exactly 90°, 110–160° or exactly 180°, so they are never close to the line between two types.
  - Distractor drawings put long arms on an acute angle and short arms on an obtuse one.
- *triangle-angles:* "which triangle is right-angled, obtuse or acute?" Pick from three drawings.
- *triangle-sides:* "which triangle is equilateral, isosceles or scalene?" Tick marks show which sides are equal.
- **Aid:** a dashed right-angle corner placed on the angle to compare with.

**28. Area.**
- *count-squares:* a shape on a cm grid, either a rectangle or an L made of two rectangles. Type how many squares it covers.
- *length-width:* a rectangle of up to 10 × 10 squares. When the aid is off, the inner grid fades and only the side lengths stay, so the child moves from counting to length × width [p.16–17].
  - The answer is typed as a number of square centimetres (סמ״ר).
- **Aid:** the grid lines, plus row counts down the side.

## The arena (D23)

The arena is an extra game in `math.table`. It is optional and never needed for stars, stickers or mastery.

- **Round:** a 60-second sprint of facts on the number pad. Missed facts come first, then the newest facts the child has learned.
- **Timer:** a calm bar that empties. It has no ticking sound, no red and no countdown voice, and it respects reduced motion.
- **A miss:** shows the right answer for a moment, then moves on. The fact goes into Leitner review (D7). Nothing is taken away.
- **End of round:** "you answered 23 correctly!" is said by the browser voice. Then one of:
  - a new record gets a celebration and is saved;
  - otherwise the child sees their record, with "let's try to beat it next time".
  - Never "less than last time".
- **The record** is kept per profile and per game, in the progress store.
- The parents' page shows it under the skill.

## Spoken numbers and word problems (D23)

- **Numbers to 10,000 are recorded blocks** (user's choice on approval, 2026-11-10). `numberPhrase` grows to 10,000 with 18
  new blocks: `math.k.2–9` (אַלְפַּיִם … תִּשְׁעַת אֲלָפִים, 1,000 stays `math.n.1000`), `math.andh.1–9` ("and" + whole hundreds:
  וּמֵאָה, וּשְׁלוֹשׁ מֵאוֹת…) and `math.n.10000` (עֲשֶׂרֶת אֲלָפִים). "And" comes only before the last part:
  3,347 → שְׁלוֹשֶׁת אֲלָפִים שְׁלוֹשׁ מֵאוֹת אַרְבָּעִים וְשֶׁבַע · 3,300 → שְׁלוֹשֶׁת אֲלָפִים וּשְׁלוֹשׁ מֵאוֹת · 3,007 → שְׁלוֹשֶׁת אֲלָפִים וְשֶׁבַע.
- Until the blocks are recorded, `say` already reads consecutive unrecorded parts as **one** browser-voice sentence, so a
  number never sounds half recorded and half synthetic.
- **Word problems** (*remainder-story*, `content/remainder.ts`) and the arena's score sentence are text with digits, read by
  the browser voice through the existing `raw(text)` phrase part, with a 🔊 to replay. Nothing to record, not in the studio.
- **No core audio change was needed** (`raw` already exists). The pick UI gains `aidArt`: drawings shown only while the aid
  is on (the right-angle corner, the rounding line).

## Games (mechanics)

| Component | Where | Used by | New? |
|---|---|---|---|
| `PickGame` | shared | 18 compare, 20, 21 estimate, 22 array, 23 pick/story, 24 which, 26 result, 27 | reuse |
| `NumberPadGame` | numbers island | 18 flexible, 19 skip, 21 missing, 22 table/missing/**arena**, 25, 28 | reuse |
| `PlaceValueGame` | numbers island | 18 build-4 (adds a thousands column) | extend |
| `PlaceGame` (number line) | numbers island | 18 line-10000, 20 aid | reuse |
| `ShareGame` | numbers island | 23 share-left (adds a left-over bowl) | extend |
| `SortGame` | new | 24 sort-divides (drag or tap numbers into two bins) | new |
| `ColumnGame` | new | 21 column | new |
| `SequenceGame` | new | 19 skip-big (two gaps), find-mistake (tap a number) | new |
| `TapPartGame` | new | 26 first-step (tap a part of an exercise) | new |
| `GridAreaGame` | new | 28 count-squares, length-width (drawing + pad) | new |
| Angle/triangle art | new, `art-g3.tsx` | 27 (PickGame picture options) | new |

**What the child does:**
- **Keyboard:** everything works by keyboard.
  - On the number pad: digits, Backspace and Enter.
  - In `ColumnGame`: the digits go into the highlighted column, and the focus moves left by itself.
  - Taps and picks: Tab and Enter.
- **Touch targets:** 64px or more.
- **A mistake:** a hint, and the child tries again (CLAUDE.md). The arena is the only exception: there a miss moves on, as described above.

**Rounds:**
- 6 questions per round, as the default.
- `ColumnGame` and `GridAreaGame` rounds have 4 questions.
- An arena round is 60 seconds.

**`itemKey` formats** (with `describeItem` labels for the parents' page):

| Format | Example |
|---|---|
| `pv4:3407` | |
| `flex4:2356:h` | |
| `sign4:3042:3402` | |
| `line10k:6200` | |
| `skipbig:25:130` | |
| `mistake:200:400` | |
| `near:347:100` | |
| `round:3650:1000` | |
| `col:2890+3150` | |
| `mleft:5000=4600+?` | |
| `tbl:7x8` | shared with grade 2's `tbl:`, so the Leitner history carries over |
| `mfac:?x7=56` | |
| `rem:17:5` | |
| `remstory:boats:23:4` | |
| `div5:55` | |
| `x10:34x100` | |
| `ops:3+4x2` | |
| `angle:obtuse` | |
| `tri:right` | |
| `side:isosceles` | |
| `area:4x6` | |
| `areaL:…` | |

## Phrases and recordings

- **Recorded by the user** (D23, instructions only, plus the 18 number blocks above), about 60 in all:
  - around 28 short instructions, such as "בְּנוּ אֶת הַמִּסְפָּר", "אֵיזֶה מִסְפָּר לֹא בַּמָּקוֹם?", "מָה עוֹשִׂים קֹדֶם?" and "כַּמָּה מִשְׁבָּצוֹת?";
  - 4 angle names;
  - 6 triangle names;
  - the arena lines: "מוּכָנִים?", "שִׂיא חָדָשׁ!" and "בּוֹאוּ נְנַסֶּה לְשַׁבֵּר אוֹתוֹ".
- **Read by the browser voice:**
  - numbers above 1,000;
  - word problems;
  - the arena score sentence.
- Every phrase has full nikud (D23), and the studio lists only the recorded ones.

## Acceptance criteria

- **`numberText`:**
  - it matches the recorded block text for every n from 0 to 1,000;
  - spot checks: 1000, 1001, 1010, 1100, 2000, 3407, 7050, 9999, 10000;
  - the content test confirms its nikud.
- **Generator tests over at least 200 seeds:**
  - every answer can be reached through its UI: house columns ≤ 9, column results ≤ 10,000 and never negative, line targets inside the line;
  - no duplicate options;
  - the new tables are 3, 6, 7, 8 and 9 before the full mix;
  - every remainder is less than the divisor, and no divisor is 0;
  - no remainder distractor duplicates the answer;
  - every angle falls inside its type's band;
  - order-of-operations distractors differ from the answer;
  - every phrase used exists.
- **Arena:**
  - a session test shows the round ends on time, not on a count;
  - a missed fact reaches Leitner;
  - the record only goes up;
  - an arena round never changes stars or mastery.
- **Audio:** a spoken-text part goes through `say`, reaches the browser voice, and never appears in the studio list.
- **E2E:**
  - a column-addition round by keyboard;
  - a remainder round;
  - an angle round;
  - one arena round, with the clock mocked;
  - `describeItem` shows a grade 3 item on the parents' page.
- **Screenshots:** every new component at desktop and 390px, in light and dark. The test: can a child who doesn't have the skill still get it right by guessing?

## Tasks

| # | Task | Owner | Files | Depends on |
|---|---|---|---|---|
| T0 ✅ | Core: sprint rounds (`GameDef.sprint`, `SprintRound` screen with a calm timer bar and record screen, `applySprint` + `records` in progress, store and backup, parents' page line); `aidArt` in the pick UI. Math: question types and IDs (`M3`), `numberPhrase` to 10,000, all instruction phrases, `content/remainder.ts` | planner | `src/core/**`, `src/app/**`, `src/ui/pick/**`, `src/subjects/math/{types,ids,numbers,phrases}.ts`, `content/{numbers,remainder}.ts` | — |
| T1 | Generators for skills 18–28, and their tests | builder | `generators-g3.ts`, `generators-g3.test.ts` | T0 |
| T2 | `ColumnGame`, `SequenceFillGame` + `SequenceMistakeGame`, `FirstStepGame`, `SortGame`, and their tests | builder | `games-column.tsx`, `games-sequence.tsx`, `games-tap.tsx`, `games-sort.tsx`, `math-g3.css`, tests | T0 |
| T3 | `GridAreaGame`, the angle and triangle art, the thousands column in `PlaceValueGame`, the left-over bowl in `ShareGame`, and their tests | builder | `games-grid.tsx`, `art-g3.tsx`, `games-place.tsx`, `games-share.tsx`, `math-g3-art.css`, tests | T0 |
| T4 | Wire it into `index.ts` with `describeItem` rules. E2E, screenshots, a full content and nikud review (Opus), docs | planner + reviewer | `index.ts`, `e2e/math.spec.ts` | T1–T3 |

## Out of scope

- **Digital 12- and 24-hour clocks and durations (G3 p.18–19).** These are suggested as a small follow-up skill on the **clock island** (`clock.digital`, grade 3), so clock content stays in one place.
- **Double bar charts and pictograms (G3 p.19), and box nets (G3 p.18).** These go to a later "data and shapes" pass, together with grade 4's charts.
- **Fractions.** Grade 3 has none in the new curriculum; they start in grade 4 (Stage 5b).

## Answers on approval (2026-11-10)

1. Numbers above 1,000: recorded blocks, in the user's voice (see Spoken numbers).
2. Digital 12/24-hour clocks and durations: a separate small skill on the clock island (`clock.digital`), tracked in BACKLOG.
