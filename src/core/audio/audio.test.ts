import { afterEach, describe, expect, it, vi } from 'vitest'
import { raw, rawEn, say, wordAt, wordAtChar, wordStarts } from './audio'

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

describe('say with mixed languages', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('switches voice per part: Hebrew, English, Hebrew', async () => {
    const spoken: { text: string; lang: string }[] = []
    class Utterance { lang = ''; rate = 1; voice = null; onend: (() => void) | null = null; onerror = null; constructor(public text: string) {} }
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
    vi.stubGlobal('speechSynthesis', {
      cancel: () => {}, getVoices: () => [],
      speak: (u: Utterance) => { spoken.push({ text: u.text, lang: u.lang }); u.onend?.() },
    })
    await say([raw('אֵיפֹה'), raw('הַ'), rawEn('cat'), raw('?')])
    expect(spoken).toEqual([
      { text: 'אֵיפֹה הַ', lang: 'he-IL' },
      { text: 'cat', lang: 'en-US' },
      { text: '?', lang: 'he-IL' },
    ])
  })
})
