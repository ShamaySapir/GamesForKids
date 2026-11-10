import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { ProgramGame } from './games-program'
import { C } from './ids'
import type { Card, ProgramQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: {},
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))

const board = { id: 't', rows: ['S..G', '....', '....', '....'] }
const q = (extra: Partial<ProgramQ> = {}): ProgramQ => ({
  itemKey: 't', answer: null, say: 'x', instruction: 'code.q.program', board,
  palette: ['up', 'down', 'left', 'right'], ghost: [[0, 0], [0, 1], [0, 2], [0, 3]], ...extra,
})
const mv = (dir: 'up' | 'down' | 'left' | 'right'): Card => ({ kind: 'move', dir })

const hero = (c: HTMLElement) => c.querySelector('svg g[transform]')?.getAttribute('transform')
const strip = () => within(screen.getByRole('list'))
const within = (el: HTMLElement) => ({ cards: () => Array.from(el.querySelectorAll('.cd-card')).map(n => n.textContent) })
const palette = (name: string) => screen.getAllByRole('button', { name }).find(b => b.classList.contains('cd-pal'))!
const runBtn = () => screen.getByRole('button', { name: '▶' })
// Small steps so React re-renders (and re-arms the effect's timer) between timers.
const tick = (ms: number) => { for (let t = 0; t < ms; t += 100) act(() => { vi.advanceTimersByTime(100) }) }

beforeEach(() => { vi.useFakeTimers(); vi.mocked(say).mockClear() })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('ProgramGame editing', () => {
  it('appends from the palette and removes a tapped strip card', () => {
    render(<ProgramGame question={q()} aid={false} onAttempt={vi.fn()} />)
    expect(runBtn()).toBeDisabled()
    fireEvent.click(palette('→'))
    fireEvent.click(palette('↓'))
    fireEvent.click(palette('→'))
    expect(strip().cards()).toEqual(['→', '↓', '→'])
    fireEvent.click(screen.getAllByRole('listitem').filter(n => n.textContent === '↓')[0]!)
    expect(strip().cards()).toEqual(['→', '→'])
    fireEvent.click(screen.getByRole('button', { name: '⌫' }))
    expect(strip().cards()).toEqual(['→'])
    expect(runBtn()).toBeEnabled()
  })

  it('appends with arrow keys, erases with Backspace and runs with Enter', () => {
    const onAttempt = vi.fn()
    const { container } = render(<ProgramGame question={q()} aid={false} onAttempt={onAttempt} />)
    const play = container.querySelector('.cd-play')!
    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowRight']) fireEvent.keyDown(play, { key })
    expect(strip().cards()).toEqual(['→', '↓', '→', '→'])
    fireEvent.keyDown(play, { key: 'Backspace' })
    fireEvent.keyDown(play, { key: 'Backspace' })
    fireEvent.keyDown(play, { key: 'Backspace' })
    fireEvent.keyDown(play, { key: 'ArrowRight' })
    fireEvent.keyDown(play, { key: 'ArrowRight' })
    expect(strip().cards()).toEqual(['→', '→', '→'])
    fireEvent.keyDown(play, { key: 'Enter' })
    tick(1600)
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('blocks adding at maxCards with a gentle phrase and no attempt', () => {
    const onAttempt = vi.fn()
    render(<ProgramGame question={q({ maxCards: 2 })} aid={false} onAttempt={onAttempt} />)
    fireEvent.click(palette('→'))
    fireEvent.click(palette('→'))
    expect(say).not.toHaveBeenCalled()
    fireEvent.click(palette('→'))
    expect(strip().cards()).toEqual(['→', '→'])
    expect(say).toHaveBeenCalledWith(C.full)
    expect(onAttempt).not.toHaveBeenCalled()
  })
})

describe('ProgramGame run', () => {
  it('walks to the goal, reports one hit and ignores later input', () => {
    const onAttempt = vi.fn()
    const { container } = render(<ProgramGame question={q({ start: [mv('right'), mv('right'), mv('right')] })} aid={false} onAttempt={onAttempt} />)
    const home = hero(container)
    fireEvent.click(runBtn())
    expect(runBtn()).toBeDisabled()
    expect(hero(container)).toBe(home)
    tick(400)
    expect(hero(container)).not.toBe(home)
    expect(container.querySelectorAll('.cd-card.run')).toHaveLength(1)
    tick(1200)
    expect(onAttempt.mock.calls).toEqual([[true]])
    fireEvent.keyDown(container.querySelector('.cd-play')!, { key: 'ArrowUp' })
    tick(5000)
    expect(strip().cards()).toHaveLength(3)
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('reports a miss once, keeps the strip, marks the card, and walks Shufi back', () => {
    const onAttempt = vi.fn()
    const { container } = render(<ProgramGame question={q({ start: [mv('right'), mv('down'), mv('down')] })} aid={false} onAttempt={onAttempt} />)
    const home = hero(container)
    fireEvent.click(runBtn())
    tick(400 * 3)
    expect(hero(container)).not.toBe(home)
    tick(400)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(strip().cards()).toEqual(['→', '↓', '↓'])
    expect(container.querySelectorAll('.cd-card.stop')).toHaveLength(1)
    expect(container.querySelector('.cd-card.stop')?.textContent).toBe('↓')
    expect(runBtn()).toBeDisabled()
    tick(900)
    expect(hero(container)).toBe(home)
    expect(runBtn()).toBeEnabled()
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('shows the card where a wall stopped Shufi', () => {
    const onAttempt = vi.fn()
    const { container } = render(<ProgramGame question={q({ start: [mv('right'), mv('up')] })} aid={false} onAttempt={onAttempt} />)
    fireEvent.click(runBtn())
    tick(400 * 3)
    expect(onAttempt.mock.calls).toEqual([[false]])
    const cards = Array.from(container.querySelectorAll('.cd-card'))
    expect(cards[1]).toHaveClass('stop')
  })

  it('jumps straight to the end with reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const onAttempt = vi.fn()
    const { container } = render(<ProgramGame question={q({ start: [mv('right'), mv('right'), mv('right')] })} aid={false} onAttempt={onAttempt} />)
    const home = hero(container)
    fireEvent.click(runBtn())
    expect(hero(container)).not.toBe(home)
    expect(onAttempt).not.toHaveBeenCalled()
    tick(400)
    expect(onAttempt.mock.calls).toEqual([[true]])
  })
})

describe('ProgramGame debug', () => {
  const buggy = [mv('right'), mv('right'), mv('down')]
  const debug = () => q({ start: buggy, oneEdit: true })

  it('cycles a tapped card and accepts the one-card fix', () => {
    const onAttempt = vi.fn()
    render(<ProgramGame question={debug()} aid={false} onAttempt={onAttempt} />)
    const last = () => screen.getAllByRole('listitem')[2]!
    fireEvent.click(last())
    expect(strip().cards()).toEqual(['→', '→', '←'])
    fireEvent.click(last())
    expect(strip().cards()).toEqual(['→', '→', '→'])
    fireEvent.click(runBtn())
    tick(1600)
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('does not accept a program that needs two edits', () => {
    const onAttempt = vi.fn()
    render(<ProgramGame question={debug()} aid={false} onAttempt={onAttempt} />)
    fireEvent.click(screen.getByRole('button', { name: '⌫' }))
    fireEvent.click(screen.getByRole('button', { name: '⌫' }))
    fireEvent.click(screen.getByRole('button', { name: '⌫' }))
    for (const name of ['↓', '→', '→', '→', '↑']) fireEvent.click(palette(name))
    fireEvent.click(runBtn())
    tick(400 * 6)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(strip().cards()).toEqual(['↓', '→', '→', '→', '↑'])
  })

  it('removes the selected card with erase, and appends from the palette', () => {
    render(<ProgramGame question={debug()} aid={false} onAttempt={vi.fn()} />)
    fireEvent.click(screen.getAllByRole('listitem')[0]!)
    fireEvent.click(screen.getByRole('button', { name: '⌫' }))
    expect(strip().cards()).toEqual(['→', '↓'])
    fireEvent.click(palette('→'))
    expect(strip().cards()).toEqual(['→', '↓', '→'])
  })
})

describe('ProgramGame repeat card', () => {
  const wide = { id: 'w', rows: ['S...G'] }

  it('adds a repeat card, cycles its count 2 to 5 and back, and cycles its arrow', () => {
    const onAttempt = vi.fn()
    render(<ProgramGame question={q({ board: wide, palette: ['right', 'repeat'], maxCards: 1, ghost: [] })} aid={false} onAttempt={onAttempt} />)
    fireEvent.click(palette('🔁'))
    const times = () => document.querySelector('.cd-times')!
    expect(times().textContent).toBe('×2')
    fireEvent.click(times())
    fireEvent.click(times())
    expect(times().textContent).toBe('×4')
    fireEvent.click(times())
    expect(times().textContent).toBe('×5')
    fireEvent.click(times())
    expect(times().textContent).toBe('×2')
    const body = document.querySelector('.cd-sub:not(.cd-times):not(.cd-x)')!
    expect(body.textContent).toBe('→')
    fireEvent.click(body)
    expect(body.textContent).toBe('↑')
    fireEvent.click(body)
    fireEvent.click(body)
    fireEvent.click(body)
    expect(body.textContent).toBe('→')
    fireEvent.click(times())
    fireEvent.click(times())
    expect(times().textContent).toBe('×4')
    fireEvent.click(runBtn())
    tick(400 * 5)
    expect(onAttempt.mock.calls).toEqual([[true]])
  })
})

describe('ProgramGame aid', () => {
  it('speaks the hint once when the aid turns on', () => {
    const { rerender } = render(<ProgramGame question={q({ hint: 'code.hint.path' })} aid={false} onAttempt={vi.fn()} />)
    expect(say).not.toHaveBeenCalled()
    rerender(<ProgramGame question={q({ hint: 'code.hint.path' })} aid onAttempt={vi.fn()} />)
    rerender(<ProgramGame question={q({ hint: 'code.hint.path' })} aid onAttempt={vi.fn()} />)
    expect(say).toHaveBeenCalledExactlyOnceWith('code.hint.path')
  })
})
