import { shuffle, pick, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { PickOption, PickQ } from '../../ui/pick/types'
import type { OrderQ, Tile } from '../reading/types'
import { E, engAnswer, engBlend, engChunk, engLetter, engQuestion, engSentence, engSight, engSound, engWord } from './ids'
import type { Chunk, EngSentence, EngWord, MagicPair, MinimalPair, Pattern, QA, Topic } from './types'

// Pure question generators for the English island, one per game. Content comes in as arguments.
// Tested in generators.test.ts.

/* ---------- helpers ---------- */

/** Review item first (when a candidate), then fresh items, then repeats; the first candidate `build` accepts wins. */
function make<T, Q>(ctx: GenContext, items: readonly T[], key: (t: T) => string, build: (t: T) => Q | null): Q {
  const review = items.filter(i => key(i) === ctx.review)
  const rest = items.filter(i => key(i) !== ctx.review)
  const fresh = shuffle(ctx.rng, rest.filter(i => !ctx.avoid.has(key(i))))
  const stale = shuffle(ctx.rng, rest.filter(i => ctx.avoid.has(key(i))))
  for (const t of [...review, ...fresh, ...stale]) {
    const q = build(t)
    if (q) return q
  }
  throw new Error('no valid item to ask')
}

/** n distinct (by `key`) items, drawn tier by tier so earlier tiers are preferred; null when there aren't enough. */
function take<T>(rng: Rng, tiers: readonly (readonly T[])[], n: number, key: (t: T) => string, taken: readonly string[] = []): T[] | null {
  const seen = new Set(taken)
  const out: T[] = []
  for (const tier of tiers)
    for (const t of shuffle(rng, tier)) {
      if (out.length < n && !seen.has(key(t))) {
        seen.add(key(t))
        out.push(t)
      }
    }
  return out.length === n ? out : null
}

/** Like `take`, but one item from each group in turn, so every kind of distractor shows up before any repeats. */
function spread<T>(rng: Rng, groups: readonly (readonly T[])[], n: number, key: (t: T) => string, taken: readonly string[] = []): T[] | null {
  const seen = new Set(taken)
  const queues = groups.map(g => shuffle(rng, g))
  const out: T[] = []
  let progress = true
  while (out.length < n && progress) {
    progress = false
    for (const q of queues) {
      while (q.length && seen.has(key(q[0]!))) q.shift()
      const t = q.shift()
      if (t !== undefined && out.length < n) {
        seen.add(key(t))
        out.push(t)
        progress = true
      }
    }
  }
  return out.length === n ? out : null
}

/** Shuffles until the order differs from the answer's texts, so the board never starts solved. */
function shuffleTiles(rng: Rng, tiles: readonly Tile[]): Tile[] | null {
  const sameAsAnswer = (order: readonly Tile[]) => order.every((t, i) => t.text === tiles[i]!.text)
  for (let attempt = 0; attempt < 20; attempt++) {
    const order = shuffle(rng, tiles)
    if (!sameAsAnswer(order)) return order
  }
  const rotated = [...tiles.slice(1), tiles[0]!]
  return sameAsAnswer(rotated) ? null : rotated
}

const pictureOpt = (w: EngWord): PickOption => ({ id: w.id, kind: 'picture', emoji: w.emoji, say: engWord(w.id) })
/** Silent: the child works out which picture it is by reading, not by hearing each name. */
const silentPictureOpt = (w: EngWord): PickOption => ({ id: w.id, kind: 'picture', emoji: w.emoji, say: [] })
const letterOpt = (l: string, upper: boolean): PickOption => ({ id: l, kind: 'letter', label: upper ? l.toUpperCase() : l, lang: 'en' })
const textOpt = (id: string, label: string, say?: string): PickOption => ({ id, kind: 'text', label, lang: 'en', ...(say ? { say } : {}) })

const distinct = (a: EngWord, b: EngWord) => a.id !== b.id && a.emoji !== b.emoji && a.word !== b.word
const rhymes = (a: EngWord, b: EngWord) => !!a.rime && a.rime === b.rime

/* ---------- 1–3. hear a word, pick the picture ---------- */

const topicWords = (words: readonly EngWord[], topics: readonly Topic[]) => words.filter(w => topics.includes(w.topic))
export const hearPickAccepts = (words: readonly EngWord[], topics: readonly Topic[]) => (key: string) => topicWords(words, topics).some(w => w.id === key)

/** Skills 1–3: hear a word, pick its picture of 4. Wrong pictures come from the same topic first, then the skill's other topics. */
export function hearPickQuestion(ctx: GenContext, words: readonly EngWord[], topics: readonly Topic[]): PickQ {
  const pool = topicWords(words, topics)
  return make(ctx, pool, w => w.id, answer => {
    const others = pool.filter(w => distinct(w, answer))
    const wrong = take(ctx.rng, [others.filter(w => w.topic === answer.topic), others], 3, w => w.emoji, [answer.emoji])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: [E.hearPick, engWord(answer.id)], instruction: E.hearPick, prompt: {},
      options: shuffle(ctx.rng, [answer, ...wrong]).map(pictureOpt), hint: engWord(answer.id),
    }
  })
}

/* ---------- 4. chunks and answers ---------- */

export const chunkAccepts = (chunks: readonly Chunk[]) => (key: string) => chunks.some(c => c.id === key)

/** Hear (and see, with 🔊) a classroom phrase, pick the situation it fits. Scenes are silent: naming them would add nothing. */
export function chunkQuestion(ctx: GenContext, chunks: readonly Chunk[]): PickQ {
  return make(ctx, chunks, c => c.id, answer => {
    const wrong = take(ctx.rng, [chunks.filter(c => c.id !== answer.id)], 2, c => c.scene, [answer.scene])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: [E.chunk, engChunk(answer.id)], instruction: E.chunk,
      prompt: { lang: 'en', sentence: { text: answer.text, say: engChunk(answer.id) } },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(c => ({ id: c.id, kind: 'picture' as const, emoji: c.scene, say: [] })),
      hint: engChunk(answer.id),
    }
  })
}

const answerItems = (qas: readonly QA[]) => qas.filter(q => new Set([q.answer, ...q.wrong]).size === 3)
export const answerAccepts = (qas: readonly QA[]) => (key: string) => answerItems(qas).some(q => q.id === key)

/** Hear a question, pick the fitting reply of 3; each reply has a 🔊. */
export function answerQuestion(ctx: GenContext, qas: readonly QA[]): PickQ {
  return make(ctx, answerItems(qas), q => q.id, qa => {
    const texts = [qa.answer, ...qa.wrong]
    return {
      itemKey: qa.id, answer: '0', say: [E.answer, engQuestion(qa.id)], instruction: E.answer,
      prompt: { lang: 'en', sentence: { text: qa.question, say: engQuestion(qa.id) } },
      options: shuffle(ctx.rng, texts.map((t, n) => textOpt(String(n), t, engAnswer(qa.id, n as 0 | 1 | 2)))), hint: engQuestion(qa.id),
    }
  })
}

/* ---------- 5. sounds ---------- */

const rhymeItems = (words: readonly EngWord[]) => words.filter(t => t.rime && words.some(p => distinct(p, t) && rhymes(p, t)))
export const rhymeAccepts = (words: readonly EngWord[]) => (key: string) => rhymeItems(words).some(w => w.id === key)

/** Which picture rhymes with the shown one? One rhyming word, one with the same opening sound, one other. */
export function rhymeQuestion(ctx: GenContext, words: readonly EngWord[]): PickQ {
  return make(ctx, rhymeItems(words), w => w.id, target => {
    const answer = pick(ctx.rng, words.filter(p => distinct(p, target) && rhymes(p, target)))
    const others = words.filter(w => distinct(w, target) && distinct(w, answer) && !rhymes(w, target))
    const wrong = spread(ctx.rng, [others.filter(w => w.first === target.first), others], 2, w => w.emoji, [target.emoji, answer.emoji])
    if (!wrong) return null
    return {
      itemKey: target.id, answer: answer.id, say: [E.rhyme, engWord(target.id)], instruction: E.rhyme, prompt: { picture: target.emoji },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(pictureOpt), hint: engWord(target.id),
    }
  })
}

const firstSoundItems = (words: readonly EngWord[]) => words.filter(t => words.some(p => distinct(p, t) && p.first === t.first))
export const firstSoundAccepts = (words: readonly EngWord[]) => (key: string) => firstSoundItems(words).some(w => w.id === key)

/** Which picture starts like the shown one? Exactly one option shares the opening sound; the others all differ from each other. */
export function firstSoundQuestion(ctx: GenContext, words: readonly EngWord[]): PickQ {
  return make(ctx, firstSoundItems(words), w => w.id, target => {
    const answer = pick(ctx.rng, words.filter(p => distinct(p, target) && p.first === target.first))
    const others = words.filter(w => distinct(w, target) && distinct(w, answer) && w.first !== target.first)
    const wrong = take(ctx.rng, [others], 2, w => w.first, [target.first])
    if (!wrong) return null
    return {
      itemKey: target.id, answer: answer.id, say: [E.firstSound, engWord(target.id)], instruction: E.firstSound, prompt: { picture: target.emoji },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(pictureOpt), hint: engWord(target.id),
    }
  })
}

const blendItems = (words: readonly EngWord[]) => words.filter(w => w.rime && w.pattern === 'cvc')
export const blendAccepts = (words: readonly EngWord[]) => (key: string) => blendItems(words).some(w => w.id === key)

/**
 * Hear onset + rime apart, pick the blended word of 4. No picture in the prompt (it would give the answer away). Distractors
 * include a word with the same rime and one with the same opening sound, never one that blends to the same sound.
 */
export function blendQuestion(ctx: GenContext, words: readonly EngWord[]): PickQ {
  return make(ctx, blendItems(words), w => w.id, answer => {
    const others = words.filter(w => distinct(w, answer) && !(w.first === answer.first && w.rime === answer.rime))
    const wrong = spread(ctx.rng, [others.filter(w => rhymes(w, answer)), others.filter(w => w.first === answer.first), others], 3, w => w.emoji, [answer.emoji])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: [E.blend, engBlend(answer.id)], instruction: E.blend, prompt: {},
      options: shuffle(ctx.rng, [answer, ...wrong]).map(pictureOpt), hint: engBlend(answer.id),
    }
  })
}

/* ---------- 6. letters ---------- */

export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

/** Letters easily mistaken for each other in print; the first wrong options. */
export const LOOK_ALIKES: Readonly<Record<string, readonly string[]>> = {
  b: ['d', 'p', 'q'], d: ['b', 'q', 'p'], p: ['q', 'b', 'd'], q: ['p', 'd', 'g', 'b'], m: ['n', 'w'], n: ['m', 'u', 'h', 'r'],
  u: ['n', 'v'], i: ['l', 'j'], l: ['i', 'j'], j: ['i', 'l'], v: ['u', 'w'], w: ['v', 'm'], h: ['n', 'b'], g: ['q', 'y'],
  y: ['g', 'v'], t: ['f', 'l'], f: ['t'], e: ['c', 'o'], c: ['e', 'o'], o: ['c', 'e'], a: ['o', 'e'], s: ['z'], z: ['s'], r: ['n'], k: ['h'], x: ['v'],
}
const lookAlikes = (l: string) => LOOK_ALIKES[l] ?? []

const letterDistractors = (rng: Rng, target: string, pool: readonly string[], n: number) =>
  take(rng, [lookAlikes(target).filter(l => pool.includes(l)), pool], n, l => l, [target])

export const findLetterAccepts = (key: string) => LETTERS.includes(key)
export const bigSmallAccepts = findLetterAccepts

/** Hear a letter's name, pick it of 4 — capitals or small letters for the whole question. Look-alikes come first. */
export function findLetterQuestion(ctx: GenContext): PickQ {
  return make(ctx, LETTERS, l => l, target => {
    const wrong = letterDistractors(ctx.rng, target, LETTERS, 3)
    if (!wrong) return null
    const upper = ctx.rng() < 0.5
    return {
      itemKey: target, answer: target, say: [E.findLetter, engLetter(target)], instruction: E.findLetter, prompt: {},
      options: shuffle(ctx.rng, [target, ...wrong]).map(l => letterOpt(l, upper)), hint: engLetter(target),
    }
  })
}

/** See a capital letter, pick its small partner of 4. */
export function bigSmallQuestion(ctx: GenContext): PickQ {
  return make(ctx, LETTERS, l => l, target => {
    const wrong = letterDistractors(ctx.rng, target, LETTERS, 3)
    if (!wrong) return null
    return {
      itemKey: target, answer: target, say: E.bigSmall, instruction: E.bigSmall, prompt: { lang: 'en', letter: target.toUpperCase() },
      options: shuffle(ctx.rng, [target, ...wrong]).map(l => letterOpt(l, false)), hint: engLetter(target),
    }
  })
}

/** c, q and x say the sound of other letters (or two sounds), so no sound question can single them out. */
export const SOUND_LETTERS = LETTERS.filter(l => !'cqx'.includes(l))
export const letterSoundAccepts = (key: string) => SOUND_LETTERS.includes(key)

/** Hear a letter's sound, pick the letter of 4. Only letters with a sound of their own are asked or offered. */
export function letterSoundQuestion(ctx: GenContext): PickQ {
  return make(ctx, SOUND_LETTERS, l => l, target => {
    const wrong = letterDistractors(ctx.rng, target, SOUND_LETTERS, 3)
    if (!wrong) return null
    return {
      itemKey: target, answer: target, say: [E.letterSound, engSound(target)], instruction: E.letterSound, prompt: {},
      options: shuffle(ctx.rng, [target, ...wrong]).map(l => letterOpt(l, false)), hint: engSound(target),
    }
  })
}

/* ---------- 7. first letter ---------- */

/** Spellings where the first letter does not say the opening sound (knife, whale, phone, write, gnome, shoe, chip, the). */
const DIGRAPH_STARTS = ['kn', 'wh', 'ph', 'wr', 'gn', 'sh', 'ch', 'th']
const clearFirstLetter = (w: EngWord) => {
  const a = w.word[0]!
  if ('ckqx'.includes(a)) return false
  if (a === 'g' && 'ei'.includes(w.word[1] ?? '')) return false
  return !DIGRAPH_STARTS.some(d => w.word.startsWith(d))
}
const firstLetterItems = (words: readonly EngWord[]) => words.filter(clearFirstLetter)
export const firstLetterAccepts = (words: readonly EngWord[]) => (key: string) => firstLetterItems(words).some(w => w.id === key)

/**
 * Hear a word (with its picture), pick its first letter of 4. Letters that share a sound with the answer (c with s or k,
 * k, q, g with j) are never offered.
 */
export function firstLetterQuestion(ctx: GenContext, words: readonly EngWord[]): PickQ {
  return make(ctx, firstLetterItems(words), w => w.id, answer => {
    const a = answer.word[0]!
    const clash = (l: string) => 'ckqx'.includes(l) || (a === 'j' && l === 'g') || (a === 'g' && l === 'j')
    const wrong = letterDistractors(ctx.rng, a, LETTERS.filter(l => !clash(l)), 3)
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: a, say: [E.firstLetter, engWord(answer.id)], instruction: E.firstLetter, prompt: { picture: answer.emoji },
      options: shuffle(ctx.rng, [a, ...wrong]).map(l => letterOpt(l, false)), hint: engWord(answer.id),
    }
  })
}

/* ---------- 8, 10, 11. reading and building words ---------- */

const patternWords = (words: readonly EngWord[], pattern: Pattern) => words.filter(w => w.pattern === pattern)
export const readPictureAccepts = (words: readonly EngWord[], pattern: Pattern) => (key: string) => patternWords(words, pattern).some(w => w.id === key)

const decodable = (w: EngWord) => w.pattern !== 'other'

/**
 * Skills 8, 10, 11: read a word, pick its picture of 4. Pictures are silent, so the child must read. Wrong pictures share
 * letters with the word (same ending or same first letter, magic-e partners included), decodable words first.
 */
export function readPictureQuestion(ctx: GenContext, words: readonly EngWord[], pattern: Pattern): PickQ {
  return make(ctx, patternWords(words, pattern), w => w.id, answer => {
    const others = words.filter(w => distinct(w, answer))
    const sharing = (w: EngWord) => w.word[0] === answer.word[0] || rhymes(w, answer) || w.word.slice(-2) === answer.word.slice(-2)
    const wrong = take(ctx.rng, [others.filter(w => decodable(w) && sharing(w)), others.filter(decodable), others], 3, w => w.emoji, [answer.emoji])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: E.readPicture, instruction: E.readPicture, prompt: { lang: 'en', word: { text: answer.word } },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(silentPictureOpt), hint: engWord(answer.id),
    }
  })
}

/** Splits a word into tiles: sh, ch, th stay together in digraph words, every other letter is a tile. */
export function wordTiles(word: string, pattern: Pattern): string[] {
  const out: string[] = []
  for (let i = 0; i < word.length; i++) {
    const pair = word.slice(i, i + 2)
    if (pattern === 'digraph' && ['sh', 'ch', 'th'].includes(pair)) {
      out.push(pair)
      i++
    } else out.push(word[i]!)
  }
  return out
}

const buildItems = (words: readonly EngWord[], pattern: Pattern) => patternWords(words, pattern).filter(w => wordTiles(w.word, pattern).length >= 2)
export const buildAccepts = (words: readonly EngWord[], pattern: Pattern) => (key: string) => buildItems(words, pattern).some(w => w.id === key)

/**
 * Picture plus shuffled tiles to place left to right. A tile says its sound when `sounds` has one (letters, digraphs),
 * otherwise the whole word. Repeated letters (mom) get position ids; the game compares by text.
 */
export function buildQuestion(ctx: GenContext, words: readonly EngWord[], pattern: Pattern, sounds: ReadonlySet<string>): OrderQ {
  return make(ctx, buildItems(words, pattern), w => w.id, word => {
    const tiles: Tile[] = wordTiles(word.word, pattern).map((t, i) => ({ id: `${t}#${i}`, text: t, say: sounds.has(t) ? engSound(t) : engWord(word.id) }))
    const shuffled = shuffleTiles(ctx.rng, tiles)
    if (!shuffled) return null
    return {
      itemKey: word.id, answer: tiles.map(t => t.id), say: [E.build, engWord(word.id)], instruction: E.build,
      picture: word.emoji, layout: 'units', direction: 'ltr', tiles: shuffled,
    }
  })
}

/* ---------- 9. minimal pairs ---------- */

interface PairItem { pair: MinimalPair; which: 'a' | 'b'; a: EngWord; b: EngWord }

const pairItems = (words: readonly EngWord[], pairs: readonly MinimalPair[]): PairItem[] =>
  pairs.flatMap(pair => {
    const a = words.find(w => w.word === pair.a)
    const b = words.find(w => w.word === pair.b)
    return a && b && a.emoji !== b.emoji ? (['a', 'b'] as const).map(which => ({ pair, which, a, b })) : []
  })
const pairKey = (p: PairItem) => `${p.pair.id}:${p.which}`
export const pairsAccepts = (words: readonly EngWord[], pairs: readonly MinimalPair[]) => (key: string) => pairItems(words, pairs).some(p => pairKey(p) === key)

/** Hear one word of a pair (pig / big), pick its picture. A third, unrelated picture joins when one exists. */
export function pairsQuestion(ctx: GenContext, words: readonly EngWord[], pairs: readonly MinimalPair[]): PickQ {
  return make(ctx, pairItems(words, pairs), pairKey, item => {
    const said = item.which === 'a' ? item.a : item.b
    const unrelated = words.filter(w => distinct(w, item.a) && distinct(w, item.b) && w.first !== item.a.first && w.first !== item.b.first && !rhymes(w, item.a) && !rhymes(w, item.b))
    const extra = unrelated.length ? [pick(ctx.rng, unrelated)] : []
    return {
      itemKey: pairKey(item), answer: said.id, say: [E.pairs, engWord(said.id)], instruction: E.pairs, prompt: {},
      options: shuffle(ctx.rng, [item.a, item.b, ...extra]).map(pictureOpt), hint: engWord(said.id),
    }
  })
}

/* ---------- 11. which word (magic e) ---------- */

interface HeardWord { text: string; other: string; id: string }

const heardItems = (words: readonly EngWord[], pairs: readonly MagicPair[]): HeardWord[] =>
  pairs.flatMap(p => {
    const short = words.find(w => w.word === p.short)
    const long = words.find(w => w.word === p.long)
    return short && long ? [{ text: short.word, other: long.word, id: short.id }, { text: long.word, other: short.word, id: long.id }] : []
  })
export const whichWordAccepts = (words: readonly EngWord[], pairs: readonly MagicPair[]) => (key: string) => heardItems(words, pairs).some(h => h.text === key)

/** Hear cap or cape, pick its spelling of 2. Both spellings are silent. */
export function whichWordQuestion(ctx: GenContext, words: readonly EngWord[], pairs: readonly MagicPair[]): PickQ {
  return make(ctx, heardItems(words, pairs), h => h.text, h => ({
    itemKey: h.text, answer: h.text, say: [E.whichWord, engWord(h.id)], instruction: E.whichWord, prompt: {},
    options: shuffle(ctx.rng, [h.text, h.other]).map(t => textOpt(t, t)), hint: engWord(h.id),
  }))
}

/* ---------- 12. sight words ---------- */

export const sightAccepts = (sight: readonly string[]) => (key: string) => sight.includes(key)

/** Hear a sight word, pick its spelling of 4. Wrong words look alike: same opening letter and same length are mixed in. */
export function sightQuestion(ctx: GenContext, sight: readonly string[]): PickQ {
  return make(ctx, sight, w => w, answer => {
    const others = sight.filter(w => w !== answer)
    const wrong = spread(ctx.rng, [others.filter(w => w[0] === answer[0]), others.filter(w => w.length === answer.length), others], 3, w => w, [answer])
    if (!wrong) return null
    return {
      itemKey: answer, answer, say: [E.sight, engSight(answer)], instruction: E.sight, prompt: {},
      options: shuffle(ctx.rng, [answer, ...wrong]).map(w => textOpt(w, w)), hint: engSight(answer),
    }
  })
}

/* ---------- 13. sentences ---------- */

export const sentenceAccepts = (sentences: readonly EngSentence[]) => (key: string) => sentences.some(s => s.id === key)

const shares = (a: EngSentence, b: EngSentence) => Object.keys(a.tags).some(k => a.tags[k] === b.tags[k])
const sameMeaning = (a: EngSentence, b: EngSentence) => [...new Set([...Object.keys(a.tags), ...Object.keys(b.tags)])].every(k => a.tags[k] === b.tags[k])

/**
 * Read a sentence, pick its scene of 3. Distractor scenes share a tag value with it but never all of them. Scenes are silent:
 * saying a scene's own sentence would give the answer away.
 */
export function sentenceQuestion(ctx: GenContext, sentences: readonly EngSentence[]): PickQ {
  return make(ctx, sentences, s => s.id, answer => {
    const others = sentences.filter(s => s.id !== answer.id && s.scene !== answer.scene && !sameMeaning(s, answer))
    const wrong = take(ctx.rng, [others.filter(s => shares(s, answer)), others], 2, s => s.scene, [answer.scene])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: E.sentence, instruction: E.sentence, prompt: { lang: 'en', sentence: { text: answer.text } },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(s => ({ id: s.id, kind: 'picture' as const, emoji: s.scene, say: [] })),
      hint: engSentence(answer.id),
    }
  })
}
