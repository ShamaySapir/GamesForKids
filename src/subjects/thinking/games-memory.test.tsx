import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerArt } from '../../ui/pick/art'
import { MemoryGame } from './games-memory'
import { T } from './ids'
import type { MemoryQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'think.q.memory': 'find pairs' },
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))
registerArt({ dog: ({ size }) => <svg width={size} height={size} data-art="dog" /> })
beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers() })

// 0:🍎 1:🍌 2:🍎 3:dog 4:🍌 5:dog
const q: MemoryQ = {
  itemKey: 'm', answer: null, say: T.memory, instruction: T.memory,
  cards: [
    { id: 'a', face: '🍎' }, { id: 'b', face: '🍌' }, { id: 'c', face: '🍎' },
    { id: 'd', face: { name: 'dog' } }, { id: 'e', face: '🍌' }, { id: 'f', face: { name: 'dog' } },
  ],
}
const card = (i: number) => screen.getAllByRole('button')[i] as HTMLButtonElement
const setup = () => {
  const onAttempt = vi.fn()
  render(<MemoryGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}

describe('MemoryGame', () => {
  it('starts face-down', () => {
    setup()
    expect(screen.getAllByRole('button')).toHaveLength(6)
    expect(screen.queryByText('🍎')).toBeNull()
  })

  it('keeps a matching pair open', () => {
    const onAttempt = setup()
    fireEvent.click(card(0))
    fireEvent.click(card(2))
    act(() => { vi.advanceTimersByTime(2000) })
    expect(card(0).getAttribute('aria-pressed')).toBe('true')
    expect(card(2).className).toContain('found')
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('flips a wrong pair back after a while and never reports a miss', () => {
    const onAttempt = setup()
    fireEvent.click(card(0))
    fireEvent.click(card(1))
    expect(card(1).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(card(3)) // third card is ignored while two are up
    expect(card(3).getAttribute('aria-pressed')).toBe('false')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(card(0).getAttribute('aria-pressed')).toBe('false')
    expect(card(1).getAttribute('aria-pressed')).toBe('false')
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('reports success exactly once when every pair is found, drawing art faces', () => {
    const onAttempt = setup()
    for (const [a, b] of [[0, 2], [1, 4], [3, 5]] as const) {
      fireEvent.click(card(a))
      fireEvent.click(card(b))
    }
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
    expect(document.querySelectorAll('[data-art="dog"]')).toHaveLength(2)
    fireEvent.click(card(0))
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('works by keyboard', () => {
    setup()
    card(0).focus()
    fireEvent.click(card(0))
    expect(card(0).getAttribute('aria-pressed')).toBe('true')
  })
})
