import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { ObjectGroup, PickOption, PickQ } from '../../ui/pick/types'
import { REMAINDER_STORIES } from './content/remainder'
import {
  angleTypeAccepts, angleTypeQuestion, arenaAccepts, arenaQuestion, arrayBigAccepts, arrayBigQuestion, build4Accepts, build4Question, closerAccepts,
  closerQuestion, columnAccepts, columnQuestion, compare4Accepts, compare4Question, countSquaresAccepts, countSquaresQuestion, estimateBigAccepts,
  estimateBigQuestion, firstStepAccepts, firstStepQuestion, flexible4Accepts, flexible4Question, lengthWidthAccepts, lengthWidthQuestion,
  line10000Accepts, line10000Question, missingFactorAccepts, missingFactorQuestion, missingLeftAccepts, missingLeftQuestion, mistakeAccepts,
  mistakeQuestion, remainderPickAccepts, remainderPickQuestion, remainderStoryAccepts, remainderStoryQuestion, resultAccepts, resultQuestion,
  roundPickAccepts, roundPickQuestion, roundTimesAccepts, roundTimesQuestion, shareLeftAccepts, shareLeftQuestion, skipBigAccepts, skipBigQuestion,
  sortDividesAccepts, sortDividesQuestion, tableNewAccepts, tableNewQuestion, timesTenAccepts, timesTenQuestion, triangleAnglesAccepts,
  triangleAnglesQuestion, triangleSidesAccepts, triangleSidesQuestion, whichDividesAccepts, whichDividesQuestion,
} from './generators-g3'
import { M, M3, divisibleBy, findTriangle, roundTo, whichDivides } from './ids'
import { phrases } from './phrases'
import type { Thing } from './types'

/* ---------- fixtures and utilities ---------- */

const THINGS: Thing[] = [{ id: 'bird', emoji: '🐦' }, { id: 'apple', emoji: '🍎' }, { id: 'cookie', emoji: '🍪' }]
const KNOWN = new Set(Object.keys(phrases))

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)
const each = <Q>(gen: (c: GenContext) => Q, fn: (q: Q, seed: number) => void) => {
  for (const seed of SEEDS) fn(gen(ctx(seed)), seed)
}

const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
/** Every phrase ID exists; `raw:` parts are spoken text for the browser voice and have no phrase. */
function expectKnown(refs: (PhraseRef | undefined)[]) {
  for (const p of refs.flatMap(ids)) expect(p.startsWith('raw:') || KNOWN.has(p), p).toBe(true)
}
/** The instruction phrase comes first in what is spoken. */
function expectSaysInstruction(q: { say: PhraseRef; instruction: string }) {
  expect(ids(q.say)[0]).toBe(q.instruction)
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

/** The items a generator emitted over all seeds, to show that review and avoid are honored. */
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
    // Even when avoided, a due review item still comes first.
    expect(gen(ctx(8, [key], key)).itemKey).toBe(key)
  }
}

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

const carriesOf = (a: number, b: number, op: '+' | '-') => {
  const x = String(a).padStart(5, '0').split('').reverse().map(Number)
  const y = String(b).padStart(5, '0').split('').reverse().map(Number)
  let carry = 0
  let count = 0
  for (let i = 0; i < 5; i++) {
    const v = op === '+' ? x[i]! + y[i]! + carry : x[i]! - y[i]! - carry
    carry = op === '+' ? Number(v >= 10) : Number(v < 0)
    count += carry
  }
  return count
}

/* ---------- 18. numbers to 10,000 ---------- */

describe('build 4', () => {
  it('asks 1000–9999 in a four-column house, spoken and shown', () => {
    let zeros = 0
    each(build4Question, q => {
      expect(q.answer).toBeGreaterThanOrEqual(1000)
      expect(q.answer).toBeLessThanOrEqual(9999)
      expect(q.columns).toBe(4)
      expect(q.show).toBe(String(q.answer))
      expect(q.itemKey).toBe(`pv4:${q.answer}`)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction])
      if (String(q.answer).includes('0')) zeros++
    })
    expect(zeros).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(build4Question, build4Accepts))
})

describe('flexible 4', () => {
  it('shows a true split in all three kinds; the answer fits the pad', () => {
    const kinds = { h: 0, t: 0, w: 0 }
    let big = 0
    each(flexible4Question, q => {
      const [, n, kind] = /^flex4:(\d+):([htw])$/.exec(q.itemKey)!
      kinds[kind as 'h' | 't' | 'w']++
      const expr = q.prompt.expr!
      if (kind === 'h') {
        const m = /^(\d+) = (\d+) × 100 \+ \?$/.exec(expr)!
        expect(+m[1]!).toBe(+n!)
        expect(+m[2]! * 100 + q.answer).toBe(+n!)
        expect(q.instruction).toBe(M.flexible)
        if (q.answer >= 100) big++
      } else if (kind === 't') {
        const m = /^(\d+) = (\d+) × 10 \+ \?$/.exec(expr)!
        expect(+m[1]!).toBe(+n!)
        expect(+m[2]! * 10 + q.answer).toBe(+n!)
      } else {
        const m = /^(\d+) × 100 \+ (\d+) = \?$/.exec(expr)!
        expect(+m[1]! * 100 + +m[2]!).toBe(+n!)
        expect(q.answer).toBe(+n!)
        expect(q.instruction).toBe(M3.whatNumber)
      }
      expect(q.answer).toBeGreaterThan(0)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction])
    })
    expect(Math.min(...Object.values(kinds))).toBeGreaterThan(40)
    expect(big).toBeGreaterThan(5)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(flexible4Question, flexible4Accepts))
})

describe('compare 4', () => {
  it('has the three signs in a fixed order, the right answer, and pairs differing in one place or by a swap', () => {
    let equal = 0
    let swapped = 0
    let oneDigit = 0
    each(compare4Question, q => {
      expectPick(q, 3)
      expect(q.options.map(o => o.id)).toEqual(['<', '=', '>'])
      const [, a, b] = /^sign4:(\d{4}):(\d{4})$/.exec(q.itemKey)!
      expect(q.prompt.expr).toBe(`${a} ? ${b}`)
      expect(q.answer).toBe(+a! < +b! ? '<' : +a! > +b! ? '>' : '=')
      const differing = a!.split('').filter((ch, i) => ch !== b![i]).length
      if (a === b) equal++
      else if (differing === 1) oneDigit++
      else {
        expect(differing).toBe(2)
        expect([...a!].sort().join('')).toBe([...b!].sort().join(''))
        swapped++
      }
      expectSaysInstruction(q)
    })
    expect(equal).toBeGreaterThan(10)
    expect(swapped).toBeGreaterThan(30)
    expect(oneDigit).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(compare4Question, compare4Accepts))
})

describe('line 10000', () => {
  it('puts the target inside the line, on a reachable mark, within the tolerance of a mark', () => {
    let zoom = 0
    let coarse = 0
    each(line10000Question, q => {
      const { line } = q
      expect(q.target).toBeGreaterThan(line.min)
      expect(q.target).toBeLessThan(line.max)
      expect(q.answer).toBe(q.target)
      expect((q.target - line.min) % (line.snap ?? line.step)).toBe(0)
      expect(line.max - line.min).toBeGreaterThanOrEqual(line.step * 5)
      if (q.itemKey.endsWith(':z')) {
        zoom++
        expect(line.min % 1000).toBe(0)
        expect(line.max - line.min).toBe(1000)
        expect(line.step).toBe(100)
        expect(q.tolerance).toBeLessThan(100)
      } else {
        coarse++
        expect(line).toMatchObject({ min: 0, max: 10000, step: 1000 })
        expect(q.tolerance).toBe(250)
      }
      expect(q.itemKey).toBe(`line10k:${q.target}${q.itemKey.endsWith(':z') ? ':z' : ''}`)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction])
    })
    expect(zoom).toBeGreaterThan(80)
    expect(coarse).toBeGreaterThan(80)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(line10000Question, line10000Accepts))
})

/* ---------- 19. big jumps ---------- */

describe('skip big', () => {
  it('is an arithmetic sequence of 6 terms within 0–10,000, two blanks, answer = the blanks', () => {
    const steps = new Set<number>()
    let back = 0
    let offMultiple = 0
    each(skipBigQuestion, q => {
      const [, step, start] = /^skipbig:(-?\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(q.step).toBe(step)
      steps.add(Math.abs(q.step))
      expect([20, 25, 50, 200, 500, 1000]).toContain(Math.abs(q.step))
      expect(q.terms).toHaveLength(6)
      q.terms.forEach((t, i) => {
        expect(t).toBe(start! + i * step!)
        expect(t).toBeGreaterThanOrEqual(0)
        expect(t).toBeLessThanOrEqual(10000)
      })
      expect(q.blanks).toHaveLength(2)
      expect(q.blanks[0]!).toBeLessThan(q.blanks[1]!)
      expect(q.blanks[0]!).toBeGreaterThanOrEqual(1)
      expect(q.answer).toEqual(q.blanks.map(i => q.terms[i]))
      if (q.step < 0) back++
      if (start! % Math.abs(step!) !== 0) offMultiple++
      expect(q.hint).toBe(q.step < 0 ? M3.jumpBackHint : M3.jumpHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(steps).toEqual(new Set([20, 25, 50, 200, 500, 1000]))
    expect(back).toBeGreaterThan(60)
    expect(offMultiple).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(skipBigQuestion, skipBigAccepts))
})

describe('find the mistake', () => {
  it('changes exactly one term, to a plausible value that is no other term', () => {
    const indexes = new Set<number>()
    each(mistakeQuestion, q => {
      const [, step, start] = /^mistake:(-?\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      const truth = Array.from({ length: 6 }, (_, i) => start! + i * step!)
      expect(q.terms).toHaveLength(6)
      const wrong = q.terms.flatMap((t, i) => (t !== truth[i] ? [i] : []))
      expect(wrong).toEqual([q.answer])
      indexes.add(q.answer)
      const w = q.terms[q.answer]!
      expect(w).toBeGreaterThanOrEqual(0)
      expect(w).toBeLessThanOrEqual(10000)
      expect(truth).not.toContain(w)
      expect([10, 100, 1000]).toContain(Math.abs(w - truth[q.answer]!))
      expect(q.step).toBe(step)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(indexes.size).toBe(6)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(mistakeQuestion, mistakeAccepts))
})

/* ---------- 20. rounding ---------- */

const nearest = (n: number, place: number) => (n % place >= place / 2 ? n - (n % place) + place : n - (n % place))

describe('closer to', () => {
  it('offers the two numbers around it, never a tie, with the aid line between them', () => {
    const places = new Set<number>()
    each(closerQuestion, q => {
      expectPick(q, 2)
      const [, n, place] = /^near:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      places.add(place!)
      expect(q.prompt.expr).toBe(String(n))
      expect(n! % place!).not.toBe(0)
      expect(n! % place!).not.toBe(place! / 2)
      const values = q.options.map(o => +o.id).sort((a, b) => a - b)
      expect(values[1]! - values[0]!).toBe(place)
      expect(values[0]!).toBeLessThan(n!)
      expect(values[1]!).toBeGreaterThan(n!)
      expect(+q.answer).toBe(nearest(n!, place!))
      expect(q.aidArt).toEqual([{ name: 'math.round', props: { from: values[0], to: values[1], n } }])
      expectSaysInstruction(q)
    })
    expect(places).toEqual(new Set([10, 100, 1000]))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(closerQuestion, closerAccepts))
})

describe('round pick', () => {
  it('has 4 distinct numbers; the answer is the nearest, a half rounds up; wrong-way and wrong-place distractors appear', () => {
    let halves = 0
    let wrongWay = 0
    const places = new Set<number>()
    each(roundPickQuestion, q => {
      expectPick(q, 4)
      const [, n, place] = /^round:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      places.add(place!)
      expect(q.prompt.expr).toBe(String(n))
      expect(q.instruction).toBe(roundTo(place as 10 | 100 | 1000))
      expectSaysInstruction(q)
      expect(+q.answer).toBe(nearest(n!, place!))
      if (n! % place! === place! / 2) {
        halves++
        expect(+q.answer).toBe(n! - (n! % place!) + place!)
      }
      const values = q.options.map(o => +o.id)
      for (const v of values) expect(v).toBeGreaterThan(0)
      const down = n! - (n! % place!)
      if (values.includes(down) && +q.answer !== down) wrongWay++
      if (values.includes(down + place!) && +q.answer === down) wrongWay++
      expect(q.options.every(o => say(o) !== undefined)).toBe(true)
    })
    expect(places).toEqual(new Set([10, 100, 1000]))
    expect(halves).toBeGreaterThan(30)
    expect(wrongWay).toBeGreaterThan(220)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(roundPickQuestion, roundPickAccepts))
})

/* ---------- 21. adding and subtracting to 10,000 ---------- */

describe('column', () => {
  it('stays within 0–10,000, never negative, at most two carries, from a four-digit number', () => {
    let add = 0
    let sub = 0
    const carryCounts = new Set<number>()
    each(columnQuestion, q => {
      expect(q.itemKey).toBe(`col:${q.a}${q.op}${q.b}`)
      expect(q.answer).toBe(q.op === '+' ? q.a + q.b : q.a - q.b)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(10000)
      expect(q.a).toBeGreaterThan(0)
      expect(Math.max(q.a, q.b)).toBeGreaterThanOrEqual(1000)
      expect(Math.max(q.a, q.b)).toBeLessThanOrEqual(9999)
      if (q.op === '-') expect(q.a).toBeGreaterThan(q.b)
      const k = carriesOf(q.a, q.b, q.op)
      expect(k).toBeLessThanOrEqual(2)
      carryCounts.add(k)
      expect(q.hint).toBe(q.op === '+' ? M3.columnHint : M3.borrowHint)
      if (q.op === '+') add++
      else sub++
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(add).toBeGreaterThan(80)
    expect(sub).toBeGreaterThan(80)
    expect(carryCounts).toEqual(new Set([0, 1, 2]))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(columnQuestion, columnAccepts))
})

describe('missing left', () => {
  it('is a true equation with one blank, numbers up to 10,000, the blank often left of the equals sign', () => {
    let blankFirst = 0
    each(missingLeftQuestion, q => {
      const expr = q.prompt.expr!
      expect(expr.split('?')).toHaveLength(2)
      expect(expr).not.toContain(',')
      const m = /^(.+) = (.+)$/.exec(expr)!
      const [left, right] = [m[1]!, m[2]!]
      const sumSide = [left, right].find(s => / [+−] /.test(s))!
      const numberSide = sumSide === left ? right : left
      const [x, op, y] = sumSide.split(' ') as [string, string, string]
      const blank = (v: string) => (v === '?' ? q.answer : Number(v))
      const value = op === '+' ? blank(x) + blank(y) : blank(x) - blank(y)
      expect(value).toBe(blank(numberSide))
      for (const v of [blank(x), blank(y), blank(numberSide)]) {
        expect(v).toBeGreaterThan(0)
        expect(v).toBeLessThanOrEqual(10000)
        expect(v % 10).toBe(0)
      }
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.itemKey).toBe(`mleft:${expr.replace(/ /g, '').replace('−', '-')}`)
      if (expr.startsWith('?') || left === numberSide) blankFirst++
      expectKnown([q.say, q.instruction])
    })
    expect(blankFirst).toBeGreaterThan(120)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(missingLeftQuestion, missingLeftAccepts))
})

describe('estimate big', () => {
  it('asks more or less than a thousand that decides it', () => {
    let more = 0
    let less = 0
    each(estimateBigQuestion, q => {
      expectPick(q, 2)
      const m = /^(\d+) ([+−]) (\d+) \? (\d+)$/.exec(q.prompt.expr!)!
      const [a, b, bench] = [+m[1]!, +m[3]!, +m[4]!]
      const r = m[2] === '+' ? a + b : a - b
      expect(r).toBeGreaterThan(0)
      expect(r).toBeLessThanOrEqual(10000)
      expect(bench % 1000).toBe(0)
      expect(Math.abs(r - bench)).toBeGreaterThanOrEqual(150)
      expect(q.answer).toBe(r > bench ? 'more' : 'less')
      if (q.answer === 'more') more++
      else less++
      expect(ids(q.say)[0]).toBe(M.estimate)
    })
    expect(more).toBeGreaterThan(60)
    expect(less).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(estimateBigQuestion, estimateBigAccepts))
})

/* ---------- 22. the multiplication table ---------- */

describe('table new', () => {
  it('asks only the 3, 6, 7, 8 and 9 tables (and facts with 0 and 1), in both orders', () => {
    const tables = new Set<number>()
    let swapped = 0
    each(tableNewQuestion, q => {
      const [, a, b] = /^tbl:(\d+)x(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(q.prompt.expr).toBe(`${a} × ${b} = ?`)
      expect(q.answer).toBe(a! * b!)
      expect(a).toBeLessThanOrEqual(10)
      expect(b).toBeLessThanOrEqual(10)
      const newOnes = [a!, b!].filter(f => [3, 6, 7, 8, 9].includes(f))
      expect(newOnes.length > 0 || a! <= 1 || b! <= 1, q.itemKey).toBe(true)
      newOnes.forEach(f => tables.add(f))
      if (a! > b!) swapped++
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction])
    })
    expect(tables).toEqual(new Set([3, 6, 7, 8, 9]))
    expect(swapped).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(tableNewQuestion, tableNewAccepts))
})

describe('missing factor', () => {
  it('solves ? × b = p, a × ? = p and p : b = ?, never dividing by 0 or 1', () => {
    const forms = new Set<string>()
    each(missingFactorQuestion, q => {
      const expr = q.prompt.expr!
      let m = /^\? × (\d+) = (\d+)$/.exec(expr)
      if (m) {
        forms.add('left')
        expect(q.answer * +m[1]!).toBe(+m[2]!)
        expect(q.instruction).toBe(M.missing)
      } else if ((m = /^(\d+) × \? = (\d+)$/.exec(expr))) {
        forms.add('right')
        expect(+m[1]! * q.answer).toBe(+m[2]!)
        expect(q.instruction).toBe(M.missing)
      } else {
        m = /^(\d+) : (\d+) = \?$/.exec(expr)!
        forms.add('div')
        expect(+m[2]!).toBeGreaterThanOrEqual(2)
        expect(q.answer * +m[2]!).toBe(+m[1]!)
        expect(q.instruction).toBe(M.solve)
      }
      expect(q.answer).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBeLessThanOrEqual(10)
      expect(+m![2]!).toBeLessThanOrEqual(100)
      expect(q.itemKey).toBe(`mfac:${expr.replace(/ /g, '').replace('×', 'x')}`)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction])
    })
    expect(forms).toEqual(new Set(['left', 'right', 'div']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(missingFactorQuestion, missingFactorAccepts))
})

describe('array big', () => {
  it('shows an array up to 10 × 10 and offers one correct split among four', () => {
    each((c: GenContext) => arrayBigQuestion(c, THINGS), q => {
      expectPick(q, 4)
      const [, r, c] = /^arrbig:(\d+)x(\d+)$/.exec(q.itemKey)!.map(Number)
      const g = q.prompt.objects![0] as ObjectGroup
      expect(g.layout).toBe('array')
      expect(g.cols).toBe(c)
      expect(g.count).toBe(r! * c!)
      expect(r).toBeLessThanOrEqual(10)
      expect(c).toBeLessThanOrEqual(10)
      const value = (l: string) => l.split(' + ').reduce((sum, term) => sum + term.split(' × ').reduce((p, f) => p * Number(f), 1), 0)
      const right = q.options.filter(o => value(label(o)) === r! * c!)
      expect(right.map(o => o.id)).toEqual([q.answer])
      // The answer is a split of the columns: r × c1 + r × c2 with c1 + c2 = c.
      const m = /^(\d+) × (\d+) \+ (\d+) × (\d+)$/.exec(q.answer)!
      expect([+m[1]!, +m[3]!]).toEqual([r, r])
      expect(+m[2]! + +m[4]!).toBe(c)
      expect(q.hint).toBe(M3.splitHint)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid((c: GenContext) => arrayBigQuestion(c, THINGS), arrayBigAccepts))
})

describe('arena', () => {
  it('asks facts from the whole 10 × 10 table, the new tables most', () => {
    let newTables = 0
    each(arenaQuestion, q => {
      const [, a, b] = /^tbl:(\d+)x(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(a).toBeGreaterThanOrEqual(1)
      expect(a).toBeLessThanOrEqual(10)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(b).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(a! * b!)
      if ([a!, b!].some(f => [3, 6, 7, 8, 9].includes(f))) newTables++
      expectKnown([q.say, q.instruction])
    })
    expect(newTables).toBeGreaterThan(150)
  })
  it('puts a due fact first and honors avoid', () => expectReviewAndAvoid(arenaQuestion, arenaAccepts))
})

/* ---------- 23. division with a remainder ---------- */

describe('share left', () => {
  it('has a remainder smaller than the plates and a total that fits the screen', () => {
    each((c: GenContext) => shareLeftQuestion(c, THINGS), q => {
      expect(q.leftover).toBe(true)
      expect(q.plates).toBeGreaterThanOrEqual(2)
      expect(q.plates).toBeLessThanOrEqual(6)
      expect(q.total).toBeLessThanOrEqual(40)
      expect(q.total % q.plates).toBeGreaterThanOrEqual(1)
      expect(q.total % q.plates).toBeLessThan(q.plates)
      expect(q.answer).toBeGreaterThanOrEqual(2)
      expect(q.answer * q.plates + (q.total % q.plates)).toBe(q.total)
      expect(q.itemKey).toBe(`rem:${q.total}:${q.plates}`)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid((c: GenContext) => shareLeftQuestion(c, THINGS), shareLeftAccepts))
})

const LEFTOVER = phrases[M3.leftover]!
const parseOption = (o: PickOption) => {
  const m = new RegExp(`^(\\d+), ${LEFTOVER} (\\d+)$`).exec(label(o))!
  return { q: +m[1]!, r: +m[2]! }
}

describe('remainder pick', () => {
  it('has a remainder below the divisor, never divides by 0, and no distractor equals the answer', () => {
    const kinds = { bigRemainder: 0, offByOne: 0, swapped: 0 }
    each(remainderPickQuestion, q => {
      expectPick(q, 4)
      const [, n, d] = /^rem:(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      expect(d).toBeGreaterThanOrEqual(2)
      expect(d).toBeLessThanOrEqual(9)
      expect(q.prompt.expr).toBe(`${n} : ${d} = ?`)
      const [quotient, rest] = [Math.floor(n! / d!), n! % d!]
      expect(rest).toBeGreaterThanOrEqual(1)
      expect(rest).toBeLessThan(d!)
      expect(n).toBeLessThanOrEqual(99)
      const right = q.options.find(o => o.id === q.answer)!
      expect(parseOption(right)).toEqual({ q: quotient, r: rest })
      for (const o of q.options) {
        const p = parseOption(o)
        expect(label(o)).toBe(`${p.q}, ${LEFTOVER} ${p.r}`)
        if (o === right) continue
        expect(p).not.toEqual({ q: quotient, r: rest })
        if (p.q === rest && p.r === quotient) kinds.swapped++
        else if (p.r >= d!) kinds.bigRemainder++
        else if (p.r === rest && Math.abs(p.q - quotient) === 1) kinds.offByOne++
      }
      expect(q.options.every(o => say(o) !== undefined)).toBe(true)
      expectSaysInstruction(q)
    })
    expect(kinds.bigRemainder).toBeGreaterThan(200)
    expect(kinds.offByOne).toBeGreaterThan(200)
    expect(kinds.swapped).toBeGreaterThan(100)
  })
  it('never writes the 3(2) form', () => {
    each(remainderPickQuestion, q => q.options.forEach(o => expect(label(o)).not.toMatch(/\(/)))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(remainderPickQuestion, remainderPickAccepts))
})

describe('remainder story', () => {
  it('fills the numbers as digits, is read by the browser voice, and has the same options as the pick game', () => {
    const ids_ = new Set<string>()
    each(remainderStoryQuestion, q => {
      expectPick(q, 4)
      const [, id, n, d] = /^remstory:(\w+):(\d+):(\d+)$/.exec(q.itemKey)!
      ids_.add(id!)
      const template = REMAINDER_STORIES.find(t => t.id === id)!.text
      const text = q.prompt.sentence!.text
      expect(text).toBe(template.replace('{n}', n!).replace('{d}', d!).replace('{d}', d!))
      expect(text).not.toMatch(/[{}]/)
      expect(q.prompt.sentence!.say).toBe(`raw:${text}`)
      expect(q.say).toBe(`raw:${text}`)
      expect(q.instruction).toBe(M3.remainder)
      expect(+d!).toBeGreaterThanOrEqual(2)
      expect(+n! % +d!).toBeGreaterThanOrEqual(1)
      expect(+n!).toBeLessThanOrEqual(50)
      const right = parseOption(q.options.find(o => o.id === q.answer)!)
      expect(right).toEqual({ q: Math.floor(+n! / +d!), r: +n! % +d! })
      for (const o of q.options) if (o.id !== q.answer) expect(parseOption(o)).not.toEqual(right)
    })
    expect(ids_.size).toBe(REMAINDER_STORIES.length)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(remainderStoryQuestion, remainderStoryAccepts))
})

/* ---------- 24. divisible by 2, 5 and 10 ---------- */

describe('which divides', () => {
  it('shows 4 numbers up to 1,000, exactly one divisible, the others ending close to the right digit', () => {
    const ds = new Set<number>()
    let close = 0
    let total = 0
    each(whichDividesQuestion, q => {
      expectPick(q, 4)
      const [, d, n] = /^div(\d+):(\d+)$/.exec(q.itemKey)!.map(Number)
      ds.add(d!)
      expect(q.instruction).toBe(whichDivides(d as 2 | 5 | 10))
      expectSaysInstruction(q)
      expect(q.hint).toBe(M3.lastDigitHint)
      const numbers = q.options.map(o => +o.id)
      expect(numbers.filter(v => v % d! === 0)).toEqual([n])
      expect(+q.answer).toBe(n)
      for (const v of numbers) {
        expect(v).toBeGreaterThanOrEqual(10)
        expect(v).toBeLessThanOrEqual(1000)
        if (v !== n) {
          total++
          const gap = Math.abs((v % 10) - (n! % 10))
          if (Math.min(gap, 10 - gap) <= 2) close++
        }
      }
    })
    expect(ds).toEqual(new Set([2, 5, 10]))
    expect(close / total).toBeGreaterThan(0.6)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(whichDividesQuestion, whichDividesAccepts))
})

describe('sort divides', () => {
  it('has 8 distinct numbers, 2–6 in each bin, and the answer lists the dividers', () => {
    const ds = new Set<string>()
    each(sortDividesQuestion, q => {
      const [, d] = /^sortdiv:(\d+):/.exec(q.itemKey)!.map(Number)
      ds.add(String(d))
      expect(q.items).toHaveLength(8)
      expect(new Set(q.items).size).toBe(8)
      for (const n of q.items) {
        expect(n).toBeGreaterThanOrEqual(10)
        expect(n).toBeLessThanOrEqual(1000)
      }
      const yes = q.items.flatMap((n, i) => (n % d! === 0 ? [i] : []))
      expect(q.answer).toEqual(yes)
      expect(yes.length).toBeGreaterThanOrEqual(2)
      expect(8 - yes.length).toBeGreaterThanOrEqual(2)
      expect(q.yes).toBe(divisibleBy(d as 2 | 5 | 10))
      expect(q.no).toBe(M3.notDivisible)
      expect(q.itemKey).toBe(`sortdiv:${d}:${[...q.items].sort((a, b) => a - b).join(',')}`)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint, q.yes, q.no])
    })
    expect(ds).toEqual(new Set(['2', '5', '10']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(sortDividesQuestion, sortDividesAccepts))
})

/* ---------- 25. multiplying and dividing by 10, 100 and 1,000 ---------- */

describe('times ten', () => {
  it('multiplies and divides by 10, 100 and 1,000, results up to 10,000, no separators', () => {
    const seen = new Set<string>()
    each(timesTenQuestion, q => {
      const expr = q.prompt.expr!
      expect(expr).not.toContain(',')
      const mul = /^(\d+) × (\d+) = \?$/.exec(expr)
      const div = /^(\d+) : (\d+) = \?$/.exec(expr)
      const m = (mul ?? div)!
      const [x, y] = [+m[1]!, +m[2]!]
      expect([10, 100, 1000]).toContain(y)
      seen.add(`${mul ? 'x' : ':'}${y}`)
      expect(q.answer).toBe(mul ? x * y : x / y)
      expect(Number.isInteger(q.answer)).toBe(true)
      expect(Math.max(x, q.answer)).toBeLessThanOrEqual(10000)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.hint).toBe(M3.slideHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(seen.size).toBe(6)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(timesTenQuestion, timesTenAccepts))
})

describe('round times', () => {
  it('uses whole tens and hundreds and divides evenly', () => {
    const forms = new Set<string>()
    each(roundTimesQuestion, q => {
      const expr = q.prompt.expr!
      const mul = /^(\d+) × (\d+) = \?$/.exec(expr)
      const div = /^(\d+) : (\d+) = \?$/.exec(expr)
      const m = (mul ?? div)!
      const [x, y] = [+m[1]!, +m[2]!]
      if (mul) {
        forms.add('mul')
        expect(x % 10).toBe(0)
        expect(y % 10).toBe(0)
        expect(x * y).toBeLessThanOrEqual(10000)
        expect(q.answer).toBe(x * y)
      } else {
        forms.add(q.answer % 100 === 0 ? 'div100' : 'div10')
        expect(y).toBeGreaterThanOrEqual(2)
        expect(y).toBeLessThanOrEqual(9)
        expect(x % y).toBe(0)
        expect(q.answer).toBe(x / y)
        expect(q.answer % 10).toBe(0)
      }
      expect(q.hint).toBe(M3.slideHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(forms).toEqual(new Set(['mul', 'div100', 'div10']))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(roundTimesQuestion, roundTimesAccepts))
})

/* ---------- 26. order of operations ---------- */

describe('first step', () => {
  it('points at an operator: inside the parentheses, else × or :, else the left one', () => {
    let parens = 0
    let division = 0
    each(firstStepQuestion, q => {
      const t = q.tokens
      expect(['+', '−', '×', ':']).toContain(t[q.answer])
      const open = t.indexOf('(')
      if (open >= 0) {
        parens++
        expect(q.answer).toBeGreaterThan(open)
        expect(q.answer).toBeLessThan(t.indexOf(')'))
        expect(['+', '−']).toContain(t[q.answer])
      } else if (t.includes(':')) {
        division++
        expect(t[q.answer]).toBe(':')
      } else {
        expect(t[q.answer]).toBe('×')
      }
      // The result is a whole number from 0 to 100, and the other order gives a different one.
      const v = calc(t)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
      expect(q.itemKey).toBe(`ops:${t.join('').replace(/×/g, 'x').replace(/−/g, '-')}`)
      expect(q.hint).toBe(M3.opsHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(parens).toBeGreaterThan(40)
    expect(division).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(firstStepQuestion, firstStepAccepts))
})

describe('order result', () => {
  it('has 4 distinct numbers ≥ 0; the answer follows the order; distractors differ; the left-to-right result appears', () => {
    let leftToRight = 0
    let ignoredParens = 0
    each(resultQuestion, q => {
      expectPick(q, 4)
      const expr = q.prompt.expr!.replace(/ = \?$/, '')
      const tokens = expr.replace(/\(/g, '( ').replace(/\)/g, ' )').split(' ')
      expect(+q.answer).toBe(calc(tokens))
      for (const o of q.options) {
        expect(+o.id).toBeGreaterThanOrEqual(0)
        if (o.id !== q.answer) expect(+o.id).not.toBe(+q.answer)
      }
      const flat = tokens.filter(t => t !== '(' && t !== ')')
      const ltr = flat.slice(1).reduce<number>((acc, t, i, arr) => {
        if (i % 2 === 1) return acc
        const rhs = Number(arr[i + 1])
        return t === '+' ? acc + rhs : t === '−' ? acc - rhs : t === '×' ? acc * rhs : acc / rhs
      }, Number(flat[0]))
      if (!tokens.includes('(') && !tokens.includes(':') && q.options.some(o => +o.id === ltr)) leftToRight++
      if (tokens.includes('(') && q.options.some(o => +o.id === calc(flat))) ignoredParens++
      expect(q.hint).toBe(M3.opsHint)
      expectSaysInstruction(q)
    })
    expect(leftToRight).toBeGreaterThan(20)
    expect(ignoredParens).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(resultQuestion, resultAccepts))
})

/* ---------- 27. angles and triangles ---------- */

describe('angle type', () => {
  it('draws an angle inside its band with varied rotation and arms; the aid adds the right-angle corner', () => {
    const kinds = new Set<string>()
    let longAcute = 0
    let shortObtuse = 0
    const rots = new Set<number>()
    each(angleTypeQuestion, q => {
      expectPick(q, 4)
      expect(q.options.map(o => o.id)).toEqual(['acute', 'right', 'obtuse', 'straight'])
      for (const o of q.options) expect(label(o)).toBe(phrases[`math.angle.${o.id}`])
      const art = q.prompt.art![0]!
      expect(art.name).toBe('math.angle')
      const { deg, rot, armA, armB } = art.props as { deg: number; rot: number; armA: number; armB: number }
      kinds.add(q.answer)
      const band = { acute: [20, 70], right: [90, 90], obtuse: [110, 160], straight: [180, 180] }[q.answer as 'acute']
      expect(deg).toBeGreaterThanOrEqual(band[0]!)
      expect(deg).toBeLessThanOrEqual(band[1]!)
      expect(rot).toBeGreaterThanOrEqual(0)
      expect(rot).toBeLessThan(360)
      rots.add(rot)
      for (const arm of [armA, armB]) {
        expect(arm).toBeGreaterThanOrEqual(0.35)
        expect(arm).toBeLessThanOrEqual(1)
      }
      if (q.answer === 'acute' && Math.min(armA, armB) >= 0.8) longAcute++
      if (q.answer === 'obtuse' && Math.max(armA, armB) <= 0.5) shortObtuse++
      expect(q.aidArt).toEqual([{ name: 'math.angle', props: { deg, rot, armA, armB, corner: true } }])
      expect(q.hint).toBe(M3.angleHint)
      expectSaysInstruction(q)
    })
    expect(kinds).toEqual(new Set(['acute', 'right', 'obtuse', 'straight']))
    expect(longAcute).toBeGreaterThan(10)
    expect(shortObtuse).toBeGreaterThan(10)
    expect(rots.size).toBeGreaterThan(100)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(angleTypeQuestion, angleTypeAccepts))
})

type Props = { a: number; b: number; rot: number; ticks?: boolean }
const propsOf = (o: PickOption) => (o as unknown as { art: { props: Props } }).art.props
const anglesOf = (o: PickOption) => {
  const { a, b } = propsOf(o)
  return [a, b, 180 - a - b]
}

describe('triangle by angles', () => {
  it('shows an acute, a right and an obtuse triangle; exactly one matches', () => {
    each(triangleAnglesQuestion, q => {
      expectPick(q, 3)
      expect(q.instruction).toBe(findTriangle(q.answer as 'acute' | 'right' | 'obtuse'))
      const kindOf = (o: PickOption) => {
        const angles = anglesOf(o)
        expect(angles.every(v => v >= 15 && v < 180)).toBe(true)
        expect(angles.reduce((x, y) => x + y, 0)).toBe(180)
        const big = Math.max(...angles)
        return big === 90 ? 'right' : big > 90 ? 'obtuse' : 'acute'
      }
      expect(q.options.map(kindOf).sort()).toEqual(['acute', 'obtuse', 'right'])
      expect(kindOf(q.options.find(o => o.id === q.answer)!)).toBe(q.answer)
      // Clearly in its band: obtuse 105°+, acute at most 80°.
      for (const o of q.options) {
        const big = Math.max(...anglesOf(o))
        expect(big === 90 || big >= 105 || big <= 80).toBe(true)
        expect(propsOf(o).ticks).toBeUndefined()
      }
      expect(q.hint).toBe(M3.triangleHint)
      expectSaysInstruction(q)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(triangleAnglesQuestion, triangleAnglesAccepts, 3))
})

describe('triangle by sides', () => {
  it('shows an equilateral, an isosceles and a scalene triangle with tick marks; exactly one matches', () => {
    each(triangleSidesQuestion, q => {
      expectPick(q, 3)
      expect(q.instruction).toBe(findTriangle(q.answer as 'equilateral' | 'isosceles' | 'scalene'))
      const kindOf = (o: PickOption) => {
        const angles = anglesOf(o)
        expect(angles.every(v => v > 0)).toBe(true)
        expect(angles).not.toContain(90)
        expect(propsOf(o).ticks).toBe(true)
        const distinct = new Set(angles).size
        return distinct === 1 ? 'equilateral' : distinct === 2 ? 'isosceles' : 'scalene'
      }
      expect(q.options.map(kindOf).sort()).toEqual(['equilateral', 'isosceles', 'scalene'])
      expect(kindOf(q.options.find(o => o.id === q.answer)!)).toBe(q.answer)
      for (const o of q.options) if (o.id === 'equilateral') expect(anglesOf(o)).toEqual([60, 60, 60])
      expect(q.hint).toBe(M3.sidesHint)
      expectSaysInstruction(q)
    })
  })
  it('keeps isosceles apart from equilateral and right triangles', () => {
    each(triangleSidesQuestion, q => {
      const iso = anglesOf(q.options.find(o => o.id === 'isosceles')!)
      expect(iso).not.toContain(60)
      expect(iso).not.toContain(90)
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(triangleSidesQuestion, triangleSidesAccepts, 3))
})

/* ---------- 28. area ---------- */

describe('count squares', () => {
  it('is a rectangle or an L of two rectangles inside a grid of at most 10 × 8; answer = the area', () => {
    let l = 0
    let rect = 0
    each(countSquaresQuestion, q => {
      expect(q.mode).toBe('count')
      expect(q.cols).toBeLessThanOrEqual(10)
      expect(q.rows).toBeLessThanOrEqual(8)
      expect(q.rects.length === 1 || q.rects.length === 2).toBe(true)
      const cells = new Set<string>()
      for (const [c, r, w, h] of q.rects) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(c + w).toBeLessThanOrEqual(q.cols)
        expect(r + h).toBeLessThanOrEqual(q.rows)
        for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) cells.add(`${x},${y}`)
      }
      expect(q.answer).toBe(cells.size)
      expect(q.rects.reduce((sum, [, , w, h]) => sum + w * h, 0)).toBe(cells.size)
      if (q.rects.length === 2) {
        l++
        expect(q.itemKey).toMatch(/^areaL:\d+x\d+\+\d+x\d+$/)
      } else {
        rect++
        expect(q.itemKey).toBe(`area:${q.cols}x${q.rows}`)
      }
      expect(q.hint).toBe(M3.areaHint)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(l).toBeGreaterThan(60)
    expect(rect).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(countSquaresQuestion, countSquaresAccepts))
})

describe('length and width', () => {
  it('is one rectangle up to 10 × 10 with the sides shown; answer = length × width', () => {
    each(lengthWidthQuestion, q => {
      expect(q.mode).toBe('sides')
      expect(q.rects).toEqual([[0, 0, q.cols, q.rows]])
      expect(q.cols).toBeGreaterThanOrEqual(2)
      expect(q.cols).toBeLessThanOrEqual(10)
      expect(q.rows).toBeGreaterThanOrEqual(2)
      expect(q.rows).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(q.cols * q.rows)
      expect(q.itemKey).toBe(`area:${q.cols}x${q.rows}`)
      expect(q.instruction).toBe(M3.area)
      expectSaysInstruction(q)
      expectKnown([q.say, q.instruction, q.hint])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(lengthWidthQuestion, lengthWidthAccepts))
})

/* ---------- keys across games ---------- */

describe('item keys', () => {
  const games: [string, (c: GenContext) => { itemKey: string }, (key: string) => boolean][] = [
    ['build4', build4Question, build4Accepts], ['flexible4', flexible4Question, flexible4Accepts], ['compare4', compare4Question, compare4Accepts],
    ['line10000', line10000Question, line10000Accepts], ['skipBig', skipBigQuestion, skipBigAccepts], ['mistake', mistakeQuestion, mistakeAccepts],
    ['closer', closerQuestion, closerAccepts], ['roundPick', roundPickQuestion, roundPickAccepts], ['column', columnQuestion, columnAccepts],
    ['missingLeft', missingLeftQuestion, missingLeftAccepts], ['estimateBig', estimateBigQuestion, estimateBigAccepts],
    ['tableNew', tableNewQuestion, tableNewAccepts], ['missingFactor', missingFactorQuestion, missingFactorAccepts],
    ['arrayBig', c => arrayBigQuestion(c, THINGS), arrayBigAccepts], ['arena', arenaQuestion, arenaAccepts],
    ['shareLeft', c => shareLeftQuestion(c, THINGS), shareLeftAccepts], ['remainderPick', remainderPickQuestion, remainderPickAccepts],
    ['remainderStory', remainderStoryQuestion, remainderStoryAccepts], ['whichDivides', whichDividesQuestion, whichDividesAccepts],
    ['sortDivides', sortDividesQuestion, sortDividesAccepts], ['timesTen', timesTenQuestion, timesTenAccepts],
    ['roundTimes', roundTimesQuestion, roundTimesAccepts], ['firstStep', firstStepQuestion, firstStepAccepts], ['result', resultQuestion, resultAccepts],
    ['angleType', angleTypeQuestion, angleTypeAccepts], ['triangleAngles', triangleAnglesQuestion, triangleAnglesAccepts],
    ['triangleSides', triangleSidesQuestion, triangleSidesAccepts], ['countSquares', countSquaresQuestion, countSquaresAccepts],
    ['lengthWidth', lengthWidthQuestion, lengthWidthAccepts],
  ]
  /** Games that practise the same facts on purpose, so their keys are shared. */
  const shared = [['tableNew', 'arena'], ['countSquares', 'lengthWidth'], ['shareLeft', 'remainderPick']]
  const together = (a: string, b: string) => shared.some(g => g.includes(a) && g.includes(b))

  it('each game accepts its own keys and no other game accepts them (except on purpose)', () => {
    for (const [name, gen, accepts] of games) {
      for (const seed of SEEDS.slice(0, 40)) {
        const key = gen(ctx(seed)).itemKey
        expect(accepts(key), `${name} ${key}`).toBe(true)
        for (const [other, , otherAccepts] of games)
          if (other !== name && !together(name, other)) expect(otherAccepts(key), `${other} accepts ${name}'s ${key}`).toBe(false)
      }
    }
  })
  it('rejects malformed keys', () => {
    for (const [name, , accepts] of games) for (const key of ['', 'x', 'pv4:', 'pv4:12', 'col:5-7000', 'rem:5:0', 'sign4:1234:9999', 'area:0x5']) expect(accepts(key), `${name} ${key}`).toBe(false)
  })
})
