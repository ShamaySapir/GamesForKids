import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import { SENSIBLE_LENGTHS } from './content/lengths'
import { ROUND_UP_STORIES } from './content/round-up'
import {
  addLikeAccepts, addLikeQuestion, addRelatedAccepts, addRelatedQuestion, areaModelAccepts, areaModelQuestion, boxNetAccepts, boxNetQuestion,
  busStoryAccepts, busStoryQuestion, columnBigAccepts, columnBigQuestion, compare6Accepts, compare6Question, compareFractionsAccepts,
  compareFractionsQuestion, compensateAccepts, compensateQuestion, convertLengthAccepts, convertLengthQuestion, diagonalsAccepts, diagonalsQuestion,
  digitValueAccepts, digitValueQuestion, dividePadAccepts, dividePadQuestion, divideRemainderAccepts, divideRemainderQuestion, estimateMillionAccepts,
  estimateMillionQuestion, firstStep2Accepts, firstStep2Question, fractionLineAccepts, fractionLineQuestion, lastDigitAccepts, lastDigitQuestion,
  lineMillionAccepts, lineMillionQuestion, nameFractionAccepts, nameFractionQuestion, nameQuadAccepts, nameQuadQuestion, parallelPerpendicularAccepts,
  parallelPerpendicularQuestion, partOfAccepts, partOfQuestion, quadPropertyAccepts, quadPropertyQuestion, result2Accepts, result2Question,
  roundBigAccepts, roundBigQuestion, roundTimes2Accepts, roundTimes2Question, sensibleLengthAccepts, sensibleLengthQuestion, shadeFractionAccepts,
  shadeFractionQuestion, sort369Accepts, sort369Question, splitDivideAccepts, splitDivideQuestion, whichDivides369Accepts, whichDivides369Question,
  wholeTimesAccepts, wholeTimesQuestion,
} from './generators-g4'
import { M, M3, M4, UNIT_LABEL, digitValue, findLines, quadQuestion, roundTo, sensiblePhrase, whichDivides } from './ids'
import { phrases } from './phrases'
import type { Fraction, Thing } from './types'

/* ---------- fixtures and utilities ---------- */

const THINGS: Thing[] = [{ id: 'bird', emoji: '🐦' }, { id: 'apple', emoji: '🍎' }, { id: 'cookie', emoji: '🍪' }]
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
  expect(ids(q.say)[0]).toBe(q.instruction)
}

const label = (o: PickOption) => (o as { label: string }).label
const say = (o: PickOption) => (o as { say?: PhraseRef }).say
/** "1,234,567" or "372" → number. */
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

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const asFraction = (f: Fraction) => [(f.whole ?? 0) * f.den + f.num, f.den] as const
/** "3/4" and "5/4" read from an expression. */
const fractionsIn = (expr: string) => [...expr.matchAll(/(\d+)\/(\d+)/g)].map(m => [Number(m[1]), Number(m[2])] as const)

/** Evaluates a token list with the usual precedence and parentheses, written separately from the generator's. */
function calc(tokens: readonly string[]): number {
  let i = 0
  const factor = (): number => {
    const t = tokens[i++]!
    if (t !== '(') return Number(t)
    const v = sum()
    i++
    return v
  }
  const product = (): number => {
    let v = factor()
    while (tokens[i] === '×' || tokens[i] === ':') v = tokens[i++] === '×' ? v * factor() : v / factor()
    return v
  }
  const sum = (): number => {
    let v = product()
    while (tokens[i] === '+' || tokens[i] === '−') v = tokens[i++] === '+' ? v + product() : v - product()
    return v
  }
  return sum()
}
const tokenize = (expr: string) => expr.replace(/\(/g, '( ').replace(/\)/g, ' )').split(' ').filter(t => t !== '=' && t !== '?')

const carriesOf = (a: number, b: number, op: '+' | '-') => {
  const x = String(a).padStart(7, '0').split('').reverse().map(Number)
  const y = String(b).padStart(7, '0').split('').reverse().map(Number)
  let carry = 0
  let count = 0
  for (let i = 0; i < 7; i++) {
    const v = op === '+' ? x[i]! + y[i]! + carry : x[i]! - y[i]! - carry
    carry = op === '+' ? Number(v >= 10) : Number(v < 0)
    count += carry
  }
  return count
}

const nearest = (n: number, place: number) => (n % place >= place / 2 ? n - (n % place) + place : n - (n % place))

/* ---------- 29. numbers to a million ---------- */

describe('digit value', () => {
  it('offers the four place values of a digit that appears once; one is right', () => {
    each(digitValueQuestion, q => {
      expectPick(q, 4)
      const [, n, d] = /^dv:(\d+):(\d)$/.exec(q.itemKey)!
      expect(n!.length).toBeGreaterThanOrEqual(5)
      expect(n!.split('').filter(c => c === d)).toHaveLength(1)
      expect(q.prompt.expr).toBe(num(q.prompt.expr!).toLocaleString('en-US'))
      expect(num(q.prompt.expr!)).toBe(+n!)
      const k = n!.length - 1 - n!.indexOf(d!)
      expect(+q.answer).toBe(+d! * 10 ** k)
      const values = q.options.map(o => +o.id).sort((a, b) => a - b)
      values.forEach((v, i) => expect(v).toBe(values[0]! * 10 ** i))
      expect(values[0]).toBeGreaterThanOrEqual(+d!)
      expect(ids(q.say)).toEqual([digitValue(+d!)])
      expectSaysInstruction(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(digitValueQuestion, digitValueAccepts))
})

describe('compare 6', () => {
  it('has the three signs in order and the right answer; pairs differ in a place, by a swap, in length, or are equal', () => {
    let equal = 0
    let lengths = 0
    each(compare6Question, q => {
      expectPick(q, 3)
      expect(q.options.map(o => o.id)).toEqual(['<', '=', '>'])
      const [, a, b] = /^cmp6:(\d+):(\d+)$/.exec(q.itemKey)!
      expect(q.prompt.expr).toBe(`${(+a!).toLocaleString('en-US')} ? ${(+b!).toLocaleString('en-US')}`)
      expect(q.answer).toBe(+a! < +b! ? '<' : +a! > +b! ? '>' : '=')
      expect(+a!).toBeGreaterThanOrEqual(10000)
      expect(+a!).toBeLessThan(1000000)
      if (a === b) equal++
      else if (a!.length !== b!.length) lengths++
      else expect(a!.split('').filter((ch, i) => ch !== b![i]).length).toBeLessThanOrEqual(2)
      expectSaysInstruction(q)
    })
    expect(equal).toBeGreaterThan(10)
    expect(lengths).toBeGreaterThan(10)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(compare6Question, compare6Accepts))
})

describe('line million', () => {
  it('puts a multiple of 10,000 on a 0–1,000,000 line with ticks every 100,000', () => {
    let between = 0
    each(lineMillionQuestion, q => {
      expect(q.line).toMatchObject({ min: 0, max: 1000000, step: 100000 })
      expect(q.target).toBeGreaterThan(0)
      expect(q.target).toBeLessThan(1000000)
      expect(q.target % 10000).toBe(0)
      expect((q.target - q.line.min) % (q.line.snap ?? q.line.step)).toBe(0)
      expect(q.answer).toBe(q.target)
      expect(q.tolerance).toBe(25000)
      expect(q.itemKey).toBe(`line1m:${q.target}`)
      if (q.target % 100000 !== 0) between++
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction])
    })
    expect(between).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(lineMillionQuestion, lineMillionAccepts))
})

describe('round big', () => {
  it('rounds to the nearest 1,000, 10,000 or 100,000; wrong-way and wrong-place distractors; a half rounds up', () => {
    const places = new Set<number>()
    let halves = 0
    let wrongWay = 0
    each(roundBigQuestion, q => {
      expectPick(q, 4)
      const [, n, place] = /^rb:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      places.add(place!)
      expect(q.instruction).toBe(roundTo(place as 1000))
      expect(num(q.prompt.expr!)).toBe(n)
      expect(n! % place!).not.toBe(0)
      expect(+q.answer).toBe(nearest(n!, place!))
      expect(+q.answer).toBeGreaterThan(0)
      if (n! % place! === place! / 2) halves++
      const down = n! - (n! % place!)
      if (q.options.some(o => +o.id === (+q.answer === down ? down + place! : down))) wrongWay++
      for (const o of q.options) {
        expect(+o.id).toBeLessThanOrEqual(1000000)
        expect(+o.id).toBeGreaterThan(0)
      }
      expectSaysInstruction({ say: q.say, instruction: q.instruction })
    })
    expect(places).toEqual(new Set([1000, 10000, 100000]))
    expect(halves).toBeGreaterThan(30)
    expect(wrongWay).toBeGreaterThan(230)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(roundBigQuestion, roundBigAccepts))
})

/* ---------- 30. adding and subtracting to a million ---------- */

describe('column big', () => {
  it('stays within 1,000,000, up to six digits, at most three carries, never negative', () => {
    const ops = { '+': 0, '-': 0 }
    let many = 0
    each(columnBigQuestion, q => {
      expect(q.a).toBeLessThanOrEqual(999999)
      expect(q.b).toBeLessThanOrEqual(999999)
      expect(Math.max(q.a, q.b)).toBeGreaterThanOrEqual(10000)
      expect(q.answer).toBe(q.op === '+' ? q.a + q.b : q.a - q.b)
      expect(q.answer).toBeGreaterThan(0)
      expect(q.answer).toBeLessThanOrEqual(1000000)
      expect(carriesOf(q.a, q.b, q.op)).toBeLessThanOrEqual(3)
      if (carriesOf(q.a, q.b, q.op) >= 2) many++
      ops[q.op]++
      expect(q.itemKey).toBe(`colb:${q.a}${q.op}${q.b}`)
      expect(q.hint).toBe(q.op === '+' ? M3.columnHint : M3.borrowHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(ops['+']).toBeGreaterThan(80)
    expect(ops['-']).toBeGreaterThan(80)
    expect(many).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(columnBigQuestion, columnBigAccepts))
})

describe('compensate', () => {
  it('shows a true equation with one blank; the answer is one less', () => {
    const sides = { r: 0, l: 0 }
    each(compensateQuestion, q => {
      const [, a, b, side] = /^comp:(\d+):(\d+):([rl])$/.exec(q.itemKey)!
      sides[side as 'r' | 'l']++
      expect(+a! % 1000).toBe(0)
      expect(+b!).toBeLessThan(+a!)
      const expr = q.prompt.expr!
      expect(expr.split('?')).toHaveLength(2)
      const filled = expr.replace('?', String(q.answer))
      const [lhs, rhs] = filled.split(' = ') as [string, string]
      const value = (s: string) => {
        const [x, y] = s.split(' − ') as [string, string]
        return num(x) - num(y)
      }
      expect(value(lhs)).toBe(value(rhs))
      expect(q.answer).toBe(side === 'r' ? +b! - 1 : +a! - 1)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.hint).toBe(M4.compensateHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(sides.r).toBeGreaterThan(60)
    expect(sides.l).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(compensateQuestion, compensateAccepts))
})

describe('estimate million', () => {
  it('asks more or less than a hundred-thousand that clearly decides it', () => {
    each(estimateMillionQuestion, q => {
      expectPick(q, 2)
      const m = /^(\d[\d,]*) ([+−]) (\d[\d,]*) \? (\d[\d,]*)$/.exec(q.prompt.expr!)!
      const [a, b, bench] = [num(m[1]!), num(m[3]!), num(m[4]!)]
      const r = m[2] === '+' ? a + b : a - b
      expect(r).toBeGreaterThan(0)
      expect(r).toBeLessThanOrEqual(1000000)
      expect(bench % 100000).toBe(0)
      expect(Math.abs(r - bench)).toBeGreaterThanOrEqual(15000)
      expect(q.answer).toBe(r > bench ? 'more' : 'less')
      expect(q.instruction).toBe(M.estimate)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(estimateMillionQuestion, estimateMillionAccepts))
})

/* ---------- 31. multiplying big numbers ---------- */

describe('round times 2', () => {
  it('multiplies whole tens, hundreds and thousands; results up to 100,000', () => {
    const kinds = new Set<string>()
    each(roundTimes2Question, q => {
      const [, a, b] = /^rt2:(\d+)x(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(q.answer).toBe(a! * b!)
      expect(q.answer).toBeLessThanOrEqual(100000)
      expect(q.prompt.expr).toBe(`${a!.toLocaleString('en-US').replace(/,(?=\d{3}$)/, a! >= 10000 ? ',' : '')} × ${b} = ?`.replace(`${a} ×`, `${a! >= 10000 ? a!.toLocaleString('en-US') : a} ×`))
      kinds.add(`${String(a).length - 1 > 0 ? 'z' : ''}${String(Math.min(a!, b!)).length}${String(Math.max(a!, b!)).length}`)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(ids(q.say)[0]).toBe(M.solve)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(kinds.size).toBeGreaterThanOrEqual(4)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(roundTimes2Question, roundTimes2Accepts))
})

describe('area model', () => {
  it('asks 2×1, 2×2 and 3×1 digits with a non-round first factor; answer = a × b', () => {
    const shapes = new Set<string>()
    each(areaModelQuestion, q => {
      expect(q.answer).toBe(q.a * q.b)
      expect(q.itemKey).toBe(`am:${q.a}x${q.b}`)
      expect(q.a % 10).not.toBe(0)
      shapes.add(`${String(q.a).length}x${String(q.b).length}`)
      expect(q.hint).toBe(M4.areaModelHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(shapes).toEqual(new Set(['2x1', '2x2', '3x1']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(areaModelQuestion, areaModelAccepts))
})

describe('last digit', () => {
  it('asks yes or no; half the results are true, the others are close with a wrong last digit', () => {
    let yes = 0
    each(lastDigitQuestion, q => {
      expectPick(q, 2)
      expect(q.options.map(o => o.id)).toEqual(['yes', 'no'])
      const [, a, b, r] = /^ld:(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      const truth = a! * b!
      expect(q.prompt.expr).toBe(`${a} × ${b} = ${r! >= 10000 ? r!.toLocaleString('en-US') : r}`)
      expect(q.answer).toBe(r === truth ? 'yes' : 'no')
      if (r === truth) yes++
      else {
        expect(r! % 10).not.toBe(truth % 10)
        expect(Math.abs(r! - truth)).toBeLessThanOrEqual(8)
      }
      expect(q.hint).toBe(M3.lastDigitHint)
      expectSaysInstruction(q)
    })
    expect(yes).toBeGreaterThan(90)
    expect(yes).toBeLessThan(160)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(lastDigitQuestion, lastDigitAccepts))
})

/* ---------- 32. dividing by a single digit ---------- */

describe('split divide', () => {
  it('offers three splits of the dividend; exactly one has two parts that both divide', () => {
    each(splitDivideQuestion, q => {
      expectPick(q, 3)
      const [, n, d] = /^split:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(n! % d!).toBe(0)
      expect(q.prompt.expr).toBe(`${n} : ${d} = ?`)
      const helpful = q.options.filter(o => {
        const m = /^(\d+) : (\d+) \+ (\d+) : (\d+)$/.exec(label(o))!
        expect(+m[1]! + +m[3]!).toBe(n)
        expect(+m[2]!).toBe(d)
        expect(+m[4]!).toBe(d)
        return +m[1]! % d! === 0 && +m[3]! % d! === 0
      })
      expect(helpful.map(o => o.id)).toEqual([q.answer])
      expect(q.instruction).toBe(M4.helpfulSplit)
      expectSaysInstruction(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(splitDivideQuestion, splitDivideAccepts))
})

describe('divide pad', () => {
  it('divides a two- or three-digit number by a single digit, whole quotient, never by 0', () => {
    each(dividePadQuestion, q => {
      const [, n, d] = /^dp:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(d).toBeGreaterThanOrEqual(2)
      expect(d).toBeLessThanOrEqual(9)
      expect(n).toBeLessThanOrEqual(999)
      expect(n! % d!).toBe(0)
      expect(q.answer).toBe(n! / d!)
      expect(q.prompt.expr).toBe(`${n} : ${d} = ?`)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(ids(q.say)[0]).toBe(M.solve)
      expectKnown([q.say, q.instruction, q.hint])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(dividePadQuestion, dividePadAccepts))
})

describe('divide with a remainder', () => {
  it('has a remainder below the divisor, never divides by 0, and four distinct options', () => {
    each(divideRemainderQuestion, q => {
      expectPick(q, 4)
      const [, n, d] = /^dr:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(d).toBeGreaterThanOrEqual(2)
      expect(n! % d!).not.toBe(0)
      expect(q.answer).toBe(`${Math.floor(n! / d!)}, ${phrases[M3.leftover]} ${n! % d!}`)
      expect(q.prompt.expr).toBe(`${n} : ${d} = ?`)
      expectSaysInstruction(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(divideRemainderQuestion, divideRemainderAccepts))
})

describe('bus story', () => {
  it('rounds up: the answer is ceil(n / d), the remainder is at least 1, and the distractors are rounding down, the leftover and one more', () => {
    let down = 0
    let leftover = 0
    let more = 0
    each(busStoryQuestion, q => {
      expectPick(q, 4)
      const [, id, n, d] = /^bus:([a-z]+):(\d+):(\d+)$/.exec(q.itemKey)!
      expect(ROUND_UP_STORIES.some(s => s.id === id)).toBe(true)
      expect(+n! % +d!).toBeGreaterThanOrEqual(1)
      expect(+q.answer).toBe(Math.ceil(+n! / +d!))
      const text = q.prompt.sentence!.text
      expect(text).toContain(n)
      expect(text).toContain(d)
      expect(text).not.toContain('{')
      expect(q.prompt.sentence!.say).toBe(`raw:${text}`)
      expect(q.say).toBe(`raw:${text}`)
      const values = q.options.map(o => +o.id)
      if (values.includes(Math.floor(+n! / +d!))) down++
      if (values.includes(+n! % +d!)) leftover++
      if (values.includes(Math.ceil(+n! / +d!) + 1)) more++
      expect(q.instruction).toBe(M4.howManyNeeded)
      expect(q.hint).toBe(M4.roundUpHint)
    })
    expect(down).toBe(SEEDS.length)
    expect(leftover).toBeGreaterThan(200)
    expect(more).toBeGreaterThan(200)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(busStoryQuestion, busStoryAccepts))
})

/* ---------- 33. divisible by 3, 6 and 9 ---------- */

describe('which divides 3, 6, 9', () => {
  it('shows 4 numbers up to 999, exactly one divisible', () => {
    const ds = new Set<number>()
    each(whichDivides369Question, q => {
      expectPick(q, 4)
      const [, d, n] = /^div369:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      ds.add(d!)
      expect(q.options.filter(o => +o.id % d! === 0).map(o => o.id)).toEqual([String(n)])
      expect(q.answer).toBe(String(n))
      for (const o of q.options) expect(+o.id).toBeLessThanOrEqual(999)
      expect(q.instruction).toBe(whichDivides(d as 3))
      expect(q.hint).toBe(M4.digitSumHint)
      expectSaysInstruction(q)
    })
    expect(ds).toEqual(new Set([3, 6, 9]))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(whichDivides369Question, whichDivides369Accepts))
})

describe('sort 3, 6, 9', () => {
  it('has 8 distinct numbers, 2–6 in each bin, and the answer lists the dividers', () => {
    each(sort369Question, q => {
      const [, d] = /^sort369:(\d+):/.exec(q.itemKey)!.map(Number)
      expect(q.items).toHaveLength(8)
      expect(new Set(q.items).size).toBe(8)
      for (const n of q.items) {
        expect(n).toBeGreaterThanOrEqual(10)
        expect(n).toBeLessThanOrEqual(999)
      }
      const yes = q.items.flatMap((n, i) => (n % d! === 0 ? [i] : []))
      expect(q.answer).toEqual(yes)
      expect(yes.length).toBeGreaterThanOrEqual(2)
      expect(yes.length).toBeLessThanOrEqual(6)
      expect(q.yes).toBe(`math.ui.divisibleBy.${d}`)
      expectKnown([q.say, q.instruction, q.hint, q.yes, q.no])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(sort369Question, sort369Accepts))
})

/* ---------- 34. order of operations 2 ---------- */

const operatorsIn = (tokens: readonly string[]) => tokens.flatMap((t, i) => (['+', '−', '×', ':'].includes(t) ? [i] : []))

describe('first step 2', () => {
  it('has three operations, at most one pair of parentheses; points inside them, else × or :, else the left one', () => {
    let parens = 0
    each(firstStep2Question, q => {
      const ops = operatorsIn(q.tokens)
      expect(ops).toHaveLength(3)
      expect(q.tokens.filter(t => t === '(')).toHaveLength(q.tokens.filter(t => t === ')').length)
      expect(q.tokens.filter(t => t === '(').length).toBeLessThanOrEqual(1)
      const value = calc(q.tokens)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
      const open = q.tokens.indexOf('(')
      if (open >= 0) {
        parens++
        expect(q.answer).toBe(ops.find(i => i > open))
      } else {
        const mul = ops.find(i => q.tokens[i] === '×' || q.tokens[i] === ':')
        expect(mul).toBeDefined()
        expect(q.answer).toBe(mul)
      }
      expect(ops).toContain(q.answer)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(parens).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(firstStep2Question, firstStep2Accepts))
})

describe('result 2', () => {
  it('has 4 distinct numbers ≥ 0; the answer follows the order; the plain left-to-right result appears when it differs', () => {
    let ltr = 0
    each(result2Question, q => {
      expectPick(q, 4)
      const tokens = tokenize(q.prompt.expr!)
      expect(operatorsIn(tokens)).toHaveLength(3)
      expect(+q.answer).toBe(calc(tokens))
      for (const o of q.options) expect(+o.id).toBeGreaterThanOrEqual(0)
      const plain = tokens.filter(t => t !== '(' && t !== ')')
      let v = Number(plain[0])
      for (let i = 1; i < plain.length; i += 2) {
        const y = Number(plain[i + 1])
        v = plain[i] === '+' ? v + y : plain[i] === '−' ? v - y : plain[i] === '×' ? v * y : v / y
      }
      if (v !== +q.answer && Number.isInteger(v) && v >= 0 && q.options.some(o => +o.id === v)) ltr++
    })
    expect(ltr).toBeGreaterThan(100)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(result2Question, result2Accepts))
})

/* ---------- 35. what is a fraction? ---------- */

describe('name fraction', () => {
  it('shows a shaded shape; options include the reversed fraction and the complement; none equals the answer in value', () => {
    let reversed = 0
    let complement = 0
    each(nameFractionQuestion, q => {
      expectPick(q, 4)
      const [, shape, p, s] = /^fracname:(\w+):(\d+):(\d+)$/.exec(q.itemKey)!
      expect(['strip', 'circle', 'rect']).toContain(shape)
      expect(q.prompt.art).toEqual([{ name: 'math.fraction', props: { shape, parts: +p!, shaded: +s! } }])
      expect(+s!).toBeGreaterThanOrEqual(1)
      expect(+s!).toBeLessThan(+p!)
      expect([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]).toContain(+p!)
      expect(q.answer).toBe(`${s}/${p}`)
      for (const o of q.options) {
        if (o.id === q.answer) continue
        const [n, d] = o.id.split('/').map(Number)
        expect(n! * +p!).not.toBe(+s! * d!)
      }
      if (q.options.some(o => o.id === `${p}/${s}`)) reversed++
      if (q.options.some(o => o.id === `${+p! - +s!}/${p}`)) complement++
      expectSaysInstruction(q)
    })
    expect(reversed).toBe(SEEDS.length)
    expect(complement).toBeGreaterThan(200)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(nameFractionQuestion, nameFractionAccepts))
})

describe('shade fraction', () => {
  it('asks parts 2–12 (never 100), answer = the numerator, sometimes the whole', () => {
    let whole = 0
    const shapes = new Set<string>()
    each(shadeFractionQuestion, q => {
      const [, shape, p, a] = /^shade:(\w+):(\d+):(\d+)$/.exec(q.itemKey)!
      shapes.add(shape!)
      expect(q.shape).toBe(shape)
      expect(q.parts).toBe(+p!)
      expect(q.parts).toBeGreaterThanOrEqual(2)
      expect(q.parts).toBeLessThanOrEqual(12)
      expect(q.answer).toBe(+a!)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(q.parts)
      expect(q.show).toBe(`${a}/${p}`)
      if (q.answer === q.parts) whole++
      expect(ids(q.say)[0]).toBe(M4.shade)
      expect(ids(q.say)[1]!.startsWith('raw:')).toBe(true)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(shapes).toEqual(new Set(['strip', 'circle', 'rect']))
    expect(whole).toBeGreaterThan(5)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(shadeFractionQuestion, shadeFractionAccepts))
})

describe('part of a quantity', () => {
  it('shows den equal groups of the objects; the answer is num of them', () => {
    const halfTotals = new Set<number>()
    each(
      (c: GenContext) => partOfQuestion(c, THINGS),
      q => {
        const [, num, den, total] = /^partof:(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
        const g = q.prompt.objects![0]!
        expect(g.layout).toBe('groups')
        expect(g.count).toBe(total)
        expect(g.cols).toBe(total! / den!)
        expect(total! % den!).toBe(0)
        expect(total).toBeLessThanOrEqual(40)
        expect(q.prompt.expr).toBe(`${num}/${den}`)
        expect(q.answer).toBe((num! * total!) / den!)
        expect(num).toBeLessThan(den!)
        if (den === 2) halfTotals.add(total!)
        expect(ids(q.say)).toEqual([M4.partOf])
        expectKnown([q.say, q.instruction, q.hint])
      },
    )
    expect(halfTotals.size).toBeGreaterThan(3)
  })
  it('honors review and avoid', () => expectReviewAndAvoid((c: GenContext) => partOfQuestion(c, THINGS), partOfAccepts))
})

/* ---------- 36. comparing fractions ---------- */

describe('fraction line', () => {
  it('puts num/den on a 0–1 line cut into den parts; the answer is in units of 1/den', () => {
    each(fractionLineQuestion, q => {
      const [, num, den] = /^fline:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(q.line).toEqual({ min: 0, max: den, step: 1, labelEvery: 1, den })
      expect(q.target).toBe(num)
      expect(q.answer).toBe(num)
      expect(num).toBeGreaterThan(0)
      expect(num).toBeLessThan(den!)
      expect(q.tolerance).toBeLessThan(0.5)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(fractionLineQuestion, fractionLineAccepts))
})

describe('compare fractions', () => {
  it('has the three signs; unit, same-denominator and benchmark pairs; the aid draws two strips', () => {
    const kinds = { unit: 0, same: 0, bench: 0 }
    each(compareFractionsQuestion, q => {
      expectPick(q, 3)
      expect(q.options.map(o => o.id)).toEqual(['<', '=', '>'])
      const [, a, b, c, d] = /^fcmp:(\d+):(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(q.answer).toBe(a! * d! < c! * b! ? '<' : a! * d! > c! * b! ? '>' : '=')
      if (a === 1 && c === 1 && b !== 1 && d !== 1 && b !== 2 && d !== 2) kinds.unit++
      else if (b === d && b !== 1) kinds.same++
      else kinds.bench++
      if (b === d) expect(a).not.toBe(c)
      expect(q.aidArt).toEqual([{ name: 'math.strips', props: { a: `${a}/${b}`, b: `${c}/${d}` } }])
      expect(q.hint).toBe(M4.compareFractionHint)
      expectSaysInstruction(q)
    })
    expect(kinds.unit).toBeGreaterThan(40)
    expect(kinds.same).toBeGreaterThan(40)
    expect(kinds.bench).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(compareFractionsQuestion, compareFractionsAccepts))
})

/* ---------- 37. adding and subtracting fractions ---------- */

/** The value of a typed-in-prompt exercise, as [numerator, denominator]. */
function exerciseValue(expr: string): readonly [number, number] {
  const fs = fractionsIn(expr)
  if (/^\d+ × /.test(expr)) {
    const k = Number(expr.split(' ')[0])
    return [k * fs[0]![0], fs[0]![1]]
  }
  const [x, y] = fs as [readonly [number, number], readonly [number, number]]
  const sign = expr.includes('−') ? -1 : 1
  return [x[0] * y[1] + sign * y[0] * x[1], x[1] * y[1]]
}
function expectFractionAnswer(q: { prompt: { expr?: string }; answer: Fraction; aidStrips?: readonly string[] }) {
  const [n, d] = exerciseValue(q.prompt.expr!)
  const [an, ad] = asFraction(q.answer)
  expect(an * d).toBe(n * ad)
  expect(n).toBeGreaterThan(0)
  expect(q.answer.num).toBeGreaterThanOrEqual(0)
  expect(q.answer.num).toBeLessThan(q.answer.den)
  expect(q.aidStrips!.length).toBeGreaterThanOrEqual(2 - 1)
}

describe('add like', () => {
  it('adds and subtracts over the same denominator; the answer is exact and mixed when 1 or more', () => {
    const ops = { '+': 0, '-': 0 }
    let big = 0
    each(addLikeQuestion, q => {
      const [[a, d], [c, d2]] = fractionsIn(q.prompt.expr!) as [[number, number], [number, number]]
      expect(d).toBe(d2)
      const sub = q.prompt.expr!.includes('−')
      ops[sub ? '-' : '+']++
      if (sub) expect(a).toBeGreaterThan(c)
      expectFractionAnswer(q)
      expect(q.answer.den).toBe(d)
      if ((q.answer.whole ?? 0) > 0) {
        big++
        expect(q.mixed).toBe(true)
      }
      expect(q.aidStrips).toEqual([`${a}/${d}`, `${c}/${d}`])
      expect(q.hint).toBe(M4.sameDenHint)
      expect(ids(q.say)[0]).toBe(M.solve)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(ops['+']).toBeGreaterThan(80)
    expect(ops['-']).toBeGreaterThan(40)
    expect(big).toBeGreaterThan(20)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(addLikeQuestion, addLikeAccepts))
})

describe('add related', () => {
  it('uses denominators where one is a multiple of the other (listed pairs only); the answer is exact', () => {
    const pairs = new Set<string>()
    each(addRelatedQuestion, q => {
      const [[a, p], [c, r]] = fractionsIn(q.prompt.expr!) as [[number, number], [number, number]]
      const [s, t] = [Math.min(p, r), Math.max(p, r)]
      pairs.add(`${s}&${t}`)
      expect(t % s).toBe(0)
      expect(t).not.toBe(s)
      if (q.prompt.expr!.includes('−')) expect(a * r).toBeGreaterThan(c * p)
      expectFractionAnswer(q)
      expect(q.answer.den).toBe(t)
      expect(q.hint).toBe(M4.commonDenHint)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(pairs).toEqual(new Set(['2&4', '3&6', '2&8', '4&8', '5&10', '3&9']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(addRelatedQuestion, addRelatedAccepts))
})

describe('whole times a fraction', () => {
  it('asks k × a/d with the exact product; the aid shows the strip k times', () => {
    each(wholeTimesQuestion, q => {
      const [, k, a, d] = /^fw:(\d+):(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(q.prompt.expr).toBe(`${k} × ${a}/${d} = ?`)
      expectFractionAnswer(q)
      expect(q.aidStrips).toHaveLength(k!)
      expectKnown([q.say, q.instruction, q.hint])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(wholeTimesQuestion, wholeTimesAccepts))
})

/* ---------- 38. parallel and perpendicular ---------- */

describe('parallel and perpendicular', () => {
  it('shows three rotated drawings, exactly one of the asked kind', () => {
    const asked = new Set<string>()
    each(parallelPerpendicularQuestion, q => {
      expectPick(q, 3)
      asked.add(q.answer)
      const kinds = q.options.map(o => (o as unknown as { art: { props: { kind: string } } }).art.props.kind)
      expect(kinds.filter(k => k === q.answer)).toHaveLength(1)
      expect(new Set(kinds)).toEqual(new Set(['parallel', 'perpendicular', 'crossing']))
      for (const o of q.options) {
        const rot = (o as unknown as { art: { props: { rot: number } } }).art.props.rot
        expect(rot).toBeGreaterThanOrEqual(0)
        expect(rot).toBeLessThan(360)
      }
      expect(q.instruction).toBe(findLines(q.answer as 'parallel'))
      expectSaysInstruction(q)
    })
    expect(asked).toEqual(new Set(['parallel', 'perpendicular']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(parallelPerpendicularQuestion, parallelPerpendicularAccepts, 2))
})

describe('diagonals', () => {
  it('asks polygons of 4–8 sides; the answer is sides − 3; the aid draws the diagonals', () => {
    const sides = new Set<number>()
    each(diagonalsQuestion, q => {
      const s = (q.prompt.art![0]!.props as { sides: number }).sides
      sides.add(s)
      expect(q.answer).toBe(s - 3)
      expect(q.aidArt).toEqual([{ name: 'math.polygon', props: { sides: s, diagonals: true } }])
      expect(q.maxDigits).toBe(1)
      expect(q.itemKey).toBe(`diag:${s}`)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(sides).toEqual(new Set([4, 5, 6, 7, 8]))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(diagonalsQuestion, diagonalsAccepts, 5))
})

/* ---------- 39. quadrilaterals ---------- */

type ArtOption = { art: { props: { kind: string; rot: number } } }
const artKind = (o: PickOption) => (o as unknown as ArtOption).art.props.kind

describe('name quad', () => {
  it('shows a rotated shape and offers four or five names including the right one', () => {
    const sizes = new Set<number>()
    const kinds = new Set<string>()
    let upright = 0
    each(nameQuadQuestion, q => {
      expect(q.options.length).toBeGreaterThanOrEqual(4)
      sizes.add(q.options.length)
      expectPick(q, q.options.length)
      const props = q.prompt.art![0]!.props as { kind: string; rot: number }
      kinds.add(props.kind)
      expect(q.answer).toBe(props.kind)
      if (props.rot % 90 === 0) upright++
      for (const o of q.options) expect(label(o)).toBe(phrases[`math.quad.${o.id}`])
      expect(q.itemKey).toBe(`nq:${props.kind}`)
      expectSaysInstruction(q)
    })
    expect(sizes).toEqual(new Set([4, 5]))
    expect(kinds.size).toBe(5)
    expect(upright).toBe(0)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(nameQuadQuestion, nameQuadAccepts, 5))
})

describe('quad property', () => {
  it('shows four drawings, exactly one of the asked kind, with no inclusion (no square beside rectangle or rhombus, only trapezoids beside a parallelogram)', () => {
    const asked = new Set<string>()
    each(quadPropertyQuestion, q => {
      expectPick(q, 4)
      const kind = /^quadp:(\w+)$/.exec(q.itemKey)![1]!
      asked.add(kind)
      const kinds = q.options.map(artKind)
      expect(kinds.filter(k => k === kind)).toHaveLength(1)
      expect(q.options.find(o => o.id === q.answer) && artKind(q.options.find(o => o.id === q.answer)!)).toBe(kind)
      if (kind === 'rectangle' || kind === 'rhombus') expect(kinds).not.toContain('square')
      if (kind === 'parallelogram') for (const k of kinds.filter(k => k !== kind)) expect(k).toBe('trapezoid')
      if (kind === 'trapezoid') expect(kinds.filter(k => k === 'trapezoid')).toHaveLength(1)
      expect(q.instruction).toBe(quadQuestion(kind as 'square'))
      expect(q.hint).toBe(M4.quadHint)
      expectSaysInstruction(q)
    })
    expect(asked.size).toBe(5)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(quadPropertyQuestion, quadPropertyAccepts, 5))
})

/* ---------- 40. length units ---------- */

describe('convert length', () => {
  const FACTORS: Record<string, number> = { 'cm>mm': 10, 'dm>cm': 10, 'm>dm': 10, 'm>cm': 100, 'km>m': 1000 }
  const unitOf = (label: string) => Object.entries(UNIT_LABEL).find(([, v]) => v === label)![0]
  it('converts only between the listed neighbouring units, whole results, both directions', () => {
    const pairs = new Set<string>()
    const dirs = { d: 0, u: 0 }
    each(convertLengthQuestion, q => {
      const m = /^(\S+) (\S+) = \? (\S+)$/.exec(q.prompt.expr!)!
      const [n, from, to] = [num(m[1]!), unitOf(m[2]!), unitOf(m[3]!)]
      const down = `${from}>${to}` in FACTORS
      const f = down ? FACTORS[`${from}>${to}`]! : FACTORS[`${to}>${from}`]
      expect(f, q.prompt.expr).toBeDefined()
      pairs.add(down ? `${from}>${to}` : `${to}>${from}`)
      dirs[down ? 'd' : 'u']++
      expect(q.answer).toBe(down ? n * f! : n / f!)
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(q.answer).toBeGreaterThan(0)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.instruction).toBe(M4.convert)
      expect(q.hint).toBe(M4.convertHint)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(pairs).toEqual(new Set(Object.keys(FACTORS)))
    expect(dirs.d).toBeGreaterThan(80)
    expect(dirs.u).toBeGreaterThan(80)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(convertLengthQuestion, convertLengthAccepts))
})

describe('sensible length', () => {
  it('offers the right length and three absurd ones, silent; the question phrase exists', () => {
    const seen = new Set<string>()
    each(sensibleLengthQuestion, q => {
      expectPick(q, 4)
      const id = /^sens:(\w+)$/.exec(q.itemKey)![1]!
      seen.add(id)
      const item = SENSIBLE_LENGTHS.find(s => s.id === id)!
      expect(q.answer).toBe(`${item.right[0]} ${UNIT_LABEL[item.right[1]]}`)
      expect(q.instruction).toBe(sensiblePhrase(id))
      for (const o of q.options) expect(say(o)).toBeUndefined()
      expectSaysInstruction(q)
    })
    expect(seen.size).toBe(SENSIBLE_LENGTHS.length)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(sensibleLengthQuestion, sensibleLengthAccepts, SENSIBLE_LENGTHS.length))
})

/* ---------- 41. surface area of a box ---------- */

describe('box net', () => {
  it('lays out six non-overlapping faces inside a grid of at most 14 × 12; opposite faces share a colour; answer = 2(lw + lh + wh)', () => {
    const turned = new Set<boolean>()
    each(boxNetQuestion, q => {
      const [, a, b, c] = /^box:(\d):(\d):(\d)$/.exec(q.itemKey)!.map(Number)
      for (const v of [a, b, c]) {
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(4)
      }
      expect(q.answer).toBe(2 * (a! * b! + a! * c! + b! * c!))
      expect(q.rects).toHaveLength(6)
      expect(q.cols).toBeLessThanOrEqual(14)
      expect(q.rows).toBeLessThanOrEqual(12)
      expect(q.mode).toBe('count')
      const cells = new Set<string>()
      let area = 0
      for (const [x, y, w, h] of q.rects) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x + w).toBeLessThanOrEqual(q.cols)
        expect(y + h).toBeLessThanOrEqual(q.rows)
        area += w * h
        for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) {
          expect(cells.has(`${i},${j}`), `overlap at ${i},${j}`).toBe(false)
          cells.add(`${i},${j}`)
        }
      }
      expect(area).toBe(q.answer)
      // The faces form one connected net.
      const seen = new Set<string>()
      const stack = [[...cells][0]!]
      while (stack.length) {
        const cell = stack.pop()!
        if (seen.has(cell)) continue
        seen.add(cell)
        const [i, j] = cell.split(',').map(Number)
        for (const next of [`${i! + 1},${j}`, `${i! - 1},${j}`, `${i},${j! + 1}`, `${i},${j! - 1}`]) if (cells.has(next)) stack.push(next)
      }
      expect(seen.size).toBe(cells.size)
      // Faces: three colour groups, each used by exactly two equal rectangles.
      expect(q.faces).toHaveLength(6)
      for (const g of [0, 1, 2]) {
        const idx = q.faces!.flatMap((f, i) => (f === g ? [i] : []))
        expect(idx).toHaveLength(2)
        const sizes = idx.map(i => [q.rects[i]![2], q.rects[i]![3]].sort().join('x'))
        expect(sizes[0]).toBe(sizes[1])
      }
      turned.add(q.rows > q.cols)
      expect(q.instruction).toBe(M4.boxNet)
      expect(q.hint).toBe(M4.boxHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(turned.size).toBe(2)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(boxNetQuestion, boxNetAccepts, 15))
})

/* ---------- keys across games ---------- */

describe('item keys', () => {
  const games: [string, (c: GenContext) => { itemKey: string }, (key: string) => boolean][] = [
    ['digitValue', digitValueQuestion, digitValueAccepts], ['compare6', compare6Question, compare6Accepts], ['lineMillion', lineMillionQuestion, lineMillionAccepts],
    ['roundBig', roundBigQuestion, roundBigAccepts], ['columnBig', columnBigQuestion, columnBigAccepts], ['compensate', compensateQuestion, compensateAccepts],
    ['estimateMillion', estimateMillionQuestion, estimateMillionAccepts], ['roundTimes2', roundTimes2Question, roundTimes2Accepts],
    ['areaModel', areaModelQuestion, areaModelAccepts], ['lastDigit', lastDigitQuestion, lastDigitAccepts], ['splitDivide', splitDivideQuestion, splitDivideAccepts],
    ['dividePad', dividePadQuestion, dividePadAccepts], ['divideRemainder', divideRemainderQuestion, divideRemainderAccepts], ['busStory', busStoryQuestion, busStoryAccepts],
    ['whichDivides369', whichDivides369Question, whichDivides369Accepts], ['sort369', sort369Question, sort369Accepts],
    ['firstStep2', firstStep2Question, firstStep2Accepts], ['result2', result2Question, result2Accepts], ['nameFraction', nameFractionQuestion, nameFractionAccepts],
    ['shadeFraction', shadeFractionQuestion, shadeFractionAccepts], ['partOf', c => partOfQuestion(c, THINGS), partOfAccepts],
    ['fractionLine', fractionLineQuestion, fractionLineAccepts], ['compareFractions', compareFractionsQuestion, compareFractionsAccepts],
    ['addLike', addLikeQuestion, addLikeAccepts], ['addRelated', addRelatedQuestion, addRelatedAccepts], ['wholeTimes', wholeTimesQuestion, wholeTimesAccepts],
    ['parallelPerpendicular', parallelPerpendicularQuestion, parallelPerpendicularAccepts], ['diagonals', diagonalsQuestion, diagonalsAccepts],
    ['nameQuad', nameQuadQuestion, nameQuadAccepts], ['quadProperty', quadPropertyQuestion, quadPropertyAccepts],
    ['convertLength', convertLengthQuestion, convertLengthAccepts], ['sensibleLength', sensibleLengthQuestion, sensibleLengthAccepts], ['boxNet', boxNetQuestion, boxNetAccepts],
  ]
  it('each game accepts its own keys and no other game accepts them', () => {
    for (const [name, gen, accepts] of games) {
      for (const seed of SEEDS.slice(0, 40)) {
        const key = gen(ctx(seed)).itemKey
        expect(accepts(key), `${name} ${key}`).toBe(true)
        for (const [other, , otherAccepts] of games) if (other !== name) expect(otherAccepts(key), `${other} accepts ${name}'s ${key}`).toBe(false)
      }
    }
  })
  it('rejects malformed keys', () => {
    for (const [name, , accepts] of games)
      for (const key of ['', 'x', 'dv:', 'dv:123456:0', 'cmp6:1234:99', 'colb:5-7000', 'dr:5:0', 'dp:50:0', 'split:80:0', 'fline:0:4', 'fcmp:1:0:1:2', 'box:0:1:1'])
        expect(accepts(key), `${name} ${key}`).toBe(false)
  })
  it('gcd helper sanity (fractions in tests are compared by cross-multiplication)', () => expect(gcd(12, 18)).toBe(6))
})
