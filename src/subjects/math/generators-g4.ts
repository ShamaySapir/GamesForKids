import { raw } from '../../core/audio/audio'
import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { ArtRef, PickOption, PickQ } from '../../ui/pick/types'
import { SENSIBLE_LENGTHS } from './content/lengths'
import { ROUND_UP_STORIES } from './content/round-up'
import {
  M, M3, M4, OP, UNIT_LABEL, digitValue, divisibleBy, findLines, quadName, quadQuestion, roundTo, sensiblePhrase, whichDivides,
} from './ids'
import { fmt, fractionText, numberPhrase, spokenNumber } from './numbers'
import { phrases } from './phrases'
import {
  MATH_ART_4, type AreaModelQ, type CellRect, type ColumnQ, type FirstStepQ, type Fraction, type FractionPadQ, type GridAreaQ, type LengthUnit,
  type PadQ, type PlaceQ, type QuadKind, type ShadeQ, type SortQ, type Thing,
} from './types'

// Pure question generators for the numbers island, 4th grade (skills 29–41), one per game. Spec: docs/specs/math-grade4.md.
// Same style as generators-g3.ts (its helpers are private there, so the few needed are copied here).
// Numbers shown to the child go through fmt() (commas from five digits); spoken numbers through spokenNumber().
// Fractions in prompts and options are written 'a/b' (mixed '2 3/4'); the shared MathText stacks them.
//
// Item keys (short, unique per game; each game's Accepts function recognises only its own):
//   29  dv:N:D            digit D (once in N) in N          cmp6:A:B         compare two numbers
//       line1m:N          marker on 0–1,000,000             rb:N:PLACE       round N to PLACE
//   30  colb:A+B / colb:A-B                                 comp:A:B:r|l     4000 − 2397 = 3999 − ?  (r: blank right, l: blank left)
//       estm:A+B / estm:A-B
//   31  rt2:AxB           am:AxB            ld:A:B:R         can A × B be R?
//   32  split:N:D         dp:N:D (whole)    dr:N:D (remainder)               bus:STORY:N:D
//   33  div369:D:N        sort369:D:n1,…,n8
//   34  ops2:12-6:2+1 (first step, 'x' for ×)               ops2r:… (result)
//   35  fracname:SHAPE:PARTS:SHADED                         shade:SHAPE:PARTS:SHADED          partof:NUM:DEN:TOTAL
//   36  fline:NUM:DEN     fcmp:A:B:C:D  (A/B ? C/D; 1 is 1:1)
//   37  fl:A:C:D:p|m      fr:A:P:+|-:C:Q    fw:K:A:D
//   38  lines:KIND        diag:SIDES
//   39  nq:KIND           quadp:KIND
//   40  conv:BIG:SMALL:N:d|u                                sens:ID
//   41  box:A:B:C         (sorted, 1–4)

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

/** For item spaces too big to list: the review item when `parse` accepts its key, else one draw from a random sampler. */
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

/** Games with several kinds of items ask each kind equally often. */
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

/** n distinct items: one from each kind first, then the rest from `fillers`. */
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
const keyIn = <T>(items: readonly T[], key: (t: T) => string) => {
  const keys = new Set(items.map(key))
  return (k: string) => keys.has(k)
}
const str = String
const digitsOf = (n: number) => str(n).split('').map(Number)

const PLUS = '+'
const MINUS = '−'
const TIMES = '×'
const DIV = ':'

const numOption = (v: number): PickOption => ({ id: str(v), kind: 'number', label: fmt(v), say: spokenNumber(v) })

/** The answer plus n−1 wrong numbers drawn tier by tier, shuffled; every number has a 🔊 reading it. */
function numberOptions(rng: Rng, answer: number, n: number, tiers: readonly (readonly number[])[]): PickOption[] | null {
  const wrong = take(rng, tiers, n - 1, str, [str(answer)])
  if (!wrong) return null
  return shuffle(rng, [answer, ...wrong]).map(numOption)
}

/** Text options (exercises, splits): the answer plus distractors; ids are the labels. */
function labelOptions(rng: Rng, answer: string, wrong: readonly string[]): PickOption[] {
  return shuffle(rng, [answer, ...wrong]).map(l => ({ id: l, kind: 'number' as const, label: l }))
}

const SIGNS = ['<', '=', '>'] as const
type Sign = (typeof SIGNS)[number]
const SIGN_SAY: Readonly<Record<Sign, string>> = { '<': OP.less, '=': OP.equals, '>': OP.greater }
const signOf = (a: number, b: number): Sign => (a < b ? '<' : a > b ? '>' : '=')
const signOptions = (): PickOption[] => SIGNS.map(s => ({ id: s, kind: 'number' as const, label: s, say: SIGN_SAY[s] }))

const roundOf = (n: number, place: number) => {
  const r = n % place
  return r * 2 >= place ? n - r + place : n - r
}

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

/* ---------- 29. numbers to a million ---------- */

interface DigitItem { n: number; d: number }
const dvKey = (x: DigitItem) => `dv:${x.n}:${x.d}`
function parseDv(key: string): DigitItem | null {
  const m = /^dv:([1-9]\d{4,5}):([1-9])$/.exec(key)
  if (!m) return null
  const n = Number(m[1])
  const d = Number(m[2])
  return digitsOf(n).filter(x => x === d).length === 1 ? { n, d } : null
}
export const digitValueAccepts = (key: string) => parseDv(key) !== null

const dvSampler = (digits: 5 | 6) => (rng: Rng): DigitItem | null => {
  const n = randInt(rng, 10 ** (digits - 1), 10 ** digits - 1)
  const ds = digitsOf(n)
  const unique = ds.filter(d => d > 0 && ds.filter(x => x === d).length === 1)
  return unique.length ? { n, d: pick(rng, unique) } : null
}

/** "What is the 7 worth in 372,450?" → four place values of that digit (70,000 · 7,000 · 700 · 70), one is right. */
export function digitValueQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseDv, [dvSampler(5), dvSampler(6)], dvKey)
  const text = str(x.n)
  const k = text.length - 1 - text.indexOf(str(x.d))
  const start = pick(ctx.rng, range(Math.max(0, k - 3), Math.min(2, k)))
  const values = range(start, start + 3).map(j => x.d * 10 ** j)
  return {
    itemKey: dvKey(x), answer: str(x.d * 10 ** k), say: [digitValue(x.d)], instruction: digitValue(x.d), prompt: { expr: fmt(x.n) },
    options: shuffle(ctx.rng, values).map(numOption),
  }
}

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
const cmpKey = (p: Pair) => `cmp6:${p.a}:${p.b}`
function parseCmp(key: string): Pair | null {
  const m = /^cmp6:([1-9]\d{4,5}):([1-9]\d{4,5})$/.exec(key)
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  const { swaps, changes } = partners(a)
  const [lo, hi] = [Math.min(a, b), Math.max(a, b)]
  const boundary = lo >= 90000 && lo <= 99999 && hi >= 100000 && hi <= 109999
  return a === b || (str(a).length === str(b).length && (swaps.includes(b) || changes.includes(b))) || boundary ? { a, b } : null
}
export const compare6Accepts = (key: string) => parseCmp(key) !== null

const cmpNumber = (rng: Rng) => randInt(rng, 10000, 999999)

/**
 * `372,450 ? 372,540` → <, = or > (always in this order). The pair differs in one place or by a swap, is sometimes equal,
 * and sometimes has different lengths (99,999 vs 100,000).
 */
export function compare6Question(ctx: GenContext): PickQ {
  const p = sample(ctx, parseCmp, [
    rng => { const a = cmpNumber(rng); return { a, b: a } },
    rng => { const a = cmpNumber(rng); const { swaps } = partners(a); return swaps.length ? { a, b: pick(rng, swaps) } : null },
    rng => { const a = cmpNumber(rng); return { a, b: pick(rng, partners(a).changes) } },
    rng => { const a = cmpNumber(rng); return { a, b: pick(rng, partners(a).changes) } },
    rng => { const x = randInt(rng, 90000, 99999); const y = randInt(rng, 100000, 109999); return rng() < 0.5 ? { a: x, b: y } : { a: y, b: x } },
  ], cmpKey)
  return {
    itemKey: cmpKey(p), answer: signOf(p.a, p.b), say: M.compare, instruction: M.compare, prompt: { expr: `${fmt(p.a)} ? ${fmt(p.b)}` }, options: signOptions(),
  }
}

/** Marker on 0–1,000,000, ticks every 100,000. Targets are multiples of 10,000, correct within ±25,000. */
const LINE_MILLION = stepped(10000, 990000, 10000)
const lineMKey = (n: number) => `line1m:${n}`
export const lineMillionAccepts = keyIn(LINE_MILLION, lineMKey)

export function lineMillionQuestion(ctx: GenContext): PlaceQ {
  return make(ctx, oneGroup(ctx, [LINE_MILLION.filter(n => n % 100000 === 0), LINE_MILLION.filter(n => n % 100000 !== 0)], lineMKey), lineMKey, n => ({
    itemKey: lineMKey(n), answer: n, say: [M.place, ...spokenNumber(n)], instruction: M.place, target: n,
    line: { min: 0, max: 1000000, step: 100000, labelEvery: 200000, snap: 10000 }, tolerance: 25000,
  }))
}

type BigPlace = 1000 | 10000 | 100000
const BIG_PLACES: BigPlace[] = [1000, 10000, 100000]
interface Near { n: number; place: BigPlace }
const rbKey = (f: Near) => `rb:${f.n}:${f.place}`
function parseRb(key: string): Near | null {
  const m = /^rb:([1-9]\d{4,5}):(1000|10000|100000)$/.exec(key)
  if (!m) return null
  const n = Number(m[1])
  const place = Number(m[2]) as BigPlace
  return n % place !== 0 && n >= (place === 100000 ? 50000 : 10001) ? { n, place } : null
}
export const roundBigAccepts = (key: string) => parseRb(key) !== null

const rbSampler = (place: BigPlace, half: boolean) => (rng: Rng): Near | null => {
  const lo = place === 100000 ? 50000 : 10001
  if (!half) return { n: randInt(rng, lo, 999999), place }
  const n = place * randInt(rng, Math.ceil((lo - place / 2) / place), Math.floor((999999 - place / 2) / place)) + place / 2
  return n >= lo ? { n, place } : null
}

/** "Round 372,450 to the nearest ten-thousand" → four numbers; the distractors are the wrong direction and the wrong place. */
export function roundBigQuestion(ctx: GenContext): PickQ {
  const samplers = [...BIG_PLACES.map(p => rbSampler(p, false)), ...BIG_PLACES.map(p => rbSampler(p, true))]
  for (let attempt = 0; ; attempt++) {
    const { n, place } = sample(ctx, parseRb, samplers, rbKey)
    const answer = roundOf(n, place)
    const down = n - (n % place)
    const wrongWay = answer === down ? down + place : down
    const wrongPlace = BIG_PLACES.filter(p => p !== place).flatMap(p => [roundOf(n, p), n - (n % p)])
    const valid = (vs: number[]) => vs.filter(v => v > 0 && v <= 1000000 && v !== answer)
    const options = numberOptions(ctx.rng, answer, 4, [valid([wrongWay]), valid(wrongPlace), valid([answer + place, answer - place, answer + 2 * place])])
    if (options || attempt > 20)
      return {
        itemKey: rbKey({ n, place }), answer: str(answer), say: [roundTo(place), ...spokenNumber(n)], instruction: roundTo(place), hint: M3.roundHint,
        prompt: { expr: fmt(n) }, options: options ?? [],
      }
  }
}

/* ---------- 30. adding and subtracting to a million ---------- */

interface Col { a: number; b: number; op: '+' | '-' }
const colKey = (c: Col) => `colb:${c.a}${c.op}${c.b}`
const colResult = (c: Col) => (c.op === '+' ? c.a + c.b : c.a - c.b)
/** Up to six digits, results within 1,000,000, one operand of five or more digits, at most three carries; a subtraction has a > b. */
function validCol(c: Col): boolean {
  const ok = c.a >= 1000 && c.b >= 1000 && c.a <= 999999 && c.b <= 999999 && Math.max(c.a, c.b) >= 10000 && carries(c.a, c.b, c.op) <= 3
  return ok && (c.op === '+' ? c.a + c.b <= 1000000 : c.a > c.b && c.a >= 10000)
}
function parseCol(key: string): Col | null {
  const m = /^colb:([1-9]\d*)([+-])([1-9]\d*)$/.exec(key)
  const c = m ? { a: Number(m[1]), b: Number(m[3]), op: m[2] as Col['op'] } : null
  return c && validCol(c) ? c : null
}
export const columnBigAccepts = (key: string) => parseCol(key) !== null

const colSampler = (op: Col['op'], min: number, max: number) => (rng: Rng): Col | null => {
  for (let i = 0; i < 400; i++) {
    const big = randInt(rng, 10000, 10 ** randInt(rng, 5, 6) - 1)
    const other = randInt(rng, 1000, 10 ** randInt(rng, 4, 6) - 1)
    const c: Col = op === '+' ? (rng() < 0.5 ? { a: big, b: other, op } : { a: other, b: big, op }) : { a: big, b: Math.min(other, big - 1), op }
    const k = carries(c.a, c.b, op)
    if (validCol(c) && k >= min && k <= max) return c
  }
  return null
}

/** `238,400 + 415,900` in columns, up to six digits; add and subtract, each with 0–1 or 2–3 carries/borrows, equally often. */
export function columnBigQuestion(ctx: GenContext): ColumnQ {
  const c = sample(ctx, parseCol, [colSampler('+', 0, 1), colSampler('+', 2, 3), colSampler('-', 0, 1), colSampler('-', 2, 3)], colKey)
  return {
    itemKey: colKey(c), answer: colResult(c), say: M3.column, instruction: M3.column, hint: c.op === '+' ? M3.columnHint : M3.borrowHint, a: c.a, b: c.b, op: c.op,
  }
}

/** `4000 − 2397 = 3999 − ?` (blank on the right: b − 1) or `= ? − 2396` (blank on the left: a − 1). a is a whole thousand. */
interface Comp { a: number; b: number; side: 'r' | 'l' }
const compKey = (c: Comp) => `comp:${c.a}:${c.b}:${c.side}`
function parseComp(key: string): Comp | null {
  const m = /^comp:([1-9]\d*):([1-9]\d*):([rl])$/.exec(key)
  if (!m) return null
  const [a, b] = [Number(m[1]), Number(m[2])]
  return a % 1000 === 0 && a >= 2000 && a <= 1000000 && b >= 1000 && b < a && b % 10 !== 0 ? { a, b, side: m[3] as Comp['side'] } : null
}
export const compensateAccepts = (key: string) => parseComp(key) !== null

const compSampler = (side: Comp['side']) => (rng: Rng): Comp | null => {
  const unit = pick(rng, [1000, 1000, 10000, 100000])
  const a = unit * randInt(rng, Math.ceil(2000 / unit), Math.floor(1000000 / unit))
  const b = randInt(rng, Math.max(1000, Math.ceil(a * 0.2)), a - 1)
  return b % 10 === 0 ? null : { a, b, side }
}

export function compensateQuestion(ctx: GenContext): PadQ {
  const c = sample(ctx, parseComp, [compSampler('r'), compSampler('l')], compKey)
  const left = `${fmt(c.a)} ${MINUS} ${fmt(c.b)}`
  return {
    itemKey: compKey(c), answer: c.side === 'r' ? c.b - 1 : c.a - 1, say: M.missing, instruction: M.missing, hint: M4.compensateHint, maxDigits: 6,
    prompt: { expr: c.side === 'r' ? `${left} = ${fmt(c.a - 1)} ${MINUS} ?` : `${left} = ? ${MINUS} ${fmt(c.b - 1)}` },
  }
}

interface Est { a: number; b: number; op: '+' | '-' }
const estKey = (e: Est) => `estm:${e.a}${e.op}${e.b}`
const estResult = (e: Est) => (e.op === '+' ? e.a + e.b : e.a - e.b)
/** Hundred-thousands next to the result and at least 15,000 away from it, so estimating always decides. */
const estBenchmarks = (e: Est) => {
  const r = estResult(e)
  const below = Math.floor(r / 100000) * 100000
  return [below, below + 100000].filter(t => t >= 100000 && t <= 1000000 && Math.abs(r - t) >= 15000)
}
function parseEst(key: string): Est | null {
  const m = /^estm:([1-9]\d*)([+-])([1-9]\d*)$/.exec(key)
  const e = m ? { a: Number(m[1]), b: Number(m[3]), op: m[2] as Est['op'] } : null
  const ok = e && e.a % 100 === 0 && e.b % 100 === 0 && e.a >= 10000 && e.b >= 10000 && e.a <= 990000 && (e.op === '+' ? e.a + e.b <= 1000000 : e.a > e.b)
  return ok && estBenchmarks(e).length ? e : null
}
export const estimateMillionAccepts = (key: string) => parseEst(key) !== null

const estSampler = (op: Est['op']) => (rng: Rng): Est | null => {
  const a = 100 * randInt(rng, 100, op === '+' ? 8900 : 9900)
  const b = 100 * randInt(rng, 100, op === '+' ? Math.floor((1000000 - a) / 100) : Math.floor(a / 100) - 100)
  if (b < 100 * 100) return null
  const e: Est = { a, b, op }
  return parseEst(estKey(e)) ? e : null
}

/** "Is 238,400 + 415,900 more or less than 600,000?" */
export function estimateMillionQuestion(ctx: GenContext): PickQ {
  const e = sample(ctx, parseEst, [estSampler('+'), estSampler('-')], estKey)
  const bench = pick(ctx.rng, estBenchmarks(e))
  return {
    itemKey: estKey(e), answer: estResult(e) > bench ? 'more' : 'less', say: [M.estimate, ...spokenNumber(bench)], instruction: M.estimate,
    prompt: { expr: `${fmt(e.a)} ${e.op === '+' ? PLUS : MINUS} ${fmt(e.b)} ? ${fmt(bench)}` },
    options: shuffle(ctx.rng, [
      { id: 'more', kind: 'sound' as const, say: M.moreThan },
      { id: 'less', kind: 'sound' as const, say: M.lessThan },
    ]),
  }
}

/* ---------- 31. multiplying big numbers ---------- */

interface Fac { a: number; b: number }
const HUNDREDS = stepped(100, 900, 100)
const THOUSANDS = stepped(1000, 9000, 1000)
const TENS = stepped(20, 90, 10)
const DIGITS = range(2, 9)
const both = (xs: readonly number[], ys: readonly number[]): Fac[] => xs.flatMap(a => ys.flatMap(b => [{ a, b }, { a: b, b: a }]))
const ROUND2: Fac[][] = [
  both(HUNDREDS, DIGITS),
  TENS.flatMap(a => TENS.map(b => ({ a, b }))),
  both(THOUSANDS, DIGITS),
  both(HUNDREDS, TENS),
]
const rt2Key = (f: Fac) => `rt2:${f.a}x${f.b}`
export const roundTimes2Accepts = keyIn(ROUND2.flat(), rt2Key)

/** `300 × 4`, `40 × 30`, `2,000 × 5`, `300 × 20` on the pad; results up to 100,000. */
export function roundTimes2Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, ROUND2, rt2Key), rt2Key, f => ({
    itemKey: rt2Key(f), answer: f.a * f.b, maxDigits: 5, instruction: M.solve, hint: M3.slideHint,
    say: [M.solve, ...spokenNumber(f.a), OP.times, ...spokenNumber(f.b)], prompt: { expr: `${fmt(f.a)} ${TIMES} ${fmt(f.b)} = ?` },
  }))
}

const TWO_DIGIT = range(11, 99).filter(n => n % 10 !== 0)
const THREE_DIGIT = range(101, 999).filter(n => n % 10 !== 0)
const AREA_GROUPS: Fac[][] = [
  TWO_DIGIT.flatMap(a => DIGITS.map(b => ({ a, b }))),
  TWO_DIGIT.flatMap(a => TWO_DIGIT.map(b => ({ a, b }))),
  THREE_DIGIT.flatMap(a => DIGITS.map(b => ({ a, b }))),
]
const areaKey = (f: Fac) => `am:${f.a}x${f.b}`
export const areaModelAccepts = keyIn(AREA_GROUPS.flat(), areaKey)

/** `34 × 6`, `23 × 45` or `236 × 4` as a rectangle split by place value; 2×1, 2×2 and 3×1 digits equally often. */
export function areaModelQuestion(ctx: GenContext): AreaModelQ {
  return make(ctx, oneGroup(ctx, AREA_GROUPS, areaKey), areaKey, f => ({
    itemKey: areaKey(f), answer: f.a * f.b, say: M4.areaModel, instruction: M4.areaModel, hint: M4.areaModelHint, a: f.a, b: f.b,
  }))
}

interface LastDigit { a: number; b: number; r: number }
const ldKey = (x: LastDigit) => `ld:${x.a}:${x.b}:${x.r}`
function parseLd(key: string): LastDigit | null {
  const m = /^ld:([1-9]\d*):([1-9]\d*):([1-9]\d*)$/.exec(key)
  if (!m) return null
  const [a, b, r] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const shape = (a >= 11 && a <= 99 && ((b >= 2 && b <= 9) || (b >= 11 && b <= 99))) || (a >= 100 && a <= 999 && b >= 2 && b <= 9)
  const d = Math.abs(r - a * b)
  return shape && d <= 8 ? { a, b, r } : null
}
export const lastDigitAccepts = (key: string) => parseLd(key) !== null

const ldFactors = (rng: Rng): [number, number] => {
  const a = randInt(rng, 11, 999)
  return [a, rng() < 0.7 || a >= 100 ? randInt(rng, 2, 9) : randInt(rng, 11, 99)]
}

/** "Can 76 × 5 be 456?" → yes or no. Half the results are true; the others are a few off, so the last digit is wrong but the size is right. */
export function lastDigitQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseLd, [
    rng => { const [a, b] = ldFactors(rng); return { a, b, r: a * b } },
    rng => { const [a, b] = ldFactors(rng); return { a, b, r: a * b + pick(rng, [-8, -7, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 7, 8]) } },
  ], ldKey)
  return {
    itemKey: ldKey(x), answer: x.r === x.a * x.b ? 'yes' : 'no', say: M4.canItBe, instruction: M4.canItBe, hint: M3.lastDigitHint,
    prompt: { expr: `${x.a} ${TIMES} ${x.b} = ${fmt(x.r)}` },
    options: [
      { id: 'yes', kind: 'text', label: phrases[M4.yes]!, say: M4.yes },
      { id: 'no', kind: 'text', label: phrases[M4.no]!, say: M4.no },
    ],
  }
}

/* ---------- 32. dividing by a single digit ---------- */

interface Division { n: number; d: number }
const splitKey = (f: Division) => `split:${f.n}:${f.d}`
/** n = d × q with q between 11 and 99 and not a whole ten, so that n = (d × tens) + (d × ones). */
const SPLITS: Division[][] = range(2, 9).map(d => range(11, 99).filter(q => q % 10 !== 0).map(q => ({ n: d * q, d })))
export const splitDivideAccepts = keyIn(SPLITS.flat(), splitKey)

/** `84 : 4` → pick the helpful split (`80 : 4 + 4 : 4`: both parts divide) from three; the others split into parts that don't. */
export function splitDivideQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, SPLITS, splitKey), splitKey, ({ n, d }) => {
    const q = n / d
    const x = d * (q - (q % 10))
    const text = (p: number) => `${p} ${DIV} ${d} + ${n - p} ${DIV} ${d}`
    const answer = text(x)
    const bad = (ps: number[]) => ps.filter(p => p > 0 && p < n && p % d !== 0).map(text)
    const wrong = take(ctx.rng, [
      bad([x - 10, x + 10, x - 20].filter(p => p % 10 === 0)),
      bad([x + 1, x - 1, x + 2, x - 2, x + 5, x - 5, x + 3, x - 3]),
    ], 2, l => l, [answer])
    if (!wrong) return null
    return {
      itemKey: splitKey({ n, d }), answer, say: [M4.helpfulSplit, ...numberPhrase(n), OP.div, ...numberPhrase(d)], instruction: M4.helpfulSplit, hint: M4.splitDivideHint,
      prompt: { expr: `${n} ${DIV} ${d} = ?` }, options: labelOptions(ctx.rng, answer, wrong),
    }
  })
}

const dpKey = (f: Division) => `dp:${f.n}:${f.d}`
const DIVIDE_PAD: Division[][] = range(2, 9).map(d => range(10, Math.floor(999 / d)).map(q => ({ n: d * q, d })))
export const dividePadAccepts = keyIn(DIVIDE_PAD.flat(), dpKey)

/** `156 : 6 = ?` on the pad: a two- or three-digit dividend, a single-digit divisor, a whole quotient of 10 or more. Never divides by 0. */
export function dividePadQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, DIVIDE_PAD, dpKey), dpKey, ({ n, d }) => ({
    itemKey: dpKey({ n, d }), answer: n / d, maxDigits: 3, instruction: M.solve, hint: M4.splitDivideHint,
    say: [M.solve, ...numberPhrase(n), OP.div, ...numberPhrase(d)], prompt: { expr: `${n} ${DIV} ${d} = ?` },
  }))
}

const drKey = (f: Division) => `dr:${f.n}:${f.d}`
const DIVIDE_REM: Division[][] = range(2, 9).map(d => range(10 * d + 1, 999).filter(n => n % d !== 0).map(n => ({ n, d })))
export const divideRemainderAccepts = keyIn(DIVIDE_REM.flat(), drKey)

/** "3, שְׁאֵרִית 2": an answer option of the division-with-remainder questions (the grade 3 form). */
const remainderLabel = (q: number, r: number) => `${q}, ${phrases[M3.leftover]} ${r}`
const remainderOption = (q: number, r: number): PickOption => ({
  id: remainderLabel(q, r), kind: 'text', label: remainderLabel(q, r), say: [...numberPhrase(q), M3.leftover, ...numberPhrase(r)],
})

/** The right option, a remainder as big as the divisor or bigger, a quotient off by one, and quotient and remainder swapped. */
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

/** `157 : 6 = ?` → pick "26, שְׁאֵרִית 1" from four. */
export function divideRemainderQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, DIVIDE_REM, drKey), drKey, ({ n, d }) => {
    const options = remainderOptions(ctx.rng, n, d)
    if (!options) return null
    return {
      itemKey: drKey({ n, d }), answer: remainderLabel(Math.floor(n / d), n % d), say: M3.remainder, instruction: M3.remainder, hint: M3.remainderHint,
      prompt: { expr: `${n} ${DIV} ${d} = ?` }, options,
    }
  })
}

interface Bus { id: string; n: number; d: number }
const BUS_D = [12, 15, 20, 24, 25, 30, 32, 35, 36, 40, 45, 48, 50]
const busKey = (b: Bus) => `bus:${b.id}:${b.n}:${b.d}`
function parseBus(key: string): Bus | null {
  const m = /^bus:([a-z]+):([1-9]\d*):([1-9]\d*)$/.exec(key)
  if (!m) return null
  const [n, d] = [Number(m[2]), Number(m[3])]
  const ok = ROUND_UP_STORIES.some(s => s.id === m[1]) && BUS_D.includes(d) && n >= 2 * d + 1 && n <= Math.min(520, 20 * d) && n % d !== 0
  return ok ? { id: m[1]!, n, d } : null
}
export const busStoryAccepts = (key: string) => parseBus(key) !== null
const busSampler = (id: string) => (rng: Rng): Bus | null => {
  const d = pick(rng, BUS_D)
  const n = randInt(rng, 2 * d + 1, Math.min(520, 20 * d))
  return n % d === 0 ? null : { id, n, d }
}
const busText = (b: Bus) => ROUND_UP_STORIES.find(s => s.id === b.id)!.text.split('{n}').join(str(b.n)).split('{d}').join(str(b.d))

/**
 * "100 children, 40 seats per bus: how many buses?" (read by the browser voice, D23). The answer rounds up. Distractors: rounding
 * down, the left-over itself, one more. The remainder is always at least 1.
 */
export function busStoryQuestion(ctx: GenContext): PickQ {
  const b = sample(ctx, parseBus, ROUND_UP_STORIES.map(s => busSampler(s.id)), busKey)
  const answer = Math.ceil(b.n / b.d)
  const valid = (vs: number[]) => vs.filter(v => v >= 1 && v !== answer)
  const options = numberOptions(ctx.rng, answer, 4, [valid([answer - 1, b.n % b.d, answer + 1]), valid([answer + 2, answer - 2, answer + 3, answer - 3])])
  const text = busText(b)
  return {
    itemKey: busKey(b), answer: str(answer), say: raw(text), instruction: M4.howManyNeeded, hint: M4.roundUpHint,
    prompt: { sentence: { text, say: raw(text) } }, options: options ?? [],
  }
}

/* ---------- 33. divisible by 3, 6 and 9 ---------- */

type Divisor369 = 3 | 6 | 9
const DIVISORS_369: Divisor369[] = [3, 6, 9]
interface Divisible { d: Divisor369; n: number }
const div369Key = (f: Divisible) => `div369:${f.d}:${f.n}`
const DIVISIBLE_369: Divisible[][] = DIVISORS_369.map(d => range(12, 999).filter(n => n % d === 0).map(n => ({ d, n })))
export const whichDivides369Accepts = keyIn(DIVISIBLE_369.flat(), div369Key)

/** "Which number divides by 6?" — four numbers up to 999, exactly one divisible. Close misses first; for 6 and 9 some divide by 3 only. */
export function whichDivides369Question(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, DIVISIBLE_369, div369Key), div369Key, ({ d, n }) => {
    const near = range(n - 12, n + 12).filter(m => m >= 10 && m <= 999 && m !== n && m % d !== 0)
    const half = d === 3 ? [] : near.filter(m => m % 3 === 0)
    const options = numberOptions(ctx.rng, n, 4, [half, near])
    if (!options) return null
    return { itemKey: div369Key({ d, n }), answer: str(n), say: whichDivides(d), instruction: whichDivides(d), hint: M4.digitSumHint, prompt: {}, options }
  })
}

interface SortDiv { d: Divisor369; numbers: number[] }
const sort369Key = (s: SortDiv) => `sort369:${s.d}:${[...s.numbers].sort((a, b) => a - b).join(',')}`
function parseSort(key: string): SortDiv | null {
  const m = /^sort369:(3|6|9):([1-9]\d*(?:,[1-9]\d*){7})$/.exec(key)
  if (!m) return null
  const d = Number(m[1]) as Divisor369
  const numbers = m[2]!.split(',').map(Number)
  const yes = numbers.filter(n => n % d === 0).length
  const sorted = [...numbers].sort((a, b) => a - b)
  return new Set(numbers).size === 8 && sorted.join(',') === numbers.join(',') && numbers.every(n => n >= 10 && n <= 999) && yes >= 2 && yes <= 6 ? { d, numbers } : null
}
export const sort369Accepts = (key: string) => parseSort(key) !== null

const sortSampler = (d: Divisor369) => (rng: Rng): SortDiv | null => {
  const yesCount = randInt(rng, 2, 6)
  const yes = shuffle(rng, DIVISIBLE_369[DIVISORS_369.indexOf(d)]!.map(f => f.n)).slice(0, yesCount)
  const no: number[] = []
  for (let i = 0; i < 60 && no.length < 8 - yesCount; i++) {
    const m = pick(rng, yes) + pick(rng, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])
    if (m >= 10 && m <= 999 && m % d !== 0 && !yes.includes(m) && !no.includes(m)) no.push(m)
  }
  return no.length === 8 - yesCount ? { d, numbers: [...yes, ...no].sort((a, b) => a - b) } : null
}

/** Eight numbers to drag into "divides by d" or "doesn't"; 2–6 of them divide. The others lie a few away from dividers. */
export function sort369Question(ctx: GenContext): SortQ {
  const s = sample(ctx, parseSort, DIVISORS_369.map(sortSampler), sort369Key)
  const items = shuffle(ctx.rng, s.numbers)
  return {
    itemKey: sort369Key(s), answer: items.flatMap((n, i) => (n % s.d === 0 ? [i] : [])), say: M3.sortNumbers, instruction: M3.sortNumbers, hint: M4.digitSumHint,
    items, yes: divisibleBy(s.d), no: M3.notDivisible,
  }
}

/* ---------- 34. order of operations 2 ---------- */

/** Three operations on four numbers, as tokens ('12', '−', '6', ':', '2', '+', '1'), with at most one pair of parentheses around one operation. */
const OPERATORS = [PLUS, MINUS, TIMES, DIV]
const applyOp = (op: string, x: number, y: number): number | null => {
  if (op === PLUS) return x + y
  if (op === MINUS) return x >= y ? x - y : null
  if (op === TIMES) return x * y
  return y !== 0 && x % y === 0 ? x / y : null
}

interface Flat { nums: number[]; ops: string[]; paren: number }
/** Numbers and operators without the parentheses; `paren` is the index of the operator inside them (−1: none); null when malformed. */
function flatten(tokens: readonly string[]): Flat | null {
  const nums: number[] = []
  const ops: string[] = []
  let paren = -1
  let open = false
  for (const t of tokens) {
    if (t === '(') {
      if (open || paren >= 0 || nums.length !== ops.length) return null
      open = true
      paren = ops.length
    } else if (t === ')') {
      if (!open || nums.length !== paren + 2) return null
      open = false
    } else if (OPERATORS.includes(t)) {
      if (nums.length !== ops.length + 1) return null
      ops.push(t)
    } else if (/^[1-9]\d*$/.test(t)) {
      if (nums.length !== ops.length) return null
      nums.push(Number(t))
    } else return null
  }
  return !open && nums.length === 4 && ops.length === 3 ? { nums, ops, paren } : null
}

type Order = 'ltr' | 'prec' | 'rev'
function evalFlat(nums: readonly number[], ops: readonly string[], mode: Order): number | null {
  const ns = [...nums]
  const os = [...ops]
  const pass = (kinds: readonly string[]) => {
    let i = 0
    while (i < os.length) {
      if (!kinds.includes(os[i]!)) {
        i++
        continue
      }
      const v = applyOp(os[i]!, ns[i]!, ns[i + 1]!)
      if (v === null) return false
      ns.splice(i, 2, v)
      os.splice(i, 1)
    }
    return true
  }
  const high = [TIMES, DIV]
  const low = [PLUS, MINUS]
  const steps = mode === 'ltr' ? [OPERATORS] : mode === 'prec' ? [high, low] : [low, high]
  return steps.every(pass) ? ns[0]! : null
}

/** The right value: the parenthesised operation first, then × and :, then + and −, left to right. */
function evalProper(f: Flat): number | null {
  if (f.paren < 0) return evalFlat(f.nums, f.ops, 'prec')
  const v = applyOp(f.ops[f.paren]!, f.nums[f.paren]!, f.nums[f.paren + 1]!)
  if (v === null) return null
  const nums = [...f.nums]
  const ops = [...f.ops]
  nums.splice(f.paren, 2, v)
  ops.splice(f.paren, 1)
  return evalFlat(nums, ops, 'prec')
}

/** The operator to do first: inside parentheses, else the leftmost × or :, else the leftmost. Returns its index in `tokens`. */
function firstOperator(tokens: readonly string[]): number {
  const ops = tokens.flatMap((t, i) => (OPERATORS.includes(t) ? [i] : []))
  const open = tokens.indexOf('(')
  if (open >= 0) return ops.find(i => i > open)!
  return ops.find(i => tokens[i] === TIMES || tokens[i] === DIV) ?? ops[0]!
}

const opsText = (tokens: readonly string[]) => tokens.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')')
const opsKey = (prefix: string) => (tokens: readonly string[]) => `${prefix}:${tokens.join('').replace(/×/g, 'x').replace(/−/g, '-')}`
/** Valid: whole, non-negative results throughout, the final one up to 100, and the order matters (it differs from the plain reading). */
function validOps(tokens: readonly string[]): boolean {
  const f = flatten(tokens)
  if (!f) return false
  const v = evalProper(f)
  if (v === null || v > 100) return false
  return v !== (f.paren < 0 ? evalFlat(f.nums, f.ops, 'ltr') : evalFlat(f.nums, f.ops, 'prec'))
}
const parseOps = (prefix: string) => (key: string): string[] | null => {
  if (!key.startsWith(`${prefix}:`)) return null
  const body = key.slice(prefix.length + 1)
  const tokens = (body.match(/\d+|[-+x:()]/g) ?? []).map(t => (t === 'x' ? TIMES : t === '-' ? MINUS : t))
  return tokens.join('').replace(/×/g, 'x').replace(/−/g, '-') === body && validOps(tokens) ? tokens : null
}
export const firstStep2Accepts = (key: string) => parseOps('ops2')(key) !== null
export const result2Accepts = (key: string) => parseOps('ops2r')(key) !== null

const opsSampler = (parens: boolean) => (rng: Rng): string[] | null => {
  for (let i = 0; i < 600; i++) {
    const nums = range(0, 3).map(() => randInt(rng, 2, 12))
    const ops = range(0, 2).map(() => pick(rng, OPERATORS))
    ops.forEach((op, k) => {
      if (op === DIV) {
        nums[k + 1] = randInt(rng, 2, 9)
        nums[k] = nums[k + 1]! * randInt(rng, 2, 9)
      }
    })
    const p = parens ? randInt(rng, 0, 2) : -1
    const tokens: string[] = []
    nums.forEach((n, k) => {
      if (k === p) tokens.push('(')
      tokens.push(str(n))
      if (k === p + 1 && p >= 0) tokens.push(')')
      if (k < 3) tokens.push(ops[k]!)
    })
    if (validOps(tokens)) return tokens
  }
  return null
}
const OPS_SAMPLERS = [opsSampler(false), opsSampler(true)]

/** `12 − 6 : 2 + 1` or `(12 − 6) : 2 + 1`: tap the operation to do first (answer = the operator's index in `tokens`). */
export function firstStep2Question(ctx: GenContext): FirstStepQ {
  const key = opsKey('ops2')
  const tokens = sample(ctx, parseOps('ops2'), OPS_SAMPLERS, key)
  return { itemKey: key(tokens), answer: firstOperator(tokens), say: M3.firstStep, instruction: M3.firstStep, hint: M3.opsHint, tokens }
}

/** The same exercises, pick the result of four. Distractors: the plain left-to-right result, the parentheses ignored, the other order. */
export function result2Question(ctx: GenContext): PickQ {
  const key = opsKey('ops2r')
  const tokens = sample(ctx, parseOps('ops2r'), OPS_SAMPLERS, key)
  const f = flatten(tokens)!
  const answer = evalProper(f)!
  const wrongOrder = (['ltr', 'prec', 'rev'] as const).map(m => evalFlat(f.nums, f.ops, m)).filter((v): v is number => v !== null && v !== answer)
  const near = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10].filter(v => v >= 0 && v !== answer)
  const options = numberOptions(ctx.rng, answer, 4, [wrongOrder, near])
  return { itemKey: key(tokens), answer: str(answer), say: M.solve, instruction: M.solve, hint: M3.opsHint, prompt: { expr: `${opsText(tokens)} = ?` }, options: options ?? [] }
}

/* ---------- 35. what is a fraction? ---------- */

const FRACTION_DENS = [...range(2, 10), 12]
type Shape = 'strip' | 'circle' | 'rect'
const SHAPES: Shape[] = ['strip', 'circle', 'rect']
interface Shaded { shape: Shape; parts: number; shaded: number }
const fracStr = (n: number, d: number) => `${n}/${d}`
/** A benchmark of 1 is written plain. */
const cmpStr = (n: number, d: number) => (d === 1 ? str(n) : fracStr(n, d))
const fracOption = (n: number, d: number): PickOption => ({ id: fracStr(n, d), kind: 'number', label: fracStr(n, d), say: raw(fractionText(n, d)) })
const sameValue = (a: readonly [number, number], b: readonly [number, number]) => a[0] * b[1] === b[0] * a[1]

const NAME_FRACTIONS: Shaded[][] = FRACTION_DENS.map(parts => SHAPES.flatMap(shape => range(1, parts - 1).map(shaded => ({ shape, parts, shaded }))))
const fracNameKey = (x: Shaded) => `fracname:${x.shape}:${x.parts}:${x.shaded}`
export const nameFractionAccepts = keyIn(NAME_FRACTIONS.flat(), fracNameKey)

/** A shaded circle, rectangle or strip → pick the fraction from four: the reversed one (4/3), the shaded/unshaded one and the complement (1/4 for 3/4). */
export function nameFractionQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, [NAME_FRACTIONS.flat().filter(x => x.parts <= 4), NAME_FRACTIONS.flat().filter(x => x.parts > 4)], fracNameKey), fracNameKey, ({ shape, parts: p, shaded: s }) => {
    const answer: [number, number] = [s, p]
    const ok = (xs: [number, number][]) => xs.filter(([n, d]) => n >= 1 && d >= 1 && !sameValue([n, d], answer))
    const wrong = onePerKind(ctx.rng, [ok([[p, s]]), ok([[p - s, p]])], ok([[s, p - s], [s + 1, p], [s - 1, p], [s, p + 1], [s, p - 1]]), 3, ([n, d]) => fracStr(n, d), [fracStr(s, p)])
    if (!wrong) return null
    return {
      itemKey: fracNameKey({ shape, parts: p, shaded: s }), answer: fracStr(s, p), say: M4.nameFraction, instruction: M4.nameFraction,
      prompt: { art: [{ name: MATH_ART_4.fraction, props: { shape, parts: p, shaded: s } }] },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(([n, d]) => fracOption(n, d)),
    }
  })
}

/** Tap parts of a strip, circle or rectangle to shade a fraction. Denominators 2–10 and 12 (no 100: the shapes have no layout for it); sometimes the whole. */
const SHADE_ITEMS: Shaded[][] = SHAPES.map(shape => FRACTION_DENS.flatMap(parts => range(1, parts).map(shaded => ({ shape, parts, shaded }))))
const shadeKey = (x: Shaded) => `shade:${x.shape}:${x.parts}:${x.shaded}`
export const shadeFractionAccepts = keyIn(SHADE_ITEMS.flat(), shadeKey)

export function shadeFractionQuestion(ctx: GenContext): ShadeQ {
  return make(ctx, oneGroup(ctx, SHADE_ITEMS, shadeKey), shadeKey, x => ({
    itemKey: shadeKey(x), answer: x.shaded, say: [M4.shade, raw(fractionText(x.shaded, x.parts))], instruction: M4.shade, shape: x.shape, parts: x.parts, show: fracStr(x.shaded, x.parts),
  }))
}

interface Part { num: number; den: number; g: number }
const PART_DENS = [2, 3, 4, 5, 6, 8, 10]
const PART_ITEMS: Part[][] = PART_DENS.map(den => range(2, Math.floor(40 / den)).flatMap(g => range(1, den - 1).map(num => ({ num, den, g }))))
const partKey = (x: Part) => `partof:${x.num}:${x.den}:${x.den * x.g}`
export const partOfAccepts = keyIn(PART_ITEMS.flat(), partKey)

/** "1/3 of 12 apples": the objects stand in groups (one per part of the fraction), the answer is typed. Halves come with 10 and 20, among others. */
export function partOfQuestion(ctx: GenContext, things: readonly Thing[]): PadQ {
  return make(ctx, oneGroup(ctx, PART_ITEMS, partKey), partKey, ({ num, den, g }) => ({
    itemKey: partKey({ num, den, g }), answer: num * g, say: [M4.partOf], instruction: M4.partOf, hint: M4.partOfHint, maxDigits: 2,
    prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: den * g, layout: 'groups', cols: g }], expr: fracStr(num, den) },
  }))
}

/* ---------- 36. comparing fractions ---------- */

interface FLine { num: number; den: number }
const FLINE_DENS = [2, 3, 4, 5, 6, 8, 10]
const FLINES: FLine[][] = FLINE_DENS.map(den => range(1, den - 1).map(num => ({ num, den })))
const flineKey = (f: FLine) => `fline:${f.num}:${f.den}`
export const fractionLineAccepts = keyIn(FLINES.flat(), flineKey)

/** Place 3/4 on a line from 0 to 1 divided into quarters (positions in units of 1/den). */
export function fractionLineQuestion(ctx: GenContext): PlaceQ {
  return make(ctx, oneGroup(ctx, FLINES, flineKey), flineKey, ({ num, den }) => ({
    itemKey: flineKey({ num, den }), answer: num, say: [M.place, raw(fractionText(num, den))], instruction: M.place, hint: M4.fractionLineHint, target: num, tolerance: 0,
    line: { min: 0, max: den, step: 1, labelEvery: 1, den },
  }))
}

interface FCmp { a: number; b: number; c: number; d: number }
const fcmpKey = (x: FCmp) => `fcmp:${x.a}:${x.b}:${x.c}:${x.d}`
const CMP_DENS = [3, 4, 5, 6, 7, 8, 9, 10, 12]
const FCMP_GROUPS: FCmp[][] = [
  // unit fractions: 1/3 ? 1/4 (the "3 < 4" misconception)
  FRACTION_DENS.flatMap(x => FRACTION_DENS.filter(y => y !== x).map(y => ({ a: 1, b: x, c: 1, d: y }))),
  // the same denominator
  CMP_DENS.flatMap(d => range(1, d - 1).flatMap(a => range(1, d - 1).filter(c => c !== a).map(c => ({ a, b: d, c, d })))),
  // against one half, and against one (up to 1)
  [...FRACTION_DENS.filter(d => d > 2).flatMap(d => range(1, d - 1).flatMap(a => [{ a, b: d, c: 1, d: 2 }, { a: 1, b: 2, c: a, d }])),
    ...FRACTION_DENS.flatMap(d => range(1, d).map(a => ({ a, b: d, c: 1, d: 1 })))],
]
export const compareFractionsAccepts = keyIn(FCMP_GROUPS.flat(), fcmpKey)

/** `1/3 ? 1/4`, `3/7 ? 5/7`, `3/8 ? 1/2` or `5/6 ? 1` → <, = or >. The aid draws both fractions as strips, one above the other. */
export function compareFractionsQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, FCMP_GROUPS, fcmpKey), fcmpKey, x => ({
    itemKey: fcmpKey(x), answer: signOf(x.a * x.d, x.c * x.b), say: M.compare, instruction: M.compare, hint: M4.compareFractionHint,
    prompt: { expr: `${cmpStr(x.a, x.b)} ? ${cmpStr(x.c, x.d)}` },
    aidArt: [{ name: MATH_ART_4.strips, props: { a: `${x.a}/${x.b}`, b: `${x.c}/${x.d}` } }],
    options: signOptions(),
  }))
}

/* ---------- 37. adding and subtracting fractions ---------- */

/** The exact value num/den as a Fraction: a mixed number from 1 up (7/4 → 1 3/4), else just num/den. */
const toFraction = (num: number, den: number): Fraction => (num >= den ? { whole: Math.floor(num / den), num: num % den, den } : { num, den })
const strips = (...fs: [number, number][]) => fs.map(([n, d]) => `${n}/${d}`)

interface Like { a: number; c: number; d: number; op: '+' | '-' }
const LIKE_DENS = [3, 4, 5, 6, 7, 8, 9, 10, 12]
const likeKey = (x: Like) => `fl:${x.a}:${x.c}:${x.d}:${x.op === '+' ? 'p' : 'm'}`
const LIKES: Like[][] = [
  LIKE_DENS.flatMap(d => range(1, d - 1).flatMap(a => range(1, d - 1).filter(c => a + c < d).map(c => ({ a, c, d, op: '+' as const })))),
  LIKE_DENS.flatMap(d => range(1, d - 1).flatMap(a => range(1, d - 1).filter(c => a + c >= d).map(c => ({ a, c, d, op: '+' as const })))),
  LIKE_DENS.flatMap(d => range(2, d - 1).flatMap(a => range(1, a - 1).map(c => ({ a, c, d, op: '-' as const })))),
]
export const addLikeAccepts = keyIn(LIKES.flat(), likeKey)

/** `2/7 + 3/7 = ?` and `5/8 − 3/8 = ?`; sums of 1 or more show the whole-number box (some smaller ones do too, so the box tells nothing). */
export function addLikeQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, oneGroup(ctx, LIKES, likeKey), likeKey, x => {
    const num = x.op === '+' ? x.a + x.c : x.a - x.c
    return {
      itemKey: likeKey(x), answer: toFraction(num, x.d), say: [M.solve, raw(fractionText(x.a, x.d)), x.op === '+' ? OP.plus : OP.minus, raw(fractionText(x.c, x.d))],
      instruction: M.solve, hint: M4.sameDenHint, prompt: { expr: `${x.a}/${x.d} ${x.op === '+' ? PLUS : MINUS} ${x.c}/${x.d} = ?` },
      mixed: num >= x.d || ctx.rng() < 0.3, aidStrips: strips([x.a, x.d], [x.c, x.d]),
    }
  })
}

interface Related { a: number; p: number; c: number; q: number; op: '+' | '-' }
const RELATED_PAIRS: [number, number][] = [[2, 4], [3, 6], [2, 8], [4, 8], [5, 10], [3, 9]]
const relatedKey = (x: Related) => `fr:${x.a}:${x.p}:${x.op === '+' ? '+' : '-'}:${x.c}:${x.q}`
const RELATED: Related[][] = (['+', '-'] as const).map(op =>
  RELATED_PAIRS.flatMap(([s, t]) =>
    ([[s, t], [t, s]] as const).flatMap(([p, q]) =>
      range(1, p - 1).flatMap(a => range(1, q - 1).filter(c => op === '+' || a * q > c * p).map(c => ({ a, p, c, q, op })))),
  ),
)
export const addRelatedAccepts = keyIn(RELATED.flat(), relatedKey)

/** `1/2 + 1/4 = ?` and `3/4 − 1/2 = ?`: one denominator is a multiple of the other (2&4, 3&6, 2&8, 4&8, 5&10, 3&9). Answer over the bigger one. */
export function addRelatedQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, oneGroup(ctx, RELATED, relatedKey), relatedKey, x => {
    const big = Math.max(x.p, x.q)
    const [A, C] = [x.a * (big / x.p), x.c * (big / x.q)]
    const num = x.op === '+' ? A + C : A - C
    return {
      itemKey: relatedKey(x), answer: toFraction(num, big), say: [M.solve, raw(fractionText(x.a, x.p)), x.op === '+' ? OP.plus : OP.minus, raw(fractionText(x.c, x.q))],
      instruction: M.solve, hint: M4.commonDenHint, prompt: { expr: `${x.a}/${x.p} ${x.op === '+' ? PLUS : MINUS} ${x.c}/${x.q} = ?` },
      mixed: num >= big || ctx.rng() < 0.3, aidStrips: strips([x.a, x.p], [x.c, x.q]),
    }
  })
}

interface Times { k: number; a: number; d: number }
const timesKey = (x: Times) => `fw:${x.k}:${x.a}:${x.d}`
const TIMES_ITEMS: Times[][] = [2, 3, 4, 5, 6].map(k => [2, 3, 4, 5, 6, 8, 10].flatMap(d => range(1, Math.min(3, d - 1)).map(a => ({ k, a, d }))))
export const wholeTimesAccepts = keyIn(TIMES_ITEMS.flat(), timesKey)

/** `3 × 1/4 = ?` → 3/4 (and `5 × 3/4` is 3 3/4). The aid shows the strip k times. */
export function wholeTimesQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, oneGroup(ctx, TIMES_ITEMS, timesKey), timesKey, ({ k, a, d }) => ({
    itemKey: timesKey({ k, a, d }), answer: toFraction(k * a, d), say: [M.solve, ...numberPhrase(k), OP.times, raw(fractionText(a, d))],
    instruction: M.solve, hint: M4.sameDenHint, prompt: { expr: `${k} ${TIMES} ${a}/${d} = ?` },
    mixed: k * a >= d || ctx.rng() < 0.3, aidStrips: range(1, k).map(() => `${a}/${d}`),
  }))
}

/* ---------- 38. parallel and perpendicular ---------- */

type LineKind = 'parallel' | 'perpendicular' | 'crossing'
const LINE_ASKED: ('parallel' | 'perpendicular')[] = ['parallel', 'perpendicular']
const linesKey = (k: string) => `lines:${k}`
export const parallelPerpendicularAccepts = keyIn(LINE_ASKED, linesKey)

/** "Where are the lines parallel / perpendicular?" — three drawings (parallel, perpendicular, crossing at another angle), each rotated at random. */
export function parallelPerpendicularQuestion(ctx: GenContext): PickQ {
  return make(ctx, LINE_ASKED, linesKey, kind => ({
    itemKey: linesKey(kind), answer: kind, say: findLines(kind), instruction: findLines(kind), prompt: {},
    options: shuffle(ctx.rng, ['parallel', 'perpendicular', 'crossing'] as LineKind[]).map(k => ({
      id: k, kind: 'art' as const, art: { name: MATH_ART_4.lines, props: { kind: k, rot: randInt(ctx.rng, 0, 359) } },
    })),
  }))
}

/** A pad question with an aid drawing (the contract's PadQ has no aidArt; see docs/requests/math-g4-T1.md). */
export type DiagonalsQ = PadQ & { aidArt?: readonly ArtRef[] }
const SIDES = range(4, 8)
const diagKey = (n: number) => `diag:${n}`
export const diagonalsAccepts = keyIn(SIDES, diagKey)

/** "How many diagonals leave one vertex?" for a polygon of 4–8 sides: sides − 3. The aid draws them. */
export function diagonalsQuestion(ctx: GenContext): DiagonalsQ {
  return make(ctx, SIDES, diagKey, sides => ({
    itemKey: diagKey(sides), answer: sides - 3, say: M4.diagonals, instruction: M4.diagonals, hint: M4.diagonalsHint, maxDigits: 1,
    prompt: { art: [{ name: MATH_ART_4.polygon, props: { sides } }], artSize: 160 },
    aidArt: [{ name: MATH_ART_4.polygon, props: { sides, diagonals: true } }],
  }))
}

/* ---------- 39. quadrilaterals ---------- */

const QUADS: QuadKind[] = ['square', 'rectangle', 'rhombus', 'parallelogram', 'trapezoid']
/** A rotation that is never a quarter turn (shapes are never only in the textbook position). */
const quadRot = (rng: Rng) => {
  const r = randInt(rng, 15, 345)
  return r % 90 === 0 ? r + 7 : r
}
const quadArt = (rng: Rng, kind: QuadKind): ArtRef => ({ name: MATH_ART_4.quad, props: { kind, rot: quadRot(rng) } })
const nqKey = (k: QuadKind) => `nq:${k}`
const qpKey = (k: QuadKind) => `quadp:${k}`
export const nameQuadAccepts = keyIn(QUADS, nqKey)
export const quadPropertyAccepts = keyIn(QUADS, qpKey)

/** A shape, rotated at random → its name from all five (or four including the right one). */
export function nameQuadQuestion(ctx: GenContext): PickQ {
  return make(ctx, QUADS, nqKey, kind => {
    const others = shuffle(ctx.rng, QUADS.filter(k => k !== kind)).slice(0, ctx.rng() < 0.5 ? 4 : 3)
    return {
      itemKey: nqKey(kind), answer: kind, say: M4.nameQuad, instruction: M4.nameQuad, hint: M4.quadHint,
      prompt: { art: [quadArt(ctx.rng, kind)], artSize: 200 },
      options: shuffle(ctx.rng, [kind, ...others]).map(k => ({ id: k, kind: 'text' as const, label: phrases[quadName(k)]!, say: quadName(k) })),
    }
  })
}

/**
 * Shapes that may stand beside the right one. There is no inclusion in grade 4 (a square is not offered where "rectangle" or
 * "rhombus" is asked; no rectangle, rhombus or square beside a parallelogram), so exactly one drawing fits.
 */
const QUAD_OTHERS: Record<QuadKind, QuadKind[]> = {
  square: ['rectangle', 'rhombus', 'parallelogram', 'trapezoid'],
  rectangle: ['rhombus', 'parallelogram', 'trapezoid'],
  rhombus: ['rectangle', 'parallelogram', 'trapezoid'],
  parallelogram: ['trapezoid'],
  trapezoid: ['square', 'rectangle', 'rhombus', 'parallelogram'],
}

/** "Which shape has two pairs of parallel sides and no right angle?" → four drawings, one of the asked kind (ids `kind:index`). */
export function quadPropertyQuestion(ctx: GenContext): PickQ {
  return make(ctx, QUADS, qpKey, kind => {
    const pool = QUAD_OTHERS[kind]
    // Three others: all distinct when there are enough shapes, otherwise the same kind drawn again at another angle.
    const others = shuffle(ctx.rng, pool).slice(0, 3)
    while (others.length < 3) others.push(pool[others.length % pool.length]!)
    const kinds = shuffle(ctx.rng, [kind, ...others])
    const options = kinds.map((k, i) => ({ id: `${k}:${i}`, kind: 'art' as const, art: quadArt(ctx.rng, k) }))
    return { itemKey: qpKey(kind), answer: options[kinds.indexOf(kind)]!.id, say: quadQuestion(kind), instruction: quadQuestion(kind), hint: M4.quadHint, prompt: {}, options }
  })
}

/* ---------- 40. length units ---------- */

/** Neighbouring units: [bigger, smaller, how many smaller fit in one bigger]. cm and m count as neighbours (schools teach it). */
const UNIT_PAIRS: [LengthUnit, LengthUnit, number][] = [['cm', 'mm', 10], ['dm', 'cm', 10], ['m', 'dm', 10], ['m', 'cm', 100], ['km', 'm', 1000]]
interface Conv { big: LengthUnit; small: LengthUnit; f: number; q: number; down: boolean }
const CONV_MAX: Record<number, number> = { 10: 30, 100: 20, 1000: 9 }
const CONVS: Conv[][] = UNIT_PAIRS.map(([big, small, f]) => range(2, CONV_MAX[f]!).flatMap(q => [true, false].map(down => ({ big, small, f, q, down }))))
const convKey = (c: Conv) => `conv:${c.big}:${c.small}:${c.down ? c.q : c.q * c.f}:${c.down ? 'd' : 'u'}`
export const convertLengthAccepts = keyIn(CONVS.flat(), convKey)

/** `3 מ׳ = ? ס״מ` (bigger to smaller) and `300 ס״מ = ? מ׳` (smaller to bigger): neighbouring units, whole results. */
export function convertLengthQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, CONVS, convKey), convKey, c => ({
    itemKey: convKey(c), answer: c.down ? c.q * c.f : c.q, say: M4.convert, instruction: M4.convert, hint: M4.convertHint, maxDigits: 4,
    prompt: { expr: c.down ? `${fmt(c.q)} ${UNIT_LABEL[c.big]} = ? ${UNIT_LABEL[c.small]}` : `${fmt(c.q * c.f)} ${UNIT_LABEL[c.small]} = ? ${UNIT_LABEL[c.big]}` },
  }))
}

const senseKey = (id: string) => `sens:${id}`
export const sensibleLengthAccepts = keyIn(SENSIBLE_LENGTHS, s => senseKey(s.id))
const lengthLabel = ([n, u]: readonly [number, LengthUnit]) => `${fmt(n)} ${UNIT_LABEL[u]}`

/** "How long is a door?" → 2 מ׳ · 20 ס״מ · 20 מ׳ · 2 ק״מ; silent options (the units are the thing to read). */
export function sensibleLengthQuestion(ctx: GenContext): PickQ {
  return make(ctx, SENSIBLE_LENGTHS, s => senseKey(s.id), s => ({
    itemKey: senseKey(s.id), answer: lengthLabel(s.right), say: sensiblePhrase(s.id), instruction: sensiblePhrase(s.id), prompt: {},
    options: shuffle(ctx.rng, [s.right, ...s.wrong]).map(v => ({ id: lengthLabel(v), kind: 'text' as const, label: lengthLabel(v) })),
  }))
}

/* ---------- 41. surface area of a box ---------- */

/**
 * A box l × w × h, each 1–4 (key: the sorted sizes). Its net is a belt of four faces (h·w, l·w, h·w, l·w wide, all w tall) with the
 * two l × h faces above and below one of the l-wide faces; laid out sideways or turned a quarter, whichever fits 14 × 12.
 */
type Triple = [number, number, number]
interface Layout { l: number; w: number; h: number; turned: boolean }
const layoutsOf = (dims: Triple): Layout[] => {
  const perms: Triple[] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(([i, j, k]) => [dims[i!]!, dims[j!]!, dims[k!]!])
  return perms.flatMap(([l, w, h]) =>
    ([false, true] as const).map(turned => ({ l, w, h, turned })).filter(x => (x.turned ? x.w + 2 * x.h : 2 * x.h + 2 * x.l) <= 14 && (x.turned ? 2 * x.h + 2 * x.l : x.w + 2 * x.h) <= 12),
  )
}
const BOXES: Triple[] = range(1, 4).flatMap(a => range(a, 4).flatMap(b => range(b, 4).map((c): Triple => [a, b, c]))).filter(t => layoutsOf(t).length > 0)
const boxKey = (t: Triple) => `box:${t.join(':')}`
export const boxNetAccepts = keyIn(BOXES, boxKey)

export function boxNetQuestion(ctx: GenContext): GridAreaQ {
  return make(ctx, BOXES, boxKey, dims => {
    const { l, w, h, turned } = pick(ctx.rng, layoutsOf(dims))
    const cols = turned ? w + 2 * h : 2 * h + 2 * l
    const rows = turned ? 2 * h + 2 * l : w + 2 * h
    const cap = ctx.rng() < 0.5 ? h : 2 * h + l
    // [x, y, width, height, face group] in the sideways layout; groups: 0 bottom/top, 1 left/right, 2 the l × h ends.
    const flat: [number, number, number, number, number][] = [
      [0, h, h, w, 1], [h, h, l, w, 0], [h + l, h, h, w, 1], [2 * h + l, h, l, w, 0], [cap, 0, l, h, 2], [cap, h + w, l, h, 2],
    ]
    const flipX = ctx.rng() < 0.5
    const flipY = ctx.rng() < 0.5
    const sideCols = turned ? rows : cols
    const sideRows = turned ? cols : rows
    const placed = flat.map(([x, y, rw, rh, g]) => {
      const fx = flipX ? sideCols - x - rw : x
      const fy = flipY ? sideRows - y - rh : y
      return { rect: (turned ? [fy, fx, rh, rw] : [fx, fy, rw, rh]) as unknown as CellRect, g }
    })
    return {
      itemKey: boxKey(dims), answer: 2 * (l * w + l * h + w * h), say: M4.boxNet, instruction: M4.boxNet, hint: M4.boxHint, cols, rows, mode: 'count',
      rects: placed.map(p => p.rect), faces: placed.map(p => p.g),
    }
  })
}
