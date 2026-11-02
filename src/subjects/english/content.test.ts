import { describe, expect, it } from 'vitest'
import { CHUNKS, QAS } from './content/chunks'
import { MAGIC_PAIRS, MINIMAL_PAIRS, SIGHT_WORDS } from './content/phonics'
import { SENTENCES } from './content/sentences'
import { WORDS } from './content/words'
import { E, engAnswer, engBlend, engChunk, engLetter, engQuestion, engSentence, engSight, engSound, engWord } from './ids'
import { englishPhrases, phrases } from './phrases'
import type { Topic } from './types'

const byWord = new Map(WORDS.map(w => [w.word, w]))
const TOPICS: Topic[] = ['colors', 'numbers', 'animals', 'food', 'body', 'family', 'school', 'toys', 'clothes', 'actions', 'home', 'nature']
const dupes = (xs: readonly string[]) => xs.filter((x, i) => xs.indexOf(x) !== i)

describe('words', () => {
  it('has enough words with unique IDs, spellings and emoji', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(120)
    expect(dupes(WORDS.map(w => w.id))).toEqual([])
    expect(dupes(WORDS.map(w => w.word))).toEqual([])
    expect(dupes(WORDS.map(w => w.emoji))).toEqual([])
    for (const w of WORDS) {
      expect(w.word).toMatch(/^[a-z]+$/)
      expect(w.emoji.length).toBeGreaterThan(0)
      expect(w.first.length).toBeGreaterThan(0)
    }
  })

  it('covers every topic with at least 6 words', () => {
    for (const t of TOPICS) expect(WORDS.filter(w => w.topic === t).length, t).toBeGreaterThanOrEqual(6)
  })

  it('has colors as circles and numbers as keycaps', () => {
    expect(WORDS.filter(w => w.topic === 'colors').every(w => /[🔴🔵🟢🟡🟣🟠⚫⚪🟤🩷]/u.test(w.emoji))).toBe(true)
    expect(WORDS.filter(w => w.topic === 'numbers').every(w => /^(\d️⃣|🔟)$/u.test(w.emoji))).toBe(true)
  })

  it('has the phonics pattern counts', () => {
    const count = (p: string) => WORDS.filter(w => w.pattern === p).length
    expect(count('cvc')).toBeGreaterThanOrEqual(40)
    expect(count('digraph')).toBeGreaterThanOrEqual(15)
    expect(count('magic-e')).toBeGreaterThanOrEqual(12)
  })

  it('spells each pattern correctly', () => {
    for (const w of WORDS.filter(x => x.pattern === 'cvc')) expect(w.word, w.word).toMatch(/^[^aeiou][aeiou][^aeiou]$/)
    // The y/w endings make cow, boy, toy look like CVC but they are not decoded that way.
    for (const w of WORDS.filter(x => x.pattern === 'cvc')) expect(w.word, w.word).not.toMatch(/[wy]$/)
    for (const w of WORDS.filter(x => x.pattern === 'digraph')) expect(w.word, w.word).toMatch(/^(sh|ch|th)|(sh|ch|th)$/)
    for (const w of WORDS.filter(x => x.pattern === 'magic-e')) expect(w.word, w.word).toMatch(/^[^aeiou]+[aeiou][^aeiou]e$/)
  })

  it('gives the first sound of the word', () => {
    for (const w of WORDS.filter(x => x.pattern === 'cvc' || x.pattern === 'digraph')) {
      if (/^(sh|ch|th)/.test(w.word)) expect(w.first, w.word).toBe(w.word.slice(0, 2))
      else if (w.word[0] === 'c') expect(w.first, w.word).toBe('k')
      else if (!w.word.startsWith('wh')) expect(w.first, w.word).toBe(w.word[0])
    }
  })

  it('has rimes that end the word, with at least 10 families of 2+ words', () => {
    const families = new Map<string, string[]>()
    for (const w of WORDS) {
      if (!w.rime) continue
      expect(w.word.endsWith(w.rime), w.word).toBe(true)
      families.set(w.rime, [...(families.get(w.rime) ?? []), w.word])
    }
    expect([...families.values()].filter(f => f.length >= 2).length).toBeGreaterThanOrEqual(10)
  })

  it('gives every cvc word a rime (the blend game needs one)', () => {
    for (const w of WORDS.filter(x => x.pattern === 'cvc')) expect(w.rime, w.word).toBe(w.word.slice(1))
  })
})

describe('chunks and QAs', () => {
  it('has enough chunks with unique IDs and scenes', () => {
    expect(CHUNKS.length).toBeGreaterThanOrEqual(15)
    expect(dupes(CHUNKS.map(c => c.id))).toEqual([])
    expect(dupes(CHUNKS.map(c => c.text))).toEqual([])
    expect(dupes(CHUNKS.map(c => c.scene))).toEqual([])
  })

  it('has QAs with one sensible answer and two distinct different wrong ones', () => {
    expect(QAS.length).toBeGreaterThanOrEqual(12)
    expect(dupes(QAS.map(q => q.id))).toEqual([])
    for (const q of QAS) {
      const options = [q.answer, ...q.wrong]
      expect(new Set(options).size, q.id).toBe(3)
      expect(options.every(o => o.length > 0)).toBe(true)
    }
  })
})

describe('minimal and magic pairs', () => {
  it('has minimal pairs whose words exist, differ, and have different emoji', () => {
    expect(MINIMAL_PAIRS.length).toBeGreaterThanOrEqual(15)
    expect(dupes(MINIMAL_PAIRS.map(p => p.id))).toEqual([])
    for (const p of MINIMAL_PAIRS) {
      const a = byWord.get(p.a)
      const b = byWord.get(p.b)
      expect(a, p.a).toBeDefined()
      expect(b, p.b).toBeDefined()
      expect(p.a).not.toBe(p.b)
      expect(a?.emoji).not.toBe(b?.emoji)
    }
    for (const c of ['b/p', 'v/w', 'ee/i'] as const) expect(MINIMAL_PAIRS.some(p => p.contrast === c), c).toBe(true)
  })

  it('has b/p pairs that swap b and p at the start or end, v/w pairs that swap v and w at the start', () => {
    const swaps = (p: { a: string; b: string }, x: string, y: string) =>
      (p.a[0] === x && p.b[0] === y) || (p.a.at(-1) === x && p.b.at(-1) === y)
    for (const p of MINIMAL_PAIRS.filter(q => q.contrast === 'b/p')) expect(swaps(p, 'b', 'p'), p.id).toBe(true)
    for (const p of MINIMAL_PAIRS.filter(q => q.contrast === 'v/w')) expect(swaps(p, 'v', 'w'), p.id).toBe(true)
  })

  it('has magic pairs where long = short + e, both taught', () => {
    expect(MAGIC_PAIRS.length).toBeGreaterThanOrEqual(12)
    for (const p of MAGIC_PAIRS) {
      expect(p.long, p.short).toBe(`${p.short}e`)
      expect(byWord.get(p.short), p.short).toBeDefined()
      expect(byWord.get(p.long)?.pattern, p.long).toBe('magic-e')
      expect(byWord.get(p.short)?.emoji).not.toBe(byWord.get(p.long)?.emoji)
    }
  })
})

describe('sight words and sentences', () => {
  it('has about 30 sight words', () => {
    expect(SIGHT_WORDS.length).toBeGreaterThanOrEqual(28)
    expect(dupes(SIGHT_WORDS)).toEqual([])
  })

  it('has enough sentences with unique IDs, texts and scenes', () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(25)
    expect(dupes(SENTENCES.map(s => s.id))).toEqual([])
    expect(dupes(SENTENCES.map(s => s.text))).toEqual([])
    expect(dupes(SENTENCES.map(s => s.scene))).toEqual([])
  })

  it('uses only taught words, 3 to 6 per sentence, ending with a period', () => {
    const taught = new Set([...WORDS.map(w => w.word), ...SIGHT_WORDS.map(w => w.toLowerCase()), 'a', 'an', 'the', 'is', 'are'])
    for (const s of SENTENCES) {
      expect(s.text, s.id).toMatch(/^[A-Z][A-Za-z ]+\.$/)
      const words = s.text.slice(0, -1).split(' ')
      expect(words.length, s.id).toBeGreaterThanOrEqual(3)
      expect(words.length, s.id).toBeLessThanOrEqual(6)
      for (const w of words) expect(taught.has(w.toLowerCase()), `${s.id}: ${w}`).toBe(true)
    }
  })

  it('has near-miss scenes: two other sentences share one tag and differ in another', () => {
    for (const s of SENTENCES) {
      const keys = Object.keys(s.tags)
      expect(keys.length, s.id).toBeGreaterThanOrEqual(2)
      const near = SENTENCES.filter(o => {
        if (o === s || Object.keys(o.tags).join() !== keys.join()) return false
        const same = keys.filter(k => o.tags[k] === s.tags[k]).length
        return same >= 1 && same < keys.length
      })
      expect(near.length, s.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('has sentence tags that match the sentence words', () => {
    for (const s of SENTENCES) {
      const words = s.text.slice(0, -1).toLowerCase().split(' ')
      for (const v of Object.values(s.tags)) expect(words.includes(v.toLowerCase()), `${s.id}: ${v}`).toBe(true)
    }
  })
})

describe('phrases', () => {
  const hebrewLetter = /[א-ת]/
  const vowelMark = /[ְ-ֻׁׂ]/

  it('has every Hebrew instruction with nikud on every word', () => {
    for (const id of Object.values(E)) {
      const text = phrases[id] ?? ''
      expect(text, id).toBeTruthy()
      for (const word of text.split(/\s+/).filter(w => hebrewLetter.test(w))) expect(vowelMark.test(word), `${id}: ${word}`).toBe(true)
    }
    expect(Object.keys(phrases).sort()).toEqual(Object.values(E).sort())
  })

  it('keeps English text out of the Hebrew map and Hebrew out of the English map', () => {
    for (const text of Object.values(phrases)) expect(text).not.toMatch(/[A-Za-z]/)
    for (const text of Object.values(englishPhrases)) expect(text).not.toMatch(hebrewLetter)
  })

  it('has every English phrase ID the contract implies', () => {
    const ids: string[] = [
      ...WORDS.map(w => engWord(w.id)),
      ...CHUNKS.map(c => engChunk(c.id)),
      ...QAS.flatMap(q => [engQuestion(q.id), engAnswer(q.id, 0), engAnswer(q.id, 1), engAnswer(q.id, 2)]),
      ...SENTENCES.map(s => engSentence(s.id)),
      ...SIGHT_WORDS.map(engSight),
      ...[...'abcdefghijklmnopqrstuvwxyz'].flatMap(l => [engLetter(l), engSound(l)]),
      ...['sh', 'ch', 'th'].map(engSound),
      ...WORDS.filter(w => w.pattern === 'cvc' && w.rime).map(w => engBlend(w.id)),
    ]
    for (const id of ids) expect(englishPhrases[id], id).toBeTruthy()
  })

  it('says each word, letter and sound as expected', () => {
    for (const w of WORDS) expect(englishPhrases[engWord(w.id)]).toBe(w.word)
    expect(englishPhrases[engLetter('b')]).toBe('B')
    expect(englishPhrases[engSound('b')]).toBe('buh')
    expect(englishPhrases[engSound('sh')]).toBe('sh')
    expect(englishPhrases[engBlend('cat')]).toBe('kuh … at')
    expect(englishPhrases[engBlend('dog')]).toBe('duh … ogg')
  })

  it('has no blend phrase that starts with an undefined sound', () => {
    for (const [id, text] of Object.entries(englishPhrases)) if (id.startsWith('eng.blend.')) expect(text, id).not.toMatch(/undefined/)
  })
})
