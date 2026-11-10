import { raw } from '../../core/audio/audio'
import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { REMAINDER_STORIES } from './content/remainder'
import { M, M3, OP, angleName, divisibleBy, findTriangle, roundTo, whichDivides } from './ids'
import { numberPhrase } from './numbers'
import { phrases } from './phrases'
import {
  MATH_ART, type AngleKind, type CellRect, type ColumnQ, type FirstStepQ, type GridAreaQ, type MistakeQ, type PadQ, type PlaceQ,
  type PlaceValueQ, type SequenceQ, type ShareQ, type SortQ, type Thing, type TriangleByAngles, type TriangleBySides,
} from './types'

// Pure question generators for the numbers island, 3rd grade (skills 18–28), one per game. Spec: docs/specs/math-grade3.md.
// Same style as generators-g2.ts; its helpers are private there, so the few needed are copied here.
// Numbers are written without thousands separators (grade 3). Division is written with ':' and subtraction with '−'.

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
 * For item spaces too big to list: the review item when `parse` accepts its key, else one draw from a random sampler
 * (the samplers are the "groups"), retrying while the item was already asked this round.
 */
function sample<T>(ctx: GenContext, parse: (key: string) => T | null, samplers: readonly ((rng: Rng) => T | null)[], key: (t: T) => string): T {
  const reviewed = ctx.review ? parse(ctx.review) : null
  if (reviewed) return reviewed
  const first = pick(ctx.rng, samplers)
  let last: T | null = null
  for (const draw of [first, ...samplers]) {
    for (let i = 0; i < 80; i++) {
      const t = draw(ctx.rng)
      if (!t) continue
      last = t
      if (!ctx.avoid.has(key(t))) return t
    }
  }
  if (last) return last
  throw new Error('no valid item to ask')
}

/**
 * Games with several kinds of items ask each kind equally often: the group holding the review item, else a random group
 * (one that still has an item not asked this round, so a one-item group like "straight" doesn't repeat).
 */
function oneGroup<T>(ctx: GenContext, groups: readonly (readonly T[])[], key: (t: T) => string): readonly T[] {
  const nonEmpty = groups.filter(g => g.length)
  const unasked = nonEmpty.filter(g => g.some(t => !ctx.avoid.has(key(t))))
  return nonEmpty.find(g => g.some(t => key(t) === ctx.review)) ?? pick(ctx.rng, unasked.length ? unasked : nonEmpty)
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

/** n distinct items: one from each kind first (kinds in order, random inside), then the rest from `fillers`. */
function onePerKind<T>(rng: Rng, kinds: readonly (readonly T[])[], fillers: readonly T[], n: number, key: (t: T) => string, taken: readonly string[]): T[] | null {
  const seen = new Set(taken)
  const out: T[] = []
  const add = (t: T) => {
    if (out.length >= n || seen.has(key(t))) return false
    seen.add(key(t))
    out.push(t)
    return true
  }
  for (const kind of kinds) for (const t of shuffle(rng, kind)) if (add(t)) break
  for (const t of shuffle(rng, fillers)) add(t)
  return out.length === n ? out : null
}

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i)
const stepped = (min: number, max: number, step: number) => range(0, Math.floor((max - min) / step)).map(i => min + i * step)
const keyNumber = (prefix: string, key: string) => (key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length)) ? Number(key.slice(prefix.length)) : NaN)
const keyIn = <T>(items: readonly T[], key: (t: T) => string) => {
  const keys = new Set(items.map(key))
  return (k: string) => keys.has(k)
}
const str = String

/** The answer plus n−1 wrong numbers drawn tier by tier, shuffled; every number has a 🔊 reading it. */
function numberOptions(rng: Rng, answer: number, n: number, tiers: readonly (readonly number[])[]): PickOption[] | null {
  const wrong = take(rng, tiers, n - 1, String, [String(answer)])
  if (!wrong) return null
  return shuffle(rng, [answer, ...wrong]).map(v => ({ id: String(v), kind: 'number' as const, label: String(v), say: numberPhrase(v) }))
}

/** Text options (exercises, signs): the answer plus distractors, deduplicated by label; ids are the labels. */
function labelOptions(rng: Rng, answer: string, wrong: readonly string[]): PickOption[] {
  return shuffle(rng, [answer, ...wrong]).map(l => ({ id: l, kind: 'number' as const, label: l }))
}

const PLUS = '+'
const MINUS = '−'
const TIMES = '×'
const DIV = ':'

/* ---------- 18. numbers to 10,000 ---------- */

const PV4 = range(1000, 9999)
const PV4_PLAIN = PV4.filter(n => !str(n).slice(1).includes('0'))
const PV4_ZEROS = PV4.filter(n => str(n).slice(1).includes('0'))
const build4Key = (n: number) => `pv4:${n}`
export const build4Accepts = (key: string) => keyNumber('pv4:', key) >= 1000 && keyNumber('pv4:', key) <= 9999

/** Build a four-digit number in the place-value house (thousands to ones, 0–9 each); half the numbers have a zero column. */
export function build4Question(ctx: GenContext): PlaceValueQ {
  return make(ctx, oneGroup(ctx, [PV4_PLAIN, PV4_ZEROS], build4Key), build4Key, n => ({
    itemKey: build4Key(n), answer: n, say: [M.build, ...numberPhrase(n)], instruction: M.build, show: str(n), columns: 4,
  }))
}

/**
 * Flexible splits, as exercises on the pad (digits only, left to right). Three kinds of item, one per number:
 *  - `h`: `2356 = 23 × 100 + ?` → the ones (56); sometimes a hundred fewer (`22 × 100 + ?` → 156)
 *  - `t`: `2356 = 235 × 10 + ?` → 6; sometimes a ten or two fewer (`234 × 10 + ?` → 16)
 *  - `w`: `23 × 100 + 56 = ?` → 2356 (the reverse; instruction "what number is this?")
 * Key `flex4:N:h|t|w`.
 */
interface Flex4 { n: number; kind: 'h' | 't' | 'w' }
const FLEX4: Record<Flex4['kind'], Flex4[]> = {
  h: range(1100, 9999).filter(n => n % 100 !== 0).map(n => ({ n, kind: 'h' as const })),
  t: range(1000, 9999).filter(n => n % 10 !== 0).map(n => ({ n, kind: 't' as const })),
  w: range(1100, 9999).filter(n => n % 100 !== 0).map(n => ({ n, kind: 'w' as const })),
}
const flex4Key = (f: Flex4) => `flex4:${f.n}:${f.kind}`
export const flexible4Accepts = keyIn(Object.values(FLEX4).flat(), flex4Key)

export function flexible4Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [FLEX4.h, FLEX4.t, FLEX4.w], flex4Key), flex4Key, ({ n, kind }) => {
    const itemKey = flex4Key({ n, kind })
    const hundreds = Math.floor(n / 100) - (Math.floor(n / 100) > 10 && ctx.rng() < 0.5 ? 1 : 0)
    if (kind === 'h') return { itemKey, answer: n - hundreds * 100, say: M.flexible, instruction: M.flexible, maxDigits: 3, prompt: { expr: `${n} = ${hundreds} ${TIMES} 100 + ?` } }
    if (kind === 't') {
      const tens = Math.floor(n / 10) - randInt(ctx.rng, 0, 2)
      return { itemKey, answer: n - tens * 10, say: M.flexible, instruction: M.flexible, maxDigits: 2, prompt: { expr: `${n} = ${tens} ${TIMES} 10 + ?` } }
    }
    return { itemKey, answer: n, say: M3.whatNumber, instruction: M3.whatNumber, maxDigits: 4, prompt: { expr: `${hundreds} ${TIMES} 100 + ${n - hundreds * 100} = ?` } }
  })
}

const SIGNS = ['<', '=', '>'] as const
type Sign = (typeof SIGNS)[number]
const SIGN_SAY: Readonly<Record<Sign, string>> = { '<': OP.less, '=': OP.equals, '>': OP.greater }
const signOf = (a: number, b: number): Sign => (a < b ? '<' : a > b ? '>' : '=')

/** Numbers that differ from `n` in one digit (one place) or by swapping two of its digits, with the same number of digits. */
function partners(n: number): { swaps: number[]; changes: number[] } {
  const d = str(n).split('')
  const swaps: number[] = []
  const changes: number[] = []
  for (let i = 0; i < d.length; i++) {
    for (let j = i + 1; j < d.length; j++) {
      const s = [...d]
      ;[s[i], s[j]] = [s[j]!, s[i]!]
      if (s[0] !== '0' && s.join('') !== d.join('')) swaps.push(Number(s.join('')))
    }
    for (let v = 0; v <= 9; v++) {
      const c = [...d]
      c[i] = str(v)
      if (v !== Number(d[i]) && c[0] !== '0') changes.push(Number(c.join('')))
    }
  }
  return { swaps: [...new Set(swaps)], changes }
}

interface Pair { a: number; b: number }
const signKey = (p: Pair) => `sign4:${p.a}:${p.b}`
function parseSign(key: string): Pair | null {
  const m = /^sign4:(\d{4}):(\d{4})$/.exec(key)
  if (!m) return null
  const [a, b] = [Number(m[1]), Number(m[2])]
  const { swaps, changes } = partners(a)
  return a >= 1000 && (a === b || swaps.includes(b) || changes.includes(b)) ? { a, b } : null
}
export const compare4Accepts = (key: string) => parseSign(key) !== null

/**
 * `3042 ? 3402` → pick <, = or > (always in this order). The pair differs in one place, or two digits are swapped
 * (3042/3402), sometimes equal. The item is the pair. Each sign has a 🔊.
 */
export function compare4Question(ctx: GenContext): PickQ {
  const p = sample(ctx, parseSign, [
    rng => { const a = randInt(rng, 1000, 9999); return { a, b: a } },
    rng => { const a = randInt(rng, 1000, 9999); const { swaps } = partners(a); return swaps.length ? { a, b: pick(rng, swaps) } : null },
    rng => { const a = randInt(rng, 1000, 9999); return { a, b: pick(rng, partners(a).changes) } },
    rng => { const a = randInt(rng, 1000, 9999); return { a, b: pick(rng, partners(a).changes) } },
  ], signKey)
  return {
    itemKey: signKey(p), answer: signOf(p.a, p.b), say: M.compare, instruction: M.compare, prompt: { expr: `${p.a} ? ${p.b}` },
    options: SIGNS.map(s => ({ id: s, kind: 'number' as const, label: s, say: SIGN_SAY[s] })),
  }
}

/**
 * Drag the marker on a number line. Two lines:
 *  - coarse: 0–10,000 with ticks every 1,000; target a multiple of 100, correct within ±250. Key `line10k:N`.
 *  - zoom: one thousand to the next with ticks every 100; target a multiple of 10, correct within ±30. Key `line10k:N:z`.
 */
interface LineItem { n: number; zoom: boolean }
const LINE_COARSE: LineItem[] = stepped(300, 9700, 100).map(n => ({ n, zoom: false }))
const LINE_ZOOM: LineItem[] = range(0, 9).flatMap(k => stepped(k * 1000 + 50, k * 1000 + 950, 10).map(n => ({ n, zoom: true })))
const lineKey = (l: LineItem) => `line10k:${l.n}${l.zoom ? ':z' : ''}`
export const line10000Accepts = keyIn([...LINE_COARSE, ...LINE_ZOOM], lineKey)

export function line10000Question(ctx: GenContext): PlaceQ {
  return make(ctx, oneGroup(ctx, [LINE_COARSE, LINE_ZOOM], lineKey), lineKey, ({ n, zoom }) => {
    const min = Math.floor(n / 1000) * 1000
    return {
      itemKey: lineKey({ n, zoom }), answer: n, say: [M.place, ...numberPhrase(n)], instruction: M.place, target: n,
      line: zoom ? { min, max: min + 1000, step: 100, labelEvery: 500, snap: 10 } : { min: 0, max: 10000, step: 1000, labelEvery: 2000, snap: 100 },
      tolerance: zoom ? 30 : 250,
    }
  })
}

/* ---------- 19. big jumps ---------- */

/** Six terms by 20, 25, 50, 200, 500 or 1,000, forward or back (signed step); `start` is the first term shown. */
const SKIP_TERMS = 6
interface Skip { step: number; start: number }
const skipUnit = (step: number) => (step >= 1000 ? 500 : step >= 200 ? 100 : 10)
const SKIP_GROUPS: Skip[][] = [20, 25, 50, 200, 500, 1000].map(size => [
  ...stepped(0, 10000 - (SKIP_TERMS - 1) * size, skipUnit(size)).map(start => ({ step: size, start })),
  ...stepped((SKIP_TERMS - 1) * size, 10000, skipUnit(size)).map(start => ({ step: -size, start })),
])
const skipKey = (prefix: string) => (f: Skip) => `${prefix}:${f.step}:${f.start}`
const skipTerms = (f: Skip) => range(0, SKIP_TERMS - 1).map(i => f.start + i * f.step)
export const skipBigAccepts = keyIn(SKIP_GROUPS.flat(), skipKey('skipbig'))
export const mistakeAccepts = keyIn(SKIP_GROUPS.flat(), skipKey('mistake'))

/** A sequence of six terms with two blanks (never the first) to fill on the pad. A start off the step's multiples (130, 155…) is common. */
export function skipBigQuestion(ctx: GenContext): SequenceQ {
  const key = skipKey('skipbig')
  return make(ctx, oneGroup(ctx, SKIP_GROUPS, key), key, f => {
    const terms = skipTerms(f)
    const blanks = shuffle(ctx.rng, range(1, SKIP_TERMS - 1)).slice(0, 2).sort((a, b) => a - b)
    return {
      itemKey: key(f), answer: blanks.map(i => terms[i]!), say: M3.skipBig, instruction: M3.skipBig, hint: f.step < 0 ? M3.jumpBackHint : M3.jumpHint,
      terms, blanks, step: f.step,
    }
  })
}

/** The same sequences with one term changed (by a ten or a hundred, whichever fits the step, never to another term's value); tap it. */
export function mistakeQuestion(ctx: GenContext): MistakeQ {
  const key = skipKey('mistake')
  return make(ctx, oneGroup(ctx, SKIP_GROUPS, key), key, f => {
    const truth = skipTerms(f)
    const at = randInt(ctx.rng, 0, SKIP_TERMS - 1)
    const deltas = Math.abs(f.step) <= 50 ? [10, 100] : [100, 1000]
    const wrongs = deltas.flatMap(d => [truth[at]! - d, truth[at]! + d]).filter(v => v >= 0 && v <= 10000 && !truth.includes(v))
    if (!wrongs.length) return null
    // The nearer change is the more plausible slip, so it is drawn twice as often.
    const wrong = pick(ctx.rng, [...wrongs.filter(v => Math.abs(v - truth[at]!) === deltas[0]), ...wrongs])
    return {
      itemKey: key(f), answer: at, say: M.misplaced, instruction: M.misplaced, hint: f.step < 0 ? M3.jumpBackHint : M3.jumpHint,
      terms: truth.map((t, i) => (i === at ? wrong : t)), step: f.step,
    }
  })
}

/* ---------- 20. rounding ---------- */

type Place = 10 | 100 | 1000
const PLACES: Place[] = [10, 100, 1000]
/** Rounds to the nearest `place`; exactly half rounds up. */
const roundOf = (n: number, place: number) => {
  const r = n % place
  return r * 2 >= place ? n - r + place : n - r
}
interface Near { n: number; place: Place }
const nearItems = (place: Place, min: number, max: number, keep: (r: number) => boolean): Near[] =>
  range(min, max).filter(n => keep(n % place)).map(n => ({ n, place }))
const NEAR_GROUPS: Near[][] = [
  nearItems(10, 11, 999, r => r !== 0 && r !== 5),
  nearItems(100, 101, 9999, r => r !== 0 && r !== 50),
  nearItems(1000, 1001, 9999, r => r !== 0 && r !== 500),
]
const nearKey = (f: Near) => `near:${f.n}:${f.place}`
export const closerAccepts = keyIn(NEAR_GROUPS.flat(), nearKey)

/** "347 — closer to 340 or 350?" (place 10), 300 or 400 (100), 3000 or 4000 (1000); never exactly in the middle. The aid draws the line. */
export function closerQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, NEAR_GROUPS, nearKey), nearKey, ({ n, place }) => {
    const lower = n - (n % place)
    const upper = lower + place
    return {
      itemKey: nearKey({ n, place }), answer: str(roundOf(n, place)), say: M3.closer, instruction: M3.closer, hint: M3.roundHint, prompt: { expr: str(n) },
      aidArt: [{ name: MATH_ART.round, props: { from: lower, to: upper, n } }],
      options: shuffle(ctx.rng, [lower, upper]).map(v => ({ id: str(v), kind: 'number' as const, label: str(v), say: numberPhrase(v) })),
    }
  })
}

const ROUND_GROUPS: Near[][] = [
  nearItems(10, 11, 999, r => r !== 0),
  nearItems(100, 101, 9999, r => r !== 0),
  nearItems(1000, 1001, 9999, r => r !== 0),
  // Exactly half: "5 always rounds up" (the tricky case, asked as often as a whole place).
  [...nearItems(10, 11, 999, r => r === 5), ...nearItems(100, 101, 9999, r => r === 50), ...nearItems(1000, 1001, 9999, r => r === 500)],
]
const roundKey = (f: Near) => `round:${f.n}:${f.place}`
export const roundPickAccepts = keyIn(ROUND_GROUPS.flat(), roundKey)

/** "Round 3650 to the nearest thousand" → 4 numbers: right; rounded down instead of up (or the reverse); rounded to a wrong place. */
export function roundPickQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, ROUND_GROUPS, roundKey), roundKey, ({ n, place }) => {
    const answer = roundOf(n, place)
    const down = n - (n % place)
    const wrongWay = answer === down ? down + place : down
    const wrongPlace = PLACES.filter(p => p !== place).flatMap(p => [roundOf(n, p), n - (n % p)])
    const valid = (vs: number[]) => vs.filter(v => v > 0 && v <= 10000 && v !== answer)
    const options = numberOptions(ctx.rng, answer, 4, [valid([wrongWay]), valid(wrongPlace), valid([answer + place, answer - place, answer + 2 * place])])
    if (!options) return null
    return {
      itemKey: roundKey({ n, place }), answer: str(answer), say: [roundTo(place), ...numberPhrase(n)], instruction: roundTo(place), hint: M3.roundHint,
      prompt: { expr: str(n) }, options,
    }
  })
}

/* ---------- 21. adding and subtracting to 10,000 ---------- */

/** Carries (+) or borrows (−) when written in columns. */
function carries(a: number, b: number, op: '+' | '-'): number {
  let count = 0
  let carry = 0
  for (let x = a, y = b; x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const total = op === '+' ? (x % 10) + (y % 10) + carry : (x % 10) - (y % 10) - carry
    carry = op === '+' ? (total >= 10 ? 1 : 0) : total < 0 ? 1 : 0
    count += carry
  }
  return count
}

interface Col { a: number; b: number; op: '+' | '-' }
const colKey = (c: Col) => `col:${c.a}${c.op}${c.b}`
const colResult = (c: Col) => (c.op === '+' ? c.a + c.b : c.a - c.b)
/** Within 0–10,000, one operand with four digits, at most two carries; a subtraction starts from the bigger number (result ≥ 1). */
function validCol(c: Col): boolean {
  const ok = c.a >= 100 && c.b >= 10 && c.a <= 9999 && c.b <= 9999 && Math.max(c.a, c.b) >= 1000 && carries(c.a, c.b, c.op) <= 2
  return ok && (c.op === '+' ? c.a + c.b <= 10000 : c.a > c.b && c.a >= 1000)
}
function parseCol(key: string): Col | null {
  const m = /^col:(\d+)([+-])(\d+)$/.exec(key)
  const c = m ? { a: Number(m[1]), b: Number(m[3]), op: m[2] as Col['op'] } : null
  return c && validCol(c) ? c : null
}
export const columnAccepts = (key: string) => parseCol(key) !== null

/** A sampler of column exercises with `op` and a carry count in [min, max]. */
const colSampler = (op: Col['op'], min: number, max: number) => (rng: Rng): Col | null => {
  for (let i = 0; i < 400; i++) {
    const big = randInt(rng, 1000, 9999)
    const other = randInt(rng, 100, 9999)
    const c: Col = op === '+' ? (rng() < 0.5 ? { a: big, b: other, op } : { a: other, b: big, op }) : { a: big, b: Math.min(other, big - 1), op }
    const k = carries(c.a, c.b, op)
    if (validCol(c) && k >= min && k <= max) return c
  }
  return null
}

/** `2890 + 3150` in columns; four kinds asked equally often: add and subtract, each with 0–1 or 2 carries/borrows. */
export function columnQuestion(ctx: GenContext): ColumnQ {
  const c = sample(ctx, parseCol, [colSampler('+', 0, 1), colSampler('+', 2, 2), colSampler('-', 0, 1), colSampler('-', 2, 2)], colKey)
  return {
    itemKey: colKey(c), answer: colResult(c), say: M3.column, instruction: M3.column, hint: c.op === '+' ? M3.columnHint : M3.borrowHint, a: c.a, b: c.b, op: c.op,
  }
}

/**
 * An equation with `=` and one blank: `? = 2300 + 400`, `5000 = 4600 + ?`, `4900 − ? = 2600`. The number side is on the left
 * about 70% of the time (children read `=` as "the answer comes next"). Numbers are whole tens, often whole hundreds.
 * Key: the equation without spaces, minus as '-', blank as '?' — e.g. `mleft:5000=4600+?`, `mleft:2300-400=?`.
 * The blank is '?' (as in grade 2), because the pad's own answer box shows '?'.
 */
interface Eq { total: number; first: number; second: number; op: '+' | '-'; blank: 'total' | 'first' | 'second'; totalLeft: boolean }
const eqText = (e: Eq, minus: string) => {
  const cell = (k: Eq['blank'], v: number) => (e.blank === k ? '?' : str(v))
  const sum = `${cell('first', e.first)} ${e.op === '+' ? PLUS : minus} ${cell('second', e.second)}`
  return e.totalLeft ? `${cell('total', e.total)} = ${sum}` : `${sum} = ${cell('total', e.total)}`
}
const eqKey = (e: Eq) => `mleft:${eqText(e, '-').replace(/ /g, '')}`
const eqAnswer = (e: Eq) => (e.blank === 'total' ? e.total : e.blank === 'first' ? e.first : e.second)
/** Reads a key back into a full equation (the blank's value filled in), or null when it isn't a true equation of this game. */
function parseEq(key: string): Eq | null {
  const m = /^mleft:(?:(\d+|\?)=(\d+|\?)([+-])(\d+|\?)|(\d+|\?)([+-])(\d+|\?)=(\d+|\?))$/.exec(key)
  if (!m) return null
  const totalLeft = m[1] !== undefined
  const cells = totalLeft ? [m[1]!, m[2]!, m[4]!] : [m[8]!, m[5]!, m[7]!]
  const op = (totalLeft ? m[3] : m[6]) as Eq['op']
  const blank = (['total', 'first', 'second'] as const)[cells.indexOf('?')]
  if (!blank || cells.filter(c => c === '?').length !== 1 || cells.some(c => c !== '?' && (Number(c) % 10 !== 0 || Number(c) > 10000))) return null
  const [total, first, second] = cells.map(c => (c === '?' ? 0 : Number(c))) as [number, number, number]
  const full: Eq = { total, first, second, op, blank, totalLeft }
  if (blank === 'total') full.total = op === '+' ? first + second : first - second
  else if (blank === 'first') full.first = op === '+' ? total - second : total + second
  else full.second = op === '+' ? total - first : first - total
  const inRange = [full.total, full.first, full.second].every(v => v > 0 && v <= 10000)
  return inRange && (op === '+' ? full.first + full.second === full.total : full.first - full.second === full.total) ? full : null
}
export const missingLeftAccepts = (key: string) => parseEq(key) !== null

function eqSampler(rng: Rng): Eq | null {
  const unit = rng() < 0.7 ? 100 : 10
  const op = rng() < 0.55 ? '+' : '-'
  const first = unit * randInt(rng, op === '+' ? 2 : 3, Math.floor((op === '+' ? 9000 : 10000) / unit))
  const second = op === '+' ? unit * randInt(rng, 1, Math.floor((10000 - first) / unit)) : unit * randInt(rng, 1, first / unit - 1)
  const total = op === '+' ? first + second : first - second
  if (total > 10000 || total <= 0 || second <= 0) return null
  const r = rng()
  return { total, first, second, op, blank: r < 0.45 ? 'total' : r < 0.7 ? 'first' : 'second', totalLeft: rng() < 0.7 }
}

export function missingLeftQuestion(ctx: GenContext): PadQ {
  const e = sample(ctx, parseEq, [eqSampler], eqKey)
  return { itemKey: eqKey(e), answer: eqAnswer(e), say: M.missing, instruction: M.missing, maxDigits: 5, prompt: { expr: eqText(e, MINUS) } }
}

interface Est { a: number; b: number; op: '+' | '-' }
const estKey = (e: Est) => `est10k:${e.a}${e.op}${e.b}`
const estResult = (e: Est) => (e.op === '+' ? e.a + e.b : e.a - e.b)
/** Thousands next to the result and at least 150 away from it, so estimating (rounding each number) always decides. */
const estBenchmarks = (e: Est) => {
  const r = estResult(e)
  const below = Math.floor(r / 1000) * 1000
  return [below, below + 1000].filter(t => t >= 1000 && t <= 10000 && Math.abs(r - t) >= 150)
}
function parseEst(key: string): Est | null {
  const m = /^est10k:(\d+)([+-])(\d+)$/.exec(key)
  const e = m ? { a: Number(m[1]), b: Number(m[3]), op: m[2] as Est['op'] } : null
  const ok = e && e.a >= 1000 && e.a <= 9999 && e.b >= 100 && e.b <= 9999 && (e.op === '+' ? e.a + e.b <= 10000 : e.a > e.b)
  return ok && estBenchmarks(e).length ? e : null
}
export const estimateBigAccepts = (key: string) => parseEst(key) !== null

const estSampler = (op: Est['op']) => (rng: Rng): Est | null => {
  const a = 10 * randInt(rng, 100, op === '+' ? 900 : 999)
  const b = op === '+' ? 10 * randInt(rng, 10, 900) : 10 * randInt(rng, 10, Math.max(10, a / 10 - 10))
  const e: Est = { a, b, op }
  return parseEst(estKey(e)) ? e : null
}

/** "Is 2890 + 3150 more or less than 6000?" — `2890 + 3150 ? 6000`, answered with two word options (more / less). */
export function estimateBigQuestion(ctx: GenContext): PickQ {
  const e = sample(ctx, parseEst, [estSampler('+'), estSampler('-')], estKey)
  const bench = pick(ctx.rng, estBenchmarks(e))
  return {
    itemKey: estKey(e), answer: estResult(e) > bench ? 'more' : 'less', say: [M.estimate, ...numberPhrase(bench)], instruction: M.estimate,
    prompt: { expr: `${e.a} ${e.op === '+' ? PLUS : MINUS} ${e.b} ? ${bench}` },
    options: shuffle(ctx.rng, [
      { id: 'more', kind: 'sound' as const, say: M.moreThan },
      { id: 'less', kind: 'sound' as const, say: M.lessThan },
    ]),
  }
}

/* ---------- 22. the multiplication table ---------- */

/** Tables new in grade 3 (grade 2 built 2, 4, 5 and 10). */
const NEW_TABLES = [3, 6, 7, 8, 9]
interface Fact { a: number; b: number }
const FACTS_0_10: Fact[] = range(0, 10).flatMap(a => range(0, 10).map(b => ({ a, b })))
const tblKey = (f: Fact) => `tbl:${f.a}x${f.b}`
const isNew = (f: Fact) => NEW_TABLES.includes(f.a) || NEW_TABLES.includes(f.b)
const ZERO_ONE = FACTS_0_10.filter(f => f.a <= 1 || f.b <= 1)
const NEW_GROUPS: Fact[][] = [...NEW_TABLES.map(t => FACTS_0_10.filter(f => (f.a === t || f.b === t) && f.a >= 2 && f.b >= 2)), ZERO_ONE]
export const tableNewAccepts = keyIn(NEW_GROUPS.flat(), tblKey)

const factQuestion = (f: Fact): PadQ => ({
  itemKey: tblKey(f), answer: f.a * f.b, maxDigits: 3, instruction: M.solve,
  say: [M.solve, ...numberPhrase(f.a), OP.times, ...numberPhrase(f.b)], prompt: { expr: `${f.a} ${TIMES} ${f.b} = ?` },
})

/**
 * `7 × 8 = ?` on the pad: the new tables (3, 6, 7, 8, 9) in both orders, each table equally often, and the facts with 0 and 1.
 * Item keys are `tbl:AxB`, shared with grade 2, so the Leitner history carries over.
 */
export function tableNewQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, NEW_GROUPS, tblKey), tblKey, factQuestion)
}

const ARENA_FACTS = FACTS_0_10.filter(f => f.a >= 1 && f.b >= 1)
const ARENA_NEW = ARENA_FACTS.filter(isNew)
export const arenaAccepts = keyIn(ARENA_FACTS, tblKey)

/** The arena (a timed sprint): facts from the full 10×10 table, a due review fact first, then the new tables twice as often as the rest. */
export function arenaQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [ARENA_NEW, ARENA_NEW, ARENA_FACTS], tblKey), tblKey, factQuestion)
}

type FactorForm = 'left' | 'right' | 'div'
interface Factor { a: number; b: number; form: FactorForm }
const FACTOR_FORMS: FactorForm[] = ['left', 'right', 'div']
const FACTORS: Factor[] = range(2, 10).flatMap(a => range(2, 10).flatMap(b => FACTOR_FORMS.map(form => ({ a, b, form }))))
const factorExpr = ({ a, b, form }: Factor) => (form === 'left' ? `? ${TIMES} ${b} = ${a * b}` : form === 'right' ? `${a} ${TIMES} ? = ${a * b}` : `${a * b} ${DIV} ${b} = ?`)
const factorKey = (f: Factor) => `mfac:${factorExpr(f).replace(/ /g, '').replace(/×/g, 'x')}`
export const missingFactorAccepts = keyIn(FACTORS, factorKey)

/** `? × 7 = 56`, `8 × ? = 56` and `56 : 7 = ?` — × and : are inverses. The divisor is always 2–10. */
export function missingFactorQuestion(ctx: GenContext): PadQ {
  const groups = FACTOR_FORMS.map(form => FACTORS.filter(f => f.form === form))
  return make(ctx, oneGroup(ctx, groups, factorKey), factorKey, f => ({
    itemKey: factorKey(f), answer: f.form === 'right' ? f.b : f.a, maxDigits: 2, prompt: { expr: factorExpr(f) },
    instruction: f.form === 'div' ? M.solve : M.missing,
    say: f.form === 'div' ? [M.solve, ...numberPhrase(f.a * f.b), OP.div, ...numberPhrase(f.b)] : M.missing,
  }))
}

/** An array r × c, split by a column into two easy parts: pick `7 × 5 + 7 × 3` for 7 × 8. */
interface ArrayBig { rows: number; cols: number }
const ARRAYS_BIG: ArrayBig[] = range(3, 10).flatMap(rows => range(4, 10).map(cols => ({ rows, cols })))
const arrayBigKey = (g: ArrayBig) => `arrbig:${g.rows}x${g.cols}`
export const arrayBigAccepts = keyIn(ARRAYS_BIG, arrayBigKey)

export function arrayBigQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, ARRAYS_BIG, arrayBigKey, ({ rows: r, cols: c }) => {
    const first = c > 5 && ctx.rng() < 0.6 ? 5 : randInt(ctx.rng, 2, c - 2)
    const second = c - first
    const answer = `${r} ${TIMES} ${first} + ${r} ${TIMES} ${second}`
    const total = r * c
    // Each candidate carries its value, so a distractor that happens to equal the total is dropped.
    const labels = (xs: { l: string; v: number }[]) => xs.filter(x => x.v !== total).map(x => x.l)
    const wrong = take(ctx.rng, [
      labels([{ l: `${r} ${TIMES} ${first} + ${second}`, v: r * first + second }]),
      labels([
        { l: `${r} ${TIMES} ${first} + ${r} ${TIMES} ${second + 1}`, v: r * (c + 1) },
        { l: `${r} ${TIMES} ${first - 1} + ${r} ${TIMES} ${second}`, v: r * (c - 1) },
        { l: `${r} ${TIMES} ${first + 1} + ${r} ${TIMES} ${second + 1}`, v: r * (c + 2) },
      ]),
      labels([
        { l: `${r} ${TIMES} ${first} ${TIMES} ${second}`, v: r * first * second },
        { l: `${r} + ${first} ${TIMES} ${second}`, v: r + first * second },
        { l: `${r} ${TIMES} ${first} + ${r} + ${second}`, v: r * first + r + second },
      ]),
    ], 3, l => l, [answer])
    if (!wrong) return null
    return {
      itemKey: arrayBigKey({ rows: r, cols: c }), answer, say: M.whichExercise, instruction: M.whichExercise, hint: M3.splitHint,
      prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: total, layout: 'array', cols: c }] }, options: labelOptions(ctx.rng, answer, wrong),
    }
  })
}

/* ---------- 23. division with a remainder ---------- */

/** A division `n : d`; key `rem:n:d` (the left-over share game and the pick game practise the same facts). */
interface Division { n: number; d: number }
const divKey = (f: Division) => `rem:${f.n}:${f.d}`
/** Share facts with a left-over: `total = plates × each + left`, 2–6 plates, total ≤ 40 (it must fit the screen). */
const SHARE_LEFT: Division[] = range(2, 6).flatMap(d => range(2 * d + 1, 40).filter(n => n % d !== 0).map(n => ({ n, d })))
export const shareLeftAccepts = keyIn(SHARE_LEFT, divKey)

/** Share objects among plates; those that don't fit go to the left-over bowl. Answer: how many on each plate. */
export function shareLeftQuestion(ctx: GenContext, things: readonly Thing[]): ShareQ {
  return make(ctx, oneGroup(ctx, range(2, 6).map(d => SHARE_LEFT.filter(f => f.d === d)), divKey), divKey, ({ n, d }) => ({
    itemKey: divKey({ n, d }), answer: Math.floor(n / d), say: M3.shareLeft, instruction: M3.shareLeft, hint: M3.remainderHint,
    emoji: pick(ctx.rng, things).emoji, total: n, plates: d, leftover: true,
  }))
}

/** `n : d` inside the 10×10 table: divisor 2–9, quotient 2–10, remainder 1 to d − 1, dividend ≤ 99. */
const REMAINDERS: Division[] = range(2, 9).flatMap(d => range(2, 10).flatMap(q => range(1, d - 1).map(r => ({ n: d * q + r, d })).filter(f => f.n <= 99)))
export const remainderPickAccepts = keyIn(REMAINDERS, divKey)

/** "3, שְׁאֵרִית 2": an answer option of the division-with-remainder questions. */
const remainderLabel = (q: number, r: number) => `${q}, ${phrases[M3.leftover]} ${r}`
const remainderOption = (q: number, r: number): PickOption => ({
  id: remainderLabel(q, r), kind: 'text', label: remainderLabel(q, r), say: [...numberPhrase(q), M3.leftover, ...numberPhrase(r)],
})

/**
 * Four options for `n : d`: the right one, a remainder as big as the divisor or bigger ("2, and 7 is left over"), a quotient off
 * by one, and the quotient and remainder swapped. Fillers only when a kind doesn't exist; none ever equals the answer.
 */
function remainderOptions(rng: Rng, n: number, d: number): PickOption[] | null {
  const q = Math.floor(n / d)
  const r = n % d
  const pair = (x: number, y: number) => ({ q: x, r: y, label: remainderLabel(x, y) })
  const answer = pair(q, r)
  const tooBig = [pair(q - 1, r + d)]
  const offByOne = [pair(q + 1, r), pair(q - 1, r)].filter(p => p.q >= 1)
  const swapped = r === q ? [] : [pair(r, q)]
  const fillers = [pair(q, r + 1), pair(q, r + d), pair(q + 1, r + 1), pair(q - 1, r + 1)].filter(p => p.q >= 1)
  const wrong = onePerKind(rng, [tooBig, offByOne, swapped], fillers, 3, p => p.label, [answer.label])
  return wrong && shuffle(rng, [answer, ...wrong]).map(p => remainderOption(p.q, p.r))
}

/** `17 : 5 = ?` → pick "3, שְׁאֵרִית 2" from four. */
export function remainderPickQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, range(2, 9).map(d => REMAINDERS.filter(f => f.d === d)), divKey), divKey, ({ n, d }) => {
    const options = remainderOptions(ctx.rng, n, d)
    if (!options) return null
    return {
      itemKey: divKey({ n, d }), answer: remainderLabel(Math.floor(n / d), n % d), say: M3.remainder, instruction: M3.remainder, hint: M3.remainderHint,
      prompt: { expr: `${n} ${DIV} ${d} = ?` }, options,
    }
  })
}

interface Story extends Division { id: string }
const STORIES: Story[] = REMAINDER_STORIES.flatMap(t => range(2, 9).flatMap(d => range(2 * d + 1, 50).filter(n => n % d !== 0).map(n => ({ id: t.id, n, d }))))
const storyKey = (s: Story) => `remstory:${s.id}:${s.n}:${s.d}`
export const remainderStoryAccepts = keyIn(STORIES, storyKey)
const storyText = (s: Story) => REMAINDER_STORIES.find(t => t.id === s.id)!.text.split('{n}').join(str(s.n)).split('{d}').join(str(s.d))

/**
 * A short word problem (read by the browser voice, D23) with the numbers as digits: "how many full boats, how many children
 * are left?". Spoken as the story alone: the story already ends with the question, and the sentence has its own 🔊.
 */
export function remainderStoryQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, REMAINDER_STORIES.map(t => STORIES.filter(s => s.id === t.id)), storyKey), storyKey, s => {
    const options = remainderOptions(ctx.rng, s.n, s.d)
    if (!options) return null
    const text = storyText(s)
    return {
      itemKey: storyKey(s), answer: remainderLabel(Math.floor(s.n / s.d), s.n % s.d), say: raw(text), instruction: M3.remainder, hint: M3.remainderHint,
      prompt: { sentence: { text, say: raw(text) } }, options,
    }
  })
}

/* ---------- 24. divisible by 2, 5 and 10 ---------- */

type Divisor = 2 | 5 | 10
const DIVISORS: Divisor[] = [2, 5, 10]
interface Divisible { d: Divisor; n: number }
const divisibleKey = (f: Divisible) => `div${f.d}:${f.n}`
const DIVISIBLE: Divisible[][] = DIVISORS.map(d => range(12, 1000).filter(n => n % d === 0).map(n => ({ d, n })))
export const whichDividesAccepts = keyIn(DIVISIBLE.flat(), divisibleKey)

const ringDistance = (x: number, y: number) => Math.min(Math.abs(x - y), 10 - Math.abs(x - y))
/** Digits 0–9 ordered by how close they are to `digit` on the ring 0–9 (so 0 is next to 9 and 1). */
const closestDigits = (digit: number) => range(0, 9).filter(x => x !== digit).sort((x, y) => ringDistance(x, digit) - ringDistance(y, digit) || x - y)

/** Numbers in 10–1000 that do NOT divide by `d`, ending in a digit close to the answer's (52, 56 beside 55), nearest first. */
function nearMisses(n: number, d: number): number[][] {
  const tens = Math.floor(n / 10)
  const ok = (m: number) => m >= 10 && m <= 1000 && m % d !== 0 && m !== n
  const withDigits = (t: number, digits: number[]) => digits.map(x => t * 10 + x).filter(ok)
  const digits = closestDigits(n % 10)
  return [withDigits(tens, digits.slice(0, 4)), [tens - 1, tens + 1].flatMap(t => withDigits(t, digits.slice(0, 2))), withDigits(tens, digits)]
}

/** "Which number divides by 5 with nothing left?" — four numbers up to 1,000, exactly one divisible. Aid: the last digit. */
export function whichDividesQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, DIVISIBLE, divisibleKey), divisibleKey, ({ d, n }) => {
    const options = numberOptions(ctx.rng, n, 4, nearMisses(n, d))
    if (!options) return null
    return { itemKey: divisibleKey({ d, n }), answer: str(n), say: whichDivides(d), instruction: whichDivides(d), hint: M3.lastDigitHint, prompt: {}, options }
  })
}

interface SortDiv { d: Divisor; numbers: number[] }
const sortKey = (s: SortDiv) => `sortdiv:${s.d}:${[...s.numbers].sort((a, b) => a - b).join(',')}`
function parseSort(key: string): SortDiv | null {
  const m = /^sortdiv:(2|5|10):(\d+(?:,\d+){7})$/.exec(key)
  if (!m) return null
  const d = Number(m[1]) as Divisor
  const numbers = m[2]!.split(',').map(Number)
  const yes = numbers.filter(n => n % d === 0).length
  return new Set(numbers).size === 8 && numbers.every(n => n >= 10 && n <= 1000) && yes >= 2 && yes <= 6 ? { d, numbers } : null
}
export const sortDividesAccepts = (key: string) => parseSort(key) !== null

const sortSampler = (d: Divisor) => (rng: Rng): SortDiv | null => {
  const yesCount = randInt(rng, 2, 6)
  const yes = shuffle(rng, DIVISIBLE[DIVISORS.indexOf(d)]!.map(f => f.n)).slice(0, yesCount)
  const no: number[] = []
  for (let i = 0; i < 40 && no.length < 8 - yesCount; i++) {
    const m = pick(rng, yes) + pick(rng, [-3, -2, -1, 1, 2, 3, 4, 6])
    if (m >= 10 && m <= 1000 && m % d !== 0 && !yes.includes(m) && !no.includes(m)) no.push(m)
  }
  return no.length === 8 - yesCount ? { d, numbers: [...yes, ...no] } : null
}

/** Eight numbers to drag into "divides by d" or "doesn't"; 2–6 of them divide. The others lie one to a few away from dividers. */
export function sortDividesQuestion(ctx: GenContext): SortQ {
  const s = sample(ctx, parseSort, DIVISORS.map(sortSampler), sortKey)
  const items = shuffle(ctx.rng, s.numbers)
  return {
    itemKey: sortKey(s), answer: items.flatMap((n, i) => (n % s.d === 0 ? [i] : [])), say: M3.sortNumbers, instruction: M3.sortNumbers, hint: M3.lastDigitHint,
    items, yes: divisibleBy(s.d), no: M3.notDivisible,
  }
}

/* ---------- 25. multiplying and dividing by 10, 100 and 1,000 ---------- */

interface Slide { kind: 'mul' | 'div'; a: number; m: 10 | 100 | 1000 }
const SLIDE_AMOUNTS: Record<Slide['m'], number[]> = { 10: range(2, 999), 100: range(2, 100), 1000: range(2, 10) }
const SLIDE_GROUPS: Slide[][] = ([10, 100, 1000] as const).flatMap(m => (['mul', 'div'] as const).map(kind => SLIDE_AMOUNTS[m].map(a => ({ kind, a, m }))))
const slideKey = (s: Slide) => (s.kind === 'mul' ? `x10:${s.a}x${s.m}` : `x10:${s.a * s.m}:${s.m}`)
export const timesTenAccepts = keyIn(SLIDE_GROUPS.flat(), slideKey)

/** `34 × 100 = ?` and `4500 : 10 = ?` (results ≤ 10,000, no separators). The aid slides the digits in a place-value house. */
export function timesTenQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, SLIDE_GROUPS, slideKey), slideKey, s => {
    const big = s.a * s.m
    return s.kind === 'mul'
      ? { itemKey: slideKey(s), answer: big, maxDigits: 5, instruction: M.solve, say: [M.solve, ...numberPhrase(s.a), OP.times, ...numberPhrase(s.m)], hint: M3.slideHint, prompt: { expr: `${s.a} ${TIMES} ${s.m} = ?` } }
      : { itemKey: slideKey(s), answer: s.a, maxDigits: 4, instruction: M.solve, say: [M.solve, ...numberPhrase(big), OP.div, ...numberPhrase(s.m)], hint: M3.slideHint, prompt: { expr: `${big} ${DIV} ${s.m} = ?` } }
  })
}

/**
 * Whole tens and hundreds: `20 × 300` (both orders, product ≤ 10,000), `80 : 4` (a whole-ten quotient) and `600 : 3`
 * (a whole-hundred quotient). Keys `rt:20x300`, `rt:600:3`.
 */
interface RoundTime { kind: 'mul' | 'div'; a: number; b: number }
const TENS = stepped(20, 90, 10)
const HUNDREDS = stepped(200, 900, 100)
const ROUND_TIMES: RoundTime[][] = [
  TENS.flatMap(t => HUNDREDS.filter(h => t * h <= 10000).flatMap(h => [{ kind: 'mul' as const, a: t, b: h }, { kind: 'mul' as const, a: h, b: t }])),
  range(2, 9).flatMap(d => stepped(10, 90, 10).map(q => ({ kind: 'div' as const, a: d * q, b: d }))),
  range(2, 9).flatMap(d => stepped(100, 500, 100).map(q => ({ kind: 'div' as const, a: d * q, b: d }))),
]
const roundTimeKey = (r: RoundTime) => (r.kind === 'mul' ? `rt:${r.a}x${r.b}` : `rt:${r.a}:${r.b}`)
export const roundTimesAccepts = keyIn(ROUND_TIMES.flat(), roundTimeKey)

export function roundTimesQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, ROUND_TIMES, roundTimeKey), roundTimeKey, r => ({
    itemKey: roundTimeKey(r), answer: r.kind === 'mul' ? r.a * r.b : r.a / r.b, maxDigits: 5, instruction: M.solve, hint: M3.slideHint,
    say: [M.solve, ...numberPhrase(r.a), r.kind === 'mul' ? OP.times : OP.div, ...numberPhrase(r.b)],
    prompt: { expr: `${r.a} ${r.kind === 'mul' ? TIMES : DIV} ${r.b} = ?` },
  }))
}

/* ---------- 26. order of operations ---------- */

/** Exercises with two operations, as tokens ('3', '+', '4', '×', '2', or with '(' ')'), results 0–100, single-digit factors. */
interface Ops { form: string; tokens: string[] }
const OPERATORS = ['+', MINUS, TIMES, DIV]
const operatorIndexes = (tokens: readonly string[]) => tokens.flatMap((t, i) => (OPERATORS.includes(t) ? [i] : []))

/** The operator to do first: inside parentheses, else × or :, else the leftmost. Returns its index in `tokens`. */
function firstOperator(tokens: readonly string[]): number {
  const ops = operatorIndexes(tokens)
  const open = tokens.indexOf('(')
  if (open >= 0) return ops.find(i => i > open)!
  return ops.find(i => tokens[i] === TIMES || tokens[i] === DIV) ?? ops[0]!
}

const apply = (op: string, x: number, y: number) => (op === '+' ? x + y : op === MINUS ? x - y : op === TIMES ? x * y : x / y)

/** A two-operation exercise with its left or right operator done first (parentheses are ignored). */
function evalTwo(tokens: readonly string[], first: 'left' | 'right'): number {
  const flat = tokens.filter(t => t !== '(' && t !== ')')
  const [n0, o1, n1, o2, n2] = [Number(flat[0]), flat[1]!, Number(flat[2]), flat[3]!, Number(flat[4])]
  return first === 'left' ? apply(o2, apply(o1, n0, n1), n2) : apply(o1, n0, apply(o2, n1, n2))
}

/** The right value: the operator `firstOperator` names goes first. */
const evalOps = (tokens: readonly string[]) => evalTwo(tokens, firstOperator(tokens) === operatorIndexes(tokens)[0] ? 'left' : 'right')

const OPS_ITEMS: Ops[] = (() => {
  const out: Ops[] = []
  const add = (form: string, tokens: string[]) => {
    const v = evalOps(tokens)
    if (Number.isInteger(v) && v >= 0 && v <= 100) out.push({ form, tokens })
  }
  for (const x of range(2, 9))
    for (const b of range(2, 9))
      for (const c of range(2, 9)) {
        add('add-mul', [str(x), '+', str(b), TIMES, str(c)])
        add('add-mul', [str(x), MINUS, str(b), TIMES, str(c)])
        add('mul-add', [str(b), TIMES, str(c), '+', str(x)])
        add('mul-add', [str(b), TIMES, str(c), MINUS, str(x)])
        add('parens', ['(', str(x), '+', str(b), ')', TIMES, str(c)])
        add('parens', [str(c), TIMES, '(', str(x), '+', str(b), ')'])
        if (x > b) add('parens', ['(', str(x), MINUS, str(b), ')', TIMES, str(c)])
        if (x > b) add('parens', [str(c), TIMES, '(', str(x), MINUS, str(b), ')'])
        // Division: the dividend is b × c, so it divides evenly.
        add('div', [str(x), '+', str(b * c), DIV, str(c)])
        add('div', [str(b * c), DIV, str(c), '+', str(x)])
      }
  return out
})()
const OPS_GROUPS = ['add-mul', 'mul-add', 'parens', 'div'].map(f => OPS_ITEMS.filter(o => o.form === f))
const opsKey = (prefix: string) => (o: Ops) => `${prefix}:${o.tokens.join('').replace(/×/g, 'x').replace(/−/g, '-')}`
const opsText = (tokens: readonly string[]) => tokens.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')')
export const firstStepAccepts = keyIn(OPS_ITEMS, opsKey('ops'))
export const resultAccepts = keyIn(OPS_ITEMS, opsKey('opsr'))

/** `3 + 4 × 2`, tap the operation to do first (answer = the operator's index in `tokens`). */
export function firstStepQuestion(ctx: GenContext): FirstStepQ {
  const key = opsKey('ops')
  return make(ctx, oneGroup(ctx, OPS_GROUPS, key), key, o => ({
    itemKey: key(o), answer: firstOperator(o.tokens), say: M3.firstStep, instruction: M3.firstStep, hint: M3.opsHint, tokens: o.tokens,
  }))
}

/**
 * The same exercises, pick the result of four. Distractors: the other operation done first — which is the left-to-right result
 * for `3 + 4 × 2` and the "parentheses ignored" result for `(3 + 4) × 2` — then numbers close to the answer.
 */
export function resultQuestion(ctx: GenContext): PickQ {
  const key = opsKey('opsr')
  return make(ctx, oneGroup(ctx, OPS_GROUPS, key), key, o => {
    const answer = evalOps(o.tokens)
    const wrongOrder = evalTwo(o.tokens, firstOperator(o.tokens) === operatorIndexes(o.tokens)[0] ? 'right' : 'left')
    const tiers = [[wrongOrder], [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10]].map(t => t.filter(v => Number.isInteger(v) && v >= 0 && v !== answer))
    const options = numberOptions(ctx.rng, answer, 4, tiers)
    if (!options) return null
    return { itemKey: key(o), answer: str(answer), say: M.solve, instruction: M.solve, hint: M3.opsHint, prompt: { expr: `${opsText(o.tokens)} = ?` }, options }
  })
}

/* ---------- 27. angles and triangles ---------- */

const ANGLE_KINDS: AngleKind[] = ['acute', 'right', 'obtuse', 'straight']
interface AngleItem { kind: AngleKind; deg: number }
const ANGLE_DEGREES: Record<AngleKind, number[]> = { acute: stepped(20, 70, 5), right: [90], obtuse: stepped(110, 160, 5), straight: [180] }
const ANGLE_GROUPS: AngleItem[][] = ANGLE_KINDS.map(kind => ANGLE_DEGREES[kind].map(deg => ({ kind, deg })))
const angleKey = (a: AngleItem) => (ANGLE_DEGREES[a.kind].length === 1 ? `angle:${a.kind}` : `angle:${a.kind}:${a.deg}`)
export const angleTypeAccepts = keyIn(ANGLE_GROUPS.flat(), angleKey)

/**
 * A drawn angle (random rotation and arm lengths). Children judge an angle by the length of its arms [G3 p.14], so half the acute
 * angles get long arms and half the obtuse ones short arms. Bands: acute 20–70°, right 90°, obtuse 110–160°, straight 180°.
 */
export function angleTypeQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, ANGLE_GROUPS, angleKey), angleKey, ({ kind, deg }) => {
    const len = (lo: number, hi: number) => Math.round((lo + ctx.rng() * (hi - lo)) * 100) / 100
    const odd = ctx.rng() < 0.5
    const [lo, hi] = kind === 'acute' && odd ? [0.8, 1] : kind === 'obtuse' && odd ? [0.35, 0.5] : [0.35, 1]
    const props = { deg, rot: randInt(ctx.rng, 0, 359), armA: len(lo, hi), armB: len(lo, hi) }
    return {
      itemKey: angleKey({ kind, deg }), answer: kind, say: M3.angleType, instruction: M3.angleType, hint: M3.angleHint,
      prompt: { art: [{ name: MATH_ART.angle, props }], artSize: 200 }, aidArt: [{ name: MATH_ART.angle, props: { ...props, corner: true } }],
      options: ANGLE_KINDS.map(k => ({ id: k, kind: 'text' as const, label: phrases[angleName(k)]!, say: angleName(k) })),
    }
  })
}

/** The three angles of a triangle in degrees; the art takes two base angles, the third is 180 − a − b. */
type Triple = [number, number, number]
/** Every angle 35–80°, so it is clearly acute. */
function acuteTriple(rng: Rng): Triple {
  for (;;) {
    const a = randInt(rng, 35, 80)
    const b = randInt(rng, 35, 80)
    const c = 180 - a - b
    if (c >= 35 && c <= 80) return [a, b, c]
  }
}
/** One angle exactly 90°. */
function rightTriple(rng: Rng): Triple {
  const x = randInt(rng, 25, 65)
  return shuffle(rng, [90, x, 90 - x]) as Triple
}
/** One angle 105–140°, the others at least 15°. */
function obtuseTriple(rng: Rng): Triple {
  const big = randInt(rng, 105, 140)
  const x = randInt(rng, 15, 165 - big)
  return shuffle(rng, [big, x, 180 - big - x]) as Triple
}
const BY_ANGLES: Record<TriangleByAngles, (rng: Rng) => Triple> = { acute: acuteTriple, right: rightTriple, obtuse: obtuseTriple }

/** Two equal angles, never 60 (that is equilateral) and never 45 (that is a right triangle), so only the sides tell it apart. */
function isoscelesTriple(rng: Rng): Triple {
  const x = pick(rng, range(35, 80).filter(v => v !== 60 && v !== 45))
  return shuffle(rng, [x, x, 180 - 2 * x]) as Triple
}
/** Three different angles, none 90°. */
function scaleneTriple(rng: Rng): Triple {
  for (;;) {
    const a = randInt(rng, 30, 100)
    const b = randInt(rng, 30, 100)
    const c = 180 - a - b
    if (c >= 25 && new Set([a, b, c]).size === 3 && ![a, b, c].includes(90)) return [a, b, c]
  }
}
const BY_SIDES: Record<TriangleBySides, (rng: Rng) => Triple> = { equilateral: () => [60, 60, 60], isosceles: isoscelesTriple, scalene: scaleneTriple }

function triangleOptions<K extends string>(rng: Rng, kinds: readonly K[], triple: Record<K, (rng: Rng) => Triple>, ticks: boolean): PickOption[] {
  return shuffle(rng, kinds).map(k => {
    const [a, b] = triple[k](rng)
    return { id: k, kind: 'art' as const, art: { name: MATH_ART.triangle, props: { a, b, rot: randInt(rng, 0, 359), ...(ticks ? { ticks: true } : {}) } } }
  })
}

const ANGLE_TRIANGLES: TriangleByAngles[] = ['acute', 'right', 'obtuse']
const SIDE_TRIANGLES: TriangleBySides[] = ['equilateral', 'isosceles', 'scalene']
const triKey = (k: string) => `tri:${k}`
const sideKey = (k: string) => `side:${k}`
export const triangleAnglesAccepts = keyIn(ANGLE_TRIANGLES, triKey)
export const triangleSidesAccepts = keyIn(SIDE_TRIANGLES, sideKey)

/** "Which triangle is right-angled?" — three drawings, one acute, one right and one obtuse; pick the one asked for. */
export function triangleAnglesQuestion(ctx: GenContext): PickQ {
  return make(ctx, ANGLE_TRIANGLES, triKey, kind => ({
    itemKey: triKey(kind), answer: kind, say: findTriangle(kind), instruction: findTriangle(kind), hint: M3.triangleHint, prompt: {},
    options: triangleOptions(ctx.rng, ANGLE_TRIANGLES, BY_ANGLES, false),
  }))
}

/** "Which triangle is isosceles?" — tick marks show the equal sides; one equilateral, one isosceles, one scalene. */
export function triangleSidesQuestion(ctx: GenContext): PickQ {
  return make(ctx, SIDE_TRIANGLES, sideKey, kind => ({
    itemKey: sideKey(kind), answer: kind, say: findTriangle(kind), instruction: findTriangle(kind), hint: M3.sidesHint, prompt: {},
    options: triangleOptions(ctx.rng, SIDE_TRIANGLES, BY_SIDES, true),
  }))
}

/* ---------- 28. area ---------- */

/** An L: a bottom block w × h and a block w2 × h2 above its left end (w2 < w); mirrored at random when drawn. Fits 10 × 8. */
interface LShape { w: number; h: number; w2: number; h2: number }
const areaKey = (w: number, h: number) => `area:${w}x${h}`
const lKey = (l: LShape) => `areaL:${l.w}x${l.h}+${l.w2}x${l.h2}`
const RECTS_COUNT = range(2, 10).flatMap(w => range(2, 8).map(h => ({ w, h })))
const RECTS_SIDES = range(2, 10).flatMap(w => range(2, 10).map(h => ({ w, h })))
const L_SHAPES: LShape[] = range(3, 10).flatMap(w => range(2, 6).flatMap(h => range(1, w - 1).flatMap(w2 => range(1, 8 - h).map(h2 => ({ w, h, w2, h2 })))))
const isRectCount = keyIn(RECTS_COUNT, r => areaKey(r.w, r.h))
const isLShape = keyIn(L_SHAPES, lKey)
export const countSquaresAccepts = (key: string) => isRectCount(key) || isLShape(key)
export const lengthWidthAccepts = keyIn(RECTS_SIDES, r => areaKey(r.w, r.h))

const rectQuestion = (itemKey: string, w: number, h: number, mode: GridAreaQ['mode'], instruction: string): GridAreaQ => ({
  itemKey, answer: w * h, say: instruction, instruction, hint: M3.areaHint, cols: w, rows: h, rects: [[0, 0, w, h]], mode,
})

/** Count the squares of a rectangle (2–10 by 2–8) or of an L made of two rectangles; answer = the area. */
export function countSquaresQuestion(ctx: GenContext): GridAreaQ {
  type Shape = { rect: { w: number; h: number } } | { l: LShape }
  const shapes: Shape[] = [...RECTS_COUNT.map(rect => ({ rect })), ...L_SHAPES.map(l => ({ l }))]
  const key = (x: Shape) => ('rect' in x ? areaKey(x.rect.w, x.rect.h) : lKey(x.l))
  return make(ctx, oneGroup(ctx, [shapes.filter(x => 'rect' in x), shapes.filter(x => 'l' in x)], key), key, x => {
    if ('rect' in x) return rectQuestion(key(x), x.rect.w, x.rect.h, 'count', M3.countSquares)
    const { w, h, w2, h2 } = x.l
    const rows = h + h2
    const flipX = ctx.rng() < 0.5
    const flipY = ctx.rng() < 0.5
    const place = (c: number, r: number, rw: number, rh: number): CellRect => [flipX ? w - c - rw : c, flipY ? rows - r - rh : r, rw, rh]
    return {
      itemKey: key(x), answer: w * h + w2 * h2, say: M3.countSquares, instruction: M3.countSquares, hint: M3.areaHint, cols: w, rows,
      rects: [place(0, h2, w, h), place(0, 0, w2, h2)], mode: 'count',
    }
  })
}

/** A rectangle of up to 10 × 10 with only its side lengths written; the squares appear with the aid. Answer: the area (cm²). */
export function lengthWidthQuestion(ctx: GenContext): GridAreaQ {
  return make(ctx, RECTS_SIDES, r => areaKey(r.w, r.h), r => rectQuestion(areaKey(r.w, r.h), r.w, r.h, 'sides', M3.area))
}
