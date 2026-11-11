import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { PERCENT_STORIES } from './content/percent-stories'
import { SENSIBLE_VOLUMES } from './content/volumes'
import {
  biggerSmallerAccepts, biggerSmallerQuestion, boxVolumeAccepts, boxVolumeQuestion, circleAreaAccepts, circleAreaOf, circleAreaQuestion, circlePartsAccepts,
  circlePartsQuestion, circumferenceAccepts, circumferenceOf, circumferenceQuestion, compositeAreaAccepts, compositeAreaQuestion, compositePerimeterAccepts,
  compositePerimeterQuestion, countCubesAccepts, countCubesQuestion, decimalMentalAccepts, decimalMentalQuestion, discountAccepts, discountQuestion,
  divideFractionAccepts, divideFractionQuestion, divideUnitAccepts, divideUnitQuestion, estimateProductAccepts, estimateProductQuestion, findMeanAccepts,
  findMeanQuestion, findWholeAccepts, findWholeQuestion, fractionGridAccepts, fractionGridQuestion, fractionOfAccepts, fractionOfQuestion, gematriaAccepts,
  gematriaQuestion, howManyFitAccepts, howManyFitQuestion, levelBarsAccepts, levelBarsQuestion, machineOutputAccepts, machineOutputQuestion, machineRuleAccepts,
  machineRuleQuestion, meanTruthsAccepts, meanTruthsQuestion, percentArenaAccepts, percentArenaQuestion, percentMatchAccepts, percentMatchQuestion,
  percentOfAccepts, percentOfQuestion, priceRiseAccepts, priceRiseQuestion, romanAccepts, romanQuestion, scaleEffectAccepts, scaleEffectQuestion,
  volumeUnitAccepts, volumeUnitQuestion, wherePointAccepts, wherePointQuestion,
} from './generators-g6'
import { M6, findCirclePart, sensibleVolume } from './ids'
import { toGematria, toRoman } from './numbers'
import { phrases } from './phrases'
import type { CellRect, Fraction } from './types'

/* ---------- fixtures and utilities ---------- */

const KNOWN = new Set(Object.keys(phrases))
const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)
const each = <Q>(gen: (c: GenContext) => Q, fn: (q: Q, seed: number) => void) => {
  for (const seed of SEEDS) fn(gen(ctx(seed)), seed)
}

const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
function expectKnown(refs: (PhraseRef | undefined)[]) {
  for (const p of refs.flatMap(ids)) expect(p.startsWith('raw:') || KNOWN.has(p), p).toBe(true)
}
const label = (o: PickOption) => (o as { label: string }).label
const say = (o: PickOption) => (o as { say?: PhraseRef }).say

function expectPick(q: PickQ, options: number) {
  const optionIds = q.options.map(o => o.id)
  expect(q.options).toHaveLength(options)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  const labels = q.options.filter(o => 'label' in o).map(label)
  expect(new Set(labels).size).toBe(labels.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  expectKnown([q.say, q.instruction, q.hint, ...q.options.map(say)])
}

function expectPad(q: { say: PhraseRef; instruction: string; hint?: PhraseRef; answer: number; maxDigits: number }) {
  expectKnown([q.say, q.instruction, q.hint])
  expect(String(Number(q.answer.toFixed(3))).replace('.', '').length).toBeLessThanOrEqual(q.maxDigits)
  expect(q.maxDigits).toBeLessThanOrEqual(3)
}

function expectReviewAndAvoid<Q extends { itemKey: string }>(gen: (c: GenContext) => Q, accepts: (key: string) => boolean, minKeys = 20) {
  const keys = new Set<string>()
  for (const seed of SEEDS) {
    const q = gen(ctx(seed))
    expect(accepts(q.itemKey), q.itemKey).toBe(true)
    keys.add(q.itemKey)
    expect(gen(ctx(seed, [q.itemKey])).itemKey).not.toBe(q.itemKey)
  }
  expect(keys.size).toBeGreaterThanOrEqual(minKeys)
  for (const key of [...keys].slice(0, 25)) {
    expect(gen(ctx(7, [], key)).itemKey).toBe(key)
    expect(gen(ctx(8, [key], key)).itemKey).toBe(key)
  }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const BENCH = [1, 10, 20, 25, 40, 50, 60, 75, 80]
const sameFraction = (f: Fraction, num: number, den: number) => ((f.whole ?? 0) * f.den + f.num) * den === num * f.den
/** "3/4" → [3, 4] pairs in an expression. */
const fractionsIn = (expr: string) => [...expr.matchAll(/(\d+)\/(\d+)/g)].map(m => [Number(m[1]), Number(m[2])] as const)
const round3 = (x: number) => Math.round(x * 1000) / 1000

/* ---------- 53. number machines ---------- */

/** Applies "x3,p1" style steps written separately from the generator's. */
function applySteps(rule: string, input: number): number {
  let v = input
  for (const s of rule.split(',')) {
    const k = Number(s.slice(1))
    const o = s[0]
    v = o === 'x' ? v * k : o === 'd' ? v / k : o === 'p' ? v + k : v - k
    expect(Number.isInteger(v) && v >= 0 && v <= 200, `${rule} on ${input}`).toBe(true)
  }
  return v
}

describe('machine output', () => {
  it('shows the rule and the input; the answer is the whole-number output, 0–200', () => {
    const arities = new Set<number>()
    each(machineOutputQuestion, q => {
      const [, rule, input] = /^mo:([xdpm\d,]+):(\d+)$/.exec(q.itemKey)!
      arities.add(rule!.split(',').length)
      expect(q.answer).toBe(applySteps(rule!, Number(input)))
      const art = q.prompt.art![0]!
      expect(art.name).toBe('math.machine')
      expect(art.props!.input).toBe(Number(input))
      expect(art.props!.rule).toBe(rule!.split(',').map(s => ({ x: '×', d: ':', p: '+', m: '−' })[s[0]!]! + s.slice(1)).join(''))
      expect(q.answer).toBeLessThanOrEqual(200)
      expect(q.instruction).toBe(M6.machineOut)
      expect(q.hint).toBe(M6.machineHint)
      expectPad(q)
    })
    expect([...arities].sort()).toEqual([1, 2])
  })
  it('honors review and avoid', () => expectReviewAndAvoid(machineOutputQuestion, machineOutputAccepts, 50))
})

describe('machine rule', () => {
  it('shows three pairs; exactly one of the four rules fits them all, and it is the answer', () => {
    each(machineRuleQuestion, q => {
      expectPick(q, 4)
      const pairs = q.prompt.expr!.split(', ').map(p => p.split(' → ').map(Number) as [number, number])
      expect(pairs).toHaveLength(3)
      expect(new Set(pairs.map(p => p[0])).size).toBe(3)
      const fits = (l: string) => {
        const tokens = l.split(' ')
        return pairs.every(([i, o]) => {
          let v = i
          for (let t = 0; t < tokens.length; t += 2) {
            const k = Number(tokens[t + 1])
            v = tokens[t] === '×' ? v * k : tokens[t] === ':' ? v / k : tokens[t] === '+' ? v + k : v - k
          }
          return v === o
        })
      }
      const fitting = q.options.map(o => o.id).filter(fits)
      expect(fitting).toEqual([q.answer])
      const steps = new Set(q.options.map(o => o.id.split(' ').length))
      expect(steps.size).toBe(1)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(machineRuleQuestion, machineRuleAccepts, 50))
})

/* ---------- 54. numerals ---------- */

const ROMAN_VAL: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
/** Standard subtractive reading, written separately from toRoman. */
const romanValue = (s: string) => [...s].reduce((sum, c, i) => sum + (ROMAN_VAL[c]! < (ROMAN_VAL[s[i + 1]!] ?? 0) ? -ROMAN_VAL[c]! : ROMAN_VAL[c]!), 0)

const LETTER_VAL: Record<string, number> = {}
'אבגדהוזחט'.split('').forEach((c, i) => (LETTER_VAL[c] = i + 1))
'יכלמנסעפצ'.split('').forEach((c, i) => (LETTER_VAL[c] = (i + 1) * 10))
'קרשת'.split('').forEach((c, i) => (LETTER_VAL[c] = (i + 1) * 100))
const gematriaValue = (s: string) => [...s.replace(/[׳״]/g, '')].reduce((sum, c) => sum + LETTER_VAL[c]!, 0)

describe('roman', () => {
  it('both directions: the right number or numeral is the one option that reads as the shown one', () => {
    const dirs = new Set<string>()
    let subtractive = 0
    each(romanQuestion, q => {
      expectPick(q, 4)
      const [, n, dir] = /^rom:(\d+):([ab])$/.exec(q.itemKey)!
      dirs.add(dir!)
      expect(+n!).toBeGreaterThanOrEqual(1)
      expect(+n!).toBeLessThanOrEqual(2000)
      if (/IV|IX|XL|XC|CD|CM/.test(toRoman(+n!))) subtractive++
      if (dir === 'a') {
        expect(romanValue(q.prompt.expr!)).toBe(+n!)
        expect(q.options.map(o => +o.id).filter(v => v === romanValue(q.prompt.expr!))).toEqual([+q.answer])
        expect(q.options.every(o => o.kind === 'number' && Number(o.id) >= 1 && Number(o.id) <= 2000)).toBe(true)
      } else {
        expect(+q.prompt.expr!.replace(/,/g, '')).toBe(+n!)
        expect(romanValue(q.answer)).toBe(+n!)
        expect(q.options.filter(o => romanValue(o.id) === +n!)).toHaveLength(1)
      }
      expect(q.instruction).toBe(dir === 'a' ? M6.roman : M6.romanWrite)
      expect(q.hint).toBe(M6.romanHint)
    })
    expect([...dirs].sort()).toEqual(['a', 'b'])
    expect(subtractive).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(romanQuestion, romanAccepts, 60))
})

describe('gematria', () => {
  it('both directions; 15 and 16 are always ט״ו and ט״ז, never י״ה and י״ו, also inside bigger numbers', () => {
    let fifteens = 0
    each(gematriaQuestion, q => {
      expectPick(q, 4)
      const [, n, dir] = /^gem:(\d+):([ab])$/.exec(q.itemKey)!
      const shown = [q.prompt.word?.text, ...q.options.map(o => o.id)].filter((s): s is string => !!s && /[א-ת]/.test(s))
      for (const s of shown) expect(s, s).not.toMatch(/י״[הו]$/)
      if ([15, 16].includes(+n! % 100)) fifteens++
      if (dir === 'a') {
        expect(gematriaValue(q.prompt.word!.text)).toBe(+n!)
        expect(q.prompt.word!.text).toBe(toGematria(+n!))
        expect(q.options.filter(o => +o.id === gematriaValue(q.prompt.word!.text))).toHaveLength(1)
      } else {
        expect(gematriaValue(q.answer)).toBe(+n!)
        expect(q.options.every(o => o.kind === 'text')).toBe(true)
        expect(q.options.filter(o => gematriaValue(o.id) === +n!)).toHaveLength(1)
      }
      expect(+n!).toBeGreaterThanOrEqual(1)
      expect(+n!).toBeLessThanOrEqual(999)
    })
    expect(fifteens).toBeGreaterThan(30)
  })
  it('spells 15, 16, 115 and 786 as expected', () => {
    expect(toGematria(15)).toBe('ט״ו')
    expect(toGematria(16)).toBe('ט״ז')
    expect(toGematria(115)).toBe('קט״ו')
    expect(toGematria(786)).toBe('תשפ״ו')
  })
  it('honors review and avoid', () => expectReviewAndAvoid(gematriaQuestion, gematriaAccepts, 60))
})

/* ---------- 55. multiplying fractions ---------- */

describe('fraction of', () => {
  it('a/b × n with n a multiple of b: the answer is whole and exact', () => {
    each(fractionOfQuestion, q => {
      const [, a, b, n] = /^fo:(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [string, number, number, number]
      expect(n % b).toBe(0)
      expect(a).toBeLessThan(b)
      expect(q.answer * b).toBe(a * n)
      expect(q.prompt.expr).toBe(`${a}/${b} × ${n} = ?`)
      expect(ids(q.say)[0]).toBe(M6.fractionOf)
      expectPad(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(fractionOfQuestion, fractionOfAccepts, 60))
})

describe('fraction grid', () => {
  it('a b × d grid with a rows and c columns tinted; the answer is a·c', () => {
    each(fractionGridQuestion, q => {
      const [, a, b, c, d] = /^fg:(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [string, number, number, number, number]
      expect(q.shape).toBe('rect')
      expect([q.rows, q.cols, q.parts]).toEqual([b, d, b * d])
      expect(q.bands).toEqual([a, c])
      expect(q.answer).toBe(a * c)
      expect(q.show).toBe(`${a}/${b} × ${c}/${d}`)
      expect(b >= 2 && b <= 6 && d >= 2 && d <= 6 && a < b && c < d).toBe(true)
      expectKnown([q.say, q.instruction, q.hint])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(fractionGridQuestion, fractionGridAccepts, 60))
})

describe('bigger or smaller', () => {
  it('judges the real result against the number; both answers and both fraction sizes occur', () => {
    const seen = new Set<string>()
    each(biggerSmallerQuestion, q => {
      expectPick(q, 2)
      const [, op, a, b, n] = /^bs:([xd]):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!
      const f = +a! / +b!
      const result = op === 'x' ? f * +n! : +n! / f
      expect(q.answer).toBe(result > +n! ? 'bigger' : 'smaller')
      expect(q.prompt.expr).toBe(op === 'x' ? `${a}/${b} × ${n}` : `${n} : ${a}/${b}`)
      expect(gcd(+a!, +b!)).toBe(1)
      seen.add(`${op}${f > 1}${q.answer}`)
    })
    expect(seen.size).toBe(4)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(biggerSmallerQuestion, biggerSmallerAccepts, 60))
})

/* ---------- 56. dividing fractions ---------- */

describe('how many fit', () => {
  it('whole : 1/d and a/d : 1/d have whole answers; the aid draws strips', () => {
    each(howManyFitQuestion, q => {
      const [, form, x, d] = /^hf:([wf]):(\d+):(\d+)$/.exec(q.itemKey)!
      expect(q.answer).toBe(form === 'w' ? +x! * +d! : +x!)
      expect(q.prompt.expr).toBe(`${form === 'w' ? x : `${x}/${d}`} : 1/${d} = ?`)
      expect(q.aidArt![0]).toEqual({ name: 'math.strips', props: { a: '1/1', b: `1/${d}` } })
      expectPad(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(howManyFitQuestion, howManyFitAccepts, 30))
})

describe('divide unit', () => {
  it('n : 1/d = n·d', () => {
    each(divideUnitQuestion, q => {
      const [, n, d] = /^du:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [string, number, number]
      expect(q.answer).toBe(n * d)
      expect(q.prompt.expr).toBe(`${n} : 1/${d} = ?`)
      expectPad(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(divideUnitQuestion, divideUnitAccepts, 40))
})

describe('divide fraction', () => {
  it('a/b : c/d equals the answer by cross-multiplication; mixed exactly when the result is at least 1', () => {
    const kinds = new Set<string>()
    each(divideFractionQuestion, q => {
      const [, a, b, c, d] = /^df:(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [string, number, number, number, number]
      expect(fractionsIn(q.prompt.expr!)).toEqual([[a, b], [c, d]])
      expect(sameFraction(q.answer, a * d, b * c)).toBe(true)
      expect(q.mixed).toBe(a * d >= b * c)
      expect(a * d).not.toBe(b * c)
      expect(q.hint).toBe(M6.divideFractionHint)
      expectKnown([q.say, q.instruction, q.hint])
      kinds.add(a * d < b * c ? 'lt' : (a * d) % (b * c) === 0 ? 'whole' : 'mixed')
    })
    expect(kinds.size).toBe(3)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(divideFractionQuestion, divideFractionAccepts, 40))
})

/* ---------- 57. decimals ---------- */

describe('where does the point go', () => {
  it('the four options are one digit string with the point in four places; one is the exact product', () => {
    each(wherePointQuestion, q => {
      expectPick(q, 4)
      const [, x, y] = /^wp:([\d.]+):([\d.]+)$/.exec(q.itemKey)!
      const dp = (s: string) => (s.split('.')[1] ?? '').length
      const exact = (Number(x!.replace('.', '')) * Number(y!.replace('.', ''))) / 10 ** (dp(x!) + dp(y!))
      expect(Number(q.answer)).toBeCloseTo(exact, 9)
      const digits = (s: string) => s.replace('.', '').replace(/^0+/, '').replace(/0+$/, '')
      expect(new Set(q.options.map(o => digits(o.id))).size).toBe(1)
      expect(digits(q.answer)).toBe(digits(String(Math.round(exact * 10 ** 6))))
      for (const o of q.options) expect((o.id.split('.')[1] ?? '').length).toBeLessThanOrEqual(3)
      expect(q.prompt.expr).toBe(`${x} × ${y} = ?`)
      expect(Number(x) >= 0.2 && Number(y) >= 0.2 && Number(x) <= 9.9 && Number(y) <= 9.9).toBe(true)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(wherePointQuestion, wherePointAccepts, 60))
})

describe('decimal mental', () => {
  it('exact answers on the decimal pad; operands have at most three places; at most three digits typed', () => {
    const ops = new Set<string>()
    each(decimalMentalQuestion, q => {
      const [, op, a, b] = /^dm:([xd]):([\d.]+):([\d.]+)$/.exec(q.itemKey)!
      ops.add(op!)
      const dp = (s: string) => (s.split('.')[1] ?? '').length
      const [ai, bi] = [Number(a!.replace('.', '')), Number(b!.replace('.', ''))]
      const [pa, pb] = [dp(a!), dp(b!)]
      expect(Math.max(pa, pb)).toBeLessThanOrEqual(3)
      const want = op === 'x' ? (ai * bi) / 10 ** (pa + pb) : (ai * 10 ** pb) / (bi * 10 ** pa)
      expect(round3(q.answer)).toBe(round3(want))
      expect(q.decimal).toBe(true)
      expect(q.prompt.expr).toBe(`${a} ${op === 'x' ? '×' : ':'} ${b} = ?`)
      expect(dp(String(round3(q.answer)))).toBeLessThanOrEqual(3)
      expectPad(q)
    })
    expect([...ops].sort()).toEqual(['d', 'x'])
  })
  it('honors review and avoid', () => expectReviewAndAvoid(decimalMentalQuestion, decimalMentalAccepts, 60))
})

describe('estimate a product', () => {
  it('a factor under 1 shrinks a product and grows a quotient', () => {
    const answers = new Set<string>()
    each(estimateProductQuestion, q => {
      expectPick(q, 2)
      const [, op, a, n] = /^ep:([xd]):([\d.]+):(\d+)$/.exec(q.itemKey)!
      const result = op === 'x' ? +a! * +n! : +n! / +a!
      expect(+a!).not.toBe(1)
      expect(result).not.toBe(+n!)
      expect(q.answer).toBe(result > +n! ? 'more' : 'less')
      expect(q.prompt.expr).toBe(op === 'x' ? `${a} × ${n} ? ${n}` : `${n} : ${a} ? ${n}`)
      answers.add(q.answer)
    })
    expect(answers.size).toBe(2)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(estimateProductQuestion, estimateProductAccepts, 60))
})

/* ---------- 58. percent ---------- */

describe('percent of', () => {
  const check = (gen: typeof percentOfQuestion, max: number) =>
    each(gen, q => {
      const [, p, n] = /^po:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [string, number, number]
      expect(BENCH).toContain(p)
      expect(n).toBeLessThanOrEqual(max)
      expect((p * n) % 100).toBe(0)
      expect(q.answer).toBe((p * n) / 100)
      expect(q.prompt.expr).toBe(`${p}% × ${n} = ?`)
      expect(q.aidArt).toEqual([{ name: 'math.percent', props: { p } }])
      expect(q.hint).toBe(M6.percentHint)
      expectPad(q)
    })
  it('benchmark percents of round wholes up to 1,000, always a whole answer', () => check(percentOfQuestion, 1000))
  it('the arena asks the same keys, wholes up to 200; percentOf accepts them too', () => {
    check(percentArenaQuestion, 200)
    each(percentArenaQuestion, q => expect(percentOfAccepts(q.itemKey)).toBe(true))
    expect(percentArenaAccepts('po:25:400')).toBe(false)
    expect(percentOfAccepts('po:25:400')).toBe(true)
    expect(percentOfAccepts('po:30:100')).toBe(false)
    expect(percentOfAccepts('po:25:30')).toBe(false)
  })
  it('honors review and avoid', () => {
    expectReviewAndAvoid(percentOfQuestion, percentOfAccepts, 100)
    expectReviewAndAvoid(percentArenaQuestion, percentArenaAccepts, 60)
  })
  it('asks every benchmark percent', () => {
    const seen = new Set<number>()
    each(percentOfQuestion, q => seen.add(+q.itemKey.split(':')[1]!))
    expect([...seen].sort((a, b) => a - b)).toEqual(BENCH)
  })
})

describe('percent match', () => {
  const FRAC: Record<number, string> = { 1: '1/100', 10: '1/10', 20: '1/5', 25: '1/4', 40: '2/5', 50: '1/2', 60: '3/5', 75: '3/4', 80: '4/5' }
  it('percent ↔ fraction or decimal; every percent shown is a benchmark', () => {
    const kinds = new Set<string>()
    each(percentMatchQuestion, q => {
      expectPick(q, 4)
      const [, p, kind] = /^pm:(\d+):(f|d|pf|pd)$/.exec(q.itemKey)!
      kinds.add(kind!)
      expect(BENCH).toContain(+p!)
      if (kind === 'f') {
        expect(q.prompt.expr).toBe(`${p}%`)
        expect(q.answer).toBe(FRAC[+p!])
        const values = q.options.map(o => { const [a, b] = o.id.split('/').map(Number); return a! / b! })
        expect(values.filter(v => Math.abs(v - +p! / 100) < 1e-12)).toHaveLength(1)
      } else if (kind === 'd') {
        expect(q.answer).toBe(String(+p! / 100))
        expect(q.options.filter(o => Math.abs(+o.id - +p! / 100) < 1e-12)).toHaveLength(1)
      } else {
        expect(q.answer).toBe(`${p}%`)
        for (const o of q.options) expect(BENCH).toContain(parseInt(o.id, 10))
        for (const o of q.options) expect(o.id).toMatch(/^\d+%$/)
        const shown = kind === 'pf' ? FRAC[+p!] : String(+p! / 100)
        expect(q.prompt.expr).toBe(shown)
      }
    })
    expect([...kinds].sort()).toEqual(['d', 'f', 'pd', 'pf'])
  })
  it('honors review and avoid', () => expectReviewAndAvoid(percentMatchQuestion, percentMatchAccepts, 30))
})

/* ---------- 59. percent stories ---------- */

describe('percent stories', () => {
  const gens = [
    ['whole', findWholeQuestion, findWholeAccepts, 'pwh'], ['discount', discountQuestion, discountAccepts, 'pdi'], ['rise', priceRiseQuestion, priceRiseAccepts, 'pri'],
  ] as const
  for (const [kind, gen, accepts, prefix] of gens) {
    it(`${kind}: a benchmark percent, a filled-in sentence, an exact whole answer`, () => {
      each(gen, q => {
        const m = new RegExp(`^${prefix}:(\\w+):(\\d+):(\\d+)$`).exec(q.itemKey)!
        const [id, p, x] = [m[1]!, Number(m[2]), Number(m[3])]
        const story = PERCENT_STORIES.find(s => s.id === id)!
        expect(story.kind).toBe(kind)
        expect(BENCH).toContain(p)
        const text = story.text.split('{p}').join(String(p)).split('{x}').join(String(x))
        expect(q.prompt.sentence!.text).toBe(text)
        expect(text).not.toMatch(/[{}]/)
        expect(ids(q.say)).toEqual([`raw:${text}`])
        const exact = kind === 'whole' ? (x * 100) / p : kind === 'discount' ? (x * (100 - p)) / 100 : (x * (100 + p)) / 100
        expect(Number.isInteger(exact)).toBe(true)
        expect(q.answer).toBe(exact)
        expect(q.hint).toBe(kind === 'whole' ? M6.wholeHint : M6.percentHint)
        expectPad(q)
      })
      expectReviewAndAvoid(gen, accepts, 30)
    })
  }
  it('discounts are at most 50% and nothing is fractional or chained', () => {
    each(discountQuestion, q => expect(+q.itemKey.split(':')[2]!).toBeLessThanOrEqual(50))
    for (const s of PERCENT_STORIES) expect(s.text).not.toMatch(/\d/)
  })
})

/* ---------- 60. composite shapes ---------- */

/** Rect cells, counted rect by rect; adjacency written separately from the generator (area − 2·shared edges = perimeter / 4 logic). */
function shapeFacts(rects: readonly CellRect[]) {
  const cells = new Map<string, number>()
  rects.forEach(([x, y, w, h], i) => {
    for (let cx = x; cx < x + w; cx++) for (let cy = y; cy < y + h; cy++) cells.set(`${cx},${cy}`, (cells.get(`${cx},${cy}`) ?? 0) + (i + 1) * 0 + 1)
  })
  const overlapping = [...cells.values()].some(v => v > 1)
  let pairs = 0
  for (const k of cells.keys()) {
    const [x, y] = k.split(',').map(Number) as [number, number]
    if (cells.has(`${x + 1},${y}`)) pairs++
    if (cells.has(`${x},${y + 1}`)) pairs++
  }
  // Connected: flood fill over cells.
  const seen = new Set<string>()
  const stack = [cells.keys().next().value as string]
  while (stack.length) {
    const k = stack.pop()!
    if (seen.has(k)) continue
    seen.add(k)
    const [x, y] = k.split(',').map(Number) as [number, number]
    for (const n of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) if (cells.has(n)) stack.push(n)
  }
  return { area: cells.size, perimeter: 4 * cells.size - 2 * pairs, overlapping, connected: seen.size === cells.size }
}

describe('composite shapes', () => {
  const gens = [['area', compositeAreaQuestion, compositeAreaAccepts, M6.compositeArea, M6.compositeHint], ['perimeter', compositePerimeterQuestion, compositePerimeterAccepts, M6.compositePerimeter, M6.perimeterHint]] as const
  for (const [ask, gen, accepts, instruction, hint] of gens) {
    it(`${ask}: 2–3 non-overlapping connected rectangles inside the grid; the answer comes from the union`, () => {
      const counts = new Set<number>()
      each(gen, q => {
        const f = shapeFacts(q.rects)
        counts.add(q.rects.length)
        expect(f.overlapping).toBe(false)
        expect(f.connected).toBe(true)
        expect(q.rects.length).toBeGreaterThanOrEqual(2)
        expect(q.rects.length).toBeLessThanOrEqual(3)
        expect(q.answer).toBe(ask === 'area' ? f.area : f.perimeter)
        expect(q.ask).toBe(ask)
        expect(q.mode).toBe('count')
        expect(q.instruction).toBe(instruction)
        expect(q.hint).toBe(hint)
        for (const [x, y, w, h] of q.rects) {
          expect(x >= 0 && y >= 0 && w >= 1 && h >= 1).toBe(true)
          expect(x + w).toBeLessThanOrEqual(q.cols)
          expect(y + h).toBeLessThanOrEqual(q.rows)
        }
        expect(q.cols).toBeLessThanOrEqual(10)
        expect(q.rows).toBeLessThanOrEqual(10)
        expectKnown([q.say, q.instruction, q.hint])
      })
      expect([...counts].sort()).toEqual([2, 3])
    })
    it(`${ask}: honors review and avoid`, () => expectReviewAndAvoid(gen, accepts, 100))
  }
  it('a U has a longer perimeter than its bounding box', () => {
    let longer = 0
    each(compositePerimeterQuestion, q => {
      const bbox = 2 * (q.cols + q.rows)
      expect(q.answer).toBeGreaterThanOrEqual(bbox)
      if (q.answer > bbox) longer++
    })
    expect(longer).toBeGreaterThan(30)
  })
})

describe('scale effect', () => {
  it('both sides doubled → ×4, only the length doubled → ×2, with three options', () => {
    const seen = new Set<string>()
    each(scaleEffectQuestion, q => {
      expectPick(q, 3)
      const m = /^se:(\d+):(\d+)(:1)?$/.exec(q.itemKey)!
      const [a, b, one] = [Number(m[1]), Number(m[2]), !!m[3]]
      const [a2, b2] = [2 * a, one ? b : 2 * b]
      expect(q.prompt.expr).toBe(`${a} × ${b} → ${a2} × ${b2}`)
      expect(q.answer).toBe((a2 * b2) / (a * b) === 4 ? 'times4' : 'times2')
      expect(q.options.map(o => o.id).sort()).toEqual(['same', 'times2', 'times4'])
      seen.add(q.answer)
    })
    expect(seen).toEqual(new Set(['times2', 'times4']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(scaleEffectQuestion, scaleEffectAccepts, 20))
})

/* ---------- 61. circle ---------- */

describe('circle parts', () => {
  it('asks for one of the four parts on a drawing that offers all four', () => {
    const asked = new Set<string>()
    each(circlePartsQuestion, q => {
      asked.add(q.answer)
      expect(q.parts).toEqual(['radius', 'diameter', 'chord', 'arc'])
      expect(q.parts).toContain(q.answer)
      expect(q.art).toEqual({ name: 'math.circle', props: { parts: 'radius,diameter,chord,arc' } })
      expect(q.instruction).toBe(findCirclePart(q.answer as 'radius'))
      expect(ids(q.say)[0]).toBe(q.instruction)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(asked.size).toBe(4)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(circlePartsQuestion, circlePartsAccepts, 4))
})

describe('circumference and area', () => {
  const run = (gen: typeof circumferenceQuestion, exact: (r: number) => number, instruction: string) => {
    each(gen, q => {
      expectPick(q, 4)
      const r = q.prompt.art![0]!.props!.r as number
      expect(r).toBeGreaterThanOrEqual(3)
      expect(q.prompt.art![0]).toMatchObject({ name: 'math.circle', props: { parts: 'radius', r } })
      const e = exact(r)
      const dist = q.options.map(o => ({ id: o.id, d: Math.abs(Number(o.id) - e) }))
      const best = Math.min(...dist.map(x => x.d))
      expect(dist.filter(x => x.d === best).map(x => x.id)).toEqual([q.answer])
      expect(Math.abs(Number(q.answer) - e)).toBeLessThanOrEqual(0.05 + 1e-9)
      expect(q.options.map(o => Number(o.id))).toContain(2 * r)
      expect(q.instruction).toBe(instruction)
      expect(q.hint).toBe(M6.piHint)
      for (const o of q.options) expect((o.id.split('.')[1] ?? '').length).toBeLessThanOrEqual(1)
    })
  }
  it('circumference: the correct option is 2·3.14·r to one decimal and is the closest', () => run(circumferenceQuestion, r => 2 * 3.14 * r, M6.circumference))
  it('area: the correct option is 3.14·r² to one decimal and is the closest', () => run(circleAreaQuestion, r => 3.14 * r * r, M6.circleArea))
  it('the formulas are exact in integer maths', () => {
    expect(circumferenceOf(3)).toBe(18.8)
    expect(circleAreaOf(3)).toBe(28.3)
    expect(circleAreaOf(10)).toBe(314)
  })
  it('honors review and avoid', () => {
    expectReviewAndAvoid(circumferenceQuestion, circumferenceAccepts, 10)
    expectReviewAndAvoid(circleAreaQuestion, circleAreaAccepts, 10)
  })
})

/* ---------- 62. volume ---------- */

describe('count cubes', () => {
  it('the answer is l × w × h of the drawn box, each side 1–5', () => {
    each(countCubesQuestion, q => {
      const { l, w, h } = q.prompt.art![0]!.props as { l: number; w: number; h: number }
      for (const v of [l, w, h]) expect(v >= 1 && v <= 5).toBe(true)
      expect(q.answer).toBe(l * w * h)
      expect(q.prompt.art![0]!.name).toBe('math.cubes')
      expect(q.itemKey).toBe(`cub:${l}:${w}:${h}`)
      expect(q.hint).toBe(M6.volumeHint)
      expectPad(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(countCubesQuestion, countCubesAccepts, 50))
})

describe('box volume', () => {
  it('the answer is the product of the three sides (2–10, up to 600), in any order', () => {
    each(boxVolumeQuestion, q => {
      const sides = q.prompt.expr!.replace(' = ?', '').split(' × ').map(Number)
      expect(sides).toHaveLength(3)
      expect(sides.every(s => s >= 2 && s <= 10)).toBe(true)
      expect(q.answer).toBe(sides[0]! * sides[1]! * sides[2]!)
      expect(q.answer).toBeLessThanOrEqual(600)
      expect(q.itemKey).toBe(`bv:${[...sides].sort((a, b) => a - b).join(':')}`)
      expectPad(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(boxVolumeQuestion, boxVolumeAccepts, 50))
})

describe('volume unit', () => {
  it('silent text options: the right size and unit, and three absurd ones', () => {
    each(volumeUnitQuestion, q => {
      expectPick(q, 4)
      const v = SENSIBLE_VOLUMES.find(s => `vu:${s.id}` === q.itemKey)!
      expect(q.answer).toBe(v.right)
      expect(q.instruction).toBe(sensibleVolume(v.id))
      expect(q.options.map(o => o.id).sort()).toEqual([v.right, ...v.wrong].sort())
      expect(q.options.every(o => o.kind === 'text' && say(o) === undefined)).toBe(true)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(volumeUnitQuestion, volumeUnitAccepts, SENSIBLE_VOLUMES.length))
})

/* ---------- 63. mean ---------- */

const valuesOf = (key: string) => key.split(':')[1]!.split(',').map(Number)
const meanOfValues = (vs: number[]) => vs.reduce((a, b) => a + b, 0) / vs.length

describe('level bars', () => {
  it('3–6 bars of 1–9; the mean is whole and is the answer; the bars are not already level', () => {
    const lengths = new Set<number>()
    each(levelBarsQuestion, q => {
      expect(q.values).toEqual(valuesOf(q.itemKey))
      lengths.add(q.values.length)
      expect(q.values.length >= 3 && q.values.length <= 6).toBe(true)
      expect(q.values.every(v => Number.isInteger(v) && v >= 1 && v <= 9)).toBe(true)
      expect(q.answer).toBe(meanOfValues([...q.values]))
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(new Set(q.values).size).toBeGreaterThan(1)
      expect(q.instruction).toBe(M6.levelBars)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect([...lengths].sort()).toEqual([3, 4, 5, 6])
  })
  it('honors review and avoid', () => expectReviewAndAvoid(levelBarsQuestion, levelBarsAccepts, 100))
})

describe('find mean', () => {
  it('4–6 values; the mean is whole or has one decimal place (both occur); decimal pad', () => {
    const kinds = new Set<string>()
    each(findMeanQuestion, q => {
      const vs = q.prompt.expr!.split(', ').map(Number)
      expect(vs).toEqual(valuesOf(q.itemKey))
      expect(vs.length >= 4 && vs.length <= 6).toBe(true)
      expect(vs.every(v => v >= 1 && v <= 20)).toBe(true)
      const sum = vs.reduce((a, b) => a + b, 0)
      expect((sum * 10) % vs.length).toBe(0)
      expect(q.answer).toBeCloseTo(sum / vs.length, 9)
      expect(q.decimal).toBe(true)
      kinds.add(sum % vs.length === 0 ? 'whole' : 'tenth')
      expect(q.hint).toBe(M6.meanHint)
      expectPad(q)
    })
    expect([...kinds].sort()).toEqual(['tenth', 'whole'])
  })
  it('honors review and avoid', () => expectReviewAndAvoid(findMeanQuestion, findMeanAccepts, 100))
})

describe('mean truths', () => {
  it('statements are judged by the real values; yes and no both occur for every kind; Hebrew with nikud, no placeholders', () => {
    const seen = new Set<string>()
    each(meanTruthsQuestion, q => {
      expectPick(q, 2)
      const [, kind] = q.itemKey.split(':')
      const vs = valuesOf(q.itemKey.replace(/^mt:(in|wh|ad):/, 'x:').replace(/:\d+$/, kind === 'ad' ? '' : '$&'))
      const mean = meanOfValues(vs)
      const x = kind === 'ad' ? Number(q.itemKey.split(':')[3]) : 0
      const yes = kind === 'in' ? vs.includes(mean) : kind === 'wh' ? Number.isInteger(mean) : x !== mean
      expect(q.answer).toBe(yes ? 'yes' : 'no')
      expect(q.options.map(o => o.id).sort()).toEqual(['no', 'yes'])
      const text = q.prompt.sentence!.text
      expect(text).toMatch(/הַמְּמֻצָּע/)
      expect(text).toContain(`הוּא ${Number(mean.toFixed(3))}.`)
      expect(text).not.toMatch(/[{}]/)
      expect(ids(q.say)).toEqual([M6.trueOrNot, `raw:${text}`])
      expect(q.prompt.sentence!.say).toBe(`raw:${text}`)
      seen.add(`${kind}${yes}`)
    })
    expect(seen.size).toBe(6)
  })
  it('adding a 0 changes the mean, adding the mean itself does not', () => {
    const adds = new Set<string>()
    each(meanTruthsQuestion, q => {
      if (!q.itemKey.startsWith('mt:ad:')) return
      const [, , list, x] = q.itemKey.split(':')
      const vs = list!.split(',').map(Number)
      const mean = meanOfValues(vs)
      const after = (vs.reduce((a, b) => a + b, 0) + Number(x)) / (vs.length + 1)
      expect(q.answer).toBe(after !== mean ? 'yes' : 'no')
      adds.add(x === '0' ? 'zero' : Number(x) === mean ? 'mean' : 'other')
    })
    expect(adds.has('zero') && adds.has('mean')).toBe(true)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(meanTruthsQuestion, meanTruthsAccepts, 100))
})

/* ---------- keys across games ---------- */

describe('item keys', () => {
  const games: [string, (c: GenContext) => { itemKey: string }, (key: string) => boolean][] = [
    ['machineOutput', machineOutputQuestion, machineOutputAccepts], ['machineRule', machineRuleQuestion, machineRuleAccepts], ['roman', romanQuestion, romanAccepts],
    ['gematria', gematriaQuestion, gematriaAccepts], ['fractionOf', fractionOfQuestion, fractionOfAccepts], ['fractionGrid', fractionGridQuestion, fractionGridAccepts],
    ['biggerSmaller', biggerSmallerQuestion, biggerSmallerAccepts], ['howManyFit', howManyFitQuestion, howManyFitAccepts], ['divideUnit', divideUnitQuestion, divideUnitAccepts],
    ['divideFraction', divideFractionQuestion, divideFractionAccepts], ['wherePoint', wherePointQuestion, wherePointAccepts],
    ['decimalMental', decimalMentalQuestion, decimalMentalAccepts], ['estimateProduct', estimateProductQuestion, estimateProductAccepts],
    ['percentOf', percentOfQuestion, percentOfAccepts], ['percentArena', percentArenaQuestion, percentArenaAccepts], ['percentMatch', percentMatchQuestion, percentMatchAccepts],
    ['findWhole', findWholeQuestion, findWholeAccepts], ['discount', discountQuestion, discountAccepts], ['priceRise', priceRiseQuestion, priceRiseAccepts],
    ['compositeArea', compositeAreaQuestion, compositeAreaAccepts], ['compositePerimeter', compositePerimeterQuestion, compositePerimeterAccepts],
    ['scaleEffect', scaleEffectQuestion, scaleEffectAccepts], ['circleParts', circlePartsQuestion, circlePartsAccepts], ['circumference', circumferenceQuestion, circumferenceAccepts],
    ['circleArea', circleAreaQuestion, circleAreaAccepts], ['countCubes', countCubesQuestion, countCubesAccepts], ['boxVolume', boxVolumeQuestion, boxVolumeAccepts],
    ['volumeUnit', volumeUnitQuestion, volumeUnitAccepts], ['levelBars', levelBarsQuestion, levelBarsAccepts], ['findMean', findMeanQuestion, findMeanAccepts],
    ['meanTruths', meanTruthsQuestion, meanTruthsAccepts],
  ]
  const sharedPair = (a: string, b: string) => [a, b].sort().join() === ['percentArena', 'percentOf'].join()
  it('each game accepts its own keys and no other game accepts them (percentOf and the arena share keys)', () => {
    for (const [name, gen, accepts] of games) {
      for (const seed of SEEDS.slice(0, 40)) {
        const key = gen(ctx(seed)).itemKey
        expect(accepts(key), `${name} ${key}`).toBe(true)
        for (const [other, , otherAccepts] of games)
          if (other !== name && !sharedPair(name, other)) expect(otherAccepts(key), `${other} accepts ${name}'s ${key}`).toBe(false)
      }
    }
  })
  it('rejects malformed keys', () => {
    for (const [name, , accepts] of games)
      for (const key of ['', 'x', 'mo:', 'mo:x3:0', 'rom:0:a', 'rom:2001:a', 'gem:1000:b', 'fo:3:4:21', 'fg:0:2:1:2', 'df:1:2:1:2', 'wp:0.1:5', 'po:30:100', 'ca:L:1.2.3.4:9', 'cub:6:1:1', 'bv:1:1:1', 'lb:1,1,1', 'fm:1,2', 'mt:in:1,2'])
        expect(accepts(key), `${name} ${key}`).toBe(false)
  })
})
