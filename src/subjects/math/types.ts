import type { PhraseRef, Question } from '../../core/engine/types'
import type { ArtRef, ObjectGroup, PickPrompt, PickQ } from '../../ui/pick/types'

// Shared by content (T1), generators (T2) and games (T3a, T3b) — fixed before parallel work starts.
// Spec: docs/specs/math-k2.md. Pick questions use the shared PickQ (DECISIONS D14).

/** Base for the math-specific questions: an instruction shown as text and spoken via `say`. */
interface MathQ<A> extends Question<A> {
  /** Child-facing instruction phrase ID, shown as text. */
  instruction: string
  /** Spoken again when the adaptive aid turns on. */
  hint?: PhraseRef
}

/** Type the answer on a number pad (0–9, ⌫, ✓). */
export interface PadQ extends MathQ<number> {
  /** What to show above the pad: objects, an exercise ('7 + ? = 10'), a picture… */
  prompt: PickPrompt
  /** Longest answer the pad accepts (1–3 digits). */
  maxDigits: number
  /** Aid: draw a number line from 0 to this value with the exercise's jumps (within-20 skills). */
  aidLine?: { max: number; from: number; jumps: readonly number[] }
  /** Aid: drawings shown while the aid is on (grade 4: the polygon with its diagonals). */
  aidArt?: readonly ArtRef[]
  /** Grade 5: the pad has a decimal-point key and `answer` may be a decimal (compared to 3 places: 0.50 = 0.5). */
  decimal?: boolean
}

/**
 * A number line drawn left-to-right from `min` to `max`, ticks every `step`, labels every `labelEvery`.
 * The marker moves in units of `snap` (default `step`), so 0–100 can have ticks every 10 but reach 45.
 */
export interface Line {
  min: number; max: number; step: number; labelEvery: number; snap?: number
  /** Grade 4 fractions: every value is in units of 1/den (0–4 with den 4 is 0 to 1), labelled as fractions (1/4, 2/4…). */
  den?: number
}

/** Drag the marker to where `target` belongs. Correct within `tolerance`. */
export interface PlaceQ extends MathQ<number> {
  line: Line
  target: number
  tolerance: number
}

/** A point is marked on the line; pick its number (a PickQ shown under the line). */
export interface WhichNumberQ extends PickQ {
  line: Line
  marked: number
}

/** One label on the line is wrong; tap it. Answer = index of the wrong label in `labels`. */
export interface MisplacedQ extends MathQ<number> {
  line: Line
  labels: readonly { at: number; text: string }[]
}

/** Tap a basket to add objects (tap an object to remove), then Check. Answer = target count. */
export interface BuildQ extends MathQ<number> {
  emoji: string
  /** Most objects the basket can hold. */
  max: number
  /** Shown big as the number to build. */
  show: string
}

/** Pay exactly `price` by dragging coins into the wallet; any combination works. */
export interface CoinsQ extends MathQ<number> {
  item: { emoji: string; name: PhraseRef }
  price: number
  /** Coin values the child may use, in shekels. */
  coins: readonly (1 | 2 | 5 | 10)[]
}

/** Find all pairs of cards that add up to `total`. Answer unused; done when every pair is found. */
export interface PairsQ extends MathQ<null> {
  total: number
  /** Card values; every value pairs with exactly one other card. */
  cards: readonly number[]
}

/**
 * A countable thing. The number blocks are in the feminine counting form, so its phrase thingPhrase(id)
 * must be a FEMININE plural noun ("צִפֳּרִים", "בָּנָנוֹת") — "שָׁלוֹשׁ כְּלָבִים" would be wrong Hebrew.
 */
export interface Thing { id: string; emoji: string }

/**
 * A join or separate story within 10. It is spoken as
 * [storyPart(id,'start'), ...numberPhrase(a), thingPhrase(thing), storyPart(id,'middle'), ...numberPhrase(b), storyPart(id,'end')]
 * e.g. "עַל הָעֵץ יָשְׁבוּ" · "שָׁלוֹשׁ" · "צִפֳּרִים" · "בָּאוּ עוֹד" · "שְׁתַּיִם" · "כַּמָּה צִפֳּרִים יֵשׁ עַכְשָׁו?".
 * a and b are ≥ 2 (never "אַחַת צִפֳּרִים"); the end asks the question.
 */
export interface StoryTemplate {
  id: string
  kind: 'join' | 'separate'
  /** Thing IDs the story fits (birds on a tree, apples in a basket…). */
  things: readonly string[]
}

/* ---------- 2nd grade (Stage 4b, docs/specs/math-grade2.md) ---------- */

/** Build `answer` in a place-value house: hundreds, tens and ones columns, 0–9 each (+/− per column, then Check). */
export interface PlaceValueQ extends MathQ<number> {
  /** The number to build, shown in digits (or blank when it is only spoken). */
  show: string
  /** Columns offered, from the left: 4 = thousands/hundreds/tens/ones (grade 3), 3 = hundreds/tens/ones, 2 = tens/ones. */
  columns: 2 | 3 | 4
  /** Grade 5: columns after the decimal point (tenths, hundredths, thousandths). `answer` is then a decimal (3.05). */
  decimals?: 1 | 2 | 3
}

/** A 10×10 hundred chart starting at `start` (1, 101, …, 901) with some cells blank. Answer: the blank cells' values. */
export interface ChartQ extends MathQ<readonly number[]> {
  start: number
  blanks: readonly number[]
}

/** Share `total` items equally among `plates` by dragging (or tapping a plate). Answer: items per plate. */
export interface ShareQ extends MathQ<number> {
  emoji: string
  total: number
  plates: number
  /**
   * Grade 3 (division with a remainder): `total` need not divide evenly. Items that don't fit go to a left-over bowl;
   * correct = every plate holds `answer` and the bowl holds `total % plates` (always fewer than `plates`).
   */
  leftover?: boolean
}

/* ---------- 3rd grade (Stage 5a, docs/specs/math-grade3.md) ---------- */

/**
 * A column exercise `a op b`, laid out left-to-right like written math. The child types the result digit by digit
 * from the ones column leftward; carries/borrows appear as small digits above. Answer = a + b or a − b
 * (0–10,000 in grade 3, up to 1,000,000 in grade 4, shown with commas from five digits).
 */
export interface ColumnQ extends MathQ<number> {
  a: number
  b: number
  op: '+' | '-'
  /** Grade 5: digits after the point (1–3); a, b and answer are decimals, laid out with the points one under the other. */
  places?: 1 | 2 | 3
}

/** A number sequence (left to right) with blanks to type on the number pad, left blank first. Answer = the blanks' values. */
export interface SequenceQ extends MathQ<readonly number[]> {
  /** Every term, including the blanks' true values. */
  terms: readonly number[]
  /** Indexes into `terms` shown empty, ascending. */
  blanks: readonly number[]
  /** The step between terms (negative when counting back); the aid draws it as arcs ("+25"). */
  step: number
}

/** A sequence with exactly one wrong term; tap it. Answer = its index in `terms`. */
export interface MistakeQ extends MathQ<number> {
  /** Terms as shown, one of them wrong. */
  terms: readonly number[]
  step: number
}

/**
 * An exercise shown as tokens left to right ('3', '+', '4', '×', '2', or '(' ')'); tap the operation to do first.
 * Answer = the index in `tokens` of that operator token.
 */
export interface FirstStepQ extends MathQ<number> {
  tokens: readonly string[]
}

/** Drag each number into one of two bins. Answer = the ids (indexes into `items`) that belong in bin `yes`. */
export interface SortQ extends MathQ<readonly number[]> {
  items: readonly number[]
  /** Bin labels: phrase IDs, shown as text ("מִתְחַלֵּק בְּ‑10" / "לֹא מִתְחַלֵּק"). */
  yes: string
  no: string
}

/** A rectangle on a square grid, in cells: column, row, width, height. */
export type CellRect = readonly [number, number, number, number]

/** A shape made of 1–2 non-overlapping rectangles on a grid; type how many squares (cm²) it covers. Answer = the area. */
export interface GridAreaQ extends MathQ<number> {
  cols: number
  rows: number
  rects: readonly CellRect[]
  /**
   * count: the squares are drawn inside the shape. sides: only the side lengths are written (counting → length × width);
   * the inner squares appear only with the aid.
   */
  mode: 'count' | 'sides'
  /** Grade 4 box nets: a colour group per rect (opposite faces share one, 0–2), shown with the aid. */
  faces?: readonly number[]
  /** Grade 6 composite shapes: ask for the perimeter (in cm, "ס״מ") instead of the area. */
  ask?: 'area' | 'perimeter'
}

/**
 * Art kit for grade 3 (registered by registerMathArt in art-g3.tsx), used in PickQ prompts and options:
 *  - 'math.angle'    props { deg: 0–180, rot: 0–359, armA: 0.35–1, armB: 0.35–1, corner?: true }
 *                    two arms from a vertex; corner draws a dashed right-angle square at the vertex to compare with.
 *  - 'math.triangle' props { a: deg, b: deg, rot: 0–359, ticks?: true }
 *                    base angles a and b (third = 180 − a − b); ticks marks equal sides (found from equal angles).
 *  - 'math.round'    props { from, to, n }  a number line from `from` to `to` with n marked and the midpoint dashed.
 */
export const MATH_ART = { angle: 'math.angle', triangle: 'math.triangle', round: 'math.round' } as const

export type AngleKind = 'acute' | 'right' | 'obtuse' | 'straight'
export type TriangleByAngles = 'acute' | 'right' | 'obtuse'
export type TriangleBySides = 'equilateral' | 'isosceles' | 'scalene'

/**
 * A division word problem with a remainder (spoken by the browser voice, D23). `text` has `{n}` (the total) and `{d}`
 * (the group size); the question asks how many full groups and how many are left over.
 */
export interface RemainderStory {
  id: string
  text: string
}

/* ---------- 4th grade (Stage 5b, docs/specs/math-grade4.md) ---------- */

/** A fraction, with a whole part for mixed numbers (2 3/4). Shown through MathText as "2 3/4". */
export interface Fraction { whole?: number; num: number; den: number }

/**
 * The area model for `a × b`: a rectangle split by place value (34 × 6 → 30 | 4 by 6; 23 × 45 → 20 | 3 by 40 | 5).
 * The child types each part's product, then the total. Answer = a × b; the parts come from splitting each factor
 * into its non-zero place values.
 */
export interface AreaModelQ extends MathQ<number> {
  a: number
  b: number
}

/** Tap parts of a shape to shade them. Correct = exactly `answer` parts shaded (which parts doesn't matter). */
export interface ShadeQ extends MathQ<number> {
  shape: 'strip' | 'circle' | 'rect'
  parts: number
  /**
   * Grade 6 fraction × fraction: a rect of rows × cols (parts = rows·cols). The first `bands` rows and columns are tinted
   * ([rows tinted, cols tinted]) so the child shades the overlap; correct is still the count.
   */
  rows?: number
  cols?: number
  bands?: readonly [number, number]
  /** The fraction to shade, shown stacked above the shape ("3/5"). */
  show: string
}

/**
 * Type a fraction: numerator over denominator, and a whole-number box when `mixed`. Correct = the same value as
 * `answer` (2/4 = 1/2, 1 1/4 = 5/4); with `simplest`, only the simplest form counts (grade 5 simplifying).
 */
export interface FractionPadQ extends MathQ<Fraction> {
  prompt: PickPrompt
  mixed: boolean
  simplest?: boolean
  /** Aid: strips for these fractions, drawn one above the other ("1/2", "1/4"). */
  aidStrips?: readonly string[]
  /** Grade 5 "between": any fraction strictly between these two is correct (`answer` is one example). */
  between?: readonly [Fraction, Fraction]
}

/**
 * Art kit for grade 4 (registerMathArt4 in art-g4.tsx), used in PickQ prompts, options and aidArt:
 *  - 'math.fraction' props { shape: 'circle' | 'rect' | 'strip', parts: 2–12, shaded: 0–parts }
 *  - 'math.strips'   props { a: 'n/d', b?: 'n/d' }  one or two fraction strips of equal length, one above the other
 *  - 'math.lines'    props { kind: 'parallel' | 'perpendicular' | 'crossing', rot: 0–359 }  two line segments
 *  - 'math.polygon'  props { sides: 4–8, diagonals?: true }  a convex polygon; diagonals from one vertex, dashed
 *  - 'math.quad'     props { kind: QuadKind, rot: 0–359 }  never only in the textbook position
 */
export const MATH_ART_4 = { fraction: 'math.fraction', strips: 'math.strips', lines: 'math.lines', polygon: 'math.polygon', quad: 'math.quad' } as const

export type QuadKind = 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid'

/** "How many do we need?" word problems where a remainder rounds up (buses): `{n}` the total, `{d}` per vehicle/box. */
export interface RoundUpStory extends RemainderStory {
  /** How many fit in one, sensible for the story (a car seats 4–5, a bus 40–55). */
  sizes: readonly number[]
  /** The largest total that still sounds real. */
  max: number
}

/** "How long is a door?" — the right length and three absurd ones, each as [number, unit]. */
export interface SensibleLength {
  id: string
  right: readonly [number, LengthUnit]
  wrong: readonly (readonly [number, LengthUnit])[]
}

export type LengthUnit = 'mm' | 'cm' | 'dm' | 'm' | 'km'

/* ---------- 5th grade (Stage 5c, docs/specs/math-grade5.md) ---------- */

/** Drag each number into one of several bins (prime / composite / neither). Answer[i] = the bin index of items[i]. */
export interface BinsQ extends MathQ<readonly number[]> {
  items: readonly number[]
  /** Bin labels: phrase IDs, shown as text. */
  bins: readonly string[]
}

/**
 * Break `n` into primes: the child picks a composite leaf and types one factor; the tree splits it into that factor and
 * the co-factor. A typed number that doesn't divide the leaf (or is 1 or the leaf itself) is a miss. Done when every leaf
 * is prime. Answer = the prime factors, ascending (the same for every tree).
 */
export interface FactorTreeQ extends MathQ<readonly number[]> {
  n: number
}

/**
 * Area of a slanted shape on a square grid (vertices in grid units, x right, y down). The base and the height are drawn
 * and labelled; the height may fall outside an obtuse triangle (G5 p.22). Answer = the area in squares.
 */
export interface SlantAreaQ extends MathQ<number> {
  cols: number
  rows: number
  points: readonly (readonly [number, number])[]
  /** The base, as two vertex indexes. */
  base: readonly [number, number]
  /** The height: from this vertex down to the base line at `foot` (grid units). */
  apex: number
  foot: readonly [number, number]
}

/**
 * Art kit for grade 5 (registerMathArt5 in art-g5.tsx):
 *  - 'math.solid'  props { kind: SolidKind, rot?: 0–359 }  a solid in a simple oblique/isometric drawing, hidden edges dashed
 *  - 'math.net'    props { kind: SolidKind, wrong?: 0 | 1 | 2 }  a net; wrong 1–2 = a near-miss that does not fold
 *  - 'math.height' props { shape: 'acute' | 'right' | 'obtuse' | 'parallelogram', seg: 'height' | 'median' | 'slant', rot }
 *                  the shape with its marked base and one dashed segment from the opposite vertex
 *  - 'math.freq'   props { rows: 'label:count,label:count,…' }  a two-column frequency table (labels are Hebrew words)
 *  - 'math.rects'  props { n }  every rectangle of area n on a grid (the aid for rectangles-of-n)
 *  - 'math.house'  props { before: '3.45', after: '345' }  a place-value table with both numbers (digits slide, point stays)
 */
export const MATH_ART_5 = { solid: 'math.solid', net: 'math.net', height: 'math.height', freq: 'math.freq', rects: 'math.rects', house: 'math.house' } as const

export type SolidKind = 'cube' | 'box' | 'tri-prism' | 'square-pyramid' | 'tri-pyramid' | 'hex-prism'

/** A frequency table for the mode (content/surveys.ts): a question phrase and the categories (Hebrew words). */
export interface Survey {
  id: string
  categories: readonly string[]
}

/** "3 pizzas shared by 4 children" (fraction as division, G5 p.8). `{n}` items, `{d}` children; spoken by the browser voice. */
export type ShareStory = RemainderStory

/* ---------- 6th grade (Stage 5d, docs/specs/math-grade6.md) ---------- */

/**
 * Level the bars: blocks stacked in columns of `values` heights; the child moves blocks (drag, or tap a block then a bar,
 * or keyboard) until every bar has the same height. Answer = the mean (the values are chosen so it is whole).
 */
export interface MeanQ extends MathQ<number> {
  values: readonly number[]
}

/**
 * Tap a part of a drawing. The art draws its tappable parts with `data-part="<id>"` (e.g. the circle's radius, diameter,
 * chord, arc); the game makes them focusable buttons. Answer = the part id to tap.
 */
export interface TapArtQ extends MathQ<string> {
  art: ArtRef
  /** Part ids the drawing offers, in tab order. */
  parts: readonly string[]
}

/**
 * Art kit for grade 6 (registerMathArt6 in art-g6.tsx):
 *  - 'math.machine' props { rule: '×3+1', input?: n, output?: n }  a number machine; a missing side shows '?'
 *  - 'math.circle'  props { parts: 'radius,diameter,chord,arc', r?: n }  a circle with its centre and the listed parts,
 *                   each drawn as a thick tappable element with data-part; `r` labels the radius ("r = 5")
 *  - 'math.cubes'   props { l, w, h }  a box built of unit cubes, isometric
 *  - 'math.percent' props { p }  a 10×10 grid with p squares shaded (percent as hundredths)
 *  - 'math.strips'  (grade 4) is reused for "how many 1/4 in 3"
 */
export const MATH_ART_6 = { machine: 'math.machine', circle: 'math.circle', cubes: 'math.cubes', percent: 'math.percent' } as const

export type CirclePart = 'radius' | 'diameter' | 'chord' | 'arc'

/** A discount or price-rise story (G6 p.11–12): `{p}` percent, `{x}` price; read by the browser voice (D23). */
export interface PercentStory {
  id: string
  kind: 'discount' | 'rise' | 'whole'
  text: string
}

/** "A pool: 50 m³ or 50 mL?" (G6 p.20). */
export interface SensibleVolume {
  id: string
  right: string
  wrong: readonly string[]
}

export type { ObjectGroup }
