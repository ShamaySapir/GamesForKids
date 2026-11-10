import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { FirstStepGame } from './games-tap'
import { M3 } from './ids'
import type { FirstStepQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.firstStep': 'first' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const plain: FirstStepQ = { itemKey: 'first:3+4x2', answer: 3, say: 'x', instruction: M3.firstStep, hint: M3.opsHint, tokens: ['3', '+', '4', '×', '2'] }
const paren: FirstStepQ = { ...plain, itemKey: 'first:(3+4)x2', answer: 2, tokens: ['(', '3', '+', '4', ')', '×', '2'] }
const setup = (q = plain, aid = false) => {
  const onAttempt = vi.fn()
  render(<FirstStepGame question={q} aid={aid} onAttempt={onAttempt} />)
  return onAttempt
}
const near = () => [...document.querySelectorAll('.g3-tok')].map((t, i) => (t.classList.contains('near') ? i : -1)).filter(i => i >= 0)

describe('FirstStepGame', () => {
  it('shows the exercise left to right with only the operators as buttons', () => {
    setup()
    expect(document.querySelector('.g3-expr')).toHaveAttribute('dir', 'ltr')
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['+', '×'])
  })

  it('a wrong tap is reported and disabled, then the right one passes', async () => {
    const onAttempt = setup()
    await userEvent.click(screen.getByRole('button', { name: '+' }))
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '×' }))
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('by keyboard: Tab to the operator and press Enter', async () => {
    const onAttempt = setup()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('hovering or focusing an operator highlights its two neighbours', async () => {
    setup()
    fireEvent.pointerEnter(screen.getByRole('button', { name: '×' }))
    expect(near()).toEqual([2, 4])
    fireEvent.pointerLeave(screen.getByRole('button', { name: '×' }))
    expect(near()).toEqual([])
    await userEvent.tab()
    expect(near()).toEqual([0, 2])
  })

  it('next to brackets it highlights the whole bracketed group', () => {
    setup(paren)
    fireEvent.pointerEnter(screen.getByRole('button', { name: '×' }))
    expect(near()).toEqual([0, 1, 2, 3, 4, 6])
    fireEvent.pointerEnter(screen.getByRole('button', { name: '+' }))
    expect(near()).toEqual([1, 3])
  })

  it('with the aid, tints the brackets and speaks the hint', () => {
    setup(paren, true)
    expect(say).toHaveBeenCalledWith(M3.opsHint)
    expect(document.querySelectorAll('.g3-tok.paren.aid')).toHaveLength(2)
  })
})
