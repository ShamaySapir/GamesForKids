import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { AreaModelGame, placeParts } from './games-area-model'
import { FractionPadGame, sameFraction, strictlyBetween } from './games-fraction'
import { gridShape, ShadeGame } from './games-shade'
import { M4 } from './ids'
import type { AreaModelQ, FractionPadQ, ShadeQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.areaModel': 'area', 'math.ui.total': 'total', 'math.ui.numerator': 'numerator', 'math.ui.denominator': 'denominator', 'math.ui.whole': 'whole', 'math.ui.check': 'check' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const key = (k: string) => userEvent.click(screen.getByRole('button', { name: k }))
const type = async (s: string) => { for (const c of s) await key(c) }
const checkBtn = () => screen.getByRole('button', { name: 'check' })

describe('placeParts', () => {
  it('splits into non-zero place values', () => {
    expect(placeParts(34)).toEqual([30, 4])
    expect(placeParts(203)).toEqual([200, 3])
    expect(placeParts(6)).toEqual([6])
  })
})

describe('AreaModelGame', () => {
  const q: AreaModelQ = { itemKey: 'area:34x6', answer: 204, say: 'x', instruction: M4.areaModel, hint: M4.areaModelHint, a: 34, b: 6 }
  const setup = (aid = false) => {
    const onAttempt = vi.fn()
    render(<AreaModelGame question={q} aid={aid} onAttempt={onAttempt} />)
    return onAttempt
  }
  const slot = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}:`) })

  it('draws the parts and keeps Check disabled until every box is filled', async () => {
    setup()
    expect(document.querySelector('.g4-area')).toHaveAttribute('dir', 'ltr')
    expect([...document.querySelectorAll('.g4-part')].map(p => p.textContent)).toEqual(['30', '4', '6'])
    expect(checkBtn()).toBeDisabled()
    await userEvent.keyboard('18')
    expect(slot('30 × 6')).toHaveTextContent('18')
  })

  it('by keyboard: Enter moves on, a wrong box is marked and kept, then the fix passes', async () => {
    const onAttempt = setup()
    await userEvent.keyboard('180{Enter}25{Enter}204{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(slot('30 × 6')).not.toHaveClass('bad')
    expect(slot('4 × 6')).toHaveClass('bad')
    expect(slot('4 × 6')).toHaveTextContent('25')
    await userEvent.click(slot('4 × 6'))
    await userEvent.keyboard('24')
    expect(slot('4 × 6')).toHaveTextContent('24') // the first digit replaced the wrong value
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('with the pad: the check mark moves on, and on the last box it checks once', async () => {
    const onAttempt = setup()
    await type('180')
    await key('✓')
    await type('24')
    await key('✓')
    await type('204')
    await key('✓')
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    await userEvent.keyboard('{Enter}')
    expect(onAttempt).toHaveBeenCalledTimes(1)
  })

  it('marks a wrong total', async () => {
    const onAttempt = setup()
    await userEvent.keyboard('180{Enter}24{Enter}200{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(document.querySelectorAll('.g4-slot.bad')).toHaveLength(1)
  })

  it('with the aid on shows each cell as tens × ones and speaks the hint', () => {
    setup(true)
    expect(say).toHaveBeenCalledWith(M4.areaModelHint)
    expect([...document.querySelectorAll('.g4-small')].map(s => s.textContent)).toEqual(['30 × 6', '4 × 6'])
  })
})

describe('ShadeGame', () => {
  const mk = (shape: ShadeQ['shape'], parts = 5, answer = 3): ShadeQ =>
    ({ itemKey: `shade:${shape}`, answer, say: 'x', instruction: M4.shade, hint: M4.areaModelHint, shape, parts, show: `${answer}/${parts}` })
  const setup = (q: ShadeQ, aid = false) => {
    const onAttempt = vi.fn()
    render(<ShadeGame question={q} aid={aid} onAttempt={onAttempt} />)
    return onAttempt
  }

  it('picks a near-square grid', () => {
    expect(gridShape(6)).toEqual([2, 3])
    expect(gridShape(12)).toEqual([3, 4])
    expect(gridShape(5)).toEqual([1, 5])
  })

  it('shows the stacked fraction and toggles strip parts by tap; a wrong count keeps the shading', async () => {
    const onAttempt = setup(mk('strip'))
    expect(document.querySelector('.frac')).toBeTruthy()
    const cells = document.querySelectorAll<HTMLElement>('.g4-part-btn')
    expect(cells).toHaveLength(5)
    await userEvent.click(cells[0]!)
    await userEvent.click(cells[1]!)
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(cells[0]).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(cells[4]!)
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(cells[2]).toBeDisabled()
  })

  it('circle wedges work by keyboard (Space and Enter) and any three of five count', async () => {
    const onAttempt = setup(mk('circle'))
    const wedges = document.querySelectorAll<SVGPathElement>('.g4-wedge')
    expect(wedges).toHaveLength(5)
    expect(wedges[0]).toHaveAttribute('role', 'button')
    wedges[1]!.focus()
    await userEvent.keyboard(' ')
    wedges[3]!.focus()
    await userEvent.keyboard('{Enter}')
    wedges[4]!.focus()
    await userEvent.keyboard(' ')
    expect(wedges[1]).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('draws a rect grid, untoggles on a second tap and shows the counter with the aid', async () => {
    setup(mk('rect', 6, 2), true)
    expect(say).toHaveBeenCalledWith(M4.areaModelHint)
    const cells = document.querySelectorAll<HTMLElement>('.g4-part-btn')
    expect(cells).toHaveLength(6)
    await userEvent.click(cells[0]!)
    await userEvent.click(cells[1]!)
    expect(screen.getByRole('status')).toHaveTextContent('2 / 6')
    await userEvent.click(cells[1]!)
    expect(screen.getByRole('status')).toHaveTextContent('1 / 6')
  })
})

describe('ShadeGame in 2D', () => {
  const q: ShadeQ = { itemKey: 'shade:2d', answer: 2, say: 'x', instruction: M4.shade, hint: M4.areaModelHint, shape: 'rect', parts: 12, rows: 3, cols: 4, bands: [2, 1], show: '2/3 x 1/4' }
  it('draws rows x cols, tints the bands (overlap has both) and counts the shaded cells', async () => {
    const onAttempt = vi.fn()
    render(<ShadeGame question={q} aid={false} onAttempt={onAttempt} />)
    const cells = document.querySelectorAll<HTMLElement>('.g4-part-btn')
    expect(cells).toHaveLength(12)
    expect(document.querySelector<HTMLElement>('.g4-shape')!.style.gridTemplateColumns).toBe('repeat(4, 1fr)')
    expect(document.querySelectorAll('.br')).toHaveLength(8) // first 2 rows of 4
    expect(document.querySelectorAll('.bc')).toHaveLength(3) // first column of 3 rows
    expect(document.querySelectorAll('.br.bc')).toHaveLength(2)
    await userEvent.click(cells[0]!)
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    await userEvent.click(cells[4]!)
    await userEvent.click(checkBtn())
    expect(onAttempt).toHaveBeenLastCalledWith(true)
  })
})

describe('FractionPadGame', () => {
  const mk = (over: Partial<FractionPadQ> = {}): FractionPadQ => ({
    itemKey: 'frac:1/2', answer: { num: 1, den: 2 }, say: 'x', instruction: M4.areaModel, hint: M4.areaModelHint,
    prompt: { expr: '1/4 + 1/4 = ?' }, mixed: false, aidStrips: ['1/4', '1/4'], ...over,
  })
  const setup = (q: FractionPadQ, aid = false) => {
    const onAttempt = vi.fn()
    render(<FractionPadGame question={q} aid={aid} onAttempt={onAttempt} />)
    return onAttempt
  }
  const box = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}:`) })

  it('compares by value', () => {
    expect(sameFraction({ whole: 0, num: 2, den: 4 }, { num: 1, den: 2 })).toBe(true)
    expect(sameFraction({ whole: 0, num: 5, den: 4 }, { whole: 1, num: 1, den: 4 })).toBe(true)
    expect(sameFraction({ whole: 1, num: 1, den: 4 }, { num: 5, den: 4 })).toBe(true)
    expect(sameFraction({ whole: 0, num: 1, den: 3 }, { num: 1, den: 2 })).toBe(false)
  })

  it('by keyboard: digits fill the box, arrows switch, a wrong try is kept, then the fix passes', async () => {
    const onAttempt = setup(mk())
    await userEvent.keyboard('1{ArrowDown}3{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(box('denominator')).toHaveTextContent('3')
    await userEvent.keyboard('{Backspace}2{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
  })

  it('accepts 2/4 for 1/2 using the pad, and ignores an empty or zero denominator', async () => {
    const onAttempt = setup(mk())
    await key('✓')
    await type('2')
    await userEvent.click(box('denominator'))
    await type('0')
    await key('✓')
    expect(onAttempt).not.toHaveBeenCalled()
    await key('⌫')
    await type('4')
    await key('✓')
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('rejects 2/4 when only the simplest form counts', async () => {
    const onAttempt = setup(mk({ simplest: true }))
    await userEvent.keyboard('2{ArrowDown}4{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
  })

  it('mixed: the whole box comes first, and 5/4 equals 1 1/4', async () => {
    const onAttempt = setup(mk({ mixed: true, answer: { whole: 1, num: 1, den: 4 } }))
    expect(box('whole')).toHaveClass('cur')
    await userEvent.keyboard('{ArrowRight}5{ArrowDown}4{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(true)
  })

  it('mixed with simplest rejects an improper remainder', async () => {
    const onAttempt = setup(mk({ mixed: true, simplest: true, answer: { whole: 1, num: 1, den: 4 } }))
    await userEvent.keyboard('0{ArrowRight}5{ArrowDown}4{Enter}')
    expect(onAttempt).toHaveBeenLastCalledWith(false)
  })

  it('with the aid on draws the strips and speaks the hint; without it none', () => {
    setup(mk(), true)
    expect(say).toHaveBeenCalledWith(M4.areaModelHint)
    expect(document.querySelectorAll('.g4-strip')).toHaveLength(2)
    cleanup()
    setup(mk())
    expect(document.querySelectorAll('.g4-strip')).toHaveLength(0)
  })
})

describe('FractionPadGame between', () => {
  const q: FractionPadQ = {
    itemKey: 'btw', answer: { num: 3, den: 8 }, say: 'x', instruction: M4.areaModel, mixed: false,
    prompt: { expr: '1/4 < ? < 1/2' }, between: [{ num: 1, den: 4 }, { num: 1, den: 2 }],
  }
  const run = async (keys: string) => {
    const onAttempt = vi.fn()
    render(<FractionPadGame question={q} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard(keys)
    return onAttempt
  }

  it('accepts any fraction strictly between, not just the example', async () => {
    expect(await run('2{ArrowDown}5{Enter}')).toHaveBeenLastCalledWith(true)
    cleanup()
    expect(await run('3{ArrowDown}8{Enter}')).toHaveBeenLastCalledWith(true)
    cleanup()
    expect(await run('5{ArrowDown}16{Enter}')).toHaveBeenLastCalledWith(true)
  })

  it('rejects the ends and anything outside; a zero denominator is not an attempt', async () => {
    expect(await run('1{ArrowDown}4{Enter}')).toHaveBeenLastCalledWith(false)
    cleanup()
    expect(await run('2{ArrowDown}4{Enter}')).toHaveBeenLastCalledWith(false)
    cleanup()
    expect(await run('3{ArrowDown}4{Enter}')).toHaveBeenLastCalledWith(false)
    cleanup()
    expect(await run('1{ArrowDown}0{Enter}')).not.toHaveBeenCalled()
  })

  it('strictlyBetween works with either order of the ends and with wholes', () => {
    expect(strictlyBetween({ whole: 0, num: 3, den: 8 }, [{ num: 1, den: 2 }, { num: 1, den: 4 }])).toBe(true)
    expect(strictlyBetween({ whole: 1, num: 1, den: 4 }, [{ whole: 1, num: 0, den: 1 }, { num: 3, den: 2 }])).toBe(true)
  })
})
