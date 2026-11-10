import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import type { ArtRef, PickOption, PickQ } from '../../ui/pick/types'
import { registerCodingArt } from './art'
import {
  bugAccepts, bugQuestion, debugAccepts, debugQuestion, fewestTurnsRoute, followAccepts, followQuestion, loopAccepts, loopQuestion, programAccepts,
  programQuestion, repeatAccepts, repeatQuestion, stepsAccepts, stepsQuestion,
} from './generators'
import { C, movePhrase, otherPhrase, stepPhrase, wrongPhrase } from './ids'
import { FOLLOW as REAL_FOLLOW, LEVELS as REAL_LEVELS, REPEAT_LEVELS as REAL_REPEAT } from './content/boards'
import { compress, find, moves, run, sameCell, shortest } from './program'
import type { Board, Cell, DebugItem, Dir, FollowItem, Level, MovePattern, ProgramQ, Story } from './types'

/* ---------- fixtures ---------- */

const st = (emoji: string) => ({ emoji, text: '' })
const STORIES: Story[] = [
  { id: 'teeth', steps: [st('🪥'), st('🧴'), st('🦷'), st('🚰')], wrong: { at: 2, step: st('🍬') }, notMissing: [st('🚗'), st('🎈')] },
  { id: 'plant', steps: [st('🌰'), st('💧'), st('🌱')], wrong: { at: 1, step: st('🔥') }, notMissing: [st('📚'), st('🧸')] },
  { id: 'sandwich', steps: [st('🍞'), st('🧀'), st('🥪')], wrong: { at: 0, step: st('🍕') }, notMissing: [st('🏀'), st('🎵')] },
]
const FOLLOW: FollowItem[] = [
  { id: 'f1', board: { id: 'f1', rows: ['S...', '....', '....', '....'] }, program: ['right', 'right', 'down'] },
  { id: 'f2', board: { id: 'f2', rows: ['....', '....', '....', '...S'] }, program: ['up', 'up', 'left', 'left'] },
  { id: 'f3', board: { id: 'f3', rows: ['....', '.S..', '....', '....'] }, program: ['down', 'right'] },
]
const LEVELS: Level[] = [
  { board: { id: 'l1', rows: ['S...', '....', '....', '...G'] } },
  { board: { id: 'l2', rows: ['S.#..', '..#..', '.....', '#...G', '.....'] } },
  { board: { id: 'l3', rows: ['S#G', '...'] } },
  { board: { id: 'l4', rows: ['S#G'] } }, // unsolvable: must never be asked
]
const REPEAT_LEVELS: Level[] = [
  { board: { id: 'r1', rows: ['S.....', '......', '......', '......', '......', '.....G'] }, maxCards: 4 },
  { board: { id: 'r2', rows: ['S.....', '......', '......', '......', '......', '......'] }, maxCards: 1 }, // no goal: never asked
  { board: { id: 'r3', rows: ['......', '......', '......', '......', '......', 'S....G'] }, maxCards: 2 },
]
const DEBUGS: DebugItem[] = [
  { id: 'd1', board: LEVELS[0]!.board, bug: 'turn', program: moves(['right', 'right', 'up', 'down', 'down']) },
  { id: 'd2', board: LEVELS[0]!.board, bug: 'add', program: moves(['right', 'right', 'right', 'down', 'down']) },
  { id: 'd3', board: LEVELS[0]!.board, bug: 'remove', program: [{ kind: 'repeat', times: 3, body: ['right'] }, { kind: 'move', dir: 'left' }, ...moves(['down', 'down', 'down'])] },
]
const PATTERNS: MovePattern[] = [
  { id: 'p1', unit: ['👏', '👏', '🦶'], times: 3 },
  { id: 'p2', unit: ['🦘', '🔄'], times: 2 },
  { id: 'p3', unit: ['👏', '🦘'], times: 4 },
  { id: 'p4', unit: ['🦶', '🦶'], times: 2 }, // doubled unit: wrong cards must still differ from the dance
]

const KNOWN = new Set<string>([
  ...Object.values(C),
  ...STORIES.flatMap(s => [
    ...s.steps.map((_, n) => stepPhrase(s.id, n)), wrongPhrase(s.id), otherPhrase(s.id, 0), otherPhrase(s.id, 1),
  ]),
  ...['clap', 'jump'].map(movePhrase),
])

/* ---------- utilities ---------- */

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)
const each = <Q>(gen: (c: GenContext) => Q, fn: (q: Q, seed: number) => void) => {
  for (const seed of SEEDS) fn(gen(ctx(seed)), seed)
}
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const expectKnown = (refs: (PhraseRef | undefined)[]) => {
  for (const p of refs.flatMap(ids)) expect(KNOWN.has(p), p).toBe(true)
}
const artKey = (a: ArtRef) => JSON.stringify([a.name, Object.entries(a.props ?? {}).sort()])
const artOf = (o: PickOption) => (o as { art: ArtRef }).art

function expectPick(q: PickQ, options: number) {
  expect(q.options).toHaveLength(options)
  expect(new Set(q.options.map(o => o.id)).size).toBe(options)
  expect(q.options.filter(o => o.id === q.answer)).toHaveLength(1)
  expectKnown([q.say, q.instruction, q.hint, ...q.options.map(o => ('say' in o ? o.say : undefined))])
}

function expectBuild(q: ProgramQ, board: Board) {
  const dirs = fewestTurnsRoute(board)!
  expect(dirs).toHaveLength(shortest(board)!.length)
  const result = run(board, moves(dirs))
  expect(result.reachedGoal).toBe(true)
  expect(q.ghost).toEqual(result.path)
  expect(sameCell(q.ghost[0]!, find(board, 'S')!)).toBe(true)
  expect(sameCell(q.ghost.at(-1)!, find(board, 'G')!)).toBe(true)
  expect(q.palette).toContain('up')
  expectKnown([q.say, q.instruction, q.hint])
}

/** Every generator honors avoid (fresh items first) and review (that item if it can be asked). */
function expectAvoidAndReview<Q extends { itemKey: string }>(gen: (c: GenContext) => Q, keys: string[]) {
  for (const seed of SEEDS.slice(0, 60)) {
    const [first, ...rest] = keys
    expect(keys).toContain(gen(ctx(seed)).itemKey)
    expect(gen({ ...ctx(seed), avoid: new Set(rest) }).itemKey).toBe(first)
    expect(gen({ ...ctx(seed, keys), review: keys[1] }).itemKey).toBe(keys[1])
  }
}

/* ---------- tests ---------- */

describe('steps', () => {
  it('shuffles emoji tiles, never already in order; answer is the order', () => {
    each(c => stepsQuestion(c, STORIES), q => {
      const s = STORIES.find(x => x.id === q.itemKey)!
      expect(q.layout).toBe('units')
      expect(q.answer).toEqual(s.steps.map((_, n) => `${s.id}.${n}`))
      expect(q.tiles.map(t => t.id)).not.toEqual(q.answer)
      expect([...q.tiles.map(t => t.id)].sort()).toEqual([...q.answer].sort())
      for (const t of q.tiles) {
        const n = Number(t.id.split('.')[1])
        expect(t.text).toBe(s.steps[n]!.emoji)
        expect(t.say).toBe(stepPhrase(s.id, n))
      }
      expectKnown([q.say, q.instruction, ...q.tiles.map(t => t.say)])
      expect(q.instruction).toBe(C.steps)
    })
    expect(stepsAccepts('teeth')).toBe(true)
    expect(stepsAccepts('bug:teeth')).toBe(false)
  })
  it('honors avoid and review', () => {
    expectAvoidAndReview(c => stepsQuestion(c, STORIES), STORIES.map(s => s.id))
  })
})

describe('bug', () => {
  it('asks both variants with a reachable answer and distinct options', () => {
    const variants = new Set<string>()
    each(c => bugQuestion(c, STORIES), q => {
      const [kind, id] = q.itemKey.split(':') as ['bug' | 'missing', string]
      const s = STORIES.find(x => x.id === id)!
      variants.add(kind)
      expect(bugAccepts(q.itemKey)).toBe(true)
      if (kind === 'bug') {
        expectPick(q, s.steps.length)
        expect(q.instruction).toBe(C.bug)
        expect(q.answer).toBe(`s${s.wrong.at}`)
        const emojis = q.options.map(o => (o as { emoji: string }).emoji)
        expect(emojis[s.wrong.at]).toBe(s.wrong.step.emoji)
        expect(emojis.filter((_, n) => n !== s.wrong.at)).toEqual(s.steps.filter((_, n) => n !== s.wrong.at).map(x => x.emoji))
        expect(new Set(emojis).size).toBe(emojis.length)
        expect(q.options.find(o => o.id === q.answer)).toMatchObject({ say: wrongPhrase(s.id) })
      } else {
        expectPick(q, 3)
        expect(q.instruction).toBe(C.missing)
        const strip = q.prompt.art![0]!
        expect(strip.name).toBe('code-steps')
        const gap = strip.props!.gap as number
        expect(strip.props!.steps).toBe(s.steps.map(x => x.emoji).join('|'))
        const answer = q.options.find(o => o.id === q.answer) as { emoji: string; say: string }
        expect(answer.emoji).toBe(s.steps[gap]!.emoji)
        expect(answer.say).toBe(stepPhrase(s.id, gap))
        const emojis = q.options.map(o => (o as { emoji: string }).emoji)
        expect(new Set(emojis).size).toBe(3)
      }
    })
    expect(variants).toEqual(new Set(['bug', 'missing']))
    expect(bugAccepts('follow:f1')).toBe(false)
  })
  it('puts the answer in different slots in the missing variant', () => {
    const slots = new Set<string>()
    each(c => bugQuestion(c, STORIES), q => {
      if (q.itemKey.startsWith('missing:')) slots.add(q.answer)
    })
    expect(slots.size).toBe(3)
  })
  it('honors avoid and review', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const kind = bugQuestion(ctx(seed), STORIES).itemKey.split(':')[0]!
      const keys = STORIES.map(s => `${kind}:${s.id}`)
      expect(bugQuestion(ctx(seed, keys.slice(1)), STORIES).itemKey).toBe(keys[0])
      expect(bugQuestion(ctx(seed, keys, keys[2]), STORIES).itemKey).toBe(keys[2])
    }
  })
})

describe('follow', () => {
  it('marks the true end among two distinct wrong ends, all on the board', () => {
    each(c => followQuestion(c, FOLLOW), q => {
      const item = FOLLOW.find(f => `follow:${f.id}` === q.itemKey)!
      expectPick(q, 3)
      expect(q.instruction).toBe(C.follow)
      expect(q.hint).toBe(C.hintFollow)
      const rows = item.board.rows.join('|')
      expect(q.prompt.art![0]!.props).toMatchObject({ rows, plain: true })
      expect(q.prompt.art![0]!.props!.program).toHaveLength(item.program.length)
      const end = run(item.board, moves(item.program)).end
      const marks = q.options.map(o => {
        const art = artOf(o)
        expect(art.name).toBe('code-board')
        expect(art.props!.rows).toBe(rows)
        expect(o).not.toHaveProperty('say')
        const [r, c] = String(art.props!.mark).split(',').map(Number) as [number, number]
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThan(item.board.rows.length)
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThan(item.board.rows[0]!.length)
        return [r, c] as Cell
      })
      expect(new Set(marks.map(String)).size).toBe(3)
      expect(sameCell(marks[q.options.findIndex(o => o.id === q.answer)]!, end)).toBe(true)
      expect(new Set(q.options.map(o => artKey(artOf(o)))).size).toBe(3)
    })
    expect(followAccepts('follow:f1')).toBe(true)
  })
  it('every real item yields two plausible wrong ends from runs that did not stop', () => {
    for (const item of REAL_FOLLOW) {
      for (const seed of SEEDS.slice(0, 20)) {
        const q = followQuestion(ctx(seed, [], `follow:${item.id}`), REAL_FOLLOW)
        expect(q.itemKey).toBe(`follow:${item.id}`)
        const ends = q.options.map(o => String(artOf(o).props!.mark))
        expect(new Set(ends).size).toBe(3)
        const answer = run(item.board, moves(item.program)).end
        expect(ends[q.options.findIndex(o => o.id === q.answer)]).toBe(`${answer[0]},${answer[1]}`)
      }
    }
  })
  it('honors avoid and review', () => {
    expectAvoidAndReview(c => followQuestion(c, FOLLOW), FOLLOW.map(f => `follow:${f.id}`))
  })
})

describe('program', () => {
  it('has a solvable board, a shortest-path ghost and the four arrows', () => {
    each(c => programQuestion(c, LEVELS), q => {
      expect(q.itemKey).not.toBe('program:l4')
      expect(q.palette).toEqual(['up', 'down', 'left', 'right'])
      expect(q.start).toBeUndefined()
      expect(q.oneEdit).toBeUndefined()
      expect(q.hint).toBe(C.hintPath)
      expect(q.instruction).toBe(C.program)
      expectBuild(q, q.board)
    })
    expect(programAccepts('program:l1')).toBe(true)
  })
  it('honors avoid and review', () => {
    expectAvoidAndReview(c => programQuestion(c, LEVELS), ['program:l1', 'program:l2', 'program:l3'])
  })
})

describe('debug', () => {
  it('starts from a buggy program that does not reach the goal', () => {
    each(c => debugQuestion(c, DEBUGS), q => {
      const item = DEBUGS.find(d => `debug:${d.id}` === q.itemKey)!
      expect(q.oneEdit).toBe(true)
      expect(q.start).toEqual(item.program)
      expect(run(q.board, q.start!).reachedGoal).toBe(false)
      expect(q.instruction).toBe(C.debug)
      expect(q.hint).toBe(C.hintDebug)
      expect(q.palette.includes('repeat')).toBe(item.program.some(c => c.kind === 'repeat'))
      expectBuild(q, q.board)
    })
    expect(debugAccepts('debug:d1')).toBe(true)
  })
  it('honors avoid and review', () => {
    expectAvoidAndReview(c => debugQuestion(c, DEBUGS), DEBUGS.map(d => `debug:${d.id}`))
  })
})

describe('loop', () => {
  it('offers the right loop, a wrong count and a wrong unit, all different', () => {
    each(c => loopQuestion(c, PATTERNS), q => {
      const p = PATTERNS.find(x => `loop:${x.id}` === q.itemKey)!
      expectPick(q, 3)
      expect(q.instruction).toBe(C.loop)
      const dance = q.prompt.art![0]!
      expect(dance).toMatchObject({ name: 'code-dance', props: { unit: p.unit.join('|'), times: p.times } })
      const truth = Array.from({ length: p.times }, () => p.unit).flat().join('')
      const expanded = q.options.map(o => {
        const a = artOf(o)
        expect(a.name).toBe('code-loop')
        expect(o).not.toHaveProperty('say')
        const unit = String(a.props!.unit).split('|')
        return { text: Array.from({ length: Number(a.props!.times) }, () => unit).flat().join(''), times: Number(a.props!.times), unit: unit.join('|') }
      })
      const right = expanded[q.options.findIndex(o => o.id === q.answer)]!
      expect(right).toMatchObject({ text: truth, times: p.times, unit: p.unit.join('|') })
      const wrong = expanded.filter(e => e !== right)
      for (const w of wrong) {
        expect(w.text).not.toBe(truth)
        expect(w.times).toBeGreaterThanOrEqual(2)
      }
      expect(wrong.filter(w => w.unit === right.unit)).toHaveLength(1)
      expect(wrong.filter(w => w.times === right.times)).toHaveLength(1)
    })
    expect(loopAccepts('loop:p1')).toBe(true)
  })
  it('honors avoid and review', () => {
    expectAvoidAndReview(c => loopQuestion(c, PATTERNS), PATTERNS.map(p => `loop:${p.id}`))
  })
})

describe('repeat', () => {
  it('only asks levels whose shortest route fits in maxCards with repeat cards', () => {
    each(c => repeatQuestion(c, REPEAT_LEVELS), q => {
      expect(q.itemKey).not.toBe('repeat:r2')
      expect(q.palette).toEqual(['up', 'down', 'left', 'right', 'repeat'])
      expect(q.hint).toBe(C.hintRepeat)
      expect(q.instruction).toBe(C.repeat)
      expectBuild(q, q.board)
      const level = REPEAT_LEVELS.find(l => l.board.id === q.board.id)!
      expect(q.maxCards).toBe(level.maxCards)
      const compact = compress(fewestTurnsRoute(q.board)!)
      expect(compact.length).toBeLessThanOrEqual(q.maxCards!)
      expect(run(q.board, compact).reachedGoal).toBe(true)
      expect(fewestTurnsRoute(q.board)!.length).toBeGreaterThan(q.maxCards!)
    })
    expect(repeatAccepts('repeat:r1')).toBe(true)
  })
  it('honors avoid and review', () => {
    expectAvoidAndReview(c => repeatQuestion(c, REPEAT_LEVELS), ['repeat:r1', 'repeat:r3'])
  })
})

describe('art', () => {
  registerCodingArt()
  const rows = 'S...|....|....|....'
  const cases: ArtRef[] = [
    { name: 'code-board', props: { rows, program: '→→↓', plain: true } },
    { name: 'code-board', props: { rows, mark: '2,3', plain: true } },
    { name: 'code-board', props: { rows: 'S.#|..G' } },
    { name: 'code-steps', props: { steps: '🪥|🧴|🦷', gap: 1 } },
    { name: 'code-steps', props: { steps: '🪥|🧴|🦷' } },
    { name: 'code-dance', props: { unit: '👏|🦶', times: 3 } },
    { name: 'code-loop', props: { unit: '👏|🦶', times: 3 } },
  ]
  it.each(cases)('draws $name', a => {
    const html = renderToStaticMarkup(createElement(ArtView, { art: a, size: 140 }))
    expect(html.length).toBeGreaterThan(20)
    expect(html).not.toContain('pk-art-missing')
  })
})

describe('fewestTurnsRoute', () => {
  /** Every shortest route of a board, by depth-first search. */
  function allShortest(board: Board): Dir[][] {
    const len = shortest(board)!.length
    const goal = find(board, 'G')!
    const out: Dir[][] = []
    const step = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] } as const
    const walk = (at: Cell, dirs: Dir[]) => {
      if (dirs.length === len) {
        if (sameCell(at, goal)) out.push([...dirs])
        return
      }
      for (const d of ['up', 'down', 'left', 'right'] as const) {
        const n: Cell = [at[0] + step[d][0], at[1] + step[d][1]]
        if (run(board, moves([...dirs, d])).stoppedAt === undefined) walk(n, [...dirs, d])
      }
    }
    walk(find(board, 'S')!, [])
    return out
  }
  it('is a shortest route with no more straight runs than any other shortest route', () => {
    for (const l of [...REAL_LEVELS, ...REAL_REPEAT, ...LEVELS]) {
      const route = fewestTurnsRoute(l.board)
      if (!route) continue
      expect(run(l.board, moves(route)).reachedGoal, l.board.id).toBe(true)
      const fewest = Math.min(...allShortest(l.board).map(r => compress(r).length))
      expect(compress(route).length, l.board.id).toBe(fewest)
    }
  })
})
