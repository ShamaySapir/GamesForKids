import { afterEach, describe, expect, it, vi } from 'vitest'
import { audibleRange, raw, rawEn, say, sharedRecordingIds, wordAt, wordAtChar, wordStarts } from './audio'

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

describe('shared recordings', () => {
  const map = { 'b.egg': 'בֵּיצָה', 'a.egg': 'בֵּיצָה', 'c.egg': 'בֵּיצָה', 'a.dog': 'כֶּלֶב', 'eng.w.egg': 'egg', 'eng.x': 'egg' }
  const english = new Set(['eng.w.egg', 'eng.x'])

  it('gives every phrase with the same Hebrew text the first ID, until one is recorded', () => {
    const ids = sharedRecordingIds(map, new Set(), english)
    expect(['a.egg', 'b.egg', 'c.egg'].map(id => ids.get(id))).toEqual(['a.egg', 'a.egg', 'a.egg'])
    expect(ids.get('a.dog')).toBe('a.dog')
  })

  it('prefers a recorded ID, so an existing take is reused', () => {
    const ids = sharedRecordingIds(map, new Set(['c.egg', 'b.egg']), english)
    expect(['a.egg', 'b.egg', 'c.egg'].map(id => ids.get(id))).toEqual(['b.egg', 'b.egg', 'b.egg'])
  })

  it('never shares English phrases', () => {
    const ids = sharedRecordingIds(map, new Set(), english)
    expect(ids.get('eng.w.egg')).toBe('eng.w.egg')
    expect(ids.get('eng.x')).toBe('eng.x')
  })
})

describe('audible range of a recording', () => {
  const rate = 8000
  const take = (parts: [seconds: number, amplitude: number][]) => {
    const out: number[] = []
    for (const [sec, amp] of parts) for (let i = 0; i < sec * rate; i++) out.push(amp * Math.sin(i / 3))
    return new Float32Array(out)
  }

  it('drops the silence before and after the speech, keeping a short pad', () => {
    const [from, to] = audibleRange(take([[0.6, 0.002], [0.5, 0.5], [0.8, 0.002]]), rate)
    expect(from).toBeCloseTo(0.55, 1)
    expect(to).toBeCloseTo(1.15, 1)
  })

  it('ignores a click of the record button before the speech', () => {
    const [from] = audibleRange(take([[0.3, 0.002], [0.01, 0.9], [0.3, 0.002], [0.5, 0.5], [0.2, 0.002]]), rate)
    expect(from).toBeGreaterThan(0.5)
  })

  it('keeps the whole take when it is all silence', () => {
    expect(audibleRange(new Float32Array(rate), rate)).toEqual([0, 1])
  })
})
