import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HundredChartGame } from './games-chart'
import { M } from './ids'
import type { ChartQ } from './types'

vi.mock('../../core/audio/audio', () => ({
  phrases: { 'math.q.chart': 'chart' },
  say: vi.fn(() => Promise.resolve()),
}))
afterEach(cleanup)

const q: ChartQ = { itemKey: 'chart:301', answer: [305, 342, 399], say: 'x', instruction: M.chart, start: 301, blanks: [305, 342, 399] }
const setup = (question = q) => {
  const onAttempt = vi.fn()
  render(<HundredChartGame question={question} aid={false} onAttempt={onAttempt} />)
  return onAttempt
}
const blanks = () => screen.queryAllByRole('button', { name: '?' })
const key = (k: string) => userEvent.click(screen.getByRole('button', { name: k }))
const type = async (s: string) => { for (const c of s) await key(c) }

describe('HundredChartGame', () => {
  it('draws 100 cells from start, left to right, with the blanks as buttons', () => {
    setup()
    expect(document.querySelector('.hc-chart')).toHaveAttribute('dir', 'ltr')
    expect(document.querySelectorAll('.hc-cell')).toHaveLength(100)
    expect(screen.getByText('301')).toBeTruthy()
    expect(screen.getByText('400')).toBeTruthy()
    expect(blanks()).toHaveLength(3)
  })

  it('fills a blank with the right value and turns it green', async () => {
    const onAttempt = setup()
    await userEvent.click(blanks()[1]!)
    await type('342')
    await key('✓')
    expect(screen.getByText('342')).toHaveClass('hc-ok')
    expect(blanks()).toHaveLength(2)
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('reports a miss, keeps the blank and clears what was typed', async () => {
    const onAttempt = setup()
    await userEvent.click(blanks()[0]!)
    await type('306')
    await key('✓')
    expect(onAttempt).toHaveBeenCalledWith(false)
    expect(blanks()).toHaveLength(3)
    expect(blanks()[0]).toHaveTextContent('?')
    expect(blanks()[0]).toHaveClass('bad')
  })

  it('reports success exactly once when every blank is filled', async () => {
    const onAttempt = setup()
    for (const v of ['305', '342', '399']) {
      await userEvent.click(blanks()[0]!)
      await type(v)
      await key('✓')
    }
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
    expect(blanks()).toHaveLength(0)
  })

  it('works by keyboard: Tab to a blank, type digits, Enter', async () => {
    const onAttempt = setup({ ...q, blanks: [305], answer: [305] })
    await userEvent.tab()
    expect(blanks()[0]).toHaveFocus()
    await userEvent.keyboard('305')
    await act(async () => { await userEvent.keyboard('{Enter}') })
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onAttempt).toHaveBeenCalledWith(true)
  })

  it('lets Backspace fix a typo and accepts 4-digit values at the top of the chart', async () => {
    const onAttempt = setup({ ...q, start: 901, blanks: [1000], answer: [1000] })
    await userEvent.click(blanks()[0]!)
    await type('1007')
    await key('⌫')
    await type('0')
    await key('✓')
    expect(onAttempt).toHaveBeenCalledWith(true)
  })
})
