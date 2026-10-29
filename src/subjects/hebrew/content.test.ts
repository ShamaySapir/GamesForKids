import { describe, expect, it } from 'vitest'
import { LETTERS, SOUND_LABEL } from './content/letters'
import { CV_UNITS, DAGESH_GROUPS, MILEL, SAME_SOUND_GROUPS, SYLLABLE_WORDS, WORDS } from './content/words'
import { Q, cvPhrase, letterPhrase, soundPhrase, syllablesPhrase, wordPhrase } from './ids'
import { phrases } from './phrases'
import type { SoundId } from './types'

const DAGESH = 'ּ'
const SHIN = 'ׁ'
const SIN = 'ׂ'

const SOUNDS: SoundId[] = ['b', 'v', 'g', 'd', 'h', 'z', 'x', 't', 'y', 'k', 'l', 'm', 'n', 's', 'p', 'f', 'ts', 'r', 'sh']
const byId = new Map(WORDS.map(w => [w.id, w]))

/** A consonant letter with its marks, in reading order. */
type Unit = { ch: string; marks: string }

function units(text: string): Unit[] {
  const out: Unit[] = []
  for (const c of text) {
    const prev = out[out.length - 1]
    if (c >= 'ְ' && c <= 'ׇ' && prev) prev.marks += c
    else out.push({ ch: c, marks: '' })
  }
  return out
}

const VOWEL_CLASS: Record<string, string> = { '\u05B4': 'i', '\u05B5': 'e', '\u05B6': 'e', '\u05B7': 'a', '\u05B8': 'a', '\u05B2': 'a', '\u05B9': 'o', '\u05BA': 'o', '\u05BB': 'u', '\u05B1': 'e', '\u05B3': 'o' }
const NONE: Unit = { ch: '', marks: '' }
const firstUnit = (text: string): Unit => units(text)[0] ?? NONE
const lastUnit = (text: string): Unit => units(text).at(-1) ?? NONE

function soundOf(u: Unit): SoundId | null {
  const d = u.marks.includes(DAGESH)
  switch (u.ch) {
    case 'ב': return d ? 'b' : 'v'
    case 'ג': return 'g'
    case 'ד': return 'd'
    case 'ו': return 'v'
    case 'ז': return 'z'
    case 'ח': return 'x'
    case 'ט': case 'ת': return 't'
    case 'י': return 'y'
    case 'כ': return d ? 'k' : 'x'
    case 'ך': return 'x'
    case 'ל': return 'l'
    case 'מ': case 'ם': return 'm'
    case 'נ': case 'ן': return 'n'
    case 'ס': return 's'
    case 'פ': return d ? 'p' : 'f'
    case 'ף': return 'f'
    case 'צ': case 'ץ': return 'ts'
    case 'ק': return 'k'
    case 'ר': return 'r'
    case 'ש': return u.marks.includes(SIN) ? 's' : 'sh'
    default: return null
  }
}

describe('words', () => {
  it('has at least 120 words with unique ids, texts and emoji', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(120)
    expect(new Set(WORDS.map(w => w.id)).size).toBe(WORDS.length)
    expect(new Set(WORDS.map(w => w.text)).size).toBe(WORDS.length)
    expect(new Set(WORDS.map(w => w.emoji)).size).toBe(WORDS.length)
  })

  it('writes ids in latin letters and text in normalized Hebrew with nikud', () => {
    for (const w of WORDS) {
      expect(w.id).toMatch(/^[a-z]+$/)
      expect(w.text).toBe(w.text.normalize('NFC'))
      expect(w.text).toMatch(/[ְ-ׇ]/)
      for (const c of w.text) expect(c >= 'ְ' && c <= 'ת', `${w.id} has a non-Hebrew character`).toBe(true)
    }
  })

  it('joins syllables to the text and keeps opening as a prefix', () => {
    for (const w of WORDS) {
      expect(w.syllables.join(''), w.id).toBe(w.text)
      expect(w.syllables.length).toBeGreaterThanOrEqual(1)
      expect(w.syllables.length).toBeLessThanOrEqual(4)
      expect(w.text.startsWith(w.opening), w.id).toBe(true)
      expect(w.syllables[0]?.startsWith(w.opening), w.id).toBe(true)
    }
  })

  it('derives first and last sounds from the letters', () => {
    for (const w of WORDS) {
      const start = firstUnit(w.text)
      const expectedFirst = ['א', 'ע', 'ה'].includes(start.ch) ? null : soundOf(start)
      expect(w.first, `${w.id} first`).toBe(expectedFirst)
      const end = lastUnit(w.text)
      const expectedLast = ['ה', 'א', 'ע', 'ו', 'י'].includes(end.ch) ? null : soundOf(end)
      expect(w.last, `${w.id} last`).toBe(expectedLast)
    }
  })

  it('every consonant sound except h and f opens at least 4 words', () => {
    // h: words starting with ה have no first sound. f: an initial soft פ only occurs in loan words (פַקְס).
    for (const s of SOUNDS.filter(x => x !== 'h' && x !== 'f')) {
      expect(WORDS.filter(w => w.first === s).length, s).toBeGreaterThanOrEqual(4)
    }
  })

  it('has at least 25 words ending in a consonant sound', () => {
    expect(WORDS.filter(w => w.last !== null).length).toBeGreaterThanOrEqual(25)
  })

  it('has at least 12 rhyme groups of two or more words, and no group of one', () => {
    const groups = new Map<string, number>()
    for (const w of WORDS) if (w.rhyme) groups.set(w.rhyme, (groups.get(w.rhyme) ?? 0) + 1)
    expect([...groups.values()].every(n => n >= 2)).toBe(true)
    expect(groups.size).toBeGreaterThanOrEqual(12)
  })

  it('rhyming words end in the same last letter sound', () => {
    const lastByGroup = new Map<string, Set<string | null>>()
    for (const w of WORDS) {
      if (!w.rhyme) continue
      const set = lastByGroup.get(w.rhyme) ?? new Set()
      set.add(w.last)
      lastByGroup.set(w.rhyme, set)
    }
    for (const [group, lasts] of lastByGroup) expect(lasts.size, group).toBe(1)
  })

  it('rhymes match from the stressed vowel to the end, and never mix milel with milra', () => {
    const milel = new Set(MILEL)
    for (const id of MILEL) expect(byId.has(id), id).toBe(true)
    const vowelOf = (syllable: string): string => {
      const us = units(syllable)
      const own = us[0]?.marks.replace(/[\u05BC\u05C1\u05C2]/g, '')
      if (own) return VOWEL_CLASS[own.at(-1) ?? ''] ?? ''
      return us[1]?.ch === 'ו' ? (us[1].marks.includes(DAGESH) ? 'u' : 'o') : ''
    }
    const codaOf = (syllable: string): string => {
      const rest = units(syllable).slice(1)
      return rest.filter((u, i) => !(i === 0 && u.ch === 'ו') && !(i === 0 && u.ch === 'י' && u.marks === '')).map(u => soundOf(u) ?? '').join('')
    }
    const rime = (syllable: string) => vowelOf(syllable) + codaOf(syllable)
    const byGroup = new Map<string, string[]>()
    for (const w of WORDS) if (w.rhyme) byGroup.set(w.rhyme, [...(byGroup.get(w.rhyme) ?? []), w.id])
    for (const [group, ids] of byGroup) {
      expect(new Set(ids.map(id => milel.has(id))).size, `${group} mixes milel and milra`).toBe(1)
      const keys = ids.map(id => {
        const syl = byId.get(id)?.syllables ?? []
        const last = syl.at(-1) ?? ''
        if (milel.has(id)) return `${vowelOf(syl.at(-2) ?? '')}|${last.replace(/\u05BC/g, '')}`
        return rime(last)
      })
      expect(new Set(keys).size, `${group}: ${keys.join(' / ')}`).toBe(1)
    }
  })

  it('has enough words of each syllable count', () => {
    const count = (n: number) => WORDS.filter(w => w.syllables.length === n).length
    expect(count(1)).toBeGreaterThanOrEqual(8)
    expect(count(2)).toBeGreaterThanOrEqual(8)
    expect(count(3)).toBeGreaterThanOrEqual(8)
    expect(count(4)).toBeGreaterThanOrEqual(4)
    expect(count(2) + count(3)).toBeGreaterThan(WORDS.length / 2)
  })

  it('has a null first sound only for vowel-initial words (א ע ה)', () => {
    for (const w of WORDS.filter(x => x.first === null)) expect(['א', 'ע', 'ה']).toContain(w.text[0])
  })
})

describe('CV units and syllable words', () => {
  it('every CV unit opens at least two words and has a different-vowel sibling', () => {
    expect(CV_UNITS.length).toBeGreaterThanOrEqual(22)
    expect(new Set(CV_UNITS).size).toBe(CV_UNITS.length)
    for (const unit of CV_UNITS) {
      expect(unit).toBe(unit.normalize('NFC'))
      expect(WORDS.filter(w => w.opening === unit).length, unit).toBeGreaterThanOrEqual(2)
      const consonant = unit[0]
      const sibling = WORDS.some(w => w.text[0] === consonant && w.opening !== unit && w.first === WORDS.find(x => x.opening === unit)?.first)
      expect(sibling, `${unit} has same consonant, other vowel`).toBe(true)
    }
  })

  it('syllable words exist and span 1 to 4 syllables', () => {
    expect(SYLLABLE_WORDS.length).toBeGreaterThanOrEqual(36)
    expect(new Set(SYLLABLE_WORDS).size).toBe(SYLLABLE_WORDS.length)
    for (const id of SYLLABLE_WORDS) expect(byId.has(id), id).toBe(true)
    const counts = new Set(SYLLABLE_WORDS.map(id => byId.get(id)?.syllables.length))
    for (const n of [1, 2, 3, 4]) expect(counts.has(n), `${n} syllables`).toBe(true)
    expect(SYLLABLE_WORDS.filter(id => byId.get(id)?.syllables.length === 4).length).toBeGreaterThanOrEqual(6)
  })

  it('syllable words have an unambiguous clap count: no initial shva, no final patach genuvah', () => {
    for (const id of SYLLABLE_WORDS) {
      const text = byId.get(id)?.text ?? ''
      expect(firstUnit(text).marks.includes('\u05B0'), `${id} starts with a shva`).toBe(false)
      const end = lastUnit(text)
      expect(['ח', 'ע', 'ה'].includes(end.ch) && end.marks.includes('\u05B7') && units(text).length > 3, `${id} ends in patach genuvah`).toBe(false)
    }
  })
})

describe('dagesh and same-sound groups', () => {
  const startsWith = (id: string, ch: string, mark: string | null) => {
    const u = firstUnit(byId.get(id)?.text ?? '')
    return u.ch === ch && (mark === null ? true : u.marks.includes(mark))
  }
  const containsSoft = (id: string, chars: string[]) => units(byId.get(id)?.text ?? '').some(u => chars.includes(u.ch) && !u.marks.includes(DAGESH))
  const containsHard = (id: string, ch: string) => units(byId.get(id)?.text ?? '').some(u => u.ch === ch && u.marks.includes(DAGESH))

  it('hard forms and shin dots: at least 6 words that start with the form', () => {
    const specs: [keyof typeof DAGESH_GROUPS, string, string][] = [['בּ', 'ב', DAGESH], ['כּ', 'כ', DAGESH], ['פּ', 'פ', DAGESH], ['שׁ', 'ש', SHIN], ['שׂ', 'ש', SIN]]
    for (const [key, ch, mark] of specs) {
      const ids = DAGESH_GROUPS[key]
      expect(ids.length, key).toBeGreaterThanOrEqual(6)
      for (const id of ids) expect(startsWith(id, ch, mark), `${key} ${id}`).toBe(true)
    }
  })

  it('soft forms: at least 6 words that contain the soft letter and no hard form of it', () => {
    const specs: [keyof typeof DAGESH_GROUPS, string[], string][] = [['ב', ['ב'], 'ב'], ['כ', ['כ', 'ך'], 'כ'], ['פ', ['פ', 'ף'], 'פ']]
    for (const [key, chars, hard] of specs) {
      const ids = DAGESH_GROUPS[key]
      expect(ids.length, key).toBeGreaterThanOrEqual(6)
      for (const id of ids) {
        expect(containsSoft(id, chars), `${key} ${id} has soft`).toBe(true)
        expect(containsHard(id, hard), `${key} ${id} has no hard form`).toBe(false)
      }
    }
  })

  it('shin and sin words contain only their own dot', () => {
    for (const id of DAGESH_GROUPS['שׁ']) expect(byId.get(id)?.text.includes(SIN), id).toBe(false)
    for (const id of DAGESH_GROUPS['שׂ']) expect(byId.get(id)?.text.includes(SHIN), id).toBe(false)
  })

  it('same-sound letters: at least 4 words each that start with the letter (soft ב and כ never start a native word)', () => {
    const emptyByDesign = ['ב', 'כ']
    for (const [key, ids] of Object.entries(SAME_SOUND_GROUPS)) {
      if (emptyByDesign.includes(key)) {
        expect(ids, key).toEqual([])
        continue
      }
      expect(ids.length, key).toBeGreaterThanOrEqual(4)
      const ch = key === 'שׂ' ? 'ש' : key === 'כּ' ? 'כ' : key
      const mark = key === 'שׂ' ? SIN : key === 'כּ' ? DAGESH : null
      for (const id of ids) expect(startsWith(id, ch, mark), `${key} ${id}`).toBe(true)
    }
  })

  it('every listed word id exists', () => {
    for (const ids of [...Object.values(DAGESH_GROUPS), ...Object.values(SAME_SOUND_GROUPS)]) for (const id of ids) expect(byId.has(id), id).toBe(true)
  })
})

describe('letters', () => {
  it('has 27 letters: 22 regular and 5 finals, each final linked to its regular letter', () => {
    expect(LETTERS.length).toBe(27)
    expect(new Set(LETTERS.map(l => l.char)).size).toBe(27)
    expect(LETTERS.filter(l => l.regular).length).toBe(5)
    expect(LETTERS.filter(l => l.final).length).toBe(5)
    const by = new Map(LETTERS.map(l => [l.char, l]))
    for (const l of LETTERS) {
      expect(l.name).toBe(letterPhrase(l.char))
      if (l.final) expect(by.get(l.final)?.regular).toBe(l.char)
      if (l.regular) expect(by.get(l.regular)?.final).toBe(l.char)
    }
    expect(LETTERS.map(l => l.char).join('')).toBe('אבגדהוזחטיכךלמםנןסעפףצץקרשת')
  })

  it('only א and ע have no sound, and every sound is a known SoundId', () => {
    for (const l of LETTERS) {
      if (l.char === 'א' || l.char === 'ע') expect(l.sound).toBeUndefined()
      else expect(SOUNDS).toContain(l.sound)
    }
  })

  it('look-alikes are symmetric, exist, and cover the common confusions', () => {
    const by = new Map(LETTERS.map(l => [l.char, l]))
    for (const l of LETTERS) {
      for (const other of l.lookAlike) {
        expect(by.has(other), `${l.char} → ${other}`).toBe(true)
        expect(by.get(other)?.lookAlike, `${other} → ${l.char}`).toContain(l.char)
      }
    }
    for (const pair of ['בכ', 'דר', 'הח', 'הת', 'חת', 'וז', 'ון', 'זן', 'גנ', 'סם', 'עצ', 'טמ']) {
      const [a = '', b = ''] = [...pair]
      expect(by.get(a)?.lookAlike, pair).toContain(b)
    }
  })

  it('has a label for every sound', () => {
    for (const s of SOUNDS) expect(SOUND_LABEL[s], s).toBeTruthy()
  })
})

describe('phrases', () => {
  const missing = (ids: string[]) => ids.filter(id => !phrases[id])

  it('has every phrase the content and the contract refer to', () => {
    expect(missing(WORDS.map(w => wordPhrase(w.id)))).toEqual([])
    expect(missing(SYLLABLE_WORDS.map(syllablesPhrase))).toEqual([])
    expect(missing(LETTERS.map(l => letterPhrase(l.char)))).toEqual([])
    expect(missing(SOUNDS.map(soundPhrase))).toEqual([])
    expect(missing(CV_UNITS.map(cvPhrase))).toEqual([])
    expect(missing(Object.values(Q))).toEqual([])
  })

  it('says each syllable word syllable by syllable and has no stray phrases', () => {
    for (const id of SYLLABLE_WORDS) expect(phrases[syllablesPhrase(id)]).toBe(byId.get(id)?.syllables.join(' - '))
    const expected = WORDS.length + SYLLABLE_WORDS.length + LETTERS.length + SOUNDS.length + CV_UNITS.length + Object.keys(Q).length
    expect(Object.keys(phrases).length).toBe(expected)
  })

  it('names the letters with nikud and the finals as "<name> סוֹפִית"', () => {
    expect(phrases[letterPhrase('א')]).toBe('אָלֶף')
    expect(phrases[letterPhrase('ך')]).toBe('כָּף סוֹפִית')
    for (const l of LETTERS) expect(phrases[l.name]).toMatch(/[ְ-ׇ]/)
  })

  it('every phrase is non-empty Hebrew', () => {
    for (const [id, text] of Object.entries(phrases)) {
      expect(text.trim(), id).not.toBe('')
      expect(text, id).toMatch(/[א-ת]/)
    }
  })
})
