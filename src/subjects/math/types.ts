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
  /** Columns offered, from the left: 3 = hundreds/tens/ones, 2 = tens/ones. */
  columns: 2 | 3
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
}

export type { ObjectGroup }
