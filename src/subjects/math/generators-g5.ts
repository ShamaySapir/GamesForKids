import { raw } from '../../core/audio/audio'
import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { SHARE_STORIES } from './content/share-stories'
import { SURVEYS } from './content/surveys'
import { M, M3, M4, M5, OP, UNIT_LABEL, digitValue, surveyPhrase } from './ids'
import { decimalText, fmt, fmtDec, fractionText, numberPhrase, spokenNumber } from './numbers'
import { phrases } from './phrases'
import {
  MATH_ART_4, MATH_ART_5, type BinsQ, type ColumnQ, type FactorTreeQ, type Fraction, type FractionPadQ, type PadQ, type PlaceQ, type PlaceValueQ,
  type SlantAreaQ, type SolidKind,
} from './types'

// Pure question generators for the numbers island, 5th grade (skills 42–52), one per game. Spec: docs/specs/math-grade5.md.
// Same style as generators-g4.ts (its helpers are private there, so the few needed are copied here).
// Numbers shown to the child go through fmt() (commas from five digits) and fmtDec() (decimals); spoken numbers through
// spokenNumber(), raw(decimalText(x)) and raw(fractionText(n, d)). Decimal answers are JS numbers rounded to 3 places.
// Fractions in prompts and options are written 'a/b' (mixed '2 3/4'); the shared MathText stacks them.
//
// Item keys (short, unique per game; each game's Accepts function recognises only its own):
//   42  dvb:N:D           digit D (once in N) in N (7–9 digits)    cmp9:A:B     compare two numbers (6–9 digits)
//       tpx:A:P / tpd:A:P  A × P / A : P (P = 10, 100, 1000)
//   43  prime:n1,…,n8     sorted, always with 1 and 2              rect:N       how many rectangles of area N
//       ft:N              factor tree of N
//   44  lb1:NUM:DEN:K     NUM/DEN on a line 0–K                    mixm:NUM:DEN improper to mixed    mixi:W:NUM:DEN mixed to improper
//       fad:STORY:N:D     N things shared by D children
//   45  simp:N:D          simplify N/D                             exp:N:D:E    N/D = ?/E             fcu:A:B:C:D   A/B ? C/D (unlike)
//       btw:A:B:C:D       a fraction between A/B and C/D
//   46  au:A:B:C:D        A/B + C/D                                amx:W1:A:B:W2:C:D   mixed + mixed
//       clo:K:A:B:C:D     closest to (K h: 0, ½, 1 · K w: 1, 2, 3) for A/B + C/D
//   47  dh:X              build X in the decimal house             slx:X:P / sld:X:P  X × P / X : P     dfa:NUM:DEN  decimal to fraction
//       dfb:NUM:DEN       fraction to decimal
//   48  cd:A:B            compare two decimals as written ('0.5', '0.50')   dl1:X / dl10:X  marker on 0–1 / 0–10
//       rdw:X / rdt:X     round X to the whole / to the tenth
//   49  cold:A+B / cold:A-B    ch:T  price T tenths of a shekel    mcd:M:C  M m C cm = ? m      mcc:M:C  M.CC m = ? cm
//   50  ph:SHAPE:R        which segment is the height (R × 30° turn)    ta:O:B:H:DX:S  triangle     pa:O:B:H:S:U  parallelogram
//   51  sn:KIND           which net folds into the solid           fe:KIND:Q    faces, edges or vertices of the solid
//   52  mode:ID:i.c,…     category i with count c

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
const keyIn = <T>(items: readonly T[], key: (t: T) => string) => {
  const keys = new Set(items.map(key))
  return (k: string) => keys.has(k)
}
const str = String
const digitsOf = (n: number) => str(n).split('').map(Number)
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b
const dec3 = (x: number) => Number(x.toFixed(3))

const PLUS = '+'
const TIMES = '×'
const DIV = ':'

const numOption = (v: number): PickOption => ({ id: str(v), kind: 'number', label: fmt(v), say: spokenNumber(v) })
const decOption = (v: number): PickOption => ({ id: fmtDec(v), kind: 'number', label: fmtDec(v), say: raw(decimalText(v)) })
const fracOption = (n: number, d: number): PickOption => ({ id: `${n}/${d}`, kind: 'number', label: `${n}/${d}`, say: raw(fractionText(n, d)) })

const SIGNS = ['<', '=', '>'] as const
type Sign = (typeof SIGNS)[number]
const SIGN_SAY: Readonly<Record<Sign, string>> = { '<': OP.less, '=': OP.equals, '>': OP.greater }
const signOf = (a: number, b: number): Sign => (a < b ? '<' : a > b ? '>' : '=')
const signOptions = (): PickOption[] => SIGNS.map(s => ({ id: s, kind: 'number' as const, label: s, say: SIGN_SAY[s] }))

/** n distinct numbers, the answer plus wrong ones drawn tier by tier, shuffled, shown by `option`. */
function valueOptions(rng: Rng, answer: number, n: number, tiers: readonly (readonly number[])[], option: (v: number) => PickOption): PickOption[] | null {
  const wrong = take(rng, tiers, n - 1, v => option(v).id, [option(answer).id])
  if (!wrong) return null
  return shuffle(rng, [answer, ...wrong]).map(option)
}

/** The exact value num/den as a Fraction: a mixed number from 1 up (7/4 → 1 3/4), else just num/den. */
const toFraction = (num: number, den: number): Fraction => (num >= den ? { whole: Math.floor(num / den), num: num % den, den } : { num, den })
const reduced = (num: number, den: number): Fraction => {
  const g = gcd(num, den)
  return { num: num / g, den: den / g }
}
const strips = (...fs: [number, number][]) => fs.filter(([, d]) => d <= 12).map(([n, d]) => `${n}/${d}`)
const FRACTION_DENS = [...range(2, 10), 12]

/** Integer thousandths of a decimal written as text ('3.05' → 3050); null when it is not 'digits' or 'digits.digits' (≤ 3 places). */
function thousandths(s: string): number | null {
  const m = /^(\d{1,3})(?:\.(\d{1,3}))?$/.exec(s)
  return m ? Number(m[1]) * 1000 + Number((m[2] ?? '').padEnd(3, '0')) : null
}
const places = (s: string) => (s.split('.')[1] ?? '').length
/** A decimal from a whole part and its decimal digits as an integer: (3, 2, 5) → 3.05 ('2 places, digits 5'). */
const decimalOf = (whole: number, p: number, digits: number) => dec3(whole + digits / 10 ** p)
/** Decimal digits with a non-zero last digit, so the number really has `p` places. */
const placeDigits = (rng: Rng, p: number) => {
  for (;;) {
    const d = randInt(rng, 1, 10 ** p - 1)
    if (d % 10 !== 0) return d
  }
}

/* ---------- 42. numbers above a million ---------- */

interface DigitItem { n: number; d: number }
const dvKey = (x: DigitItem) => `dvb:${x.n}:${x.d}`
function parseDv(key: string): DigitItem | null {
  const m = /^dvb:([1-9]\d{6,8}):([1-9])$/.exec(key)
  if (!m) return null
  const n = Number(m[1])
  const d = Number(m[2])
  return digitsOf(n).filter(x => x === d).length === 1 ? { n, d } : null
}
export const digitValueBigAccepts = (key: string) => parseDv(key) !== null

const dvSampler = (digits: 7 | 8 | 9) => (rng: Rng): DigitItem | null => {
  const n = randInt(rng, 10 ** (digits - 1), 10 ** digits - 1)
  const ds = digitsOf(n)
  const unique = ds.filter(d => d > 0 && ds.filter(x => x === d).length === 1)
  return unique.length ? { n, d: pick(rng, unique) } : null
}

/** "What is the 7 worth in 37,245,018?" → four place values of that digit (70,000,000 · 7,000,000 · 700,000 · 70,000); one is right. */
export function digitValueBigQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseDv, [dvSampler(7), dvSampler(8), dvSampler(9)], dvKey)
  const text = str(x.n)
  const k = text.length - 1 - text.indexOf(str(x.d))
  const start = pick(ctx.rng, range(Math.max(0, k - 3), Math.min(5, k)))
  const values = range(start, start + 3).map(j => x.d * 10 ** j)
  return {
    itemKey: dvKey(x), answer: str(x.d * 10 ** k), say: [digitValue(x.d)], instruction: digitValue(x.d), prompt: { expr: fmt(x.n) },
    options: shuffle(ctx.rng, values).map(numOption),
  }
}

/** Numbers that differ from `n` in one digit or by swapping two of its digits, with the same number of digits. */
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
const cmpKey = (p: Pair) => `cmp9:${p.a}:${p.b}`
const isBoundary = (a: number, b: number) => {
  const [lo, hi] = [Math.min(a, b), Math.max(a, b)]
  return [1e6, 1e7, 1e8].some(p => lo >= p - 10000 && lo < p && hi >= p && hi < p + 10000)
}
function parseCmp(key: string): Pair | null {
  const m = /^cmp9:([1-9]\d{5,8}):([1-9]\d{5,8})$/.exec(key)
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  const { swaps, changes } = partners(a)
  return a === b || (str(a).length === str(b).length && (swaps.includes(b) || changes.includes(b))) || isBoundary(a, b) ? { a, b } : null
}
export const compareBigAccepts = (key: string) => parseCmp(key) !== null

const cmpNumber = (rng: Rng) => randInt(rng, 1000000, 10 ** randInt(rng, 7, 9) - 1)

/** `37,245,018 ? 37,245,108` → <, = or > (always in this order). One place or a swap apart, sometimes equal, sometimes 9,999,999 vs 10,000,000. */
export function compareBigQuestion(ctx: GenContext): PickQ {
  const p = sample(ctx, parseCmp, [
    rng => { const a = cmpNumber(rng); return { a, b: a } },
    rng => { const a = cmpNumber(rng); const { swaps } = partners(a); return swaps.length ? { a, b: pick(rng, swaps) } : null },
    rng => { const a = cmpNumber(rng); return { a, b: pick(rng, partners(a).changes) } },
    rng => { const a = cmpNumber(rng); return { a, b: pick(rng, partners(a).changes) } },
    rng => {
      const k = 10 ** randInt(rng, 6, 8)
      const x = randInt(rng, k - 10000, k - 1)
      const y = randInt(rng, k, k + 9999)
      return rng() < 0.5 ? { a: x, b: y } : { a: y, b: x }
    },
  ], cmpKey)
  return {
    itemKey: cmpKey(p), answer: signOf(p.a, p.b), say: M.compare, instruction: M.compare, prompt: { expr: `${fmt(p.a)} ? ${fmt(p.b)}` }, options: signOptions(),
  }
}

interface Power { mul: boolean; a: number; p: 10 | 100 | 1000 }
const POWERS = [10, 100, 1000] as const
/** 2–99 (not a multiple of 10) followed by 0–3 zeros: 34, 340, 3,400, 34,000. */
const BASES = range(2, 99).filter(m => m % 10 !== 0).flatMap(m => range(0, 3).map(z => m * 10 ** z))
const POWER_ITEMS: Power[][] = [
  BASES.flatMap(a => POWERS.map(p => ({ mul: true, a, p }))),
  BASES.flatMap(a => POWERS.map(p => ({ mul: false, a: a * p, p }))),
]
const powerKey = (x: Power) => `tp${x.mul ? 'x' : 'd'}:${x.a}:${x.p}`
export const timesPowerAccepts = keyIn(POWER_ITEMS.flat(), powerKey)

/** `3,400 × 1,000 = ?` and `52,000,000 : 1,000 = ?` on the pad; results below a billion. The aid slides the digits (hint). */
export function timesPowerQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, POWER_ITEMS, powerKey), powerKey, x => ({
    itemKey: powerKey(x), answer: x.mul ? x.a * x.p : x.a / x.p, maxDigits: 9, instruction: M.solve, hint: M3.slideHint,
    say: [M.solve, ...spokenNumber(x.a), x.mul ? OP.times : OP.div, ...spokenNumber(x.p)],
    prompt: { expr: `${fmt(x.a)} ${x.mul ? TIMES : DIV} ${fmt(x.p)} = ?` },
  }))
}

/* ---------- 43. primes and composites ---------- */

const isPrime = (n: number) => n >= 2 && range(2, Math.floor(Math.sqrt(n))).every(d => n % d !== 0)
const primeFactors = (n: number): number[] => {
  const out: number[] = []
  let r = n
  for (let d = 2; r > 1; d++) while (r % d === 0) { out.push(d); r /= d }
  return out
}
/** Bin index: 0 prime, 1 composite, 2 neither (only 1). */
const binOf = (n: number) => (n === 1 ? 2 : isPrime(n) ? 0 : 1)
const PRIMES_3_50 = range(3, 50).filter(isPrime)
const COMPOSITES = range(4, 50).filter(n => !isPrime(n))

const primeKey = (items: readonly number[]) => `prime:${[...items].sort((a, b) => a - b).join(',')}`
function parsePrime(key: string): number[] | null {
  const m = /^prime:(\d+(?:,\d+){7})$/.exec(key)
  if (!m) return null
  const items = m[1]!.split(',').map(Number)
  const sorted = [...items].sort((a, b) => a - b)
  const others = items.filter(n => n > 2)
  const primes = others.filter(isPrime).length
  const ok = new Set(items).size === 8 && sorted.join() === items.join() && items.every(n => n >= 1 && n <= 50) && items.includes(1) && items.includes(2) &&
    primes >= 2 && primes <= 4 && others.length - primes >= 2
  return ok ? items : null
}
export const primeOrNotAccepts = (key: string) => parsePrime(key) !== null

/** Eight numbers from 1–50 for three bins: 1 and 2 are always there (1 is neither, 2 is prime); the rest 2–4 primes and 2–4 composites. */
export function primeOrNotQuestion(ctx: GenContext): BinsQ {
  const items = sample(ctx, parsePrime, [rng => {
    const k = randInt(rng, 2, 4)
    return [1, 2, ...shuffle(rng, PRIMES_3_50).slice(0, k), ...shuffle(rng, COMPOSITES).slice(0, 6 - k)].sort((a, b) => a - b)
  }], primeKey)
  const shown = shuffle(ctx.rng, items)
  return {
    itemKey: primeKey(items), answer: shown.map(binOf), say: M5.primeOrNot, instruction: M5.primeOrNot, hint: M5.primeHint, items: shown,
    bins: [M5.prime, M5.composite, M5.neither],
  }
}

/** How many different rectangles have area n (a × b and b × a are one). */
const rectanglesOf = (n: number) => range(1, Math.floor(Math.sqrt(n))).filter(a => n % a === 0).length
const RECT_ITEMS = range(2, 36)
const rectKey = (n: number) => `rect:${n}`
export const rectanglesOfNAccepts = keyIn(RECT_ITEMS, rectKey)

/** "How many different rectangles can you build from 12 squares?" A prime has one. The aid draws them all on a grid. */
export function rectanglesOfNQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [RECT_ITEMS.filter(isPrime), RECT_ITEMS.filter(n => !isPrime(n))], rectKey), rectKey, n => ({
    itemKey: rectKey(n), answer: rectanglesOf(n), say: [M5.rectangles, ...numberPhrase(n)], instruction: M5.rectangles, hint: M5.rectanglesHint, maxDigits: 1,
    prompt: n <= 20 ? { objects: [{ emoji: '🟦', count: n, layout: 'row' }] } : { expr: `${n} 🟦` },
    aidArt: [{ name: MATH_ART_5.rects, props: { n } }],
  }))
}

const COMPOSITE_ITEMS = range(12, 100).filter(n => !isPrime(n))
const ftKey = (n: number) => `ft:${n}`
export const factorTreeAccepts = keyIn(COMPOSITE_ITEMS, ftKey)

/** Break a composite number 12–100 into primes; half the numbers have exactly two prime factors, half three or more. */
export function factorTreeQuestion(ctx: GenContext): FactorTreeQ {
  return make(ctx, oneGroup(ctx, [COMPOSITE_ITEMS.filter(n => primeFactors(n).length === 2), COMPOSITE_ITEMS.filter(n => primeFactors(n).length > 2)], ftKey), ftKey, n => ({
    itemKey: ftKey(n), answer: primeFactors(n), say: M5.factorTree, instruction: M5.factorTree, hint: M5.factorHint, n,
  }))
}

/* ---------- 44. fractions beyond one ---------- */

interface Beyond { num: number; den: number; k: number }
const BEYOND_DENS = [2, 3, 4, 5, 6, 8, 10]
const BEYOND: Beyond[][] = BEYOND_DENS.map(den => [2, 3].flatMap(k => range(den + 1, den * k - 1).filter(num => num % den !== 0).map(num => ({ num, den, k }))))
const beyondKey = (x: Beyond) => `lb1:${x.num}:${x.den}:${x.k}`
export const lineBeyond1Accepts = keyIn(BEYOND.flat(), beyondKey)

/** Place 7/4 on a line from 0 to 2 (or 3) divided into quarters (positions in units of 1/den); only 0 and the whole numbers are labelled. */
export function lineBeyond1Question(ctx: GenContext): PlaceQ {
  return make(ctx, oneGroup(ctx, BEYOND, beyondKey), beyondKey, ({ num, den, k }) => ({
    itemKey: beyondKey({ num, den, k }), answer: num, say: [M.place, raw(fractionText(num, den))], instruction: M.place, hint: M4.fractionLineHint, target: num, tolerance: 0,
    line: { min: 0, max: den * k, step: 1, labelEvery: den, den },
  }))
}

interface Mix { toMixed: boolean; whole: number; r: number; den: number }
const MIX_DENS = [2, 3, 4, 5, 6, 8, 10]
const MIX: Mix[][] = [true, false].map(toMixed =>
  MIX_DENS.flatMap(den => range(1, den - 1).filter(r => gcd(r, den) === 1).flatMap(r => range(1, 5).map(whole => ({ toMixed, whole, r, den })))),
)
const mixKey = (x: Mix) => (x.toMixed ? `mixm:${x.whole * x.den + x.r}:${x.den}` : `mixi:${x.whole}:${x.r}:${x.den}`)
export const mixedImproperAccepts = keyIn(MIX.flat(), mixKey)

/** `11/4` → write it as a mixed number (2 3/4), or `2 3/4` → one fraction (11/4). Remainders are coprime with the denominator. */
export function mixedImproperQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, oneGroup(ctx, MIX, mixKey), mixKey, ({ toMixed, whole, r, den }) => {
    const num = whole * den + r
    return toMixed
      ? {
        itemKey: mixKey({ toMixed, whole, r, den }), answer: { whole, num: r, den }, say: [M5.asMixed, raw(fractionText(num, den))], instruction: M5.asMixed, hint: M5.mixedHint,
        // simplest: only the real mixed form counts here (not 0 11/4, not 2 6/8)
        prompt: { expr: `${num}/${den}` }, mixed: true, simplest: true,
      }
      : {
        itemKey: mixKey({ toMixed, whole, r, den }), answer: { num, den }, say: [M5.asImproper, raw(fractionText(r, den, whole))], instruction: M5.asImproper, hint: M5.mixedHint,
        prompt: { expr: `${whole} ${r}/${den}` }, mixed: false,
      }
  })
}

interface Share { id: string; n: number; d: number }
/** {n} 2–5 (the stories use plurals), {d} 2–8, never a whole number of items each. */
const SHARE_ITEMS: Share[][] = [
  SHARE_STORIES.flatMap(s => range(2, 5).flatMap(n => range(2, 8).filter(d => n < d).map(d => ({ id: s.id, n, d })))),
  SHARE_STORIES.flatMap(s => range(2, 5).flatMap(n => range(2, 8).filter(d => n > d && n % d !== 0).map(d => ({ id: s.id, n, d })))),
]
const shareKey = (x: Share) => `fad:${x.id}:${x.n}:${x.d}`
export const fractionAsDivisionAccepts = keyIn(SHARE_ITEMS.flat(), shareKey)
const shareText = (x: Share) => SHARE_STORIES.find(s => s.id === x.id)!.text.split('{n}').join(str(x.n)).split('{d}').join(str(x.d))

/** "3 pizzas shared by 4 children: how much does each get?" → 3/4 (read by the browser voice, D23). More items than children gives a mixed number. */
export function fractionAsDivisionQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, oneGroup(ctx, SHARE_ITEMS, shareKey), shareKey, x => {
    const text = shareText(x)
    const g = gcd(x.n, x.d)
    return {
      itemKey: shareKey(x), answer: toFraction(x.n / g, x.d / g), say: raw(text), instruction: M5.eachGets, hint: M5.shareHint,
      prompt: { sentence: { text, say: raw(text) } }, mixed: x.n > x.d,
    }
  })
}

/* ---------- 45. equivalent fractions ---------- */

interface Frac2 { a: number; b: number }
const simpKey = (x: Frac2) => `simp:${x.a}:${x.b}`
function parseSimp(key: string): Frac2 | null {
  const m = /^simp:([1-9]\d?):([1-9]\d?)$/.exec(key)
  if (!m) return null
  const [a, b] = [Number(m[1]), Number(m[2])]
  return b >= 4 && b <= 60 && a < b && gcd(a, b) > 1 ? { a, b } : null
}
export const simplifyAccepts = (key: string) => parseSimp(key) !== null

const simpSampler = (minDen: number, maxDen: number) => (rng: Rng): Frac2 | null => {
  for (let i = 0; i < 200; i++) {
    const b = randInt(rng, minDen, maxDen)
    const a = randInt(rng, 1, b - 1)
    if (gcd(a, b) > 1) return { a, b }
  }
  return null
}

/** `6/8 = ?` in simplest form (only the simplest form counts); denominators up to 60, half of them up to 20. */
export function simplifyQuestion(ctx: GenContext): FractionPadQ {
  const { a, b } = sample(ctx, parseSimp, [simpSampler(4, 20), simpSampler(21, 60)], simpKey)
  const answer = reduced(a, b)
  return {
    itemKey: simpKey({ a, b }), answer, say: [M5.simplify, raw(fractionText(a, b))], instruction: M5.simplify, hint: M5.simplifyHint,
    prompt: { expr: `${a}/${b} = ?` }, mixed: false, simplest: true, aidStrips: strips([a, b], [answer.num, answer.den]),
  }
}

interface Expand { a: number; b: number; k: number }
const EXPAND_ITEMS: Expand[] = range(2, 10).flatMap(b => range(1, b - 1).filter(a => gcd(a, b) === 1).flatMap(a => range(2, 10).map(k => ({ a, b, k }))))
const expKey = (x: Expand) => `exp:${x.a}:${x.b}:${x.b * x.k}`
export const expandAccepts = keyIn(EXPAND_ITEMS, expKey)

/** `3/4 = ?/20`: type the numerator over the given denominator (the pad accepts any equal value). */
export function expandQuestion(ctx: GenContext): FractionPadQ {
  return make(ctx, EXPAND_ITEMS, expKey, ({ a, b, k }) => ({
    itemKey: expKey({ a, b, k }), answer: { num: a * k, den: b * k }, say: [M5.expand, raw(fractionText(a, b))], instruction: M5.expand, hint: M5.expandHint,
    prompt: { expr: `${a}/${b} = ?/${b * k}` }, mixed: false, aidStrips: strips([a, b], [a * k, b * k]),
  }))
}

interface Cmp4 { a: number; b: number; c: number; d: number }
const fcuKey = (x: Cmp4) => `fcu:${x.a}:${x.b}:${x.c}:${x.d}`
function parseFcu(key: string): Cmp4 | null {
  const m = /^fcu:(\d+):(\d+):(\d+):(\d+)$/.exec(key)
  if (!m) return null
  const [a, b, c, d] = m.slice(1).map(Number) as [number, number, number, number]
  return FRACTION_DENS.includes(b) && FRACTION_DENS.includes(d) && b !== d && a >= 1 && a < b && c >= 1 && c < d ? { a, b, c, d } : null
}
export const compareUnlikeAccepts = (key: string) => parseFcu(key) !== null

/** Random fractions below 1 over the allowed denominators, until `ok` accepts the four numbers. */
const fractionPair = (ok: (x: Cmp4) => boolean) => (rng: Rng): Cmp4 | null => {
  for (let i = 0; i < 600; i++) {
    const b = pick(rng, FRACTION_DENS)
    const d = pick(rng, FRACTION_DENS)
    const x = { a: randInt(rng, 1, b - 1), b, c: randInt(rng, 1, d - 1), d }
    if (b !== d && ok(x)) return x
  }
  return null
}
const related = (x: Cmp4) => x.b % x.d === 0 || x.d % x.b === 0
const equalValue = (x: Cmp4) => x.a * x.d === x.c * x.b

/** `3/4 ? 5/6` → <, = or > with different denominators: related (2 and 4), unrelated, or equal in value (1/2 and 3/6). The aid draws both strips. */
export function compareUnlikeQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseFcu, [
    fractionPair(y => related(y) && !equalValue(y)),
    fractionPair(y => !related(y) && !equalValue(y)),
    fractionPair(y => !related(y) && !equalValue(y)),
    fractionPair(equalValue),
  ], fcuKey)
  return {
    itemKey: fcuKey(x), answer: signOf(x.a * x.d, x.c * x.b), say: M.compare, instruction: M.compare, hint: M4.compareFractionHint,
    prompt: { expr: `${x.a}/${x.b} ? ${x.c}/${x.d}` },
    aidArt: [{ name: MATH_ART_4.strips, props: { a: `${x.a}/${x.b}`, b: `${x.c}/${x.d}` } }],
    options: signOptions(),
  }
}

const btwKey = (x: Cmp4) => `btw:${x.a}:${x.b}:${x.c}:${x.d}`
function parseBtw(key: string): Cmp4 | null {
  const m = /^btw:(\d+):(\d+):(\d+):(\d+)$/.exec(key)
  if (!m) return null
  const [a, b, c, d] = m.slice(1).map(Number) as [number, number, number, number]
  return FRACTION_DENS.includes(b) && FRACTION_DENS.includes(d) && a >= 1 && c >= 1 && a < b && c < d && a * d < c * b ? { a, b, c, d } : null
}
export const betweenAccepts = (key: string) => parseBtw(key) !== null

const adjacent = (rng: Rng): Cmp4 => {
  const b = randInt(rng, 3, 10)
  const a = randInt(rng, 1, b - 2)
  return { a, b, c: a + 1, d: b }
}
const unlikePair = (rng: Rng): Cmp4 | null => {
  const x = fractionPair(y => y.a * y.d !== y.c * y.b)(rng)
  return x && (x.a * x.d < x.c * x.b ? x : { a: x.c, b: x.d, c: x.a, d: x.b })
}

/**
 * "Write a fraction between 1/4 and 2/4": adjacent numerators (the 'nothing lies between' misconception) or unlike denominators.
 * Any value strictly between is right; the example is their average. The aid draws the two strips.
 */
export function betweenQuestion(ctx: GenContext): FractionPadQ {
  const x = sample(ctx, parseBtw, [adjacent, adjacent, unlikePair], btwKey)
  const L = lcm(x.b, x.d)
  const answer = reduced((x.a * (L / x.b)) + (x.c * (L / x.d)), 2 * L)
  return {
    itemKey: btwKey(x), answer, say: [M5.between, raw(fractionText(x.a, x.b)), M.betweenAnd, raw(fractionText(x.c, x.d))], instruction: M5.between, hint: M5.betweenHint,
    prompt: { expr: `${x.a}/${x.b} , ${x.c}/${x.d}` }, mixed: false, between: [{ num: x.a, den: x.b }, { num: x.c, den: x.d }],
    aidStrips: strips([x.a, x.b], [x.c, x.d]),
  }
}

/* ---------- 46. adding fractions with unlike denominators ---------- */

const coprimeDens = (x: Cmp4) => gcd(x.b, x.d) === 1
const sharedDens = (x: Cmp4) => gcd(x.b, x.d) > 1 && !related(x)
const dens2 = (b: number, d: number) => FRACTION_DENS.includes(b) && FRACTION_DENS.includes(d) && b !== d

const auKey = (x: Cmp4) => `au:${x.a}:${x.b}:${x.c}:${x.d}`
function parseAu(key: string): Cmp4 | null {
  const m = /^au:(\d+):(\d+):(\d+):(\d+)$/.exec(key)
  if (!m) return null
  const [a, b, c, d] = m.slice(1).map(Number) as [number, number, number, number]
  return dens2(b, d) && a >= 1 && a < b && c >= 1 && c < d ? { a, b, c, d } : null
}
export const addUnlikeAccepts = (key: string) => parseAu(key) !== null

/** `1/2 + 2/3 = ?` and `3/4 + 1/6 = ?`: coprime denominators, or ones that share a factor (4 and 6). Any equivalent answer counts; the aid draws the strips. */
export function addUnlikeQuestion(ctx: GenContext): FractionPadQ {
  const x = sample(ctx, parseAu, [fractionPair(coprimeDens), fractionPair(coprimeDens), fractionPair(sharedDens)], auKey)
  const L = lcm(x.b, x.d)
  const num = x.a * (L / x.b) + x.c * (L / x.d)
  return {
    itemKey: auKey(x), answer: toFraction(num, L), say: [M.solve, raw(fractionText(x.a, x.b)), OP.plus, raw(fractionText(x.c, x.d))], instruction: M.solve, hint: M4.commonDenHint,
    prompt: { expr: `${x.a}/${x.b} ${PLUS} ${x.c}/${x.d} = ?` }, mixed: num >= L || ctx.rng() < 0.3, aidStrips: strips([x.a, x.b], [x.c, x.d]),
  }
}

interface MixAdd { w1: number; a: number; b: number; w2: number; c: number; d: number }
const amxKey = (x: MixAdd) => `amx:${x.w1}:${x.a}:${x.b}:${x.w2}:${x.c}:${x.d}`
function parseAmx(key: string): MixAdd | null {
  const m = /^amx:(\d+):(\d+):(\d+):(\d+):(\d+):(\d+)$/.exec(key)
  if (!m) return null
  const [w1, a, b, w2, c, d] = m.slice(1).map(Number) as [number, number, number, number, number, number]
  return dens2(b, d) && w1 >= 1 && w1 <= 4 && w2 >= 1 && w2 <= 4 && a >= 1 && a < b && c >= 1 && c < d ? { w1, a, b, w2, c, d } : null
}
export const addMixedAccepts = (key: string) => parseAmx(key) !== null

const mixAdd = (ok: (x: Cmp4) => boolean) => (rng: Rng): MixAdd | null => {
  const x = fractionPair(ok)(rng)
  return x && { w1: randInt(rng, 1, 4), a: x.a, b: x.b, w2: randInt(rng, 1, 4), c: x.c, d: x.d }
}

/** `2 1/3 + 1 1/2 = ?`: two mixed numbers, coprime or sharing a factor; the answer is a mixed number (any equivalent form counts). */
export function addMixedQuestion(ctx: GenContext): FractionPadQ {
  const x = sample(ctx, parseAmx, [mixAdd(coprimeDens), mixAdd(coprimeDens), mixAdd(sharedDens)], amxKey)
  const L = lcm(x.b, x.d)
  const num = (x.w1 + x.w2) * L + x.a * (L / x.b) + x.c * (L / x.d)
  return {
    itemKey: amxKey(x), answer: toFraction(num, L), say: [M.solve, raw(fractionText(x.a, x.b, x.w1)), OP.plus, raw(fractionText(x.c, x.d, x.w2))], instruction: M.solve,
    hint: M4.commonDenHint, prompt: { expr: `${x.w1} ${x.a}/${x.b} ${PLUS} ${x.w2} ${x.c}/${x.d} = ?` }, mixed: true,
  }
}

interface Closest { kind: 'h' | 'w' }
type ClosestItem = Cmp4 & Closest
const cloKey = (x: ClosestItem) => `clo:${x.kind}:${x.a}:${x.b}:${x.c}:${x.d}`
/** Targets in halves: h → 0, ½, 1 · w → 1, 2, 3. */
const TARGETS2 = { h: [0, 1, 2], w: [2, 4, 6] } as const

/**
 * The target nearest to a/b + c/d, in exact integers; null on a tie or when two targets are within 0.1 of being equally near
 * (such sums would be a coin toss for an estimate), or when the sum is far from every target.
 */
function closestTarget(x: ClosestItem): number | null {
  const sum2 = 2 * (x.a * x.d + x.c * x.b) // twice the numerator over b·d
  const den = x.b * x.d
  const dist = TARGETS2[x.kind].map(t => Math.abs(sum2 - t * den)).sort((p, q) => p - q)
  const best = TARGETS2[x.kind].findIndex(t => Math.abs(sum2 - t * den) === dist[0])
  const value = (x.a * x.d + x.c * x.b) / den
  const inRange = x.kind === 'h' ? value >= 0.15 && value <= 1.35 : value >= 0.7 && value <= 3.3
  return inRange && dist[1]! - dist[0]! >= 0.2 * den ? best : null
}
function parseClo(key: string): ClosestItem | null {
  const m = /^clo:([hw]):(\d+):(\d+):(\d+):(\d+)$/.exec(key)
  if (!m) return null
  const [a, b, c, d] = m.slice(2).map(Number) as [number, number, number, number]
  const x: ClosestItem = { kind: m[1] as 'h' | 'w', a, b, c, d }
  const maxNum = (den: number) => (x.kind === 'h' ? den - 1 : 2 * den - 1)
  return dens2(b, d) && a >= 1 && a <= maxNum(b) && c >= 1 && c <= maxNum(d) && closestTarget(x) !== null ? x : null
}
export const closestToAccepts = (key: string) => parseClo(key) !== null

const closestSampler = (kind: 'h' | 'w') => (rng: Rng): ClosestItem | null => {
  for (let i = 0; i < 600; i++) {
    const b = pick(rng, FRACTION_DENS)
    const d = pick(rng, FRACTION_DENS)
    const top = (den: number) => (kind === 'h' ? den - 1 : 2 * den - 1)
    const x: ClosestItem = { kind, a: randInt(rng, 1, top(b)), b, c: randInt(rng, 1, top(d)), d }
    if (b !== d && closestTarget(x) !== null) return x
  }
  return null
}

/** "Is 7/8 + 5/9 closest to 1, 2 or 3?" (or to 0, ½ or 1 for small sums). An estimate, never a tie. */
export function closestToQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseClo, [closestSampler('h'), closestSampler('w')], cloKey)
  const options: PickOption[] = x.kind === 'h'
    ? [{ id: '0', kind: 'number', label: '0', say: numberPhrase(0) }, fracOption(1, 2), { id: '1', kind: 'number', label: '1', say: numberPhrase(1) }]
    : [1, 2, 3].map(n => ({ id: str(n), kind: 'number' as const, label: str(n), say: numberPhrase(n) }))
  return {
    itemKey: cloKey(x), answer: options[closestTarget(x)!]!.id, say: [M5.closest, raw(fractionText(x.a, x.b)), OP.plus, raw(fractionText(x.c, x.d))], instruction: M5.closest,
    hint: M5.closestHint, prompt: { expr: `${x.a}/${x.b} ${PLUS} ${x.c}/${x.d}` }, options,
  }
}

/* ---------- 47. decimals ---------- */

const dhKey = (x: number) => `dh:${fmtDec(x)}`
function parseDh(key: string): number | null {
  const m = /^dh:(\d{1,3})\.(\d{1,3})$/.exec(key)
  return m && !m[2]!.endsWith('0') ? Number(`${m[1]}.${m[2]}`) : null
}
export const decimalHouseAccepts = (key: string) => parseDh(key) !== null

const dhSampler = (p: 1 | 2 | 3) => (rng: Rng): number => {
  const r = rng()
  const whole = r < 0.25 ? 0 : r < 0.55 ? randInt(rng, 1, 9) : r < 0.9 ? randInt(rng, 10, 99) : randInt(rng, 100, 999)
  return decimalOf(whole, p, placeDigits(rng, p))
}

/** Build 3.05 in a house with tenths, hundredths and (up to) thousandths columns after the point; 2 or 3 whole-number columns. */
export function decimalHouseQuestion(ctx: GenContext): PlaceValueQ {
  const x = sample(ctx, parseDh, [dhSampler(1), dhSampler(2), dhSampler(3)], dhKey)
  const p = places(fmtDec(x)) as 1 | 2 | 3
  return {
    itemKey: dhKey(x), answer: x, say: [M.build, raw(decimalText(x))], instruction: M.build, show: fmtDec(x), columns: x >= 100 ? 3 : pick(ctx.rng, [2, 3] as const), decimals: p,
  }
}

interface Slide { mul: boolean; x: number; p: 10 | 100 | 1000 }
const slideKey = (s: Slide) => `sl${s.mul ? 'x' : 'd'}:${fmtDec(s.x)}:${s.p}`
const slideAnswer = (s: Slide) => dec3(s.mul ? s.x * s.p : s.x / s.p)
function parseSlide(key: string): Slide | null {
  const m = /^sl([xd]):(\d{1,3}(?:\.\d{1,3})?):(10|100|1000)$/.exec(key)
  if (!m) return null
  const x = thousandths(m[2]!)
  const s: Slide = { mul: m[1] === 'x', x: Number(m[2]), p: Number(m[3]) as Slide['p'] }
  const p0 = places(m[2]!)
  const ok = x !== null && x > 0 && (p0 === 0 || !m[2]!.endsWith('0')) && (s.mul ? p0 >= 1 : x % s.p === 0)
  return ok ? s : null
}
export const slideDigitsAccepts = (key: string) => parseSlide(key) !== null

const slideSampler = (mul: boolean) => (rng: Rng): Slide | null => {
  for (let i = 0; i < 200; i++) {
    const p0 = mul ? randInt(rng, 1, 3) : randInt(rng, 0, 2)
    const m = randInt(rng, 1, 999)
    if (p0 > 0 && m % 10 === 0) continue
    const x = dec3(m / 10 ** p0)
    const s: Slide = { mul, x, p: pick(rng, POWERS) }
    if (parseSlide(slideKey(s)) && fmtDec(x).length <= 7) return s
  }
  return null
}

/** `3.45 × 100 = ?` and `3.4 : 100 = ?`, up to three decimal places in the answer. The aid shows the digits sliding across the house (the point stays). */
export function slideDigitsQuestion(ctx: GenContext): PadQ {
  const s = sample(ctx, parseSlide, [slideSampler(true), slideSampler(false)], slideKey)
  const answer = slideAnswer(s)
  return {
    itemKey: slideKey(s), answer, say: [M.solve, raw(decimalText(s.x)), s.mul ? OP.times : OP.div, ...spokenNumber(s.p)], instruction: M.solve, hint: M5.slideHint, maxDigits: 7,
    decimal: true, prompt: { expr: `${fmtDec(s.x)} ${s.mul ? TIMES : DIV} ${fmt(s.p)} = ?` },
    aidArt: [{ name: MATH_ART_5.house, props: { before: fmtDec(s.x), after: fmtDec(answer) } }],
  }
}

interface DecFrac { toFraction: boolean; num: number; den: number }
const DF_DENS = [2, 4, 5, 10, 20, 25, 50, 100]
const DF_POOL = DF_DENS.flatMap(den => range(1, den - 1).filter(num => gcd(num, den) === 1).map(num => ({ num, den })))
const DF_ITEMS: DecFrac[][] = [true, false].map(toFraction => DF_POOL.map(f => ({ toFraction, ...f })))
const dfKey = (x: DecFrac) => `df${x.toFraction ? 'a' : 'b'}:${x.num}:${x.den}`
export const decimalFractionAccepts = keyIn(DF_ITEMS.flat(), dfKey)

/** `0.25` → pick 1/4 among fractions, or `1/4` → pick 0.25 among decimals (denominators 2, 4, 5, 10, 20, 25, 50, 100; fractions in lowest terms). */
export function decimalFractionQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, DF_ITEMS, dfKey), dfKey, x => {
    const value = dec3(x.num / x.den)
    if (x.toFraction) {
      const near = DF_POOL.filter(f => f.den === x.den || f.num === x.num)
      const wrong = take(ctx.rng, [near, DF_POOL], 3, f => `${f.num}/${f.den}`, [`${x.num}/${x.den}`])
      if (!wrong) return null
      return {
        itemKey: dfKey(x), answer: `${x.num}/${x.den}`, say: [M5.sameValue, raw(decimalText(value))], instruction: M5.sameValue, prompt: { expr: fmtDec(value) },
        options: shuffle(ctx.rng, [x, ...wrong]).map(f => fracOption(f.num, f.den)),
      }
    }
    const digits = dec3(Number(`0.${x.num}${x.den}`))
    const tenths = dec3(x.num < 10 ? x.num / 10 : x.num / 100)
    const options = valueOptions(ctx.rng, value, 4, [[digits, tenths].filter(v => v !== value), DF_POOL.map(f => dec3(f.num / f.den))], decOption)
    if (!options) return null
    return {
      itemKey: dfKey(x), answer: fmtDec(value), say: [M5.sameValue, raw(fractionText(x.num, x.den))], instruction: M5.sameValue, prompt: { expr: `${x.num}/${x.den}` }, options,
    }
  })
}

/* ---------- 48. ordering decimals ---------- */

/** Two decimals written as given ('0.5' and '0.50' are equal; '2.10' and '2.9'). */
interface DecPair { a: string; b: string }
const cdKey = (x: DecPair) => `cd:${x.a}:${x.b}`
const DEC_SHAPE = /^\d{1,2}(?:\.\d{1,3})?$/
function parseCd(key: string): DecPair | null {
  const m = /^cd:([^:]+):([^:]+)$/.exec(key)
  if (!m || !DEC_SHAPE.test(m[1]!) || !DEC_SHAPE.test(m[2]!) || m[1] === m[2]) return null
  return { a: m[1]!, b: m[2]! }
}
export const compareDecimalsAccepts = (key: string) => parseCd(key) !== null

/** Decimal digits as written: `digits` as a string of exactly `p` places ('05'). */
const written = (w: number, p: number, digits: number) => `${w}.${str(digits).padStart(p, '0')}`
const cdSamplers: ((rng: Rng) => DecPair | null)[] = [
  // 3.05 vs 3.5: the longer decimal is the smaller one (or not)
  rng => {
    const w = randInt(rng, 0, 20)
    const t = randInt(rng, 1, 9)
    const h = randInt(rng, 1, 99)
    return h % 10 === 0 || Math.floor(h / 10) === t ? null : rng() < 0.5 ? { a: written(w, 2, h), b: written(w, 1, t) } : { a: written(w, 1, t), b: written(w, 2, h) }
  },
  // 0.5 vs 0.50 (equal) and 0.5 vs 0.500
  rng => {
    const w = randInt(rng, 0, 20)
    const t = randInt(rng, 1, 9)
    const p = randInt(rng, 2, 3)
    const long = `${written(w, 1, t)}${'0'.repeat(p - 1)}`
    return rng() < 0.5 ? { a: written(w, 1, t), b: long } : { a: long, b: written(w, 1, t) }
  },
  // 2.10 vs 2.9: a trailing zero makes it look longer than it is
  rng => {
    const w = randInt(rng, 0, 20)
    const t = randInt(rng, 1, 8)
    const u = randInt(rng, t + 1, 9)
    const withZero = `${written(w, 1, t)}0`
    return rng() < 0.5 ? { a: withZero, b: written(w, 1, u) } : { a: written(w, 1, u), b: withZero }
  },
  // anything else with the same whole part
  rng => {
    const w = randInt(rng, 0, 20)
    const pa = randInt(rng, 1, 3)
    const pb = randInt(rng, 1, 3)
    const a = written(w, pa, randInt(rng, 1, 10 ** pa - 1))
    const b = written(w, pb, randInt(rng, 1, 10 ** pb - 1))
    return a === b ? null : { a, b }
  },
]

/** `3.05 ? 3.5` → <, = or >, compared as numbers (the digits are shown as written, trailing zeros kept: `0.5 ? 0.50`). */
export function compareDecimalsQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseCd, cdSamplers, cdKey)
  return {
    itemKey: cdKey(x), answer: signOf(thousandths(x.a)!, thousandths(x.b)!), say: M.compare, instruction: M.compare, hint: M5.decimalCompareHint,
    prompt: { expr: `${x.a} ? ${x.b}` }, options: signOptions(),
  }
}

interface DecLine { top: 1 | 10; x: number }
const dlKey = (l: DecLine) => `dl${l.top}:${fmtDec(l.x)}`
function parseDl(key: string): DecLine | null {
  const m = /^dl(1|10):(\d(?:\.\d)?)$/.exec(key)
  if (!m) return null
  const top = Number(m[1]) as 1 | 10
  const x = Number(m[2])
  const tenths = Math.round(x * 10)
  return tenths % 10 !== 0 && tenths > 0 && tenths < top * 10 ? { top, x } : null
}
export const decimalLineAccepts = (key: string) => parseDl(key) !== null

const dlSampler = (top: 1 | 10) => (rng: Rng): DecLine => {
  for (;;) {
    const tenths = randInt(rng, 1, top * 10 - 1)
    if (tenths % 10 !== 0) return { top, x: tenths / 10 }
  }
}

/** Place 0.7 on a line 0–1 (ticks every tenth) or 3.4 on a line 0–10 (ticks every 1, the marker moves by 0.1). Only 0 and the whole numbers are labelled. */
export function decimalLineQuestion(ctx: GenContext): PlaceQ {
  const l = sample(ctx, parseDl, [dlSampler(1), dlSampler(10)], dlKey)
  return {
    itemKey: dlKey(l), answer: l.x, say: [M.place, raw(decimalText(l.x))], instruction: M.place, target: l.x, tolerance: 0.01,
    line: l.top === 1 ? { min: 0, max: 1, step: 0.1, labelEvery: 1, snap: 0.1 } : { min: 0, max: 10, step: 1, labelEvery: 1, snap: 0.1 },
  }
}

interface Rounding { whole: boolean; x: number }
const rdKey = (r: Rounding) => `rd${r.whole ? 'w' : 't'}:${fmtDec(r.x)}`
function parseRd(key: string): Rounding | null {
  const m = /^rd([wt]):(\d{1,2}\.\d{1,3})$/.exec(key)
  if (!m || m[2]!.endsWith('0')) return null
  const whole = m[1] === 'w'
  const p = places(m[2]!)
  return whole ? (p <= 2 ? { whole, x: Number(m[2]) } : null) : p >= 2 ? { whole, x: Number(m[2]) } : null
}
export const roundDecimalAccepts = (key: string) => parseRd(key) !== null

const rdSampler = (whole: boolean, tie: boolean) => (rng: Rng): Rounding | null => {
  const w = randInt(rng, whole ? 1 : 0, 99)
  const p1 = randInt(rng, 1, 2)
  if (whole) return tie ? { whole, x: w + 0.5 } : { whole, x: decimalOf(w, p1, placeDigits(rng, p1)) }
  const p = randInt(rng, 2, 3)
  // a tie at the hundredths digit: ...x5 (the hundredths digit is 5)
  const digits = tie ? randInt(rng, 0, 9) * 10 ** (p - 1) + 5 * 10 ** (p - 2) + (p === 3 ? randInt(rng, 1, 9) - 0 : 0) : placeDigits(rng, p)
  return digits % 10 === 0 ? null : { whole, x: decimalOf(w, p, digits) }
}

/**
 * "Round 3.46 to the nearest whole number" (3) or "to the tenths" (3.5): the number is shown as it is and 5 rounds up.
 * Distractors are the other direction and the other place.
 */
export function roundDecimalQuestion(ctx: GenContext): PickQ {
  const r = sample(ctx, parseRd, [rdSampler(true, false), rdSampler(true, true), rdSampler(false, false), rdSampler(false, true)], rdKey)
  const x3 = thousandths(fmtDec(r.x))!
  const unit = r.whole ? 1000 : 100
  const down = x3 - (x3 % unit)
  const up = down + unit
  const answer = x3 % unit >= unit / 2 ? up : down
  const wrongWay = answer === up ? down : up
  const otherPlace = r.whole ? [100, 10] : [1000, 10]
  const wrongPlace = otherPlace.map(u => (x3 % u >= u / 2 ? x3 - (x3 % u) + u : x3 - (x3 % u)))
  const valid = (vs: number[]) => vs.filter(v => v >= 0 && v !== answer).map(v => dec3(v / 1000))
  const options = valueOptions(ctx.rng, dec3(answer / 1000), 4, [valid([wrongWay]), valid(wrongPlace), valid([answer + unit, answer - unit, answer + 2 * unit])], decOption)
  const instruction = r.whole ? M5.roundWhole : M5.roundTenth
  return {
    itemKey: rdKey(r), answer: fmtDec(dec3(answer / 1000)), say: [instruction, raw(decimalText(r.x))], instruction, hint: M3.roundHint, prompt: { expr: fmtDec(r.x) },
    options: options ?? [],
  }
}

/* ---------- 49. adding and subtracting decimals ---------- */

interface ColDec { a: number; b: number; op: '+' | '-' }
const colDecKey = (c: ColDec) => `cold:${fmtDec(c.a)}${c.op}${fmtDec(c.b)}`
const colDecResult = (c: ColDec) => dec3(c.op === '+' ? c.a + c.b : c.a - c.b)
const colPlaces = (c: ColDec) => Math.max(places(fmtDec(c.a)), places(fmtDec(c.b))) as 1 | 2 | 3
function parseColDec(key: string): ColDec | null {
  const m = /^cold:(\d{1,2}\.\d{1,3})([+-])(\d{1,2}\.\d{1,3})$/.exec(key)
  if (!m || m[1]!.endsWith('0') || m[3]!.endsWith('0')) return null
  const c: ColDec = { a: Number(m[1]), b: Number(m[3]), op: m[2] as ColDec['op'] }
  return c.op === '+' || c.a > c.b ? c : null
}
export const columnDecimalAccepts = (key: string) => parseColDec(key) !== null

const colDecSampler = (op: ColDec['op'], p: 1 | 2 | 3) => (rng: Rng): ColDec | null => {
  // one operand has all p places, the other 1–p (they need not match)
  const [pa, pb] = rng() < 0.5 ? [p, randInt(rng, 1, p)] : [randInt(rng, 1, p), p]
  const whole = () => randInt(rng, 1, rng() < 0.5 ? 9 : 99)
  const a = decimalOf(whole(), pa, placeDigits(rng, pa))
  const b = decimalOf(whole(), pb, placeDigits(rng, pb))
  const c: ColDec = op === '+' ? { a, b, op } : a > b ? { a, b, op } : { a: b, b: a, op }
  return c.a === c.b ? null : c
}

/** `12.5 + 3.78` or `15.2 − 4.375` in columns with the points one under the other; one to three places, the two numbers may have different counts. */
export function columnDecimalQuestion(ctx: GenContext): ColumnQ {
  const samplers = (['+', '-'] as const).flatMap(op => ([1, 2, 3] as const).map(p => colDecSampler(op, p)))
  const c = sample(ctx, parseColDec, samplers, colDecKey)
  return {
    itemKey: colDecKey(c), answer: colDecResult(c), say: M5.columnDecimal, instruction: M5.columnDecimal, hint: c.op === '+' ? M3.columnHint : M3.borrowHint, a: c.a, b: c.b, op: c.op,
    places: colPlaces(c),
  }
}

const changeKey = (tenths: number) => `ch:${tenths}`
const PRICES = range(1, 199)
export const change20Accepts = keyIn(PRICES, changeKey)

/** "It costs 13.60 ₪; how much change from 20?" Prices 0.10–19.90 in tens of agorot; whole shekels, halves and the rest equally often. */
export function change20Question(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, [PRICES.filter(t => t % 10 === 0), PRICES.filter(t => t % 10 === 5), PRICES.filter(t => t % 10 !== 0 && t % 10 !== 5)], changeKey), changeKey, t => {
    const price = t / 10
    return {
      itemKey: changeKey(t), answer: dec3(20 - price), say: [M5.change, raw(`${decimalText(price)} שְׁקָלִים`)], instruction: M5.change, maxDigits: 4, decimal: true,
      prompt: { expr: `${fmtDec(price, 2)} ₪` },
    }
  })
}

interface Metres { toM: boolean; m: number; c: number }
const mcKey = (x: Metres) => `mc${x.toM ? 'd' : 'c'}:${x.m}:${x.c}`
function parseMc(key: string): Metres | null {
  const m = /^mc([dc]):([1-9]):(\d{1,2})$/.exec(key)
  const c = m ? Number(m[3]) : 0
  return m && c >= 1 && c <= 99 ? { toM: m[1] === 'd', m: Number(m[2]), c } : null
}
export const metersCmAccepts = (key: string) => parseMc(key) !== null

const mcSampler = (toM: boolean) => (rng: Rng): Metres => ({ toM, m: randInt(rng, 1, 9), c: randInt(rng, 1, 99) })

/** `1 מ׳ 37 ס״מ = ? מ׳` (1.37) and `2.05 מ׳ = ? ס״מ` (205). */
export function metersCmQuestion(ctx: GenContext): PadQ {
  const x = sample(ctx, parseMc, [mcSampler(true), mcSampler(false)], mcKey)
  const metres = dec3(x.m + x.c / 100)
  return {
    itemKey: mcKey(x), answer: x.toM ? metres : x.m * 100 + x.c, say: M4.convert, instruction: M4.convert, hint: M4.convertHint, maxDigits: 4, decimal: true,
    prompt: { expr: x.toM ? `${x.m} ${UNIT_LABEL.m} ${x.c} ${UNIT_LABEL.cm} = ? ${UNIT_LABEL.m}` : `${fmtDec(metres)} ${UNIT_LABEL.m} = ? ${UNIT_LABEL.cm}` },
  }
}

/* ---------- 50. heights and area ---------- */

type HeightShape = 'acute' | 'right' | 'obtuse' | 'parallelogram'
const HEIGHT_SHAPES: HeightShape[] = ['acute', 'right', 'obtuse', 'parallelogram']
const HEIGHT_SEGS = ['height', 'median', 'slant'] as const
interface HeightItem { shape: HeightShape; turn: number }
const HEIGHT_ITEMS: HeightItem[][] = HEIGHT_SHAPES.map(shape => range(0, 11).map(turn => ({ shape, turn })))
const phKey = (x: HeightItem) => `ph:${x.shape}:${x.turn}`
export const pickHeightAccepts = keyIn(HEIGHT_ITEMS.flat(), phKey)

/** "Where is the height to the marked side?" Three drawings of one shape turned by `turn` × 30°: the height, a median and a slanted segment. */
export function pickHeightQuestion(ctx: GenContext): PickQ {
  return make(ctx, oneGroup(ctx, HEIGHT_ITEMS, phKey), phKey, ({ shape, turn }) => ({
    itemKey: phKey({ shape, turn }), answer: 'height', say: M5.pickHeight, instruction: M5.pickHeight, hint: M5.heightHint, prompt: {},
    options: shuffle(ctx.rng, HEIGHT_SEGS).map(seg => ({ id: seg, kind: 'art' as const, art: { name: MATH_ART_5.height, props: { shape, seg, rot: turn * 30 } } })),
  }))
}

type Point = readonly [number, number]
/** Shifts the points (and the foot) so the shape has a one-cell margin; returns the grid size and the moved points. */
function onGrid(points: readonly Point[], foot: Point, flip: boolean): { cols: number; rows: number; points: Point[]; foot: Point } {
  const swap = (p: Point): Point => (flip ? [p[1], p[0]] : p)
  const all = [...points, foot].map(swap)
  const minX = Math.min(...all.map(p => p[0]))
  const minY = Math.min(...all.map(p => p[1]))
  const move = (p: Point): Point => [swap(p)[0] - minX + 1, swap(p)[1] - minY + 1]
  const moved = [...points, foot].map(move)
  return { cols: Math.max(...moved.map(p => p[0])) + 1, rows: Math.max(...moved.map(p => p[1])) + 1, points: moved.slice(0, -1), foot: moved.at(-1)! }
}
const fitsGrid = (g: { cols: number; rows: number }) => g.cols <= 12 && g.rows <= 10

interface SlantItem { vertical: boolean; b: number; h: number; dx: number; below: boolean }
const slantKey = (prefix: 'ta' | 'pa', x: SlantItem) => `${prefix}:${x.vertical ? 'v' : 'h'}:${x.b}:${x.h}:${x.dx}:${x.below ? 'd' : 'u'}`
function parseSlant(prefix: 'ta' | 'pa') {
  return (key: string): SlantItem | null => {
    const m = new RegExp(`^${prefix}:([hv]):(\\d+):(\\d+):(-?\\d+):([ud])$`).exec(key)
    if (!m) return null
    const x: SlantItem = { vertical: m[1] === 'v', b: Number(m[2]), h: Number(m[3]), dx: Number(m[4]), below: m[5] === 'd' }
    const ok = x.b >= 2 && x.b <= 8 && x.h >= 2 && x.h <= 7 && (prefix === 'ta' ? x.dx >= -3 && x.dx <= x.b + 3 && (x.b * x.h) % 2 === 0 : x.dx >= -4 && x.dx <= x.b + 3 && x.dx !== 0)
    return ok && fitsGrid(slantGrid(prefix, x)) ? x : null
  }
}

/** The drawing of a slanted shape: base along the first two points, the apex above or below it, the foot of the height on the base line. */
function slantGrid(prefix: 'ta' | 'pa', x: SlantItem) {
  const s = x.below ? 1 : -1
  const apex: Point = [x.dx, s * x.h]
  const points: Point[] = prefix === 'ta' ? [[0, 0], [x.b, 0], apex] : [[0, 0], [x.b, 0], [x.b + x.dx, s * x.h], apex]
  return onGrid(points, [x.dx, 0], x.vertical)
}

const slantSampler = (prefix: 'ta' | 'pa', dxOf: (rng: Rng, b: number) => number) => (rng: Rng): SlantItem | null => {
  for (let i = 0; i < 100; i++) {
    const b = randInt(rng, 2, 8)
    const x: SlantItem = { vertical: rng() < 0.4, b, h: randInt(rng, 2, 7), dx: dxOf(rng, b), below: rng() < 0.5 }
    if (parseSlant(prefix)(slantKey(prefix, x))) return x
  }
  return null
}
const insideDx = (rng: Rng, b: number) => randInt(rng, 1, b - 1)
const cornerDx = (rng: Rng, b: number) => (rng() < 0.5 ? 0 : b)
const outsideDx = (rng: Rng, b: number) => (rng() < 0.5 ? -randInt(rng, 1, 3) : b + randInt(rng, 1, 3))

export const triangleAreaAccepts = (key: string) => parseSlant('ta')(key) !== null
export const parallelogramAreaAccepts = (key: string) => parseSlant('pa')(key) !== null

/**
 * A triangle on a square grid with a horizontal or vertical base and an integer height; base × height is even. The apex is
 * above the base (acute), over an end (right) or beyond it (obtuse: the height falls outside, G5 p.22). Answer = base × height / 2.
 */
export function triangleAreaQuestion(ctx: GenContext): SlantAreaQ {
  const x = sample(ctx, parseSlant('ta'), [slantSampler('ta', insideDx), slantSampler('ta', cornerDx), slantSampler('ta', outsideDx), slantSampler('ta', outsideDx)], i => slantKey('ta', i))
  const g = slantGrid('ta', x)
  return {
    itemKey: slantKey('ta', x), answer: (x.b * x.h) / 2, say: M5.triangleArea, instruction: M5.triangleArea, hint: M5.triangleAreaHint,
    cols: g.cols, rows: g.rows, points: g.points, base: [0, 1], apex: 2, foot: g.foot,
  }
}

/** A parallelogram with a horizontal or vertical base, shifted by `dx` (never a rectangle); the foot may fall outside the base. Answer = base × height. */
export function parallelogramAreaQuestion(ctx: GenContext): SlantAreaQ {
  const x = sample(ctx, parseSlant('pa'), [slantSampler('pa', insideDx), slantSampler('pa', outsideDx), slantSampler('pa', outsideDx)], i => slantKey('pa', i))
  const g = slantGrid('pa', x)
  return {
    itemKey: slantKey('pa', x), answer: x.b * x.h, say: M5.parallelogramArea, instruction: M5.parallelogramArea, hint: M5.parallelogramHint,
    cols: g.cols, rows: g.rows, points: g.points, base: [0, 1], apex: 3, foot: g.foot,
  }
}

/* ---------- 51. prisms and pyramids ---------- */

const SOLIDS: SolidKind[] = ['cube', 'box', 'tri-prism', 'square-pyramid', 'tri-pyramid', 'hex-prism']
export const SOLID_COUNTS: Readonly<Record<SolidKind, { faces: number; edges: number; vertices: number }>> = {
  cube: { faces: 6, edges: 12, vertices: 8 },
  box: { faces: 6, edges: 12, vertices: 8 },
  'tri-prism': { faces: 5, edges: 9, vertices: 6 },
  'square-pyramid': { faces: 5, edges: 8, vertices: 5 },
  'tri-pyramid': { faces: 4, edges: 6, vertices: 4 },
  'hex-prism': { faces: 8, edges: 18, vertices: 12 },
}
const snKey = (k: SolidKind) => `sn:${k}`
export const solidNetAccepts = keyIn(SOLIDS, snKey)

/** "Which net folds into this solid?" Three nets: the right one (wrong 0) and two near-misses (wrong 1 and 2) that do not fold. */
export function solidNetQuestion(ctx: GenContext): PickQ {
  return make(ctx, SOLIDS, snKey, kind => ({
    itemKey: snKey(kind), answer: 'net0', say: M5.whichNet, instruction: M5.whichNet, hint: M5.netHint, prompt: { art: [{ name: MATH_ART_5.solid, props: { kind } }], artSize: 160 },
    options: shuffle(ctx.rng, [0, 1, 2]).map(wrong => ({ id: `net${wrong}`, kind: 'art' as const, art: { name: MATH_ART_5.net, props: { kind, wrong } } })),
  }))
}

type Count = 'faces' | 'edges' | 'vertices'
const COUNTS: Count[] = ['faces', 'edges', 'vertices']
const COUNT_PHRASE: Record<Count, string> = { faces: M5.faces, edges: M5.edges, vertices: M5.vertices }
interface Solid { kind: SolidKind; count: Count }
const FE_ITEMS: Solid[][] = COUNTS.map(count => SOLIDS.map(kind => ({ kind, count })))
const feKey = (s: Solid) => `fe:${s.kind}:${s.count}`
export const facesEdgesAccepts = keyIn(FE_ITEMS.flat(), feKey)

/** "How many faces (edges, vertices) does this solid have?" on the pad; the numbers come from a table of the six solids. */
export function facesEdgesQuestion(ctx: GenContext): PadQ {
  return make(ctx, oneGroup(ctx, FE_ITEMS, feKey), feKey, ({ kind, count }) => ({
    itemKey: feKey({ kind, count }), answer: SOLID_COUNTS[kind][count], say: COUNT_PHRASE[count], instruction: COUNT_PHRASE[count], maxDigits: 2,
    prompt: { art: [{ name: MATH_ART_5.solid, props: { kind } }], artSize: 160 },
  }))
}

/* ---------- 52. the mode ---------- */

/** A survey with the counts of some of its categories (index → count), 4–5 of them. */
interface ModeItem { id: string; counts: readonly (readonly [number, number])[] }
const modeKey = (x: ModeItem) => `mode:${x.id}:${x.counts.map(([i, c]) => `${i}.${c}`).join(',')}`
/** The categories that have the highest count. */
const tops = (x: ModeItem) => {
  const max = Math.max(...x.counts.map(([, c]) => c))
  return x.counts.filter(([, c]) => c === max).map(([i]) => i)
}
function parseMode(key: string): ModeItem | null {
  const m = /^mode:([a-z]+):(\d\.\d{1,2}(?:,\d\.\d{1,2}){3,4})$/.exec(key)
  const survey = m ? SURVEYS.find(s => s.id === m[1]) : undefined
  if (!m || !survey) return null
  const counts = m[2]!.split(',').map(p => p.split('.').map(Number) as [number, number])
  const x: ModeItem = { id: survey.id, counts }
  const idx = counts.map(([i]) => i)
  const ok = idx.every((i, j) => i < survey.categories.length && (j === 0 || idx[j - 1]! < i)) && counts.every(([, c]) => c >= 1 && c <= 12) && tops(x).length <= 2
  return ok ? x : null
}
export const modeTableAccepts = (key: string) => parseMode(key) !== null

const modeSampler = (tie: boolean) => (rng: Rng): ModeItem | null => {
  const survey = pick(rng, SURVEYS)
  const idx = shuffle(rng, range(0, survey.categories.length - 1)).slice(0, randInt(rng, 4, 5)).sort((a, b) => a - b)
  const counts = idx.map(i => [i, randInt(rng, 1, 12)] as const)
  const x: ModeItem = { id: survey.id, counts }
  if (tops(x).length === 3) return null
  return (tops(x).length === 2) === tie ? x : null
}

/** "What do most children like?" A frequency table of 4–5 categories (counts 1–12); two categories tie for the top in half the rounds, then "both" is an option. */
export function modeTableQuestion(ctx: GenContext): PickQ {
  const x = sample(ctx, parseMode, [modeSampler(false), modeSampler(true)], modeKey)
  const survey = SURVEYS.find(s => s.id === x.id)!
  const rows = shuffle(ctx.rng, x.counts).map(([i, c]) => [survey.categories[i]!, c] as const)
  const topLabels = tops(x).map(i => survey.categories[i]!)
  const options: PickOption[] = [
    ...rows.map(([label]) => ({ id: label, kind: 'text' as const, label, say: raw(label) })),
    ...(topLabels.length === 2 ? [{ id: 'both', kind: 'text' as const, label: phrases[M5.both] ?? '', say: M5.both }] : []),
  ]
  return {
    itemKey: modeKey(x), answer: topLabels.length === 2 ? 'both' : topLabels[0]!, say: surveyPhrase(x.id), instruction: surveyPhrase(x.id), hint: M5.modeHint,
    prompt: { art: [{ name: MATH_ART_5.freq, props: { rows: rows.map(([label, c]) => `${label}:${c}`).join(',') } }] }, options,
  }
}
