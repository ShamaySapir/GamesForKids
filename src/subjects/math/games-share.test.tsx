import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareGame } from './games-share'
import { M } from './ids'
import type { ShareQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.ui.leftover': 'left', 'math.q.share': 'share', 'math.ui.check': 'check', 'math.ui.reset': 'reset' },
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

  describe('with a left-over bowl', () => {
    const lq: ShareQ = { itemKey: 'rem:7/3', answer: 2, say: 'x', instruction: M.share, emoji: '🍪', total: 7, plates: 3, leftover: true }
    const run = () => {
      const onAttempt = vi.fn()
      render(<ShareGame question={lq} aid={false} onAttempt={onAttempt} />)
      return onAttempt
    }
    const bowlBtn = () => screen.getByRole('button', { name: /🥣/ })
    const inBowl = () => document.querySelectorAll('.g3a-bowl .sh-placed').length
    const fill = async (plateList: number[], bowl: number) => {
      for (const p of plateList) await userEvent.click(plate(p))
      for (let i = 0; i < bowl; i++) await userEvent.click(bowlBtn())
    }

    it('has no bowl without leftover', () => {
      setup()
      expect(document.querySelector('.g3a-bowl')).toBeNull()
    })

    it('moves items into the bowl and back', async () => {
      run()
      await userEvent.click(bowlBtn())
      await userEvent.click(bowlBtn())
      expect(inBowl()).toBe(2)
      expect(pileCount()).toBe(5)
      await userEvent.click(document.querySelector('.g3a-bowl .sh-placed')!)
      expect(inBowl()).toBe(1)
      expect(pileCount()).toBe(6)
    })

    it('drags an item into the bowl', () => {
      run()
      const rect = { left: 0, right: 100, top: 200, bottom: 300, width: 100, height: 100, x: 0, y: 200, toJSON: () => ({}) } as DOMRect
      document.querySelector('.g3a-bowl')!.getBoundingClientRect = () => rect
      const item = document.querySelector('.sh-pile .sh-item')!
      fireEvent.pointerDown(item, { clientX: 500, clientY: 500, pointerId: 1, button: 0 })
      fireEvent.pointerMove(item, { clientX: 50, clientY: 250, pointerId: 1 })
      fireEvent.pointerUp(item, { clientX: 50, clientY: 250, pointerId: 1 })
      expect(inBowl()).toBe(1)
    })

    it('accepts equal plates plus the remainder in the bowl, and says it', async () => {
      const onAttempt = run()
      await fill([1, 1, 2, 2, 3, 3], 1)
      await check()
      expect(onAttempt).toHaveBeenCalledWith(true)
      expect(screen.getByRole('status')).toHaveTextContent('7 ÷ 3 = 2, left 1')
    })

    it('rejects a bowl that holds a whole share or more', async () => {
      const onAttempt = run()
      await fill([1, 1, 2, 2], 3)
      await check()
      expect(onAttempt).toHaveBeenCalledWith(false)
      expect(onAttempt).toHaveBeenCalledTimes(1)
    })

    it('rejects equal plates with the wrong bowl count', async () => {
      const onAttempt = run()
      await fill([1, 1, 2, 2, 3], 2)
      await check()
      expect(onAttempt).toHaveBeenCalledWith(false)
    })
  })
})
