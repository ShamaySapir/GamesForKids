import { pick, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { ObjectGroup, PickOption, PickQ } from '../../ui/pick/types'
import { M, OP, shopPhrase, storyPart, thingPhrase } from './ids'
import { numberPhrase, pricePhrase } from './numbers'
import type { BuildQ, CoinsQ, Line, MisplacedQ, PadQ, PairsQ, PlaceQ, StoryTemplate, Thing } from './types'

// Pure question generators for the numbers island (skills 1–10), one per game. Content (things, stories, shop
// items) comes in as arguments. Spec: docs/specs/math-k2.md. Tested in generators.test.ts.

/* ---------- helpers ---------- */

/** Review item first (when a candidate), then fresh items, then repeats; the first candidate `build` accepts wins. */
function make<T, Q>(ctx: GenContext, items: readonly T[], key: (t: T) => string, build: (t: T) => Q | null): Q {
  const review = items.filter(i => key(i) === ctx.review)
  const rest = items.filter(i => key(i) !== ctx.review)
  const fresh = shuffle(ctx.rng, rest.filter(i => !ctx.avoid.has(key(i))))
  const stale = shuffle(ctx.rng, rest.filter(i => ctx.avoid.has(key(i))))
  for (const t of [...review, ...fresh, ...stale]) {
    const q = build(t)
    if (q) return q
  }
  throw new Error('no valid item to ask')
}

/**
 * Games with several kinds of items (add/subtract, next/before…) ask each kind equally often however many facts it
 * has: the group holding the review item, otherwise a random group.
 */
function oneGroup<T>(ctx: GenContext, groups: readonly (readonly T[])[], key: (t: T) => string): readonly T[] {
  const nonEmpty = groups.filter(g => g.length)
  return nonEmpty.find(g => g.some(t => key(t) === ctx.review)) ?? pick(ctx.rng, nonEmpty)
}

/** n distinct (by `key`) items, drawn tier by tier so earlier tiers are preferred; null when there aren't enough. */
function take<T>(rng: Rng, tiers: readonly (readonly T[])[], n: number, key: (t: T) => string, taken: readonly string[] = []): T[] | null {
  const seen = new Set(taken)
  const out: T[] = []
  for (const tier of tiers)
    for (const t of shuffle(rng, tier)) {
      if (out.length < n && !seen.has(key(t))) {
        seen.add(key(t))
        out.push(t)
      }
    }
  return out.length === n ? out : null
}

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i)
const near = (v: number, d: number, min: number, max: number) => [v - d, v + d].filter(x => x >= min && x <= max)

/** The answer plus n−1 wrong numbers drawn tier by tier, shuffled. `spoken` adds a 🔊 that reads each number. */
function numberOptions(rng: Rng, answer: number, n: number, tiers: readonly (readonly number[])[], spoken: boolean): PickOption[] | null {
  const wrong = take(rng, tiers, n - 1, String, [String(answer)])
  if (!wrong) return null
  return shuffle(rng, [answer, ...wrong]).map(v => ({
    id: String(v), kind: 'number' as const, label: String(v), ...(spoken ? { say: numberPhrase(v) } : {}),
  }))
}

type Layout = NonNullable<ObjectGroup['layout']>
/** Dice patterns only exist up to 6. */
const layoutFor = (rng: Rng, count: number): Layout => pick(rng, count <= 6 ? (['row', 'dice', 'scatter'] as const) : (['row', 'scatter'] as const))

const groupOpt = (emoji: string, count: number, layout: Layout): PickOption => ({ id: String(count), kind: 'objects', group: { emoji, count, layout } })

/** Counts for an objects-options question: the answer plus wrong counts, nearest first; null when too few exist. */
function countOptions(rng: Rng, emoji: string, answer: number, n: number, min: number, max: number, layout: (count: number) => Layout): PickOption[] | null {
  const wrong = take(rng, [near(answer, 1, min, max), near(answer, 2, min, max), range(min, max)], n - 1, String, [String(answer)])
  if (!wrong) return null
  return shuffle(rng, [answer, ...wrong]).map(c => groupOpt(emoji, c, layout(c)))
}

/* ---------- 1. count to 10 ---------- */

const COUNTS = range(1, 10)
const countKey = (n: number) => `count:${n}`
/** Both games of skill 1 practise the same facts. */
export const countAccepts = (key: string) => COUNTS.some(n => countKey(n) === key)

/** Game A: objects in a row, dice pattern or scattered; pick how many of 4 numbers (±1, ±2 first). */
export function howManyQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, COUNTS, countKey, n => {
    const options = numberOptions(ctx.rng, n, 4, [near(n, 1, 1, 10), near(n, 2, 1, 10), COUNTS], true)
    if (!options) return null
    const thing = pick(ctx.rng, things)
    return {
      itemKey: countKey(n), answer: String(n), say: M.howMany, instruction: M.howMany,
      prompt: { objects: [{ emoji: thing.emoji, count: n, layout: layoutFor(ctx.rng, n) }] }, options,
    }
  })
}

/** Game B: see and hear a number, fill the basket with that many objects. */
export function showMeQuestion(ctx: GenContext, things: readonly Thing[]): BuildQ {
  return make(ctx, COUNTS, countKey, n => ({
    itemKey: countKey(n), answer: n, say: [M.showMe, ...numberPhrase(n)], instruction: M.showMe,
    emoji: pick(ctx.rng, things).emoji, max: 10, show: String(n),
  }))
}

/* ---------- 2. numerals to 10 ---------- */

const numKey = (n: number) => `num:${n}`
const numAccepts = (min: number, max: number) => (key: string) => range(min, max).some(n => numKey(n) === key)
export const hearNumberAccepts = numAccepts(0, 10)
export const matchAccepts = numAccepts(1, 10)
export const dominoAccepts = numAccepts(1, 6)

/** Digits that are easy to mix up; they are offered first as distractors. */
export const LOOK_ALIKE: Readonly<Record<number, readonly number[]>> = { 6: [9], 9: [6], 1: [7], 7: [1], 3: [8], 8: [3] }

/** Hear a number, pick its digit of 4. The options carry no 🔊: it would give the answer away. */
export function hearNumberQuestion(ctx: GenContext): PickQ {
  return make(ctx, range(0, 10), numKey, n => {
    const options = numberOptions(ctx.rng, n, 4, [LOOK_ALIKE[n] ?? [], near(n, 1, 0, 10), near(n, 2, 0, 10), range(0, 10)], false)
    if (!options) return null
    return {
      itemKey: numKey(n), answer: String(n), say: [M.hearNumber, ...numberPhrase(n)], instruction: M.hearNumber, prompt: {}, options, hint: numberPhrase(n),
    }
  })
}

/** See a digit, pick the picture of 3 with that many objects. */
export function matchQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, range(1, 10), numKey, n => {
    const options = countOptions(ctx.rng, pick(ctx.rng, things).emoji, n, 3, 1, 10, c => layoutFor(ctx.rng, c))
    if (!options) return null
    return { itemKey: numKey(n), answer: String(n), say: M.matchNumber, instruction: M.matchNumber, prompt: { expr: String(n) }, options }
  })
}

/** Dots a domino shows; the same shape is never offered back, so the child matches quantity, not arrangement. */
export const DOMINO_DOT = '⚫'

/** See a dice pattern (1–6), pick the one of 3 with the same number of dots in a row or scattered. */
export function dominoQuestion(ctx: GenContext): PickQ {
  return make(ctx, range(1, 6), numKey, n => {
    const flat = () => pick(ctx.rng, ['row', 'scatter'] as const)
    const options = countOptions(ctx.rng, DOMINO_DOT, n, 3, 1, 10, flat)
    if (!options) return null
    return {
      itemKey: numKey(n), answer: String(n), say: M.matchNumber, instruction: M.matchNumber,
      prompt: { objects: [{ emoji: DOMINO_DOT, count: n, layout: 'dice' }] }, options,
    }
  })
}

/* ---------- 3. compare ---------- */

const PAIRS = range(1, 10).flatMap(a => range(a + 1, 10).map(b => [a, b] as const))
const pairKey = ([a, b]: readonly [number, number]) => `cmp:${a}:${b}`
export const compareAccepts = (key: string) => PAIRS.some(p => pairKey(p) === key)

/** Two groups of one kind, never equal; "where are there more / fewer?". Both groups share one layout. */
export function moreLessQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, PAIRS, pairKey, ([lo, hi]) => {
    const more = ctx.rng() < 0.5
    const emoji = pick(ctx.rng, things).emoji
    const layout = pick(ctx.rng, ['row', 'scatter'] as const)
    const instruction = more ? M.more : M.fewer
    return {
      itemKey: pairKey([lo, hi]), answer: String(more ? hi : lo), say: instruction, instruction, prompt: {},
      options: shuffle(ctx.rng, [lo, hi]).map(c => groupOpt(emoji, c, layout)),
    }
  })
}

const TRIPLES = range(1, 10).flatMap(a => range(a + 1, 10).flatMap(b => range(b + 1, 10).map(c => [a, b, c] as const)))
const tripleKey = (t: readonly number[]) => `most:${t.join(':')}`
export const mostAccepts = (key: string) => TRIPLES.some(t => tripleKey(t) === key)

/**
 * Three groups of one kind with different counts; "where are there the most?". There is no dedicated "most" phrase in
 * the contract, so the instruction is M.more ("where are there more?").
 */
export function mostQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, TRIPLES, tripleKey, triple => {
    const emoji = pick(ctx.rng, things).emoji
    const layout = pick(ctx.rng, ['row', 'scatter'] as const)
    return {
      itemKey: tripleKey(triple), answer: String(triple[2]), say: M.more, instruction: M.more, prompt: {},
      options: shuffle(ctx.rng, triple).map(c => groupOpt(emoji, c, layout)),
    }
  })
}

/* ---------- 4. join / separate stories within 10 ---------- */

interface StoryFact { kind: 'join' | 'separate'; a: number; b: number }
const JOINS: StoryFact[] = range(2, 8).flatMap(a => range(2, 10 - a).map(b => ({ kind: 'join' as const, a, b })))
const SEPARATES: StoryFact[] = range(3, 10).flatMap(a => range(2, a - 1).map(b => ({ kind: 'separate' as const, a, b })))
const storyKey = (f: StoryFact) => `story:${f.a}${f.kind === 'join' ? '+' : '-'}${f.b}`
export const storyAccepts = (key: string) => [...JOINS, ...SEPARATES].some(f => storyKey(f) === key)

/**
 * A spoken story with pictures; pick the result of 4. join: a, b ≥ 2, a + b ≤ 10 (groups side by side); separate:
 * b < a ≤ 10 (one group, the b leaving objects faded). Wrong numbers: ±1, then the story's own numbers, then ±2.
 */
export function joinSeparateQuestion(ctx: GenContext, things: readonly Thing[], stories: readonly StoryTemplate[]): PickQ {
  const usable = (s: StoryTemplate) => things.filter(t => s.things.includes(t.id))
  const playable = stories.filter(s => usable(s).length)
  const groups = [JOINS, SEPARATES].filter(g => playable.some(s => s.kind === g[0]!.kind))
  return make(ctx, oneGroup(ctx, groups, storyKey), storyKey, ({ kind, a, b }) => {
    const story = pick(ctx.rng, playable.filter(s => s.kind === kind))
    const thing = pick(ctx.rng, usable(story))
    const result = kind === 'join' ? a + b : a - b
    const options = numberOptions(ctx.rng, result, 4, [near(result, 1, 1, 10), [a, b], near(result, 2, 1, 10), range(1, 10)], true)
    if (!options) return null
    const objects: ObjectGroup[] = kind === 'join'
      ? [{ emoji: thing.emoji, count: a, layout: 'row' }, { emoji: thing.emoji, count: b, layout: 'row' }]
      : [{ emoji: thing.emoji, count: a, layout: 'row', faded: b }]
    return {
      itemKey: storyKey({ kind, a, b }), answer: String(result), instruction: M.story, prompt: { objects }, options,
      say: [storyPart(story.id, 'start'), ...numberPhrase(a), thingPhrase(thing.id), storyPart(story.id, 'middle'), ...numberPhrase(b), storyPart(story.id, 'end')],
    }
  })
}

/* ---------- 5. count to 100 ---------- */

/** Skill 5 answers reach 100. */
const PAD100 = 3

interface NextFact { kind: 'next' | 'before'; n: number }
const NEXTS: NextFact[] = range(1, 99).map(n => ({ kind: 'next', n }))
const BEFORES: NextFact[] = range(2, 100).map(n => ({ kind: 'before', n }))
const nextKey = (f: NextFact) => `${f.kind}:${f.n}`
export const nextBeforeAccepts = (key: string) => [...NEXTS, ...BEFORES].some(f => nextKey(f) === key)

/** "What comes after / before 39?" on the pad; the exercise shows `39, ?` or `?, 39`. */
export function nextBeforeQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [NEXTS, BEFORES], nextKey), nextKey, ({ kind, n }) => {
    const instruction = kind === 'next' ? M.next : M.before
    return {
      itemKey: nextKey({ kind, n }), answer: kind === 'next' ? n + 1 : n - 1, say: [instruction, ...numberPhrase(n)], instruction,
      prompt: { expr: kind === 'next' ? `${n}, ?` : `?, ${n}` }, maxDigits: PAD100,
    }
  })
}

interface SkipFact { step: 10 | 5 | 2 | -2; start: number }
const SKIPS: SkipFact[][] = [
  range(0, 6).map(i => ({ step: 10 as const, start: i * 10 })),
  range(1, 16).map(i => ({ step: 5 as const, start: i * 5 })),
  range(1, 40).map(i => ({ step: 2 as const, start: i * 2 })),
  // Backward by 2 from at most 50, never below 2.
  range(5, 25).map(i => ({ step: -2 as const, start: i * 2 })),
]
const skipKey = (f: SkipFact) => `skip:${f.step}:${f.start}`
export const skipCountAccepts = (key: string) => SKIPS.flat().some(f => skipKey(f) === key)

/** Five terms of a sequence by 10s, 5s or 2s (also backward by 2s from ≤ 50) with one gap among the last four. */
export function skipCountQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, SKIPS, skipKey), skipKey, f => {
    const terms = range(0, 4).map(i => f.start + i * f.step)
    const gap = 1 + Math.floor(ctx.rng() * 4)
    return {
      itemKey: skipKey(f), answer: terms[gap]!, say: M.skip, instruction: M.skip,
      prompt: { expr: terms.map((t, i) => (i === gap ? '?' : String(t))).join(', ') }, maxDigits: PAD100,
    }
  })
}

interface WhoFact { kind: 'oneMore' | 'oneLess' | 'between'; n: number }
const WHO: WhoFact[][] = [
  range(1, 99).map(n => ({ kind: 'oneMore' as const, n })),
  range(2, 100).map(n => ({ kind: 'oneLess' as const, n })),
  range(1, 98).map(n => ({ kind: 'between' as const, n })),
]
const whoKey = (f: WhoFact) => `${f.kind}:${f.n}`
export const whoAmIAccepts = (key: string) => WHO.flat().some(f => whoKey(f) === key)

/**
 * "Who am I?": 1 more than n (`n + 1 = ?`), 1 less than n (`n − 1 = ?`), or between n and n + 2 (`n, ?, n + 2`).
 * For `between`, n is the lower number.
 */
export function whoAmIQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, WHO, whoKey), whoKey, f => {
    const base = { itemKey: whoKey(f), maxDigits: PAD100 }
    if (f.kind === 'oneMore') return { ...base, answer: f.n + 1, say: [M.oneMore, ...numberPhrase(f.n)], instruction: M.oneMore, prompt: { expr: `${f.n} + 1 = ?` } }
    if (f.kind === 'oneLess') return { ...base, answer: f.n - 1, say: [M.oneLess, ...numberPhrase(f.n)], instruction: M.oneLess, prompt: { expr: `${f.n} − 1 = ?` } }
    return {
      ...base, answer: f.n + 1, instruction: M.between, prompt: { expr: `${f.n}, ?, ${f.n + 2}` },
      say: [M.between, ...numberPhrase(f.n), M.betweenAnd, ...numberPhrase(f.n + 2)],
    }
  })
}

/* ---------- 6. number line ---------- */

type LineMax = 10 | 20 | 100
const LINE_MAXES: readonly LineMax[] = [10, 20, 100]

/** Place a marker: ticks every 1 (every 10 on 0–100), labels every 5 (every 10). Exact on 0–20, ±3 on 0–100. */
const PLACE_LINES: Readonly<Record<LineMax, { line: Line; tolerance: number }>> = {
  10: { line: { min: 0, max: 10, step: 1, labelEvery: 5 }, tolerance: 0 },
  20: { line: { min: 0, max: 20, step: 1, labelEvery: 5 }, tolerance: 0 },
  100: { line: { min: 0, max: 100, step: 10, labelEvery: 10 }, tolerance: 3 },
}
/** Targets never sit on a labelled tick (that would be reading, not placing). */
const placeTargets = (max: LineMax) => range(1, max - 1).filter(t => t % PLACE_LINES[max].line.labelEvery !== 0)
interface LineFact { max: LineMax; n: number }
const lineKey = (f: LineFact) => `line:${f.max}:${f.n}`
const PLACES: LineFact[][] = LINE_MAXES.map(max => placeTargets(max).map(n => ({ max, n })))
export const placeAccepts = (key: string) => PLACES.flat().some(f => lineKey(f) === key)

/** Drag the marker to where a number belongs, on a line 0–10, 0–20 or 0–100 (each equally often). */
export function placeQuestion(ctx: GenContext): PlaceQ {
  return make(ctx, oneGroup(ctx, PLACES, lineKey), lineKey, f => ({
    itemKey: lineKey(f), answer: f.n, say: [M.place, ...numberPhrase(f.n)], instruction: M.place,
    line: PLACE_LINES[f.max].line, target: f.n, tolerance: PLACE_LINES[f.max].tolerance,
  }))
}

/** which-number lines: on 0–100 only the ends and the middle are labelled, so a marked ten has to be counted. */
const WHICH_LINES: Readonly<Record<LineMax, Line>> = {
  10: PLACE_LINES[10].line,
  20: PLACE_LINES[20].line,
  100: { min: 0, max: 100, step: 10, labelEvery: 50 },
}
const whichMarks = (max: LineMax) => (max === 100 ? range(1, 9).map(i => i * 10).filter(t => t !== 50) : placeTargets(max))
const WHICHES: LineFact[][] = LINE_MAXES.map(max => whichMarks(max).map(n => ({ max, n })))
export const whichNumberAccepts = (key: string) => WHICHES.flat().some(f => lineKey(f) === key)

/** A PickQ that also carries the line and the marked point; the shared PickPrompt cannot draw a line (see report). */
export interface WhichNumberQ extends PickQ {
  line: Line
  marked: number
}

/** A point is marked on the line; pick its number of 3 (±1, ±2 — on 0–100 ±10, ±20). */
export function whichNumberQuestion(ctx: GenContext): WhichNumberQ {
  return make(ctx, oneGroup(ctx, WHICHES, lineKey), lineKey, ({ max, n }) => {
    const d = max === 100 ? 10 : 1
    const options = numberOptions(ctx.rng, n, 3, [near(n, d, 0, max), near(n, 2 * d, 0, max), range(0, max / d).map(i => i * d)], true)
    if (!options) return null
    return {
      itemKey: lineKey({ max, n }), answer: String(n), say: M.whichNumber, instruction: M.whichNumber, prompt: {}, options,
      line: WHICH_LINES[max], marked: n,
    }
  })
}

/** Five labels, evenly spaced and strictly inside the line; `gap` apart, the first at `first`. */
interface MisFact { max: LineMax; first: number; wrong: number }
const MIS_GAP: Readonly<Record<LineMax, number>> = { 10: 1, 20: 2, 100: 10 }
const MISPLACED: MisFact[][] = LINE_MAXES.map(max =>
  range(0, (max - 2 * MIS_GAP[max]) / MIS_GAP[max] - 4).flatMap(i => range(0, 4).map(wrong => ({ max, first: MIS_GAP[max] * (i + 1), wrong }))))
const misKey = (f: MisFact) => `mis:${f.max}:${f.first}:${f.wrong}`

/**
 * One of five labels shows a wrong number (never another label's number, never an end of the line); tap it. The line
 * labels only its two ends (labelEvery = max), the five labels come from `labels`.
 */
export function misplacedQuestion(ctx: GenContext): MisplacedQ {
  return make(ctx, oneGroup(ctx, MISPLACED, misKey), misKey, f => {
    const gap = MIS_GAP[f.max]
    const ats = range(0, 4).map(i => f.first + i * gap)
    const at = ats[f.wrong]!
    const pool = range(1, f.max - 1).filter(v => !ats.includes(v) && (f.max !== 100 || v % 10 === 0))
    const close = pool.filter(v => Math.abs(v - at) <= 2 * gap)
    const wrongText = pick(ctx.rng, close.length ? close : pool)
    return {
      itemKey: misKey(f), answer: f.wrong, say: M.misplaced, instruction: M.misplaced,
      line: { min: 0, max: f.max, step: f.max === 100 ? 10 : 1, labelEvery: f.max },
      labels: ats.map((a, i) => ({ at: a, text: String(i === f.wrong ? wrongText : a) })),
    }
  })
}

/* ---------- 7. splits of 10 ---------- */

const hideKey = (visible: number) => `hide:${visible}`
export const hiddenAccepts = (key: string) => range(1, 9).some(v => hideKey(v) === key)

/**
 * Ten objects, some under a cup; "how many are hidden?" on the pad. The hidden ones are the `faded` objects of a single
 * group of 10 (the games render faded objects as covered). Key: how many are visible.
 */
export function hiddenQuestion(ctx: GenContext, things: readonly Thing[]): PadQ {
  return make(ctx, range(1, 9), hideKey, visible => ({
    itemKey: hideKey(visible), answer: 10 - visible, say: M.hidden, instruction: M.hidden, maxDigits: 2,
    prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: 10, layout: 'row', faded: 10 - visible }] },
  }))
}

export const ALL_SPLITS_KEY = 'splits:10'
export const allSplitsAccepts = (key: string) => key === ALL_SPLITS_KEY

/** The board for "find all pairs that make 10": the cards 0–10 plus a second 5, shuffled — six pairs, each card in one. */
export function allSplitsQuestion(ctx: GenContext): PairsQ {
  return {
    itemKey: ALL_SPLITS_KEY, answer: null, say: M.allSplits, instruction: M.allSplits, total: 10, cards: shuffle(ctx.rng, [...range(0, 10), 5]),
  }
}

/* ---------- 8. within 20 ---------- */

/** a + b with the sum in 11–20, a − b with a in 11–20 and b < a: the facts that cross ten. Item key: the fact ('8+5'). */
interface Fact { op: '+' | '-'; a: number; b: number }
const ADDS: Fact[] = range(1, 19).flatMap(a => range(1, 19).filter(b => a + b >= 11 && a + b <= 20).map(b => ({ op: '+' as const, a, b })))
const SUBS: Fact[] = range(11, 20).flatMap(a => range(1, a - 1).map(b => ({ op: '-' as const, a, b })))
const factKey = (f: Fact) => `${f.a}${f.op}${f.b}`
const resultOf = (f: Fact) => (f.op === '+' ? f.a + f.b : f.a - f.b)
/** Solve and missing practise the same facts. */
export const solveAccepts = (key: string) => [...ADDS, ...SUBS].some(f => factKey(f) === key)
export const missingAccepts = solveAccepts

const symbol = (op: Fact['op']) => (op === '+' ? '+' : '−')

/** The jumps from `from` to `to` on a 0–20 line; a trip across 10 stops there ('8 → 13' is +2, +3). Signed. */
function jumps(from: number, to: number): number[] {
  if (from < 10 && to > 10) return [10 - from, to - 10]
  if (from > 10 && to < 10) return [10 - from, to - 10]
  return [to - from]
}
const aid = (from: number, to: number): NonNullable<PadQ['aidLine']> => ({ max: 20, from, jumps: jumps(from, to) })

/** `8 + 5 = ?` or `13 − 6 = ?`, results 0–20; the aid draws the jumps. */
export function solveQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [ADDS, SUBS], factKey), factKey, f => {
    const r = resultOf(f)
    return {
      itemKey: factKey(f), answer: r, maxDigits: 2, instruction: M.solve, prompt: { expr: `${f.a} ${symbol(f.op)} ${f.b} = ?` },
      say: [M.solve, ...numberPhrase(f.a), f.op === '+' ? OP.plus : OP.minus, ...numberPhrase(f.b)], aidLine: aid(f.a, r),
    }
  })
}

/**
 * One number of the fact is missing: `? + 6 = 14`, `8 + ? = 14`, `? − 6 = 9`, `15 − ? = 9` (the blank is either
 * operand). The aid draws the jumps between the first operand and the result (from the result when the first is blank).
 */
export function missingQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [ADDS, SUBS], factKey), factKey, f => {
    const c = resultOf(f)
    const blankFirst = ctx.rng() < 0.5
    const expr = blankFirst ? `? ${symbol(f.op)} ${f.b} = ${c}` : `${f.a} ${symbol(f.op)} ? = ${c}`
    // Blank first: from the result back to the first operand; otherwise from the first operand on to the result.
    const line = blankFirst ? aid(c, f.a) : aid(f.a, c)
    return {
      itemKey: factKey(f), answer: blankFirst ? f.a : f.b, maxDigits: 2, say: M.missing, instruction: M.missing, prompt: { expr }, aidLine: line,
    }
  })
}

/* ---------- 9. whole tens ---------- */

const TENS = range(1, 10)
const TEN_ADDS: Fact[] = TENS.flatMap(a => TENS.filter(b => a + b <= 10).map(b => ({ op: '+' as const, a: a * 10, b: b * 10 })))
const TEN_SUBS: Fact[] = TENS.flatMap(a => TENS.filter(b => b < a).map(b => ({ op: '-' as const, a: a * 10, b: b * 10 })))
const tensKey = (f: Fact) => `tens:${factKey(f)}`
export const tensAccepts = (key: string) => [...TEN_ADDS, ...TEN_SUBS].some(f => tensKey(f) === key)

/**
 * `20 + 60 = ?` with its unit analogy on a line above (`2 + 6 = 8`, separated by a newline in `expr`), and one 10-₪ coin
 * per ten as objects. Results 10–100 (subtraction never reaches 0).
 */
export function tensQuestion(ctx: GenContext, coin: string): PadQ {
  return make(ctx, oneGroup(ctx, [TEN_ADDS, TEN_SUBS], tensKey), tensKey, f => {
    const r = resultOf(f)
    const [a, b] = [f.a / 10, f.b / 10]
    const objects: ObjectGroup[] = f.op === '+'
      ? [{ emoji: coin, count: a, layout: 'row' }, { emoji: coin, count: b, layout: 'row' }]
      : [{ emoji: coin, count: a, layout: 'row', faded: b }]
    return {
      itemKey: tensKey(f), answer: r, maxDigits: PAD100, instruction: M.solve,
      say: [M.solve, ...numberPhrase(f.a), f.op === '+' ? OP.plus : OP.minus, ...numberPhrase(f.b)],
      prompt: { expr: `${a} ${symbol(f.op)} ${b} = ${r / 10}\n${f.a} ${symbol(f.op)} ${f.b} = ?`, objects },
    }
  })
}

/* ---------- 10. money ---------- */

export const SHOP_COINS = [1, 2, 5, 10] as const
const payKey = (price: number) => `pay:${price}`
export const payAccepts = (key: string) => range(1, 20).some(p => payKey(p) === key)

/** Pay a price of 1–20 ₪ exactly with coins 1, 2, 5, 10 (always possible with ones; any combination counts). */
export function payQuestion(ctx: GenContext, shop: readonly { id: string; emoji: string }[]): CoinsQ {
  return make(ctx, range(1, 20), payKey, price => {
    const item = pick(ctx.rng, shop)
    return {
      itemKey: payKey(price), answer: price, say: [M.pay, pricePhrase(price)], instruction: M.pay,
      item: { emoji: item.emoji, name: shopPhrase(item.id) }, price, coins: SHOP_COINS,
    }
  })
}

interface ChangeFact { paid: 10 | 20; price: number }
const CHANGES: ChangeFact[][] = ([10, 20] as const).map(paid => range(1, paid - 1).map(price => ({ paid, price })))
const changeKey = (f: ChangeFact) => `change:${f.paid}-${f.price}`
export const changeAccepts = (key: string) => CHANGES.flat().some(f => changeKey(f) === key)

/**
 * Paid 10 or 20 for a cheaper item; "how much change?" as `20 − 13 = ?` beside the item. There is no "you paid" phrase
 * in the contract, so the exercise carries it. The aid counts up from the price to the money paid.
 */
export function changeQuestion(ctx: GenContext, shop: readonly { id: string; emoji: string }[]): PadQ {
  return make(ctx, oneGroup(ctx, CHANGES, changeKey), changeKey, ({ paid, price }) => ({
    itemKey: changeKey({ paid, price }), answer: paid - price, say: M.change, instruction: M.change, maxDigits: 2,
    prompt: { picture: pick(ctx.rng, shop).emoji, expr: `${paid} − ${price} = ?` }, aidLine: aid(price, paid),
  }))
}
