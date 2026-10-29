import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import {
  CONTINUOUS_SOUNDS, LETTER_GROUPS, closingAccepts, closingSoundQuestion, cvAccepts, dageshQuestion, findLetterQuestion, finalsAccepts, finalsFormQuestion,
  finalsWordAccepts, finalsWordQuestion, firstLetter, letterAccepts, letterGroup, letterToPictureAccepts, letterToPictureQuestion, nameLetterQuestion,
  normLetter, openingCvQuestion, openingSoundAccepts, openingSoundQuestion, pictureToLetterAccepts, pictureToLetterQuestion, rhymeAccepts, rhymeQuestion,
  sameSoundAccepts, sameSoundQuestion, syllablesAccepts, syllablesQuestion, type LetterGroup, type WordGroups,
} from './generators'
import { Q, cvPhrase, letterPhrase, soundPhrase, syllablesPhrase, wordPhrase } from './ids'
import type { Letter, PickQ, SoundId, Word } from './types'

/* ---------- fixture (nikud is plausible, not curated: the generators only rely on the structure) ---------- */

const w = (id: string, syllables: string[], emoji: string, opening: string, first: SoundId | null, last: SoundId | null, rhyme?: string): Word => ({
  id, text: syllables.join(''), emoji, syllables, opening, first, last, rhyme,
})

const WORDS: Word[] = [
  w('kadur', ['כַּ', 'דּוּר'], '⚽', 'כַּ', 'k', 'r', 'ur'),
  w('sipur', ['סִ', 'פּוּר'], '📖', 'סִ', 's', 'r', 'ur'),
  w('shaon', ['שָׁ', 'עוֹן'], '⌚', 'שָׁ', 'sh', 'n', 'on'),
  w('balon', ['בָּ', 'לוֹן'], '🎈', 'בָּ', 'b', 'n', 'on'),
  w('lashon', ['לָ', 'שׁוֹן'], '👅', 'לָ', 'l', 'n', 'on'),
  w('tapuach', ['תַּ', 'פּוּ', 'חַ'], '🍎', 'תַּ', 't', 'x', 'ach'),
  w('maftea', ['מַף', 'תֵּ', 'חַ'], '🔑', 'מַ', 'm', 'x', 'ach'),
  w('perach', ['פֶּ', 'רַח'], '🌸', 'פֶּ', 'p', 'x', 'ach'),
  w('chatul', ['חָ', 'תוּל'], '🐱', 'חָ', 'x', 'l', 'ul'),
  w('sal', ['סַל'], '🧺', 'סַ', 's', 'l', 'al'),
  w('gamal', ['גָּ', 'מָל'], '🐫', 'גָּ', 'g', 'l', 'al'),
  w('zahav', ['זָ', 'הָב'], '🪙', 'זָ', 'z', 'v', 'av'),
  w('chalav', ['חָ', 'לָב'], '🥛', 'חָ', 'x', 'v', 'av'),
  w('kelev', ['כֶּ', 'לֶב'], '🐕', 'כֶּ', 'k', 'v', 'ev'),
  w('lev', ['לֵב'], '❤️', 'לֵ', 'l', 'v', 'ev'),
  w('rakevet', ['רַ', 'כֶּ', 'בֶת'], '🚂', 'רַ', 'r', 't', 'et'),
  w('nemer', ['נָ', 'מֵר'], '🐅', 'נָ', 'n', 'r', 'er'),
  w('dubi', ['דּוּ', 'בִּי'], '🐻', 'דּוּ', 'd', null, 'bi'),
  w('mayim', ['מַ', 'יִם'], '💧', 'מַ', 'm', 'm', 'im'),
  w('sus', ['סוּס'], '🐴', 'סוּ', 's', 's', 'us'),
  w('pil', ['פִּיל'], '🐘', 'פִּי', 'p', 'l', 'il'),
  w('yad', ['יָד'], '✋', 'יָ', 'y', 'd'),
  w('arie', ['אֲ', 'רִי'], '🦁', 'אֲ', null, null),
  w('etz', ['עֵץ'], '🌳', 'עֵ', null, 'ts'),
  w('har', ['הַר'], '⛰️', 'הַ', null, 'r', 'ar'),
  w('nahar', ['נָ', 'הָר'], '🏞️', 'נָ', 'n', 'r', 'ar'),
  w('tsav', ['צָב'], '🐢', 'צָ', 'ts', 'v'),
  w('kova', ['כּוֹ', 'בַע'], '🎩', 'כּוֹ', 'k', null),
  w('shemesh', ['שֶׁ', 'מֶשׁ'], '☀️', 'שֶׁ', 'sh', 'sh'),
  w('zvuv', ['זְ', 'בוּב'], '🪰', 'זְ', 'z', 'v'),
  w('bayit', ['בַּ', 'יִת'], '🏠', 'בַּ', 'b', 't'),
  w('regel', ['רֶ', 'גֶל'], '🦶', 'רֶ', 'r', 'l'),
  w('mita', ['מִ', 'טָּה'], '🛏️', 'מִ', 'm', null),
  w('tabaat', ['טַ', 'בַּ', 'עַת'], '💍', 'טַ', 't', 't'),
  w('simcha', ['שִׂמְ', 'חָה'], '😊', 'שִׂ', 's', null),
  w('kof', ['קוֹף'], '🐒', 'קוֹ', 'k', 'f'),
  w('bakbuk', ['בַּק', 'בּוּק'], '🍼', 'בַּ', 'b', 'k'),
  w('shalom', ['שָׁ', 'לוֹם'], '👋', 'שָׁ', 'sh', 'm'),
  w('lechem', ['לֶ', 'חֶם'], '🍞', 'לֶ', 'l', 'm'),
  w('ets', ['אֶ', 'צְבַּע'], '👆', 'אֶ', null, null),
  w('tut', ['תּוּת'], '🍓', 'תּוּ', 't', 't'),
]

const L = (char: string, sound: SoundId | undefined, lookAlike: string[] = [], extra: Partial<Letter> = {}): Letter => ({
  char, name: `hebrew.letter.${char}`, sound, lookAlike, ...extra,
})
const LETTERS: Letter[] = [
  L('א', undefined), L('ב', 'b', ['כ']), L('ג', 'g', ['נ']), L('ד', 'd', ['ר']), L('ה', 'h', ['ח', 'ת']), L('ו', 'v', ['ז', 'ן']), L('ז', 'z', ['ו', 'ן']),
  L('ח', 'x', ['ה', 'ת']), L('ט', 't'), L('י', 'y'), L('כ', 'x', ['ב'], { final: 'ך' }), L('ך', 'x', [], { regular: 'כ' }), L('ל', 'l'),
  L('מ', 'm', [], { final: 'ם' }), L('ם', 'm', ['ס'], { regular: 'מ' }), L('נ', 'n', ['ג'], { final: 'ן' }), L('ן', 'n', ['ו', 'ז'], { regular: 'נ' }),
  L('ס', 's', ['ם']), L('ע', undefined, ['צ']), L('פ', 'p', [], { final: 'ף' }), L('ף', 'f', [], { regular: 'פ' }), L('צ', 'ts', ['ע'], { final: 'ץ' }),
  L('ץ', 'ts', [], { regular: 'צ' }), L('ק', 'k'), L('ר', 'r', ['ד']), L('ש', 'sh'), L('ת', 't', ['ה', 'ח']),
]
const SOUND_LABEL: Record<SoundId, string> = {
  b: 'בּ', v: 'ו', g: 'ג', d: 'ד', h: 'ה', z: 'ז', x: 'ח', t: 'ט', y: 'י', k: 'ק', l: 'ל', m: 'מ', n: 'נ', s: 'ס', p: 'פּ', f: 'ף', ts: 'צ', r: 'ר', sh: 'ש',
}
const CV_UNITS = ['כַּ', 'סִ', 'שָׁ', 'בָּ', 'לָ', 'תַּ', 'מַ', 'חָ', 'סַ', 'גָּ', 'זָ', 'כֶּ', 'רַ', 'נָ', 'דּוּ', 'פִּי', 'יָ', 'אֲ', 'אֶ']
const SYLLABLE_WORDS = WORDS.filter(x => x.id !== 'dubi' && x.id !== 'mita').map(x => x.id)
const SAME_SOUND: WordGroups = {
  'ט/תּ': ['tabaat', 'tapuach', 'tut'],
  'ס/שׂ': ['sus', 'sal', 'simcha', 'sipur'],
  'א/ע/ה': ['arie', 'etz', 'har', 'ets'],
  'כּ/ק': ['kadur', 'kelev', 'kof', 'kova'],
}
const DAGESH: WordGroups = {
  'בּ': ['bayit', 'balon', 'bakbuk'], 'ב': ['zvuv', 'tsav', 'zahav', 'sal'],
  'כּ': ['kadur', 'kelev', 'kova'], 'כ': ['maftea', 'tapuach', 'perach'],
  'פּ': ['pil', 'sipur', 'tapuach'], 'פ': ['maftea', 'chalav', 'regel', 'lev'],
  'שׁ': ['shaon', 'shemesh', 'lashon'], 'שׂ': ['sus', 'simcha', 'nemer'],
}

/* ---------- test utilities ---------- */

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)

const KNOWN = new Set<string>([
  ...Object.values(Q), ...WORDS.map(x => wordPhrase(x.id)), ...SYLLABLE_WORDS.map(syllablesPhrase), ...LETTERS.map(l => letterPhrase(l.char)),
  ...Object.keys(SOUND_LABEL).map(s => soundPhrase(s as SoundId)), ...CV_UNITS.map(cvPhrase),
])
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const word = (id: string) => WORDS.find(x => x.id === id)!
const letter = (char: string) => LETTERS.find(l => l.char === char)!

function expectPick(q: PickQ) {
  const optionIds = q.options.map(o => o.id)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  const phrases = [...ids(q.say), q.instruction, ...ids(q.hint), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]
  for (const p of phrases) expect(KNOWN.has(p), p).toBe(true)
  expect(ids(q.say)[0]).toBe(q.instruction)
}
const pictureWords = (q: PickQ) => q.options.map(o => word(o.id))

/* ---------- tests ---------- */

describe('rhyme', () => {
  it('has exactly one rhyming option; distractors are known non-rhymes', () => {
    for (const seed of SEEDS) {
      const q = rhymeQuestion(ctx(seed), WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      expect(q.options).toHaveLength(3)
      expect(q.prompt.picture).toBe(target.emoji)
      expect(q.say).toEqual([Q.rhyme, wordPhrase(target.id)])
      const rhyming = pictureWords(q).filter(x => x.rhyme === target.rhyme)
      expect(rhyming.map(x => x.id)).toEqual([q.answer])
      expect(pictureWords(q).some(x => x.id === target.id)).toBe(false)
      for (const x of pictureWords(q).filter(x => x.id !== q.answer)) expect(x.rhyme).toBeTruthy()
    }
  })
  it('only asks words that have a rhyming partner', () => {
    expect(rhymeAccepts(WORDS)('kadur')).toBe(true)
    expect(rhymeAccepts(WORDS)('yad')).toBe(false)
    for (const seed of SEEDS) expect(word(rhymeQuestion(ctx(seed), WORDS).itemKey).rhyme).toBeTruthy()
  })
})

describe('syllables', () => {
  it('answer is the syllable count of a syllable word, with its phrases', () => {
    for (const seed of SEEDS) {
      const q = syllablesQuestion(ctx(seed), WORDS, SYLLABLE_WORDS)
      expect(SYLLABLE_WORDS).toContain(q.word.id)
      expect(q.answer).toBe(q.word.syllables.length)
      expect(q.answer).toBeGreaterThanOrEqual(1)
      expect(q.syllablesSay).toBe(syllablesPhrase(q.word.id))
      expect(KNOWN.has(q.syllablesSay as string)).toBe(true)
      for (const p of ids(q.say)) expect(KNOWN.has(p)).toBe(true)
      expect(q.itemKey).toBe(q.word.id)
    }
    expect(syllablesAccepts(WORDS, SYLLABLE_WORDS)('dubi')).toBe(false)
  })
  it('covers 1 to 3 syllables across seeds', () => {
    const counts = new Set(SEEDS.map(s => syllablesQuestion(ctx(s), WORDS, SYLLABLE_WORDS).answer))
    expect([...counts].sort()).toEqual([1, 2, 3])
  })
})

describe('opening consonant + vowel', () => {
  it('one picture starts with the unit; no other option sounds the same at the start', () => {
    for (const seed of SEEDS) {
      const q = openingCvQuestion(ctx(seed), WORDS, CV_UNITS)
      expectPick(q)
      expect(q.options).toHaveLength(4)
      const unit = q.itemKey
      expect(q.say).toEqual([Q.cv, cvPhrase(unit)])
      const correct = word(q.answer as string)
      expect(correct.opening).toBe(unit)
      const wrong = pictureWords(q).filter(x => x.id !== correct.id)
      for (const x of wrong) {
        expect(x.opening).not.toBe(unit)
        // Same consonant sound and same vowel marks would sound identical (e.g. טָ / תָ).
        const marks = (s: string) => s.slice(1).replace(/[ּׁׂ]/g, '')
        expect(x.first === correct.first && marks(x.opening) === marks(unit)).toBe(false)
      }
      expect(new Set(wrong.map(x => `${x.first}|${x.opening}`)).size).toBe(3)
    }
  })
  it('review is honored only for known units', () => {
    expect(openingCvQuestion(ctx(1, [], 'סִ'), WORDS, CV_UNITS).itemKey).toBe('סִ')
    expect(openingCvQuestion(ctx(1, [], 'ZZ'), WORDS, CV_UNITS).itemKey).not.toBe('ZZ')
    expect(cvAccepts(WORDS, CV_UNITS)('סִ')).toBe(true)
    expect(cvAccepts(WORDS, CV_UNITS)('ZZ')).toBe(false)
  })
})

describe('opening sound', () => {
  it('level B: one picture opens with the sound, never a vowel-initial word', () => {
    for (const seed of SEEDS) {
      const q = openingSoundQuestion(ctx(seed), WORDS, 'B')
      expectPick(q)
      expect(q.options).toHaveLength(4)
      expect(q.say).toEqual([Q.sound, soundPhrase(q.itemKey as SoundId)])
      const opts = pictureWords(q)
      for (const x of opts) expect(x.first).not.toBeNull()
      expect(opts.filter(x => x.first === q.itemKey).map(x => x.id)).toEqual([q.answer])
      expect(new Set(opts.map(x => x.first)).size).toBe(4)
    }
  })
  it('level A: only continuous sounds, in the question and in every option', () => {
    const seen = new Set<string>()
    for (const seed of SEEDS) {
      const q = openingSoundQuestion(ctx(seed), WORDS, 'A')
      expectPick(q)
      seen.add(q.itemKey)
      expect(CONTINUOUS_SOUNDS).toContain(q.itemKey)
      for (const x of pictureWords(q)) expect(CONTINUOUS_SOUNDS).toContain(x.first)
    }
    expect(seen.size).toBeGreaterThan(3)
  })
  it('review is honored when valid for the level only', () => {
    expect(openingSoundQuestion(ctx(2, [], 'sh'), WORDS, 'A').itemKey).toBe('sh')
    expect(openingSoundQuestion(ctx(2, [], 'k'), WORDS, 'B').itemKey).toBe('k')
    expect(openingSoundQuestion(ctx(2, [], 'k'), WORDS, 'A').itemKey).not.toBe('k')
    expect(openingSoundAccepts(WORDS, 'A')('k')).toBe(false)
    expect(openingSoundAccepts(WORDS, 'B')('k')).toBe(true)
  })
})

describe('closing sound', () => {
  it('asks only words ending in a consonant sound; 3 distinct sound buttons', () => {
    for (const seed of SEEDS) {
      const q = closingSoundQuestion(ctx(seed), WORDS, SOUND_LABEL)
      expectPick(q)
      const target = word(q.itemKey)
      expect(target.last).not.toBeNull()
      expect(q.answer).toBe(target.last)
      expect(q.options).toHaveLength(3)
      expect(q.prompt.picture).toBe(target.emoji)
      expect(new Set(q.options.map(o => 'label' in o && o.label)).size).toBe(3)
      for (const o of q.options) {
        expect(o.kind).toBe('sound')
        if (o.kind === 'sound') {
          expect(o.label).toBe(SOUND_LABEL[o.id as SoundId])
          expect(o.say).toBe(soundPhrase(o.id as SoundId))
        }
      }
    }
    expect(closingAccepts(WORDS)('dubi')).toBe(false)
  })
})

describe('letter names', () => {
  it('splits the 22 regular letters into the four alphabetical groups', () => {
    const groups = ([0, 1, 2, 3] as LetterGroup[]).map(g => letterGroup(LETTERS, g).map(l => l.char).join(''))
    expect(groups).toEqual(['אבגדה', 'וזחטי', 'כלמנס', 'עפצקרשת'])
    expect(LETTER_GROUPS.map(([a, b]) => a + b)).toEqual(['אה', 'וי', 'כס', 'עת'])
    expect(groups.join('')).toHaveLength(22)
  })
  it('find: one correct letter, look-alikes appear, twins of the target never do', () => {
    for (const g of [0, 1, 2, 3] as LetterGroup[])
      for (const seed of SEEDS) {
        const q = findLetterQuestion(ctx(seed), LETTERS, g)
        expectPick(q)
        const target = letter(q.itemKey)
        expect(letterGroup(LETTERS, g)).toContain(target)
        expect(q.options).toHaveLength(4)
        expect(q.say).toEqual([Q.findLetter, letterPhrase(target.char)])
        expect(q.answer).toBe(target.char)
        for (const o of q.options) expect(o).toMatchObject({ kind: 'letter', label: o.id })
        const wrong = q.options.map(o => letter(o.id)).filter(l => l.char !== target.char)
        for (const l of wrong) {
          expect(l.name).not.toBe(target.name)
          expect(l.char === target.final || l.regular === target.char).toBe(false)
        }
        const inList = target.lookAlike.filter(c => LETTERS.some(l => l.char === c))
        if (inList.length) expect(wrong.some(l => inList.includes(l.char))).toBe(true)
      }
  })
  it('name: 3 spoken buttons with distinct names, hint gives name and sound', () => {
    for (const g of [0, 1, 2, 3] as LetterGroup[])
      for (const seed of SEEDS) {
        const q = nameLetterQuestion(ctx(seed), LETTERS, g)
        expectPick(q)
        expect(q.prompt.letter).toBe(q.itemKey)
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options.map(o => ('say' in o ? o.say : ''))).size).toBe(3)
        for (const o of q.options) expect(o).toMatchObject({ kind: 'sound', say: letterPhrase(o.id) })
        const t = letter(q.itemKey)
        expect(ids(q.hint)).toEqual(t.sound ? [Q.thisIs, letterPhrase(t.char), Q.andSays, soundPhrase(t.sound)] : [Q.thisIs, letterPhrase(t.char)])
      }
  })
  it('review and avoid', () => {
    expect(findLetterQuestion(ctx(1, [], 'מ'), LETTERS, 2).itemKey).toBe('מ')
    expect(findLetterQuestion(ctx(1, [], 'ת'), LETTERS, 2).itemKey).not.toBe('ת')
    expect(letterAccepts(LETTERS, 2)('מ')).toBe(true)
    expect(letterAccepts(LETTERS, 2)('ך')).toBe(false)
    for (const seed of SEEDS) expect(nameLetterQuestion(ctx(seed, ['א', 'ב', 'ג', 'ד']), LETTERS, 0).itemKey).toBe('ה')
  })
})

describe('letter and picture', () => {
  it('A: one picture starts with the letter; no wrong picture has its letter or its sound', () => {
    const asked = new Set<string>()
    for (const seed of SEEDS) {
      const q = letterToPictureQuestion(ctx(seed), LETTERS, WORDS)
      expectPick(q)
      asked.add(q.itemKey)
      const l = letter(q.itemKey)
      expect(q.prompt.letter).toBe(l.char)
      expect(q.options).toHaveLength(4)
      const opts = pictureWords(q)
      const correct = word(q.answer as string)
      expect(correct.text[0]).toBe(l.char)
      const wrong = opts.filter(x => x.id !== correct.id)
      for (const x of wrong) {
        expect(x.first).not.toBeNull()
        expect(x.text[0]).not.toBe(l.char)
        expect(x.first).not.toBe(correct.first)
        expect(x.first).not.toBe(l.sound)
      }
      expect(new Set(opts.map(x => x.first)).size).toBe(4)
    }
    expect(asked.has('א')).toBe(false)
    expect(asked.has('ך')).toBe(false)
  })
  it('B: the correct first letter is among 4 letters, none of them sounds like it', () => {
    for (const seed of SEEDS) {
      const q = pictureToLetterQuestion(ctx(seed), LETTERS, WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      expect(target.first).not.toBeNull()
      expect(q.answer).toBe(target.text[0])
      expect(q.options).toHaveLength(4)
      const answer = letter(q.answer as string)
      for (const o of q.options.filter(o => o.id !== q.answer)) {
        const l = letter(o.id)
        expect(l.regular).toBeUndefined()
        expect(l.sound === undefined || (l.sound !== target.first && l.sound !== answer.sound)).toBe(true)
      }
    }
  })
  it('accepts predicates', () => {
    expect(letterToPictureAccepts(LETTERS, WORDS)('ב')).toBe(true)
    expect(letterToPictureAccepts(LETTERS, WORDS)('א')).toBe(false)
    expect(pictureToLetterAccepts(LETTERS, WORDS)('kadur')).toBe(true)
    expect(pictureToLetterAccepts(LETTERS, WORDS)('arie')).toBe(false)
  })
})

describe('finals', () => {
  it('A: both directions, one correct form, no duplicate of the twin', () => {
    const dirs = new Set<string>()
    for (const seed of SEEDS) {
      const q = finalsFormQuestion(ctx(seed), LETTERS)
      expectPick(q)
      const reg = letter(q.itemKey)
      expect(reg.final).toBeDefined()
      expect(q.options).toHaveLength(4)
      if (q.instruction === Q.finalOf) {
        dirs.add('toFinal')
        expect(q.prompt.letter).toBe(reg.char)
        expect(q.answer).toBe(reg.final)
        for (const o of q.options) expect(letter(o.id).regular).toBeDefined()
      } else {
        dirs.add('toRegular')
        expect(q.instruction).toBe(Q.regularOf)
        expect(q.prompt.letter).toBe(reg.final)
        expect(q.answer).toBe(reg.char)
        for (const o of q.options) expect(letter(o.id).regular).toBeUndefined()
        expect(q.options.some(o => o.id === reg.final)).toBe(false)
      }
    }
    expect([...dirs].sort()).toEqual(['toFinal', 'toRegular'])
    expect(finalsAccepts(LETTERS)('מ')).toBe(true)
    expect(finalsAccepts(LETTERS)('ב')).toBe(false)
  })
  it('B: word missing its last letter; final and regular form offered, other options do not sound the same', () => {
    for (const seed of SEEDS) {
      const q = finalsWordQuestion(ctx(seed), LETTERS, WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      const final = letter(q.answer as string)
      expect(final.regular).toBeDefined()
      expect(q.prompt.word).toEqual({ text: target.text.slice(0, target.text.lastIndexOf(final.char)), blank: 'end' })
      expect(target.text.startsWith(q.prompt.word!.text)).toBe(true)
      expect(q.options).toHaveLength(4)
      expect(q.options.some(o => o.id === final.regular)).toBe(true)
      for (const o of q.options.filter(o => o.id !== final.char && o.id !== final.regular)) expect(letter(o.id).sound).not.toBe(target.last)
    }
    expect(finalsWordAccepts(LETTERS, WORDS)('mayim')).toBe(true)
    expect(finalsWordAccepts(LETTERS, WORDS)('kadur')).toBe(false)
  })
})

describe('same-sound letters', () => {
  it('options are exactly the same-sound set for the word, with the right letter among them', () => {
    const sets = new Set<string>()
    for (const seed of SEEDS) {
      const q = sameSoundQuestion(ctx(seed), WORDS, SAME_SOUND)
      expectPick(q)
      const target = word(q.itemKey)
      const [key] = Object.entries(SAME_SOUND).find(([, v]) => v.includes(target.id))!
      expect(q.options.map(o => o.id).sort()).toEqual(key.split('/').map(normLetter).sort())
      expect(q.answer).toBe(firstLetter(target.text))
      expect(q.prompt.word?.blank).toBe('start')
      expect(target.text.endsWith(q.prompt.word!.text)).toBe(true)
      expect(q.prompt.word!.text[0]).not.toBe(target.text[0])
      sets.add(key)
    }
    expect(sets.size).toBe(4)
    expect(sameSoundAccepts(WORDS, SAME_SOUND)('yad')).toBe(false)
  })
  it('skips group members whose first letter is not in the group', () => {
    for (const seed of SEEDS) expect(sameSoundQuestion(ctx(seed), WORDS, { 'ט/תּ': ['tabaat', 'kadur'] }).itemKey).toBe('tabaat')
  })
})

describe('dagesh sort', () => {
  it('6 cards, 3 per bin, each from the right group, one pair per board', () => {
    const pairs = new Set<string>()
    for (const seed of SEEDS) {
      const q = dageshQuestion(ctx(seed), WORDS, DAGESH)
      expect(q.cards).toHaveLength(6)
      expect(q.cards.filter(c => c.bin === 0)).toHaveLength(3)
      expect(q.cards.filter(c => c.bin === 1)).toHaveLength(3)
      expect(new Set(q.cards.map(c => c.id)).size).toBe(6)
      expect(new Set(q.cards.map(c => c.emoji)).size).toBe(6)
      expect(q.say).toBe(Q.sort)
      expect(KNOWN.has(q.say as string)).toBe(true)
      const [a, b] = q.bins
      pairs.add(`${a}/${b}`)
      const key = (label: string) => Object.keys(DAGESH).find(k => normLetter(k) === normLetter(label))!
      for (const c of q.cards) {
        expect(DAGESH[key(q.bins[c.bin])]).toContain(c.id)
        expect(DAGESH[key(q.bins[c.bin === 0 ? 1 : 0])]).not.toContain(c.id)
        expect(c.say).toBe(wordPhrase(c.id))
        expect(KNOWN.has(c.say as string)).toBe(true)
        expect(c.text).toBe(word(c.id).text)
      }
      expect(q.itemKey.startsWith(`${a}/${b}:`)).toBe(true)
    }
    expect(pairs.size).toBe(4)
  })
  it('a word in both bins is never a card; a pair with too few words is skipped', () => {
    for (const seed of SEEDS) {
      const q = dageshQuestion(ctx(seed), WORDS, { ...DAGESH, 'ב': ['zvuv', 'tsav', 'bayit'], 'שׂ': ['sus'] })
      expect(q.bins[0]).not.toBe('שׁ')
      expect(q.cards.some(c => c.id === 'bayit' && c.bin === 1)).toBe(false)
    }
  })
  it('avoid steers away from pairs already on the round; review brings a pair back', () => {
    const first = dageshQuestion(ctx(1), WORDS, DAGESH)
    const pair = first.itemKey.split(':')[0]
    for (const seed of SEEDS) expect(dageshQuestion(ctx(seed, [first.itemKey]), WORDS, DAGESH).itemKey.split(':')[0]).not.toBe(pair)
    for (const seed of SEEDS) expect(dageshQuestion(ctx(seed, [], first.itemKey), WORDS, DAGESH).itemKey.split(':')[0]).toBe(pair)
  })
})

describe('review and avoid, all generators', () => {
  const cases: { name: string; gen: (c: GenContext) => { itemKey: string }; valid: string }[] = [
    { name: 'rhyme', gen: c => rhymeQuestion(c, WORDS), valid: 'balon' },
    { name: 'syllables', gen: c => syllablesQuestion(c, WORDS, SYLLABLE_WORDS), valid: 'kadur' },
    { name: 'opening-cv', gen: c => openingCvQuestion(c, WORDS, CV_UNITS), valid: 'בָּ' },
    { name: 'opening-sound', gen: c => openingSoundQuestion(c, WORDS, 'B'), valid: 'b' },
    { name: 'closing', gen: c => closingSoundQuestion(c, WORDS, SOUND_LABEL), valid: 'kadur' },
    { name: 'find', gen: c => findLetterQuestion(c, LETTERS, 1), valid: 'ח' },
    { name: 'name', gen: c => nameLetterQuestion(c, LETTERS, 3), valid: 'ק' },
    { name: 'letter-picture A', gen: c => letterToPictureQuestion(c, LETTERS, WORDS), valid: 'ב' },
    { name: 'letter-picture B', gen: c => pictureToLetterQuestion(c, LETTERS, WORDS), valid: 'kelev' },
    { name: 'finals A', gen: c => finalsFormQuestion(c, LETTERS), valid: 'נ' },
    { name: 'finals B', gen: c => finalsWordQuestion(c, LETTERS, WORDS), valid: 'shalom' },
    { name: 'same-sound', gen: c => sameSoundQuestion(c, WORDS, SAME_SOUND), valid: 'tut' },
  ]
  for (const { name, gen, valid } of cases)
    it(`${name}: valid review honored, invalid ignored, avoid respected`, () => {
      for (const seed of SEEDS.slice(0, 60)) {
        expect(gen(ctx(seed, [], valid)).itemKey).toBe(valid)
        expect(gen(ctx(seed, [], 'not-an-item')).itemKey).not.toBe('not-an-item')
        const k = gen(ctx(seed)).itemKey
        expect(gen(ctx(seed, [k])).itemKey).not.toBe(k)
        // Review wins over avoid: the planner asked for it explicitly.
        expect(gen(ctx(seed, [valid], valid)).itemKey).toBe(valid)
      }
    })
  it('falls back to repeats when every item was already asked', () => {
    const q = rhymeQuestion(ctx(1, WORDS.map(x => x.id)), WORDS)
    expect(rhymeAccepts(WORDS)(q.itemKey)).toBe(true)
  })
})
