import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { FactorTreeGame, isPrime } from './games-factor'
import { M5 } from './ids'
import type { FactorTreeQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.factorTree': 'factor', 'math.ui.prime': 'prime' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const mk = (n: number, answer: number[]): FactorTreeQ => ({
  itemKey: `ft:${n}`, answer, say: 'x', instruction: M5.factorTree, hint: M5.factorHint, n,
})
const setup = (q: FactorTreeQ, aid = false) => {
  const onAttempt = vi.fn()
  render(<FactorTreeGame question={q} aid={aid} onAttempt={onAttempt} />)
  return onAttempt
}
const circles = () => [...document.querySelectorAll('.ft-circle:not(.mini)')].map(c => c.textContent)
const active = () => document.querySelector('.ft-circle.cur')?.textContent
const key = (k: string) => userEvent.click(screen.getByRole('button', { name: k }))

describe('FactorTreeGame', () => {
  it('knows primes', () => {
    expect([1, 2, 3, 4, 9, 13, 91, 97].map(isPrime)).toEqual([false, true, true, false, false, true, false, true])
  })

  it('starts with the root as the active leaf, drawn left to right', () => {
    setup(mk(12, [2, 2, 3]))
    expect(circles()).toEqual(['12'])
    expect(active()).toBe('12')
    expect(document.querySelector('.ft-tree')).toHaveAttribute('dir', 'ltr')
  })

  it('splits the leaf, moves to the leftmost composite leaf, and completes with n = p x q x r', async () => {
    const onAttempt = setup(mk(12, [2, 2, 3]))
    await userEvent.keyboard('3{Enter}')
    expect(circles()).toEqual(['12', '3', '4'])
    expect(active()).toBe('4')
    expect(document.querySelectorAll('.ft-circle.prime:not(.mini)')).toHaveLength(1)
    expect(onAttempt).not.toHaveBeenCalled()
    await key('2')
    await key('✓')
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(screen.getByRole('status')).toHaveTextContent('12 = 2 × 2 × 3')
    expect(screen.getByRole('button', { name: '2' })).toBeDisabled()
  })

  it('a wrong factor (not a divisor, 1, or the number itself) is a miss and shakes', async () => {
    const onAttempt = setup(mk(12, [2, 2, 3]))
    for (const bad of ['5', '1', '12', '24']) await userEvent.keyboard(`${bad}{Enter}`)
    expect(onAttempt.mock.calls).toEqual([[false], [false], [false], [false]])
    expect(circles()).toEqual(['12'])
    await userEvent.keyboard('5{Enter}')
    expect(document.querySelector('.ft-input')).toHaveClass('bad')
  })

  it('wrong then right: the tree still completes after a miss', async () => {
    const onAttempt = setup(mk(30, [2, 3, 5]))
    await userEvent.keyboard('7{Enter}2{Enter}')
    expect(circles()).toEqual(['30', '2', '15'])
    await userEvent.keyboard('4{Enter}5{Enter}')
    expect(circles()).toEqual(['30', '2', '15', '5', '3'])
    expect(onAttempt.mock.calls).toEqual([[false], [false], [true]])
  })

  it('accepts a composite split and splits that too (64 into six 2s)', async () => {
    const onAttempt = setup(mk(64, [2, 2, 2, 2, 2, 2]))
    await userEvent.keyboard('8{Enter}')
    expect(circles()).toEqual(['64', '8', '8'])
    expect(active()).toBe('8')
    await userEvent.keyboard('4{Enter}')
    expect(active()).toBe('4')
    await userEvent.keyboard('2{Enter}')
    expect(active()).toBe('8')
    await userEvent.keyboard('4{Enter}2{Enter}')
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(screen.getByRole('status')).toHaveTextContent('64 = 2 × 2 × 2 × 2 × 2 × 2')
  })

  it('does not submit twice when Enter is pressed on the focused check button', async () => {
    const onAttempt = setup(mk(6, [2, 3]))
    await userEvent.keyboard('2')
    screen.getByRole('button', { name: '✓' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('aid: speaks the hint once and shows the smallest-factor tip', () => {
    setup(mk(12, [2, 2, 3]), true)
    expect(say).toHaveBeenCalledWith(M5.factorHint)
    expect(document.querySelector('.ft-tip')).toHaveTextContent('12 ÷ 2')
  })
})
