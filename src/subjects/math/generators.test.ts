import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { ObjectGroup, PickOption, PickQ } from '../../ui/pick/types'
import {
  ALL_SPLITS_KEY, DOMINO_DOT, LOOK_ALIKE, SHOP_COINS, allSplitsAccepts, allSplitsQuestion, changeAccepts, changeQuestion, compareAccepts, countAccepts,
  dominoAccepts, dominoQuestion, hearNumberAccepts, hearNumberQuestion, hiddenAccepts, hiddenQuestion, howManyQuestion, joinSeparateQuestion,
  matchAccepts, matchQuestion, misplacedQuestion, missingAccepts, missingQuestion, moreLessQuestion, mostAccepts, mostQuestion, nextBeforeAccepts,
  nextBeforeQuestion, payAccepts, payQuestion, placeAccepts, placeQuestion, showMeQuestion, skipCountAccepts, skipCountQuestion, solveAccepts,
  solveQuestion, storyAccepts, tensAccepts, tensQuestion, whichNumberAccepts, whichNumberQuestion, whoAmIAccepts, whoAmIQuestion,
} from './generators'
import { M, OP, shopPhrase, storyPart, thingPhrase } from './ids'
import { numberPhrase, pricePhrase } from './numbers'
import type { PadQ, StoryTemplate, Thing } from './types'

/* ---------- fixtures ---------- */

const THINGS: Thing[] = [{ id: 'bird', emoji: '🐦' }, { id: 'apple', emoji: '🍎' }, { id: 'cookie', emoji: '🍪' }]
const STORIES: StoryTemplate[] = [
  { id: 'j1', kind: 'join', things: ['bird'] }, { id: 'j2', kind: 'join', things: ['apple', 'cookie'] },
  { id: 's1', kind: 'separate', things: ['apple'] }, { id: 's2', kind: 'separate', things: ['cookie', 'bird'] },
]
const SHOP = [{ id: 'ball', emoji: '⚽' }, { id: 'book', emoji: '📖' }]

const KNOWN = new Set<string>([
  ...Object.values(M), ...Object.values(OP),
  ...Array.from({ length: 101 }, (_, n) => numberPhrase(n)).flat(),
  ...Array.from({ length: 20 }, (_, i) => pricePhrase(i + 1)),
  ...THINGS.map(t => thingPhrase(t.id)), ...SHOP.map(s => shopPhrase(s.id)),
  ...STORIES.flatMap(s => (['start', 'middle', 'end'] as const).map(p => storyPart(s.id, p))),
])

/* ---------- utilities ---------- */

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)
const each = <Q>(gen: (c: GenContext) => Q, fn: (q: Q, seed: number) => void) => {
  for (const seed of SEEDS) fn(gen(ctx(seed)), seed)
}

const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
function expectKnown(refs: (PhraseRef | undefined)[]) {
  for (const p of refs.flatMap(ids)) expect(KNOWN.has(p), p).toBe(true)
}

const group = (o: PickOption) => (o as { group: ObjectGroup }).group
const label = (o: PickOption) => (o as { label: string }).label
const MINUS = '−'

/** Evaluates `a + b = ?`-style expressions, with at most one `?`; returns the value of `?`. */
function solveExpr(expr: string): number {
  const m = /^(\S+) ([+−]) (\S+) = (\S+)$/.exec(expr)!
  const [x, op, y, z] = [m[1]!, m[2]!, m[3]!, m[4]!]
  const f = (a: number, b: number) => (op === '+' ? a + b : a - b)
  if (z === '?') return f(+x, +y)
  if (x === '?') return op === '+' ? +z - +y : +z + +y
  return op === '+' ? +z - +x : +x - +z
}

function expectPick(q: PickQ, options: number) {
  const optionIds = q.options.map(o => o.id)
  expect(q.options).toHaveLength(options)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  expectKnown([q.say, q.instruction, q.hint, ...q.options.map(o => ('say' in o ? o.say : undefined))])
}

/** Objects options never share a count, and the answer is the option with the right count. */
function expectDistinctCounts(q: PickQ) {
  const counts = q.options.map(o => group(o).count)
  expect(new Set(counts).size).toBe(counts.length)
}

/* ---------- 1. count to 10 ---------- */

describe('how many', () => {
  it('shows 1–10 objects, answer is the count, 4 distinct numbers in 1–10', () => {
    each(c => howManyQuestion(c, THINGS), q => {
      expectPick(q, 4)
      const g = q.prompt.objects![0]!
      expect(q.prompt.objects).toHaveLength(1)
      expect(g.count).toBeGreaterThanOrEqual(1)
      expect(g.count).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(String(g.count))
      expect(q.itemKey).toBe(`count:${g.count}`)
      expect(countAccepts(q.itemKey)).toBe(true)
      if (g.layout === 'dice') expect(g.count).toBeLessThanOrEqual(6)
      for (const o of q.options) {
        expect(+label(o)).toBeGreaterThanOrEqual(1)
        expect(+label(o)).toBeLessThanOrEqual(10)
      }
      expect(THINGS.map(t => t.emoji)).toContain(g.emoji)
    })
  })
  it('uses all three layouts across seeds and offers ±1 first', () => {
    const layouts = new Set<string>()
    for (const seed of SEEDS) {
      const q = howManyQuestion(ctx(seed, [], 'count:5'), THINGS)
      layouts.add(q.prompt.objects![0]!.layout!)
      const wrong = q.options.filter(o => o.id !== '5').map(label)
      expect(wrong).toEqual(expect.arrayContaining(['4', '6']))
    }
    expect(layouts).toEqual(new Set(['row', 'dice', 'scatter']))
  })
  it('honors review and avoid', () => {
    expect(howManyQuestion(ctx(1, [], 'count:7'), THINGS).itemKey).toBe('count:7')
    const avoid = Array.from({ length: 9 }, (_, i) => `count:${i + 1}`)
    for (const seed of SEEDS) expect(howManyQuestion(ctx(seed, avoid), THINGS).itemKey).toBe('count:10')
  })
})

describe('show me', () => {
  it('asks for 1–10 with a basket that holds 10', () => {
    each(c => showMeQuestion(c, THINGS), q => {
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(q.max)
      expect(q.show).toBe(String(q.answer))
      expect(q.say).toEqual([M.showMe, ...numberPhrase(q.answer)])
      expect(q.itemKey).toBe(`count:${q.answer}`)
      expectKnown([q.say, q.instruction])
    })
    expect(showMeQuestion(ctx(2, [], 'count:4'), THINGS).answer).toBe(4)
  })
})

/* ---------- 2. numerals ---------- */

describe('hear number', () => {
  it('speaks the number; 4 distinct digits 0–10 without a 🔊; look-alikes included', () => {
    each(c => hearNumberQuestion(c), q => {
      expectPick(q, 4)
      const n = +q.answer
      expect(q.say).toEqual([M.hearNumber, ...numberPhrase(n)])
      expect(hearNumberAccepts(q.itemKey)).toBe(true)
      for (const o of q.options) {
        expect(o.kind).toBe('number')
        expect('say' in o).toBe(false)
        expect(+label(o)).toBeGreaterThanOrEqual(0)
        expect(+label(o)).toBeLessThanOrEqual(10)
      }
      for (const alike of LOOK_ALIKE[n] ?? []) expect(q.options.map(o => +label(o))).toContain(alike)
    })
  })
  it('covers all of 0–10 across seeds and honors review', () => {
    expect(new Set(SEEDS.map(s => hearNumberQuestion(ctx(s)).answer)).size).toBe(11)
    expect(hearNumberQuestion(ctx(3, [], 'num:0')).answer).toBe('0')
  })
})

describe('match', () => {
  it('numeral prompt, 3 pictures with different counts, one equal to the numeral', () => {
    each(c => matchQuestion(c, THINGS), q => {
      expectPick(q, 3)
      expectDistinctCounts(q)
      const n = +q.prompt.expr!
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(10)
      expect(q.answer).toBe(String(n))
      expect(group(q.options.find(o => o.id === q.answer)!).count).toBe(n)
      for (const o of q.options) {
        expect(group(o).count).toBe(+o.id)
        if (group(o).layout === 'dice') expect(group(o).count).toBeLessThanOrEqual(6)
      }
      expect(matchAccepts(q.itemKey)).toBe(true)
      expect(new Set(q.options.map(o => group(o).emoji)).size).toBe(1)
    })
  })
})

describe('domino', () => {
  it('dice prompt 1–6; the right option has the same count in a different layout; others differ', () => {
    each(c => dominoQuestion(c), q => {
      expectPick(q, 3)
      expectDistinctCounts(q)
      const p = q.prompt.objects![0]!
      expect(p.layout).toBe('dice')
      expect(p.emoji).toBe(DOMINO_DOT)
      expect(p.count).toBeGreaterThanOrEqual(1)
      expect(p.count).toBeLessThanOrEqual(6)
      expect(q.answer).toBe(String(p.count))
      for (const o of q.options) {
        expect(group(o).layout).not.toBe('dice')
        expect(group(o).emoji).toBe(DOMINO_DOT)
        expect(group(o).count).toBeLessThanOrEqual(10)
        if (o.id !== q.answer) expect(group(o).count).not.toBe(p.count)
      }
      expect(dominoAccepts(q.itemKey)).toBe(true)
    })
  })
})

/* ---------- 3. compare ---------- */

describe('more / fewer', () => {
  it('two groups, never equal, answer is the larger or smaller as asked', () => {
    const asked = new Set<string>()
    each(c => moreLessQuestion(c, THINGS), q => {
      expectPick(q, 2)
      expectDistinctCounts(q)
      const [a, b] = q.options.map(o => group(o).count) as [number, number]
      expect(a).not.toBe(b)
      expect(Math.min(a, b)).toBeGreaterThanOrEqual(1)
      expect(Math.max(a, b)).toBeLessThanOrEqual(10)
      asked.add(q.instruction)
      const chosen = group(q.options.find(o => o.id === q.answer)!).count
      expect(chosen).toBe(q.instruction === M.more ? Math.max(a, b) : Math.min(a, b))
      expect(new Set(q.options.map(o => group(o).layout)).size).toBe(1)
      expect(compareAccepts(q.itemKey)).toBe(true)
    })
    expect(asked).toEqual(new Set([M.more, M.fewer]))
  })
  it('honors review', () => {
    expect(moreLessQuestion(ctx(4, [], 'cmp:3:8'), THINGS).itemKey).toBe('cmp:3:8')
  })
})

describe('most', () => {
  it('three groups of one kind with different counts; answer is the largest', () => {
    each(c => mostQuestion(c, THINGS), q => {
      expectPick(q, 3)
      expectDistinctCounts(q)
      const counts = q.options.map(o => group(o).count)
      counts.forEach(n => {
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(10)
      })
      expect(group(q.options.find(o => o.id === q.answer)!).count).toBe(Math.max(...counts))
      expect(new Set(q.options.map(o => group(o).emoji)).size).toBe(1)
      expect(mostAccepts(q.itemKey)).toBe(true)
    })
    expect(mostQuestion(ctx(5, [], 'most:2:5:9'), THINGS).itemKey).toBe('most:2:5:9')
  })
})

/* ---------- 4. stories ---------- */

describe('join / separate', () => {
  it('numbers obey the rules, story fits the thing, say is composed per the template', () => {
    const kinds = new Set<string>()
    each(c => joinSeparateQuestion(c, THINGS, STORIES), q => {
      expectPick(q, 4)
      const say = ids(q.say)
      const start = say[0]!
      const story = STORIES.find(s => storyPart(s.id, 'start') === start)!
      kinds.add(story.kind)
      const objs = q.prompt.objects!
      const thing = THINGS.find(t => t.emoji === objs[0]!.emoji)!
      expect(story.things).toContain(thing.id)
      expect(q.instruction).toBe(M.story)
      expect(storyAccepts(q.itemKey)).toBe(true)
      let a: number, b: number, result: number
      if (story.kind === 'join') {
        expect(objs).toHaveLength(2)
        ;[a, b] = [objs[0]!.count, objs[1]!.count]
        result = a + b
        expect(result).toBeLessThanOrEqual(10)
        expect(objs[0]!.faded ?? 0).toBe(0)
      } else {
        expect(objs).toHaveLength(1)
        a = objs[0]!.count
        b = objs[0]!.faded!
        result = a - b
        expect(b).toBeLessThan(a)
        expect(a).toBeLessThanOrEqual(10)
      }
      expect(a).toBeGreaterThanOrEqual(2)
      expect(b).toBeGreaterThanOrEqual(2)
      expect(q.answer).toBe(String(result))
      expect(result).toBeGreaterThanOrEqual(1)
      expect(say).toEqual([
        storyPart(story.id, 'start'), ...numberPhrase(a), thingPhrase(thing.id), storyPart(story.id, 'middle'), ...numberPhrase(b), storyPart(story.id, 'end'),
      ])
      for (const o of q.options) {
        expect(+label(o)).toBeGreaterThanOrEqual(1)
        expect(+label(o)).toBeLessThanOrEqual(10)
      }
    })
    expect(kinds).toEqual(new Set(['join', 'separate']))
  })
  it('honors review (kind and numbers) and skips stories without a matching thing', () => {
    const q = joinSeparateQuestion(ctx(6, [], 'story:7-3'), THINGS, STORIES)
    expect(q.itemKey).toBe('story:7-3')
    expect(q.answer).toBe('4')
    const onlyBirds = [{ id: 'bird', emoji: '🐦' }]
    each(c => joinSeparateQuestion(c, onlyBirds, STORIES), qq => {
      expect(ids(qq.say)[0]).not.toBe(storyPart('s1', 'start'))
      expect(ids(qq.say)[0]).not.toBe(storyPart('j2', 'start'))
    })
  })
})

/* ---------- 5. count to 100 ---------- */

describe('next / before', () => {
  it('answer is ±1 within 1–100; the pad fits it', () => {
    const kinds = new Set<string>()
    each(c => nextBeforeQuestion(c), q => {
      const [kind, n] = q.itemKey.split(':') as [string, string]
      kinds.add(kind)
      expect(q.answer).toBe(kind === 'next' ? +n + 1 : +n - 1)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(100)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(q.prompt.expr).toBe(kind === 'next' ? `${n}, ?` : `?, ${n}`)
      expect(q.say).toEqual([kind === 'next' ? M.next : M.before, ...numberPhrase(+n)])
      expect(nextBeforeAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(kinds).toEqual(new Set(['next', 'before']))
  })
})

describe('skip count', () => {
  it('a sequence by 10, 5, 2 or −2 with one gap; the answer fills it; stays within 0–100', () => {
    const steps = new Set<string>()
    each(c => skipCountQuestion(c), q => {
      const [, step] = q.itemKey.split(':') as [string, string]
      steps.add(step)
      const parts = q.prompt.expr!.split(', ')
      expect(parts).toHaveLength(5)
      const gap = parts.indexOf('?')
      expect(gap).toBeGreaterThanOrEqual(1)
      expect(parts.filter(p => p === '?')).toHaveLength(1)
      const full = parts.map((p, i) => (i === gap ? q.answer : +p))
      for (let i = 1; i < 5; i++) expect(full[i]! - full[i - 1]!).toBe(+step)
      for (const v of full) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
      if (+step < 0) expect(full[0]).toBeLessThanOrEqual(50)
      expect(String(q.answer).length).toBeLessThanOrEqual(q.maxDigits)
      expect(skipCountAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(steps).toEqual(new Set(['10', '5', '2', '-2']))
  })
})

describe('who am I', () => {
  it('one more, one less, between — answers in 1–100', () => {
    const kinds = new Set<string>()
    each(c => whoAmIQuestion(c), q => {
      const [kind, ns] = q.itemKey.split(':') as [string, string]
      const n = +ns
      kinds.add(kind)
      expect(q.answer).toBe(kind === 'oneLess' ? n - 1 : n + 1)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.answer).toBeLessThanOrEqual(100)
      if (kind === 'between') expect(q.prompt.expr).toBe(`${n}, ?, ${n + 2}`)
      else expect(solveExpr(`${n} ${kind === 'oneMore' ? '+' : MINUS} 1 = ?`)).toBe(q.answer)
      expect(whoAmIAccepts(q.itemKey)).toBe(true)
      expect(q.maxDigits).toBe(3)
      expectKnown([q.say, q.instruction])
    })
    expect(kinds).toEqual(new Set(['oneMore', 'oneLess', 'between']))
  })
})

/* ---------- 6. number line ---------- */

describe('place', () => {
  it('target inside the line, off the labels; tolerance exact on 0–20, ±3 on 0–100', () => {
    const maxes = new Set<number>()
    each(c => placeQuestion(c), q => {
      maxes.add(q.line.max)
      expect(q.target).toBeGreaterThan(q.line.min)
      expect(q.target).toBeLessThan(q.line.max)
      expect(q.target % q.line.labelEvery).not.toBe(0)
      expect(q.answer).toBe(q.target)
      expect(q.tolerance).toBe(q.line.max === 100 ? 3 : 0)
      expect(q.say).toEqual([M.place, ...numberPhrase(q.target)])
      expect(placeAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
    expect(maxes).toEqual(new Set([10, 20, 100]))
  })
})

describe('which number', () => {
  it('a marked point on the line; 3 distinct numbers; the answer is the marked number', () => {
    each(c => whichNumberQuestion(c), q => {
      expectPick(q, 3)
      expect(q.answer).toBe(String(q.marked))
      expect(q.marked).toBeGreaterThan(q.line.min)
      expect(q.marked).toBeLessThan(q.line.max)
      expect(q.marked % q.line.labelEvery).not.toBe(0)
      for (const o of q.options) {
        expect(+label(o)).toBeGreaterThanOrEqual(0)
        expect(+label(o)).toBeLessThanOrEqual(q.line.max)
        if (q.line.max === 100) expect(+label(o) % 10).toBe(0)
      }
      expect(whichNumberAccepts(q.itemKey)).toBe(true)
    })
  })
})

describe('misplaced', () => {
  it('one of five labels is wrong; the answer is its index', () => {
    const maxes = new Set<number>()
    each(c => misplacedQuestion(c), q => {
      maxes.add(q.line.max)
      expect(q.labels).toHaveLength(5)
      const bad = q.labels.map((l, i) => (l.text !== String(l.at) ? i : -1)).filter(i => i >= 0)
      expect(bad).toEqual([q.answer])
      const texts = q.labels.map(l => l.text)
      expect(new Set(texts).size).toBe(5)
      for (const l of q.labels) {
        expect(l.at).toBeGreaterThan(q.line.min)
        expect(l.at).toBeLessThan(q.line.max)
        expect(+l.text).toBeGreaterThan(q.line.min)
        expect(+l.text).toBeLessThan(q.line.max)
      }
      const ats = q.labels.map(l => l.at)
      expect(ats).toEqual([...ats].sort((a, b) => a - b))
      expectKnown([q.say, q.instruction])
    })
    expect(maxes).toEqual(new Set([10, 20, 100]))
  })
})

/* ---------- 7. splits of 10 ---------- */

describe('hidden', () => {
  it('ten objects, 1–9 hidden under cups; answer is the number hidden', () => {
    each(c => hiddenQuestion(c, THINGS), q => {
      const g = q.prompt.objects![0]!
      expect(q.prompt.objects).toHaveLength(1)
      expect(g.count).toBe(10)
      expect(g.covered).toBeGreaterThanOrEqual(1)
      expect(g.covered).toBeLessThanOrEqual(9)
      expect(q.answer).toBe(g.covered)
      expect(q.itemKey).toBe(`hide:${10 - g.covered!}`)
      expect(hiddenAccepts(q.itemKey)).toBe(true)
      expect(q.maxDigits).toBe(2)
      expectKnown([q.say, q.instruction])
    })
  })
})

describe('all splits', () => {
  it('the board holds each split of 10 exactly once, every card pairs with exactly one other', () => {
    each(c => allSplitsQuestion(c), q => {
      expect(q.total).toBe(10)
      expect(q.cards).toHaveLength(12)
      expect([...q.cards].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10])
      // Each card x has a partner 10 − x: counts match (5 twice pairs with itself).
      for (const v of q.cards) expect(q.cards.filter(x => x === 10 - v)).toHaveLength(v === 5 ? 2 : 1)
      const splits = new Set(q.cards.map(v => Math.min(v, 10 - v)))
      expect([...splits].sort()).toEqual([0, 1, 2, 3, 4, 5])
      expect(q.itemKey).toBe(ALL_SPLITS_KEY)
      expect(allSplitsAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
  })
  it('shuffles the cards', () => {
    expect(new Set(SEEDS.map(s => allSplitsQuestion(ctx(s)).cards.join())).size).toBeGreaterThan(50)
  })
})

/* ---------- 8. within 20 ---------- */

function expectAid(q: PadQ) {
  const aid = q.aidLine!
  expect(aid.max).toBe(20)
  let at = aid.from
  expect(at).toBeGreaterThanOrEqual(0)
  for (const j of aid.jumps) {
    expect(j).not.toBe(0)
    at += j
    expect(at).toBeGreaterThanOrEqual(0)
    expect(at).toBeLessThanOrEqual(20)
  }
}

describe('solve', () => {
  it('exercise matches the answer; everything within 0–20; the aid stays on the line', () => {
    const ops = new Set<string>()
    each(c => solveQuestion(c), q => {
      expect(solveExpr(q.prompt.expr!)).toBe(q.answer)
      const nums = q.prompt.expr!.match(/\d+/g)!.map(Number)
      for (const v of [...nums, q.answer]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(20)
      }
      ops.add(q.prompt.expr!.includes('+') ? '+' : '-')
      expect(q.itemKey).toBe(`${nums[0]}${q.prompt.expr!.includes('+') ? '+' : '-'}${nums[1]}`)
      expect(solveAccepts(q.itemKey)).toBe(true)
      expect(q.maxDigits).toBe(2)
      expectAid(q)
      expectKnown([q.say, q.instruction])
    })
    expect(ops.size).toBe(2)
  })
  it('honors review and avoid', () => {
    expect(solveQuestion(ctx(7, [], '8+5')).prompt.expr).toBe('8 + 5 = ?')
    expect(solveQuestion(ctx(7, [], '13-6')).prompt.expr).toBe(`13 ${MINUS} 6 = ?`)
    for (const seed of SEEDS) expect(solveQuestion(ctx(seed, ['8+5'])).itemKey).not.toBe('8+5')
  })
  it('the aid breaks a trip across ten at ten', () => {
    const q = solveQuestion(ctx(1, [], '8+5'))
    expect(q.aidLine).toEqual({ max: 20, from: 8, jumps: [2, 3] })
    expect(solveQuestion(ctx(1, [], '13-6')).aidLine).toEqual({ max: 20, from: 13, jumps: [-3, -3] })
  })
})

describe('missing', () => {
  it('the blank is either operand; the answer completes the fact; all values within 0–20', () => {
    const blanks = new Set<string>()
    each(c => missingQuestion(c), q => {
      const expr = q.prompt.expr!
      expect(expr.split('?')).toHaveLength(2)
      blanks.add(expr.startsWith('?') ? 'first' : 'second')
      expect(solveExpr(expr)).toBe(q.answer)
      for (const v of [...expr.match(/\d+/g)!.map(Number), q.answer]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(20)
      }
      expect(missingAccepts(q.itemKey)).toBe(true)
      expectAid(q)
      expectKnown([q.say, q.instruction])
    })
    expect(blanks.size).toBe(2)
  })
  it('honors review', () => {
    for (const seed of SEEDS.slice(0, 20)) expect(missingQuestion(ctx(seed, [], '15-6')).itemKey).toBe('15-6')
  })
})

/* ---------- 9. tens ---------- */

describe('tens analogy', () => {
  it('whole tens to 100 with the unit analogy and coins', () => {
    each(c => tensQuestion(c, '🪙'), q => {
      const [analogy, task] = q.prompt.expr!.split('\n') as [string, string]
      const a = solveExpr(task)
      expect(a).toBe(q.answer)
      expect(solveExpr(analogy.replace(/ = (\d+)$/, ' = ?'))).toBe(q.answer / 10)
      expect(analogy.endsWith(`= ${q.answer / 10}`)).toBe(true)
      for (const v of task.match(/\d+/g)!.map(Number)) expect(v % 10).toBe(0)
      expect(q.answer % 10).toBe(0)
      expect(q.answer).toBeGreaterThanOrEqual(10)
      expect(q.answer).toBeLessThanOrEqual(100)
      const objs = q.prompt.objects!
      expect(objs[0]!.count).toBe(+task.split(' ')[0]! / 10)
      expect(tensAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction])
    })
  })
})

/* ---------- 10. money ---------- */

describe('pay', () => {
  it('price 1–20, coins 1/2/5/10, always payable exactly', () => {
    const prices = new Set<number>()
    each(c => payQuestion(c, SHOP), q => {
      prices.add(q.price)
      expect(q.answer).toBe(q.price)
      expect(q.price).toBeGreaterThanOrEqual(1)
      expect(q.price).toBeLessThanOrEqual(20)
      expect(q.coins).toEqual(SHOP_COINS)
      // Subset-sum over the offered coins (each may be used repeatedly).
      const reach = new Set([0])
      for (let t = 1; t <= q.price; t++) if (q.coins.some(k => reach.has(t - k))) reach.add(t)
      expect(reach.has(q.price)).toBe(true)
      expect(q.say).toEqual([M.pay, pricePhrase(q.price)])
      expect(SHOP.map(s => shopPhrase(s.id))).toContain(q.item.name)
      expect(payAccepts(q.itemKey)).toBe(true)
      expectKnown([q.say, q.instruction, q.item.name])
    })
    expect(prices.size).toBe(20)
  })
})

describe('change', () => {
  it('paid 10 or 20, price below it; answer is the difference', () => {
    const paids = new Set<number>()
    each(c => changeQuestion(c, SHOP), q => {
      const [paid, price] = q.prompt.expr!.match(/\d+/g)!.map(Number) as [number, number]
      paids.add(paid)
      expect([10, 20]).toContain(paid)
      expect(price).toBeGreaterThanOrEqual(1)
      expect(price).toBeLessThan(paid)
      expect(q.answer).toBe(paid - price)
      expect(solveExpr(q.prompt.expr!)).toBe(q.answer)
      expect(q.itemKey).toBe(`change:${paid}-${price}`)
      expect(changeAccepts(q.itemKey)).toBe(true)
      expect(q.aidLine!.from).toBe(price)
      expectAid(q)
      expect(q.aidLine!.from + q.aidLine!.jumps.reduce((s, j) => s + j, 0)).toBe(paid)
      expectKnown([q.say, q.instruction])
    })
    expect(paids).toEqual(new Set([10, 20]))
  })
})

/* ---------- shared behavior ---------- */

describe('purity', () => {
  it('the same seed gives the same question', () => {
    expect(solveQuestion(ctx(9))).toEqual(solveQuestion(ctx(9)))
    expect(howManyQuestion(ctx(9), THINGS)).toEqual(howManyQuestion(ctx(9), THINGS))
  })
  it('accepts reject foreign keys', () => {
    for (const acc of [countAccepts, hearNumberAccepts, matchAccepts, dominoAccepts, compareAccepts, mostAccepts, storyAccepts, nextBeforeAccepts,
      skipCountAccepts, whoAmIAccepts, placeAccepts, whichNumberAccepts, hiddenAccepts, allSplitsAccepts, solveAccepts, tensAccepts, payAccepts, changeAccepts])
      expect(acc('nonsense')).toBe(false)
    expect(dominoAccepts('num:7')).toBe(false)
    expect(solveAccepts('3+4')).toBe(false)
  })
})

describe('place: every target is reachable', () => {
  it('the marker can stop within tolerance of the target (regression: 0–100 snapped to tens)', () => {
    for (let seed = 0; seed < 400; seed++) {
      const q = placeQuestion(ctx(seed))
      const unit = q.line.snap ?? q.line.step
      const nearest = q.line.min + Math.round((q.target - q.line.min) / unit) * unit
      expect(Math.abs(nearest - q.target), `${q.target} on 0–${q.line.max}`).toBeLessThanOrEqual(q.tolerance)
    }
  })
})
