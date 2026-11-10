import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { M, OP } from './ids'
import { numberPhrase } from './numbers'
import type { ChartQ, PadQ, PlaceValueQ, ShareQ, Thing } from './types'

// Pure question generators for the numbers island, 2nd grade (skills 11–17), one per game. Spec: docs/specs/math-grade2.md.
// Same style as generators.ts (skills 1–10); its helpers are private there, so the few needed are copied here.

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

/** Games with several kinds of items ask each kind equally often: the group holding the review item, else a random group. */
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

/** The tables of this grade; a fact is "in the tables" when one of its factors is one of these. */
export const TABLES = [2, 4, 5, 10] as const
const inTables = (a: number, b: number) => TABLES.some(t => t === a || t === b)

const PLUS = '+'
const MINUS = '−'
const TIMES = '×'
/** In item keys only (kept for Leitner history). Shown division is ':' as in Israeli schools (new curriculum, G3 p.9). */
const DIV = '÷'

/* ---------- 11. place value ---------- */

const PV_TWO = range(10, 99)
const PV_THREE = range(100, 999)
const buildKey = (n: number) => `pv:${n}`
const keyNumber = (prefix: string, key: string) => (key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length)) ? Number(key.slice(prefix.length)) : NaN)
export const buildNumberAccepts = (key: string) => keyNumber('pv:', key) >= 10 && keyNumber('pv:', key) <= 999

/** Build a number in the place-value house; two- and three-digit numbers equally often. The number is shown in digits and spoken. */
export function buildNumberQuestion(ctx: GenContext): PlaceValueQ {
  return make(ctx, oneGroup(ctx, [PV_TWO, PV_THREE], buildKey), buildKey, n => ({
    itemKey: buildKey(n), answer: n, say: [M.build, ...numberPhrase(n)], instruction: M.build, show: String(n), columns: n >= 100 ? 3 : 2,
  }))
}

/**
 * Flexible splits, as an exercise on the pad (digits only, so it needs no new phrase and reads left to right):
 * two-digit `56 = 40 + ?` (answer 16 — more than 9 ones is the point) and three-digit `347 = 300 + 40 + ?`
 * (answer 7, or flexible: `347 = 300 + 20 + ?` → 27). Always asks for the ones, which is what M.flexible says.
 * The tens part is a multiple of ten, at least ten, and smaller than the number; the item is the number.
 */
const FLEX_TWO = range(11, 99)
const FLEX_THREE = range(111, 999).filter(n => n % 100 >= 11)
const flexKey = (n: number) => `flex:${n}`
export const flexibleAccepts = (key: string) => [...FLEX_TWO, ...FLEX_THREE].some(n => flexKey(n) === key)

export function flexibleQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [FLEX_TWO, FLEX_THREE], flexKey), flexKey, n => {
    const hundreds = Math.floor(n / 100) * 100
    const rest = n - hundreds
    const tens = pick(ctx.rng, range(1, Math.floor(((n >= 100 ? rest : n) - 1) / 10)).map(t => t * 10))
    const expr = n >= 100 ? `${n} = ${hundreds} + ${tens} + ?` : `${n} = ${tens} + ?`
    return {
      itemKey: flexKey(n), answer: n - hundreds - tens, say: M.flexible, instruction: M.flexible, prompt: { expr }, maxDigits: 2,
    }
  })
}

const SIGNS = ['<', '=', '>'] as const
type Sign = (typeof SIGNS)[number]
const signOf = (a: number, b: number): Sign => (a < b ? '<' : a > b ? '>' : '=')
const SIGN_SAY: Readonly<Record<Sign, string>> = { '<': OP.less, '=': OP.equals, '>': OP.greater }
const signKey = (n: number) => `sign:${n}`
export const compareSignsAccepts = (key: string) => keyNumber('sign:', key) >= 10 && keyNumber('sign:', key) <= 999

/** Numbers that differ from `n` in one digit (one place) or by swapping two of its digits, with the same number of digits. */
function partners(n: number): { swaps: number[]; changes: number[] } {
  const d = String(n).split('')
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
      c[i] = String(v)
      if (v !== Number(d[i]) && c[0] !== '0') changes.push(Number(c.join('')))
    }
  }
  return { swaps: [...new Set(swaps)], changes }
}

/**
 * `342 ? 324` → pick <, = or > (always in this order, so the signs keep their place). The item is the left number; the
 * right one is usually a digit swap (342/324, 340/430) or one changed digit (342/382), sometimes equal. Each sign has a 🔊.
 */
export function compareSignsQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, [PV_TWO, PV_THREE], signKey), signKey, a => {
    const { swaps, changes } = partners(a)
    const r = ctx.rng()
    const b = r < 0.15 ? a : r < 0.55 && swaps.length ? pick(ctx.rng, swaps) : pick(ctx.rng, changes)
    const answer = signOf(a, b)
    return {
      itemKey: signKey(a), answer, say: M.compare, instruction: M.compare, prompt: { expr: `${a} ? ${b}` },
      options: SIGNS.map(s => ({ id: s, kind: 'number' as const, label: s, say: SIGN_SAY[s] })),
    }
  })
}

/* ---------- 12. count to 1,000 ---------- */

interface Skip { step: 10 | 20 | 50 | 100; start: number }
const startsBy = (step: number, max: number, keep: (s: number) => boolean) => range(0, Math.floor(max / step)).map(i => i * step).filter(keep)
const skips = (step: Skip['step'], from: readonly number[]) => from.filter(s => s + 4 * step <= 1000).map(start => ({ step, start }))
const SKIP_GROUPS: Skip[][] = [
  skips(10, startsBy(10, 960, () => true)),
  skips(10, range(1, 960).filter(s => s % 10 !== 0)),
  skips(20, startsBy(10, 920, () => true)),
  skips(50, startsBy(50, 800, () => true)),
  skips(100, startsBy(100, 600, () => true)),
  skips(100, range(1, 600).filter(s => s % 100 !== 0)),
]
const skipKey = (f: Skip) => `skip1000:${f.step}:${f.start}`
export const skip1000Accepts = (key: string) => SKIP_GROUPS.flat().some(f => skipKey(f) === key)

/**
 * Five terms by 10, 20, 50 or 100 (some starting from 37, 47…, also from 0) with one gap among the last four. Terms go
 * up to 1,000, but the gap is never 1,000 itself (the pad takes 3 digits).
 */
export function skip1000Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, SKIP_GROUPS, skipKey), skipKey, f => {
    const terms = range(0, 4).map(i => f.start + i * f.step)
    const gaps = range(1, 4).filter(i => terms[i]! <= 999)
    const gap = pick(ctx.rng, gaps)
    return {
      itemKey: skipKey(f), answer: terms[gap]!, say: M.skip, instruction: M.skip, maxDigits: 3,
      prompt: { expr: terms.map((t, i) => (i === gap ? '?' : String(t))).join(', ') },
    }
  })
}

const CHART_STARTS = range(0, 9).map(i => i * 100 + 1)
const chartKey = (start: number) => `chart:${start}`
export const hundredChartAccepts = (key: string) => CHART_STARTS.some(s => chartKey(s) === key)

/** A hundred chart (1–100, 101–200, … 901–1,000) with 3–5 blanks that never all sit in one row. Answer: the blanks, ascending. */
export function hundredChartQuestion(ctx: GenContext): ChartQ {
  return make(ctx, CHART_STARTS, chartKey, start => {
    const count = randInt(ctx.rng, 3, 5)
    let cells: number[]
    do cells = shuffle(ctx.rng, range(0, 99)).slice(0, count)
    while (new Set(cells.map(c => Math.floor(c / 10))).size < 2)
    const blanks = cells.map(c => start + c).sort((a, b) => a - b)
    return { itemKey: chartKey(start), answer: blanks, say: M.chart, instruction: M.chart, start, blanks }
  })
}

/* ---------- 13. within 100 ---------- */

/** `a + b` or `a − b`, results 1–100, never both operands whole tens (that is skill 9). */
interface Fact100 { op: '+' | '-'; a: number; b: number }
const fact100Key = (f: Fact100) => `w100:${f.a}${f.op}${f.b}`
const result100 = (f: Fact100) => (f.op === '+' ? f.a + f.b : f.a - f.b)
const sym = (op: Fact100['op']) => (op === '+' ? PLUS : MINUS)
const notTens = (a: number, b: number) => !(a % 10 === 0 && b % 10 === 0)
const ADD100 = range(10, 98).flatMap(a => range(2, 100 - a).filter(b => notTens(a, b)).map(b => ({ op: '+' as const, a, b })))
const SUB100 = range(11, 100).flatMap(a => range(2, a - 1).filter(b => notTens(a, b)).map(b => ({ op: '-' as const, a, b })))
/** Crossing a ten: the ones add up past 10 / the ones of the subtrahend are bigger than the minuend's. */
const crosses = (f: Fact100) => (f.op === '+' ? (f.a % 10) + (f.b % 10) >= 10 : f.a % 10 < f.b % 10)
/** Four kinds, each asked equally often: add and subtract, with and without crossing a ten. */
const GROUPS100: Fact100[][] = [
  ADD100.filter(f => !crosses(f)), ADD100.filter(crosses), SUB100.filter(f => !crosses(f)), SUB100.filter(crosses),
]
/** Solve, missing and estimate practise the same facts. */
export const within100Accepts = (key: string) => key.startsWith('w100:') && GROUPS100.flat().some(f => fact100Key(f) === key)

const say100 = (f: Fact100) => [...numberPhrase(f.a), f.op === '+' ? OP.plus : OP.minus, ...numberPhrase(f.b)]

/** `47 + 25 = ?` or `83 − 38 = ?`. The hint (spoken when the aid turns on) is the first step: the tens of the second number. */
export function solve100Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, GROUPS100, fact100Key), fact100Key, f => {
    const tens = f.b - (f.b % 10)
    return {
      itemKey: fact100Key(f), answer: result100(f), maxDigits: 3, instruction: M.solve, say: [M.solve, ...say100(f)],
      prompt: { expr: `${f.a} ${sym(f.op)} ${f.b} = ?` },
      ...(tens >= 10 && f.b % 10 !== 0 ? { hint: say100({ ...f, b: tens }) } : {}),
    }
  })
}

/** One number of the fact is missing, either operand: `47 + ? = 72`, `? + 25 = 72`, `83 − ? = 45`, `? − 38 = 45`. */
export function missing100Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, GROUPS100, fact100Key), fact100Key, f => {
    const c = result100(f)
    const blankFirst = ctx.rng() < 0.5
    return {
      itemKey: fact100Key(f), answer: blankFirst ? f.a : f.b, maxDigits: 3, say: M.missing, instruction: M.missing,
      prompt: { expr: blankFirst ? `? ${sym(f.op)} ${f.b} = ${c}` : `${f.a} ${sym(f.op)} ? = ${c}` },
    }
  })
}

/**
 * "Is 47 + 25 more or less than 70?" — shown as `47 + 25 ? 70`, answered with two big word options (more / less, each
 * option's text is its own phrase, so a 7-year-old reads the words rather than decoding < and >). The benchmark is a
 * whole ten next to the result (the ten below or above, either one), never equal to it, within 10–100.
 */
export function estimateQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, GROUPS100, fact100Key), fact100Key, f => {
    const r = result100(f)
    const below = r - (r % 10)
    const candidates = [r % 10 === 0 ? r - 10 : below, r % 10 === 0 ? r + 10 : below + 10].filter(b => b >= 10 && b <= 100)
    const bench = pick(ctx.rng, candidates)
    return {
      itemKey: fact100Key(f), answer: r > bench ? 'more' : 'less', say: [M.estimate, ...numberPhrase(bench)], instruction: M.estimate,
      prompt: { expr: `${f.a} ${sym(f.op)} ${f.b} ? ${bench}` },
      options: shuffle(ctx.rng, [
        { id: 'more', kind: 'sound' as const, say: M.moreThan },
        { id: 'less', kind: 'sound' as const, say: M.lessThan },
      ]),
    }
  })
}

/* ---------- 14. facts within 20 by heart ---------- */

/** All facts within 20, not only those crossing ten: a + b ≤ 20 and a − b with a ≤ 20, operands ≥ 1. Item key: the fact. */
const ADD20 = range(1, 19).flatMap(a => range(1, 20 - a).map(b => ({ op: '+' as const, a, b })))
const SUB20 = range(2, 20).flatMap(a => range(1, a - 1).map(b => ({ op: '-' as const, a, b })))
const fact20Key = (f: Fact100) => `f20:${f.a}${f.op}${f.b}`
export const facts20Accepts = (key: string) => [...ADD20, ...SUB20].some(f => fact20Key(f) === key)

/** The jumps from `from` to `to` on a 0–20 line; a trip across 10 stops there. Signed. */
function jumps(from: number, to: number): number[] {
  if ((from < 10 && to > 10) || (from > 10 && to < 10)) return [10 - from, to - 10]
  return [to - from]
}

/** `8 + 5 = ?` or `13 − 6 = ?` with every fact within 20, mixed; a missed fact comes back (Leitner). The aid draws the jumps. */
export function facts20Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [ADD20, SUB20], fact20Key), fact20Key, f => {
    const r = result100(f)
    return {
      itemKey: fact20Key(f), answer: r, maxDigits: 2, instruction: M.facts, say: [M.facts, ...say100(f)],
      prompt: { expr: `${f.a} ${sym(f.op)} ${f.b} = ?` }, aidLine: { max: 20, from: f.a, jumps: jumps(f.a, r) },
    }
  })
}

/* ---------- 15. odd / even ---------- */

const parityOptions = (rng: Rng): PickOption[] =>
  shuffle(rng, [{ id: 'even', kind: 'sound' as const, say: M.even }, { id: 'odd', kind: 'sound' as const, say: M.odd }])

const PAIR_COUNTS = range(1, 20)
const pairsKey = (n: number) => `pairs:${n}`
export const pairsAccepts = (key: string) => PAIR_COUNTS.some(n => pairsKey(n) === key)

/** 1–20 objects in groups of 2 ("does everyone have a friend?"); an odd count leaves one alone. even / odd, each equally often. */
export function pairsQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  const evens = PAIR_COUNTS.filter(n => n % 2 === 0)
  const odds = PAIR_COUNTS.filter(n => n % 2 === 1)
  return make(ctx, oneGroup(ctx, [evens, odds], pairsKey), pairsKey, n => ({
    itemKey: pairsKey(n), answer: n % 2 === 0 ? 'even' : 'odd', say: [M.pairUp, M.oddEven], instruction: M.pairUp,
    prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: n, layout: 'groups', cols: 2 }] }, options: parityOptions(ctx.rng),
  }))
}

const PARITY_NUMBERS = range(0, 100)
const parityKey = (n: number) => `parity:${n}`
export const parityAccepts = (key: string) => PARITY_NUMBERS.some(n => parityKey(n) === key)

/** A number 0–100 in digits (0 is even): even or odd? */
export function parityQuestion(ctx: GenContext): PickQ {
  const evens = PARITY_NUMBERS.filter(n => n % 2 === 0)
  const odds = PARITY_NUMBERS.filter(n => n % 2 === 1)
  return make(ctx, oneGroup(ctx, [evens, odds], parityKey), parityKey, n => ({
    itemKey: parityKey(n), answer: n % 2 === 0 ? 'even' : 'odd', say: [M.oddEven, ...numberPhrase(n)], instruction: M.oddEven,
    prompt: { expr: String(n) }, options: parityOptions(ctx.rng),
  }))
}

/* ---------- 16. multiplication ---------- */

/** `rows × cols` means `rows` groups (rows) of `cols`; the picture and the exercise read the same way. */
interface Grid { rows: number; cols: number }
const GRIDS: Grid[] = range(2, 10).flatMap(rows => range(2, 10).filter(cols => inTables(rows, cols) && rows * cols <= 50).map(cols => ({ rows, cols })))
const gridKey = (prefix: string) => (g: Grid) => `${prefix}:${g.rows}x${g.cols}`
const arrayKey = gridKey('arr')
const groupsKey = gridKey('grp')
/** Both array variants practise the same facts. */
export const arrayAccepts = (key: string) => GRIDS.some(g => arrayKey(g) === key)
export const groupsAccepts = (key: string) => GRIDS.some(g => groupsKey(g) === key)

const product = (g: Grid) => g.rows * g.cols
const times = (a: number, b: number) => `${a} ${TIMES} ${b}`

/** A different multiplication or addition of the same numbers, never one with the answer's value or label (and never the swapped one). */
function exerciseDistractors(g: Grid): { plus: string[]; other: string[] } {
  const { rows: r, cols: c } = g
  return {
    plus: r + c === r * c ? [] : [`${r} ${PLUS} ${c}`],
    other: [
      ...(r + 1 <= 10 ? [times(r + 1, c)] : []), ...(r - 1 >= 2 ? [times(r - 1, c)] : []),
      ...(c + 1 <= 10 ? [times(r, c + 1)] : []), ...(c - 1 >= 2 ? [times(r, c - 1)] : []),
    ].filter(l => l !== times(r, c) && l !== times(c, r)),
  }
}

/** An array of objects (rows × cols); pick the matching exercise of 3: `4 × 5`, `4 + 5`, `5 × 5`. */
export function arrayExerciseQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, GRIDS, arrayKey, g => {
    const { plus, other } = exerciseDistractors(g)
    const wrong = take(ctx.rng, [plus, other], 2, l => l)
    if (!wrong) return null
    const answer = times(g.rows, g.cols)
    return {
      itemKey: arrayKey(g), answer, say: M.whichExercise, instruction: M.whichExercise,
      prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: product(g), layout: 'array', cols: g.cols }] },
      options: labelOptions(ctx.rng, answer, wrong),
    }
  })
}

/** An array of objects; pick the total of 4 numbers (one row more or less first, then the sum of the two numbers). */
export function arrayResultQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, GRIDS, arrayKey, g => {
    const p = product(g)
    const options = numberOptions(ctx.rng, p, 4, [
      [p + g.cols, p - g.cols, p + g.rows, p - g.rows].filter(v => v > 0), [g.rows + g.cols], [...near(p, 1, 1, 100), ...near(p, 2, 1, 100)],
    ])
    if (!options) return null
    return {
      itemKey: arrayKey(g), answer: String(p), say: M.array, instruction: M.array,
      prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: p, layout: 'array', cols: g.cols }] }, options,
    }
  })
}

/** The array game: the exercise variant or the result variant, at random. */
export function arrayQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return ctx.rng() < 0.5 ? arrayExerciseQuestion(ctx, things) : arrayResultQuestion(ctx, things)
}

/** `cols` objects in each of `rows` groups, as `4 + 4 + 4`. */
const repeated = (term: number, n: number) => Array.from({ length: n }, () => term).join(` ${PLUS} `)

/**
 * Equal groups of objects ↔ exercise of 3. Two forms, one fact: pick the multiplication (`3 × 4`, against `3 + 4` and
 * a neighbour) or, for up to 5 groups, the repeated addition (`4 + 4 + 4`, against `3 + 4` and one group too many or few).
 */
export function groupsQuestion(ctx: GenContext, things: readonly Thing[]): PickQ {
  return make(ctx, GRIDS, groupsKey, g => {
    const { rows: n, cols: k } = g
    const asSum = n <= 5 && ctx.rng() < 0.5
    const answer = asSum ? repeated(k, n) : times(n, k)
    const plus = n + k === n * k ? [] : [`${n} ${PLUS} ${k}`]
    const other = asSum
      ? [repeated(k, n + 1), ...(n - 1 >= 2 ? [repeated(k, n - 1)] : [])]
      : exerciseDistractors(g).other
    const wrong = take(ctx.rng, [plus, other], 2, l => l, [answer])
    if (!wrong) return null
    return {
      itemKey: groupsKey(g), answer, say: M.whichExercise, instruction: M.whichExercise,
      prompt: { objects: [{ emoji: pick(ctx.rng, things).emoji, count: product(g), layout: 'groups', cols: k }] },
      options: labelOptions(ctx.rng, answer, wrong),
    }
  })
}

interface TableFact { a: number; b: number }
const TABLE_FACTS: TableFact[] = [...new Map(
  TABLES.flatMap(t => range(1, 10).flatMap(b => [{ a: t, b }, { a: b, b: t }])).map(f => [`${f.a}x${f.b}`, f] as const),
).values()]
const tableKey = (f: TableFact) => `tbl:${f.a}x${f.b}`
export const tablesAccepts = (key: string) => TABLE_FACTS.some(f => tableKey(f) === key)

/** `4 × 5 = ?` on the pad; the 2, 4, 5 and 10 tables in both orders (`5 × 4` is its own fact). */
export function tablesQuestion(ctx: GenContext): PadQ {
  return make(ctx, TABLE_FACTS, tableKey, f => ({
    itemKey: tableKey(f), answer: f.a * f.b, maxDigits: 3, instruction: M.solve,
    say: [M.solve, ...numberPhrase(f.a), OP.times, ...numberPhrase(f.b)], prompt: { expr: `${f.a} ${TIMES} ${f.b} = ?` },
  }))
}

/* ---------- 17. division ---------- */

/** Share facts: `total ÷ plates = each`, total ≤ 40, at most 5 plates (they must fit the screen), plates or each in the tables. */
interface ShareFact { plates: number; each: number }
const SHARES: ShareFact[] = range(2, 5).flatMap(plates => range(2, 10).filter(each => inTables(plates, each) && plates * each <= 40).map(each => ({ plates, each })))
const shareKey = (f: ShareFact) => `share:${f.plates * f.each}${DIV}${f.plates}`
export const shareAccepts = (key: string) => SHARES.some(f => shareKey(f) === key)

/** Share `total` objects equally between `plates` plates by dragging; answer: how many on each plate. Never a remainder. */
export function shareQuestion(ctx: GenContext, things: readonly Thing[]): ShareQ {
  return make(ctx, SHARES, shareKey, f => ({
    itemKey: shareKey(f), answer: f.each, say: M.share, instruction: M.share, emoji: pick(ctx.rng, things).emoji, total: f.plates * f.each, plates: f.plates,
  }))
}

/** Groups-of facts: `total ÷ size = groups`, total ≤ 50, 2–10 groups, group size or number of groups in the tables. */
interface GroupsOfFact { groups: number; size: number }
const GROUPS_OF: GroupsOfFact[] = range(2, 10).flatMap(groups =>
  range(2, 10).filter(size => inTables(groups, size) && groups * size <= 50).map(size => ({ groups, size })))
const groupsOfKey = (f: GroupsOfFact) => `groupsof:${f.groups * f.size}${DIV}${f.size}`
export const groupsOfAccepts = (key: string) => GROUPS_OF.some(f => groupsOfKey(f) === key)

/** `20 ÷ 4 = ?`: objects drawn in separate groups of 4; how many groups? */
export function groupsOfQuestion(ctx: GenContext, things: readonly Thing[]): PadQ {
  return make(ctx, GROUPS_OF, groupsOfKey, f => ({
    itemKey: groupsOfKey(f), answer: f.groups, maxDigits: 2, say: M.groupsOf, instruction: M.groupsOf,
    prompt: {
      objects: [{ emoji: pick(ctx.rng, things).emoji, count: f.groups * f.size, layout: 'groups', cols: f.size }],
      expr: `${f.groups * f.size} : ${f.size} = ?`,
    },
  }))
}
