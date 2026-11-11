# Request from T1 (grade 5 generators): notes for the planner and the game builders

Nothing is blocked. These are contract details the games (T2/T3) and the planner should know.

1. **Decimal line with step 0.1 (skill 48).** `decimalLineQuestion` returns `line: { min: 0, max: 1, step: 0.1, labelEvery: 1, snap: 0.1 }` (and `{ min: 0, max: 10, step: 1, labelEvery: 1, snap: 0.1 }`), with `tolerance: 0.01`. `snap()` in `games-line.tsx` computes `min + round(...) * 0.1`, which gives floats such as 0.30000000000000004. `PlaceGame` should round the value to 3 places before showing it or comparing it. The tolerance already absorbs the error in the comparison.
2. **`mixedImproper` answers.** The `FractionPadQ` for "write as a mixed number" has `mixed: true` and `simplest` unset, so the pad accepts any equal value (for example `0 11/4`). The answer itself always has `num < den` and `gcd(num, den) = 1`. If the planner wants only the real mixed form, `FractionPadGame` must require `num < den` when `mixed` is true.
3. **`expand` accepts any equal value.** The prompt shows the target denominator (`3/4 = ?/20`) but the pad compares only the value. Accepted, as the spec notes.
4. **Share stories use n of 2–5, not 1–5.** The stories say "{n} פִּיצוֹת" (plural), so n = 1 would read wrongly.
5. **`maxDigits` is 9 for `timesPower` and 7 for `slideDigits`.** The 9 is the longest answer (just under a billion). The 7 counts digits only, not the point, and the pad must show and accept leading "0" and ".".
6. **`SOLID_COUNTS`** (faces, edges, vertices per `SolidKind`) is exported from `generators-g5.ts`. The art for `math.net` should treat `wrong` 1 and 2 as two different near-misses for every kind.
