import { raw } from '../../core/audio/audio'
import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { PERCENT_STORIES } from './content/percent-stories'
import { SENSIBLE_VOLUMES } from './content/volumes'
import { M, M4, M6, OP, findCirclePart, sensibleVolume } from './ids'
import { decimalText, fmt, fmtDec, fractionText, spokenNumber, toGematria, toRoman } from './numbers'
import { phrases } from './phrases'
import {
  MATH_ART_4, MATH_ART_6, type CellRect, type CirclePart, type Fraction, type FractionPadQ, type GridAreaQ, type MeanQ, type PadQ, type ShadeQ,
  type TapArtQ,
} from './types'

// Pure question generators for the numbers island, 6th grade (skills 53–63), one per game. Spec: docs/specs/math-grade6.md.
// Same style as generators-g4.ts (its helpers are private there, so the few needed are copied here).
// Fractions in prompts and options are written 'a/b'; decimals go through fmtDec(); division is shown as ':'.
//
// Item keys (short, unique per game; each game's Accepts function recognises only its own):
//   53  mo:RULE:INPUT   (RULE = steps like x3,p1; x × d : p + m −)        mr:RULE
//   54  rom:N:a|b  (a: Roman shown, pick the number; b: number shown, pick the Roman)     gem:N:a|b  (same, Hebrew letters)
//   55  fo:A:B:N  (A/B of N)   fg:A:B:C:D  (A/B × C/D)   bs:x|d:A:B:N  (A/B × N or N : A/B)
//   56  hf:w:N:D (N : 1/D)  hf:f:A:D (A/D : 1/D)   du:N:D (N : 1/D)   df:A:B:C:D (A/B : C/D)
//   57  wp:X:Y (X × Y, decimals)   dm:x|d:A:B   ep:x|d:A:N  (A × N or N : A, more or less than N)
//   58  po:P:N (P% of N; the arena asks the same keys, N up to 200)   pm:P:f|d|pf|pd
//   59  pwh:STORY:P:X  pdi:STORY:P:X  pri:STORY:P:X
//   60  ca:KIND:PARAMS:T (area)  cpm:KIND:PARAMS:T (perimeter)  se:A:B
//   61  cpt:PART   circ:R   carea:R
//   62  cub:L:W:H   bv:L:W:H (sorted)   vu:ID
//   63  lb:V1,V2,…   fm:V1,V2,…   mt:in:V,…  mt:wh:V,…  mt:ad:V,…:X

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

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i)
const stepped = (min: number, max: number, step: number) => range(0, Math.floor((max - min) / step)).map(i => min + i * step)
const keyIn = <T>(items: readonly T[], key: (t: T) => string) => {
  const keys = new Set(items.map(key))
  return (k: string) => keys.has(k)
}
const str = String
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const unique = (xs: readonly number[]) => [...new Set(xs)]

const PLUS = '+'
const MINUS = '−'
const TIMES = '×'
const DIV = ':'

const numOption = (v: number): PickOption => ({ id: str(v), kind: 'number', label: fmt(v), say: spokenNumber(v) })
const fracStr = (n: number, d: number) => `${n}/${d}`
const toFraction = (num: number, den: number): Fraction => (num >= den ? { whole: Math.floor(num / den), num: num % den, den } : { num, den })
const textOption = (id: string): PickOption => ({ id, kind: 'text', label: phrases[id]!, say: id })

/** A number said aloud: whole numbers by the recorded blocks, decimals by the browser voice. */
const sayNum = (v: number): string[] => (Number.isInteger(v) ? spokenNumber(v) : [raw(decimalText(v))])

/* ---------- 53. number machines ---------- */

type Op = 'x' | 'd' | 'p' | 'm'
type Step = readonly [Op, number]
type Rule = readonly Step[]
const OP_SIGN: Record<Op, string> = { x: TIMES, d: DIV, p: PLUS, m: MINUS }
const ruleKey = (r: Rule) => r.map(([o, k]) => `${o}${k}`).join(',')
const ruleLabel = (r: Rule) => r.map(([o, k]) => `${OP_SIGN[o]} ${k}`).join(' ')
const ruleArt = (r: Rule) => r.map(([o, k]) => `${OP_SIGN[o]}${k}`).join('')

/** Runs the steps left to right; null unless every value along the way is a whole number from 0 to 200. */
function runRule(r: Rule, input: number): number | null {
  let v = input
  for (const [o, k] of r) {
    v = o === 'x' ? v * k : o === 'd' ? v / k : o === 'p' ? v + k : v - k
    if (!Number.isInteger(v) || v < 0 || v > 200) return null
  }
  return v
}

const step = (o: Op, ks: readonly number[]): Step[] => ks.map(k => [o, k] as const)
const ONE_STEP: Step[] = [
  ...step('x', range(2, 9)), ...step('d', range(2, 9)), ...step('p', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50]), ...step('m', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]),
]
const FIRST_SCALE: Step[] = [...step('x', [2, 3, 4, 5, 6, 10]), ...step('d', [2, 3, 4, 5])]
const THEN_SHIFT: Step[] = [...step('p', [1, 2, 3, 5, 10]), ...step('m', [1, 2, 3, 5])]
const FIRST_SHIFT: Step[] = [...step('p', [1, 2, 3, 5, 10]), ...step('m', [1, 2, 3])]
const THEN_SCALE: Step[] = step('x', [2, 3, 4, 5])
const RULES_1: Rule[] = ONE_STEP.map(s => [s])
const RULES_2: Rule[] = [
  ...FIRST_SCALE.flatMap(a => THEN_SHIFT.map((b): Rule => [a, b])),
  ...FIRST_SHIFT.flatMap(a => THEN_SCALE.map((b): Rule => [a, b])),
]

interface Machine { rule: Rule; input: number; out: number }
const machineKey = (m: Machine) => `mo:${ruleKey(m.rule)}:${m.input}`
const MACHINES: Machine[][] = [RULES_1, RULES_2].map(rules =>
  rules.flatMap(rule => range(1, 20).flatMap(input => {
    const out = runRule(rule, input)
    return out === null ? [] : [{ rule, input, out }]
  })),
)
export const machineOutputAccepts = keyIn(MACHINES.flat(), machineKey)

/** `× 3 + 1` with input 7 → type the output. One-step and two-step rules, equally often; every value stays a whole number up to 200. */
export function machineOutputQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, MACHINES, machineKey), machineKey, m => ({
    itemKey: machineKey(m), answer: m.out, say: [M6.machineOut], instruction: M6.machineOut, hint: M6.machineHint, maxDigits: 3,
    prompt: { art: [{ name: MATH_ART_6.machine, props: { rule: ruleArt(m.rule), input: m.input } }], artSize: 200 },
  }))
}

const ruleItemKey = (r: Rule) => `mr:${ruleKey(r)}`
export const machineRuleAccepts = keyIn([...RULES_1, ...RULES_2], ruleItemKey)

/** Three input → output pairs; pick the rule from four (same number of steps, sharing a step with the right one); exactly one fits all pairs. */
export function machineRuleQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, [RULES_1, RULES_2], ruleItemKey), ruleItemKey, rule => {
    const valid = range(1, 40).filter(i => runRule(rule, i) !== null)
    if (valid.length < 3) return null
    const inputs = shuffle(ctx.rng, valid).slice(0, 3).sort((a, b) => a - b)
    const pairs = inputs.map(i => [i, runRule(rule, i)!] as const)
    const fits = (r: Rule) => pairs.every(([i, o]) => runRule(r, i) === o)
    const pool = (rule.length === 1 ? RULES_1 : RULES_2).filter(r => !fits(r))
    const shares = pool.filter(r => r.some(s => rule.some(t => t[0] === s[0] && t[1] === s[1])))
    const wrong = take(ctx.rng, [shares, pool], 3, ruleLabel, [ruleLabel(rule)])
    if (!wrong) return null
    return {
      itemKey: ruleItemKey(rule), answer: ruleLabel(rule), say: [M6.machineRule], instruction: M6.machineRule, hint: M6.machineHint,
      prompt: { expr: pairs.map(([i, o]) => `${i} → ${o}`).join(', ') },
      options: shuffle(ctx.rng, [rule, ...wrong]).map(r => ({ id: ruleLabel(r), kind: 'number' as const, label: ruleLabel(r) })),
    }
  })
}

/* ---------- 54. Roman numerals and Hebrew letters ---------- */

type Dir = 'a' | 'b'
interface Numeral { n: number; dir: Dir }
const DIRS: Dir[] = ['a', 'b']
const byDir = (ns: readonly number[]): Numeral[][] => DIRS.map(dir => ns.map(n => ({ n, dir })))

const ROMAN_VALUE: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
/** What a child who ignores subtraction would read: IV → 6. */
const additive = (roman: string) => [...roman].reduce((s, c) => s + ROMAN_VALUE[c]!, 0)

/** Look-alike numbers first (±1, ±10, ±100 and the extras), then anything within 30. */
const neighbours = (n: number, lo: number, hi: number, extra: readonly number[]): number[][] => {
  const ok = (v: number) => v >= lo && v <= hi && v !== n
  return [unique([...extra, n + 1, n - 1, n + 10, n - 10, n + 100, n - 100]).filter(ok), range(n - 30, n + 30).filter(ok)]
}

const romanKey = (x: Numeral) => `rom:${x.n}:${x.dir}`
const ROMANS: Numeral[][] = [...byDir(range(1, 39)), ...byDir(range(40, 399)), ...byDir(range(400, 2000))]
export const romanAccepts = keyIn(ROMANS.flat(), romanKey)

/** XIV → pick 14 from four numbers (one is the additive misreading, 16), or 14 → pick XIV from four numerals. Up to 2,000. */
export function romanQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, ROMANS, romanKey), romanKey, ({ n, dir }) => {
    const roman = toRoman(n)
    const wrong = take(ctx.rng, neighbours(n, 1, 2000, [additive(roman)]), 3, str, [str(n)])
    if (!wrong) return null
    const all = shuffle(ctx.rng, [n, ...wrong])
    return dir === 'a'
      ? { itemKey: romanKey({ n, dir }), answer: str(n), say: [M6.roman], instruction: M6.roman, hint: M6.romanHint, prompt: { expr: roman }, options: all.map(numOption) }
      : {
        itemKey: romanKey({ n, dir }), answer: roman, say: [M6.romanWrite, ...spokenNumber(n)], instruction: M6.romanWrite, hint: M6.romanHint, prompt: { expr: fmt(n) },
        options: all.map(v => ({ id: toRoman(v), kind: 'number' as const, label: toRoman(v) })),
      }
  })
}

const swapDigits = (n: number) => {
  const d = str(n).split('')
  if (d.length < 2) return n
  ;[d[0], d[d.length - 1]] = [d[d.length - 1]!, d[0]!]
  return Number(d.join(''))
}
const gemKey = (x: Numeral) => `gem:${x.n}:${x.dir}`
const FIFTEENS = range(0, 9).flatMap(h => [100 * h + 15, 100 * h + 16])
const GEMATRIAS: Numeral[][] = [...byDir(FIFTEENS), ...byDir(range(1, 30)), ...byDir(range(31, 99)), ...byDir(range(100, 999))]
export const gematriaAccepts = keyIn(GEMATRIAS.flat(), gemKey)

/**
 * תשפ״ו → pick 786, or 786 → pick תשפ״ו. 1–999; a quarter of the items are 15, 16, 115, 116… (always ט״ו and ט״ז, never י״ה and י״ו).
 * The Hebrew options are text (right to left); they have no 🔊.
 */
export function gematriaQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, GEMATRIAS, gemKey), gemKey, ({ n, dir }) => {
    const wrong = take(ctx.rng, neighbours(n, 1, 999, [swapDigits(n), n % 100]), 3, str, [str(n)])
    if (!wrong) return null
    const all = shuffle(ctx.rng, [n, ...wrong])
    const letters = toGematria(n)
    return dir === 'a'
      ? { itemKey: gemKey({ n, dir }), answer: str(n), say: [M6.gematria], instruction: M6.gematria, hint: M6.gematriaHint, prompt: { word: { text: letters } }, options: all.map(numOption) }
      : {
        itemKey: gemKey({ n, dir }), answer: letters, say: [M6.gematriaWrite, ...spokenNumber(n)], instruction: M6.gematriaWrite, hint: M6.gematriaHint, prompt: { expr: fmt(n) },
        options: all.map(v => ({ id: toGematria(v), kind: 'text' as const, label: toGematria(v) })),
      }
  })
}

/* ---------- 55. multiplying fractions ---------- */

interface OfItem { a: number; b: number; n: number }
const ofKey = (x: OfItem) => `fo:${x.a}:${x.b}:${x.n}`
const OF_DENS = [[2, 3, 4], [5, 6], [8, 10]]
const OFS: OfItem[][] = OF_DENS.map(dens => dens.flatMap(b => range(1, b - 1).flatMap(a => range(2, 10).map(k => ({ a, b, n: b * k })))))
export const fractionOfAccepts = keyIn(OFS.flat(), ofKey)

/** `3/4 × 20 = ?` → 15. The whole is a multiple of the denominator, so the answer is whole. */
export function fractionOfQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, OFS, ofKey), ofKey, ({ a, b, n }) => ({
    itemKey: ofKey({ a, b, n }), answer: (a * n) / b, say: [M6.fractionOf, raw(fractionText(a, b)), OP.times, ...spokenNumber(n)], instruction: M6.fractionOf, hint: M4.partOfHint,
    maxDigits: 3, prompt: { expr: `${fracStr(a, b)} ${TIMES} ${n} = ?` },
  }))
}

interface GridItem { a: number; b: number; c: number; d: number }
const gridKey = (x: GridItem) => `fg:${x.a}:${x.b}:${x.c}:${x.d}`
const GRIDS: GridItem[] = range(2, 6).flatMap(b => range(2, 6).flatMap(d => range(1, b - 1).flatMap(a => range(1, d - 1).map(c => ({ a, b, c, d })))))
export const fractionGridAccepts = keyIn(GRIDS, gridKey)

/** `2/3 × 3/5`: a b-row, d-column grid; the first a rows and first c columns are tinted; shade the overlap (a·c squares). */
export function fractionGridQuestion(ctx: GenContext): ShadeQ {
  return make(ctx, GRIDS, gridKey, ({ a, b, c, d }) => ({
    itemKey: gridKey({ a, b, c, d }), answer: a * c, say: [M6.fractionGrid, raw(fractionText(a, b)), OP.times, raw(fractionText(c, d))], instruction: M6.fractionGrid,
    hint: M6.fractionGridHint, shape: 'rect', parts: b * d, rows: b, cols: d, bands: [a, c], show: `${fracStr(a, b)} ${TIMES} ${fracStr(c, d)}`,
  }))
}

interface BigItem { op: 'x' | 'd'; a: number; b: number; n: number }
const biggerKey = (x: BigItem) => `bs:${x.op}:${x.a}:${x.b}:${x.n}`
const SMALL_FRACS = range(2, 8).flatMap(b => range(1, b - 1).filter(a => gcd(a, b) === 1).map(a => [a, b] as const))
const BIG_FRACS = range(2, 5).flatMap(b => range(b + 1, 2 * b - 1).filter(a => gcd(a, b) === 1).map(a => [a, b] as const))
const BIGS: BigItem[][] = (['x', 'd'] as const).flatMap(op =>
  [SMALL_FRACS, BIG_FRACS].map(fs => fs.flatMap(([a, b]) => range(6, 60).map(n => ({ op, a, b, n })))),
)
export const biggerSmallerAccepts = keyIn(BIGS.flat(), biggerKey)

/** "Is 3/4 × 18 bigger or smaller than 18?" and "18 : 3/4". A fraction under 1 shrinks a product and grows a quotient; over 1 the reverse. */
export function biggerSmallerQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, BIGS, biggerKey), biggerKey, ({ op, a, b, n }) => {
    const grows = (a > b) === (op === 'x')
    const f = raw(fractionText(a, b))
    return {
      itemKey: biggerKey({ op, a, b, n }), answer: grows ? 'bigger' : 'smaller', instruction: M6.biggerSmaller, hint: M6.biggerHint,
      say: op === 'x' ? [M6.biggerSmaller, f, OP.times, ...spokenNumber(n)] : [M6.biggerSmaller, ...spokenNumber(n), OP.div, f],
      prompt: { expr: op === 'x' ? `${fracStr(a, b)} ${TIMES} ${n}` : `${n} ${DIV} ${fracStr(a, b)}` },
      options: shuffle(ctx.rng, [{ id: 'bigger', kind: 'text' as const, label: phrases[M6.bigger]!, say: M6.bigger }, { id: 'smaller', kind: 'text' as const, label: phrases[M6.smaller]!, say: M6.smaller }]),
    }
  })
}

/* ---------- 56. dividing fractions ---------- */

interface FitItem { form: 'w' | 'f'; x: number; d: number }
const fitKey = (x: FitItem) => `hf:${x.form}:${x.x}:${x.d}`
const FITS: FitItem[][] = [
  [2, 3, 4, 5, 6].flatMap(d => range(1, 3).map(x => ({ form: 'w' as const, x, d }))),
  [3, 4, 5, 6, 8].flatMap(d => range(2, d - 1).map(x => ({ form: 'f' as const, x, d }))),
]
export const howManyFitAccepts = keyIn(FITS.flat(), fitKey)

/** "How many 1/4 fit in 3?" → `3 : 1/4 = ?` (12), or `3/4 : 1/4 = ?` (3). The aid: the whole strip above one unit strip. */
export function howManyFitQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, FITS, fitKey), fitKey, ({ form, x, d }) => {
    const unit = raw(fractionText(1, d))
    return {
      itemKey: fitKey({ form, x, d }), answer: form === 'w' ? x * d : x, maxDigits: 2, instruction: M6.howManyFit, hint: M6.divideFractionHint,
      say: form === 'w' ? [M6.howManyFit, ...spokenNumber(x), OP.div, unit] : [M6.howManyFit, raw(fractionText(x, d)), OP.div, unit],
      prompt: { expr: `${form === 'w' ? x : fracStr(x, d)} ${DIV} ${fracStr(1, d)} = ?` },
      aidArt: [{ name: MATH_ART_4.strips, props: { a: '1/1', b: fracStr(1, d) } }],
    }
  })
}

interface UnitItem { n: number; d: number }
const unitKey = (x: UnitItem) => `du:${x.n}:${x.d}`
const UNITS: UnitItem[][] = [[2, 3, 4, 5], [6, 8, 10]].map(dens => dens.flatMap(d => range(2, 12).filter(n => n * d <= 100).map(n => ({ n, d }))))
export const divideUnitAccepts = keyIn(UNITS.flat(), unitKey)

/** `5 : 1/3 = ?` → 15: dividing by a unit fraction multiplies by its denominator. */
export function divideUnitQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, UNITS, unitKey), unitKey, ({ n, d }) => ({
    itemKey: unitKey({ n, d }), answer: n * d, say: [M.solve, ...spokenNumber(n), OP.div, raw(fractionText(1, d))], instruction: M.solve, hint: M6.divideFractionHint,
    maxDigits: 3, prompt: { expr: `${n} ${DIV} ${fracStr(1, d)} = ?` },
  }))
}

interface DivFrac { a: number; b: number; c: number; d: number }
const divFracKey = (x: DivFrac) => `df:${x.a}:${x.b}:${x.c}:${x.d}`
/** a/b : c/d = (a·d)/(b·c) in lowest terms. */
const divFracValue = (x: DivFrac): readonly [number, number] => {
  const [p, q] = [x.a * x.d, x.b * x.c]
  const g = gcd(p, q)
  return [p / g, q / g]
}
const DIV_FRACS: DivFrac[] = range(2, 10).flatMap(b => range(2, 10).filter(d => b % d === 0 || d % b === 0).flatMap(d =>
  range(1, b - 1).flatMap(a => range(1, d - 1).map(c => ({ a, b, c, d }))),
)).filter(x => {
  const [p, q] = divFracValue(x)
  return p !== q && q <= 8 && p <= 20
})
const DIV_FRAC_GROUPS: DivFrac[][] = [
  DIV_FRACS.filter(x => divFracValue(x)[0] < divFracValue(x)[1]),
  DIV_FRACS.filter(x => divFracValue(x)[1] === 1),
  DIV_FRACS.filter(x => divFracValue(x)[0] > divFracValue(x)[1] && divFracValue(x)[1] > 1),
]
export const divideFractionAccepts = keyIn(DIV_FRACS, divFracKey)

/** `3/4 : 3/8 = ?` → 2 (any equal fraction counts); results below 1, whole, and mixed. The whole-number box shows when the result is 1 or more. */
export function divideFractionQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, oneGroup(ctx, DIV_FRAC_GROUPS, divFracKey), divFracKey, x => {
    const [p, q] = divFracValue(x)
    return {
      itemKey: divFracKey(x), answer: toFraction(p, q), say: [M.solve, raw(fractionText(x.a, x.b)), OP.div, raw(fractionText(x.c, x.d))], instruction: M.solve,
      hint: M6.divideFractionHint, prompt: { expr: `${fracStr(x.a, x.b)} ${DIV} ${fracStr(x.c, x.d)} = ?` }, mixed: p >= q,
      aidStrips: [fracStr(x.a, x.b), fracStr(x.c, x.d)],
    }
  })
}

/* ---------- 57. multiplying and dividing decimals ---------- */

/** A decimal written with `places` digits after the point: value = i / 10^places, computed exactly. */
const dec = (i: number, places: number) => i / 10 ** places
const placesOf = (s: string) => (s.split('.')[1] ?? '').length
const typedDigits = (v: number) => fmtDec(v).replace('.', '').length

interface Where { x: string; y: string }
const whereKey = (w: Where) => `wp:${w.x}:${w.y}`
/** Both factors are tenths or whole numbers (at least one has a point), between 0.2 and 9.9; the product's digit string decides the options. */
function whereParts(w: Where) {
  const [pa, pb] = [placesOf(w.x), placesOf(w.y)]
  const [ai, bi] = [Math.round(Number(w.x) * 10 ** pa), Math.round(Number(w.y) * 10 ** pb)]
  const places = pa + pb
  let s = ai * bi
  let zeros = 0
  while (s % 10 === 0) { s /= 10; zeros++ }
  return { pa, pb, s, e: zeros - places }
}
/** Windows of four neighbouring powers of ten that contain the right one, show at most three decimals and stay under 100,000. */
const whereStarts = (s: number, e: number) => range(e - 3, e).filter(st => st >= -3 && s * 10 ** (st + 3) <= 100000)
function parseWhere(key: string): Where | null {
  const m = /^wp:(\d+(?:\.\d)?):(\d+(?:\.\d)?)$/.exec(key)
  if (!m) return null
  const w = { x: m[1]!, y: m[2]! }
  const [X, Y] = [Number(w.x), Number(w.y)]
  const { pa, pb, s, e } = whereParts(w)
  const ok = (v: number) => v >= 0.2 && v <= 9.9
  return ok(X) && ok(Y) && pa + pb > 0 && fmtDec(X) === w.x && fmtDec(Y) === w.y && whereStarts(s, e).length > 0 ? w : null
}
export const wherePointAccepts = (key: string) => parseWhere(key) !== null

const tenth = (rng: Rng) => fmtDec(dec(randInt(rng, 12, 99), 1))
const whereSampler = (draw: (rng: Rng) => [string, string]) => (rng: Rng): Where | null => {
  const [x, y] = draw(rng)
  const w = { x, y }
  return parseWhere(whereKey(w)) ? w : null
}

/** `2.4 × 1.5 = ?` → 0.36 · 3.6 · 36 · 360: the same digits (36) with the point in four places. */
export function wherePointQuestion(ctx: GenContext): PickQ {
  const w = sample(ctx, parseWhere, [
    whereSampler(rng => [tenth(rng), str(randInt(rng, 2, 9))]),
    whereSampler(rng => [tenth(rng), tenth(rng)]),
    whereSampler(rng => [str(randInt(rng, 2, 9)), fmtDec(dec(randInt(rng, 2, 9), 1))]),
    whereSampler(rng => [fmtDec(dec(randInt(rng, 2, 9), 1)), fmtDec(dec(randInt(rng, 2, 9), 1))]),
  ], whereKey)
  const { s, e } = whereParts(w)
  const start = pick(ctx.rng, whereStarts(s, e))
  const values = range(start, start + 3).map(k => (k >= 0 ? s * 10 ** k : s / 10 ** -k))
  const answer = fmtDec(e >= 0 ? s * 10 ** e : s / 10 ** -e)
  return {
    itemKey: whereKey(w), answer, say: [M6.wherePoint], instruction: M6.wherePoint, hint: M6.wherePointHint, prompt: { expr: `${w.x} ${TIMES} ${w.y} = ?` },
    options: shuffle(ctx.rng, values).map(v => ({ id: fmtDec(v), kind: 'number' as const, label: fmtDec(v), say: sayNum(v) })),
  }
}

interface Mental { op: 'x' | 'd'; a: number; b: number; ans: number }
const mentalKey = (m: Mental) => `dm:${m.op}:${fmtDec(m.a)}:${fmtDec(m.b)}`
const mulMental = (ai: number, pa: number, b: number): Mental => ({ op: 'x', a: dec(ai, pa), b, ans: dec(ai * b, pa) })
const MENTALS: Mental[][] = [
  range(2, 9).flatMap(t => [12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].map(b => mulMental(t, 1, b))),
  range(2, 9).flatMap(t => [10, 12, 15, 20, 25, 30, 40, 50, 100].map(b => mulMental(t, 2, b))),
  range(2, 9).flatMap(q => range(2, 12).filter(k => k * q <= 99).map((k): Mental => ({ op: 'd', a: dec(k * q, 1), b: dec(q, 1), ans: k }))),
  [1, 2, 4, 5].flatMap(q => range(1, 12).filter(n => (10 * n) % q === 0).map((n): Mental => ({ op: 'd', a: n, b: dec(q, 1), ans: (10 * n) / q }))),
].map(g => g.filter(m => typedDigits(m.ans) <= 3))
export const decimalMentalAccepts = keyIn(MENTALS.flat(), mentalKey)

/** `0.2 × 30`, `0.04 × 12`, `2.4 : 0.4`, `4 : 0.5` on the decimal pad; at most three decimal places, at most three digits typed. */
export function decimalMentalQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, MENTALS, mentalKey), mentalKey, m => ({
    itemKey: mentalKey(m), answer: m.ans, say: [M.solve, ...sayNum(m.a), m.op === 'x' ? OP.times : OP.div, ...sayNum(m.b)], instruction: M.solve, hint: M6.wherePointHint,
    maxDigits: 3, decimal: true, prompt: { expr: `${fmtDec(m.a)} ${m.op === 'x' ? TIMES : DIV} ${fmtDec(m.b)} = ?` },
  }))
}

interface Estimate { op: 'x' | 'd'; a: number; n: number }
const estKey = (e: Estimate) => `ep:${e.op}:${fmtDec(e.a)}:${e.n}`
const FACTORS_SMALL = [0.2, 0.25, 0.5, 0.75, 0.8, 0.9]
const FACTORS_BIG = [1.1, 1.2, 1.25, 1.5, 2.5, 3.5]
const ESTIMATES: Estimate[][] = (['x', 'd'] as const).flatMap(op => [FACTORS_SMALL, FACTORS_BIG].map(fs => fs.flatMap(a => range(12, 98).map(n => ({ op, a, n })))))
export const estimateProductAccepts = keyIn(ESTIMATES.flat(), estKey)

/** "Is 0.8 × 45 more or less than 45?" and "45 : 0.8 …": a factor under 1 shrinks a product and grows a quotient. */
export function estimateProductQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, ESTIMATES, estKey), estKey, ({ op, a, n }) => ({
    itemKey: estKey({ op, a, n }), answer: (a < 1) === (op === 'x') ? 'less' : 'more', say: [M.estimate, ...spokenNumber(n)], instruction: M.estimate, hint: M6.biggerHint,
    prompt: { expr: op === 'x' ? `${fmtDec(a)} ${TIMES} ${n} ? ${n}` : `${n} ${DIV} ${fmtDec(a)} ? ${n}` },
    options: shuffle(ctx.rng, [{ id: 'more', kind: 'sound' as const, say: M.moreThan }, { id: 'less', kind: 'sound' as const, say: M.lessThan }]),
  }))
}

/* ---------- 58. percent ---------- */

const BENCH = [1, 10, 20, 25, 40, 50, 60, 75, 80]
const BENCH_FRACTION: Record<number, readonly [number, number]> = { 1: [1, 100], 10: [1, 10], 20: [1, 5], 25: [1, 4], 40: [2, 5], 50: [1, 2], 60: [3, 5], 75: [3, 4], 80: [4, 5] }
/** Wholes that make the percent a whole number: multiples of 100 for 1%, of 20 for 25% and 75%, of 10 otherwise. */
const WHOLE_STEP: Record<number, number> = { 1: 100, 10: 10, 20: 10, 25: 20, 40: 10, 50: 10, 60: 10, 75: 20, 80: 10 }
const wholesFor = (p: number, max: number) => stepped(WHOLE_STEP[p]!, max, WHOLE_STEP[p]!)
const percentSay = (p: number) => (p === 1 ? 'אָחוּז אֶחָד' : `${p} אֲחוּזִים`)

interface PercentOf { p: number; n: number }
const percentKey = (x: PercentOf) => `po:${x.p}:${x.n}`
const percentGroups = (max: number): PercentOf[][] => BENCH.map(p => wholesFor(p, max).map(n => ({ p, n })))
const PERCENTS = percentGroups(1000)
const ARENA = percentGroups(200)
export const percentOfAccepts = keyIn(PERCENTS.flat(), percentKey)
export const percentArenaAccepts = keyIn(ARENA.flat(), percentKey)

function percentQuestion(ctx: GenContext, groups: readonly (readonly PercentOf[])[]): PadQ {
  return make(ctx, oneGroup(ctx, groups, percentKey), percentKey, ({ p, n }) => ({
    itemKey: percentKey({ p, n }), answer: (p * n) / 100, say: [M.solve, raw(`${percentSay(p)} מִתּוֹךְ ${n}`)], instruction: M.solve, hint: M6.percentHint, maxDigits: 3,
    prompt: { expr: `${p}% ${TIMES} ${fmt(n)} = ?` }, aidArt: [{ name: MATH_ART_6.percent, props: { p } }],
  }))
}

/** `25% × 80 = ?` → 20. The benchmark percents (1, 10, 20, 25, 40, 50, 60, 75, 80) of round wholes up to 1,000; the aid shades p of 100 squares. */
export const percentOfQuestion = (ctx: GenContext): PadQ => percentQuestion(ctx, PERCENTS)
/** The same facts and keys as percentOf, wholes up to 200, for the timed arena. */
export const percentArenaQuestion = (ctx: GenContext): PadQ => percentQuestion(ctx, ARENA)

type MatchKind = 'f' | 'd' | 'pf' | 'pd'
interface Match { p: number; kind: MatchKind }
const matchKey = (x: Match) => `pm:${x.p}:${x.kind}`
const MATCHES: Match[][] = (['f', 'd', 'pf', 'pd'] as const).map(kind => BENCH.map(p => ({ p, kind })))
export const percentMatchAccepts = keyIn(MATCHES.flat(), matchKey)
const pctOption = (p: number): PickOption => ({ id: `${p}%`, kind: 'number', label: `${p}%`, say: raw(percentSay(p)) })

/** `25%` → pick 1/4 or 0.25 from four (distractors: 1/25, 2.5, 0.025, other benchmarks); or `1/4` / `0.25` → pick 25% (benchmark percents only). */
export function percentMatchQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, MATCHES, matchKey), matchKey, ({ p, kind }) => {
    const [n, d] = BENCH_FRACTION[p]!
    const base = { itemKey: matchKey({ p, kind }), instruction: M6.percentMatch, hint: M6.percentHint }
    if (kind === 'f') {
      const label = fracStr(n, d)
      const others = BENCH.filter(q => q !== p).map(q => fracStr(...BENCH_FRACTION[q]!))
      const wrong = take(ctx.rng, [[fracStr(1, p), fracStr(p, 10)], others], 3, str, [label])
      if (!wrong) return null
      return {
        ...base, answer: label, say: [M6.percentMatch, raw(percentSay(p))], prompt: { expr: `${p}%` },
        options: shuffle(ctx.rng, [label, ...wrong]).map(l => {
          const [a, b] = l.split('/').map(Number) as [number, number]
          return { id: l, kind: 'number' as const, label: l, say: raw(fractionText(a, b)) }
        }),
      }
    }
    if (kind === 'd') {
      const value = p / 100
      const wrong = take(ctx.rng, [[p / 10, p / 1000, p].filter(v => v !== value), BENCH.filter(q => q !== p).map(q => q / 100)], 3, fmtDec, [fmtDec(value)])
      if (!wrong) return null
      return {
        ...base, answer: fmtDec(value), say: [M6.percentMatch, raw(percentSay(p))], prompt: { expr: `${p}%` },
        options: shuffle(ctx.rng, [value, ...wrong]).map(v => ({ id: fmtDec(v), kind: 'number' as const, label: fmtDec(v), say: sayNum(v) })),
      }
    }
    const nearest = BENCH.filter(q => q !== p).sort((a, b) => Math.abs(a - p) - Math.abs(b - p))
    const wrong = take(ctx.rng, [nearest.slice(0, 5), nearest], 3, str, [str(p)])
    if (!wrong) return null
    return {
      ...base, answer: `${p}%`, say: [M6.percentMatch], prompt: { expr: kind === 'pf' ? fracStr(n, d) : fmtDec(p / 100) },
      options: shuffle(ctx.rng, [p, ...wrong]).map(pctOption),
    }
  })
}

/* ---------- 59. discounts, price rises and the whole ---------- */

type StoryKind = 'whole' | 'discount' | 'rise'
interface StoryItem { kind: StoryKind; id: string; p: number; x: number; answer: number }
const STORY_PREFIX: Record<StoryKind, string> = { whole: 'pwh', discount: 'pdi', rise: 'pri' }
const storyKey = (s: StoryItem) => `${STORY_PREFIX[s.kind]}:${s.id}:${s.p}:${s.x}`
const PRICE_MAX: Record<string, number> = { shirt: 200, ball: 100, book: 100, ticket: 100 }
const WHOLE_MAX: Record<string, number> = { class: 100 }
const WHOLE_MIN: Record<string, number> = { savings: 100 }
const STORY_PERCENTS: Record<StoryKind, number[]> = { discount: [10, 20, 25, 40, 50], rise: [10, 20, 25, 50], whole: [10, 20, 25, 40, 50, 60, 75, 80] }

function storyItems(kind: StoryKind): StoryItem[][] {
  return PERCENT_STORIES.filter(s => s.kind === kind).map(s => STORY_PERCENTS[kind].flatMap((p): StoryItem[] => {
    if (kind === 'whole') {
      return wholesFor(p, WHOLE_MAX[s.id] ?? 500).filter(w => w >= (WHOLE_MIN[s.id] ?? 20)).map(w => ({ kind, id: s.id, p, x: (p * w) / 100, answer: w }))
    }
    return stepped(20, PRICE_MAX[s.id] ?? 200, 20).map(x => ({ kind, id: s.id, p, x, answer: (x * (kind === 'discount' ? 100 - p : 100 + p)) / 100 }))
  }))
}
const STORIES: Record<StoryKind, StoryItem[][]> = { whole: storyItems('whole'), discount: storyItems('discount'), rise: storyItems('rise') }
export const findWholeAccepts = keyIn(STORIES.whole.flat(), storyKey)
export const discountAccepts = keyIn(STORIES.discount.flat(), storyKey)
export const priceRiseAccepts = keyIn(STORIES.rise.flat(), storyKey)

function storyQuestion(ctx: GenContext, kind: StoryKind): PadQ {
  return make(ctx, oneGroup(ctx, STORIES[kind], storyKey), storyKey, s => {
    const text = PERCENT_STORIES.find(t => t.id === s.id)!.text.split('{p}').join(str(s.p)).split('{x}').join(str(s.x))
    return {
      itemKey: storyKey(s), answer: s.answer, say: [raw(text)], instruction: M6.percentStory, hint: kind === 'whole' ? M6.wholeHint : M6.percentHint, maxDigits: 3,
      prompt: { sentence: { text, say: raw(text) } },
    }
  })
}

/** "20% is 12 children. How many in the class?" Benchmark percents only; the part is whole, so is the answer. */
export const findWholeQuestion = (ctx: GenContext): PadQ => storyQuestion(ctx, 'whole')
/** "A shirt costs 80 ₪ with a 25% discount. What does it cost now?" Prices are multiples of 20, so every answer is whole. */
export const discountQuestion = (ctx: GenContext): PadQ => storyQuestion(ctx, 'discount')
/** "A book cost 60 ₪ and rose by 50%. What does it cost now?" */
export const priceRiseQuestion = (ctx: GenContext): PadQ => storyQuestion(ctx, 'rise')

/* ---------- 60. composite shapes ---------- */

type ShapeKind = 'L' | 'T' | 'U'
interface Shape { kind: ShapeKind; p: readonly number[]; t: number }
interface Placed { rects: CellRect[]; cols: number; rows: number }

const within = (v: number | undefined, lo: number, hi: number) => v !== undefined && Number.isInteger(v) && v >= lo && v <= hi

/**
 * L: [bar width, height, foot width, foot height] · T: [bar width, bar height, stem x, stem width, stem height] ·
 * U: [left width, right width, gap, height, bottom height]. `t` bits: 1 mirror left-right, 2 mirror top-bottom, 4 turn a quarter.
 */
function placeShape({ kind, p, t }: Shape): Placed | null {
  let rects: CellRect[]
  let w: number
  let h: number
  const [p0, p1, p2, p3, p4] = p
  if (!within(t, 0, 7)) return null
  if (kind === 'L' && p.length === 4 && within(p0, 1, 3) && within(p1, 3, 7) && within(p2, 1, 5) && within(p3, 1, Math.min(3, p1! - 1))) {
    rects = [[0, 0, p0!, p1!], [p0!, p1! - p3!, p2!, p3!]]
    w = p0! + p2!
    h = p1!
  } else if (kind === 'T' && p.length === 5 && within(p0, 3, 8) && within(p1, 1, 3) && within(p3, 1, 3) && within(p4, 1, 5) && within(p2, 1, p0! - p3! - 1)) {
    rects = [[0, 0, p0!, p1!], [p2!, p1!, p3!, p4!]]
    w = p0!
    h = p1! + p4!
  } else if (kind === 'U' && p.length === 5 && within(p0, 1, 3) && within(p1, 1, 3) && within(p2, 1, 4) && within(p3, 3, 7) && within(p4, 1, p3! - 1)) {
    rects = [[0, 0, p0!, p3!], [p0!, p3! - p4!, p2!, p4!], [p0! + p2!, 0, p1!, p3!]]
    w = p0! + p2! + p1!
    h = p3!
  } else return null
  const flipX = (t & 1) !== 0
  const flipY = (t & 2) !== 0
  const turn = (t & 4) !== 0
  const placed = rects.map(([x, y, rw, rh]): CellRect => {
    const fx = flipX ? w - x - rw : x
    const fy = flipY ? h - y - rh : y
    return turn ? [fy, fx, rh, rw] : [fx, fy, rw, rh]
  })
  return { rects: placed, cols: turn ? h : w, rows: turn ? w : h }
}

const shapeKey = (prefix: string, s: Shape) => `${prefix}:${s.kind}:${s.p.join('.')}:${s.t}`
function parseShape(prefix: string, key: string): Shape | null {
  const m = new RegExp(`^${prefix}:([LTU]):(\\d+(?:\\.\\d+){3,4}):([0-7])$`).exec(key)
  if (!m) return null
  const s: Shape = { kind: m[1] as ShapeKind, p: m[2]!.split('.').map(Number), t: Number(m[3]) }
  return placeShape(s) ? s : null
}

const shapeSampler = (kind: ShapeKind) => (rng: Rng): Shape | null => {
  const t = randInt(rng, 0, 7)
  let p: number[]
  if (kind === 'L') {
    const h = randInt(rng, 3, 7)
    p = [randInt(rng, 1, 3), h, randInt(rng, 1, 5), randInt(rng, 1, Math.min(3, h - 1))]
  } else if (kind === 'T') {
    const w = randInt(rng, 3, 8)
    const sw = randInt(rng, 1, Math.min(3, w - 2))
    p = [w, randInt(rng, 1, 3), randInt(rng, 1, w - sw - 1), sw, randInt(rng, 1, 5)]
  } else {
    const h = randInt(rng, 3, 7)
    p = [randInt(rng, 1, 3), randInt(rng, 1, 3), randInt(rng, 1, 4), h, randInt(rng, 1, h - 1)]
  }
  const s = { kind, p, t }
  return placeShape(s) ? s : null
}

const cellsOf = (rects: readonly CellRect[]) => new Set(rects.flatMap(([x, y, w, h]) => range(0, w * h - 1).map(i => `${x + (i % w)},${y + Math.floor(i / w)}`)))
const areaOf = (rects: readonly CellRect[]) => cellsOf(rects).size
/** Boundary edges: the sides of cells that touch no other cell of the shape. */
function perimeterOf(rects: readonly CellRect[]): number {
  const cells = cellsOf(rects)
  let edges = 0
  for (const c of cells) {
    const [x, y] = c.split(',').map(Number) as [number, number]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (!cells.has(`${x + dx},${y + dy}`)) edges++
  }
  return edges
}

const SHAPE_SAMPLERS = (['L', 'T', 'U'] as const).map(shapeSampler)
const parseArea = (key: string) => parseShape('ca', key)
const parsePerimeter = (key: string) => parseShape('cpm', key)
export const compositeAreaAccepts = (key: string) => parseArea(key) !== null
export const compositePerimeterAccepts = (key: string) => parsePerimeter(key) !== null

function compositeQuestion(ctx: GenContext, ask: 'area' | 'perimeter'): GridAreaQ {
  const prefix = ask === 'area' ? 'ca' : 'cpm'
  const s = sample(ctx, k => parseShape(prefix, k), SHAPE_SAMPLERS, x => shapeKey(prefix, x))
  const { rects, cols, rows } = placeShape(s)!
  const instruction = ask === 'area' ? M6.compositeArea : M6.compositePerimeter
  return {
    itemKey: shapeKey(prefix, s), answer: ask === 'area' ? areaOf(rects) : perimeterOf(rects), say: [instruction], instruction,
    hint: ask === 'area' ? M6.compositeHint : M6.perimeterHint, cols, rows, rects, mode: 'count', ask,
  }
}

/** An L, T or U made of 2–3 rectangles (mirrored and turned at random); count the squares. */
export const compositeAreaQuestion = (ctx: GenContext): GridAreaQ => compositeQuestion(ctx, 'area')
/** The same shapes; count the outside edges in cm. */
export const compositePerimeterQuestion = (ctx: GenContext): GridAreaQ => compositeQuestion(ctx, 'perimeter')

interface Scale { a: number; b: number; one?: boolean }
const scaleKey = (s: Scale) => `se:${s.a}:${s.b}${s.one ? ':1' : ''}`
const SCALES: Scale[] = range(1, 6).flatMap(a => range(1, 6).flatMap(b => [{ a, b }, { a, b, one: true }]))
export const scaleEffectAccepts = keyIn(SCALES, scaleKey)

/** `3 × 2 → 6 × 4`: both sides doubled → the area ×4 (G6 p.15); or only the length doubled (`3 × 2 → 6 × 2`) → ×2. */
export function scaleEffectQuestion(ctx: GenContext): PickQ {
  return make(ctx, SCALES, scaleKey, ({ a, b, one }) => ({
    itemKey: scaleKey({ a, b, one }), answer: one ? 'times2' : 'times4', say: [one ? M6.scaleLength : M6.scaleEffect],
    instruction: one ? M6.scaleLength : M6.scaleEffect, hint: M6.scaleHint,
    prompt: { expr: `${a} ${TIMES} ${b} → ${2 * a} ${TIMES} ${one ? b : 2 * b}` },
    options: shuffle(ctx.rng, [
      { id: 'times2', kind: 'text' as const, label: phrases[M6.times2]!, say: M6.times2 },
      { id: 'times4', kind: 'text' as const, label: phrases[M6.times4]!, say: M6.times4 },
      { id: 'same', kind: 'text' as const, label: phrases[M6.same]!, say: M6.same },
    ]),
  }))
}

/* ---------- 61. the circle ---------- */

const CIRCLE_PARTS: CirclePart[] = ['radius', 'diameter', 'chord', 'arc']
const partKey = (k: CirclePart) => `cpt:${k}`
export const circlePartsAccepts = keyIn(CIRCLE_PARTS, partKey)

/** "Tap the radius": a circle with a radius, a diameter, a chord and an arc to tap. */
export function circlePartsQuestion(ctx: GenContext): TapArtQ {
  return make(ctx, CIRCLE_PARTS, partKey, k => ({
    itemKey: partKey(k), answer: k, say: [findCirclePart(k)], instruction: findCirclePart(k), hint: M6.circleHint,
    art: { name: MATH_ART_6.circle, props: { parts: CIRCLE_PARTS.join(',') } }, parts: CIRCLE_PARTS,
  }))
}

/** Radii 3–12: at 1 and 2 the circumference and the area come out the same (π·r² = 2·π·r at r = 2). */
const RADII = range(3, 12)
const circKey = (r: number) => `circ:${r}`
const areaKey = (r: number) => `carea:${r}`
export const circumferenceAccepts = keyIn(RADII, circKey)
export const circleAreaAccepts = keyIn(RADII, areaKey)

/** With π ≈ 3.14, to one decimal place (integer maths: 3.14 = 314/100). */
const tenths = (hundredths: number) => Math.round(hundredths / 10) / 10
export const circumferenceOf = (r: number) => tenths(628 * r)
export const circleAreaOf = (r: number) => tenths(314 * r * r)

function circleQuestion(ctx: GenContext, area: boolean): PickQ {
  const key = area ? areaKey : circKey
  return make(ctx, RADII, key, r => {
    const values = [circumferenceOf(r), circleAreaOf(r), 2 * r, tenths(314 * r)]
    const right = area ? circleAreaOf(r) : circumferenceOf(r)
    if (new Set(values).size !== 4) return null
    const instruction = area ? M6.circleArea : M6.circumference
    return {
      itemKey: key(r), answer: fmtDec(right), say: [instruction], instruction, hint: M6.piHint,
      prompt: { art: [{ name: MATH_ART_6.circle, props: { parts: 'radius', r } }], artSize: 160 },
      options: shuffle(ctx.rng, values).map(v => ({ id: fmtDec(v), kind: 'number' as const, label: fmtDec(v) })),
    }
  })
}

/** "What is the circumference, about?" → 2·π·r, π·r (half), π·r² and 2·r, all to one decimal place. */
export const circumferenceQuestion = (ctx: GenContext): PickQ => circleQuestion(ctx, false)
/** "What is the area, about?" → the same four numbers. */
export const circleAreaQuestion = (ctx: GenContext): PickQ => circleQuestion(ctx, true)

/* ---------- 62. volume ---------- */

interface Dims { l: number; w: number; h: number }
const cubesKey = (d: Dims) => `cub:${d.l}:${d.w}:${d.h}`
const CUBES: Dims[] = range(1, 5).flatMap(l => range(1, 5).flatMap(w => range(1, 5).map(h => ({ l, w, h })))).filter(d => d.l * d.w * d.h > 1)
export const countCubesAccepts = keyIn(CUBES, cubesKey)

/** A box of unit cubes drawn in 3D, each side 1–5: type how many cubes. The aid says: the bottom layer, times the layers. */
export function countCubesQuestion(ctx: GenContext): PadQ {
  return make(ctx, CUBES, cubesKey, d => ({
    itemKey: cubesKey(d), answer: d.l * d.w * d.h, say: [M6.countCubes], instruction: M6.countCubes, hint: M6.volumeHint, maxDigits: 3,
    prompt: { art: [{ name: MATH_ART_6.cubes, props: { ...d } }], artSize: 200 },
  }))
}

const boxKey = (d: Dims) => `bv:${d.l}:${d.w}:${d.h}`
const BOXES: Dims[] = range(2, 10).flatMap(l => range(l, 10).flatMap(w => range(w, 10).map(h => ({ l, w, h })))).filter(d => d.l * d.w * d.h <= 600)
export const boxVolumeAccepts = keyIn(BOXES, boxKey)

/** `3 × 4 × 5 = ?` (sides 2–10, volume up to 600), the factors in a random order. */
export function boxVolumeQuestion(ctx: GenContext): PadQ {
  return make(ctx, BOXES, boxKey, d => {
    const sides = shuffle(ctx.rng, [d.l, d.w, d.h])
    return {
      itemKey: boxKey(d), answer: d.l * d.w * d.h, maxDigits: 3, instruction: M6.boxVolume, hint: M6.volumeHint,
      say: [M6.boxVolume, ...sides.flatMap((s, i) => (i ? [OP.times, ...spokenNumber(s)] : spokenNumber(s)))],
      prompt: { expr: `${sides.join(` ${TIMES} `)} = ?` },
    }
  })
}

const volumeKey = (id: string) => `vu:${id}`
export const volumeUnitAccepts = keyIn(SENSIBLE_VOLUMES, v => volumeKey(v.id))

/** "What is the volume of a pool?" → 500 מ״ק · 500 מ״ל · 500 סמ״ק · 5 ל׳. Silent options: the unit is the thing to read. */
export function volumeUnitQuestion(ctx: GenContext): PickQ {
  return make(ctx, SENSIBLE_VOLUMES, v => volumeKey(v.id), v => ({
    itemKey: volumeKey(v.id), answer: v.right, say: [sensibleVolume(v.id)], instruction: sensibleVolume(v.id), prompt: {},
    options: shuffle(ctx.rng, [v.right, ...v.wrong]).map(l => ({ id: l, kind: 'text' as const, label: l })),
  }))
}

/* ---------- 63. the mean ---------- */

const listKey = (prefix: string, vs: readonly number[]) => `${prefix}:${vs.join(',')}`
const parseList = (s: string): number[] | null => (/^\d+(,\d+)*$/.test(s) ? s.split(',').map(Number) : null)
const sum = (vs: readonly number[]) => vs.reduce((a, b) => a + b, 0)
const allSame = (vs: readonly number[]) => vs.every(v => v === vs[0])
const randomValues = (rng: Rng, n: number, lo: number, hi: number) => range(1, n).map(() => randInt(rng, lo, hi))

function parseLevel(key: string): number[] | null {
  const vs = /^lb:(.+)$/.exec(key) && parseList(key.slice(3))
  return vs && vs.length >= 3 && vs.length <= 6 && vs.every(v => v >= 1 && v <= 9) && sum(vs) % vs.length === 0 && !allSame(vs) ? vs : null
}
export const levelBarsAccepts = (key: string) => parseLevel(key) !== null
const levelSampler = (n: number) => (rng: Rng): number[] | null => {
  const vs = randomValues(rng, n, 1, 9)
  return sum(vs) % n === 0 && !allSame(vs) ? vs : null
}

/** 3–6 bars of 1–9 blocks whose mean is a whole number; level them (the shared height is the mean). */
export function levelBarsQuestion(ctx: GenContext): MeanQ {
  const vs = sample(ctx, parseLevel, range(3, 6).map(levelSampler), v => listKey('lb', v))
  return { itemKey: listKey('lb', vs), answer: sum(vs) / vs.length, say: [M6.levelBars], instruction: M6.levelBars, hint: M6.levelHint, values: vs }
}

/** Mean of `vs` is whole, or has exactly one decimal place. */
const meanKind = (vs: readonly number[]): 'whole' | 'tenth' | null =>
  sum(vs) % vs.length === 0 ? 'whole' : (10 * sum(vs)) % vs.length === 0 ? 'tenth' : null
function parseFind(key: string): number[] | null {
  const vs = /^fm:(.+)$/.exec(key) && parseList(key.slice(3))
  return vs && vs.length >= 4 && vs.length <= 6 && vs.every(v => v >= 1 && v <= 20) && meanKind(vs) !== null ? vs : null
}
export const findMeanAccepts = (key: string) => parseFind(key) !== null
const findSampler = (kind: 'whole' | 'tenth') => (rng: Rng): number[] | null => {
  const vs = randomValues(rng, randInt(rng, 4, 6), 1, 20)
  return meanKind(vs) === kind ? vs : null
}

/** Type the mean of 4–6 numbers (1–20): whole or to one decimal place, equally often. */
export function findMeanQuestion(ctx: GenContext): PadQ {
  const vs = sample(ctx, parseFind, [findSampler('whole'), findSampler('tenth')], v => listKey('fm', v))
  return {
    itemKey: listKey('fm', vs), answer: sum(vs) / vs.length, say: [M6.findMean, ...vs.flatMap(spokenNumber)], instruction: M6.findMean, hint: M6.meanHint,
    maxDigits: 3, decimal: true, prompt: { expr: vs.join(', ') },
  }
}

type TruthKind = 'in' | 'wh' | 'ad'
interface Truth { kind: TruthKind; vs: number[]; x: number }
const truthKey = (t: Truth) => (t.kind === 'ad' ? `mt:ad:${t.vs.join(',')}:${t.x}` : `mt:${t.kind}:${t.vs.join(',')}`)
const meanOf = (vs: readonly number[]) => sum(vs) / vs.length
/** "3, 5 וְ־10" */
const listText = (vs: readonly number[]) => (vs.length === 1 ? str(vs[0]) : `${vs.slice(0, -1).join(', ')} וְ־${vs[vs.length - 1]}`)

function parseTruth(key: string): Truth | null {
  const m = /^mt:(in|wh|ad):(\d+(?:,\d+)*)(?::(\d+))?$/.exec(key)
  if (!m) return null
  const kind = m[1] as TruthKind
  const vs = parseList(m[2]!)!
  const x = m[3] === undefined ? 0 : Number(m[3])
  const mean = meanOf(vs)
  const ok = vs.length >= 3 && vs.length <= 5 && vs.every(v => v >= 0 && v <= 20) && meanKind(vs) !== null && (kind === 'ad') === (m[3] !== undefined) && mean > 0
  if (!ok) return null
  if (kind === 'ad' && !(x === 0 || x === mean || (x >= 1 && x <= 20))) return null
  return { kind, vs, x }
}
export const meanTruthsAccepts = (key: string) => parseTruth(key) !== null

const truthSampler = (kind: TruthKind) => (rng: Rng): Truth | null => {
  const vs = randomValues(rng, randInt(rng, 3, 5), 1, 15)
  const mean = meanOf(vs)
  if (meanKind(vs) === null) return null
  if (kind === 'in') return { kind, vs, x: 0 }
  if (kind === 'wh') return { kind, vs, x: 0 }
  if (!Number.isInteger(mean)) return null
  return { kind, vs, x: pick(rng, [0, mean, randInt(rng, 1, 20)]) }
}

/**
 * Statements about the mean, read by the browser voice: "the mean of 3, 5 and 10 is 6. Is 6 one of the numbers?", "…is the mean a whole
 * number?", "a 0 is added; does the mean change?" (adding the mean itself changes nothing). Yes or no.
 */
export function meanTruthsQuestion(ctx: GenContext): PickQ {
  const t = sample(ctx, parseTruth, (['in', 'wh', 'ad'] as const).map(truthSampler), truthKey)
  const mean = meanOf(t.vs)
  const head = `הַמְּמֻצָּע שֶׁל ${listText(t.vs)} הוּא ${fmtDec(mean)}.`
  const [text, yes] =
    t.kind === 'in' ? [`${head} הַאִם ${fmtDec(mean)} הוּא אֶחָד הַמִּסְפָּרִים?`, t.vs.includes(mean)]
    : t.kind === 'wh' ? [`${head} הַאִם הַמְּמֻצָּע הוּא מִסְפָּר שָׁלֵם?`, Number.isInteger(mean)]
    : [`${head} מוֹסִיפִים עוֹד ${t.x}. הַאִם הַמְּמֻצָּע יִשְׁתַּנֶּה?`, t.x !== mean] as const
  return {
    itemKey: truthKey(t), answer: yes ? 'yes' : 'no', say: [M6.trueOrNot, raw(text)], instruction: M6.trueOrNot, hint: M6.meanHint, prompt: { sentence: { text, say: raw(text) } },
    options: [textOption(M4.yes), textOption(M4.no)].map(o => ({ ...o, id: o.id === M4.yes ? 'yes' : 'no' })),
  }
}
