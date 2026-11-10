import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { SortGame } from './games-sort'
import { M3, divisibleBy } from './ids'
import type { SortQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.sortNumbers': 'sort', 'math.ui.divisibleBy.10': 'by ten', 'math.ui.notDivisible': 'not', 'math.ui.check': 'check' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const q: SortQ = {
  itemKey: 'sort:10', answer: [0, 2], say: 'x', instruction: M3.sortNumbers, hint: M3.lastDigitHint,
  items: [30, 45, 120, 77], yes: divisibleBy(10), no: M3.notDivisible,
}
const setup = (aid = false) => {
  const onAttempt = vi.fn()
  render(<SortGame question={q} aid={aid} onAttempt={onAttempt} />)
  return onAttempt
}
const chip = (n: number) => screen.getByRole('button', { name: String(n) })
const yes = () => screen.getByRole('button', { name: /by ten/ })
const no = () => screen.getByRole('button', { name: /not/ })
const check = () => screen.getByRole('button', { name: 'check' })
const inBin = (b: 'yes' | 'no') => [...document.querySelectorAll(`.g3-bin.${b} .g3-chip`)].map(c => c.textContent)

describe('SortGame', () => {
  it('starts with every number in the pool, Check disabled', () => {
    setup()
    expect(document.querySelectorAll('.g3-pool .g3-chip')).toHaveLength(4)
    expect(check()).toBeDisabled()
  })

  it('tap a number then a bin; a wrong sort sends the wrong ones back, keeps the right ones, then passes', async () => {
    const onAttempt = setup()
    for (const n of [30, 45]) { await userEvent.click(chip(n)); await userEvent.click(yes()) }
    for (const n of [120, 77]) { await userEvent.click(chip(n)); await userEvent.click(no()) }
    expect(inBin('yes')).toEqual(['30', '45'])
    await userEvent.click(check())
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(inBin('yes')).toEqual(['30'])
    expect(inBin('no')).toEqual(['77'])
    expect([...document.querySelectorAll('.g3-pool .g3-chip')].map(c => c.textContent).sort()).toEqual(['120', '45'])
    expect(chip(30)).toBeDisabled()
    await userEvent.click(chip(120)); await userEvent.click(yes())
    await userEvent.click(chip(45)); await userEvent.click(no())
    await userEvent.click(check())
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('by keyboard: 1 and 2 put the focused number in a bin and the focus moves on; Backspace takes it back', async () => {
    const onAttempt = setup()
    await userEvent.tab()
    expect(chip(30)).toHaveFocus()
    await userEvent.keyboard('1')
    expect(inBin('yes')).toEqual(['30'])
    expect(chip(45)).toHaveFocus()
    await userEvent.keyboard('2')
    expect(chip(120)).toHaveFocus()
    await userEvent.keyboard('1')
    await userEvent.keyboard('2')
    expect(inBin('no')).toEqual(['45', '77'])
    await userEvent.tab()
    await userEvent.click(check())
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('a bin takes a selected number with Enter', async () => {
    setup()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(chip(30)).toHaveAttribute('aria-pressed', 'true')
    yes().focus()
    await userEvent.keyboard('{Enter}')
    expect(inBin('yes')).toEqual(['30'])
  })

  it('drags a number into a bin', () => {
    setup()
    const rect = (l: number, t: number) => ({ left: l, right: l + 100, top: t, bottom: t + 100, width: 100, height: 100, x: l, y: t, toJSON: () => ({}) }) as DOMRect
    document.querySelector<HTMLElement>('.g3-bin.yes')!.getBoundingClientRect = () => rect(0, 300)
    document.querySelector<HTMLElement>('.g3-bin.no')!.getBoundingClientRect = () => rect(200, 300)
    const el = chip(77)
    fireEvent.pointerDown(el, { clientX: 500, clientY: 50, pointerId: 1, button: 0 })
    fireEvent.pointerMove(el, { clientX: 250, clientY: 350, pointerId: 1 })
    fireEvent.pointerUp(el, { clientX: 250, clientY: 350, pointerId: 1 })
    expect(inBin('no')).toEqual(['77'])
  })

  it('a drag that misses everything changes nothing', () => {
    setup()
    const el = chip(77)
    fireEvent.pointerDown(el, { clientX: 500, clientY: 50, pointerId: 1, button: 0 })
    fireEvent.pointerMove(el, { clientX: 900, clientY: 900, pointerId: 1 })
    fireEvent.pointerUp(el, { clientX: 900, clientY: 900, pointerId: 1 })
    expect(document.querySelectorAll('.g3-pool .g3-chip')).toHaveLength(4)
  })

  it('with the aid, underlines the last digit of every number and speaks the hint', () => {
    setup(true)
    expect(say).toHaveBeenCalledWith(M3.lastDigitHint)
    expect([...document.querySelectorAll('.g3-last')].map(u => u.textContent)).toEqual(['0', '5', '0', '7'])
  })
})
