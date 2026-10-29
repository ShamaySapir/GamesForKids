import { describe, expect, it } from 'vitest'
import { advance, attempt, startSession } from './session'
import { seeded } from './random'
import type { GameDef } from './types'

let n = 0
const game: GameDef = {
  id: 'test', title: 't', icon: 't', component: () => null,
  generate: () => ({ itemKey: `q${n++}`, answer: null, say: 'x' }),
}

describe('session', () => {
  it('tracks first-try answers and finishes after the round length', () => {
    const rng = seeded(1)
    let s = startSession(game, rng, [], 3)
    s = attempt(s, false)
    s = attempt(s, true)
    s = advance(s, game, rng, [])
    s = attempt(s, true)
    s = advance(s, game, rng, [])
    s = attempt(s, true)
    s = advance(s, game, rng, [])
    expect(s.done).toBe(true)
    expect(s.firstTry).toHaveLength(2)
    expect(s.missed).toHaveLength(1)
  })

  it('turns the aid on after two misses in a row', () => {
    let s = startSession(game, seeded(1), [], 3)
    s = attempt(attempt(s, false), false)
    expect(s.aid).toBe(true)
  })
})
