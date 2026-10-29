import { pick, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import { wordPhrase } from '../hebrew/ids'
import type { Letter, PickOption, PickQ, Word } from '../hebrew/types'
import { R, clozePhrase, sentencePhrase, storyPhrase, unitPhrase } from './ids'
import type { Book, BookQ, Cloze, OrderQ, Sentence, Story, Tile, Unit, Vowel } from './types'

// Pure question generators for the reading island, one per game. Content comes in as arguments.
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

const pictureOpt = (w: Word): PickOption => ({ id: w.id, kind: 'picture', emoji: w.emoji, say: wordPhrase(w.id) })

/** Shuffles the tiles until their texts read differently from the answer, so the board never starts solved. */
function shuffleTiles(rng: Rng, tiles: readonly Tile[]): Tile[] | null {
  const sameAsAnswer = (order: readonly Tile[]) => order.every((t, i) => t.text === tiles[i]!.text)
  for (let attempt = 0; attempt < 20; attempt++) {
    const order = shuffle(rng, tiles)
    if (!sameAsAnswer(order)) return order
  }
  // Rotating changes the order unless every text is identical, which could not be told apart anyway.
  const rotated = [...tiles.slice(1), tiles[0]!]
  return sameAsAnswer(rotated) ? null : rotated
}

/* ---------- 1–5. vowel units ---------- */

const vowelUnits = (units: readonly Unit[], vowel: Vowel) => units.filter(u => u.vowel === vowel && u.spellings.length)
export const unitAccepts = (units: readonly Unit[], vowel: Vowel) => (key: string) => vowelUnits(units, vowel).some(u => u.key === key)

const alike = (letters: readonly Letter[], a: string, b: string) =>
  letters.some(l => (l.char === a && l.lookAlike.includes(b)) || (l.char === b && l.lookAlike.includes(a)))

/**
 * Wrong units for `target`: the same letter with another vowel or the same vowel on a look-alike letter first, then the
 * same vowel, then anything. Units are keyed by sound+vowel, so no two options ever sound the same.
 */
function unitDistractors(rng: Rng, units: readonly Unit[], letters: readonly Letter[], target: Unit, n: number): Unit[] | null {
  const others = units.filter(u => u.key !== target.key && u.spellings.length)
  const near = others.filter(u => (u.sound === target.sound && u.vowel !== target.vowel) || (u.vowel === target.vowel && alike(letters, u.letter, target.letter)))
  return take(rng, [near, others.filter(u => u.vowel === target.vowel), others], n, u => u.key, [target.key])
}

const spelling = (rng: Rng, u: Unit) => pick(rng, u.spellings)

/** Skills 1–5, game A: hear a unit, pick it among 4 written units (one randomly chosen spelling each). */
export function hearUnitQuestion(ctx: GenContext, units: readonly Unit[], letters: readonly Letter[], vowel: Vowel): PickQ {
  return make(ctx, vowelUnits(units, vowel), u => u.key, target => {
    const wrong = unitDistractors(ctx.rng, units, letters, target, 3)
    if (!wrong) return null
    return {
      itemKey: target.key, answer: target.key, say: [R.hearUnit, unitPhrase(target.key)], instruction: R.hearUnit, prompt: {},
      options: shuffle(ctx.rng, [target, ...wrong]).map(u => ({ id: u.key, kind: 'text' as const, label: spelling(ctx.rng, u) })),
      hint: unitPhrase(target.key),
    }
  })
}

export const SEE_UNIT_LABELS = ['🔴', '🟢', '🔵'] as const

/** Skills 1–5, game B: see a big unit, pick its sound among 3 colored buttons. Labels follow the shuffled order. */
export function seeUnitQuestion(ctx: GenContext, units: readonly Unit[], letters: readonly Letter[], vowel: Vowel): PickQ {
  return make(ctx, vowelUnits(units, vowel), u => u.key, target => {
    const wrong = unitDistractors(ctx.rng, units, letters, target, 2)
    if (!wrong) return null
    return {
      itemKey: target.key, answer: target.key, say: R.seeUnit, instruction: R.seeUnit, prompt: { letter: spelling(ctx.rng, target) },
      options: shuffle(ctx.rng, [target, ...wrong]).map((u, i) => ({ id: u.key, kind: 'sound' as const, label: SEE_UNIT_LABELS[i]!, say: unitPhrase(u.key) })),
      hint: unitPhrase(target.key),
    }
  })
}

/* ---------- 6. build a word ---------- */

const buildItems = (words: readonly Word[]) => words.filter(w => w.syllables.length >= 2 && w.syllables.length <= 4)
export const buildAccepts = (words: readonly Word[]) => (key: string) => buildItems(words).some(w => w.id === key)

/**
 * Tiles are the word's syllables; ids carry the position ('כַּ#0') so repeated syllables stay distinct. Syllables have no
 * recordings, so each tile says the whole word: hearing it helps the child find the next unit.
 */
export function buildQuestion(ctx: GenContext, words: readonly Word[]): OrderQ {
  return make(ctx, buildItems(words), w => w.id, word => {
    const tiles: Tile[] = word.syllables.map((s, i) => ({ id: `${s}#${i}`, text: s, say: wordPhrase(word.id) }))
    const shuffled = shuffleTiles(ctx.rng, tiles)
    if (!shuffled) return null
    return {
      itemKey: word.id, answer: tiles.map(t => t.id), say: [R.build, wordPhrase(word.id)], instruction: R.build,
      picture: word.emoji, layout: 'units', tiles: shuffled,
    }
  })
}

/* ---------- 7. words and pictures ---------- */

export const wordAccepts = (words: readonly Word[]) => (key: string) => words.some(w => w.id === key)

/** Game A: read a word, pick its picture of 4. Pictures with another opening sound are preferred. */
export function readWordQuestion(ctx: GenContext, words: readonly Word[]): PickQ {
  return make(ctx, words, w => w.id, answer => {
    const others = words.filter(w => w.id !== answer.id && w.emoji !== answer.emoji)
    const differs = others.filter(w => w.first !== null && w.first !== answer.first)
    const wrong = take(ctx.rng, [differs, others], 3, w => w.emoji, [answer.emoji])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: R.readWord, instruction: R.readWord, prompt: { word: { text: answer.text } },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(pictureOpt), hint: wordPhrase(answer.id),
    }
  })
}

/** Game B: see a picture, pick its written word of 3. Look-alike words (same opening letter, then same length) are preferred. */
export function pictureWordQuestion(ctx: GenContext, words: readonly Word[]): PickQ {
  return make(ctx, words, w => w.id, answer => {
    const others = words.filter(w => w.id !== answer.id && w.emoji !== answer.emoji && w.text !== answer.text)
    const wrong = take(ctx.rng, [
      others.filter(w => w.text[0] === answer.text[0]),
      others.filter(w => w.syllables.length === answer.syllables.length),
      others,
    ], 2, w => w.text, [answer.text])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: R.pictureWord, instruction: R.pictureWord, prompt: { picture: answer.emoji },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(w => ({ id: w.id, kind: 'text' as const, label: w.text })),
      hint: wordPhrase(answer.id),
    }
  })
}

/* ---------- 8. sentence → picture ---------- */

export const sentenceAccepts = (sentences: readonly Sentence[]) => (key: string) => sentences.some(s => s.id === key)

const shares = (a: Sentence, b: Sentence) => Object.keys(a.tags).some(k => a.tags[k] === b.tags[k])
const sameMeaning = (a: Sentence, b: Sentence) => [...new Set([...Object.keys(a.tags), ...Object.keys(b.tags)])].every(k => a.tags[k] === b.tags[k])

/**
 * Read a sentence, pick its scene of 3. Distractor scenes share a tag value with it but never all of them, so exactly one
 * picture fits. The pictures are silent (`say: []`): reading a picture's own sentence aloud would give the answer away.
 */
export function sentenceQuestion(ctx: GenContext, sentences: readonly Sentence[]): PickQ {
  return make(ctx, sentences, s => s.id, answer => {
    const others = sentences.filter(s => s.id !== answer.id && s.scene !== answer.scene && !sameMeaning(s, answer))
    const wrong = take(ctx.rng, [others.filter(s => shares(s, answer)), others], 2, s => s.scene, [answer.scene])
    if (!wrong) return null
    return {
      itemKey: answer.id, answer: answer.id, say: R.sentence, instruction: R.sentence, prompt: { sentence: { text: answer.text } },
      options: shuffle(ctx.rng, [answer, ...wrong]).map(s => ({ id: s.id, kind: 'picture' as const, emoji: s.scene, say: [] })),
      hint: sentencePhrase(answer.id),
    }
  })
}

/* ---------- 9. cloze ---------- */

export const clozeAccepts = (clozes: readonly Cloze[]) => (key: string) => clozes.some(c => c.id === key)

export function clozeQuestion(ctx: GenContext, clozes: readonly Cloze[]): PickQ {
  return make(ctx, clozes, c => c.id, cloze => {
    const texts = [cloze.answer, ...cloze.wrong]
    // A repeated word would give two identical buttons (or two right answers).
    if (new Set(texts).size !== texts.length) return null
    return {
      itemKey: cloze.id, answer: cloze.answer, say: R.cloze, instruction: R.cloze, prompt: { sentence: { text: cloze.text } },
      options: shuffle(ctx.rng, texts).map(t => ({ id: t, kind: 'text' as const, label: t })), hint: clozePhrase(cloze.id),
    }
  })
}

/* ---------- 10. story order ---------- */

const storyItems = (stories: readonly Story[]) => stories.filter(s => new Set(s.sentences).size === s.sentences.length)
export const storyAccepts = (stories: readonly Story[]) => (key: string) => storyItems(stories).some(s => s.id === key)

export function storyOrderQuestion(ctx: GenContext, stories: readonly Story[]): OrderQ {
  return make(ctx, storyItems(stories), s => s.id, story => {
    const tiles: Tile[] = story.sentences.map((text, n) => ({ id: `${story.id}.${n}`, text, say: storyPhrase(story.id, n) }))
    const shuffled = shuffleTiles(ctx.rng, tiles)
    if (!shuffled) return null
    return {
      // No scene picture: the story's emoji are in story order and would give the answer away.
      itemKey: story.id, answer: tiles.map(t => t.id), say: R.order, instruction: R.order, layout: 'sentences', tiles: shuffled,
    }
  })
}

/* ---------- 11. books ---------- */

export const bookAccepts = (books: readonly Book[]) => (key: string) => books.some(b => b.id === key)

/** A book is one question; a due review book comes first, then books not yet read this round. */
export function bookQuestion(ctx: GenContext, books: readonly Book[]): BookQ {
  return make(ctx, books, b => b.id, book => ({ itemKey: book.id, answer: null, say: R.readBook, book }))
}
