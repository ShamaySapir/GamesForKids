import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { SequenceFillGame, SequenceMistakeGame } from './games-sequence'
import { M3 } from './ids'
import type { MistakeQ, SequenceQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.skipBig': 'skip' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const fill: SequenceQ = {
  itemKey: 'skipbig:25:130', answer: [155, 205], say: 'x', instruction: M3.skipBig, hint: M3.jumpHint,
  terms: [130, 155, 180, 205, 230, 255], blanks: [1, 3], step: 25,
}
const mistake: MistakeQ = {
  itemKey: 'mistake:200:400', answer: 3, say: 'x', instruction: M3.skipBig, hint: M3.jumpHint,
  terms: [200, 400, 600, 900, 1000, 1200], step: 200,
}
const blanks = () => screen.queryAllByRole('button', { name: /^(\?|\d+)$/ }).filter(b => b.classList.contains('g3-blank'))
const key = (k: string) => userEvent.click(screen.getByRole('button', { name: k }))
const type = async (s: string) => { for (const c of s) await key(c) }

describe('SequenceFillGame', () => {
  const setup = (aid = false) => {
    const onAttempt = vi.fn()
    render(<SequenceFillGame question={fill} aid={aid} onAttempt={onAttempt} />)
    return onAttempt
  }

  it('shows the terms left to right with the blanks as buttons, the first one active', () => {
    setup()
    expect(document.querySelector('.g3-terms')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText('130')).toBeTruthy()
    expect(blanks()).toHaveLength(2)
    expect(blanks()[0]).toHaveClass('sel')
  })

  it('fills the blanks with the pad, then checks: right on the first try', async () => {
    const onAttempt = setup()
    await type('155')
    await userEvent.click(blanks()[1]!)
    await type('205')
    expect(onAttempt).not.toHaveBeenCalled()
    await key('✓')
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    expect(blanks()).toHaveLength(0)
  })

  it('by keyboard, Enter moves to the next blank and then checks; a wrong blank is marked, the right one stays', async () => {
    const onAttempt = setup()
    await userEvent.keyboard('155{Enter}')
    expect(blanks()[1]).toHaveClass('sel')
    await userEvent.keyboard('206{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(blanks()).toHaveLength(1)
    expect(blanks()[0]).toHaveClass('bad')
    expect(blanks()[0]).toHaveTextContent('?')
    expect(screen.getByText('155')).toHaveClass('ok')
    await userEvent.keyboard('205{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('does not check while a blank is empty, and Backspace edits', async () => {
    const onAttempt = setup()
    await userEvent.keyboard('156{Backspace}5{Enter}')
    expect(blanks()[0]).toHaveTextContent('155')
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('with the aid, hangs a labelled jump over every term after the first and speaks the hint', () => {
    setup(true)
    expect(say).toHaveBeenCalledWith(M3.jumpHint)
    const jumps = [...document.querySelectorAll('.g3-jump')].map(j => j.textContent)
    expect(jumps).toEqual(['+25', '+25', '+25', '+25', '+25'])
  })
})

describe('SequenceMistakeGame', () => {
  const setup = (aid = false, q = mistake) => {
    const onAttempt = vi.fn()
    render(<SequenceMistakeGame question={q} aid={aid} onAttempt={onAttempt} />)
    return onAttempt
  }

  it('a wrong card is reported and disabled, then the right one passes', async () => {
    const onAttempt = setup()
    await userEvent.click(screen.getByRole('button', { name: '600' }))
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('button', { name: '600' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '900' }))
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: '900' })).toHaveClass('ok')
  })

  it('by keyboard: Tab to a card and press Enter', async () => {
    const onAttempt = setup()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '900' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('with the aid, draws the arcs with a minus sign when counting back', () => {
    setup(true, { ...mistake, step: -200 })
    expect([...document.querySelectorAll('.g3-jump')][0]).toHaveTextContent('−200')
  })
})
