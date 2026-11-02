import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SymmetryGridGame } from './games-symgrid'
import { T } from './ids'
import type { SymGridQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'think.q.symGrid': 'mirror', 'think.ui.check': 'check', 'think.ui.reset': 'reset' },
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))
afterEach(cleanup)

// 3 rows x 4 cols: left half cols 0-1 given (0,0) (1,1) (2,0); mirror is (0,3) (1,2) (2,3)
const q: SymGridQ = {
  itemKey: 's', say: T.symGrid, instruction: T.symGrid, rows: 3, cols: 4, color: '--think',
  given: [[0, 0], [1, 1], [2, 0]], answer: [[0, 3], [1, 2], [2, 3]],
}
const cell = (r: number, c: number) => screen.getByRole<HTMLButtonElement>('button', { name: `${r + 1}, ${c + 1}` })
const setup = () => {
  const onAttempt = vi.fn()
  render(<SymmetryGridGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}

describe('SymmetryGridGame', () => {
  it('shows the given half as filled, non-interactive cells and only right cells as buttons', () => {
    setup()
    expect(document.querySelectorAll('.tk-sym-cell.given.on')).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /,/ })).toHaveLength(6)
  })

  it('accepts the mirrored cells', async () => {
    const onAttempt = setup()
    for (const [r, c] of q.answer) await userEvent.click(cell(r, c))
    await userEvent.click(screen.getByText('check'))
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('reports a miss for a wrong picture and keeps the cells', async () => {
    const onAttempt = setup()
    await userEvent.click(cell(0, 2))
    await userEvent.click(screen.getByText('check'))
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false)
    expect(cell(0, 2).getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('.tk-sym.bad')).not.toBeNull()
  })

  it('toggles a cell off again and resets', async () => {
    setup()
    await userEvent.click(cell(0, 2))
    await userEvent.click(cell(0, 2))
    expect(cell(0, 2).getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(cell(1, 3))
    await userEvent.click(screen.getByText('reset'))
    expect(cell(1, 3).getAttribute('aria-pressed')).toBe('false')
  })

  it('moves focus with arrow keys inside the right half and toggles with Space', async () => {
    const onAttempt = setup()
    cell(0, 2).focus()
    fireEvent.keyDown(cell(0, 2), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cell(0, 3))
    fireEvent.keyDown(cell(0, 3), { key: 'ArrowRight' }) // edge: stays
    expect(document.activeElement).toBe(cell(0, 3))
    fireEvent.keyDown(cell(0, 3), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cell(1, 3))
    fireEvent.keyDown(cell(1, 3), { key: 'ArrowLeft' })
    fireEvent.keyDown(cell(1, 2), { key: 'ArrowLeft' }) // cannot enter the given half
    expect(document.activeElement).toBe(cell(1, 2))
    await userEvent.keyboard(' ')
    expect(cell(1, 2).getAttribute('aria-pressed')).toBe('true')
    expect(onAttempt).not.toHaveBeenCalled()
  })
})
