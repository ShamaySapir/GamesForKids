# Spec: Numbers island, 5th grade (Stage 5c)

- **Status:** Draft, awaiting user approval
- **Stage:** 5c (docs/ROADMAP.md). Built after Stage 5b (`docs/specs/math-grade4.md`), continuing its numbering
- **Relies on:** DECISIONS D7, D14, D19, D23, D24 · docs/RESEARCH.md § "Math, grades 3–6", grade 5 (cited `[G5 p.N]`)

## Goal

Grade 5 on the new curriculum. By the end, the child can:
- work with numbers above a million;
- tell primes from composites, and break a number into primes;
- work with fractions beyond 1 and with a fraction as a division;
- simplify, expand and compare fractions;
- add and subtract fractions with unlike denominators;
- **work with decimals**: place value, ×/÷ by 10, 100 and 1,000, converting to and from fractions, ordering, adding and subtracting, and rounding;
- find triangle and parallelogram heights and areas;
- match prisms and pyramids to their nets;
- read the mode from a frequency table.

## Curriculum basis (new grade 5, `[G5]`)

- **Numbers beyond a million** [p.1]:
  - place value and comparing;
  - ×/÷ by powers of 10;
  - the empty number line [p.2].
- **Primes** [p.5–7]:
  - prime and composite;
  - **1 is neither**;
  - 2 is the only even prime;
  - prime factorization is unique;
  - the link to rectangles of a given area.
  - Misconceptions to target:
    - "2 is even so it must be composite";
    - "1 is prime" [p.6].
- **Fractions** [p.8–14]:
  - the number line **beyond 1**;
  - a fraction as a division (3 : 4 = 3/4);
  - finding the whole;
  - **simplifying and expanding**;
  - comparing in several ways;
  - mixed numbers;
  - +/− where one denominator is a multiple of the other, then where they share a factor, then with **coprime denominators**;
  - estimating ("closest to").
  - Misconceptions to target:
    - "only one fraction lies between 1/4 and 2/4" [p.10];
    - "a fraction has a next one" [p.8].
- **Decimals** [p.15–21]:
  - place value to the thousandths;
  - ×/÷ by 10, 100 and 1,000, where "**the digits move, not the point**" [p.15];
  - decimal ↔ fraction with denominators 2, 4, 5, 10, 20, 25, 50 and 100;
  - order and compare, with 0.5 = 0.50 and 3.05 ≠ 3.5;
  - +/− to three decimal places;
  - rounding;
  - change from 20 ₪;
  - 1 m 37 cm = 1.37 m.
- **Geometry** [p.22–29]:
  - heights of triangles, with the obtuse triangle's height falling **outside** it [p.22];
  - triangle area;
  - parallelogram heights and area;
  - right prisms and pyramids, their properties and nets.
- **Data** [p.30–36]: frequency tables and **the mode**.

## Skills

The numbering continues after grade 4: 42–52.

| # | ID | Title | Requires | Sticker | Games |
|---|---|---|---|---|---|
| 42 | `math.huge` | מִסְפָּרִים גְּדוֹלִים מִמִּילְיוֹן | million | 🌌 | digit-value-big, compare-big, times-power |
| 43 | `math.primes` | רִאשׁוֹנִיִּים וּפְרִיקִים | divisible-369 | 🔑 | prime-or-not, rectangles-of-n, factor-tree |
| 44 | `math.fractions-beyond` | שְׁבָרִים גְּדוֹלִים מֵאֶחָד | fraction-add | 🍰 | line-beyond-1, mixed-improper, fraction-as-division |
| 45 | `math.equivalent` | שְׁבָרִים שְׁוֵי עֵרֶךְ | fractions-beyond | 🪞 | simplify, expand, compare-unlike, between |
| 46 | `math.fraction-add-2` | חִבּוּר שְׁבָרִים בְּמִכְנִים שׁוֹנִים | equivalent | 🧁 | add-unlike, add-mixed, closest-to |
| 47 | `math.decimals` | שְׁבָרִים עֶשְׂרוֹנִיִּים | fraction-compare, times-10 | 🔟 | decimal-house, slide-digits, decimal-fraction |
| 48 | `math.decimal-order` | מְסַדְּרִים עֶשְׂרוֹנִיִּים | decimals | 📶 | compare-decimals, decimal-line, round-decimal |
| 49 | `math.decimal-add` | חִבּוּר וְחִסּוּר עֶשְׂרוֹנִיִּים | decimal-order | 🪙 | column-decimal, change-20, meters-cm |
| 50 | `math.heights` | גֹּבַהּ וְשֶׁטַח | area, angles | 📐 | pick-height, triangle-area, parallelogram-area |
| 51 | `math.solids` | מִנְסָרוֹת וּפִירָמִידוֹת | box | 🔺 | solid-net, faces-edges |
| 52 | `math.mode` | הַשָּׁכִיחַ | — (grade 5 entry) | 📊 | mode-table |

Every skill is grade 5.

### Details

**42. Numbers above a million.**
- Up to 9 digits with commas.
- *digit-value-big* and *compare-big* work like grade 4.
- *times-power:* `3,400 × 1,000`, `52,000,000 : 1,000`, typed on the pad, with the place-value aid.

**43. Primes and composites.**
- *prime-or-not:* sort numbers 1–50 into "prime", "composite" and "neither" bins (`SortGame` with 3 bins, an extension).
  - Every round includes 1 and 2, which the curriculum flags.
- *rectangles-of-n:* "how many different rectangles have an area of 12 squares?", with the rectangles drawn on a grid. A prime has only one.
- *factor-tree:* `FactorTreeGame` (new). Split a number of at most 100 into two factors, again and again, until only primes are left. Any split is accepted; the leaves are checked.

**44. Fractions beyond 1.**
- *line-beyond-1:* place 7/4 on a 0–3 line.
- *mixed-improper:* 2¾ ↔ 11/4. Pick, or type in `FractionPadGame` with a whole-number box.
- *fraction-as-division:* "3 pizzas shared by 4 children: how much does each get?" Answer 3/4.

**45. Equivalent fractions.**
- *simplify* and *expand:* typed in `FractionPadGame`.
- *compare-unlike:* compare 3/4 with 5/6 through a common denominator.
- *between:* "pick a fraction between 1/4 and 2/4". Several answers are right: any value strictly between counts. This targets the "only one between" misconception.
- **Aid:** two strips cut into the common denominator.

**46. Adding fractions with unlike denominators.**
- *add-unlike* and *add-mixed:* typed in `FractionPadGame`. Any equivalent answer counts.
- *closest-to:* "is 7/8 + 5/9 closest to 1, 2 or 3?" Estimate, then pick.

**47. Decimals.**
- *decimal-house:* `PlaceValueGame` gets columns for tenths, hundredths and thousandths after the decimal point.
- *slide-digits:* ×/÷ by 10, 100 and 1,000. The digits slide across columns while the point stays put [p.15].
- *decimal-fraction:* match 0.25 to 1/4 and 0.6 to 3/5. Pick.

**48. Ordering decimals.**
- *compare-decimals:* `<` `>` `=`. The distractor pairs are 3.05 vs 3.5, 0.5 vs 0.50 (equal) and 2.10 vs 2.9.
- *decimal-line:* place a decimal on a 0–1 or 0–10 line.
- *round-decimal:* round to the nearest whole number, then to the tenths.

**49. Adding and subtracting decimals.**
- *column-decimal:* `ColumnGame` with the decimal points lined up. Up to 3 decimal places.
- *change-20:* "you pay 20 ₪ for something that costs 13.60 ₪. How much change?" Typed on the pad, which gets a decimal key.
- *meters-cm:* 1 m 37 cm = 1.37 m, in both directions.

**50. Heights and area.**
- *pick-height:* which dashed segment is the height to the marked side? Pick from three drawings. This includes obtuse triangles, where the height falls outside, and sides that aren't horizontal [p.22, p.26].
- *triangle-area* and *parallelogram-area:* `GridAreaGame` with slanted shapes. The answer is typed.
- **Aid:** half of the surrounding rectangle shaded.

**51. Prisms and pyramids.**
- *solid-net:* pick the net that folds into the drawn solid, from three.
- *faces-edges:* "how many faces, edges or vertices?", typed on the pad.

**52. The mode.**
- *mode-table:* a frequency table, such as children's favourite fruits. Pick the most common value.
- Sometimes there are two modes, and the option "both" is offered.

## New components and art

| Component | Used by |
|---|---|
| `FactorTreeGame` | 43 |
| `SortGame` with three bins | 43 |
| `PlaceValueGame` with decimal columns | 47 |
| `ColumnGame` with decimals | 49 |
| `NumberPadGame` with a decimal key | 49 |
| `FractionPadGame` with a whole-number box | 44, 46 |
| `GridAreaGame` with slanted shapes | 50 |
| Art: grid rectangles, heights, solids and nets, frequency tables | 43, 50, 51, 52 |

Decimals are shown with a point (3.05), as in Israeli schools.

## Phrases

About 40 recordings: instructions, the words רִאשׁוֹנִי, פָּרִיק and שָׁכִיחַ, the solid names, and the decimal place names. They will be checked against the Academy.

## Acceptance criteria and tasks

The same structure as grade 4:
- generator tests over 200 seeds;
- **math checks:** 1 is never "prime", every equivalent fraction counts, decimal comparisons are exact, and each `between` answer is strictly between;
- **E2E:** one round each of factor-tree, column-decimal and pick-height;
- screenshots.

Tasks:
- **T0 planner:** types, IDs, phrases, decimal display.
- **T1:** generators.
- **T2:** `FactorTreeGame` and the decimal extensions.
- **T3:** the art and the three-bin sort.
- **T4:** wiring, E2E and review.

## Out of scope

- Proofs such as "why 207 isn't prime".
- Constructing heights with tools.
- Infographics.
- History topics such as Goldbach and the sieve.
