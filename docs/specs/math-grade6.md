# Spec: Numbers island, 6th grade (Stage 5d)

- **Status:** Built 2026-11-11, awaiting user play-test. Approved by user on 2026-11-11 (with grades 4–6, D24)
- **Stage:** 5d (docs/ROADMAP.md). Built after Stage 5c (`docs/specs/math-grade5.md`), continuing its numbering
- **Relies on:** DECISIONS D7, D14, D19, D23, D24 · docs/RESEARCH.md § "Math, grades 3–6", grade 6 (cited `[G6 p.N]`)

## Goal

Grade 6 on the new curriculum: the last stage of elementary school. By the end, the child can:
- use number machines;
- read Roman and Hebrew-letter numerals;
- multiply and divide fractions;
- multiply and divide decimals, knowing where the point goes;
- **use percent**: benchmarks, finding the whole, discounts and price rises;
- find the area and perimeter of composite shapes;
- work with the circle and π ≈ 3.14;
- find the volume of a box;
- find the arithmetic mean.

## Curriculum basis (new grade 6, `[G6]`)

- **Number machines** (input → rule → output) [p.1–2].
- **Numeral systems:** the decimal system compared with Hebrew-letter numerals and Roman numerals [p.1–5].
- **Fractions** [p.5–8]:
  - × as a fraction of a quantity, and fraction × fraction through an **area model**;
  - ÷ by a unit fraction (= × the denominator), then by the reciprocal;
  - "×/÷ by a fraction makes it bigger or smaller?"
  - Misconception to target: "**multiplying always makes bigger, dividing always makes smaller**" [p.6].
- **Decimals × and ÷** [p.8–11]:
  - `2.4 : 0.4 = 24 : 4`;
  - mental calculation: 0.2 × 30, 0.04 × 12;
  - estimation;
  - weight units.
- **Percent** [p.11–12]:
  - start with 1%, 10%, 20%, 25% and 50%, then 40%;
  - **know mentally 50, 25, 75, 10, 40, 20, 60 and 80% of various wholes**;
  - find the whole;
  - discounts and price rises;
  - **no fractional percents and no chained discounts**.
- **Geometry** [p.13–21]:
  - area and perimeter of composite polygons, and how scaling changes them;
  - the circle: centre, radius, diameter, chord, arc and sector; circumference and area with π ≈ 3.14;
  - **box volume**, cm³, m³, L and mL.
  - Misconceptions to target:
    - doubling the sides doubles the area [p.15];
    - a pool measured in mL [p.20].
- **Arithmetic mean** [p.22–24]:
  - as equal sharing or levelling;
  - its properties.
  - Misconceptions to target:
    - the mean must be one of the values;
    - the mean must be whole;
    - adding a 0 doesn't change it [p.23].
- **Not in the curriculum any more:** ratio, scale, negative numbers and powers. The old grade 6 programme had them; the new one doesn't.

## Skills

The numbering continues after grade 5: 53–63.

| # | ID | Title | Requires | Sticker | Games |
|---|---|---|---|---|---|
| 53 | `math.machines` | מְכוֹנַת מִסְפָּרִים | order-ops-2 | ⚙️ | machine-output, machine-rule |
| 54 | `math.numerals` | סְפָרוֹת רוֹמִיּוֹת וְאוֹתִיּוֹת | huge | 🏛️ | roman, gematria |
| 55 | `math.fraction-times` | כֶּפֶל שְׁבָרִים | fraction-add-2 | ✖️ | fraction-of, fraction-grid, bigger-smaller |
| 56 | `math.fraction-divide` | חִלּוּק שְׁבָרִים | fraction-times | ➗ | how-many-fit, divide-unit, divide-fraction |
| 57 | `math.decimal-times` | כֶּפֶל וְחִלּוּק עֶשְׂרוֹנִיִּים | decimal-add | 🎯 | where-point, decimal-mental, estimate-product |
| 58 | `math.percent` | אֲחוּזִים | decimal-order, fraction-times | 💯 | percent-of, percent-fraction, percent-arena |
| 59 | `math.percent-whole` | הֲנָחוֹת וְהַשָּׁלֵם | percent | 🏷️ | find-whole, discount, price-rise |
| 60 | `math.composite-area` | שֶׁטַח וְהֶקֵּף שֶׁל צוּרוֹת | heights | 🧩 | composite-area, composite-perimeter, scale-effect |
| 61 | `math.circle` | הַמַּעְגָּל | composite-area | ⭕ | circle-parts, circumference, circle-area |
| 62 | `math.volume` | נֶפַח | solids | 🧊 | count-cubes, box-volume, volume-unit |
| 63 | `math.mean` | הַמְּמֻצָּע | mode | ⚖️ | level-bars, find-mean, mean-truths |

Every skill is grade 6.

### Details

**53. Number machines.**
- *machine-output:* rule `× 3 + 1`, input 7, typed on the pad.
- *machine-rule:* three input → output pairs. Pick the rule.

**54. Roman and Hebrew-letter numerals.**
- *roman:* match XIV, XL and MCM to numbers up to 2,000.
- *gematria:* match תשפ״ו, קכ״ג and ט״ו to numbers, with the ט״ו / ט״ז rule.
- Pick in both directions.

**55. Multiplying fractions.**
- *fraction-of:* 3/4 of 20.
- *fraction-grid:* 2/3 × 3/5 on an area grid, where the child shades the overlap (`ShadeGame` in 2D, an extension).
- *bigger-smaller:* "is 3/4 × 18 bigger or smaller than 18?" This targets the misconception.

**56. Dividing fractions.**
- *how-many-fit:* "how many 1/4 fit in 3?", with strips.
- *divide-unit:* `5 : 1/3`.
- *divide-fraction:* `3/4 : 3/8`, typed in `FractionPadGame`.

**57. Multiplying and dividing decimals.**
- *where-point:* `2.4 × 1.5 = 360`. Where does the point go? Pick 0.36, 3.6 or 36.
- *decimal-mental:* 0.2 × 30, `2.4 : 0.4`, typed on the decimal pad.
- *estimate-product:* "is 0.8 × 45 more or less than 45?"

**58. Percent.**
- *percent-of:* the benchmark percents of round wholes (25% of 80), typed on the pad. Reviewed with Leitner (D7).
- *percent-fraction:* match 25% to 1/4 and 0.25.
- *percent-arena:* an optional timed arena like the multiplication arena (D23), for the percent benchmarks.

**59. Discounts and the whole.**
- *find-whole:* "20% is 12. What is the whole?"
- *discount* and *price-rise:* "a 25% discount on 80 ₪". Typed on the pad.
- Short stories read by the browser voice.
- No fractional percents and no chained discounts.

**60. Composite shapes.**
- *composite-area* and *composite-perimeter:* `GridAreaGame` with L, T and U shapes made of rectangles and triangles.
- *scale-effect:* "the sides doubled. What happened to the area?" Pick: ×2, ×4 or no change.

**61. The circle.**
- *circle-parts:* tap the radius, diameter, chord or arc (`TapArtGame`, new: tap a part of a drawing).
- *circumference* and *circle-area:* with π ≈ 3.14, pick the closest from four.

**62. Volume.**
- *count-cubes:* a box built from unit cubes in an isometric drawing. Type the count.
- *box-volume:* length × width × height.
- *volume-unit:* "a pool: 50 m³ or 50 mL?" Pick.

**63. The mean.**
- *level-bars:* `MeanGame` (new). The child drags blocks between bars until they're all the same height. That height is the mean.
- *find-mean:* type the mean of 4–6 numbers. The values are chosen so it comes out whole or to one decimal place.
- *mean-truths:* "the mean of 3, 5 and 10 is 6. Is 6 one of the values?" A yes/no pick that targets the misconceptions.

## New components and art

| Component | Used by |
|---|---|
| `MeanGame` | 63 |
| `TapArtGame` | 61 |
| `ShadeGame` in 2D | 55 |
| Art: machines, the circle, isometric cubes, composite shapes, Roman numerals | 53–62 |

## Phrases

About 45 recordings: instructions, percent words, circle-part names, and volume units. They will be checked against the Academy.

## Acceptance criteria and tasks

The same structure as grade 4:
- generator tests over 200 seeds;
- **math checks:** percent questions use only the curriculum benchmarks, with no fractional percents; gematria follows the ט״ו and ט״ז rule; mean values come out whole or to one decimal place; "closest" answers really are closest;
- **E2E:** level-bars by drag and keyboard, a circle-parts round, a percent round;
- screenshots.

Tasks:
- **T0 planner:** types, IDs, phrases, percent display.
- **T1:** generators.
- **T2:** `MeanGame` and `TapArtGame`.
- **T3:** the art and the 2D `ShadeGame`.
- **T4:** wiring, E2E and review.

## Out of scope

- Ratio and scale, which are not in the new curriculum.
- Repeating decimals, which the curriculum makes optional.
- Compass constructions.
- Statistical projects.
