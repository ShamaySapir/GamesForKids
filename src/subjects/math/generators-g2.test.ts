import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { ObjectGroup, PickOption, PickQ } from '../../ui/pick/types'
import {
  TABLES, arrayAccepts, arrayExerciseQuestion, arrayQuestion, arrayResultQuestion, buildNumberAccepts, buildNumberQuestion, compareSignsAccepts,
  compareSignsQuestion, estimateQuestion, facts20Accepts, facts20Question, flexibleAccepts, flexibleQuestion, groupsAccepts, groupsOfAccepts,
  groupsOfQuestion, groupsQuestion, hundredChartAccepts, hundredChartQuestion, missing100Question, pairsAccepts, pairsQuestion, parityAccepts,
  parityQuestion, shareAccepts, shareQuestion, skip1000Accepts, skip1000Question, solve100Question, tablesAccepts, tablesQuestion, within100Accepts,
} from './generators-g2'
import { M, OP } from './ids'
import { numberPhrase } from './numbers'
import type { Thing } from './types'

/* ---------- fixtures and utilities ---------- */

const THINGS: Thing[] = [{ id: 'bird', emoji: '🐦' }, { id: 'apple', emoji: '🍎' }, { id: 'cookie', emoji: '🍪' }]

const KNOWN = new Set<string>([...Object.values(M), ...Object.values(OP), ...Array.from({ length: 1001 }, (_, n) => numberPhrase(n)).flat()])

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)
const each = <Q>(gen: (c: GenContext) => Q, fn: (q: Q, seed: number) => void) => {
  for (const seed of SEEDS) fn(gen(ctx(seed)), seed)
}

const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
function expectKnown(refs: (PhraseRef | undefined)[]) {
  for (const p of refs.flatMap(ids)) expect(KNOWN.has(p), p).toBe(true)
}

const label = (o: PickOption) => (o as { label: string }).label
const group = (q: PickQ) => q.prompt.objects![0] as ObjectGroup

function expectPick(q: PickQ, options: number) {
  const optionIds = q.options.map(o => o.id)
  expect(q.options).toHaveLength(options)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  expectKnown([q.say, q.instruction, q.hint, ...q.options.map(o => ('say' in o ? o.say : undefined))])
}

/** Evaluates `a + b`, `a − b`, `a × b` and `4 + 4 + 4` chains (× binds first; none of the generated labels mix them). */
function evalLabel(text: string): number {
  return text.split(' + ').reduce((sum, term) => sum + term.split(' × ').reduce((p, f) => p * Number(f), 1), 0)
}

/** Evaluates `a + b = ?`-style expressions with at most one `?`; returns the value of `?`. */
function solveExpr(expr: string): number {
  const m = /^(\S+) ([+−]) (\S+) = (\S+)$/.exec(expr)!
  const [x, op, y, z] = [m[1]!, m[2]!, m[3]!, m[4]!]
  const f = (a: number, b: number) => (op === '+' ? a + b : a - b)
  if (z === '?') return f(+x, +y)
  if (x === '?') return op === '+' ? +z - +y : +z + +y
  return op === '+' ? +z - +x : +x - +z
}

/** The facts a generator emitted over all seeds, to show that review and avoid are honored. */
function expectReviewAndAvoid<Q extends { itemKey: string }>(gen: (c: GenContext) => Q, accepts: (key: string) => boolean) {
  const keys = new Set<string>()
  for (const seed of SEEDS) {
    const q = gen(ctx(seed))
    expect(accepts(q.itemKey), q.itemKey).toBe(true)
    keys.add(q.itemKey)
    const avoided = gen(ctx(seed, [q.itemKey]))
    expect(avoided.itemKey).not.toBe(q.itemKey)
  }
  expect(keys.size).toBeGreaterThanOrEqual(20)
  for (const key of [...keys].slice(0, 25)) {
    expect(gen(ctx(7, [], key)).itemKey).toBe(key)
    // Even when avoided, a due review item still comes first.
    expect(gen(ctx(8, [key], key)).itemKey).toBe(key)
  }
}

/* ---------- 11. place value ---------- */

describe('build number', () => {
  it('asks 10–999 with the right number of columns, spoken and shown', () => {
    let two = 0
    let three = 0
    each(buildNumberQuestion, q => {
      expect(q.answer).toBeGreaterThanOrEqual(10)
      expect(q.answer).toBeLessThanOrEqual(999)
      expect(q.columns).toBe(q.answer >= 100 ? 3 : 2)
      // The answer is reachable: every column of the house holds 0–9.
      expect(String(q.answer).length).toBe(q.columns)
      expect(q.show).toBe(String(q.answer))
      expect(q.say).toEqual([M.build, ...numberPhrase(q.answer)])
      expect(q.instruction).toBe(M.build)
      expectKnown([q.say, q.instruction])
      if (q.columns === 2) two++
      else three++
    })
    expect(two).toBeGreaterThan(60)
    expect(three).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(buildNumberQuestion, buildNumberAccepts))
})

describe('flexible', () => {
  it('shows a true split whose missing ones fit the pad', () => {
    each(flexibleQuestion, q => {
      const m = /^(\d+) = (\d+) \+ (?:(\d+) \+ )?\?$/.exec(q.prompt.expr!)!
      const n = +m[1]!
      const parts = [+m[2]!, ...(m[3] ? [+m[3]] : [])]
      expect(n).toBeGreaterThanOrEqual(11)
      expect(parts.reduce((a, b) => a + b, 0) + q.answer).toBe(n)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThanOrEqual(99)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      // Tens parts are whole tens ≥ 10; a hundreds part comes first.
      if (n >= 100) {
        expect(parts[0]! % 100).toBe(0)
        expect(parts[1]! % 10).toBe(0)
        expect(parts[1]!).toBeGreaterThanOrEqual(10)
      } else {
        expect(parts).toHaveLength(1)
        expect(parts[0]! % 10).toBe(0)
        expect(parts[0]!).toBeGreaterThanOrEqual(10)
      }
      expect(q.itemKey).toBe(`flex:${n}`)
      expect(flexibleAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
  })
  it('sometimes needs more than 9 ones (56 = 40 + 16)', () => {
    let big = 0
    each(flexibleQuestion, q => { if (q.answer >= 10) big++ })
    expect(big).toBeGreaterThan(40)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(flexibleQuestion, flexibleAccepts))
})

describe('compare signs', () => {
  it('has the three signs in a fixed order and the right answer', () => {
    let equal = 0
    let oneDigit = 0
    each(compareSignsQuestion, q => {
      expectPick(q, 3)
      expect(q.options.map(o => o.id)).toEqual(['<', '=', '>'])
      expect(q.options.map(label)).toEqual(['<', '=', '>'])
      const m = /^(\d+) \? (\d+)$/.exec(q.prompt.expr!)!
      const [a, b] = [+m[1]!, +m[2]!]
      expect(q.answer).toBe(a < b ? '<' : a > b ? '>' : '=')
      expect(String(a).length).toBe(String(b).length)
      expect(a).toBeGreaterThanOrEqual(10)
      expect(b).toBeGreaterThanOrEqual(10)
      expect(a).toBeLessThanOrEqual(999)
      expect(b).toBeLessThanOrEqual(999)
      expect(q.itemKey).toBe(`sign:${a}`)
      if (a === b) equal++
      const differing = String(a).split('').filter((ch, i) => ch !== String(b)[i]).length
      if (differing === 1) oneDigit++
    })
    expect(equal).toBeGreaterThan(10)
    expect(equal).toBeLessThan(80)
    expect(oneDigit).toBeGreaterThan(50)
  })
  it('uses the sign phrases and honors review and avoid', () => {
    const q = compareSignsQuestion(ctx(1))
    expect(q.options.map(o => (o as { say: string }).say)).toEqual([OP.less, OP.equals, OP.greater])
    expectReviewAndAvoid(compareSignsQuestion, compareSignsAccepts)
  })
})

/* ---------- 12. count to 1,000 ---------- */

describe('skip 1000', () => {
  it('is an arithmetic sequence with one gap, terms ≤ 1,000, the answer fits the pad', () => {
    const steps = new Set<number>()
    let nonMultiple = 0
    each(skip1000Question, q => {
      const terms = q.prompt.expr!.split(', ')
      expect(terms).toHaveLength(5)
      const gap = terms.indexOf('?')
      expect(gap).toBeGreaterThanOrEqual(1)
      expect(terms.filter(t => t === '?')).toHaveLength(1)
      const known = terms.map(Number)
      const step = (gap === 4 ? known[3]! - known[2]! : known[gap + 1]! - known[gap - 1]!) / (gap === 4 ? 1 : 2)
      expect([10, 20, 50, 100]).toContain(step)
      steps.add(step)
      const first = gap === 0 ? 0 : known[0]!
      expect(q.answer).toBe(first + gap * step)
      for (let i = 0; i < 5; i++) if (i !== gap) expect(known[i]).toBe(first + i * step)
      expect(q.answer).toBeGreaterThan(0)
      expect(q.answer).toBeLessThanOrEqual(999)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(first + 4 * step).toBeLessThanOrEqual(1000)
      if (first % step !== 0 && first % 10 !== 0) nonMultiple++
      expect(skip1000Accepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(steps).toEqual(new Set([10, 20, 50, 100]))
    expect(nonMultiple).toBeGreaterThan(20)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(skip1000Question, skip1000Accepts))
})

describe('hundred chart', () => {
  it('blanks are inside the block, 3–5, not all in one row, answer ascending', () => {
    const starts = new Set<number>()
    const counts = new Set<number>()
    each(hundredChartQuestion, q => {
      starts.add(q.start)
      expect(q.start % 100).toBe(1)
      expect(q.start).toBeLessThanOrEqual(901)
      expect(q.blanks.length).toBeGreaterThanOrEqual(3)
      expect(q.blanks.length).toBeLessThanOrEqual(5)
      counts.add(q.blanks.length)
      expect(new Set(q.blanks).size).toBe(q.blanks.length)
      for (const b of q.blanks) {
        expect(b).toBeGreaterThanOrEqual(q.start)
        expect(b).toBeLessThanOrEqual(q.start + 99)
      }
      expect(new Set(q.blanks.map(b => Math.floor((b - q.start) / 10))).size).toBeGreaterThanOrEqual(2)
      expect(q.answer).toEqual([...q.blanks].sort((a, b) => a - b))
      expect(hundredChartAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(starts.size).toBe(10)
    expect(counts).toEqual(new Set([3, 4, 5]))
  })
  it('honors review and avoid', () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const q = hundredChartQuestion(ctx(seed))
      expect(hundredChartQuestion(ctx(seed, [q.itemKey])).itemKey).not.toBe(q.itemKey)
      expect(hundredChartQuestion(ctx(seed, [], 'chart:301')).start).toBe(301)
    }
  })
})

/* ---------- 13. within 100 ---------- */

const crossesTen = (op: string, a: number, b: number) => (op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10)

describe('solve within 100', () => {
  it('two-digit facts, results 1–100, with and without crossing a ten', () => {
    let crossing = 0
    let straight = 0
    let adds = 0
    let subs = 0
    each(solve100Question, q => {
      const m = /^(\d+) ([+−]) (\d+) = \?$/.exec(q.prompt.expr!)!
      const [a, op, b] = [+m[1]!, m[2]!, +m[3]!]
      expect(a).toBeGreaterThanOrEqual(10)
      expect(a).toBeLessThanOrEqual(100)
      expect(b).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBe(solveExpr(q.prompt.expr!))
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(100)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(a % 10 === 0 && b % 10 === 0).toBe(false)
      if (op === '+') adds++
      else subs++
      if (crossesTen(op === '+' ? '+' : '-', a, b)) crossing++
      else straight++
      expect(q.say).toEqual([M.solve, ...numberPhrase(a), op === '+' ? OP.plus : OP.minus, ...numberPhrase(b)])
      expect(within100Accepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction, q.hint])
    })
    expect(crossing).toBeGreaterThan(60)
    expect(straight).toBeGreaterThan(60)
    expect(adds).toBeGreaterThan(60)
    expect(subs).toBeGreaterThan(60)
  })
  it('the hint is the first step: the second number\'s tens', () => {
    let hints = 0
    each(solve100Question, q => {
      if (!q.hint) return
      hints++
      const m = /^(\d+) ([+−]) (\d+) = \?$/.exec(q.prompt.expr!)!
      expect(q.hint).toEqual([...numberPhrase(+m[1]!), m[2] === '+' ? OP.plus : OP.minus, ...numberPhrase(+m[3]! - (+m[3]! % 10))])
    })
    expect(hints).toBeGreaterThan(20)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(solve100Question, within100Accepts))
})

describe('missing within 100', () => {
  it('the blank is either operand and the equation holds', () => {
    let first = 0
    let second = 0
    each(missing100Question, q => {
      const expr = q.prompt.expr!
      expect(expr.split('?')).toHaveLength(2)
      expect(q.answer).toBe(solveExpr(expr))
      expect(q.answer).toBeGreaterThan(0)
      expect(q.answer).toBeLessThanOrEqual(100)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      const result = +expr.split('= ')[1]!
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(100)
      if (expr.startsWith('?')) first++
      else second++
      expect(within100Accepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(first).toBeGreaterThan(60)
    expect(second).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(missing100Question, within100Accepts))
})

describe('estimate', () => {
  it('benchmark is a whole ten, never equal to the result, and the answer is right', () => {
    let more = 0
    let less = 0
    each(estimateQuestion, q => {
      expectPick(q, 2)
      expect(q.options.map(o => o.id).sort()).toEqual(['less', 'more'])
      expect(q.options.map(o => o.kind)).toEqual(['sound', 'sound'])
      const m = /^(\d+) ([+−]) (\d+) \? (\d+)$/.exec(q.prompt.expr!)!
      const [a, op, b, bench] = [+m[1]!, m[2]!, +m[3]!, +m[4]!]
      const result = op === '+' ? a + b : a - b
      expect(result).not.toBe(bench)
      expect(bench % 10).toBe(0)
      expect(bench).toBeGreaterThanOrEqual(10)
      expect(bench).toBeLessThanOrEqual(100)
      expect(Math.abs(result - bench)).toBeLessThan(10 + 1)
      expect(q.answer).toBe(result > bench ? 'more' : 'less')
      expect(q.say).toEqual([M.estimate, ...numberPhrase(bench)])
      if (q.answer === 'more') more++
      else less++
      expect(within100Accepts(q.itemKey)).toBe(true)
    })
    expect(more).toBeGreaterThan(60)
    expect(less).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(estimateQuestion, within100Accepts))
})

/* ---------- 14. facts within 20 ---------- */

describe('facts within 20', () => {
  it('mixed + and −, all within 20, the item key is the fact', () => {
    let adds = 0
    let subs = 0
    let notCrossing = 0
    each(facts20Question, q => {
      const m = /^(\d+) ([+−]) (\d+) = \?$/.exec(q.prompt.expr!)!
      const [a, op, b] = [+m[1]!, m[2]!, +m[3]!]
      expect(a).toBeLessThanOrEqual(20)
      expect(a).toBeGreaterThanOrEqual(1)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBe(solveExpr(q.prompt.expr!))
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(20)
      expect(q.itemKey).toBe(`f20:${a}${op === '+' ? '+' : '-'}${b}`)
      if (op === '+') adds++
      else subs++
      if (!crossesTen(op === '+' ? '+' : '-', a, b) || a < 10) notCrossing++
      expect(q.aidLine!.max).toBe(20)
      expect(q.aidLine!.from).toBe(a)
      expect(q.aidLine!.from + q.aidLine!.jumps.reduce((x, y) => x + y, 0)).toBe(q.answer)
      expect(facts20Accepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(adds).toBeGreaterThan(60)
    expect(subs).toBeGreaterThan(60)
    expect(notCrossing).toBeGreaterThan(40)
  })
  it('a missed fact comes back, an avoided one does not', () => expectReviewAndAvoid(facts20Question, facts20Accepts))
})

/* ---------- 15. odd / even ---------- */

describe('pairs', () => {
  it('objects in pairs, even/odd answer, both asked', () => {
    let even = 0
    let odd = 0
    each(c => pairsQuestion(c, THINGS), q => {
      expectPick(q, 2)
      expect(q.options.map(o => o.id).sort()).toEqual(['even', 'odd'])
      const g = group(q)
      expect(q.prompt.objects).toHaveLength(1)
      expect(g.layout).toBe('groups')
      expect(g.cols).toBe(2)
      expect(g.count).toBeGreaterThanOrEqual(1)
      expect(g.count).toBeLessThanOrEqual(20)
      expect(q.answer).toBe(g.count % 2 === 0 ? 'even' : 'odd')
      if (q.answer === 'even') even++
      else odd++
      expect(pairsAccepts(q.itemKey)).toBe(true)
    })
    expect(even).toBeGreaterThan(80)
    expect(odd).toBeGreaterThan(80)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(c => pairsQuestion(c, THINGS), pairsAccepts))
})

describe('odd/even numbers', () => {
  it('0–100, zero is even, the answer is right', () => {
    const seen = new Set<number>()
    each(parityQuestion, q => {
      expectPick(q, 2)
      const n = +q.prompt.expr!
      seen.add(n)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(100)
      expect(q.answer).toBe(n % 2 === 0 ? 'even' : 'odd')
      expect(q.say).toEqual([M.oddEven, ...numberPhrase(n)])
      expect(parityAccepts(q.itemKey)).toBe(true)
    })
    expect(seen.size).toBeGreaterThan(60)
  })
  it('0 is even', () => {
    const q = parityQuestion(ctx(1, [], 'parity:0'))
    expect(q.prompt.expr).toBe('0')
    expect(q.answer).toBe('even')
  })
  it('honors review and avoid', () => expectReviewAndAvoid(parityQuestion, parityAccepts))
})

/* ---------- 16. multiplication ---------- */

const tableFactor = (a: number, b: number) => TABLES.some(t => t === a || t === b)

describe('array', () => {
  it('exercise variant: the picture matches `rows × cols`, 3 distinct exercises, no distractor of equal value', () => {
    each(c => arrayExerciseQuestion(c, THINGS), q => {
      expectPick(q, 3)
      const g = group(q)
      expect(g.layout).toBe('array')
      const rows = g.count / g.cols!
      expect(Number.isInteger(rows)).toBe(true)
      expect(rows).toBeGreaterThanOrEqual(2)
      expect(rows).toBeLessThanOrEqual(10)
      expect(tableFactor(rows, g.cols!)).toBe(true)
      expect(g.count).toBeLessThanOrEqual(50)
      expect(q.answer).toBe(`${rows} × ${g.cols}`)
      const labels = q.options.map(label)
      expect(labels).toContain(q.answer)
      for (const o of q.options) {
        expect(o.kind).toBe('number')
        if (o.id !== q.answer) {
          expect(evalLabel(label(o))).not.toBe(g.count)
          // The swapped factors have the same value, so they are never offered as a wrong answer.
          expect(label(o)).not.toBe(`${g.cols} × ${rows}`)
        }
      }
      expect(arrayAccepts(q.itemKey)).toBe(true)
    })
  })
  it('exercise variant uses a + and a × distractor', () => {
    let plus = 0
    each(c => arrayExerciseQuestion(c, THINGS), q => { if (q.options.some(o => label(o).includes('+'))) plus++ })
    expect(plus).toBeGreaterThan(200)
  })
  it('result variant: 4 distinct numbers, the answer is rows × cols', () => {
    each(c => arrayResultQuestion(c, THINGS), q => {
      expectPick(q, 4)
      const g = group(q)
      expect(g.layout).toBe('array')
      expect(q.answer).toBe(String(g.count))
      expect(tableFactor(g.count / g.cols!, g.cols!)).toBe(true)
      for (const o of q.options) {
        expect(+label(o)).toBeGreaterThan(0)
        expect(+label(o)).toBeLessThanOrEqual(100)
      }
      expect(arrayAccepts(q.itemKey)).toBe(true)
    })
  })
  it('the game mixes both variants and honors review and avoid', () => {
    let exercises = 0
    let results = 0
    each(c => arrayQuestion(c, THINGS), q => {
      if (label(q.options[0]!).includes('×') || label(q.options[0]!).includes('+')) exercises++
      else results++
    })
    expect(exercises).toBeGreaterThan(60)
    expect(results).toBeGreaterThan(60)
    expectReviewAndAvoid(c => arrayQuestion(c, THINGS), arrayAccepts)
  })
})

describe('groups', () => {
  it('the picture is `n` groups of `k`; the answer matches it, wrong options differ in value and label', () => {
    let sums = 0
    let products = 0
    each(c => groupsQuestion(c, THINGS), q => {
      expectPick(q, 3)
      const g = group(q)
      expect(g.layout).toBe('groups')
      const n = g.count / g.cols!
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(2)
      expect(tableFactor(n, g.cols!)).toBe(true)
      expect(evalLabel(q.answer)).toBe(g.count)
      if (q.answer.includes('×')) {
        products++
        expect(q.answer).toBe(`${n} × ${g.cols}`)
      } else {
        sums++
        expect(q.answer).toBe(Array(n).fill(g.cols).join(' + '))
      }
      for (const o of q.options) if (o.id !== q.answer) expect(evalLabel(label(o))).not.toBe(g.count)
      expect(groupsAccepts(q.itemKey)).toBe(true)
    })
    expect(sums).toBeGreaterThan(30)
    expect(products).toBeGreaterThan(60)
  })
  it('honors review and avoid', () => expectReviewAndAvoid(c => groupsQuestion(c, THINGS), groupsAccepts))
})

describe('tables', () => {
  it('only the 2, 4, 5, 10 tables, × only, answers up to 100', () => {
    const tablesSeen = new Set<number>()
    each(tablesQuestion, q => {
      const m = /^(\d+) × (\d+) = \?$/.exec(q.prompt.expr!)!
      const [a, b] = [+m[1]!, +m[2]!]
      expect(tableFactor(a, b)).toBe(true)
      for (const t of TABLES) if (a === t || b === t) tablesSeen.add(t)
      expect(a).toBeLessThanOrEqual(10)
      expect(b).toBeLessThanOrEqual(10)
      expect(a).toBeGreaterThanOrEqual(1)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBe(a * b)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.itemKey).toBe(`tbl:${a}x${b}`)
      expect(q.say).toEqual([M.solve, ...numberPhrase(a), OP.times, ...numberPhrase(b)])
      expect(tablesAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(tablesSeen).toEqual(new Set(TABLES))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(tablesQuestion, tablesAccepts))
})

/* ---------- 17. division ---------- */

describe('share', () => {
  it('equal shares, no remainder, total ≤ 40, plates or result in the tables', () => {
    const plates = new Set<number>()
    each(c => shareQuestion(c, THINGS), q => {
      expect(q.total % q.plates).toBe(0)
      expect(q.answer).toBe(q.total / q.plates)
      expect(q.answer).toBeGreaterThanOrEqual(2)
      expect(q.total).toBeLessThanOrEqual(40)
      expect(q.plates).toBeGreaterThanOrEqual(2)
      expect(q.plates).toBeLessThanOrEqual(5)
      plates.add(q.plates)
      expect(tableFactor(q.plates, q.answer)).toBe(true)
      expect(THINGS.map(t => t.emoji)).toContain(q.emoji)
      expect(q.itemKey).toBe(`share:${q.total}÷${q.plates}`)
      expect(shareAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(plates).toEqual(new Set([2, 3, 4, 5]))
  })
  it('honors review and avoid', () => expectReviewAndAvoid(c => shareQuestion(c, THINGS), shareAccepts))
})

describe('groups of', () => {
  it('objects in groups of `size`; the answer is the number of groups', () => {
    each(c => groupsOfQuestion(c, THINGS), q => {
      const g = group(q as unknown as PickQ)
      expect(g.layout).toBe('groups')
      expect(g.count % g.cols!).toBe(0)
      expect(q.answer).toBe(g.count / g.cols!)
      expect(q.answer).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBeLessThanOrEqual(10)
      expect(g.count).toBeLessThanOrEqual(50)
      expect(tableFactor(q.answer, g.cols!)).toBe(true)
      expect(q.prompt.expr).toBe(`${g.count} : ${g.cols} = ?`)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(groupsOfAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
  })
  it('honors review and avoid', () => expectReviewAndAvoid(c => groupsOfQuestion(c, THINGS), groupsOfAccepts))
})

describe('accepts', () => {
  it('rejects keys from other games and malformed keys', () => {
    expect(buildNumberAccepts('pv:5')).toBe(false)
    expect(buildNumberAccepts('pv:1000')).toBe(false)
    expect(buildNumberAccepts('pv:abc')).toBe(false)
    expect(compareSignsAccepts('pv:347')).toBe(false)
    expect(tablesAccepts('tbl:3x7')).toBe(false)
    expect(within100Accepts('f20:8+5')).toBe(false)
    expect(facts20Accepts('w100:47+25')).toBe(false)
    expect(shareAccepts('groupsof:20÷4')).toBe(false)
  })
})
