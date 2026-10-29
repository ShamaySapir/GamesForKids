import { describe, expect, it } from 'vitest'
import { wordAt, wordAtChar, wordStarts } from './audio'

describe('narration timing', () => {
  it('weights words by letter count, ignoring nikud', () => {
    const starts = wordStarts('שָׁלוֹם לָךְ')
    expect(starts).toHaveLength(2)
    expect(starts[0]).toBe(0)
    // שלום (4 letters + 1) and לך (2 + 1): the second word starts 5/8 of the way in.
    expect(starts[1]).toBeCloseTo(5 / 8)
  })

  it('finds the word being spoken at a fraction of the phrase', () => {
    const starts = wordStarts('אֶחָד שְׁתַּיִם שָׁלוֹשׁ')
    expect(wordAt(starts, 0)).toBe(0)
    expect(wordAt(starts, 0.5)).toBe(1)
    expect(wordAt(starts, 0.99)).toBe(2)
    expect(wordAt(starts, 1)).toBe(2)
  })

  it('maps boundary character offsets to word indexes', () => {
    const text = 'הַחָתוּל יָשֵׁן עַל הַכִּסֵּא'
    expect(wordAtChar(text, 0)).toBe(0)
    expect(wordAtChar(text, text.indexOf('יָשֵׁן'))).toBe(1)
    expect(wordAtChar(text, text.indexOf('הַכִּסֵּא'))).toBe(3)
  })
})
