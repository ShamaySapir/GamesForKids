import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { narrate, say, stop } from '../../core/audio/audio'
import { BookGame, OrderGame } from './games'
import type { BookQ, OrderQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: {
    'reading.q.build': 'build', 'reading.ui.slow': 'slow', 'reading.ui.next': 'next', 'reading.ui.back': 'back',
    'reading.ui.questions': 'questions', 'reading.q.readBook': 'start',
  },
  raw: (t: string) => `raw:${t}`,
  say: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
  narrate: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))

beforeEach(() => {
  vi.mocked(say).mockClear()
  vi.mocked(stop).mockClear()
  vi.mocked(narrate).mockReset()
  vi.mocked(narrate).mockImplementation(() => Promise.resolve())
})
afterEach(() => { cleanup(); vi.useRealTimers() })

const orderQ = (layout: 'units' | 'sentences' = 'units'): OrderQ => ({
  itemKey: 'dag', say: 'x', instruction: 'reading.q.build', picture: '🐟', layout,
  answer: ['t1', 't2'],
  tiles: [
    { id: 't2', text: 'גָּ', say: 'reading.unit.g-a' },
    { id: 't1', text: 'דָּ', say: 'reading.unit.d-a' },
  ],
})

const tileButton = (text: string) => screen.getByRole('button', { name: text })
const slotCount = (c: HTMLElement) => c.querySelectorAll('.rb-slot').length

describe('OrderGame', () => {
  it('places tiles in order and reports success once', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<OrderGame question={orderQ()} aid={false} onAttempt={onAttempt} />)
    expect(slotCount(container)).toBe(2)
    await userEvent.click(tileButton('דָּ'))
    expect(onAttempt).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.rb-slot.filled')).toHaveLength(1)
    await userEvent.click(tileButton('גָּ'))
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(container.querySelector('.rb-assembled')).toHaveTextContent('דָּגָּ')
    expect(container.querySelectorAll('.rb-tile')).toHaveLength(0)
  })

  it('shakes a wrong tile, keeps it in the tray and reports a miss', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<OrderGame question={orderQ()} aid={false} onAttempt={onAttempt} />)
    const wrong = tileButton('גָּ')
    await userEvent.click(wrong)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(wrong).toHaveClass('bad')
    expect(container.querySelectorAll('.rb-slot.filled')).toHaveLength(0)
    expect(container.querySelectorAll('.rb-tile')).toHaveLength(2)
    await userEvent.click(tileButton('דָּ'))
    await userEvent.click(tileButton('גָּ'))
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('works by keyboard: Tab to a tile, Enter places it', async () => {
    const onAttempt = vi.fn()
    render(<OrderGame question={orderQ()} aid={false} onAttempt={onAttempt} />)
    await userEvent.tab()
    expect(tileButton('גָּ')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt.mock.calls).toEqual([[false]])
    await userEvent.tab()
    await userEvent.tab()
    expect(tileButton('דָּ')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.tab()
    expect(tileButton('גָּ')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('ignores input after completion', async () => {
    const onAttempt = vi.fn()
    render(<OrderGame question={{ ...orderQ(), answer: ['t1'], tiles: orderQ().tiles.filter(t => t.id === 't1') }} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(tileButton('דָּ'))
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(screen.queryByRole('button', { name: 'דָּ' })).toBeNull()
  })

  it('plays a tile sound with its speaker without placing it', async () => {
    const onAttempt = vi.fn()
    render(<OrderGame question={orderQ()} aid={false} onAttempt={onAttempt} />)
    const [first] = screen.getAllByRole('button', { name: '🔊' })
    if (!first) throw new Error('no speaker')
    await userEvent.click(first)
    expect(say).toHaveBeenCalledWith('reading.unit.g-a')
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('drags a tile onto a slot with the same rule', () => {
    const onAttempt = vi.fn()
    const { container } = render(<OrderGame question={orderQ()} aid={false} onAttempt={onAttempt} />)
    const slot = container.querySelector<HTMLElement>('.rb-slot')
    if (!slot) throw new Error('no slot')
    slot.getBoundingClientRect = () => ({ left: 100, right: 200, top: 100, bottom: 200, width: 100, height: 100, x: 100, y: 100, toJSON: () => '' })
    const drag = (text: string, x: number, y: number) => {
      const t = tileButton(text)
      fireEvent.pointerDown(t, { clientX: 0, clientY: 0, pointerId: 1, pointerType: 'touch' })
      fireEvent.pointerMove(t, { clientX: 40, clientY: 40, pointerId: 1, pointerType: 'touch' })
      fireEvent.pointerUp(t, { clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' })
      fireEvent.click(t)
    }
    drag('גָּ', 150, 150)
    expect(onAttempt.mock.calls).toEqual([[false]])
    drag('דָּ', 150, 150)
    expect(container.querySelectorAll('.rb-slot.filled')).toHaveLength(1)
    // Dropping outside every slot does nothing.
    const t = tileButton('גָּ')
    fireEvent.pointerDown(t, { clientX: 0, clientY: 0, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerMove(t, { clientX: 40, clientY: 40, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerUp(t, { clientX: 900, clientY: 900, pointerId: 1, pointerType: 'touch' })
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('numbers the slots in the sentences layout', () => {
    const { container } = render(<OrderGame question={orderQ('sentences')} aid={false} onAttempt={vi.fn()} />)
    expect([...container.querySelectorAll('.rb-num')].map(n => n.textContent)).toEqual(['1', '2'])
    expect(container.querySelector('.rb-slots-sentences')).not.toBeNull()
  })
})

const bookQ: BookQ = {
  itemKey: 'b1', answer: null, say: 'x',
  book: {
    id: 'b1', title: 'ספר', cover: '📕', stage: 1,
    pages: [
      { text: 'דָּג גָּדוֹל', scene: '🐟' },
      { text: 'דָּגָה קְטַנָּה', scene: '🐠' },
    ],
    questions: [
      { prompt: 'שאלה א', options: [{ scene: '🐟' }, { scene: '🐠' }, { text: 'טקסט' }], answer: 1 },
      { prompt: 'שאלה ב', options: [{ scene: '🐟' }, { scene: '🐠' }, { text: 'טקסט' }], answer: 2 },
    ],
  },
}

const start = () => userEvent.click(screen.getByRole('button', { name: 'start' }))

describe('BookGame', () => {
  it('shows the cover, reads the title and starts', async () => {
    render(<BookGame question={bookQ} aid={false} onAttempt={vi.fn()} />)
    expect(screen.getByRole('heading')).toHaveTextContent('ספר')
    await userEvent.click(screen.getByRole('button', { name: '🔊' }))
    expect(say).toHaveBeenCalledWith('reading.book.b1.title')
    await start()
    expect(screen.getByRole('button', { name: 'דָּג' })).toBeInTheDocument()
  })

  it('pages forward and back and stops narration on page change', async () => {
    render(<BookGame question={bookQ} aid={false} onAttempt={vi.fn()} />)
    await start()
    expect(screen.getByRole('status', { name: '1 / 2' })).toBeInTheDocument()
    vi.mocked(stop).mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'next' }))
    expect(stop).toHaveBeenCalled()
    expect(screen.getByRole('status', { name: '2 / 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'דָּגָה' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'questions' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'back' }))
    expect(screen.getByRole('status', { name: '1 / 2' })).toBeInTheDocument()
  })

  it('narrates the page and highlights the word reported by the callback', async () => {
    let onWord: (i: number) => void = () => {}
    let finish: () => void = () => {}
    vi.mocked(narrate).mockImplementation((_id, cb) => { onWord = cb; return new Promise<void>(r => { finish = r }) })
    const { container } = render(<BookGame question={bookQ} aid={false} onAttempt={vi.fn()} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: '🔊' }))
    expect(narrate).toHaveBeenCalledWith('reading.book.b1.0', expect.any(Function), 1)
    act(() => onWord(0))
    expect(container.querySelectorAll('.rb-word.hl')).toHaveLength(1)
    expect(container.querySelector('.rb-word.hl')).toHaveTextContent('דָּג')
    act(() => onWord(1))
    expect(container.querySelector('.rb-word.hl')).toHaveTextContent('גָּדוֹל')
    await act(async () => { finish() })
    expect(container.querySelector('.rb-word.hl')).toBeNull()
  })

  it('narrates slowly when the slow toggle is on', async () => {
    render(<BookGame question={bookQ} aid={false} onAttempt={vi.fn()} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: /slow/ }))
    await userEvent.click(screen.getByRole('button', { name: '🔊' }))
    expect(narrate).toHaveBeenCalledWith('reading.book.b1.0', expect.any(Function), 0.75)
  })

  it('says a tapped word and stops narration when leaving or unmounting', async () => {
    const { unmount } = render(<BookGame question={bookQ} aid={false} onAttempt={vi.fn()} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: 'גָּדוֹל' }))
    expect(say).toHaveBeenCalledWith('raw:גָּדוֹל')
    vi.mocked(stop).mockClear()
    unmount()
    expect(stop).toHaveBeenCalled()
  })

  it('runs the questions: wrong disables and misses, right advances, one success at the end', async () => {
    const onAttempt = vi.fn()
    render(<BookGame question={bookQ} aid={false} onAttempt={onAttempt} />)
    await start()
    await userEvent.click(screen.getByRole('button', { name: 'next' }))
    await userEvent.click(screen.getByRole('button', { name: 'questions' }))
    expect(screen.getByText('שאלה א')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔊' })).toBeInTheDocument()

    const wrong = screen.getByRole('button', { name: '🐟' })
    await userEvent.click(wrong)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(wrong).toBeDisabled()

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: '🐠' }))
    expect(onAttempt).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('שאלה ב')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '🐟' }))
    expect(onAttempt.mock.calls).toEqual([[false], [false]])
    fireEvent.click(screen.getByRole('button', { name: 'טקסט' }))
    fireEvent.click(screen.getByRole('button', { name: 'טקסט' }))
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onAttempt.mock.calls).toEqual([[false], [false], [true]])
  })
})
