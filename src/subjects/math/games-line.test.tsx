import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MisplacedGame, NumberLineGame, PlaceGame, snap } from './games-line'
import type { MisplacedQ, PlaceQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.place': 'place it', 'math.q.misplaced': 'find it', 'math.ui.check': 'check' },
  say: vi.fn(() => Promise.resolve()),
}))

afterEach(cleanup)

const place = (over: Partial<PlaceQ> = {}): PlaceQ => ({
  itemKey: 'place:7', answer: 7, say: 'x', instruction: 'math.q.place',
  line: { min: 0, max: 10, step: 1, labelEvery: 1 }, target: 7, tolerance: 0, ...over,
})
const slider = () => screen.getByRole('slider')
const check = () => screen.getByRole('button', { name: /check/ })

/** jsdom has no layout: give the svg a 640px box at the page origin (the component's fallback width is 640). */
function stubRect(container: HTMLElement) {
  const svg = container.querySelector('svg')!
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 150, right: 640, bottom: 150, x: 0, y: 0, toJSON: () => ({}) })
  return svg
}

describe('snap', () => {
  it('rounds to the nearest step and clamps', () => {
    const line = { min: 0, max: 100, step: 10, labelEvery: 10 }
    expect(snap(34, line)).toBe(30)
    expect(snap(36, line)).toBe(40)
    expect(snap(-20, line)).toBe(0)
    expect(snap(180, line)).toBe(100)
  })
})

describe('PlaceGame', () => {
  it('draws numbers left-to-right with ticks every step', () => {
    const { container } = render(<PlaceGame question={place()} aid={false} onAttempt={vi.fn()} />)
    expect(container.querySelector('svg')).toHaveStyle({ direction: 'ltr' })
    expect(container.querySelectorAll('.ml-num')).toHaveLength(11)
  })

  it('moves with arrow keys by one step and checks with Enter, once', async () => {
    const onAttempt = vi.fn()
    render(<PlaceGame question={place()} aid={false} onAttempt={onAttempt} />)
    slider().focus()
    expect(slider()).toHaveAttribute('aria-valuenow', '0')
    for (let i = 0; i < 7; i++) await userEvent.keyboard('{ArrowRight}')
    expect(slider()).toHaveAttribute('aria-valuenow', '7')
    await userEvent.keyboard('{ArrowLeft}')
    expect(slider()).toHaveAttribute('aria-valuenow', '6')
    await userEvent.keyboard('{Enter}')
    expect(onAttempt.mock.calls).toEqual([[false]])
    await userEvent.keyboard('{ArrowRight}{Enter}{Enter}')
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('does not go outside the line', async () => {
    render(<PlaceGame question={place()} aid={false} onAttempt={vi.fn()} />)
    slider().focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(slider()).toHaveAttribute('aria-valuenow', '0')
    await userEvent.keyboard('{End}{ArrowRight}')
    expect(slider()).toHaveAttribute('aria-valuenow', '10')
  })

  it('drags with the pointer and snaps to the step', () => {
    const onAttempt = vi.fn()
    const q = place({ line: { min: 0, max: 100, step: 10, labelEvery: 10 }, target: 40, tolerance: 0 })
    const { container } = render(<PlaceGame question={q} aid={false} onAttempt={onAttempt} />)
    const svg = stubRect(container)
    // 100-line: x(v) = 40 + 5.48 v. Pointer at v≈33 snaps to 30, then moves to ≈38 -> 40.
    fireEvent.pointerDown(svg, { clientX: 40 + 5.48 * 33, pointerId: 1 })
    expect(slider()).toHaveAttribute('aria-valuenow', '30')
    fireEvent.pointerMove(svg, { clientX: 40 + 5.48 * 38, pointerId: 1 })
    expect(slider()).toHaveAttribute('aria-valuenow', '40')
    fireEvent.pointerUp(svg, { pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 40 + 5.48 * 90, pointerId: 1 })
    expect(slider()).toHaveAttribute('aria-valuenow', '40')
    fireEvent.click(check())
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('accepts a value within tolerance and rejects one outside it', () => {
    const onAttempt = vi.fn()
    const q = place({ line: { min: 0, max: 100, step: 1, labelEvery: 10 }, target: 50, tolerance: 3 })
    const { container } = render(<PlaceGame question={q} aid={false} onAttempt={onAttempt} />)
    const svg = stubRect(container)
    fireEvent.pointerDown(svg, { clientX: 40 + 5.48 * 54, pointerId: 1 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
    fireEvent.click(check())
    expect(slider()).toHaveAttribute('aria-valuenow', '54')
    fireEvent.pointerDown(svg, { clientX: 40 + 5.48 * 53, pointerId: 1 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
    fireEvent.click(check())
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('never starts on the target', () => {
    render(<PlaceGame question={place({ target: 0 })} aid={false} onAttempt={vi.fn()} />)
    expect(slider()).toHaveAttribute('aria-valuenow', '10')
  })

  it('ignores input after success', async () => {
    render(<PlaceGame question={place({ target: 0, line: { min: 0, max: 10, step: 1, labelEvery: 1 } })} aid={false} onAttempt={vi.fn()} />)
    slider().focus()
    await userEvent.keyboard('{Home}{Enter}{ArrowRight}')
    expect(slider()).toHaveAttribute('aria-valuenow', '0')
    expect(check()).toBeDisabled()
  })
})

const mis = (): MisplacedQ => ({
  itemKey: 'mis:1', answer: 2, say: 'x', instruction: 'math.q.misplaced',
  line: { min: 0, max: 20, step: 1, labelEvery: 5 },
  labels: [{ at: 0, text: '0' }, { at: 5, text: '5' }, { at: 14, text: '10' }, { at: 15, text: '15' }, { at: 20, text: '20' }],
})

describe('MisplacedGame', () => {
  it('renders every label as a button, at its position', () => {
    render(<MisplacedGame question={mis()} aid={false} onAttempt={vi.fn()} />)
    const names = screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))
    expect(names).toEqual(['0', '5', '10', '15', '20'])
    const x = (n: string) => Number(/translate\(([\d.]+)/.exec(screen.getByRole('button', { name: n }).getAttribute('transform')!)![1])
    expect(x('0')).toBeLessThan(x('5'))
    expect(x('10')).toBeLessThan(x('15'))
  })

  it('a wrong tap is a miss and disables that label; the right one wins once', async () => {
    const onAttempt = vi.fn()
    render(<MisplacedGame question={mis()} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    expect(onAttempt).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: '10' }))
    await userEvent.click(screen.getByRole('button', { name: '10' }))
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('selects with the keyboard (Enter and Space)', async () => {
    const onAttempt = vi.fn()
    render(<MisplacedGame question={mis()} aid={false} onAttempt={onAttempt} />)
    screen.getByRole('button', { name: '15' }).focus()
    await userEvent.keyboard('{Enter}')
    screen.getByRole('button', { name: '10' }).focus()
    await userEvent.keyboard(' ')
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('staggers crowded labels on two heights', () => {
    const { container } = render(<MisplacedGame question={mis()} aid={false} onAttempt={vi.fn()} />)
    const tops = [...container.querySelectorAll('.ml-lab rect')].map(r => r.getAttribute('y'))
    expect(new Set(tops).size).toBe(2)
  })
})

describe('NumberLineGame', () => {
  it('dispatches on the question kind', () => {
    const { rerender } = render(<NumberLineGame question={place()} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
    rerender(<NumberLineGame question={mis()} aid={false} onAttempt={vi.fn()} />)
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })
})
