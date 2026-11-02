import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PairsBoardGame } from './games-pairs'
import { M } from './ids'
import type { PairsQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.allSplits': 'find' },
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))
afterEach(() => { cleanup(); vi.useRealTimers() })

// Cards in index order: 3 7 5 5 0 10 4 6 → pairs 3+7, 5+5, 0+10, 4+6
const q: PairsQ = { itemKey: 'splits-10', answer: null, say: M.allSplits, instruction: M.allSplits, total: 10, cards: [3, 7, 5, 5, 0, 10, 4, 6] }
const cardButtons = () => screen.getAllByRole<HTMLButtonElement>('button')
const card = (i: number) => cardButtons()[i] as HTMLButtonElement
const tap = async (i: number) => { await userEvent.click(card(i)) }
const setup = () => {
  const onAttempt = vi.fn()
  render(<PairsBoardGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}

describe('PairsBoardGame', () => {
  it('locks a correct pair and lists it as an equation', async () => {
    const onAttempt = setup()
    await tap(0)
    await tap(1)
    expect(screen.getByText('3 + 7 = 10')).toBeTruthy()
    expect(card(0).disabled).toBe(true)
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('reports a miss for a wrong pair and lets the cards be tried again', async () => {
    const onAttempt = setup()
    await tap(0)
    await tap(2)
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false)
    expect(card(0).className).toContain('bad')
    expect(screen.queryByText(/=/)).toBeNull()
    await act(async () => { await new Promise(r => setTimeout(r, 500)) })
    await tap(0)
    await tap(1)
    expect(screen.getByText('3 + 7 = 10')).toBeTruthy()
  })

  it('pairs the two 5s with each other but not one 5 with itself', async () => {
    const onAttempt = setup()
    await tap(2)
    await tap(2)
    expect(onAttempt).not.toHaveBeenCalled()
    expect(card(2).getAttribute('aria-pressed')).toBe('false')
    await tap(2)
    await tap(3)
    expect(screen.getByText('5 + 5 = 10')).toBeTruthy()
  })

  it('reports success exactly once when every pair is found, with keyboard only', async () => {
    const onAttempt = setup()
    for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7]] as const) {
      card(a).focus()
      await userEvent.keyboard('{Enter}')
      card(b).focus()
      await userEvent.keyboard('{Enter}')
    }
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText('0 + 10 = 10')).toBeTruthy()
  })
})
