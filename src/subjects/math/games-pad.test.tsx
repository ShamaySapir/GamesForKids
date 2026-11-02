import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { NumberPadGame } from './games-pad'
import type { PadQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.solve': 'solve' },
  say: vi.fn(() => Promise.resolve()),
}))

afterEach(cleanup)

const q = (over: Partial<PadQ> = {}): PadQ => ({
  itemKey: '8+5', answer: 13, say: 'x', instruction: 'math.q.solve', maxDigits: 2,
  prompt: { expr: '8 + 5 = ?' }, ...over,
})
const key = (k: string) => screen.getByRole('button', { name: k })
const answer = () => screen.getByRole('status')

describe('NumberPadGame', () => {
  it('shows the instruction and the exercise left-to-right', () => {
    render(<NumberPadGame question={q()} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getByText('solve')).toBeInTheDocument()
    expect(screen.getByText('8 + 5 = ?')).toHaveAttribute('dir', 'ltr')
  })

  it('accepts the right answer from the on-screen pad and reports it once', async () => {
    const onAttempt = vi.fn()
    render(<NumberPadGame question={q()} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(key('1'))
    await userEvent.click(key('3'))
    expect(answer()).toHaveTextContent('13')
    await userEvent.click(key('✓'))
    await userEvent.click(key('✓'))
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(key('1')).toBeDisabled()
  })

  it('shakes, clears and reports a miss on a wrong answer, then allows another try', async () => {
    const onAttempt = vi.fn()
    render(<NumberPadGame question={q()} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(key('1'))
    await userEvent.click(key('2'))
    await userEvent.click(key('✓'))
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(answer()).toHaveClass('bad')
    expect(answer()).not.toHaveTextContent('12')
    await userEvent.click(key('1'))
    await userEvent.click(key('3'))
    await userEvent.click(key('✓'))
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('works with the physical keyboard: digits, Backspace, Enter', async () => {
    const onAttempt = vi.fn()
    render(<NumberPadGame question={q()} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard('19')
    expect(answer()).toHaveTextContent('19')
    await userEvent.keyboard('{Backspace}')
    expect(answer()).toHaveTextContent('1')
    await userEvent.keyboard('3{Enter}')
    expect(onAttempt.mock.calls).toEqual([[true]])
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('does nothing for an empty answer and stops at maxDigits', async () => {
    const onAttempt = vi.fn()
    render(<NumberPadGame question={q({ maxDigits: 2 })} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(key('✓'))
    expect(onAttempt).not.toHaveBeenCalled()
    await userEvent.keyboard('123')
    expect(answer()).toHaveTextContent('12')
  })

  it('does not submit twice when Enter is pressed on the focused check button', async () => {
    const onAttempt = vi.fn()
    render(<NumberPadGame question={q()} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard('13')
    key('✓').focus()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('draws the aid number line with jumps and speaks the hint once', () => {
    const question = q({ aidLine: { max: 20, from: 8, jumps: [2, 3] }, hint: 'math.hint' })
    const { container, rerender } = render(<NumberPadGame question={question} aid={false} onAttempt={vi.fn()} />)
    expect(container.querySelector('.pd-aid')).toBeNull()
    rerender(<NumberPadGame question={question} aid onAttempt={vi.fn()} />)
    expect(container.querySelectorAll('.pd-jump')).toHaveLength(2)
    expect(container.querySelector('.pd-aid')).toHaveTextContent('+2')
    expect(say).toHaveBeenCalledTimes(1)
  })
})
