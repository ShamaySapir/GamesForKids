import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import { wordPhrase } from '../hebrew/ids'
import type { Letter, PickQ, SoundId, Word } from '../hebrew/types'
import {
  SEE_UNIT_LABELS, bookAccepts, bookQuestion, buildAccepts, buildQuestion, clozeAccepts, clozeQuestion, hearUnitQuestion, pictureWordQuestion,
  readWordQuestion, seeUnitQuestion, sentenceAccepts, sentenceQuestion, storyAccepts, storyOrderQuestion, unitAccepts, wordAccepts,
} from './generators'
import { R, clozePhrase, pagePhrase, sentencePhrase, storyPhrase, unitPhrase } from './ids'
import type { Book, Cloze, OrderQ, Sentence, Story, Unit, Vowel } from './types'

/* ---------- fixtures (nikud is plausible, not curated: the generators only rely on the structure) ---------- */

const L = (char: string, sound: SoundId, lookAlike: string[]): Letter => ({ char, name: `hebrew.letter.${char}`, sound, lookAlike })
const LETTERS: Letter[] = [
  L('ב', 'b', ['כ']), L('כ', 'k', ['ב']), L('ד', 'd', ['ר']), L('ר', 'r', ['ד']), L('מ', 'm', []), L('ל', 'l', []),
]

const U = (key: string, letter: string, spellings: string[]): Unit => {
  const [sound, vowel] = key.split('-') as [SoundId, Vowel]
  return { key, sound, vowel, spellings, letter }
}
const UNITS: Unit[] = [
  U('b-a', 'ב', ['בַּ', 'בָּ']), U('k-a', 'כ', ['כַּ', 'כָּ']), U('d-a', 'ד', ['דַּ', 'דָּ']), U('r-a', 'ר', ['רַ', 'רָ']), U('m-a', 'מ', ['מַ', 'מָ']),
  U('b-i', 'ב', ['בִּ', 'בִּי']), U('k-i', 'כ', ['כִּ', 'כִּי']), U('d-i', 'ד', ['דִּ', 'דִּי']), U('r-i', 'ר', ['רִ', 'רִי']), U('m-i', 'מ', ['מִ', 'מִי']),
  U('l-i', 'ל', ['לִ', 'לִי']),
]

const w = (id: string, syllables: string[], emoji: string, first: SoundId | null): Word => ({
  id, text: syllables.join(''), emoji, syllables, opening: syllables[0]!, first, last: null,
})
const WORDS: Word[] = [
  w('kadur', ['כַּ', 'דּוּר'], '⚽', 'k'), w('sipur', ['סִ', 'פּוּר'], '📖', 's'), w('balon', ['בָּ', 'לוֹן'], '🎈', 'b'),
  w('tapuach', ['תַּ', 'פּוּ', 'חַ'], '🍎', 't'), w('perach', ['פֶּ', 'רַח'], '🌸', 'p'), w('chatul', ['חָ', 'תוּל'], '🐱', 'x'),
  w('sal', ['סַל'], '🧺', 's'), w('gamal', ['גָּ', 'מָל'], '🐫', 'g'), w('zahav', ['זָ', 'הָב'], '🪙', 'z'),
  w('kelev', ['כֶּ', 'לֶב'], '🐕', 'k'), w('rakevet', ['רַ', 'כֶּ', 'בֶת'], '🚂', 'r'), w('dubi', ['דּוּ', 'בִּי'], '🐻', 'd'),
  w('arie', ['אֲ', 'רִי'], '🦁', null), w('bakbuk', ['בַּק', 'בּוּק'], '🍼', 'b'), w('mama', ['מָ', 'מָ'], '👩', 'm'),
  w('simcha', ['שִׂמ', 'חָ', 'הָ', 'אָ', 'בָּ'], '😊', 's'),
]

const S = (id: string, text: string, scene: string, tags: Record<string, string>): Sentence => ({ id, text, scene, tags })
const SENTENCES: Sentence[] = [
  S('s1', 'הַחָתוּל יָשֵׁן', '🐱💤', { who: 'cat', does: 'sleep' }),
  S('s2', 'הַחָתוּל שׁוֹתֶה חָלָב', '🐱🍼', { who: 'cat', does: 'drink' }),
  S('s3', 'הַכֶּלֶב יָשֵׁן', '🐶💤', { who: 'dog', does: 'sleep' }),
  S('s4', 'הַכֶּלֶב אוֹכֵל עֶצֶם', '🐶🦴', { who: 'dog', does: 'eat' }),
  S('s5', 'הַיֶּלֶד שׁוֹתֶה מַיִם', '👦💧', { who: 'boy', does: 'drink' }),
  S('s6', 'הַיַּלְדָּה אוֹכֶלֶת תַּפּוּחַ', '👧🍎', { who: 'girl', does: 'eat' }),
  S('s7', 'הַדֹּב יָשֵׁן', '🐻💤', { who: 'bear', does: 'sleep' }),
  S('s8', 'הַשֶּׁמֶשׁ זוֹרַחַת', '☀️', { what: 'sun' }),
]

const C = (id: string, text: string, answer: string, wrong: [string, string]): Cloze => ({ id, text, answer, wrong })
const CLOZES: Cloze[] = [
  C('c1', 'הַחָתוּל ___ חָלָב', 'שׁוֹתֶה', ['רָץ', 'יָשֵׁן']),
  C('c2', 'אֲנִי הוֹלֵךְ ___ הַבַּיִת', 'אֶל', ['עַל', 'כֶּלֶב']),
  C('c3', 'הַכֶּלֶב ___ בַּגַּן', 'רָץ', ['שׁוֹתֶה', 'אוֹכֵל']),
  C('c4', 'הַשֶּׁמֶשׁ ___', 'זוֹרַחַת', ['יוֹרֶדֶת', 'שׁוֹחָה']),
]

const ST = (id: string, scene: string): Story => ({ id, scene, sentences: [`${id} א`, `${id} ב`, `${id} ג`] })
const STORIES: Story[] = [ST('t1', '🌧️'), ST('t2', '🎂'), ST('t3', '🚌')]

const BOOKS: Book[] = [1, 2].map(n => ({
  id: `book${n}`, title: `ספר ${n}`, cover: '📕', stage: n as 1 | 2,
  pages: [{ text: 'עמוד', scene: '🦉' }], questions: [{ prompt: 'שאלה', options: [{ text: 'כן' }, { text: 'לא' }], answer: 0 }],
}))

/* ---------- test utilities ---------- */

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)

const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const known = (...sets: string[][]) => new Set<string>([...Object.values(R), ...sets.flat()])
const KNOWN = known(
  UNITS.map(u => unitPhrase(u.key)), [wordPhrase('dede')], WORDS.map(x => wordPhrase(x.id)), SENTENCES.map(s => sentencePhrase(s.id)), CLOZES.map(c => clozePhrase(c.id)),
  STORIES.flatMap(s => [0, 1, 2].map(n => storyPhrase(s.id, n))), BOOKS.flatMap(b => b.pages.map((_, i) => pagePhrase(b.id, i))),
)
const word = (id: string) => WORDS.find(x => x.id === id)!
const unit = (key: string) => UNITS.find(u => u.key === key)!
const sentence = (id: string) => SENTENCES.find(s => s.id === id)!

function expectPick(q: PickQ) {
  const optionIds = q.options.map(o => o.id)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  const phrases = [...ids(q.say), q.instruction, ...ids(q.hint), ...q.options.flatMap(o => ('say' in o ? ids(o.say) : []))]
  for (const p of phrases) expect(KNOWN.has(p), p).toBe(true)
  expect(ids(q.say)[0]).toBe(q.instruction)
}

function expectOrder(q: OrderQ) {
  const tileIds = q.tiles.map(t => t.id)
  expect(new Set(tileIds).size).toBe(tileIds.length)
  expect([...q.answer].sort()).toEqual([...tileIds].sort())
  const byId = new Map(q.tiles.map(t => [t.id, t]))
  // Compared by text so that swapping two identical syllables does not count as "different".
  expect(q.tiles.map(t => t.text)).not.toEqual(q.answer.map(id => byId.get(id)!.text))
  for (const p of [...ids(q.say), q.instruction, ...q.tiles.flatMap(t => ids(t.say))]) expect(KNOWN.has(p), p).toBe(true)
}

/* ---------- vowel units ---------- */

describe('hear unit', () => {
  for (const vowel of ['a', 'i'] as const) {
    it(`vowel ${vowel}: one option per unit, answer once, no two options sound alike`, () => {
      for (const seed of SEEDS) {
        const q = hearUnitQuestion(ctx(seed), UNITS, LETTERS, vowel)
        expectPick(q)
        const target = unit(q.itemKey)
        expect(target.vowel).toBe(vowel)
        expect(q.answer).toBe(target.key)
        expect(q.prompt).toEqual({})
        expect(q.say).toEqual([R.hearUnit, unitPhrase(target.key)])
        expect(q.hint).toBe(unitPhrase(target.key))
        expect(q.options).toHaveLength(4)
        const opts = q.options.map(o => ({ o, u: unit(o.id) }))
        // Sound+vowel are unique, so two spellings of one unit can never both appear.
        expect(new Set(opts.map(x => x.u.key)).size).toBe(4)
        for (const { o, u } of opts) {
          expect(o.kind).toBe('text')
          expect(u.spellings).toContain((o as { label: string }).label)
        }
        expect(new Set(opts.map(x => (x.o as { label: string }).label)).size).toBe(4)
      }
    })
  }
  it('prefers the same letter with another vowel or a look-alike letter', () => {
    for (const seed of SEEDS) {
      const q = hearUnitQuestion(ctx(seed, [], 'b-a'), UNITS, LETTERS, 'a')
      const wrong = q.options.filter(o => o.id !== 'b-a').map(o => unit(o.id))
      // Near distractors for b-a: b-i (same letter), k-a (look-alike) — both always present as the near tier has only these two.
      expect(wrong.map(u => u.key)).toEqual(expect.arrayContaining(['b-i', 'k-a']))
    }
  })
  it('shows both spellings across seeds', () => {
    const labels = new Set(SEEDS.map(s => (hearUnitQuestion(ctx(s, [], 'm-a'), UNITS, LETTERS, 'a').options.find(o => o.id === 'm-a') as { label: string }).label))
    expect(labels).toEqual(new Set(['מַ', 'מָ']))
  })
  it('honors review when valid and ignores it when not', () => {
    expect(hearUnitQuestion(ctx(1, [], 'd-a'), UNITS, LETTERS, 'a').itemKey).toBe('d-a')
    expect(hearUnitQuestion(ctx(1, [], 'd-i'), UNITS, LETTERS, 'a').itemKey).not.toBe('d-i')
    expect(hearUnitQuestion(ctx(1, [], 'zzz'), UNITS, LETTERS, 'a').itemKey).not.toBe('zzz')
    expect(unitAccepts(UNITS, 'a')('d-a')).toBe(true)
    expect(unitAccepts(UNITS, 'a')('d-i')).toBe(false)
  })
  it('avoids repeats while alternatives exist', () => {
    for (const seed of SEEDS) expect(hearUnitQuestion(ctx(seed, ['b-a', 'k-a', 'd-a', 'r-a']), UNITS, LETTERS, 'a').itemKey).toBe('m-a')
  })
})

describe('see unit', () => {
  it('shows one spelling big, 3 colored sound buttons in fixed label order, distinct sound or vowel', () => {
    for (const seed of SEEDS) {
      const q = seeUnitQuestion(ctx(seed), UNITS, LETTERS, 'i')
      expectPick(q)
      const target = unit(q.itemKey)
      expect(target.vowel).toBe('i')
      expect(target.spellings).toContain(q.prompt.letter)
      expect(q.say).toBe(R.seeUnit)
      expect(q.options).toHaveLength(3)
      q.options.forEach((o, i) => {
        expect(o.kind).toBe('sound')
        expect(o).toMatchObject({ label: SEE_UNIT_LABELS[i], say: unitPhrase(o.id) })
      })
      const opts = q.options.map(o => unit(o.id))
      expect(new Set(opts.map(u => `${u.sound}-${u.vowel}`)).size).toBe(3)
      // The prompt spelling belongs to the answer only.
      for (const u of opts.filter(u => u.key !== target.key)) expect(u.spellings).not.toContain(q.prompt.letter)
    }
  })
  it('places the answer in every position', () => {
    const positions = new Set(SEEDS.map(s => seeUnitQuestion(ctx(s), UNITS, LETTERS, 'a')).map(q => q.options.findIndex(o => o.id === q.answer)))
    expect(positions).toEqual(new Set([0, 1, 2]))
  })
  it('honors review, ignores an invalid one, respects avoid', () => {
    expect(seeUnitQuestion(ctx(3, [], 'r-i'), UNITS, LETTERS, 'i').itemKey).toBe('r-i')
    expect(seeUnitQuestion(ctx(3, [], 'r-a'), UNITS, LETTERS, 'i').itemKey).not.toBe('r-a')
    for (const seed of SEEDS) expect(seeUnitQuestion(ctx(seed, ['b-i', 'k-i', 'd-i', 'r-i', 'm-i']), UNITS, LETTERS, 'i').itemKey).toBe('l-i')
  })
})

/* ---------- build ---------- */

describe('build', () => {
  it('tiles are the word syllables with unique ids; never starts solved; phrases known', () => {
    for (const seed of SEEDS) {
      const q = buildQuestion(ctx(seed), WORDS)
      expectOrder(q)
      const target = word(q.itemKey)
      expect(target.syllables.length).toBeGreaterThanOrEqual(2)
      expect(target.syllables.length).toBeLessThanOrEqual(4)
      expect(q.layout).toBe('units')
      expect(q.picture).toBe(target.emoji)
      expect(q.say).toEqual([R.build, wordPhrase(target.id)])
      expect(q.answer.map(id => q.tiles.find(t => t.id === id)!.text).join('')).toBe(target.text)
      for (const t of q.tiles) expect(t.say).toBe(wordPhrase(target.id))
    }
  })
  it('keeps repeated syllables distinct by id and skips words whose tiles cannot differ', () => {
    const q = buildQuestion(ctx(1, [], 'mama'), WORDS)
    expect(q.itemKey).not.toBe('mama')
    const twice = w('dede', ['דֶּ', 'דֶּ', 'לֶ'], '🅰️', 'd')
    for (const seed of SEEDS) {
      const o = buildQuestion(ctx(seed, [], 'dede'), [twice])
      expect(o.answer).toEqual(['דֶּ#0', 'דֶּ#1', 'לֶ#2'])
      expectOrder(o)
    }
  })
  it('ignores words outside 2–4 syllables', () => {
    for (const seed of SEEDS) expect(['sal', 'simcha']).not.toContain(buildQuestion(ctx(seed), WORDS).itemKey)
    expect(buildAccepts(WORDS)('sal')).toBe(false)
    expect(buildAccepts(WORDS)('simcha')).toBe(false)
    expect(buildAccepts(WORDS)('kadur')).toBe(true)
  })
  it('honors review and avoid', () => {
    expect(buildQuestion(ctx(2, [], 'kadur'), WORDS).itemKey).toBe('kadur')
    expect(buildQuestion(ctx(2, [], 'sal'), WORDS).itemKey).not.toBe('sal')
    const all = WORDS.filter(x => buildAccepts(WORDS)(x.id) && x.id !== 'mama').map(x => x.id)
    for (const seed of SEEDS) expect(buildQuestion(ctx(seed, all.filter(i => i !== 'dubi')), WORDS).itemKey).toBe('dubi')
  })
})

/* ---------- words and pictures ---------- */

describe('read word', () => {
  it('shows the word, 4 pictures with distinct emoji, one correct; prefers another first sound', () => {
    for (const seed of SEEDS) {
      const q = readWordQuestion(ctx(seed), WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      expect(q.prompt).toEqual({ word: { text: target.text } })
      expect(q.say).toBe(R.readWord)
      expect(q.hint).toBe(wordPhrase(target.id))
      expect(q.options).toHaveLength(4)
      const emojis = q.options.map(o => (o as { emoji: string }).emoji)
      expect(new Set(emojis).size).toBe(4)
      expect(q.options.find(o => o.id === q.answer)).toMatchObject({ emoji: target.emoji })
      // Plenty of words with other first sounds exist, so none may share the target's.
      for (const o of q.options.filter(o => o.id !== q.answer)) {
        expect(word(o.id).first).not.toBe(target.first)
        expect(word(o.id).first).not.toBeNull()
      }
    }
  })
  it('falls back to any word when first sounds run out', () => {
    const few = WORDS.filter(x => ['kadur', 'kelev', 'sal', 'sipur'].includes(x.id))
    for (const seed of SEEDS) {
      const q = readWordQuestion(ctx(seed), few)
      expectPick(q)
      expect(q.options).toHaveLength(4)
    }
  })
  it('honors review and avoid', () => {
    expect(readWordQuestion(ctx(1, [], 'kelev'), WORDS).itemKey).toBe('kelev')
    expect(readWordQuestion(ctx(1, [], 'nope'), WORDS).itemKey).not.toBe('nope')
    expect(wordAccepts(WORDS)('kelev')).toBe(true)
    const rest = WORDS.map(x => x.id).filter(i => i !== 'dubi')
    for (const seed of SEEDS) expect(readWordQuestion(ctx(seed, rest), WORDS).itemKey).toBe('dubi')
  })
})

describe('picture word', () => {
  it('shows the picture, 3 distinct written words, one correct', () => {
    for (const seed of SEEDS) {
      const q = pictureWordQuestion(ctx(seed), WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      expect(q.prompt).toEqual({ picture: target.emoji })
      expect(q.say).toBe(R.pictureWord)
      expect(q.options).toHaveLength(3)
      const labels = q.options.map(o => (o as { label: string }).label)
      expect(new Set(labels).size).toBe(3)
      expect(q.options.every(o => o.kind === 'text')).toBe(true)
      expect(labels).toContain(target.text)
      expect(word(q.answer).text).toBe(target.text)
      for (const o of q.options.filter(o => o.id !== q.answer)) expect(word(o.id).emoji).not.toBe(target.emoji)
    }
  })
  it('prefers look-alike words: same opening letter first', () => {
    for (const seed of SEEDS) {
      const q = pictureWordQuestion(ctx(seed, [], 'kadur'), WORDS)
      // Only kelev shares the opening letter כ with kadur; the other distractor is a same-length word.
      expect(q.options.map(o => o.id)).toContain('kelev')
    }
  })
  it('never offers a distractor with the same text as the answer', () => {
    const twin: Word = { ...word('kadur'), id: 'kadur2', emoji: '🏀' }
    for (const seed of SEEDS) {
      const q = pictureWordQuestion(ctx(seed, [], 'kadur'), [...WORDS, twin])
      expect(new Set(q.options.map(o => (o as { label: string }).label)).size).toBe(3)
    }
  })
})

/* ---------- sentences ---------- */

const shared = (a: Sentence, b: Sentence) => Object.keys(a.tags).filter(k => a.tags[k] === b.tags[k]).length

describe('sentence → picture', () => {
  it('shows the sentence without sound, 3 distinct scenes, one fits; others share a tag but not all', () => {
    for (const seed of SEEDS) {
      const q = sentenceQuestion(ctx(seed), SENTENCES)
      expectPick(q)
      const target = sentence(q.itemKey)
      expect(q.prompt).toEqual({ sentence: { text: target.text } })
      expect(q.say).toBe(R.sentence)
      expect(q.hint).toBe(sentencePhrase(target.id))
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options.map(o => (o as { emoji: string }).emoji)).size).toBe(3)
      expect(q.options.find(o => o.id === q.answer)).toMatchObject({ emoji: target.scene })
      for (const o of q.options) expect(o).toMatchObject({ kind: 'picture', say: [] })
      for (const o of q.options.filter(o => o.id !== q.answer)) {
        const s = sentence(o.id)
        expect(s.scene).not.toBe(target.scene)
        const nTags = new Set([...Object.keys(s.tags), ...Object.keys(target.tags)]).size
        expect(shared(s, target)).toBeLessThan(nTags)
        // Either shares a tag value, or no sentence with a shared tag was left to use.
        if (shared(s, target) === 0) expect(SENTENCES.filter(x => x.id !== target.id && shared(x, target) > 0).length).toBeLessThan(2)
      }
    }
  })
  it('never uses a scene whose meaning matches the sentence', () => {
    const twin: Sentence = { ...sentence('s1'), id: 's1b', text: 'הַחָתוּל נִרְדָּם', scene: '😸💤' }
    for (const seed of SEEDS) {
      const q = sentenceQuestion(ctx(seed, [], 's1'), [...SENTENCES, twin])
      expect(q.options.map(o => o.id)).not.toContain('s1b')
    }
  })
  it('honors review and avoid', () => {
    expect(sentenceQuestion(ctx(1, [], 's5'), SENTENCES).itemKey).toBe('s5')
    expect(sentenceQuestion(ctx(1, [], 'x'), SENTENCES).itemKey).not.toBe('x')
    expect(sentenceAccepts(SENTENCES)('s5')).toBe(true)
    for (const seed of SEEDS) expect(sentenceQuestion(ctx(seed, SENTENCES.map(s => s.id).filter(i => i !== 's7')), SENTENCES).itemKey).toBe('s7')
  })
})

/* ---------- cloze ---------- */

describe('cloze', () => {
  it('shows the gap sentence and 3 distinct word options with the answer once', () => {
    for (const seed of SEEDS) {
      const q = clozeQuestion(ctx(seed), CLOZES)
      expectPick(q)
      const c = CLOZES.find(x => x.id === q.itemKey)!
      expect(q.prompt).toEqual({ sentence: { text: c.text } })
      expect(q.answer).toBe(c.answer)
      expect(q.say).toBe(R.cloze)
      expect(q.hint).toBe(clozePhrase(c.id))
      expect(q.options.map(o => (o as { label: string }).label).sort()).toEqual([c.answer, ...c.wrong].sort())
      expect(q.options.every(o => o.kind === 'text')).toBe(true)
    }
  })
  it('skips a cloze whose options repeat', () => {
    const bad = C('bad', 'מִשְׁפָּט ___', 'אֶל', ['אֶל', 'עַל'])
    for (const seed of SEEDS) expect(clozeQuestion(ctx(seed, [], 'bad'), [...CLOZES, bad]).itemKey).not.toBe('bad')
  })
  it('honors review and avoid', () => {
    expect(clozeQuestion(ctx(1, [], 'c3'), CLOZES).itemKey).toBe('c3')
    expect(clozeQuestion(ctx(1, [], 'zz'), CLOZES).itemKey).not.toBe('zz')
    expect(clozeAccepts(CLOZES)('c3')).toBe(true)
    expect(clozeAccepts(CLOZES)('zz')).toBe(false)
    for (const seed of SEEDS) expect(clozeQuestion(ctx(seed, ['c1', 'c2', 'c3']), CLOZES).itemKey).toBe('c4')
  })
})

/* ---------- story order ---------- */

describe('story order', () => {
  it('tiles are the three sentences, never in order, each says its story phrase', () => {
    for (const seed of SEEDS) {
      const q = storyOrderQuestion(ctx(seed), STORIES)
      expect(q.picture, 'the scene would reveal the order').toBeUndefined()
      expectOrder(q)
      const story = STORIES.find(s => s.id === q.itemKey)!
      expect(q.layout).toBe('sentences')
      expect(q.say).toBe(R.order)
      expect(q.answer.map(id => q.tiles.find(t => t.id === id)!.text)).toEqual([...story.sentences])
      for (const t of q.tiles) expect(t.say).toBe(storyPhrase(story.id, Number(t.id.split('.').pop())))
    }
  })
  it('shuffles into every non-solved order', () => {
    const orders = new Set(SEEDS.map(s => storyOrderQuestion(ctx(s, [], 't1'), STORIES).tiles.map(t => t.id).join()))
    expect(orders.size).toBe(5)
  })
  it('honors review and avoid', () => {
    expect(storyOrderQuestion(ctx(1, [], 't2'), STORIES).itemKey).toBe('t2')
    expect(storyOrderQuestion(ctx(1, [], 'q'), STORIES).itemKey).not.toBe('q')
    expect(storyAccepts(STORIES)('t2')).toBe(true)
    for (const seed of SEEDS) expect(storyOrderQuestion(ctx(seed, ['t1', 't2']), STORIES).itemKey).toBe('t3')
  })
})

/* ---------- books ---------- */

describe('book', () => {
  it('is one question per book with the read-along instruction', () => {
    for (const seed of SEEDS) {
      const q = bookQuestion(ctx(seed), BOOKS)
      expect(q.book).toBe(BOOKS.find(b => b.id === q.itemKey))
      expect(q.answer).toBeNull()
      expect(q.say).toBe(R.readBook)
      expect(KNOWN.has(q.say as string)).toBe(true)
    }
  })
  it('prefers review, then unread books', () => {
    expect(bookQuestion(ctx(1, [], 'book2'), BOOKS).itemKey).toBe('book2')
    expect(bookQuestion(ctx(1, [], 'nope'), BOOKS).itemKey).not.toBe('nope')
    for (const seed of SEEDS) expect(bookQuestion(ctx(seed, ['book1']), BOOKS).itemKey).toBe('book2')
    expect(bookQuestion(ctx(1, ['book1', 'book2']), BOOKS).itemKey).toMatch(/^book/)
    expect(bookAccepts(BOOKS)('book1')).toBe(true)
    expect(bookAccepts(BOOKS)('x')).toBe(false)
  })
})
