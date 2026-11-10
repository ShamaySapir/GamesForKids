import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { GridAreaGame } from './games-grid'
import { M3 } from './ids'
import type { GridAreaQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.area': 'area', 'math.q.countSquares': 'count', 'math.hint.area': 'hint' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(() => { cleanup(); vi.mocked(say).mockClear() })

const rect = (over: Partial<GridAreaQ> = {}): GridAreaQ => ({
  itemKey: 'area:4x6', answer: 24, say: 'x', instruction: M3.area, hint: M3.areaHint, cols: 6, rows: 4,
  rects: [[0, 0, 6, 4]], mode: 'sides', ...over,
})
// An L: 4 wide by 2 tall on top, plus 2 wide by 2 tall below its left end = 12 squares.
const ell = (over: Partial<GridAreaQ> = {}): GridAreaQ => rect({ itemKey: 'areaL:x', answer: 12, cols: 4, rows: 4, rects: [[0, 0, 4, 2], [0, 2, 2, 2]], mode: 'count', ...over })

const cells = () => document.querySelectorAll('.g3a-cell').length
const sides = () => Array.from(document.querySelectorAll('.g3a-side')).map(t => t.textContent)
const rowCounts = () => Array.from(document.querySelectorAll('.g3a-rowcount')).map(t => t.textContent)
const key = (k: string) => screen.getByRole('button', { name: k })
const answer = () => screen.getByRole('status')

describe('GridAreaGame', () => {
  it('count mode draws a square for every covered cell, only inside the shape', () => {
    render(<GridAreaGame question={ell()} aid={false} onAttempt={vi.fn()} />)
    expect(cells()).toBe(12)
    expect(sides()).toEqual([])
    expect(document.querySelector('.g3a-svg')).toHaveAttribute('role', 'img')
  })

  it('sides mode shows only the outline and the two side lengths until the aid is on', () => {
    const { rerender } = render(<GridAreaGame question={rect()} aid={false} onAttempt={vi.fn()} />)
    expect(cells()).toBe(0)
    expect(sides()).toEqual(['6', '4'])
    expect(rowCounts()).toEqual([])
    rerender(<GridAreaGame question={rect()} aid={true} onAttempt={vi.fn()} />)
    expect(cells()).toBe(24)
    expect(rowCounts()).toEqual(['6', '6', '6', '6'])
  })

  it('draws the outline of an L as one closed edge around 12 squares', () => {
    render(<GridAreaGame question={ell()} aid={true} onAttempt={vi.fn()} />)
    // Perimeter of the L: 4+2+2+2+2+4 = 16 unit sides.
    const d = document.querySelector('.g3a-edge')!.getAttribute('d')!
    expect(d.match(/M/g)).toHaveLength(16)
    expect(rowCounts()).toEqual(['4', '4', '2', '2'])
  })

  it('speaks the hint once when the aid turns on, and never when it is off', () => {
    const { rerender } = render(<GridAreaGame question={rect()} aid={false} onAttempt={vi.fn()} />)
    expect(say).not.toHaveBeenCalled()
    rerender(<GridAreaGame question={rect()} aid={true} onAttempt={vi.fn()} />)
    rerender(<GridAreaGame question={rect()} aid={true} onAttempt={vi.fn()} />)
    expect(say).toHaveBeenCalledTimes(1)
  })

  it('shows the unit next to the answer and the answer left to right', () => {
    render(<GridAreaGame question={rect()} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getByText('סמ״ר')).toBeInTheDocument()
    expect(answer()).toHaveAttribute('dir', 'ltr')
  })

  it('takes digits from the pad, ⌫ and ✓, and accepts the right area once', async () => {
    const onAttempt = vi.fn()
    render(<GridAreaGame question={rect()} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(key('2'))
    await userEvent.click(key('5'))
    await userEvent.click(key('⌫'))
    await userEvent.click(key('4'))
    expect(answer()).toHaveTextContent('24')
    await userEvent.click(key('✓'))
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    expect(key('1')).toBeDisabled()
  })

  it('works from the keyboard: digits, Backspace and Enter', async () => {
    const onAttempt = vi.fn()
    render(<GridAreaGame question={rect()} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard('29{Backspace}4{Enter}')
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('a wrong area reports false, keeps the typed number editable and can be fixed', async () => {
    const onAttempt = vi.fn()
    render(<GridAreaGame question={rect()} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard('20{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(answer()).toHaveTextContent('20')
    expect(answer()).toHaveClass('bad')
    await userEvent.keyboard('{Backspace}4{Enter}')
    expect(onAttempt).toHaveBeenCalledTimes(2)
    expect(onAttempt).toHaveBeenLastCalledWith(true)
  })

  it('ignores an empty answer and more than three digits', async () => {
    const onAttempt = vi.fn()
    render(<GridAreaGame question={rect()} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).not.toHaveBeenCalled()
    await userEvent.keyboard('12345')
    expect(answer()).toHaveTextContent('123')
  })
})
