import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { CoinsGame } from './games-coins'
import { M } from './ids'
import type { CoinsQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.ui.check': 'check', 'math.ui.reset': 'reset', 'math.q.pay': 'pay', 'math.shop.ball': 'ball' },
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))
afterEach(() => { cleanup(); vi.mocked(say).mockClear() })

const q: CoinsQ = {
  itemKey: 'ball:13', answer: 13, say: M.pay, instruction: M.pay,
  item: { emoji: '⚽', name: 'math.shop.ball' }, price: 13, coins: [1, 2, 5, 10],
}
const setup = () => {
  const onAttempt = vi.fn()
  render(<CoinsGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}
const total = () => screen.getByRole('status').textContent
const coin = (v: number) => screen.getByRole('button', { name: `${v} ₪` })

describe('CoinsGame', () => {
  it('shows the price and adds coins to the running total', async () => {
    setup()
    expect(screen.getByText('13 ₪', { selector: '.mc-tag' })).toBeTruthy()
    expect(total()).toBe('0 ₪')
    await userEvent.click(coin(10))
    await userEvent.click(coin(2))
    expect(total()).toBe('12 ₪')
  })

  it('removes a coin from the wallet when tapped', async () => {
    setup()
    await userEvent.click(coin(5))
    await userEvent.click(coin(5))
    await userEvent.click(screen.getAllByRole('button', { name: '5 ₪ ✕' })[0] as HTMLElement)
    expect(total()).toBe('5 ₪')
  })

  it('accepts any combination that sums to the price, reported once', async () => {
    const onAttempt = setup()
    for (const v of [5, 5, 2, 1]) await userEvent.click(coin(v))
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
    expect((coin(10) as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('reports a miss for a wrong total and keeps the coins', async () => {
    const onAttempt = setup()
    await userEvent.click(coin(10))
    await userEvent.click(coin(2))
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false)
    expect(total()).toBe('12 ₪')
    await userEvent.click(coin(1))
    await userEvent.click(screen.getByRole('button', { name: 'check' }))
    expect(onAttempt).toHaveBeenLastCalledWith(true)
  })

  it('does not check an empty wallet', () => {
    setup()
    expect((screen.getByRole('button', { name: 'check' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('adds a coin from the keyboard (Tab to the coin, Enter)', async () => {
    setup()
    const first = coin(1)
    first.focus()
    await userEvent.keyboard('{Enter}')
    expect(total()).toBe('1 ₪')
    await userEvent.tab()
    expect(document.activeElement).toBe(coin(2))
    await userEvent.keyboard('{Enter}')
    expect(total()).toBe('3 ₪')
  })

  it('adds a coin dropped on the wallet and ignores a drop elsewhere', () => {
    setup()
    const wallet = document.querySelector('.mc-wallet') as HTMLElement
    wallet.getBoundingClientRect = () => ({ left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
    const c = coin(5)
    fireEvent.pointerDown(c, { pointerId: 1, clientX: 500, clientY: 500, button: 0 })
    fireEvent.pointerMove(c, { pointerId: 1, clientX: 50, clientY: 50 })
    fireEvent.pointerUp(c, { pointerId: 1, clientX: 50, clientY: 50 })
    expect(total()).toBe('5 ₪')
    fireEvent.pointerDown(c, { pointerId: 1, clientX: 500, clientY: 500, button: 0 })
    fireEvent.pointerMove(c, { pointerId: 1, clientX: 300, clientY: 300 })
    fireEvent.pointerUp(c, { pointerId: 1, clientX: 300, clientY: 300 })
    expect(total()).toBe('5 ₪')
  })

  it('speaks the price in shekels', async () => {
    setup()
    await userEvent.click(screen.getAllByRole('button', { name: '🔊' })[0] as HTMLElement)
    expect(say).toHaveBeenCalledWith('math.price.13')
  })
})
