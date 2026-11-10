import { describe, expect, it } from 'vitest'
import { DIRS, compress, find, moves, oneEditApart, run, sameCell, shortest } from './program'
import { DEBUG, FOLLOW, LEVELS, REPEAT_LEVELS } from './content/boards'
import { MOVES, MOVE_NAMES, PATTERNS } from './content/patterns'
import { STORIES } from './content/stories'
import { C, movePhrase, otherPhrase, stepPhrase, wrongPhrase } from './ids'
import { phrases } from './phrases'
import type { Board, Cell, Dir, Program } from './types'

const unique = (xs: readonly string[]) => new Set(xs).size === xs.length
const count = (b: Board, ch: string) => b.rows.join('').split(ch).length - 1
const reaches = (b: Board, p: Program) => run(b, p).reachedGoal

/** Every shortest route from S to G (the ghost may pick any of them). */
function allShortest(b: Board): Dir[][] {
  const start = find(b, 'S')!
  const goal = find(b, 'G')!
  const step: Record<Dir, Cell> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
  const free = (r: number, c: number) => b.rows[r]?.[c] !== undefined && b.rows[r]![c] !== '#'
  const dist = new Map<string, number>([[start.join(), 0]])
  const queue: Cell[] = [start]
  for (let q = 0; q < queue.length; q++) {
    const at = queue[q]!
    for (const d of DIRS) {
      const next: Cell = [at[0] + step[d][0], at[1] + step[d][1]]
      if (free(next[0], next[1]) && !dist.has(next.join())) {
        dist.set(next.join(), dist.get(at.join())! + 1)
        queue.push(next)
      }
    }
  }
  const total = dist.get(goal.join())
  if (total === undefined) return []
  const out: Dir[][] = []
  const walk = (at: Cell, path: Dir[]) => {
    if (path.length === total) {
      if (sameCell(at, goal)) out.push(path)
      return
    }
    for (const d of DIRS) {
      const next: Cell = [at[0] + step[d][0], at[1] + step[d][1]]
      if (dist.get(next.join()) === path.length + 1) walk(next, [...path, d])
    }
  }
  walk(start, [])
  return out
}
const longestRun = (dirs: readonly Dir[]) => Math.max(...compress(dirs).map(c => (c.kind === 'repeat' ? c.times : 1)))

function checkShape(b: Board, size: number, goal: boolean) {
  expect(b.rows.length, b.id).toBe(size)
  for (const row of b.rows) {
    expect(row.length, b.id).toBe(size)
    expect(/^[.#SG]+$/.test(row), b.id).toBe(true)
  }
  expect(count(b, 'S'), b.id).toBe(1)
  expect(count(b, 'G'), b.id).toBe(goal ? 1 : 0)
}

describe('counts', () => {
  it('meets the minimums', () => {
    expect(STORIES.length).toBeGreaterThanOrEqual(10)
    expect(FOLLOW.length).toBeGreaterThanOrEqual(12)
    expect(LEVELS.length).toBeGreaterThanOrEqual(15)
    expect(DEBUG.length).toBeGreaterThanOrEqual(12)
    for (const k of ['turn', 'remove', 'add'] as const) expect(DEBUG.filter(d => d.bug === k).length).toBeGreaterThanOrEqual(3)
    expect(REPEAT_LEVELS.length).toBeGreaterThanOrEqual(12)
    expect(PATTERNS.length).toBeGreaterThanOrEqual(10)
  })
  it('ids are unique', () => {
    expect(unique(STORIES.map(s => s.id))).toBe(true)
    expect(unique(FOLLOW.map(f => f.id))).toBe(true)
    expect(unique(DEBUG.map(d => d.id))).toBe(true)
    expect(unique(PATTERNS.map(p => p.id))).toBe(true)
    const boards = [...FOLLOW.map(f => f.board), ...LEVELS.map(l => l.board), ...DEBUG.map(d => d.board), ...REPEAT_LEVELS.map(l => l.board)]
    expect(unique(boards.map(b => b.id))).toBe(true)
  })
})

describe('stories', () => {
  it('have 3-4 steps with distinct emoji and a valid wrong step', () => {
    for (const s of STORIES) {
      expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3)
      expect(s.steps.length, s.id).toBeLessThanOrEqual(4)
      expect(s.wrong.at, s.id).toBeGreaterThanOrEqual(0)
      expect(s.wrong.at, s.id).toBeLessThan(s.steps.length)
      const all = [...s.steps, s.wrong.step, ...s.notMissing]
      expect(unique(all.map(x => x.emoji)), `${s.id} emoji`).toBe(true)
      expect(unique(all.map(x => x.text)), `${s.id} text`).toBe(true)
      for (const x of all) {
        expect(x.emoji, s.id).not.toBe('')
        expect(x.text.split(' ').length, `${s.id}: ${x.text}`).toBeLessThanOrEqual(5)
      }
    }
  })
})

describe('stories: bugs and decoys', () => {
  it('spreads the bug position over 0..3, no index in more than 40% of the stories', () => {
    const at = STORIES.map(s => s.wrong.at)
    for (let i = 0; i < 4; i++) {
      expect(at.filter(x => x === i).length, `index ${i}`).toBeLessThanOrEqual(Math.floor(STORIES.length * 0.4))
      expect(at.includes(i), `index ${i} unused`).toBe(true)
    }
  })
  it('uses each decoy emoji in at most two stories, and a decoy is never a step of its own story', () => {
    const uses = new Map<string, number>()
    for (const s of STORIES) {
      for (const d of s.notMissing) {
        uses.set(d.emoji, (uses.get(d.emoji) ?? 0) + 1)
        expect(s.steps.some(x => x.emoji === d.emoji || x.text === d.text), `${s.id} decoy ${d.text}`).toBe(false)
        expect(s.wrong.step.emoji, s.id).not.toBe(d.emoji)
      }
      expect(s.notMissing[0].emoji, s.id).not.toBe(s.notMissing[1].emoji)
    }
    for (const [emoji, n] of uses) expect(n, `decoy ${emoji}`).toBeLessThanOrEqual(2)
  })
  it('gives the same pointed text to the same word everywhere (recordings are shared by identical text)', () => {
    const forms = new Map<string, Set<string>>()
    for (const text of Object.values(phrases)) {
      for (const word of text.split(/[\s.!?,]+/).filter(Boolean)) {
        const bare = word.replace(/[ְ-ּׁ-ׇ"]/g, '')
        forms.set(bare, (forms.get(bare) ?? new Set()).add(word.replace(/"/g, '')))
      }
    }
    const homographs = new Set(['למטה']) // לְמַטָּה (down) and לַמִּטָּה (to the bed)
    for (const [bare, set] of forms) if (!homographs.has(bare)) expect([...set], bare).toHaveLength(1)
  })
})

describe('follow', () => {
  it('boards are open 4x4 and programs stay on the board', () => {
    for (const f of FOLLOW) {
      checkShape(f.board, 4, false)
      expect(f.board.rows.join('')).not.toContain('#')
      expect(f.program.length, f.id).toBeGreaterThanOrEqual(2)
      expect(f.program.length, f.id).toBeLessThanOrEqual(4)
      const r = run(f.board, moves(f.program))
      expect(r.stoppedAt, f.id).toBeUndefined()
      expect(r.path.length, f.id).toBe(f.program.length + 1)
      expect(r.end, f.id).not.toEqual(find(f.board, 'S'))
    }
  })
  it('flipping any one arrow lands somewhere else', () => {
    for (const f of FOLLOW) {
      const end = run(f.board, moves(f.program)).end
      f.program.forEach((d, i) => {
        for (const x of DIRS.filter(y => y !== d)) {
          const p: Dir[] = f.program.map((y, j) => (j === i ? x : y))
          const r = run(f.board, moves(p))
          expect(r.stoppedAt !== undefined || r.end.join() !== end.join(), `${f.id} flip ${i}`).toBe(true)
        }
      })
    }
  })
})

describe('levels', () => {
  it('first six are open 4x4 (shortest 2-4), the rest 5x5 with walls (shortest 4-7), all solvable', () => {
    LEVELS.forEach((l, i) => {
      const sp = shortest(l.board)
      expect(sp, l.board.id).toBeDefined()
      expect(reaches(l.board, moves(sp ?? []))).toBe(true)
      if (i < 6) {
        checkShape(l.board, 4, true)
        expect(l.board.rows.join('')).not.toContain('#')
        expect(sp!.length).toBeGreaterThanOrEqual(2)
        expect(sp!.length).toBeLessThanOrEqual(4)
      } else {
        checkShape(l.board, 5, true)
        expect(l.board.rows.join('')).toContain('#')
        expect(sp!.length).toBeGreaterThanOrEqual(4)
        expect(sp!.length).toBeLessThanOrEqual(7)
      }
      expect(l.maxCards).toBeUndefined()
    })
  })
})

describe('debug', () => {
  it('programs fail and exactly the stated kind of edit fixes them', () => {
    for (const d of DEBUG) {
      checkShape(d.board, 5, true)
      expect(d.program.every(c => c.kind === 'move'), d.id).toBe(true)
      expect(reaches(d.board, d.program), `${d.id} buggy`).toBe(false)
      const dirs = d.program.map(c => (c.kind === 'move' ? c.dir : 'up' as Dir))
      const fixes = new Set<string>()
      const tryFix = (p: readonly Dir[]) => {
        const prog = moves(p)
        if (reaches(d.board, prog)) {
          expect(oneEditApart(d.program, prog), d.id).toBe(true)
          fixes.add(p.join())
        }
      }
      if (d.bug === 'turn') dirs.forEach((x, i) => DIRS.filter(y => y !== x).forEach(y => tryFix(dirs.map((z, j) => (j === i ? y : z)))))
      if (d.bug === 'remove') dirs.forEach((_, i) => tryFix(dirs.filter((_z, j) => j !== i)))
      if (d.bug === 'add') DIRS.forEach(y => tryFix([...dirs, y]))
      expect(fixes.size, `${d.id} ${d.bug} fixes`).toBe(1)
    }
  })
})

describe('debug paths', () => {
  it('the buggy run never passes over or stops on the goal', () => {
    const touching = DEBUG.filter(d => run(d.board, d.program).path.some(c => sameCell(c, find(d.board, 'G')!))).map(d => d.id)
    expect(touching).toEqual([])
  })
})

describe('repeat levels', () => {
  it('6x6, loops fit the card limit and plain moves do not', () => {
    for (const l of REPEAT_LEVELS) {
      checkShape(l.board, 6, true)
      const sp = shortest(l.board)
      expect(sp, l.board.id).toBeDefined()
      expect(l.maxCards, l.board.id).toBeGreaterThanOrEqual(3)
      expect(l.maxCards, l.board.id).toBeLessThanOrEqual(4)
      const loop = compress(sp!)
      expect(loop.length, l.board.id).toBeLessThanOrEqual(l.maxCards!)
      expect(sp!.length, l.board.id).toBeGreaterThan(l.maxCards!)
      expect(reaches(l.board, loop), l.board.id).toBe(true)
    }
  })
})

describe('repeat levels: routes', () => {
  it('some shortest route fits in maxCards with loops', () => {
    for (const l of REPEAT_LEVELS) {
      const best = Math.min(...allShortest(l.board).map(p => compress(p).length))
      expect(best, l.board.id).toBeLessThanOrEqual(l.maxCards!)
    }
  })
  it('walls matter: at least 4 boards need a detour, so the route is longer than the distance', () => {
    const detours = REPEAT_LEVELS.filter(l => {
      const [sr, sc] = find(l.board, 'S')!
      const [gr, gc] = find(l.board, 'G')!
      return shortest(l.board)!.length > Math.abs(sr - gr) + Math.abs(sc - gc)
    })
    expect(detours.length).toBeGreaterThanOrEqual(4)
  })
  it('at least 3 boards need a repeat of 5 or more', () => {
    const fives = REPEAT_LEVELS.filter(l => allShortest(l.board).some(p => longestRun(p) >= 5 && compress(p).length <= l.maxCards!))
    expect(fives.length).toBeGreaterThanOrEqual(3)
  })
})

describe('patterns', () => {
  it('units of 2-3 known moves, repeated 2-4 times, never periodic themselves', () => {
    for (const p of PATTERNS) {
      expect(p.unit.length, p.id).toBeGreaterThanOrEqual(2)
      expect(p.unit.length, p.id).toBeLessThanOrEqual(3)
      expect(p.times, p.id).toBeGreaterThanOrEqual(2)
      expect(p.times, p.id).toBeLessThanOrEqual(4)
      for (const m of p.unit) expect(MOVES[m], `${p.id} ${m}`).toBeDefined()
      const n = p.unit.length
      for (let k = 1; k < n; k++) {
        if (n % k === 0) expect(p.unit.every((m, i) => m === p.unit[i % k]), `${p.id} periodic`).toBe(false)
      }
    }
  })
  it('every move has a name', () => {
    for (const key of Object.values(MOVES)) expect(MOVE_NAMES[key], key).toBeTruthy()
  })
})

describe('phrases', () => {
  const need = (id: string) => expect((phrases[id] ?? '').trim(), id).not.toBe('')
  it('exist for every referenced ID', () => {
    for (const id of Object.values(C)) need(id)
    for (const s of STORIES) {
      s.steps.forEach((_, n) => need(stepPhrase(s.id, n)))
      need(wrongPhrase(s.id))
      need(otherPhrase(s.id, 0))
      need(otherPhrase(s.id, 1))
    }
    for (const key of Object.values(MOVES)) need(movePhrase(key))
  })
  it('are prefixed, pointed Hebrew', () => {
    for (const [id, text] of Object.entries(phrases)) {
      expect(id.startsWith('code.'), id).toBe(true)
      expect(/[א-ת]/.test(text), id).toBe(true)
      expect(/[ְ-ּ]/.test(text), `${id} has nikud`).toBe(true)
      expect(/[A-Za-z]/.test(text), id).toBe(false)
      expect(/[״“”׳‘’]/.test(text), `${id} uses a non-ASCII quote`).toBe(false)
    }
  })
})
