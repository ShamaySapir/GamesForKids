import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { SHARE_STORIES } from './content/share-stories'
import { SURVEYS } from './content/surveys'
import {
  SOLID_COUNTS, addMixedAccepts, addMixedQuestion, addUnlikeAccepts, addUnlikeQuestion, betweenAccepts, betweenQuestion, change20Accepts, change20Question,
  closestToAccepts, closestToQuestion, columnDecimalAccepts, columnDecimalQuestion, compareBigAccepts, compareBigQuestion, compareDecimalsAccepts,
  compareDecimalsQuestion, compareUnlikeAccepts, compareUnlikeQuestion, decimalFractionAccepts, decimalFractionQuestion, decimalHouseAccepts,
  decimalHouseQuestion, decimalLineAccepts, decimalLineQuestion, digitValueBigAccepts, digitValueBigQuestion, expandAccepts, expandQuestion,
  facesEdgesAccepts, facesEdgesQuestion, factorTreeAccepts, factorTreeQuestion, fractionAsDivisionAccepts, fractionAsDivisionQuestion,
  lineBeyond1Accepts, lineBeyond1Question, metersCmAccepts, metersCmQuestion, mixedImproperAccepts, mixedImproperQuestion, modeTableAccepts,
  modeTableQuestion, parallelogramAreaAccepts, parallelogramAreaQuestion, pickHeightAccepts, pickHeightQuestion, primeOrNotAccepts,
  primeOrNotQuestion, rectanglesOfNAccepts, rectanglesOfNQuestion, roundDecimalAccepts, roundDecimalQuestion, simplifyAccepts, simplifyQuestion,
  slideDigitsAccepts, slideDigitsQuestion, solidNetAccepts, solidNetQuestion, timesPowerAccepts, timesPowerQuestion, triangleAreaAccepts,
  triangleAreaQuestion,
} from './generators-g5'
import { M, M5, UNIT_LABEL, digitValue, surveyPhrase } from './ids'
import { phrases } from './phrases'
import type { Fraction, SlantAreaQ, SolidKind } from './types'

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
function expectSaysInstruction(q: { say: PhraseRef; instruction: string }) {
  expect(ids(q.say)[0] === q.instruction || ids(q.say)[0]?.startsWith('raw:'), String(q.say)).toBe(true)
}

const label = (o: PickOption) => (o as { label: string }).label
const artOf = (o: PickOption) => (o as Extract<PickOption, { kind: 'art' }>).art
const say = (o: PickOption) => (o as { say?: PhraseRef }).say
const num = (s: string) => Number(s.replace(/,/g, ''))

function expectPick(q: PickQ, options: number) {
  const optionIds = q.options.map(o => o.id)
  expect(q.options).toHaveLength(options)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  const labels = q.options.filter(o => 'label' in o).map(label)
  expect(new Set(labels).size).toBe(labels.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  expectKnown([q.say, q.instruction, q.hint, ...q.options.map(say)])
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

/** Every key a generator asks must be accepted by its own Accepts and by no other game's. */
function expectOwnKeysOnly(gens: { name: string; gen: (c: GenContext) => { itemKey: string }; accepts: (key: string) => boolean }[]) {
  for (const g of gens) {
    for (const seed of SEEDS.slice(0, 60)) {
      const key = g.gen(ctx(seed)).itemKey
      for (const other of gens) expect(other.accepts(key), `${g.name} key ${key} vs ${other.name}`).toBe(other === g)
    }
  }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const improper = (f: Fraction) => [(f.whole ?? 0) * f.den + f.num, f.den] as const
const sameValue = (f: Fraction, num: number, den: number) => improper(f)[0] * den === num * improper(f)[1]
/** A decimal text ('3.05', '0.50') as integer thousandths, written separately from the generator's. */
const thou = (s: string) => {
  const [w, f = ''] = s.split('.')
  return Number(w) * 1000 + Number(f.padEnd(3, '0'))
}
const isPrimeSlow = (n: number) => {
  if (n < 2) return false
  for (let d = 2; d < n; d++) if (n % d === 0) return false
  return true
}
/** How a whole number is shown: commas from five digits. */
const shown = (n: number) => (n >= 10000 ? n.toLocaleString('en-US') : String(n))
const decimals = (x: number) => (String(x).split('.')[1] ?? '').length

/* ---------- 42. numbers above a million ---------- */

describe('digit value (big)', () => {
  it('offers the four place values of a digit that appears once, in a number of 7–9 digits; one is right', () => {
    each(digitValueBigQuestion, q => {
      expectPick(q, 4)
      const [, n, d] = /^dvb:(\d+):(\d)$/.exec(q.itemKey)!
      expect(n!.length).toBeGreaterThanOrEqual(7)
      expect(n!.length).toBeLessThanOrEqual(9)
      expect(n!.split('').filter(c => c === d)).toHaveLength(1)
      expect(q.prompt.expr).toBe(num(q.prompt.expr!).toLocaleString('en-US'))
      expect(num(q.prompt.expr!)).toBe(+n!)
      const k = n!.length - 1 - n!.indexOf(d!)
      expect(+q.answer).toBe(+d! * 10 ** k)
      const values = q.options.map(o => +o.id).sort((a, b) => a - b)
      values.forEach((v, i) => expect(v).toBe(values[0]! * 10 ** i))
      expect(ids(q.say)).toEqual([digitValue(+d!)])
      expect(q.instruction).toBe(digitValue(+d!))
    })
  })
  it('reads big option numbers by the browser voice and groups them with commas', () => {
    each(digitValueBigQuestion, q => {
      for (const o of q.options) {
        const v = +o.id
        expect(label(o)).toBe(v >= 10000 ? v.toLocaleString('en-US') : String(v))
        if (v > 10000) expect(ids(say(o))[0]!.startsWith('raw:')).toBe(true)
      }
    })
  })
  it('asks all digit counts, reviews and avoids', () => {
    const lengths = new Set<number>()
    each(digitValueBigQuestion, q => lengths.add(/^dvb:(\d+)/.exec(q.itemKey)![1]!.length))
    expect([...lengths].sort()).toEqual([7, 8, 9])
    expectReviewAndAvoid(digitValueBigQuestion, digitValueBigAccepts)
  })
})

describe('compare (big)', () => {
  it('answers <, = or > exactly, with the numbers shown with commas', () => {
    let equal = 0
    let boundary = 0
    each(compareBigQuestion, q => {
      expectPick(q, 3)
      expect(q.options.map(o => o.id)).toEqual(['<', '=', '>'])
      const [a, b] = q.prompt.expr!.split(' ? ').map(num) as [number, number]
      expect(q.answer).toBe(a < b ? '<' : a > b ? '>' : '=')
      for (const s of q.prompt.expr!.split(' ? ')) expect(s).toBe(shown(num(s)))
      expect(Math.min(a, b)).toBeGreaterThanOrEqual(100000)
      expect(Math.max(a, b)).toBeLessThan(1e9)
      if (a === b) equal++
      if (String(a).length !== String(b).length) boundary++
      expect(ids(q.say)).toEqual([M.compare])
    })
    expect(equal).toBeGreaterThan(10)
    expect(boundary).toBeGreaterThan(10)
    expectReviewAndAvoid(compareBigQuestion, compareBigAccepts)
  })
})

describe('times and divides by powers of ten', () => {
  it('multiplies by 10, 100, 1,000 and divides back, within a billion, with room on the pad', () => {
    const seen = { x: 0, d: 0 }
    each(timesPowerQuestion, q => {
      const m = /^tp([xd]):(\d+):(10|100|1000)$/.exec(q.itemKey)!
      const a = +m[2]!
      const p = +m[3]!
      expect(q.answer).toBe(m[1] === 'x' ? a * p : a / p)
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeLessThan(1e9)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.prompt.expr).toBe(`${shown(a)} ${m[1] === 'x' ? '×' : ':'} ${shown(p)} = ?`)
      if (m[1] === 'd') expect(a % p).toBe(0)
      seen[m[1] as 'x' | 'd']++
      expectKnown([q.say, q.instruction, q.hint])
      expectSaysInstruction(q)
    })
    expect(seen.x).toBeGreaterThan(40)
    expect(seen.d).toBeGreaterThan(40)
    expectReviewAndAvoid(timesPowerQuestion, timesPowerAccepts)
  })
})

/* ---------- 43. primes and composites ---------- */

describe('prime or not', () => {
  it('sorts eight numbers of 1–50 into three bins; 1 is always neither, 2 always prime', () => {
    each(primeOrNotQuestion, q => {
      expect(q.items).toHaveLength(8)
      expect(new Set(q.items).size).toBe(8)
      expect(q.items.every(n => n >= 1 && n <= 50)).toBe(true)
      expect(q.items).toContain(1)
      expect(q.items).toContain(2)
      expect(q.bins).toEqual([M5.prime, M5.composite, M5.neither])
      expect(q.answer).toHaveLength(8)
      q.items.forEach((n, i) => {
        const expected = n === 1 ? 2 : isPrimeSlow(n) ? 0 : 1
        expect(q.answer[i], String(n)).toBe(expected)
      })
      expect(q.answer[q.items.indexOf(1)]).toBe(2)
      expect(q.answer[q.items.indexOf(2)]).toBe(0)
      const primes = q.answer.filter(b => b === 0).length
      expect(primes).toBeGreaterThanOrEqual(3)
      expect(primes).toBeLessThanOrEqual(5)
      expect(q.answer.filter(b => b === 1).length).toBeGreaterThanOrEqual(2)
      expect(q.itemKey).toBe(`prime:${[...q.items].sort((a, b) => a - b).join(',')}`)
      expectKnown([q.say, q.instruction, q.hint, ...q.bins])
      expect(q.hint).toBe(M5.primeHint)
    })
    expectReviewAndAvoid(primeOrNotQuestion, primeOrNotAccepts)
  })
})

describe('rectangles of n', () => {
  it('counts the different rectangles of area n (a × b and b × a are one); a prime has one', () => {
    const counts = new Set<number>()
    each(rectanglesOfNQuestion, q => {
      const n = +/^rect:(\d+)$/.exec(q.itemKey)![1]!
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(36)
      let expected = 0
      for (let a = 1; a <= n; a++) for (let b = a; b <= n; b++) if (a * b === n) expected++
      expect(q.answer).toBe(expected)
      if (isPrimeSlow(n)) expect(q.answer).toBe(1)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.aidArt).toEqual([{ name: 'math.rects', props: { n } }])
      expect(q.prompt.objects?.[0]?.count ?? parseInt(q.prompt.expr!)).toBe(n)
      expect(q.hint).toBe(M5.rectanglesHint)
      expect(ids(q.say)[0]).toBe(M5.rectangles)
      expectKnown([q.say, q.instruction, q.hint])
      counts.add(q.answer)
    })
    expect([...counts].sort()).toEqual([1, 2, 3, 4, 5])
    expectReviewAndAvoid(rectanglesOfNQuestion, rectanglesOfNAccepts, 20)
  })
})

describe('factor tree', () => {
  it('asks a composite number of 12–100; the answer is its prime factors in order, with product n', () => {
    let three = 0
    let two = 0
    each(factorTreeQuestion, q => {
      expect(q.n).toBeGreaterThanOrEqual(12)
      expect(q.n).toBeLessThanOrEqual(100)
      expect(isPrimeSlow(q.n)).toBe(false)
      expect(q.itemKey).toBe(`ft:${q.n}`)
      expect(q.answer.every(isPrimeSlow)).toBe(true)
      expect(q.answer.reduce((a, b) => a * b, 1)).toBe(q.n)
      expect([...q.answer].sort((a, b) => a - b)).toEqual([...q.answer])
      if (q.answer.length === 2) two++
      else three++
      expectKnown([q.say, q.instruction, q.hint])
      expect(q.instruction).toBe(M5.factorTree)
    })
    expect(two).toBeGreaterThan(40)
    expect(three).toBeGreaterThan(40)
    expectReviewAndAvoid(factorTreeQuestion, factorTreeAccepts)
  })
})

/* ---------- 44. fractions beyond one ---------- */

describe('line beyond 1', () => {
  it('places an improper fraction (never a whole number) on a line to 2 or 3 in units of 1/den', () => {
    const ks = new Set<number>()
    each(lineBeyond1Question, q => {
      const [, n, d, k] = /^lb1:(\d+):(\d+):(\d)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number]
      expect(q.target).toBe(n)
      expect(q.answer).toBe(n)
      expect(n).toBeGreaterThan(d)
      expect(n % d).not.toBe(0)
      expect(n).toBeLessThan(d * k)
      expect(q.line).toEqual({ min: 0, max: d * k, step: 1, labelEvery: d, den: d })
      expect(q.tolerance).toBe(0)
      expect([2, 3]).toContain(k)
      ks.add(k)
      expectKnown([q.say, q.instruction, q.hint])
      expectSaysInstruction(q)
    })
    expect([...ks].sort()).toEqual([2, 3])
    expectReviewAndAvoid(lineBeyond1Question, lineBeyond1Accepts)
  })
})

describe('mixed and improper', () => {
  it('goes both ways with the same value; the mixed answer has a numerator below the denominator', () => {
    let toMixed = 0
    let toImproper = 0
    each(mixedImproperQuestion, q => {
      if (q.itemKey.startsWith('mixm:')) {
        toMixed++
        const [, n, d] = /^mixm:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number]
        expect(q.prompt.expr).toBe(`${n}/${d}`)
        expect(q.mixed).toBe(true)
        expect(q.answer.whole).toBeGreaterThanOrEqual(1)
        expect(q.answer.num).toBeGreaterThanOrEqual(1)
        expect(q.answer.num).toBeLessThan(q.answer.den)
        expect(gcd(q.answer.num, q.answer.den)).toBe(1)
        expect(sameValue(q.answer, n, d)).toBe(true)
        expect(q.instruction).toBe(M5.asMixed)
      } else {
        toImproper++
        const [, w, n, d] = /^mixi:(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number]
        expect(q.prompt.expr).toBe(`${w} ${n}/${d}`)
        expect(q.mixed).toBe(false)
        expect(q.answer.whole).toBeUndefined()
        expect(q.answer.num).toBeGreaterThan(q.answer.den)
        expect(sameValue(q.answer, w * d + n, d)).toBe(true)
        expect(n).toBeLessThan(d)
        expect(q.instruction).toBe(M5.asImproper)
      }
      expect(q.hint).toBe(M5.mixedHint)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(toMixed).toBeGreaterThan(60)
    expect(toImproper).toBeGreaterThan(60)
    expectReviewAndAvoid(mixedImproperQuestion, mixedImproperAccepts)
  })
})

describe('fraction as division', () => {
  it('tells the story with its numbers and answers n/d, mixed when there is more than one each', () => {
    const ids5 = new Set<string>()
    each(fractionAsDivisionQuestion, q => {
      const [, id, n, d] = /^fad:([a-z]+):(\d+):(\d+)$/.exec(q.itemKey)!.map((v, i) => (i === 1 ? v : Number(v))) as [string, string, number, number]
      ids5.add(id)
      const story = SHARE_STORIES.find(s => s.id === id)!
      const text = story.text.split('{n}').join(String(n)).split('{d}').join(String(d))
      expect(q.prompt.sentence?.text).toBe(text)
      expect(q.prompt.sentence?.say).toBe(`raw:${text}`)
      expect(q.say).toBe(`raw:${text}`)
      expect(text).not.toContain('{')
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(5)
      expect(d).toBeGreaterThanOrEqual(2)
      expect(d).toBeLessThanOrEqual(8)
      expect(n % d).not.toBe(0)
      expect(sameValue(q.answer, n, d)).toBe(true)
      expect(q.mixed).toBe(n > d)
      expect((q.answer.whole ?? 0) > 0).toBe(n > d)
      expect(q.instruction).toBe(M5.eachGets)
      expect(q.hint).toBe(M5.shareHint)
      expectKnown([q.instruction, q.hint])
    })
    expect(ids5.size).toBe(SHARE_STORIES.length)
    expectReviewAndAvoid(fractionAsDivisionQuestion, fractionAsDivisionAccepts, 20)
  })
})

/* ---------- 45. equivalent fractions ---------- */

describe('simplify', () => {
  it('asks a reducible fraction below 1 with a denominator up to 60; the answer is the simplest form', () => {
    let big = 0
    each(simplifyQuestion, q => {
      const [, a, b] = /^simp:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number]
      expect(b).toBeLessThanOrEqual(60)
      expect(a).toBeLessThan(b)
      expect(gcd(a, b)).toBeGreaterThan(1)
      expect(q.prompt.expr).toBe(`${a}/${b} = ?`)
      expect(sameValue(q.answer, a, b)).toBe(true)
      expect(gcd(q.answer.num, q.answer.den)).toBe(1)
      expect(q.answer.whole).toBeUndefined()
      expect(q.simplest).toBe(true)
      expect(q.mixed).toBe(false)
      if (b > 20) big++
      for (const s of q.aidStrips ?? []) expect(+s.split('/')[1]!).toBeLessThanOrEqual(12)
      expectKnown([q.say, q.instruction, q.hint])
      expect(q.hint).toBe(M5.simplifyHint)
    })
    expect(big).toBeGreaterThan(60)
    expectReviewAndAvoid(simplifyQuestion, simplifyAccepts)
  })
})

describe('expand', () => {
  it('asks for the numerator over a given denominator; the answer is exactly that', () => {
    each(expandQuestion, q => {
      const [, a, b, e] = /^exp:(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number]
      expect(e % b).toBe(0)
      expect(e).toBeGreaterThan(b)
      expect(gcd(a, b)).toBe(1)
      expect(q.prompt.expr).toBe(`${a}/${b} = ?/${e}`)
      expect(q.answer).toEqual({ num: (a * e) / b, den: e })
      expect(q.simplest).toBeUndefined()
      expect(q.mixed).toBe(false)
      expectKnown([q.say, q.instruction, q.hint])
      expect(q.hint).toBe(M5.expandHint)
    })
    expectReviewAndAvoid(expandQuestion, expandAccepts)
  })
})

describe('compare unlike fractions', () => {
  it('answers exactly by cross-multiplying; some pairs are equal; denominators differ', () => {
    let equal = 0
    let less = 0
    let greater = 0
    each(compareUnlikeQuestion, q => {
      expectPick(q, 3)
      const [, a, b, c, d] = /^fcu:(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number, number]
      expect(b).not.toBe(d)
      expect(q.prompt.expr).toBe(`${a}/${b} ? ${c}/${d}`)
      expect(q.answer).toBe(a * d < c * b ? '<' : a * d > c * b ? '>' : '=')
      expect(q.aidArt).toEqual([{ name: 'math.strips', props: { a: `${a}/${b}`, b: `${c}/${d}` } }])
      if (q.answer === '=') equal++
      if (q.answer === '<') less++
      if (q.answer === '>') greater++
    })
    expect(equal).toBeGreaterThan(15)
    expect(less).toBeGreaterThan(30)
    expect(greater).toBeGreaterThan(30)
    expectReviewAndAvoid(compareUnlikeQuestion, compareUnlikeAccepts)
  })
})

describe('between', () => {
  it('the example is strictly between the two fractions; adjacent numerators come up', () => {
    let adjacent = 0
    each(betweenQuestion, q => {
      const [, a, b, c, d] = /^btw:(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number, number]
      expect(a * d).toBeLessThan(c * b)
      expect(q.between).toEqual([{ num: a, den: b }, { num: c, den: d }])
      const [n, den] = improper(q.answer)
      expect(n * b).toBeGreaterThan(a * den)
      expect(n * d).toBeLessThan(c * den)
      expect(q.answer.whole).toBeUndefined()
      expect(q.mixed).toBe(false)
      expect(q.simplest).toBeUndefined()
      expect(q.prompt.expr).toBe(`${a}/${b} , ${c}/${d}`)
      if (b === d && c === a + 1) adjacent++
      expectKnown([q.say, q.instruction, q.hint])
      expect(q.hint).toBe(M5.betweenHint)
    })
    expect(adjacent).toBeGreaterThan(60)
    expectReviewAndAvoid(betweenQuestion, betweenAccepts)
  })
})

/* ---------- 46. adding fractions with unlike denominators ---------- */

describe('add unlike', () => {
  it('adds fractions with different denominators of at most 12 exactly; coprime and shared factors both come up', () => {
    let coprime = 0
    let shared = 0
    each(addUnlikeQuestion, q => {
      const [, a, b, c, d] = /^au:(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number, number]
      expect(b).not.toBe(d)
      expect(Math.max(b, d)).toBeLessThanOrEqual(12)
      expect(a).toBeLessThan(b)
      expect(c).toBeLessThan(d)
      expect(sameValue(q.answer, a * d + c * b, b * d)).toBe(true)
      expect(q.prompt.expr).toBe(`${a}/${b} + ${c}/${d} = ?`)
      if (improper(q.answer)[0] >= improper(q.answer)[1]) expect(q.mixed).toBe(true)
      if (gcd(b, d) === 1) coprime++
      else shared++
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(coprime).toBeGreaterThan(60)
    expect(shared).toBeGreaterThan(30)
    expectReviewAndAvoid(addUnlikeQuestion, addUnlikeAccepts)
  })
})

describe('add mixed', () => {
  it('adds two mixed numbers exactly; the answer is a mixed number', () => {
    each(addMixedQuestion, q => {
      const [, w1, a, b, w2, c, d] = /^amx:(\d+):(\d+):(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number) as [number, number, number, number, number, number, number]
      expect(b).not.toBe(d)
      expect(Math.max(b, d)).toBeLessThanOrEqual(12)
      expect(a).toBeLessThan(b)
      expect(c).toBeLessThan(d)
      expect(q.prompt.expr).toBe(`${w1} ${a}/${b} + ${w2} ${c}/${d} = ?`)
      expect(sameValue(q.answer, (w1 * b + a) * d + (w2 * d + c) * b, b * d)).toBe(true)
      expect(q.mixed).toBe(true)
      expect(q.answer.whole).toBeGreaterThanOrEqual(2)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expectReviewAndAvoid(addMixedQuestion, addMixedAccepts)
  })
})

describe('closest to', () => {
  it('asks for the nearest of three targets, never on a tie', () => {
    const kinds = new Set<string>()
    each(closestToQuestion, q => {
      expectPick(q, 3)
      const [, kind, a, b, c, d] = /^clo:([hw]):(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map((v, i) => (i === 1 ? v : Number(v))) as [string, string, number, number, number, number]
      kinds.add(kind)
      const sum = a / b + c / d
      const targets = kind === 'h' ? [0, 0.5, 1] : [1, 2, 3]
      const dist = targets.map(t => Math.abs(sum - t))
      const best = Math.min(...dist)
      expect(dist.filter(x => Math.abs(x - best) < 1e-9)).toHaveLength(1)
      const sorted = [...dist].sort((x, y) => x - y)
      expect(sorted[1]! - sorted[0]!).toBeGreaterThanOrEqual(0.1 - 1e-9)
      expect(q.options.map(o => o.id)).toEqual(kind === 'h' ? ['0', '1/2', '1'] : ['1', '2', '3'])
      expect(q.answer).toBe(q.options[dist.indexOf(best)]!.id)
      expect(q.prompt.expr).toBe(`${a}/${b} + ${c}/${d}`)
      expect(b).not.toBe(d)
      expect(q.hint).toBe(M5.closestHint)
    })
    expect([...kinds].sort()).toEqual(['h', 'w'])
    expectReviewAndAvoid(closestToQuestion, closestToAccepts)
  })
})

/* ---------- 47. decimals ---------- */

describe('decimal house', () => {
  it('builds a decimal with 1–3 places; the shown text is the number, columns fit its whole part', () => {
    const p = new Set<number>()
    each(decimalHouseQuestion, q => {
      expect(q.show).toBe(q.itemKey.slice(3))
      expect(q.answer).toBe(Number(q.show))
      expect(q.show).toMatch(/^\d{1,3}\.\d{1,3}$/)
      expect(q.show.endsWith('0')).toBe(false)
      expect(q.decimals).toBe(q.show.split('.')[1]!.length)
      p.add(q.decimals!)
      expect([2, 3]).toContain(q.columns)
      if (q.columns === 2) expect(Math.floor(q.answer)).toBeLessThan(100)
      expect(ids(q.say)[0]).toBe(M.build)
      expect(ids(q.say)[1]!.startsWith('raw:')).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect([...p].sort()).toEqual([1, 2, 3])
    expectReviewAndAvoid(decimalHouseQuestion, decimalHouseAccepts)
  })
})

describe('slide digits', () => {
  it('multiplies or divides by 10, 100, 1,000 exactly, with at most three places in the answer', () => {
    const seen = { x: 0, d: 0 }
    each(slideDigitsQuestion, q => {
      const m = /^sl([xd]):([\d.]+):(10|100|1000)$/.exec(q.itemKey)!
      const p = +m[3]!
      expect(q.decimal).toBe(true)
      expect(decimals(q.answer)).toBeLessThanOrEqual(3)
      expect(q.answer).toBe(Number(q.answer.toFixed(3)))
      expect(q.prompt.expr).toBe(`${m[2]} ${m[1] === 'x' ? '×' : ':'} ${shown(p)} = ?`)
      expect(q.aidArt).toEqual([{ name: 'math.house', props: { before: m[2]!, after: String(q.answer) } }])
      expect(q.hint).toBe(M5.slideHint)
      expect(String(q.answer).replace('.', '').length).toBeLessThanOrEqual(q.maxDigits)
      seen[m[1] as 'x' | 'd']++
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(seen.x).toBeGreaterThan(60)
    expect(seen.d).toBeGreaterThan(60)
    expectReviewAndAvoid(slideDigitsQuestion, slideDigitsAccepts)
  })
  it('the answer is the exact scaling of the digits (checked in thousandths)', () => {
    each(slideDigitsQuestion, q => {
      const m = /^sl([xd]):([\d.]+):(10|100|1000)$/.exec(q.itemKey)!
      const x3 = thou(m[2]!)
      const p = +m[3]!
      // x × p in thousandths is x3 × p; x : p in thousandths is x3 / p
      const expected3 = m[1] === 'x' ? x3 * p : x3 / p
      expect(Math.round(q.answer * 1000)).toBe(expected3)
    })
  })
})

describe('decimal and fraction', () => {
  it('matches a decimal to its fraction in lowest terms, and back; one right option', () => {
    let toFraction = 0
    let toDecimal = 0
    each(decimalFractionQuestion, q => {
      expectPick(q, 4)
      const [, kind, n, d] = /^df([ab]):(\d+):(\d+)$/.exec(q.itemKey)!.map((v, i) => (i === 1 ? v : Number(v))) as [string, string, number, number]
      expect([2, 4, 5, 10, 20, 25, 50, 100]).toContain(d)
      expect(gcd(n, d)).toBe(1)
      expect(q.instruction).toBe(M5.sameValue)
      if (kind === 'a') {
        toFraction++
        expect(thou(q.prompt.expr!) * d).toBe(n * 1000)
        expect(q.answer).toBe(`${n}/${d}`)
        for (const o of q.options) {
          const [on, od] = o.id.split('/').map(Number) as [number, number]
          expect(gcd(on, od)).toBe(1)
          expect(on * d === n * od).toBe(o.id === q.answer)
        }
      } else {
        toDecimal++
        expect(q.prompt.expr).toBe(`${n}/${d}`)
        expect(thou(q.answer) * d).toBe(n * 1000)
        for (const o of q.options) expect(thou(o.id) * d === n * 1000).toBe(o.id === q.answer)
      }
    })
    expect(toFraction).toBeGreaterThan(60)
    expect(toDecimal).toBeGreaterThan(60)
    expectReviewAndAvoid(decimalFractionQuestion, decimalFractionAccepts)
  })
})

/* ---------- 48. ordering decimals ---------- */

describe('compare decimals', () => {
  it('compares exactly (in thousandths) and shows the digits as written, trailing zeros kept; equal pairs come up', () => {
    let equal = 0
    let zeros = 0
    let longerSmaller = 0
    each(compareDecimalsQuestion, q => {
      expectPick(q, 3)
      expect(q.options.map(o => o.id)).toEqual(['<', '=', '>'])
      const [a, b] = q.prompt.expr!.split(' ? ') as [string, string]
      expect(q.itemKey).toBe(`cd:${a}:${b}`)
      expect(a).not.toBe(b)
      expect(q.answer).toBe(thou(a) < thou(b) ? '<' : thou(a) > thou(b) ? '>' : '=')
      if (q.answer === '=') equal++
      if (/0$/.test(a) || /0$/.test(b)) zeros++
      if ((a.length > b.length && thou(a) < thou(b)) || (b.length > a.length && thou(b) < thou(a))) longerSmaller++
      expect(q.hint).toBe(M5.decimalCompareHint)
      expect(ids(q.say)).toEqual([M.compare])
    })
    expect(equal).toBeGreaterThan(15)
    expect(zeros).toBeGreaterThan(30)
    expect(longerSmaller).toBeGreaterThan(30)
    expectReviewAndAvoid(compareDecimalsQuestion, compareDecimalsAccepts)
  })
})

describe('decimal line', () => {
  it('asks for a one-place decimal on a 0–1 or 0–10 line; the marker snaps to tenths', () => {
    const tops = new Set<number>()
    each(decimalLineQuestion, q => {
      const [, top, x] = /^dl(1|10):([\d.]+)$/.exec(q.itemKey)!
      tops.add(+top!)
      expect(q.target).toBe(Number(x))
      expect(q.answer).toBe(q.target)
      expect(Math.round(q.target * 10) % 10).not.toBe(0)
      expect(q.target).toBeGreaterThan(0)
      expect(q.target).toBeLessThan(+top!)
      expect(q.line.min).toBe(0)
      expect(q.line.max).toBe(+top!)
      expect(q.line.snap).toBe(0.1)
      expect(q.line.den).toBeUndefined()
      expect(q.tolerance).toBeLessThan(0.05)
      expect(q.line.step === 0.1 || q.line.step === 1).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect([...tops].sort((a, b) => a - b)).toEqual([1, 10])
    expectReviewAndAvoid(decimalLineQuestion, decimalLineAccepts)
  })
})

describe('round decimal', () => {
  it('rounds to the whole or the tenth, 5 rounding up; the distractors are other roundings', () => {
    const seen = { w: 0, t: 0 }
    let ties = 0
    each(roundDecimalQuestion, q => {
      expectPick(q, 4)
      const [, kind, x] = /^rd([wt]):([\d.]+)$/.exec(q.itemKey)!
      const x3 = thou(x!)
      const unit = kind === 'w' ? 1000 : 100
      expect(thou(q.answer)).toBe(Math.floor((x3 + unit / 2) / unit) * unit)
      expect(q.prompt.expr).toBe(x)
      expect(q.instruction).toBe(kind === 'w' ? M5.roundWhole : M5.roundTenth)
      expect(x!.endsWith('0')).toBe(false)
      if ((x3 % unit) * 2 === unit) ties++
      // the other direction is always offered
      const down = x3 - (x3 % unit)
      const wrongWay = thou(q.answer) === down ? down + unit : down
      expect(q.options.map(o => thou(o.id))).toContain(wrongWay)
      seen[kind as 'w' | 't']++
      expect(q.hint).toBeDefined()
    })
    expect(seen.w).toBeGreaterThan(60)
    expect(seen.t).toBeGreaterThan(60)
    expect(ties).toBeGreaterThan(20)
    expectReviewAndAvoid(roundDecimalQuestion, roundDecimalAccepts)
  })
})

/* ---------- 49. adding and subtracting decimals ---------- */

describe('column decimals', () => {
  it('adds and subtracts with 1–3 places; places is the larger count; results are positive and below 1,000', () => {
    const p = new Set<number>()
    const ops = new Set<string>()
    let different = 0
    each(columnDecimalQuestion, q => {
      const m = /^cold:([\d.]+)([+-])([\d.]+)$/.exec(q.itemKey)!
      expect(q.a).toBe(Number(m[1]))
      expect(q.b).toBe(Number(m[3]))
      expect(q.op).toBe(m[2])
      const [a3, b3] = [thou(m[1]!), thou(m[3]!)]
      expect(q.answer * 1000).toBeCloseTo(m[2] === '+' ? a3 + b3 : a3 - b3, 6)
      expect(Math.round(q.answer * 1000)).toBe(m[2] === '+' ? a3 + b3 : a3 - b3)
      expect(q.answer).toBeGreaterThan(0)
      expect(q.answer).toBeLessThan(1000)
      const [pa, pb] = [decimals(q.a), decimals(q.b)]
      expect(pa).toBeGreaterThanOrEqual(1)
      expect(pb).toBeGreaterThanOrEqual(1)
      expect(q.places).toBe(Math.max(pa, pb))
      if (pa !== pb) different++
      p.add(q.places!)
      ops.add(q.op)
      expect(q.instruction).toBe(M5.columnDecimal)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect([...p].sort()).toEqual([1, 2, 3])
    expect([...ops].sort()).toEqual(['+', '-'])
    expect(different).toBeGreaterThan(40)
    expectReviewAndAvoid(columnDecimalQuestion, columnDecimalAccepts)
  })
})

describe('change from 20', () => {
  it('asks the change from 20 for a price of 0.10–19.90, shown with two places', () => {
    const kinds = new Set<number>()
    each(change20Question, q => {
      const t = +/^ch:(\d+)$/.exec(q.itemKey)![1]!
      expect(t).toBeGreaterThanOrEqual(1)
      expect(t).toBeLessThanOrEqual(199)
      expect(q.prompt.expr).toBe(`${(t / 10).toFixed(2)} ₪`)
      expect(Math.round(q.answer * 1000)).toBe((200 - t) * 100)
      expect(q.decimal).toBe(true)
      expect(q.answer).toBe(Number(q.answer.toFixed(3)))
      expect(String(q.answer).replace('.', '').length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.instruction).toBe(M5.change)
      expectKnown([q.instruction])
      kinds.add(t % 10 === 0 ? 0 : t % 10 === 5 ? 5 : 1)
    })
    expect([...kinds].sort()).toEqual([0, 1, 5])
    expectReviewAndAvoid(change20Question, change20Accepts, 30)
  })
})

describe('metres and centimetres', () => {
  it('converts both ways between m + cm and decimal metres', () => {
    const dirs = new Set<string>()
    each(metersCmQuestion, q => {
      const [, dir, m, c] = /^mc([dc]):(\d):(\d+)$/.exec(q.itemKey)!.map((v, i) => (i === 1 ? v : Number(v))) as [string, string, number, number]
      dirs.add(dir)
      expect(c).toBeGreaterThanOrEqual(1)
      expect(c).toBeLessThanOrEqual(99)
      expect(q.decimal).toBe(true)
      if (dir === 'd') {
        expect(q.prompt.expr).toBe(`${m} ${UNIT_LABEL.m} ${c} ${UNIT_LABEL.cm} = ? ${UNIT_LABEL.m}`)
        expect(Math.round(q.answer * 100)).toBe(m * 100 + c)
      } else {
        expect(q.prompt.expr!.endsWith(`= ? ${UNIT_LABEL.cm}`)).toBe(true)
        expect(q.answer).toBe(m * 100 + c)
        expect(thou(q.prompt.expr!.split(' ')[0]!)).toBe((m * 100 + c) * 10)
      }
      expect(q.instruction).toBe('math.q.convert')
      expectKnown([q.say, q.instruction, q.hint])
      expect(String(q.answer).replace('.', '').length).toBeLessThanOrEqual(q.maxDigits)
    })
    expect([...dirs].sort()).toEqual(['c', 'd'])
    expectReviewAndAvoid(metersCmQuestion, metersCmAccepts)
  })
})

/* ---------- 50. heights and area ---------- */

describe('pick height', () => {
  it('offers three drawings of one shape; exactly one is the height, the others a median and a slanted segment', () => {
    const shapes = new Set<string>()
    each(pickHeightQuestion, q => {
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options.map(o => o.id)).size).toBe(3)
      expect(q.options.filter(o => o.id === 'height')).toHaveLength(1)
      expect(q.answer).toBe('height')
      expect(q.options.map(o => o.id).sort()).toEqual(['height', 'median', 'slant'])
      const [, shape, turn] = /^ph:(acute|right|obtuse|parallelogram):(\d+)$/.exec(q.itemKey)!
      shapes.add(shape!)
      for (const o of q.options) {
        expect(o.kind).toBe('art')
        const art = artOf(o)
        expect(art.name).toBe('math.height')
        expect(art.props!.shape).toBe(shape)
        expect(art.props!.seg).toBe(o.id)
        expect(art.props!.rot).toBe(+turn! * 30)
      }
      expect(q.instruction).toBe(M5.pickHeight)
      expect(q.hint).toBe(M5.heightHint)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect([...shapes].sort()).toEqual(['acute', 'obtuse', 'parallelogram', 'right'])
    expectReviewAndAvoid(pickHeightQuestion, pickHeightAccepts, 40)
  })
})

/** Twice the polygon's area by the shoelace formula, written separately from the generator. */
const shoelace2 = (pts: readonly (readonly [number, number])[]) =>
  Math.abs(pts.reduce((sum, [x, y], i) => sum + x * pts[(i + 1) % pts.length]![1] - pts[(i + 1) % pts.length]![0] * y, 0))

function expectSlant(q: SlantAreaQ, shape: 'triangle' | 'parallelogram') {
  expect(q.cols).toBeLessThanOrEqual(12)
  expect(q.rows).toBeLessThanOrEqual(10)
  expect(q.points).toHaveLength(shape === 'triangle' ? 3 : 4)
  for (const [x, y] of q.points) {
    expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true)
    expect(x).toBeGreaterThanOrEqual(0)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThanOrEqual(q.cols)
    expect(y).toBeLessThanOrEqual(q.rows)
  }
  expect(q.foot[0]).toBeGreaterThanOrEqual(0)
  expect(q.foot[0]).toBeLessThanOrEqual(q.cols)
  expect(q.foot[1]).toBeGreaterThanOrEqual(0)
  expect(q.foot[1]).toBeLessThanOrEqual(q.rows)
  expect(Number.isInteger(q.answer)).toBe(true)
  expect(q.answer * 2).toBe(shoelace2(q.points))
  // base horizontal or vertical; the height meets it at a right angle at the foot
  const [p, r] = [q.points[q.base[0]]!, q.points[q.base[1]]!]
  const [bx, by] = [r[0] - p[0], r[1] - p[1]]
  expect(bx === 0 || by === 0).toBe(true)
  const apex = q.points[q.apex]!
  const [hx, hy] = [apex[0] - q.foot[0], apex[1] - q.foot[1]]
  expect(hx * bx + hy * by === 0).toBe(true)
  expect(hx === 0 || hy === 0).toBe(true)
  // the foot lies on the base line
  expect((q.foot[0] - p[0]) * by - (q.foot[1] - p[1]) * bx === 0).toBe(true)
  const base = Math.abs(bx) + Math.abs(by)
  const height = Math.abs(hx) + Math.abs(hy)
  expect(height).toBeGreaterThanOrEqual(2)
  expect(base * height).toBe(shape === 'triangle' ? shoelace2(q.points) : shoelace2(q.points) / 2)
  expect(q.answer).toBe(shape === 'triangle' ? (base * height) / 2 : base * height)
  expect(q.hint).toBeDefined()
  expectKnown([q.say, q.instruction, q.hint])
}

describe('triangle area', () => {
  it('draws integer triangles on a grid; the area matches the shoelace formula, base × height is even', () => {
    let obtuse = 0
    let acute = 0
    let right = 0
    let vertical = 0
    each(triangleAreaQuestion, q => {
      expectSlant(q, 'triangle')
      expect(q.instruction).toBe(M5.triangleArea)
      const [p, r] = [q.points[q.base[0]]!, q.points[q.base[1]]!]
      const vertexOnBase = (v: readonly [number, number]) => Math.abs(v[0] - q.foot[0]) + Math.abs(v[1] - q.foot[1])
      const along = (r[0] !== p[0] ? [p[0], r[0]] : [p[1], r[1]]).sort((a, b) => a - b) as [number, number]
      const footAt = r[0] !== p[0] ? q.foot[0] : q.foot[1]
      if (footAt < along[0] || footAt > along[1]) obtuse++
      else if (vertexOnBase(p) === 0 || vertexOnBase(r) === 0) right++
      else acute++
      if (r[0] === p[0]) vertical++
    })
    expect(obtuse).toBeGreaterThan(40)
    expect(acute).toBeGreaterThan(20)
    expect(right).toBeGreaterThan(10)
    expect(vertical).toBeGreaterThan(40)
    expectReviewAndAvoid(triangleAreaQuestion, triangleAreaAccepts)
  })
})

describe('parallelogram area', () => {
  it('draws integer parallelograms on a grid; area = base × height, never a rectangle', () => {
    let outside = 0
    each(parallelogramAreaQuestion, q => {
      expectSlant(q, 'parallelogram')
      expect(q.instruction).toBe(M5.parallelogramArea)
      // opposite sides are parallel and equal (a real parallelogram), and not a rectangle
      const P = q.points
      expect([P[1]![0] - P[0]![0], P[1]![1] - P[0]![1]]).toEqual([P[2]![0] - P[3]![0], P[2]![1] - P[3]![1]])
      const apex = P[q.apex]!
      const [p, r] = [P[q.base[0]]!, P[q.base[1]]!]
      const side = [apex[0] - p[0], apex[1] - p[1]]
      expect(side[0]! * (r[0] - p[0]) + side[1]! * (r[1] - p[1])).not.toBe(0)
      const along = r[0] !== p[0] ? [p[0], r[0], q.foot[0]] : [p[1], r[1], q.foot[1]]
      if (along[2]! < Math.min(along[0]!, along[1]!) || along[2]! > Math.max(along[0]!, along[1]!)) outside++
    })
    expect(outside).toBeGreaterThan(40)
    expectReviewAndAvoid(parallelogramAreaQuestion, parallelogramAreaAccepts)
  })
})

/* ---------- 51. prisms and pyramids ---------- */

describe('solid net', () => {
  it('shows the solid and three nets; exactly one (wrong 0) folds into it', () => {
    const kinds = new Set<string>()
    each(solidNetQuestion, q => {
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options.map(o => o.id)).size).toBe(3)
      const kind = /^sn:(.+)$/.exec(q.itemKey)![1]!
      kinds.add(kind)
      expect(q.prompt.art).toEqual([{ name: 'math.solid', props: { kind } }])
      const wrongs = q.options.map(artOf)
      for (const a of wrongs) {
        expect(a.name).toBe('math.net')
        expect(a.props!.kind).toBe(kind)
      }
      expect(wrongs.map(a => a.props!.wrong).sort()).toEqual([0, 1, 2])
      const right = q.options.filter(o => artOf(o).props!.wrong === 0)
      expect(right).toHaveLength(1)
      expect(right[0]!.id).toBe(q.answer)
      expect(q.options.filter(o => o.id === q.answer)).toHaveLength(1)
      expect(q.instruction).toBe(M5.whichNet)
      expect(q.hint).toBe(M5.netHint)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(kinds.size).toBe(6)
    expectReviewAndAvoid(solidNetQuestion, solidNetAccepts, 6)
  })
})

describe('faces, edges, vertices', () => {
  it('counts from the table; every solid satisfies Euler (V − E + F = 2)', () => {
    const kinds = Object.keys(SOLID_COUNTS) as SolidKind[]
    expect(kinds).toHaveLength(6)
    for (const k of kinds) expect(SOLID_COUNTS[k].vertices - SOLID_COUNTS[k].edges + SOLID_COUNTS[k].faces).toBe(2)
    expect(SOLID_COUNTS.cube).toEqual({ faces: 6, edges: 12, vertices: 8 })
    expect(SOLID_COUNTS['hex-prism']).toEqual({ faces: 8, edges: 18, vertices: 12 })
    expect(SOLID_COUNTS['square-pyramid']).toEqual({ faces: 5, edges: 8, vertices: 5 })
    const asked = new Set<string>()
    each(facesEdgesQuestion, q => {
      const [, kind, count] = /^fe:(.+):(faces|edges|vertices)$/.exec(q.itemKey)!
      expect(q.answer).toBe(SOLID_COUNTS[kind as SolidKind][count as 'faces' | 'edges' | 'vertices'])
      expect(q.instruction).toBe({ faces: M5.faces, edges: M5.edges, vertices: M5.vertices }[count as 'faces'])
      expect(q.prompt.art).toEqual([{ name: 'math.solid', props: { kind } }])
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      asked.add(count!)
      expectKnown([q.say, q.instruction])
    })
    expect([...asked].sort()).toEqual(['edges', 'faces', 'vertices'])
    expectReviewAndAvoid(facesEdgesQuestion, facesEdgesAccepts, 18)
  })
})

/* ---------- 52. the mode ---------- */

describe('mode table', () => {
  it('asks the most common category of 4–5, counts 1–12; "both" only when exactly two tie; never three tied', () => {
    let ties = 0
    let unique = 0
    each(modeTableQuestion, q => {
      const [, id, rest] = /^mode:([a-z]+):(.+)$/.exec(q.itemKey)!
      const survey = SURVEYS.find(s => s.id === id)!
      const rows = rest!.split(',').map(p => p.split('.').map(Number) as [number, number])
      expect(rows.length).toBeGreaterThanOrEqual(4)
      expect(rows.length).toBeLessThanOrEqual(5)
      for (const [i, c] of rows) {
        expect(c).toBeGreaterThanOrEqual(1)
        expect(c).toBeLessThanOrEqual(12)
        expect(survey.categories[i]).toBeDefined()
      }
      const max = Math.max(...rows.map(([, c]) => c))
      const top = rows.filter(([, c]) => c === max).map(([i]) => survey.categories[i]!)
      expect(top.length).toBeLessThanOrEqual(2)
      const table = (q.prompt.art![0]!.props!.rows as string).split(',').map(r => r.split(':') as [string, string])
      expect(table.map(([l, c]) => [l, +c]).sort()).toEqual(rows.map(([i, c]) => [survey.categories[i]!, c]).sort())
      expect(q.prompt.art![0]!.name).toBe('math.freq')
      const labels = q.options.map(o => o.id)
      expect(new Set(labels).size).toBe(labels.length)
      for (const l of table.map(([c]) => c)) expect(labels).toContain(l)
      if (top.length === 2) {
        ties++
        expect(q.answer).toBe('both')
        expect(q.options).toHaveLength(rows.length + 1)
        expect(label(q.options.find(o => o.id === 'both')!)).toBe(phrases[M5.both])
        expect(say(q.options.find(o => o.id === 'both')!)).toBe(M5.both)
      } else {
        unique++
        expect(q.answer).toBe(top[0])
        expect(q.options).toHaveLength(rows.length)
        expect(labels).not.toContain('both')
      }
      expect(q.options.filter(o => o.id === q.answer)).toHaveLength(1)
      expect(q.instruction).toBe(surveyPhrase(id!))
      expect(q.hint).toBe(M5.modeHint)
      expectKnown([q.say, q.instruction, q.hint, M5.both])
    })
    expect(ties).toBeGreaterThan(60)
    expect(unique).toBeGreaterThan(60)
    expectReviewAndAvoid(modeTableQuestion, modeTableAccepts)
  })
})

/* ---------- item keys belong to their own game ---------- */

describe('item keys', () => {
  it('each game accepts only its own keys', () => {
    expectOwnKeysOnly([
      { name: 'digitValueBig', gen: digitValueBigQuestion, accepts: digitValueBigAccepts },
      { name: 'compareBig', gen: compareBigQuestion, accepts: compareBigAccepts },
      { name: 'timesPower', gen: timesPowerQuestion, accepts: timesPowerAccepts },
      { name: 'primeOrNot', gen: primeOrNotQuestion, accepts: primeOrNotAccepts },
      { name: 'rectanglesOfN', gen: rectanglesOfNQuestion, accepts: rectanglesOfNAccepts },
      { name: 'factorTree', gen: factorTreeQuestion, accepts: factorTreeAccepts },
      { name: 'lineBeyond1', gen: lineBeyond1Question, accepts: lineBeyond1Accepts },
      { name: 'mixedImproper', gen: mixedImproperQuestion, accepts: mixedImproperAccepts },
      { name: 'fractionAsDivision', gen: fractionAsDivisionQuestion, accepts: fractionAsDivisionAccepts },
      { name: 'simplify', gen: simplifyQuestion, accepts: simplifyAccepts },
      { name: 'expand', gen: expandQuestion, accepts: expandAccepts },
      { name: 'compareUnlike', gen: compareUnlikeQuestion, accepts: compareUnlikeAccepts },
      { name: 'between', gen: betweenQuestion, accepts: betweenAccepts },
      { name: 'addUnlike', gen: addUnlikeQuestion, accepts: addUnlikeAccepts },
      { name: 'addMixed', gen: addMixedQuestion, accepts: addMixedAccepts },
      { name: 'closestTo', gen: closestToQuestion, accepts: closestToAccepts },
      { name: 'decimalHouse', gen: decimalHouseQuestion, accepts: decimalHouseAccepts },
      { name: 'slideDigits', gen: slideDigitsQuestion, accepts: slideDigitsAccepts },
      { name: 'decimalFraction', gen: decimalFractionQuestion, accepts: decimalFractionAccepts },
      { name: 'compareDecimals', gen: compareDecimalsQuestion, accepts: compareDecimalsAccepts },
      { name: 'decimalLine', gen: decimalLineQuestion, accepts: decimalLineAccepts },
      { name: 'roundDecimal', gen: roundDecimalQuestion, accepts: roundDecimalAccepts },
      { name: 'columnDecimal', gen: columnDecimalQuestion, accepts: columnDecimalAccepts },
      { name: 'change20', gen: change20Question, accepts: change20Accepts },
      { name: 'metersCm', gen: metersCmQuestion, accepts: metersCmAccepts },
      { name: 'pickHeight', gen: pickHeightQuestion, accepts: pickHeightAccepts },
      { name: 'triangleArea', gen: triangleAreaQuestion, accepts: triangleAreaAccepts },
      { name: 'parallelogramArea', gen: parallelogramAreaQuestion, accepts: parallelogramAreaAccepts },
      { name: 'solidNet', gen: solidNetQuestion, accepts: solidNetAccepts },
      { name: 'facesEdges', gen: facesEdgesQuestion, accepts: facesEdgesAccepts },
      { name: 'modeTable', gen: modeTableQuestion, accepts: modeTableAccepts },
    ])
  })
})
