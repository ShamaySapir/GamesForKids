import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { ColumnGame } from './games-column'
import { M3 } from './ids'
import type { ColumnQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.column': 'column' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const add: ColumnQ = { itemKey: 'col:2890+3150', answer: 6040, say: 'x', instruction: M3.column, hint: M3.columnHint, a: 2890, b: 3150, op: '+' }
const sub: ColumnQ = { itemKey: 'col:5000-1', answer: 4999, say: 'x', instruction: M3.column, a: 5000, b: 1, op: '-' }
const setup = (q = add, aid = false) => {
  const onAttempt = vi.fn()
  render(<ColumnGame question={q} aid={aid} onAttempt={onAttempt} />)
  return onAttempt
}
const cells = () => [...document.querySelectorAll('.g3-res')].map(c => c.textContent)
const carries = () => [...document.querySelectorAll('.g3-carry')].map(c => c.textContent)
const key = (k: string) => userEvent.click(screen.getByRole('button', { name: k }))

describe('ColumnGame', () => {
  it('lays the exercise out left to right, with the digits in their columns', () => {
    setup()
    expect(document.querySelector('.g3-col')).toHaveAttribute('dir', 'ltr')
    expect([...document.querySelectorAll('.g3-num')].map(c => c.textContent).join('')).toBe('28903150')
    expect(cells()).toEqual(['', '', '', ''])
  })

  it('fills the result from the ones column leftward, and shows the carry once typed', async () => {
    setup()
    expect(document.querySelectorAll('.g3-res')[3]).toHaveClass('cur')
    await key('0')
    expect(cells()).toEqual(['', '', '', '0'])
    expect(document.querySelectorAll('.g3-res')[2]).toHaveClass('cur')
    expect(carries()).toEqual(['', '', '', ''])
    await key('4') // 9 + 5 = 14: carry into the hundreds
    expect(cells()).toEqual(['', '', '4', '0'])
    expect(carries()).toEqual(['', '1', '', ''])
  })

  it('shows a borrow after the column that needed it', async () => {
    setup(sub)
    await key('9')
    expect(carries().join('')).toBe('−1')
  })

  it('by keyboard: digits, Backspace and Enter; a wrong result keeps the digits, then a right one passes', async () => {
    const onAttempt = setup()
    await userEvent.keyboard('0150{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(cells().join('')).toBe('0510') // shown as written: the ones column is on the right
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}406{Enter}')
    expect(cells().join('')).toBe('6040')
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('accepts the right answer once, with the pad, and does not need leading zeros', async () => {
    const onAttempt = setup({ ...add, a: 5000, b: 4990, op: '-', answer: 10 })
    for (const k of ['0', '1']) await key(k)
    await key('✓')
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('with the aid on, highlights the current column with its digit sum and speaks the hint', async () => {
    setup(add, true)
    expect(say).toHaveBeenCalledWith(M3.columnHint)
    expect(document.querySelectorAll('.g3-num.hl')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('0 + 0 = 0')
    await key('0')
    expect(screen.getByRole('status')).toHaveTextContent('9 + 5 = 14')
  })
})

describe('ColumnGame with seven digits', () => {
  it('lays out seven columns without commas and solves a million', async () => {
    const q: ColumnQ = { itemKey: 'col:big', answer: 1000000, say: 'x', instruction: M3.column, a: 999999, b: 1, op: '+' }
    const onAttempt = setup(q)
    expect(document.querySelector('.g3-col')).toHaveClass('wide')
    expect([...document.querySelectorAll('.g3-num')].map(c => c.textContent).join('')).toBe('9999991')
    expect(document.querySelectorAll('.g3-res')).toHaveLength(7)
    expect(document.querySelector('.g3-col')?.textContent).not.toContain(',')
    await userEvent.keyboard('0000001{Enter}')
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('keeps the four-digit layout unchanged', () => {
    setup()
    expect(document.querySelector('.g3-col')).not.toHaveClass('wide')
  })
})
