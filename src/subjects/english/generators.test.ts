import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import type { OrderQ } from '../reading/types'
import {
  LETTERS, LOOK_ALIKES, SOUND_LETTERS, answerAccepts, answerQuestion, bigSmallAccepts, bigSmallQuestion, blendAccepts, blendQuestion, buildAccepts,
  buildQuestion, chunkAccepts, chunkQuestion, findLetterAccepts, findLetterQuestion, firstLetterAccepts, firstLetterQuestion, firstSoundAccepts,
  firstSoundQuestion, hearPickAccepts, hearPickQuestion, letterSoundAccepts, letterSoundQuestion, pairsAccepts, pairsQuestion, readPictureAccepts,
  readPictureQuestion, rhymeAccepts, rhymeQuestion, sentenceAccepts, sentenceQuestion, sightAccepts, sightQuestion, whichWordAccepts, whichWordQuestion,
  wordTiles,
} from './generators'
import { E, engAnswer, engBlend, engChunk, engLetter, engQuestion, engSentence, engSight, engSound, engWord } from './ids'
import type { Chunk, EngSentence, EngWord, MagicPair, MinimalPair, Pattern, QA, Topic } from './types'

/* ---------- fixtures (small, but with the structure the real content has) ---------- */

const W = (word: string, emoji: string, topic: Topic, pattern: Pattern, first: string, rime?: string): EngWord => ({
  id: word, word, emoji, topic, pattern, first, ...(rime ? { rime } : {}),
})
const WORDS: EngWord[] = [
  W('cat', '🐱', 'animals', 'cvc', 'k', 'at'), W('hat', '🎩', 'clothes', 'cvc', 'h', 'at'), W('bat', '🦇', 'animals', 'cvc', 'b', 'at'),
  W('rat', '🐀', 'animals', 'cvc', 'r', 'at'), W('cap', '🧢', 'clothes', 'cvc', 'k', 'ap'), W('map', '🗺️', 'school', 'cvc', 'm', 'ap'),
  W('dog', '🐶', 'animals', 'cvc', 'd', 'og'), W('log', '🪵', 'nature', 'cvc', 'l', 'og'), W('pig', '🐷', 'animals', 'cvc', 'p', 'ig'),
  W('big', '🐘', 'actions', 'cvc', 'b', 'ig'), W('sun', '☀️', 'nature', 'cvc', 's', 'un'), W('bun', '🍞', 'food', 'cvc', 'b', 'un'),
  W('cup', '☕', 'home', 'cvc', 'k', 'up'), W('bus', '🚌', 'school', 'cvc', 'b', 'us'), W('bed', '🛏️', 'home', 'cvc', 'b', 'ed'),
  W('red', '🔴', 'colors', 'cvc', 'r', 'ed'), W('pen', '🖊️', 'school', 'cvc', 'p', 'en'), W('hen', '🐔', 'animals', 'cvc', 'h', 'en'),
  W('jam', '🫙', 'food', 'cvc', 'j', 'am'), W('ham', '🍖', 'food', 'cvc', 'h', 'am'), W('fox', '🦊', 'animals', 'cvc', 'f', 'ox'),
  W('box', '📦', 'home', 'cvc', 'b', 'ox'), W('mop', '🧹', 'home', 'cvc', 'm', 'op'), W('top', '🔝', 'toys', 'cvc', 't', 'op'),
  W('van', '🚐', 'home', 'cvc', 'v', 'an'), W('web', '🕸️', 'nature', 'cvc', 'w', 'eb'), W('gum', '🍬', 'food', 'cvc', 'g', 'um'),
  W('ship', '🚢', 'toys', 'digraph', 'sh', 'ip'), W('shop', '🛍️', 'home', 'digraph', 'sh', 'op'), W('chip', '🍟', 'food', 'digraph', 'ch', 'ip'),
  W('chin', '🧔', 'body', 'digraph', 'ch', 'in'), W('fish', '🐟', 'animals', 'digraph', 'f', 'ish'), W('thumb', '👍', 'body', 'digraph', 'th'),
  W('cake', '🎂', 'food', 'magic-e', 'k', 'ake'), W('bike', '🚲', 'toys', 'magic-e', 'b', 'ike'), W('kite', '🪁', 'toys', 'magic-e', 'k', 'ite'),
  W('kit', '🧰', 'toys', 'cvc', 'k', 'it'), W('cape', '🦸', 'clothes', 'magic-e', 'k', 'ape'), W('tape', '📼', 'school', 'magic-e', 't', 'ape'),
  W('rope', '🪢', 'toys', 'magic-e', 'r', 'ope'), W('hop', '🐇', 'actions', 'cvc', 'h', 'op'), W('hope', '🤞', 'actions', 'magic-e', 'h', 'ope'),
  W('mom', '👩', 'family', 'cvc', 'm', 'om'),
  W('apple', '🍎', 'food', 'other', 'a'), W('egg', '🥚', 'food', 'other', 'e'), W('key', '🔑', 'home', 'other', 'k'), W('city', '🏙️', 'home', 'other', 's'),
  W('giraffe', '🦒', 'animals', 'other', 'j'), W('goat', '🐐', 'animals', 'other', 'g'), W('knife', '🔪', 'home', 'other', 'n'), W('queen', '👸', 'family', 'other', 'k'),
  W('whale', '🐋', 'animals', 'other', 'w'), W('xylophone', '🎼', 'toys', 'other', 'z'), W('ink', '🖋️', 'school', 'other', 'i'),
  W('blue', '🔵', 'colors', 'other', 'b'), W('green', '🟢', 'colors', 'other', 'g'), W('yellow', '🟡', 'colors', 'other', 'y'), W('pink', '🩷', 'colors', 'other', 'p'),
  W('one', '1️⃣', 'numbers', 'other', 'w'), W('two', '2️⃣', 'numbers', 'other', 't'), W('three', '3️⃣', 'numbers', 'other', 'th'), W('four', '4️⃣', 'numbers', 'other', 'f'),
  W('five', '5️⃣', 'numbers', 'other', 'f'),
]
const word = (id: string) => WORDS.find(w => w.id === id)!

const CHUNKS: Chunk[] = [
  { id: 'morning', text: 'Good morning!', scene: '🌅👋' }, { id: 'night', text: 'Good night!', scene: '🌙😴' }, { id: 'thanks', text: 'Thank you!', scene: '🎁🙏' },
  { id: 'name', text: "What's your name?", scene: '🧒❓' }, { id: 'bye', text: 'Goodbye!', scene: '🚪👋' },
]
const QAS: QA[] = [
  { id: 'old', question: 'How old are you?', answer: "I'm eight.", wrong: ["I'm fine.", 'It is red.'] },
  { id: 'how', question: 'How are you?', answer: "I'm fine.", wrong: ["I'm eight.", 'My name is Dan.'] },
  { id: 'name', question: "What's your name?", answer: 'My name is Dan.', wrong: ['It is red.', "I'm fine."] },
  { id: 'dup', question: 'Broken?', answer: 'Yes.', wrong: ['Yes.', 'No.'] },
]
const MINIMAL: MinimalPair[] = [
  { id: 'pig-big', a: 'pig', b: 'big', contrast: 'b/p' }, { id: 'van-web', a: 'van', b: 'web', contrast: 'v/w' }, { id: 'chip-ship', a: 'chip', b: 'ship', contrast: 'ee/i' },
  { id: 'missing', a: 'pen', b: 'nothing', contrast: 'b/p' },
]
const MAGIC: MagicPair[] = [{ short: 'cap', long: 'cape' }, { short: 'kit', long: 'kite' }, { short: 'hop', long: 'hope' }, { short: 'zzz', long: 'zzze' }]
const SIGHT = ['the', 'is', 'I', 'you', 'my', 'and', 'it', 'in', 'on', 'a', 'he', 'she', 'we', 'said', 'was', 'they']
const SENTENCES: EngSentence[] = [
  { id: 's1', text: 'The cat is on the bed.', scene: '🐱🛏️', tags: { who: 'cat', where: 'bed' } },
  { id: 's2', text: 'The cat is in the box.', scene: '🐱📦', tags: { who: 'cat', where: 'box' } },
  { id: 's3', text: 'The dog is on the bed.', scene: '🐶🛏️', tags: { who: 'dog', where: 'bed' } },
  { id: 's4', text: 'The dog is in the box.', scene: '🐶📦', tags: { who: 'dog', where: 'box' } },
  { id: 's5', text: 'The pig is in the box.', scene: '🐷📦', tags: { who: 'pig', where: 'box' } },
  { id: 's6', text: 'The hen is on the bed.', scene: '🐔🛏️', tags: { who: 'hen', where: 'bed' } },
]
const SOUNDS = new Set([...LETTERS, 'sh', 'ch', 'th'])

/* ---------- test utilities ---------- */

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)

const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const KNOWN = new Set<string>([
  ...Object.values(E),
  ...WORDS.map(w => engWord(w.id)), ...WORDS.filter(w => w.rime).map(w => engBlend(w.id)),
  ...CHUNKS.map(c => engChunk(c.id)),
  ...QAS.flatMap(q => [engQuestion(q.id), engAnswer(q.id, 0), engAnswer(q.id, 1), engAnswer(q.id, 2)]),
  ...SIGHT.map(engSight), ...SENTENCES.map(s => engSentence(s.id)),
  ...LETTERS.flatMap(l => [engLetter(l), engSound(l)]), ...['sh', 'ch', 'th'].map(engSound),
])

const fallsBack = (o: PickOption) => ('say' in o ? ids(o.say) : [])
function expectPick(q: PickQ) {
  const optionIds = q.options.map(o => o.id)
  expect(new Set(optionIds).size).toBe(optionIds.length)
  expect(optionIds.filter(id => id === q.answer)).toHaveLength(1)
  for (const p of [...ids(q.say), q.instruction, ...ids(q.hint), ...q.options.flatMap(fallsBack), ...ids(q.prompt.sentence?.say)]) expect(KNOWN.has(p), p).toBe(true)
  expect(ids(q.say)[0]).toBe(q.instruction)
  const pictures = q.options.flatMap(o => (o.kind === 'picture' ? [o.emoji] : []))
  expect(new Set(pictures).size).toBe(pictures.length)
  for (const o of q.options) if (o.kind === 'letter' || o.kind === 'text') expect(o.lang).toBe('en')
}

function expectOrder(q: OrderQ) {
  const tileIds = q.tiles.map(t => t.id)
  expect(new Set(tileIds).size).toBe(tileIds.length)
  expect([...q.answer].sort()).toEqual([...tileIds].sort())
  expect(q.direction).toBe('ltr')
  expect(q.layout).toBe('units')
  const byId = new Map(q.tiles.map(t => [t.id, t]))
  expect(q.tiles.map(t => t.text)).not.toEqual(q.answer.map(id => byId.get(id)!.text))
  for (const p of [...ids(q.say), q.instruction, ...q.tiles.flatMap(t => ids(t.say))]) expect(KNOWN.has(p), p).toBe(true)
}

const picked = (q: PickQ) => q.options.map(o => word(o.id))

/* ---------- 1–3 ---------- */

describe('hear pick', () => {
  const topics: Topic[] = ['colors', 'numbers']
  it('says the word and offers 4 distinct pictures from the topics', () => {
    for (const seed of SEEDS) {
      const q = hearPickQuestion(ctx(seed), WORDS, topics)
      expectPick(q)
      expect(q.options).toHaveLength(4)
      expect(q.say).toEqual([E.hearPick, engWord(q.itemKey)])
      expect(q.answer).toBe(q.itemKey)
      for (const o of picked(q)) expect(topics).toContain(o.topic)
      expect(q.options.every(o => o.kind === 'picture' && ids(o.say)[0] === engWord(o.id))).toBe(true)
    }
  })
  it('keeps wrong pictures in the answer topic while it has enough words', () => {
    for (const seed of SEEDS) {
      const q = hearPickQuestion(ctx(seed, [], 'one'), WORDS, topics)
      expect(picked(q).every(w => w.topic === 'numbers')).toBe(true)
    }
  })
  it('honors review and avoid, and accepts only the topic words', () => {
    for (const seed of SEEDS) expect(hearPickQuestion(ctx(seed, [], 'blue'), WORDS, topics).itemKey).toBe('blue')
    const avoid = WORDS.filter(w => topics.includes(w.topic) && w.id !== 'red').map(w => w.id)
    for (const seed of SEEDS) expect(hearPickQuestion(ctx(seed, avoid), WORDS, topics).itemKey).toBe('red')
    expect(hearPickAccepts(WORDS, topics)('red')).toBe(true)
    expect(hearPickAccepts(WORDS, topics)('cat')).toBe(false)
  })
})

/* ---------- 4 ---------- */

describe('chunks and answers', () => {
  it('chunk: hear the phrase, pick its scene of 3 with silent options', () => {
    for (const seed of SEEDS) {
      const q = chunkQuestion(ctx(seed), CHUNKS)
      expectPick(q)
      expect(q.options).toHaveLength(3)
      expect(q.say).toEqual([E.chunk, engChunk(q.itemKey)])
      expect(q.prompt.lang).toBe('en')
      expect(q.prompt.sentence?.text).toBe(CHUNKS.find(c => c.id === q.itemKey)!.text)
      for (const o of q.options) {
        expect(o.kind).toBe('picture')
        expect(ids((o as { say: PhraseRef }).say)).toEqual([])
      }
      expect((q.options.find(o => o.id === q.answer) as { emoji: string }).emoji).toBe(CHUNKS.find(c => c.id === q.itemKey)!.scene)
    }
    expect(chunkAccepts(CHUNKS)('bye')).toBe(true)
  })
  it('answer: the question is spoken, replies read aloud, the fitting one is option 0', () => {
    for (const seed of SEEDS) {
      const q = answerQuestion(ctx(seed), QAS)
      expectPick(q)
      const qa = QAS.find(x => x.id === q.itemKey)!
      expect(qa.id).not.toBe('dup')
      expect(q.options).toHaveLength(3)
      expect(q.say).toEqual([E.answer, engQuestion(qa.id)])
      expect(q.prompt.sentence).toEqual({ text: qa.question, say: engQuestion(qa.id) })
      const right = q.options.find(o => o.id === q.answer) as { label: string; say: string }
      expect(right.label).toBe(qa.answer)
      expect(right.say).toBe(engAnswer(qa.id, 0))
      expect(q.options.map(o => (o as { label: string }).label).sort()).toEqual([qa.answer, ...qa.wrong].sort())
    }
    expect(answerAccepts(QAS)('dup')).toBe(false)
    expect(answerAccepts(QAS)('old')).toBe(true)
  })
})

/* ---------- 5 ---------- */

describe('rhyme', () => {
  it('exactly one option rhymes with the shown picture; the target never appears as an option', () => {
    for (const seed of SEEDS) {
      const q = rhymeQuestion(ctx(seed), WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      expect(q.prompt.picture).toBe(target.emoji)
      expect(q.say).toEqual([E.rhyme, engWord(target.id)])
      expect(q.options).toHaveLength(3)
      const opts = picked(q)
      expect(opts.map(o => o.id)).not.toContain(target.id)
      expect(opts.filter(o => o.rime === target.rime)).toHaveLength(1)
      expect(word(q.answer).rime).toBe(target.rime)
    }
  })
  it('includes a word that starts the same when one exists (cat: cap)', () => {
    for (const seed of SEEDS) {
      const q = rhymeQuestion(ctx(seed, [], 'cat'), WORDS)
      expect(picked(q).filter(o => o.first === 'k' && o.rime !== 'at').length).toBeGreaterThanOrEqual(1)
    }
  })
  it('only asks words that have a rhyming partner; honors review', () => {
    expect(rhymeAccepts(WORDS)('cat')).toBe(true)
    expect(rhymeAccepts(WORDS)('fox')).toBe(true) // box
    expect(rhymeAccepts(WORDS)('apple')).toBe(false)
    expect(rhymeAccepts(WORDS)('van')).toBe(false)
    for (const seed of SEEDS) expect(rhymeQuestion(ctx(seed, [], 'dog'), WORDS).itemKey).toBe('dog')
  })
})

describe('first sound', () => {
  it('exactly one option shares the opening sound; the wrong ones all differ from each other', () => {
    for (const seed of SEEDS) {
      const q = firstSoundQuestion(ctx(seed), WORDS)
      expectPick(q)
      const target = word(q.itemKey)
      expect(q.prompt.picture).toBe(target.emoji)
      expect(q.say).toEqual([E.firstSound, engWord(target.id)])
      const opts = picked(q)
      expect(opts.map(o => o.id)).not.toContain(target.id)
      expect(opts.filter(o => o.first === target.first)).toHaveLength(1)
      expect(word(q.answer).first).toBe(target.first)
      expect(new Set(opts.map(o => o.first)).size).toBe(3)
    }
    expect(firstSoundAccepts(WORDS)('sun')).toBe(true) // city
    expect(firstSoundAccepts(WORDS)('van')).toBe(false)
  })
  it('honors review', () => {
    for (const seed of SEEDS) expect(firstSoundQuestion(ctx(seed, [], 'cat'), WORDS).itemKey).toBe('cat')
  })
})

describe('blend', () => {
  it('says onset + rime, shows no picture, and exactly one option blends to the word', () => {
    for (const seed of SEEDS) {
      const q = blendQuestion(ctx(seed), WORDS)
      expectPick(q)
      const answer = word(q.answer)
      expect(answer.pattern).toBe('cvc')
      expect(q.say).toEqual([E.blend, engBlend(answer.id)])
      expect(q.prompt).toEqual({})
      expect(q.options.length).toBeGreaterThanOrEqual(3)
      expect(q.options.length).toBeLessThanOrEqual(4)
      expect(picked(q).filter(o => o.first === answer.first && o.rime === answer.rime)).toHaveLength(1)
    }
  })
  it('mixes a same-rime and a same-opening distractor when they exist', () => {
    for (const seed of SEEDS) {
      const q = blendQuestion(ctx(seed, [], 'cat'), WORDS)
      const wrong = picked(q).filter(o => o.id !== 'cat')
      expect(wrong.some(o => o.rime === 'at')).toBe(true)
      expect(wrong.some(o => o.first === 'k')).toBe(true)
    }
    expect(blendAccepts(WORDS)('cat')).toBe(true)
    expect(blendAccepts(WORDS)('ship')).toBe(false)
    expect(blendAccepts(WORDS)('apple')).toBe(false)
  })
})

/* ---------- 6 ---------- */

describe('letters', () => {
  it('find letter: name spoken, 4 English letters in one case, look-alikes first', () => {
    for (const seed of SEEDS) {
      const q = findLetterQuestion(ctx(seed))
      expectPick(q)
      expect(q.say).toEqual([E.findLetter, engLetter(q.itemKey)])
      expect(q.options).toHaveLength(4)
      const labels = q.options.map(o => (o as { label: string }).label)
      expect(new Set(labels.map(l => l === l.toUpperCase())).size).toBe(1)
      expect(q.options.every(o => o.kind === 'letter' && o.lang === 'en')).toBe(true)
      expect(q.answer).toBe(q.itemKey)
      const wrong = q.options.filter(o => o.id !== q.answer).map(o => o.id)
      const near = LOOK_ALIKES[q.itemKey]!
      expect(wrong.filter(l => near.includes(l)).length).toBe(Math.min(3, near.length))
    }
  })
  it('find letter: b, d, p, q, m, n, u, i, l always bring their look-alikes', () => {
    for (const l of ['b', 'd', 'p', 'q', 'm', 'n', 'u', 'i', 'l']) {
      const q = findLetterQuestion(ctx(7, [], l))
      expect(q.itemKey).toBe(l)
      expect(q.options.some(o => LOOK_ALIKES[l]!.includes(o.id))).toBe(true)
    }
    for (const seed of SEEDS) expect(findLetterQuestion(ctx(seed, [], 'b')).options.map(o => o.id).sort()).toEqual(['b', 'd', 'p', 'q'])
  })
  it('big/small: uppercase prompt, 4 lowercase options', () => {
    for (const seed of SEEDS) {
      const q = bigSmallQuestion(ctx(seed))
      expectPick(q)
      expect(q.prompt).toEqual({ lang: 'en', letter: q.itemKey.toUpperCase() })
      expect(q.options).toHaveLength(4)
      for (const o of q.options) expect((o as { label: string }).label).toBe(o.id)
      expect(q.answer).toBe(q.itemKey)
    }
    expect(bigSmallAccepts('q')).toBe(true)
    expect(findLetterAccepts('1')).toBe(false)
  })
  it('letter sound: never c, q or x; no two options sound alike', () => {
    expect(SOUND_LETTERS).not.toContain('c')
    expect(SOUND_LETTERS).toHaveLength(23)
    for (const seed of SEEDS) {
      const q = letterSoundQuestion(ctx(seed))
      expectPick(q)
      expect(q.say).toEqual([E.letterSound, engSound(q.itemKey)])
      expect(q.options).toHaveLength(4)
      for (const o of q.options) expect('cqx').not.toContain(o.id)
    }
    expect(letterSoundAccepts('c')).toBe(false)
    expect(letterSoundAccepts('k')).toBe(true)
  })
})

/* ---------- 7 ---------- */

describe('first letter', () => {
  it('asks only words whose first letter is unambiguous', () => {
    const accepts = firstLetterAccepts(WORDS)
    for (const ok of ['bat', 'sun', 'apple', 'egg', 'hat', 'goat', 'jam', 'yellow']) expect(accepts(ok), ok).toBe(true)
    for (const no of ['cat', 'cap', 'key', 'kite', 'queen', 'xylophone', 'giraffe', 'knife', 'whale', 'ship', 'chip', 'thumb', 'city'])
      expect(accepts(no), no).toBe(false)
  })
  it('answer is the first letter; no letter sounds the same as it; English letter options', () => {
    for (const seed of SEEDS) {
      const q = firstLetterQuestion(ctx(seed), WORDS)
      expectPick(q)
      const w = word(q.itemKey)
      expect(q.answer).toBe(w.word[0])
      expect(q.prompt).toEqual({ picture: w.emoji })
      expect(q.say).toEqual([E.firstLetter, engWord(w.id)])
      expect(q.options).toHaveLength(4)
      for (const o of q.options) expect('ckqx').not.toContain(o.id)
      if (q.answer === 'j') expect(q.options.map(o => o.id)).not.toContain('g')
    }
    for (const seed of SEEDS) expect(firstLetterQuestion(ctx(seed, [], 'jam'), WORDS).options.map(o => o.id)).not.toContain('g')
    for (const seed of SEEDS) expect(firstLetterQuestion(ctx(seed, [], 'goat'), WORDS).options.map(o => o.id)).not.toContain('j')
  })
})

/* ---------- 8, 10, 11 ---------- */

describe('read picture', () => {
  for (const pattern of ['cvc', 'digraph', 'magic-e'] as const) {
    it(`${pattern}: English word prompt without sound, 4 silent pictures with different words`, () => {
      for (const seed of SEEDS) {
        const q = readPictureQuestion(ctx(seed), WORDS, pattern)
        expectPick(q)
        const w = word(q.itemKey)
        expect(w.pattern).toBe(pattern)
        expect(q.prompt).toEqual({ lang: 'en', word: { text: w.word } })
        expect(q.say).toBe(E.readPicture)
        expect(q.hint).toBe(engWord(w.id))
        expect(q.options).toHaveLength(4)
        expect(q.answer).toBe(w.id)
        expect(new Set(picked(q).map(o => o.word)).size).toBe(4)
        for (const o of q.options) expect(ids((o as { say: PhraseRef }).say)).toEqual([])
      }
    })
  }
  it('distractors share letters with the word (cat: same ending or same first letter)', () => {
    for (const seed of SEEDS) {
      const q = readPictureQuestion(ctx(seed, [], 'cat'), WORDS, 'cvc')
      for (const o of picked(q).filter(o => o.id !== 'cat')) expect(o.word[0] === 'c' || o.rime === 'at' || o.word.endsWith('at')).toBe(true)
    }
  })
  it('magic-e words get their short partner as a distractor sometimes; accepts follows the pattern', () => {
    const seen = new Set<string>()
    for (const seed of SEEDS) for (const o of readPictureQuestion(ctx(seed, [], 'kite'), WORDS, 'magic-e').options) seen.add(o.id)
    expect(seen.has('kit')).toBe(true)
    expect(readPictureAccepts(WORDS, 'digraph')('ship')).toBe(true)
    expect(readPictureAccepts(WORDS, 'digraph')('cat')).toBe(false)
  })
})

describe('build', () => {
  it('tiles are single letters for cvc, ltr, never in order, answer spells the word', () => {
    for (const seed of SEEDS) {
      const q = buildQuestion(ctx(seed), WORDS, 'cvc', SOUNDS)
      expectOrder(q)
      const w = word(q.itemKey)
      const byId = new Map(q.tiles.map(t => [t.id, t]))
      expect(q.answer.map(id => byId.get(id)!.text).join('')).toBe(w.word)
      expect(q.picture).toBe(w.emoji)
      expect(q.say).toEqual([E.build, engWord(w.id)])
      expect(q.tiles.every(t => t.text.length === 1)).toBe(true)
      expect(q.tiles.every(t => ids(t.say)[0] === engSound(t.text))).toBe(true)
    }
  })
  it('digraph words keep sh/ch/th together; tiles without a sound say the word', () => {
    expect(wordTiles('ship', 'digraph')).toEqual(['sh', 'i', 'p'])
    expect(wordTiles('thumb', 'digraph')).toEqual(['th', 'u', 'm', 'b'])
    expect(wordTiles('fish', 'digraph')).toEqual(['f', 'i', 'sh'])
    expect(wordTiles('shop', 'cvc')).toEqual(['s', 'h', 'o', 'p'])
    for (const seed of SEEDS) {
      const q = buildQuestion(ctx(seed, [], 'ship'), WORDS, 'digraph', SOUNDS)
      expectOrder(q)
      expect(q.tiles.map(t => t.text).sort()).toEqual(['i', 'p', 'sh'])
      const noSounds = buildQuestion(ctx(seed, [], 'ship'), WORDS, 'digraph', new Set(['i']))
      expect(noSounds.tiles.find(t => t.text === 'sh')!.say).toBe(engWord('ship'))
      expect(noSounds.tiles.find(t => t.text === 'i')!.say).toBe(engSound('i'))
    }
  })
  it('repeated letters (mom) stay distinct tiles and the board still starts unsolved', () => {
    for (const seed of SEEDS) {
      const q = buildQuestion(ctx(seed, [], 'mom'), WORDS, 'cvc', SOUNDS)
      expect(q.itemKey).toBe('mom')
      expectOrder(q)
    }
    expect(buildAccepts(WORDS, 'cvc')('mom')).toBe(true)
    expect(buildAccepts(WORDS, 'cvc')('ship')).toBe(false)
  })
})

/* ---------- 9 ---------- */

describe('minimal pairs', () => {
  it('speaks one word; both pair pictures are offered, answer is the spoken one, a third is unrelated', () => {
    for (const seed of SEEDS) {
      const q = pairsQuestion(ctx(seed), WORDS, MINIMAL)
      expectPick(q)
      const [pairId, which] = q.itemKey.split(':') as [string, 'a' | 'b']
      const pair = MINIMAL.find(p => p.id === pairId)!
      expect(pair.id).not.toBe('missing')
      expect(q.answer).toBe(which === 'a' ? pair.a : pair.b)
      expect(q.say).toEqual([E.pairs, engWord(q.answer)])
      const ids3 = q.options.map(o => o.id)
      expect(ids3).toContain(pair.a)
      expect(ids3).toContain(pair.b)
      expect(q.options).toHaveLength(3)
      const extra = word(ids3.find(i => i !== pair.a && i !== pair.b)!)
      expect(extra.first).not.toBe(word(pair.a).first)
      expect(extra.first).not.toBe(word(pair.b).first)
    }
  })
  it('asks both words of a pair across seeds; honors review; skips pairs without pictures', () => {
    const seen = new Set(SEEDS.map(s => pairsQuestion(ctx(s, [], 'pig-big:a'), WORDS, MINIMAL).itemKey))
    expect(seen).toEqual(new Set(['pig-big:a']))
    expect(pairsAccepts(WORDS, MINIMAL)('pig-big:b')).toBe(true)
    expect(pairsAccepts(WORDS, MINIMAL)('missing:a')).toBe(false)
    const keys = new Set(SEEDS.map(s => pairsQuestion(ctx(s), WORDS, MINIMAL).itemKey))
    expect(keys.has('pig-big:a') && keys.has('pig-big:b')).toBe(true)
  })
})

/* ---------- 11 ---------- */

describe('which word', () => {
  it('hear cap or cape, pick its spelling of 2 English texts', () => {
    for (const seed of SEEDS) {
      const q = whichWordQuestion(ctx(seed), WORDS, MAGIC)
      expectPick(q)
      expect(q.options).toHaveLength(2)
      const labels = q.options.map(o => (o as { label: string }).label).sort()
      const pair = MAGIC.find(p => p.short === q.answer || p.long === q.answer)!
      expect(pair.short).not.toBe('zzz')
      expect(labels).toEqual([pair.long, pair.short].sort())
      expect(q.say).toEqual([E.whichWord, engWord(q.answer)])
      for (const o of q.options) expect(ids((o as { say?: PhraseRef }).say)).toEqual([])
    }
  })
  it('asks both the short and the long word; honors review', () => {
    const seen = new Set(SEEDS.map(s => whichWordQuestion(ctx(s), WORDS, MAGIC).answer))
    expect(seen).toEqual(new Set(['cap', 'cape', 'kit', 'kite', 'hop', 'hope']))
    for (const seed of SEEDS) expect(whichWordQuestion(ctx(seed, [], 'kite'), WORDS, MAGIC).itemKey).toBe('kite')
    expect(whichWordAccepts(WORDS, MAGIC)('zzz')).toBe(false)
  })
})

/* ---------- 12 ---------- */

describe('sight words', () => {
  it('hear a word, pick it of 4 distinct written words; look-alikes included', () => {
    for (const seed of SEEDS) {
      const q = sightQuestion(ctx(seed), SIGHT)
      expectPick(q)
      expect(q.say).toEqual([E.sight, engSight(q.itemKey)])
      expect(q.options).toHaveLength(4)
      expect(q.answer).toBe(q.itemKey)
      for (const o of q.options) expect(SIGHT).toContain((o as { label: string }).label)
    }
    for (const seed of SEEDS) {
      const wrong = sightQuestion(ctx(seed, [], 'she'), SIGHT).options.map(o => o.id).filter(i => i !== 'she')
      expect(wrong.some(w => w[0] === 's')).toBe(true) // said
      expect(wrong.some(w => w.length === 3)).toBe(true)
    }
    expect(sightAccepts(SIGHT)('was')).toBe(true)
    expect(sightAccepts(SIGHT)('cat')).toBe(false)
  })
})

/* ---------- 13 ---------- */

describe('sentences', () => {
  it('English sentence without sound, 3 silent scenes sharing a tag, never all tags', () => {
    for (const seed of SEEDS) {
      const q = sentenceQuestion(ctx(seed), SENTENCES)
      expectPick(q)
      const s = SENTENCES.find(x => x.id === q.itemKey)!
      expect(q.prompt).toEqual({ lang: 'en', sentence: { text: s.text } })
      expect(q.say).toBe(E.sentence)
      expect(q.hint).toBe(engSentence(s.id))
      expect(q.options).toHaveLength(3)
      for (const o of q.options) expect(ids((o as { say: PhraseRef }).say)).toEqual([])
      for (const o of q.options.filter(o => o.id !== q.answer)) {
        const other = SENTENCES.find(x => x.id === o.id)!
        expect(Object.keys(s.tags).some(k => s.tags[k] === other.tags[k])).toBe(true)
        expect(Object.keys(s.tags).every(k => s.tags[k] === other.tags[k])).toBe(false)
      }
    }
    for (const seed of SEEDS) expect(sentenceQuestion(ctx(seed, [], 's3'), SENTENCES).itemKey).toBe('s3')
    expect(sentenceAccepts(SENTENCES)('s6')).toBe(true)
  })
})

/* ---------- cross-cutting ---------- */

describe('avoid', () => {
  it('prefers items not yet asked this round', () => {
    const avoid = LETTERS.filter(l => l !== 'z')
    for (const seed of SEEDS) {
      expect(findLetterQuestion(ctx(seed, avoid)).itemKey).toBe('z')
      expect(bigSmallQuestion(ctx(seed, avoid)).itemKey).toBe('z')
    }
    const sightAvoid = SIGHT.filter(w => w !== 'they')
    for (const seed of SEEDS) expect(sightQuestion(ctx(seed, sightAvoid), SIGHT).itemKey).toBe('they')
    for (const seed of SEEDS) expect(chunkQuestion(ctx(seed, ['morning', 'night', 'thanks', 'bye']), CHUNKS).itemKey).toBe('name')
  })
  it('falls back to repeats when everything was asked', () => {
    expect(() => findLetterQuestion(ctx(1, LETTERS))).not.toThrow()
  })
})
