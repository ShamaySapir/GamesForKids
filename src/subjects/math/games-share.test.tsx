import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareGame } from './games-share'
import { M } from './ids'
import type { ShareQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.share': 'share', 'math.ui.check': 'check', 'math.ui.reset': 'reset' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const q: ShareQ = { itemKey: 'share:6/3', answer: 2, say: 'x', instruction: M.share, emoji: '🍪', total: 6, plates: 3 }
const setup = () => {
  const onAttempt = vi.fn()
  render(<ShareGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}
const plate = (n: number) => screen.getByRole('button', { name: `🍽️ ${n}` })
const pileCount = () => document.querySelectorAll('.sh-pile .sh-item').length
const onPlate = (n: number) => plate(n).parentElement!.querySelectorAll('.sh-placed').length
const check = () => userEvent.click(screen.getByRole('button', { name: 'check' }))
const counts = () => Array.from(document.querySelectorAll('.sh-count')).map(e => e.textContent)

describe('ShareGame', () => {
  it('starts with all items in the pile and one plate per share', () => {
    setup()
    expect(pileCount()).toBe(6)
    expect(screen.getAllByRole('button', { name: /🍽️/ })).toHaveLength(3)
  })

  it('moves one item from the pile when a plate is tapped, and back when the item is tapped', async () => {
    setup()
    await userEvent.click(plate(2))
    await userEvent.click(plate(2))
    expect(pileCount()).toBe(4)
    expect(onPlate(2)).toBe(2)
    await userEvent.click(screen.getAllByRole('button', { name: '🍪 ✕' })[0]!)
    expect(onPlate(2)).toBe(1)
    expect(pileCount()).toBe(5)
  })

  it('moves an item by keyboard: Tab to a plate and Enter', async () => {
    setup()
    await userEvent.tab()
    expect(plate(1)).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onPlate(1)).toBe(1)
    await userEvent.tab()
    await userEvent.tab()
    expect(plate(2)).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onPlate(2)).toBe(1)
    expect(pileCount()).toBe(4)
  })

  it('drags an item from the pile onto a plate', () => {
    setup()
    const rect = (l: number) => ({ left: l, right: l + 100, top: 0, bottom: 100, width: 100, height: 100, x: l, y: 0, toJSON: () => ({}) }) as DOMRect
    ;[1, 2, 3].forEach((n, i) => { plate(n).parentElement!.getBoundingClientRect = () => rect(i * 200) }) // plate 3 spans x 400–500
    const item = document.querySelector('.sh-pile .sh-item')!
    fireEvent.pointerDown(item, { clientX: 500, clientY: 300, pointerId: 1, button: 0 })
    fireEvent.pointerMove(item, { clientX: 420, clientY: 60, pointerId: 1 })
    fireEvent.pointerUp(item, { clientX: 420, clientY: 60, pointerId: 1 })
    expect(onPlate(3)).toBe(1)
    expect(onPlate(1) + onPlate(2)).toBe(0)
    expect(pileCount()).toBe(5)
  })

  it('a drag that misses every plate changes nothing', () => {
    setup()
    const item = document.querySelector('.sh-pile .sh-item')!
    fireEvent.pointerDown(item, { clientX: 500, clientY: 300, pointerId: 1, button: 0 })
    fireEvent.pointerMove(item, { clientX: 900, clientY: 900, pointerId: 1 })
    fireEvent.pointerUp(item, { clientX: 900, clientY: 900, pointerId: 1 })
    expect(pileCount()).toBe(6)
  })

  it('accepts an equal share, once, and shows the division', async () => {
    const onAttempt = setup()
    for (const p of [1, 2, 3, 1, 2, 3]) await userEvent.click(plate(p))
    await check()
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    expect(screen.getByRole('status')).toHaveTextContent('6 ÷ 3 = 2')
    expect(screen.getByRole('status')).toHaveAttribute('dir', 'ltr')
  })

  it('rejects an unequal share and keeps the items where they are', async () => {
    const onAttempt = setup()
    for (const p of [1, 1, 1, 2, 2, 3]) await userEvent.click(plate(p))
    await check()
    expect(onAttempt).toHaveBeenCalledWith(false)
    expect(onPlate(1)).toBe(3)
    expect(document.querySelector('.sh-plates')).toHaveClass('bad')
  })

  it('rejects an equal split that leaves items in the pile', async () => {
    const onAttempt = setup()
    for (const p of [1, 2, 3]) await userEvent.click(plate(p))
    await check()
    expect(onAttempt).toHaveBeenCalledWith(false)
  })

  it('shows per-plate counts only with the aid', async () => {
    const { unmount } = render(<ShareGame question={q} aid={false} onAttempt={vi.fn()} />)
    await userEvent.click(plate(1))
    expect(counts()).toEqual(['', '', ''])
    unmount()
    render(<ShareGame question={q} aid={true} onAttempt={vi.fn()} />)
    await userEvent.click(plate(1))
    expect(counts()).toEqual(['1', '0', '0'])
  })
})
