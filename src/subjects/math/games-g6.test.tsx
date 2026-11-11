import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { registerArt } from '../../ui/pick/art'
import { MeanGame, moveBlock } from './games-mean'
import { TapArtGame } from './games-tap-art'
import { M6 } from './ids'
import type { MeanQ, TapArtQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.ui.check': 'check', 'math.ui.reset': 'reset', 'math.q.mean': 'mean', 'math.circle.radius': 'radius' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const checkBtn = () => screen.getByRole('button', { name: 'check' })

describe('moveBlock', () => {
  it('moves one block, ignores empty and same bars', () => {
    expect(moveBlock([3, 1], 0, 1)).toEqual([2, 2])
    expect(moveBlock([0, 1], 0, 1)).toEqual([0, 1])
    expect(moveBlock([3, 1], 1, 1)).toEqual([3, 1])
  })
})

describe('MeanGame', () => {
  const q: MeanQ = { itemKey: 'mean:3,5,4', answer: 4, say: 'x', instruction: 'math.q.mean', hint: M6.meanHint, values: [3, 5, 4] }
  const setup = (aid = false) => {
    const onAttempt = vi.fn()
    render(<MeanGame question={q} aid={aid} onAttempt={onAttempt} />)
    return onAttempt
  }
  const bars = () => [...document.querySelectorAll<HTMLElement>('.g6-bar')]
  const heights = () => bars().map(b => b.querySelectorAll('.g6-block').length)

  it('is left to right, and the dashed average line appears only with the aid', () => {
    setup()
    expect(document.querySelector('.g6-mean')).toHaveAttribute('dir', 'ltr')
    expect(heights()).toEqual([3, 5, 4])
    expect(document.querySelector('.g6-avg')).toBeNull()
    cleanup()
    setup(true)
    expect(document.querySelector('.g6-avg')).toBeTruthy()
    expect(say).toHaveBeenCalledWith(M6.meanHint)
  })

  it('tap a bar then another moves its top block; a wrong check keeps the blocks; then levelling passes', async () => {
    const onAttempt = setup()
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(heights()).toEqual([3, 5, 4])
    await userEvent.click(bars()[1]!)
    await userEvent.click(bars()[0]!)
    expect(heights()).toEqual([4, 4, 4])
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('status')).toHaveTextContent('4')
    expect(checkBtn()).toBeDisabled()
  })

  it('by keyboard: Enter picks, Escape cancels, Space drops, Reset restores', async () => {
    setup()
    bars()[1]!.focus()
    await userEvent.keyboard('{Enter}')
    expect(bars()[1]).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('{Escape}')
    expect(bars()[1]).toHaveAttribute('aria-pressed', 'false')
    await userEvent.keyboard('{Enter}')
    bars()[0]!.focus()
    await userEvent.keyboard(' ')
    expect(heights()).toEqual([4, 4, 4])
    await userEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(heights()).toEqual([3, 5, 4])
  })

  it('drags the top block onto another bar with pointer events', () => {
    setup()
    const [b0, b1] = bars()
    document.elementFromPoint = vi.fn(() => b0!)
    fireEvent.pointerDown(b1!, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(b1!, { clientX: 40, clientY: 100 })
    expect(b0).toHaveClass('over')
    fireEvent.pointerUp(b1!, { clientX: 40, clientY: 100 })
    fireEvent.click(b1!) // the click that follows a drag is ignored
    expect(heights()).toEqual([4, 4, 4])
    expect(b1).toHaveAttribute('aria-pressed', 'false')
  })

  it('a drag released over nothing moves nothing', () => {
    setup()
    const b1 = bars()[1]!
    document.elementFromPoint = vi.fn(() => document.body)
    fireEvent.pointerDown(b1, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(b1, { clientX: 100, clientY: 20 })
    fireEvent.pointerUp(b1, { clientX: 100, clientY: 20 })
    expect(heights()).toEqual([3, 5, 4])
  })
})

describe('TapArtGame', () => {
  registerArt({
    'test.circle': () => createElement('svg', { viewBox: '0 0 10 10' },
      createElement('line', { 'data-part': 'radius', x1: 0, y1: 0, x2: 5, y2: 5 }),
      createElement('line', { 'data-part': 'diameter', x1: 0, y1: 0, x2: 9, y2: 9 })),
  })
  const q: TapArtQ = { itemKey: 'tap:radius', answer: 'radius', say: 'x', instruction: 'math.q.mean', hint: M6.circleHint, art: { name: 'test.circle' }, parts: ['radius', 'diameter'] }
  const setup = () => {
    const onAttempt = vi.fn()
    render(<TapArtGame question={q} aid={false} onAttempt={onAttempt} />)
    return onAttempt
  }
  const part = (id: string) => document.querySelector<SVGElement>(`[data-part="${id}"]`)!

  it('makes each part a labelled button; a wrong tap disables it, the right one passes', async () => {
    const onAttempt = setup()
    expect(part('radius')).toHaveAttribute('role', 'button')
    expect(part('radius')).toHaveAttribute('aria-label', 'radius')
    expect(part('diameter')).toHaveAttribute('aria-label', 'diameter')
    expect(part('diameter')).toHaveAttribute('tabindex', '0')
    await userEvent.click(part('diameter'))
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(part('diameter')).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(part('diameter'))
    expect(onAttempt).toHaveBeenCalledTimes(1)
    await userEvent.click(part('radius'))
    expect(onAttempt).toHaveBeenLastCalledWith(true)
  })

  it('works by keyboard', async () => {
    const onAttempt = setup()
    part('radius').focus()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(true)
  })
})
