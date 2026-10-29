import { describe, expect, it } from 'vitest'
import { LETTERS } from '../hebrew/content/letters'
import { WORDS } from '../hebrew/content/words'
import type { SoundId } from '../hebrew/types'
import { BOOKS } from './content/books'
import { CLOZES } from './content/cloze'
import { SENTENCES } from './content/sentences'
import { STORIES } from './content/stories'
import { UNITS } from './content/units'
import { R, bookQuestionPhrase, bookTitlePhrase, clozePhrase, pagePhrase, sentencePhrase, storyPhrase, unitPhrase } from './ids'
import { phrases } from './phrases'
import type { Vowel } from './types'

const DAGESH = 'ּ'
const SHIN = 'ׁ'
const SIN = 'ׂ'
const SHVA = 'ְ'
const PATACH = 'ַ'
const QAMATS = 'ָ'

const SOUNDS = [...new Set(LETTERS.flatMap(l => (l.sound && l.sound !== 'h' ? [l.sound] : [])))] as SoundId[]
const VOWELS: Vowel[] = ['a', 'i', 'o', 'u', 'e']
const KNOWN_WORDS = new Set(WORDS.map(w => w.text))

/** A consonant letter with its marks, in reading order. */
interface Cluster { ch: string; marks: string }

function clusters(text: string): Cluster[] {
  const out: Cluster[] = []
  for (const c of text) {
    const prev = out[out.length - 1]
    if (c >= 'ְ' && c <= 'ׇ' && prev) prev.marks += c
    else out.push({ ch: c, marks: '' })
  }
  return out
}

/** Hebrew words of a text: punctuation, quotes and the cloze gap are dropped. */
function hebrewWords(text: string): string[] {
  return text.split(/\s+/).map(w => w.replace(/[.,?!"'״]/g, '')).filter(w => w && w !== '___' && w !== '…')
}

const hasVowelMark = (marks: string) => /[\u05B0-\u05BB]/.test(marks)
// A vav with only a dagesh is shuruk, a vav with holam is holam: both give the vowel to the consonant before them.
const isShuruk = (c: Cluster | undefined) => c?.ch === 'ו' && c.marks === DAGESH
const isHolamVav = (c: Cluster | undefined) => c?.ch === 'ו' && c.marks.includes('\u05B9')
const carriesVowel = (c: Cluster | undefined) => !!c && (hasVowelMark(c.marks) || isShuruk(c))

// Letters that may stay bare: the last letter, a consonant before a shuruk or holam vav, and a mater lectionis
// (ו י) or silent א ה after a pointed consonant.
function unpointedProblems(word: string): string[] {
  const cs = clusters(word)
  const problems: string[] = []
  cs.forEach((c, i) => {
    if (c.ch === 'ש' && !c.marks.includes(SHIN) && !c.marks.includes(SIN)) problems.push(`${word}: ש without a dot`)
    if (c.marks) return
    if (i === cs.length - 1) return
    if (isShuruk(cs[i + 1]) || isHolamVav(cs[i + 1])) return
    const mater = 'אהוי'.includes(c.ch) && carriesVowel(cs[i - 1])
    if (!mater) problems.push(`${word}: bare ${c.ch}`)
  })
  if (!cs.some(carriesVowel)) problems.push(`${word}: no vowel mark at all`)
  return problems
}

const GUTTURAL = 'אהחער'

// Spelling rules a child would otherwise learn wrongly from a missing sign.
function spellingProblems(word: string): string[] {
  const cs = clusters(word)
  const problems: string[] = []
  const [first, second] = cs
  if (!first) return problems
  if ('בכפ'.includes(first.ch) && hasVowelMark(first.marks) && !first.marks.includes(DAGESH)) {
    problems.push(`${word}: word-initial ${first.ch} needs dagesh`)
  }
  // The article ה (and prefix ב ל with patach) doubles the next letter, except gutturals, ר, and י with shva.
  const prefixed = (first.ch === 'ה' || ((first.ch === 'ב' || first.ch === 'ל') && cs.length > 3)) && first.marks.replace(DAGESH, '') === PATACH
  if (prefixed && second && !KNOWN_WORDS.has(word) && word !== 'בַּיְתָה') {
    const exempt = GUTTURAL.includes(second.ch) || (second.ch === 'י' && second.marks.includes(SHVA))
    if (!exempt && !second.marks.includes(DAGESH)) problems.push(`${word}: letter after prefix needs dagesh`)
  }
  // Before an unstressed qamats on ה ח ע the article is הֶ (הֶחָתוּל), never הַ or הָ.
  if (first.ch === 'ה' && second && 'החע'.includes(second.ch) && second.marks.includes(QAMATS) && /[ַָ]/.test(first.marks)) {
    problems.push(`${word}: article should be הֶ`)
  }
  return problems
}

/** Vowel classes of a word; ו with dagesh alone is shuruk (u), ו with holam is o. */
function vowelClasses(word: string): Set<Vowel> {
  const out = new Set<Vowel>()
  for (const c of clusters(word)) {
    if (/[ֲַָ]/.test(c.marks)) out.add('a')
    if (c.marks.includes('ִ')) out.add('i')
    if (/[ֳֹֺ]/.test(c.marks)) out.add('o')
    if (c.marks.includes('ֻ') || (c.ch === 'ו' && c.marks === DAGESH)) out.add('u')
    if (/[ֱֵֶ]/.test(c.marks)) out.add('e')
  }
  return out
}

function soundOf(c: Cluster): SoundId | null {
  const d = c.marks.includes(DAGESH)
  switch (c.ch) {
    case 'ב': return d ? 'b' : 'v'
    case 'ג': return 'g'
    case 'ד': return 'd'
    case 'ז': return 'z'
    case 'ח': return 'x'
    case 'ט': case 'ת': return 't'
    case 'י': return 'y'
    case 'כ': return d ? 'k' : 'x'
    case 'ל': return 'l'
    case 'מ': return 'm'
    case 'נ': return 'n'
    case 'ס': return 's'
    case 'פ': return d ? 'p' : 'f'
    case 'צ': return 'ts'
    case 'ק': return 'k'
    case 'ר': return 'r'
    case 'ש': return c.marks.includes(SIN) ? 's' : 'sh'
    default: return null
  }
}

const emojiCount = (scene: string) => (scene.match(/\p{Extended_Pictographic}/gu) ?? []).length

describe('units', () => {
  it('covers every sound except h with each of the five vowels exactly once', () => {
    expect(SOUNDS).toHaveLength(18)
    expect(SOUNDS).not.toContain('h')
    expect(UNITS).toHaveLength(SOUNDS.length * 5)
    expect(new Set(UNITS.map(u => u.key)).size).toBe(UNITS.length)
    for (const sound of SOUNDS) {
      for (const vowel of VOWELS) expect(UNITS.filter(u => u.sound === sound && u.vowel === vowel), `${sound}-${vowel}`).toHaveLength(1)
    }
    for (const u of UNITS) expect(u.key).toBe(`${u.sound}-${u.vowel}`)
  })

  it('has the spellings of each vowel and starts every spelling with the unit letter', () => {
    const counts: Record<Vowel, number> = { a: 2, i: 2, o: 2, u: 2, e: 3 }
    for (const u of UNITS) {
      expect(u.spellings, u.key).toHaveLength(counts[u.vowel])
      expect(new Set(u.spellings).size).toBe(u.spellings.length)
      expect(LETTERS.some(l => l.char === u.letter), u.key).toBe(true)
      for (const sp of u.spellings) {
        expect(sp.startsWith(u.letter), `${u.key} ${sp}`).toBe(true)
        expect(sp, u.key).toBe(sp.normalize('NFC'))
      }
    }
  })

  it('writes the consonant so it really has the unit sound (dagesh, shin and sin dots, soft ב for v)', () => {
    for (const u of UNITS) {
      expect(u.letter, u.key).not.toBe(u.sound === 'v' ? 'ו' : '')
      for (const sp of u.spellings) {
        const onset = clusters(sp)[0] ?? { ch: '', marks: '' }
        expect(soundOf(onset), `${u.key} ${sp}`).toBe(u.sound)
        expect(onset.marks.includes(DAGESH), `${u.key} ${sp}`).toBe(['b', 'k', 'p'].includes(u.sound))
        expect(unpointedProblems(sp), sp).toEqual([])
      }
    }
  })

  it('classifies spellings by vowel sound', () => {
    for (const u of UNITS) {
      for (const sp of u.spellings) {
        expect([...vowelClasses(sp)], `${u.key} ${sp}`).toEqual([u.vowel])
      }
    }
  })
})

const allTexts: { where: string; text: string }[] = [
  ...SENTENCES.map(s => ({ where: `sentence ${s.id}`, text: s.text })),
  ...CLOZES.flatMap(c => [{ where: `cloze ${c.id}`, text: c.text }, { where: `cloze ${c.id} answer`, text: c.answer }, ...c.wrong.map(w => ({ where: `cloze ${c.id} wrong`, text: w }))]),
  ...STORIES.flatMap(s => s.sentences.map((text, n) => ({ where: `story ${s.id}.${n}`, text }))),
  ...BOOKS.flatMap(b => [
    { where: `book ${b.id} title`, text: b.title },
    ...b.pages.map((p, i) => ({ where: `book ${b.id} page ${i}`, text: p.text })),
    ...b.questions.flatMap((q, i) => [
      { where: `book ${b.id} q${i}`, text: q.prompt },
      ...q.options.flatMap(o => (o.text ? [{ where: `book ${b.id} q${i} option`, text: o.text }] : [])),
    ]),
  ]),
  ...Object.entries(phrases).map(([id, text]) => ({ where: id, text })),
]

describe('nikud', () => {
  it('points every word that a child reads, and spells the article and prefixes correctly', () => {
    const problems: string[] = []
    for (const { where, text } of allTexts) {
      expect(text, where).toBe(text.normalize('NFC'))
      for (const w of hebrewWords(text)) {
        // Units are bare syllables: soft ב and פ (v, f) are meant to have no dagesh.
        const spelling = where.startsWith('reading.unit.') ? [] : spellingProblems(w)
        problems.push(...[...unpointedProblems(w), ...spelling].map(p => `${where}: ${p}`))
        for (const ch of w) expect(ch >= 'ְ' && ch <= 'ת', `${where}: ${w} has a non-Hebrew character`).toBe(true)
      }
    }
    expect(problems).toEqual([])
  })

  it('catches missing nikud (the helpers themselves work)', () => {
    expect(unpointedProblems('שמח')).not.toEqual([])
    expect(unpointedProblems('שָׂמַח')).toEqual([])
    expect(unpointedProblems('הוּא')).toEqual([])
    expect(spellingProblems('הַגַן')).not.toEqual([])
    expect(spellingProblems('הַגַּן')).toEqual([])
    expect(spellingProblems('הַחָתוּל')).not.toEqual([])
    expect(spellingProblems('הֶחָתוּל')).toEqual([])
    expect(spellingProblems('כֶּלֶב')).toEqual([])
    expect(spellingProblems('כֶלֶב')).not.toEqual([])
  })
})

describe('sentences', () => {
  it('has at least 40 sentences of 3–5 words with unique ids, texts and scenes', () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(40)
    for (const field of ['id', 'text', 'scene'] as const) expect(new Set(SENTENCES.map(s => s[field])).size, field).toBe(SENTENCES.length)
    for (const s of SENTENCES) {
      const n = hebrewWords(s.text).length
      expect(n, s.id).toBeGreaterThanOrEqual(3)
      expect(n, s.id).toBeLessThanOrEqual(5)
      expect(s.id).toMatch(/^[a-z-]+$/)
      expect(emojiCount(s.scene), s.id).toBeGreaterThanOrEqual(1)
      expect(emojiCount(s.scene), s.id).toBeLessThanOrEqual(3)
    }
  })

  it('has near-miss pairs: shared subjects and shared actions', () => {
    const count = (key: 'who' | 'does', minOthers: number) => {
      const groups = new Map<string, Set<string>>()
      for (const s of SENTENCES) {
        const [group, other] = [s.tags[key] ?? '', (key === 'who' ? s.tags.does : s.tags.who) ?? '']
        groups.set(group, (groups.get(group) ?? new Set()).add(other))
      }
      return [...groups.values()].filter(g => g.size >= minOthers).length
    }
    expect(count('who', 2), 'subjects in 2+ sentences with different actions').toBeGreaterThanOrEqual(10)
    expect(count('does', 2), 'actions with 2+ different subjects').toBeGreaterThanOrEqual(10)
    for (const s of SENTENCES) {
      expect(s.tags.who && s.tags.does, s.id).toBeTruthy()
      const sameAction = SENTENCES.filter(o => o.id !== s.id && o.tags.does === s.tags.does && o.tags.who !== s.tags.who)
      const sameSubject = SENTENCES.filter(o => o.id !== s.id && o.tags.who === s.tags.who && o.tags.does !== s.tags.does)
      expect(sameAction.length + sameSubject.length, `${s.id} has a near-miss scene`).toBeGreaterThan(0)
      // No two sentences may mean the same thing, or a distractor scene could also be correct.
      expect(SENTENCES.filter(o => Object.keys(s.tags).every(k => o.tags[k] === s.tags[k])), s.id).toHaveLength(1)
    }
  })
})

describe('cloze', () => {
  it('has at least 30 items with one gap, an answer outside the wrong options, and על/אל items', () => {
    expect(CLOZES.length).toBeGreaterThanOrEqual(30)
    expect(new Set(CLOZES.map(c => c.id)).size).toBe(CLOZES.length)
    expect(new Set(CLOZES.map(c => c.text)).size).toBe(CLOZES.length)
    for (const c of CLOZES) {
      expect(c.text.split('___'), c.id).toHaveLength(2)
      expect(c.wrong, c.id).toHaveLength(2)
      expect(c.wrong, c.id).not.toContain(c.answer)
      expect(c.wrong[0], c.id).not.toBe(c.wrong[1])
      expect(hebrewWords(c.text).length, c.id).toBeGreaterThanOrEqual(2)
      expect(hebrewWords(c.answer), c.id).toHaveLength(hebrewWords(c.wrong[0]).length)
    }
    const prepositions = CLOZES.filter(c => ['עַל', 'אֶל'].includes(c.answer))
    expect(prepositions.length).toBeGreaterThanOrEqual(4)
    expect(prepositions.some(c => c.answer === 'עַל') && prepositions.some(c => c.answer === 'אֶל')).toBe(true)
  })
})

describe('stories', () => {
  it('has at least 12 three-sentence stories with unique ids and scenes', () => {
    expect(STORIES.length).toBeGreaterThanOrEqual(12)
    expect(new Set(STORIES.map(s => s.id)).size).toBe(STORIES.length)
    expect(new Set(STORIES.map(s => s.scene)).size).toBe(STORIES.length)
    const all = STORIES.flatMap(s => s.sentences)
    expect(new Set(all).size).toBe(all.length)
    for (const s of STORIES) {
      expect(s.sentences, s.id).toHaveLength(3)
      expect(emojiCount(s.scene), s.id).toBeGreaterThanOrEqual(1)
      expect(emojiCount(s.scene), s.id).toBeLessThanOrEqual(3)
    }
  })
})

// Names and words with no a-sound alternative; they do not count against a book's stage.
const FUNCTION_WORDS = new Set(['שׁוּפִי', 'הוּא', 'הִיא', 'הֵם', 'אֲנִי', 'אֶת', 'אֶל', 'עִם', 'לוֹ', 'אַחַר', 'כָּל', 'בָּא', 'מִי', 'מָה', 'מַה', 'וְ'])

describe('books', () => {
  it('has exactly 5 books, one per stage 1..5, with Shufi in each', () => {
    expect(BOOKS).toHaveLength(5)
    expect(BOOKS.map(b => b.stage).sort()).toEqual([1, 2, 3, 4, 5])
    expect(new Set(BOOKS.map(b => b.id)).size).toBe(5)
    expect(new Set(BOOKS.map(b => b.title)).size).toBe(5)
    for (const b of BOOKS) {
      expect(b.id).toMatch(/^[a-z-]+$/)
      expect(emojiCount(b.cover), b.id).toBeGreaterThanOrEqual(1)
      expect(b.pages.map(p => p.text).join(' '), b.id).toContain('שׁוּפִי')
    }
  })

  it('has 5–6 pages of 1–3 short lines and unique page scenes', () => {
    for (const b of BOOKS) {
      expect(b.pages.length, b.id).toBeGreaterThanOrEqual(5)
      expect(b.pages.length, b.id).toBeLessThanOrEqual(6)
      expect(new Set(b.pages.map(p => p.scene)).size, b.id).toBe(b.pages.length)
      for (const p of b.pages) {
        const lines = p.text.split('\n')
        expect(lines.length, `${b.id} ${p.text}`).toBeGreaterThanOrEqual(1)
        expect(lines.length, `${b.id} ${p.text}`).toBeLessThanOrEqual(3)
        for (const line of lines) expect(hebrewWords(line).length, `${b.id} ${line}`).toBeLessThanOrEqual(6)
        expect(emojiCount(p.scene), b.id).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('has 3 questions with 3 distinct options and a valid answer index', () => {
    for (const b of BOOKS) {
      expect(b.questions, b.id).toHaveLength(3)
      for (const q of b.questions) {
        expect(q.options, `${b.id} ${q.prompt}`).toHaveLength(3)
        expect(Number.isInteger(q.answer)).toBe(true)
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThan(3)
        const keys = q.options.map(o => `${o.text ?? ''}|${o.scene ?? ''}`)
        expect(new Set(keys).size, q.prompt).toBe(3)
        for (const o of q.options) expect(Boolean(o.text) !== Boolean(o.scene), `${q.prompt}: one of text or scene`).toBe(true)
      }
      const kinds = new Set(b.questions.flatMap(q => q.options.map(o => (o.text ? 'text' : 'scene'))))
      expect(kinds.size, `${b.id} mixes picture and text options`).toBe(2)
    }
  })

  it('keeps the vowels of each book within its stage (stage 1: kamatz and patach)', () => {
    for (const b of BOOKS) {
      const allowed = new Set(VOWELS.slice(0, b.stage))
      const words = b.pages.flatMap(p => hebrewWords(p.text)).filter(w => !FUNCTION_WORDS.has(w))
      const inRange = words.filter(w => [...vowelClasses(w)].every(v => allowed.has(v)))
      expect(inRange.length / words.length, `${b.id}: ${words.filter(w => !inRange.includes(w)).join(' ')}`).toBeGreaterThanOrEqual(0.6)
      // The vowel a stage introduces actually appears (stage 5 introduces tsere and segol).
      const introduced = VOWELS[b.stage - 1] as Vowel
      expect(words.some(w => vowelClasses(w).has(introduced)), `${b.id} uses ${introduced}`).toBe(true)
    }
  })

  it('also checks that a stage-1 book avoids the later vowels more than a stage-5 book', () => {
    const share = (id: string) => {
      const b = BOOKS.find(x => x.id === id)
      const words = (b?.pages ?? []).flatMap(p => hebrewWords(p.text)).filter(w => !FUNCTION_WORDS.has(w))
      return words.filter(w => [...vowelClasses(w)].every(v => v === 'a')).length / words.length
    }
    expect(share('butterfly')).toBeGreaterThan(share('key'))
  })
})

describe('phrases', () => {
  const expected = [
    ...Object.values(R),
    ...UNITS.map(u => unitPhrase(u.key)),
    ...SENTENCES.map(s => sentencePhrase(s.id)),
    ...CLOZES.map(c => clozePhrase(c.id)),
    ...STORIES.flatMap(s => [0, 1, 2].map(n => storyPhrase(s.id, n))),
    ...BOOKS.flatMap(b => [
      bookTitlePhrase(b.id),
      ...b.pages.map((_, i) => pagePhrase(b.id, i)),
      ...b.questions.map((_, i) => bookQuestionPhrase(b.id, i)),
    ]),
  ]

  it('has every phrase id the contract implies, and nothing else', () => {
    for (const id of expected) expect(phrases[id], id).toBeTruthy()
    expect(Object.keys(phrases).sort()).toEqual([...new Set(expected)].sort())
    expect(expected).toHaveLength(new Set(expected).size)
  })

  it('says a unit as its first spelling, a cloze with … in the gap, and a page on one line', () => {
    for (const u of UNITS) expect(phrases[unitPhrase(u.key)]).toBe(u.spellings[0])
    for (const c of CLOZES) {
      expect(phrases[clozePhrase(c.id)], c.id).not.toContain('___')
      expect(phrases[clozePhrase(c.id)], c.id).toContain('…')
    }
    for (const b of BOOKS) for (const [i, p] of b.pages.entries()) expect(phrases[pagePhrase(b.id, i)], b.id).toBe(p.text.replace(/\s*\n\s*/g, ' '))
  })

  it('prefixes ids with reading. and carries nikud in every spoken line', () => {
    for (const [id, text] of Object.entries(phrases)) {
      expect(id.startsWith('reading.'), id).toBe(true)
      expect(/[ְ-ׇ]/.test(text), id).toBe(true)
    }
  })
})
