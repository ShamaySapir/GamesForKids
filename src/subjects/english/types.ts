// Shared by content (T1) and generators (T2) — fixed before parallel work starts. Spec: docs/specs/english.md.
// Questions reuse the shared PickQ (D14) and the reading island's OrderQ with direction 'ltr' (D11).

export type Topic = 'colors' | 'numbers' | 'animals' | 'food' | 'body' | 'family' | 'school' | 'toys' | 'clothes' | 'actions' | 'home' | 'nature'

/** Spelling pattern, for the phonics skills. Only `cvc`, `digraph` and `magic-e` words are decoded by the child. */
export type Pattern = 'cvc' | 'digraph' | 'magic-e' | 'other'

export interface EngWord {
  /** Stable ID; phrase engWord(id) says the word in English. */
  id: string
  /** The word, lowercase, American spelling. */
  word: string
  /** One unambiguous emoji, unique across words. */
  emoji: string
  topic: Topic
  pattern: Pattern
  /** First sound as a letter or digraph ('b', 'sh', 'k' for "cat"); the first-letter game uses `word[0]` instead. */
  first: string
  /** Rime for rhyming and blending ('at' in cat); words with the same rime rhyme. Only for one-syllable words. */
  rime?: string
}

/** A classroom chunk with the picture situation it fits ("Good morning!" → 🌅👋). */
export interface Chunk { id: string; text: string; scene: string }

/** A question and its sensible answer, with two answers that don't fit. */
export interface QA { id: string; question: string; answer: string; wrong: readonly [string, string] }

/** Two words that differ in one sound Hebrew speakers confuse. */
export interface MinimalPair { id: string; a: string; b: string; contrast: 'b/p' | 'v/w' | 'ee/i' }

/** A short word and its silent-e partner (cap → cape), both picturable. */
export interface MagicPair { short: string; long: string }

export interface EngSentence {
  id: string
  /** 3–6 words, only taught words; ends with a period. */
  text: string
  /** Emoji scene, unique across sentences. */
  scene: string
  /** Who/does/what tags; distractor scenes share one tag and differ in another. */
  tags: Readonly<Record<string, string>>
}
