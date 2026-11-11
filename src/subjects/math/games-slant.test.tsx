import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { say } from '../../core/audio/audio'
import { SlantAreaGame, slantInfo } from './games-slant'
import { M5 } from './ids'
import type { SlantAreaQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.triangleArea': 'area', 'math.hint.triangleArea': 'hint' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(() => { cleanup(); vi.mocked(say).mockClear() })

const base = { itemKey: 'slant:x', say: 'x', instruction: M5.triangleArea, hint: M5.triangleAreaHint, cols: 8, rows: 5 } as const
// Acute triangle: base 6 on the bottom line, height 4. Area 12.
const tri: SlantAreaQ = { ...base, answer: 12, points: [[1, 4], [7, 4], [3, 0]], base: [0, 1], apex: 2, foot: [3, 4] }
// Obtuse: the foot is left of the base. Base 4, height 3: area 6.
const obtuse: SlantAreaQ = { ...base, answer: 6, points: [[3, 4], [7, 4], [1, 1]], base: [0, 1], apex: 2, foot: [1, 4] }
// Parallelogram: base 5, height 3: area 15.
const para: SlantAreaQ = { ...base, answer: 15, instruction: M5.parallelogramArea, points: [[0, 4], [5, 4], [7, 1], [2, 1]], base: [0, 1], apex: 3, foot: [2, 4] }

const key = (k: string) => screen.getByRole('button', { name: k })
const type = async (s: string) => { for (const c of s) await userEvent.click(key(c)) }
const labels = () => [...document.querySelectorAll('.g5s-len')].map(t => t.textContent)

describe('slantInfo', () => {
  it('computes base, height and whether the foot is outside', () => {
    expect(slantInfo(tri)).toMatchObject({ baseLen: 6, height: 4, outside: false })
    expect(slantInfo(obtuse)).toMatchObject({ baseLen: 4, height: 3, outside: true })
  })
  it('the surrounding rectangle has area b × h', () => {
    for (const q of [tri, obtuse, para]) {
      const r = slantInfo(q).rectangle
      const w = Math.hypot(r[1]![0] - r[0]![0], r[1]![1] - r[0]![1])
      const h = Math.hypot(r[3]![0] - r[0]![0], r[3]![1] - r[0]![1])
      expect(w * h).toBeCloseTo(q.answer * (q.points.length === 3 ? 2 : 1))
    }
  })
  it('a parallelogram whose foot is inside the base gets the cut piece, a triangle never', () => {
    expect(slantInfo(tri).cut).toBeNull()
    expect(slantInfo(para).cut).toEqual([[2, 1], [2, 4], [0, 4]])
  })
})

describe('SlantAreaGame', () => {
  it('draws the base, the dashed height, the right-angle mark and both lengths', () => {
    render(<SlantAreaGame question={tri} aid={false} onAttempt={vi.fn()} />)
    expect(document.querySelectorAll('.g5s-base')).toHaveLength(1)
    expect(document.querySelectorAll('.g5s-height')).toHaveLength(1)
    expect(document.querySelectorAll('.g5s-right')).toHaveLength(1)
    expect(document.querySelectorAll('.g5s-ext')).toHaveLength(0)
    expect(labels()).toEqual(['6', '4'])
    expect(document.querySelectorAll('.g5s-aid')).toHaveLength(0)
  })

  it('draws the dotted extension when the foot is outside the base', () => {
    render(<SlantAreaGame question={obtuse} aid={false} onAttempt={vi.fn()} />)
    expect(document.querySelectorAll('.g5s-ext')).toHaveLength(1)
    expect(labels()).toEqual(['4', '3'])
  })

  it('a wrong number shakes and stays, the right one passes', async () => {
    const onAttempt = vi.fn()
    render(<SlantAreaGame question={tri} aid={false} onAttempt={onAttempt} />)
    await type('24')
    await userEvent.click(key('✓'))
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('status')).toHaveTextContent('24')
    await userEvent.click(key('⌫'))
    await userEvent.click(key('⌫'))
    await type('12')
    await userEvent.click(key('✓'))
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    expect(onAttempt).toHaveBeenCalledTimes(2)
    expect(key('1')).toBeDisabled()
  })

  it('types by keyboard and Enter checks', async () => {
    const onAttempt = vi.fn()
    render(<SlantAreaGame question={tri} aid={false} onAttempt={onAttempt} />)
    await userEvent.keyboard('12{Enter}')
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('with the aid shades the rectangle (half sign for a triangle) and speaks the hint', () => {
    render(<SlantAreaGame question={tri} aid onAttempt={vi.fn()} />)
    expect(document.querySelectorAll('.g5s-aid')).toHaveLength(1)
    expect(document.querySelector('.g5s-half')?.textContent).toBe('½')
    expect(say).toHaveBeenCalledWith(M5.triangleAreaHint)
  })

  it('with the aid a parallelogram shows the piece that moves across', () => {
    render(<SlantAreaGame question={para} aid onAttempt={vi.fn()} />)
    expect(document.querySelectorAll('.g5s-cut')).toHaveLength(1)
    expect(document.querySelectorAll('.g5s-half')).toHaveLength(0)
  })
})
