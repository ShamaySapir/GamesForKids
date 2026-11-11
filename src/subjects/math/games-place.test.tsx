import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlaceValueGame } from './games-place'
import { M } from './ids'
import type { PlaceValueQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: {
    'math.q.build': 'build', 'math.ui.check': 'check', 'math.ui.reset': 'reset',
    'math.ui.tenths': 'tenths', 'math.ui.hundredths': 'hundredths', 'math.ui.thousandths': 'thousandths',
    'math.ui.thousands': 'K', 'math.ui.hundreds': 'H', 'math.ui.tens': 'T', 'math.ui.ones': 'O',
  },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const q = (over: Partial<PlaceValueQ> = {}): PlaceValueQ => ({
  itemKey: 'pv:347', answer: 347, say: 'x', instruction: M.build, show: '347', columns: 3, ...over,
})
const btn = (sign: '+' | '−', col: string) => screen.getByRole('button', { name: `${sign} ${col}` })
const pieces = (kind: string) => document.querySelectorAll(`.pv-${kind}`).length
const build = async (h: number, t: number, o: number) => {
  for (let i = 0; i < h; i++) await userEvent.click(btn('+', 'H'))
  for (let i = 0; i < t; i++) await userEvent.click(btn('+', 'T'))
  for (let i = 0; i < o; i++) await userEvent.click(btn('+', 'O'))
}

describe('PlaceValueGame', () => {
  it('shows the target left-to-right and the columns hundreds first', () => {
    render(<PlaceValueGame question={q()} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getByText('347')).toHaveAttribute('dir', 'ltr')
    const names = screen.getAllByRole('group').map(g => g.getAttribute('aria-label'))
    expect(names).toEqual(['H', 'T', 'O'])
    expect(document.querySelector('.pv-house')).toHaveAttribute('dir', 'ltr')
  })

  it('offers two columns when asked', () => {
    render(<PlaceValueGame question={q({ columns: 2, answer: 47, show: '47' })} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getAllByRole('group')).toHaveLength(2)
  })

  it('adds and removes pieces with + and −, between 0 and 9', async () => {
    render(<PlaceValueGame question={q()} aid={false} onAttempt={vi.fn()} />)
    await build(0, 0, 3)
    expect(pieces('one')).toBe(3)
    await userEvent.click(btn('−', 'O'))
    expect(pieces('one')).toBe(2)
    expect(btn('−', 'T')).toBeDisabled()
    await build(0, 0, 12)
    expect(pieces('one')).toBe(9)
    expect(btn('+', 'O')).toBeDisabled()
  })

  it('changes a column with the arrow keys', async () => {
    render(<PlaceValueGame question={q()} aid={false} onAttempt={vi.fn()} />)
    await userEvent.tab()
    expect(screen.getByRole('group', { name: 'H' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')
    expect(pieces('hundred')).toBe(1)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowUp}')
    expect(pieces('ten')).toBe(1)
  })

  it('never writes the running value as digits unless the aid is on', async () => {
    const { rerender } = render(<PlaceValueGame question={q({ show: '?' })} aid={false} onAttempt={vi.fn()} />)
    await build(2, 5, 7)
    expect(screen.queryByText(/\d/)).toBeNull()
    rerender(<PlaceValueGame question={q({ show: '?' })} aid={true} onAttempt={vi.fn()} />)
    expect(Array.from(document.querySelectorAll('.pv-count')).map(e => e.textContent)).toEqual(['2', '5', '7'])
  })

  it('accepts the right number once and locks', async () => {
    const onAttempt = vi.fn()
    render(<PlaceValueGame question={q()} aid={false} onAttempt={onAttempt} />)
    await build(3, 4, 7)
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    expect(btn('+', 'H')).toBeDisabled()
  })

  it('keeps the pieces after a wrong check and shakes', async () => {
    const onAttempt = vi.fn()
    render(<PlaceValueGame question={q()} aid={false} onAttempt={onAttempt} />)
    await build(3, 7, 4)
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledWith(false)
    expect(pieces('hundred')).toBe(3)
    expect(pieces('ten')).toBe(7)
    expect(document.querySelector('.pv-house')).toHaveClass('bad')
  })

  it('resets the house', async () => {
    render(<PlaceValueGame question={q()} aid={false} onAttempt={vi.fn()} />)
    await build(1, 1, 1)
    await userEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(pieces('one') + pieces('ten') + pieces('hundred')).toBe(0)
  })

  it('offers a thousands column first when asked for four columns', async () => {
    const onAttempt = vi.fn()
    render(<PlaceValueGame question={q({ columns: 4, answer: 3407, show: '3,407' })} aid={true} onAttempt={onAttempt} />)
    expect(screen.getAllByRole('group').map(g => g.getAttribute('aria-label'))).toEqual(['K', 'H', 'T', 'O'])
    for (let i = 0; i < 3; i++) await userEvent.click(btn('+', 'K'))
    for (let i = 0; i < 4; i++) await userEvent.click(btn('+', 'H'))
    for (let i = 0; i < 7; i++) await userEvent.click(btn('+', 'O'))
    expect(pieces('thousand')).toBe(3)
    expect(Array.from(document.querySelectorAll('.pv-count')).map(e => e.textContent)).toEqual(['3 × 1000', '4 × 100', '0 × 10', '7 × 1'])
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('counts thousands in the value, so 3 hundreds is not 3 thousands', async () => {
    const onAttempt = vi.fn()
    render(<PlaceValueGame question={q({ columns: 4, answer: 3000, show: '3000' })} aid={false} onAttempt={onAttempt} />)
    await build(3, 0, 0)
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledWith(false)
  })
})

describe('PlaceValueGame with decimals', () => {
  const dq = (over: Partial<PlaceValueQ> = {}): PlaceValueQ => ({
    itemKey: 'pv:3.05', answer: 3.05, say: 'x', instruction: M.build, show: '3.05', columns: 2, decimals: 2, ...over,
  })
  const check = () => userEvent.click(screen.getByRole('button', { name: 'check' }))

  it('adds the decimal columns after a point', () => {
    render(<PlaceValueGame question={dq()} aid={false} onAttempt={vi.fn()} />)
    const names = screen.getAllByRole('group').map(g => g.getAttribute('aria-label'))
    expect(names).toEqual(['T', 'O', 'tenths', 'hundredths'])
    expect(document.querySelectorAll('.pv-point')).toHaveLength(1)
  })

  it('builds 3.05 as 3 ones and 5 hundredths; 3.5 is a miss', async () => {
    const onAttempt = vi.fn()
    render(<PlaceValueGame question={dq()} aid={false} onAttempt={onAttempt} />)
    for (let i = 0; i < 3; i++) await userEvent.click(btn('+', 'O'))
    await userEvent.click(btn('+', 'tenths'))
    await check()
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    await userEvent.click(btn('−', 'tenths'))
    for (let i = 0; i < 5; i++) await userEvent.click(btn('+', 'hundredths'))
    await check()
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('three decimals add up exactly (0.307)', async () => {
    const onAttempt = vi.fn()
    render(<PlaceValueGame question={dq({ answer: 0.307, show: '0.307', decimals: 3 })} aid={false} onAttempt={onAttempt} />)
    for (let i = 0; i < 3; i++) await userEvent.click(btn('+', 'tenths'))
    for (let i = 0; i < 7; i++) await userEvent.click(btn('+', 'thousandths'))
    await check()
    expect(onAttempt.mock.calls).toEqual([[true]])
  })
})
