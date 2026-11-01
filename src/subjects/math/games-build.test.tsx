import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TapBuildGame } from './games-build'
import type { BuildQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.showMe': 'put in', 'math.ui.check': 'check', 'math.ui.reset': 'reset' },
  say: vi.fn(() => Promise.resolve()),
}))

afterEach(cleanup)

const q = (over: Partial<BuildQ> = {}): BuildQ => ({
  itemKey: 'build:7', answer: 7, say: 'x', instruction: 'math.q.showMe', emoji: '🍎', max: 10, show: '7', ...over,
})
const basket = () => screen.getByRole('button', { name: '🧺' })
const objects = () => screen.queryAllByRole('button', { name: '🍎' })

describe('TapBuildGame', () => {
  it('shows the number big and left-to-right', () => {
    render(<TapBuildGame question={q()} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getByText('7')).toHaveAttribute('dir', 'ltr')
  })

  it('adds one object per tap and removes one when an object is tapped', async () => {
    render(<TapBuildGame question={q()} aid={false} onAttempt={vi.fn()} />)
    await userEvent.click(basket())
    await userEvent.click(basket())
    await userEvent.click(basket())
    expect(objects()).toHaveLength(3)
    await userEvent.click(objects()[0]!)
    expect(objects()).toHaveLength(2)
  })

  it('adds with Space and Enter on the basket', async () => {
    render(<TapBuildGame question={q()} aid={false} onAttempt={vi.fn()} />)
    basket().focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    expect(objects()).toHaveLength(2)
  })

  it('stops at max', async () => {
    render(<TapBuildGame question={q({ max: 6 })} aid={false} onAttempt={vi.fn()} />)
    for (let i = 0; i < 9; i++) if (!(basket() as HTMLButtonElement).disabled) await userEvent.click(basket())
    expect(objects()).toHaveLength(6)
    expect(basket()).toBeDisabled()
  })

  it('groups objects in rows of five', async () => {
    const { container } = render(<TapBuildGame question={q()} aid={false} onAttempt={vi.fn()} />)
    for (let i = 0; i < 7; i++) await userEvent.click(basket())
    const rows = [...container.querySelectorAll('.tb-row')].map(r => r.children.length)
    expect(rows).toEqual([5, 2])
  })

  it('reset empties the basket', async () => {
    render(<TapBuildGame question={q()} aid={false} onAttempt={vi.fn()} />)
    await userEvent.click(basket())
    await userEvent.click(basket())
    await userEvent.click(screen.getByRole('button', { name: /reset/ }))
    expect(objects()).toHaveLength(0)
  })

  it('reports a miss for the wrong count, keeps objects, and success once for the right one', async () => {
    const onAttempt = vi.fn()
    render(<TapBuildGame question={q()} aid={false} onAttempt={onAttempt} />)
    for (let i = 0; i < 6; i++) await userEvent.click(basket())
    await userEvent.click(screen.getByRole('button', { name: /check/ }))
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(objects()).toHaveLength(6)
    await userEvent.click(basket())
    await userEvent.click(screen.getByRole('button', { name: /check/ }))
    await userEvent.click(screen.getByRole('button', { name: /check/ }))
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
    expect(basket()).toBeDisabled()
  })
})
