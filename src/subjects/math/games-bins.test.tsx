import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { BinsGame } from './games-bins'
import { M5 } from './ids'
import type { BinsQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: {
    'math.q.primeOrNot': 'sort', 'math.ui.prime': 'prime', 'math.ui.composite': 'composite', 'math.ui.neither': 'neither',
    'math.ui.check': 'check', 'math.hint.prime': 'hint',
  },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(() => { cleanup(); vi.mocked(say).mockClear() })

const q: BinsQ = {
  itemKey: 'bins:x', answer: [0, 1, 2, 0], say: 'x', instruction: M5.primeOrNot, hint: M5.primeHint,
  items: [7, 9, 1, 13], bins: [M5.prime, M5.composite, M5.neither],
}
const setup = (aid = false) => {
  const onAttempt = vi.fn()
  render(<BinsGame question={q} aid={aid} onAttempt={onAttempt} />)
  return onAttempt
}
const chip = (n: number) => screen.getByRole('button', { name: String(n) })
const bin = (name: string) => screen.getByRole('button', { name: new RegExp(name) })
const check = () => screen.getByRole('button', { name: 'check' })
const inBin = (b: number) => [...document.querySelectorAll(`.g5-bins .g3-bin:nth-child(${b + 1}) .g3-chip`)].map(c => c.textContent)
const pool = () => [...document.querySelectorAll('.g3-pool .g3-chip')].map(c => c.textContent)

describe('BinsGame', () => {
  it('shows three labelled bins, every number in the pool and Check disabled', () => {
    setup()
    expect(document.querySelectorAll('.g5-bins .g3-bin')).toHaveLength(3)
    expect(pool()).toEqual(['7', '9', '1', '13'])
    expect(check()).toBeDisabled()
  })

  it('a wrong sort sends only the wrong numbers back, keeps the right ones, then passes', async () => {
    const onAttempt = setup()
    for (const [n, b] of [[7, 'prime'], [9, 'prime'], [1, 'neither'], [13, 'prime']] as const) {
      await userEvent.click(chip(n))
      await userEvent.click(bin(b))
    }
    await userEvent.click(check())
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(inBin(0)).toEqual(['7', '13'])
    expect(inBin(2)).toEqual(['1'])
    expect(pool()).toEqual(['9'])
    expect(chip(7)).toBeDisabled()
    await userEvent.click(chip(9))
    await userEvent.click(bin('composite'))
    await userEvent.click(check())
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('by keyboard: digits 1..3 put the focused number in that bin, the focus moves on, Backspace takes it back', async () => {
    const onAttempt = setup()
    await userEvent.tab()
    expect(chip(7)).toHaveFocus()
    await userEvent.keyboard('1')
    expect(inBin(0)).toEqual(['7'])
    expect(chip(9)).toHaveFocus()
    await userEvent.keyboard('3')
    await userEvent.keyboard('2')
    await userEvent.keyboard('1')
    expect(inBin(2)).toEqual(['9'])
    expect(inBin(1)).toEqual(['1'])
    chip(7).focus() // a chip inside a bin
    await userEvent.keyboard('{Backspace}')
    expect(pool()).toContain('7')
    expect(inBin(0)).toEqual(['13'])
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('a digit beyond the number of bins does nothing', async () => {
    setup()
    await userEvent.tab()
    await userEvent.keyboard('4')
    expect(pool()).toHaveLength(4)
  })

  it('drags a number into the third bin', () => {
    setup()
    const rect = (l: number, t: number) => ({ left: l, right: l + 100, top: t, bottom: t + 100, width: 100, height: 100, x: l, y: t, toJSON: () => ({}) }) as DOMRect
    document.querySelectorAll<HTMLElement>('.g5-bins .g3-bin').forEach((el, i) => { el.getBoundingClientRect = () => rect(i * 200, 300) })
    const el = chip(13)
    fireEvent.pointerDown(el, { clientX: 500, clientY: 50, pointerId: 1, button: 0 })
    fireEvent.pointerMove(el, { clientX: 450, clientY: 350, pointerId: 1 })
    fireEvent.pointerUp(el, { clientX: 450, clientY: 350, pointerId: 1 })
    expect(inBin(2)).toEqual(['13'])
  })

  it('speaks the hint once with the aid', () => {
    setup(true)
    expect(say).toHaveBeenCalledWith(M5.primeHint)
  })
})
