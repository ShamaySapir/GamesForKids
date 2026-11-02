import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MazeGame } from './games-maze'
import { T } from './ids'
import type { MazeQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'think.q.maze': 'help' },
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))
afterEach(cleanup)

// S . #
// # . .
// # # G
const q: MazeQ = {
  itemKey: 'mz', answer: null, say: T.maze, instruction: T.maze,
  maze: { id: 'mz', rows: ['S.#', '#..', '##G'], hero: '🐭', goal: '🧀' },
}
const cellEl = (r: number, c: number) => document.querySelector(`[data-cell="${r},${c}"]`) as HTMLElement
const heroAt = (r: number, c: number) => expect(cellEl(r, c).textContent).toBe('🐭')
const setup = () => {
  const onAttempt = vi.fn()
  render(<MazeGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}

describe('MazeGame', () => {
  it('starts on S with the goal drawn', () => {
    setup()
    heroAt(0, 0)
    expect(cellEl(2, 2).textContent).toBe('🧀')
  })

  it('walls and edges block silently', () => {
    const onAttempt = setup()
    const maze = screen.getByRole('group')
    fireEvent.keyDown(maze, { key: 'ArrowDown' }) // wall
    fireEvent.keyDown(maze, { key: 'ArrowLeft' }) // edge
    fireEvent.keyDown(maze, { key: 'ArrowUp' })
    heroAt(0, 0)
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('moves with arrow keys, keeps the walked path highlighted, and finishes once', () => {
    const onAttempt = setup()
    const maze = screen.getByRole('group')
    fireEvent.keyDown(maze, { key: 'ArrowRight' })
    heroAt(0, 1)
    expect(cellEl(0, 0).className).toContain('walked')
    fireEvent.keyDown(maze, { key: 'ArrowDown' })
    fireEvent.keyDown(maze, { key: 'ArrowRight' })
    expect(onAttempt).not.toHaveBeenCalled()
    fireEvent.keyDown(maze, { key: 'ArrowDown' })
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
    fireEvent.keyDown(maze, { key: 'ArrowUp' })
    heroAt(2, 2)
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('moves with the on-screen arrow buttons', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: '→' }))
    heroAt(0, 1)
    await userEvent.click(screen.getByRole('button', { name: '↓' }))
    heroAt(1, 1)
    await userEvent.click(screen.getByRole('button', { name: '←' }))
    expect(cellEl(1, 0).textContent).toBe('')
    heroAt(1, 1)
    await userEvent.click(screen.getByRole('button', { name: '↑' }))
    heroAt(0, 1)
  })

  it('moves by tapping an adjacent path cell, ignoring far cells', async () => {
    setup()
    await userEvent.click(cellEl(1, 1)) // diagonal, ignored
    heroAt(0, 0)
    await userEvent.click(cellEl(0, 1))
    heroAt(0, 1)
  })

  it('moves by swiping', () => {
    setup()
    const maze = screen.getByRole('group')
    fireEvent.pointerDown(maze, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(maze, { clientX: 80, clientY: 14 })
    heroAt(0, 1)
    fireEvent.pointerDown(maze, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(maze, { clientX: 12, clientY: 90 })
    heroAt(1, 1)
  })

  it('arrow buttons are at least 64px', () => {
    setup()
    expect(document.querySelectorAll('.tk-maze-arrow')).toHaveLength(4)
  })
})
