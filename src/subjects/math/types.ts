import type { PhraseRef, Question } from '../../core/engine/types'
import type { ObjectGroup, PickPrompt, PickQ } from '../../ui/pick/types'

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
}

/**
 * A number line drawn left-to-right from `min` to `max`, ticks every `step`, labels every `labelEvery`.
 * The marker moves in units of `snap` (default `step`), so 0–100 can have ticks every 10 but reach 45.
 */
export interface Line { min: number; max: number; step: number; labelEvery: number; snap?: number }

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
 * from the ones column leftward; carries/borrows appear as small digits above. Answer = a + b or a − b (0–10,000).
 */
export interface ColumnQ extends MathQ<number> {
  a: number
  b: number
  op: '+' | '-'
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

export type { ObjectGroup }
