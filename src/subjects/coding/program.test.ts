import { describe, expect, it } from 'vitest'
import { compress, expand, moves, oneEditApart, programKey, run, shortest } from './program'
import type { Board, Dir, Program } from './types'

const board = (rows: string[]): Board => ({ id: 't', rows })
const open4 = board(['S...', '....', '....', '...G'])
const walled = board(['S#..', '.#.#', '...G'])

/** Every program of up to n moves, to check `shortest` is minimal on small boards. */
function* allMoves(n: number): Generator<Dir[]> {
  if (n === 0) { yield []; return }
  for (const p of allMoves(n - 1)) for (const d of ['up', 'down', 'left', 'right'] as const) yield [...p, d]
}

describe('run', () => {
  it('walks one cell per move and reaches the goal', () => {
    const r = run(open4, moves(['right', 'right', 'right', 'down', 'down', 'down']))
    expect(r.reachedGoal).toBe(true)
    expect(r.path).toHaveLength(7)
    expect(r.end).toEqual([3, 3])
  })

  it('stops at a wall or the edge and names the card that bumped', () => {
    expect(run(walled, moves(['down', 'right', 'right']))).toMatchObject({ end: [1, 0], stoppedAt: 1, reachedGoal: false })
    expect(run(open4, moves(['up']))).toMatchObject({ end: [0, 0], stoppedAt: 0, path: [[0, 0]] })
  })

  it('expands repeat cards, keeping the card index for highlighting', () => {
    const p: Program = [{ kind: 'repeat', times: 3, body: ['right'] }, { kind: 'repeat', times: 3, body: ['down'] }]
    expect(expand(p).map(m => m.card)).toEqual([0, 0, 0, 1, 1, 1])
    expect(run(open4, p).reachedGoal).toBe(true)
  })

  it('ends away from the goal without stopping', () => {
    const r = run(open4, moves(['right']))
    expect(r.reachedGoal).toBe(false)
    expect(r.stoppedAt).toBeUndefined()
  })
})

describe('shortest', () => {
  it('finds a minimal route around walls', () => {
    for (const b of [open4, walled]) {
      const s = shortest(b)!
      expect(run(b, moves(s)).reachedGoal).toBe(true)
      for (let n = 0; n < s.length; n++) for (const p of allMoves(n)) expect(run(b, moves(p)).reachedGoal).toBe(false)
    }
  })

  it('is undefined when the goal is walled off', () => {
    expect(shortest(board(['S#G']))).toBeUndefined()
  })
})

describe('compress and edits', () => {
  it('turns runs into repeat cards', () => {
    expect(programKey(compress(['right', 'right', 'right', 'down', 'left', 'left']))).toBe('3(R)D2(L)')
  })

  it('tells programs one card apart', () => {
    const a = moves(['right', 'down', 'down'])
    expect(oneEditApart(a, moves(['right', 'right', 'down']))).toBe(true)
    expect(oneEditApart(a, moves(['right', 'down']))).toBe(true)
    expect(oneEditApart(a, moves(['right', 'down', 'down', 'left']))).toBe(true)
    expect(oneEditApart(a, moves(['left', 'up', 'down']))).toBe(false)
    expect(oneEditApart(a, a)).toBe(false)
  })
})
