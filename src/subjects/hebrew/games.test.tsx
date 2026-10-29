import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { ClapGame, PickGame, SortGame } from './games'
import type { ClapQ, PickQ, SortQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: {},
  say: vi.fn(() => Promise.resolve()),
  sfx: { good: vi.fn(), oops: vi.fn(), tick: vi.fn(), win: vi.fn() },
}))

beforeEach(() => vi.mocked(say).mockClear())

const nth = (c: HTMLElement, sel: string, i: number) => {
  const el = c.querySelectorAll<HTMLElement>(sel)[i]
  if (!el) throw new Error(`${sel}[${i}] not found`)
  return el
}
afterEach(() => { cleanup(); vi.useRealTimers() })

const pickQ: PickQ = {
  itemKey: 'kadur', answer: 'b', say: 'x', instruction: 'hebrew.q.rhyme',
  prompt: { picture: '⚽' },
  options: [
    { id: 'a', kind: 'picture', emoji: '🍎', say: 'hebrew.word.tapuach' },
    { id: 'b', kind: 'picture', emoji: '🚪', say: 'hebrew.word.delet' },
    { id: 'c', kind: 'sound', label: 'מ', say: 'hebrew.sound.m' },
  ],
}

describe('PickGame', () => {
  it('disables a wrong option and reports a miss', async () => {
    const onAttempt = vi.fn()
    render(<PickGame question={pickQ} aid={false} onAttempt={onAttempt} />)
    const wrong = screen.getByRole('button', { name: '🍎' })
    await userEvent.click(wrong)
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false)
    expect(wrong).toBeDisabled()
    expect(wrong).toHaveClass('bad')
    await userEvent.click(wrong)
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('reports a hit once and then ignores input', async () => {
    const onAttempt = vi.fn()
    render(<PickGame question={pickQ} aid={false} onAttempt={onAttempt} />)
    const right = screen.getByRole('button', { name: '🚪' })
    await userEvent.click(right)
    expect(right).toHaveClass('ok')
    await userEvent.click(right)
    await userEvent.click(screen.getByRole('button', { name: '🍎' }))
    expect(onAttempt.mock.calls).toEqual([[true]])
  })

  it('plays the sound without answering: small speaker click and 400ms hover', async () => {
    vi.useFakeTimers()
    const onAttempt = vi.fn()
    const { container } = render(<PickGame question={pickQ} aid={false} onAttempt={onAttempt} />)
    const speakers = container.querySelectorAll('.hb-say')
    expect(speakers).toHaveLength(3)
    fireEvent.click(nth(container, '.hb-say', 2))
    expect(say).toHaveBeenLastCalledWith('hebrew.sound.m')

    const wrap = nth(container, '.hb-opt-wrap', 0)
    fireEvent.pointerEnter(wrap, { pointerType: 'mouse' })
    act(() => { vi.advanceTimersByTime(300) })
    expect(say).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(150) })
    expect(say).toHaveBeenLastCalledWith('hebrew.word.tapuach')
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('does not hover-play when the pointer leaves early', () => {
    vi.useFakeTimers()
    const { container } = render(<PickGame question={pickQ} aid={false} onAttempt={vi.fn()} />)
    const wrap = nth(container, '.hb-opt-wrap', 0)
    fireEvent.pointerEnter(wrap, { pointerType: 'mouse' })
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.pointerLeave(wrap)
    act(() => { vi.advanceTimersByTime(500) })
    expect(say).not.toHaveBeenCalled()
  })

  it('shows letter options and a blank at the start of a word', () => {
    const q: PickQ = {
      ...pickQ,
      prompt: { word: { text: 'בַּיִת', blank: 'start' } },
      options: [{ id: 'a', kind: 'letter', label: 'ב' }, { id: 'b', kind: 'letter', label: 'כ' }],
    }
    const { container } = render(<PickGame question={q} aid={false} onAttempt={vi.fn()} />)
    const word = container.querySelector('.hb-word')
    expect(word?.firstElementChild).toHaveClass('hb-blank')
    expect(container.querySelectorAll('.hb-say')).toHaveLength(0)
  })

  it('speaks the hint once when the aid turns on', () => {
    const q: PickQ = { ...pickQ, hint: 'hebrew.hint' }
    const { rerender, container } = render(<PickGame question={q} aid={false} onAttempt={vi.fn()} />)
    expect(container.querySelector('.hb-hint')).toBeNull()
    expect(say).not.toHaveBeenCalled()
    rerender(<PickGame question={q} aid onAttempt={vi.fn()} />)
    expect(say).toHaveBeenCalledExactlyOnceWith('hebrew.hint')
    expect(container.querySelector('.hb-hint')).not.toBeNull()
  })
})

const clapQ: ClapQ = {
  itemKey: 'kadur', answer: 2, say: 'x', syllablesSay: 'hebrew.syl.kadur',
  word: {
    id: 'kadur', text: 'כַּדּוּר', emoji: '⚽', syllables: ['כַּ', 'דּוּר'], opening: 'כַּ', first: 'k', last: 'r',
  },
}

const lit = (c: HTMLElement) => c.querySelectorAll('.hb-clap-dot.on').length

describe('ClapGame', () => {
  it('accepts the right number of claps', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<ClapGame question={clapQ} aid={false} onAttempt={onAttempt} />)
    const drum = screen.getByRole('button', { name: '🥁' })
    await userEvent.click(drum)
    await userEvent.click(drum)
    expect(lit(container)).toBe(2)
    await userEvent.click(container.querySelector('.cta') as HTMLElement)
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(drum).toBeDisabled()
  })

  it('reports a miss and clears the claps on a wrong count', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<ClapGame question={clapQ} aid={false} onAttempt={onAttempt} />)
    const drum = screen.getByRole('button', { name: '🥁' })
    await userEvent.click(drum)
    await userEvent.click(container.querySelector('.cta') as HTMLElement)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(lit(container)).toBe(0)
  })

  it('claps with Space, ignores key repeat, and stops at six', async () => {
    const { container } = render(<ClapGame question={clapQ} aid={false} onAttempt={vi.fn()} />)
    fireEvent.keyDown(document.body, { key: ' ' })
    fireEvent.keyDown(document.body, { key: ' ', repeat: true })
    expect(lit(container)).toBe(1)
    for (let i = 0; i < 9; i++) fireEvent.keyDown(document.body, { key: ' ' })
    expect(lit(container)).toBe(6)
  })

  it('claps once per Space press when the drum has focus', async () => {
    const { container } = render(<ClapGame question={clapQ} aid={false} onAttempt={vi.fn()} />)
    screen.getByRole('button', { name: '🥁' }).focus()
    await userEvent.keyboard(' ')
    expect(lit(container)).toBe(1)
  })

  it('resets the claps and does not check with none', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<ClapGame question={clapQ} aid={false} onAttempt={onAttempt} />)
    const check = container.querySelector('.cta') as HTMLButtonElement
    expect(check).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '🥁' }))
    await userEvent.click(container.querySelector('.pill') as HTMLElement)
    expect(lit(container)).toBe(0)
    expect(check).toBeDisabled()
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('shows syllables and plays them when the aid is on', async () => {
    const { container, rerender } = render(<ClapGame question={clapQ} aid={false} onAttempt={vi.fn()} />)
    expect(container.querySelectorAll('.hb-syl')).toHaveLength(0)
    rerender(<ClapGame question={clapQ} aid onAttempt={vi.fn()} />)
    expect(container.querySelectorAll('.hb-syl')).toHaveLength(2)
    await userEvent.click(container.querySelector('.hb-say-wide') as HTMLElement)
    expect(say).toHaveBeenLastCalledWith('hebrew.syl.kadur')
  })
})

const sortQ: SortQ = {
  itemKey: 'b', answer: null, say: 'x', bins: ['בּ', 'ב'],
  cards: [
    { id: 'w1', emoji: '🍌', text: 'בָּנָנָה', say: 'hebrew.word.banana', bin: 0 },
    { id: 'w2', emoji: '🐘', text: 'פִּיל', say: 'hebrew.word.pil', bin: 1 },
    { id: 'w3', emoji: '🚪', text: 'דֶּלֶת', say: 'hebrew.word.delet', bin: 0 },
  ],
}
const card = (id: string) => {
  const text = sortQ.cards.find(c => c.id === id)?.text ?? ''
  const el = Array.from(document.querySelectorAll<HTMLButtonElement>('.hb-card')).find(b => b.textContent?.includes(text))
  if (!el) throw new Error(`card ${id} not in the tray`)
  return el
}
const basket = (i: number) => screen.getByRole('button', { name: sortQ.bins[i] })

describe('SortGame', () => {
  it('sorts by click card then click basket, one success at the end', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<SortGame question={sortQ} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(card('w1'))
    expect(say).toHaveBeenLastCalledWith('hebrew.word.banana')
    await userEvent.click(basket(0))
    await userEvent.click(card('w2'))
    await userEvent.click(basket(1))
    expect(onAttempt).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.hb-chip')).toHaveLength(2)
    await userEvent.click(card('w3'))
    await userEvent.click(basket(0))
    expect(onAttempt.mock.calls).toEqual([[true]])
    expect(container.querySelectorAll('.hb-tray .hb-card')).toHaveLength(0)
  })

  it('returns a wrongly dropped card and reports a miss', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<SortGame question={sortQ} aid={false} onAttempt={onAttempt} />)
    await userEvent.click(card('w1'))
    await userEvent.click(basket(1))
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(card('w1')).toHaveClass('bad')
    expect(card('w1')).not.toHaveClass('sel')
    expect(container.querySelectorAll('.hb-chip')).toHaveLength(0)
  })

  it('plays the card sound without selecting or placing it', async () => {
    const { container } = render(<SortGame question={sortQ} aid={false} onAttempt={vi.fn()} />)
    await userEvent.click(nth(container, '.hb-say', 1))
    expect(say).toHaveBeenLastCalledWith('hebrew.word.pil')
    expect(container.querySelector('.hb-card.sel')).toBeNull()
  })

  it('sorts by keyboard: Enter selects, arrows aim (right = first basket), Enter drops', async () => {
    const onAttempt = vi.fn()
    const { container } = render(<SortGame question={sortQ} aid={false} onAttempt={onAttempt} />)
    card('w1').focus()
    await userEvent.keyboard('{Enter}')
    expect(card('w1')).toHaveClass('sel')
    await userEvent.keyboard('{ArrowLeft}{Enter}')
    expect(onAttempt.mock.calls).toEqual([[false]])

    card('w1').focus()
    await userEvent.keyboard('{Enter}{ArrowRight}')
    expect(container.querySelector('.hb-basket.aim .hb-basket-label')).toHaveAccessibleName('בּ')
    await userEvent.keyboard('{Enter}')
    expect(container.querySelectorAll('.hb-chip')).toHaveLength(1)

    card('w2').focus()
    await userEvent.keyboard('{Enter}{ArrowLeft}{Enter}')
    card('w3').focus()
    await userEvent.keyboard('{Enter}{ArrowRight}{Enter}')
    expect(onAttempt.mock.calls).toEqual([[false], [true]])
  })

  it('drags a card into a basket with pointer events', () => {
    const onAttempt = vi.fn()
    const { container } = render(<SortGame question={sortQ} aid={false} onAttempt={onAttempt} />)
    const rect = (l: number) => ({ left: l, right: l + 100, top: 0, bottom: 100, width: 100, height: 100, x: l, y: 0, toJSON: () => ({}) })
        vi.spyOn(nth(container, '.hb-basket', 0), 'getBoundingClientRect').mockReturnValue(rect(200))
    vi.spyOn(nth(container, '.hb-basket', 1), 'getBoundingClientRect').mockReturnValue(rect(0))
    const el = card('w1')
    fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 300 })
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 150 })
    fireEvent.pointerMove(el, { pointerId: 1, pointerType: 'touch', clientX: 250, clientY: 50 })
    fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', clientX: 250, clientY: 50 })
    fireEvent.click(el)
    expect(container.querySelectorAll('.hb-chip')).toHaveLength(1)
    expect(onAttempt).not.toHaveBeenCalled()

    // Dropping into the other basket is a miss.
    const el2 = card('w3')
    fireEvent.pointerDown(el2, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 300 })
    fireEvent.pointerMove(el2, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 50 })
    fireEvent.pointerUp(el2, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 50 })
    fireEvent.click(el2)
    expect(onAttempt.mock.calls).toEqual([[false]])
    expect(card('w3')).not.toHaveClass('sel')
  })
})
