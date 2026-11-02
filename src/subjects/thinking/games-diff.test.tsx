import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerArt } from '../../ui/pick/art'
import { say } from '../../core/audio/audio'
import { DifferencesGame } from './games-diff'
import { T } from './ids'
import type { DiffQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'think.q.differences': 'find', 'think.q.notHere': 'not here', 'think.q.foundAll': 'all found' },
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))
registerArt({ ball: ({ size }) => <svg width={size} height={size} /> })
afterEach(() => { cleanup(); vi.clearAllMocks() })

const art = { name: 'ball' }
// Items 0 and 2 changed (0 removed, 2 recolored); item 1 is a decoy.
const left = [{ art, x: 20, y: 25 }, { art, x: 50, y: 50 }, { art, x: 80, y: 75 }]
const q: DiffQ = {
  itemKey: 'd', say: T.differences, instruction: T.differences, left,
  right: [null, left[1]!, { art: { name: 'ball', props: { color: 'red' } }, x: 80, y: 75 }],
  answer: [0, 2],
}
// The picture is 400x300 at (0,0): 1% = 4px wide, 3px tall.
const tapAt = (xPct: number, yPct: number) => {
  const pic = screen.getByTestId('diff-right')
  pic.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
  fireEvent.click(pic, { clientX: xPct * 4, clientY: yPct * 3 })
}
const setup = () => {
  const onAttempt = vi.fn()
  render(<DifferencesGame question={q} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}
const rings = () => screen.queryAllByTestId('diff-ring').length

describe('DifferencesGame', () => {
  it('circles a changed item, including a removed one, silently', () => {
    const onAttempt = setup()
    tapAt(22, 27)
    expect(rings()).toBe(1)
    expect(say).not.toHaveBeenCalledWith(T.notHere)
    expect(screen.getByRole('status').textContent).toBe('')
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('says "not here" for a miss, and reports a miss only on every third in a row', () => {
    const onAttempt = setup()
    tapAt(50, 10)
    expect(say).toHaveBeenCalledWith(T.notHere)
    expect(screen.getByRole('status').textContent).toBe('not here')
    tapAt(50, 10)
    expect(onAttempt).not.toHaveBeenCalled()
    tapAt(50, 10)
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false)
    tapAt(50, 10)
    tapAt(50, 10)
    expect(onAttempt).toHaveBeenCalledTimes(1)
    tapAt(50, 10)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('a find resets the run of misses', () => {
    const onAttempt = setup()
    tapAt(50, 10)
    tapAt(50, 10)
    tapAt(80, 75)
    tapAt(50, 10)
    tapAt(50, 10)
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('treats a tap on an unchanged item as a miss', () => {
    setup()
    tapAt(50, 50)
    expect(rings()).toBe(0)
    expect(screen.getByRole('status').textContent).toBe('not here')
  })

  it('finishing reports success exactly once and says found-all', () => {
    const onAttempt = setup()
    tapAt(20, 25)
    tapAt(80, 75)
    tapAt(80, 75)
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
    expect(say).toHaveBeenCalledWith(T.foundAll)
    expect(rings()).toBe(2)
    expect(screen.getByRole('status').textContent).toBe('all found')
  })

  it('works by keyboard through hotspots on every item, decoys included', async () => {
    const onAttempt = setup()
    const spots = screen.getAllByRole('button')
    expect(spots).toHaveLength(3)
    await userEvent.tab()
    expect(document.activeElement).toBe(spots[0])
    await userEvent.keyboard('{Enter}')
    expect(rings()).toBe(1)
    await userEvent.tab()
    await userEvent.keyboard('{Enter}') // decoy
    expect(rings()).toBe(1)
    expect(screen.getByRole('status').textContent).toBe('not here')
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true)
  })
})
