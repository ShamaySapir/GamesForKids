import type { PhraseRef, Question } from '../../core/engine/types'
import type { SoundId } from '../hebrew/types'

// Shared by content (T1), generators (T2) and games (T3) — fixed before parallel work starts.
// Spec: docs/specs/reading.md § Data model. Pick questions reuse PickQ from the letters island (DECISIONS D11).

export type Vowel = 'a' | 'i' | 'o' | 'u' | 'e'

/** A consonant+vowel sound and every way it is written: 'm-a' → ['מַ', 'מָ']. */
export interface Unit {
  /** `${sound}-${vowel}`; phrase `reading.unit.<key>` says it. */
  key: string
  sound: SoundId
  vowel: Vowel
  /** All spellings with nikud, including vowel letters: ['שִׁ', 'שִׁי']. */
  spellings: readonly string[]
  /** Base letter (no dots) of the spellings, for look-alike distractors. */
  letter: string
}

export interface Sentence {
  /** Phrase `reading.sentence.<id>` reads it. */
  id: string
  /** 3–5 words, full nikud. */
  text: string
  /** Emoji scene, unique across sentences. */
  scene: string
  /** What the sentence is about, e.g. { who: 'cat', does: 'sleep' }. Distractor scenes share one tag, never all. */
  tags: Readonly<Record<string, string>>
}

export interface Cloze {
  /** Phrase `reading.cloze.<id>` reads the sentence with a pause at the gap. */
  id: string
  /** Sentence with nikud; '___' marks the gap. */
  text: string
  answer: string
  /** Two real words (nikud) that do not fit. */
  wrong: readonly [string, string]
}

export interface Story {
  /** Phrases `reading.story.<id>.<0|1|2>` read each sentence. */
  id: string
  sentences: readonly [string, string, string]
  scene: string
}

export interface Page {
  /** 1–3 short lines with nikud; phrase `reading.book.<bookId>.<pageIndex>` reads it. */
  text: string
  scene: string
}

export interface BookQuestion {
  /** Phrase `reading.book.<bookId>.q<index>` reads it. */
  prompt: string
  /** Each option is a picture (scene) or a short text with nikud. */
  options: readonly { text?: string; scene?: string }[]
  answer: number
}

export interface Book {
  id: string
  title: string
  /** Emoji cover. */
  cover: string
  /** 1 = mostly kamatz/patach … 5 = all vowels (spec skill order a, i, o, u, e). */
  stage: 1 | 2 | 3 | 4 | 5
  pages: readonly Page[]
  questions: readonly BookQuestion[]
}

/* ---------- questions for the new components ---------- */

/** One tile in an order game: a unit of a word, or a sentence of a story. */
export interface Tile { id: string; text: string; say: PhraseRef }

/** Answer is the tile ids in the correct reading order (first = rightmost). */
export interface OrderQ extends Question<readonly string[]> {
  instruction: string
  /** Emoji shown above the slots (the word's picture or the story's scene). */
  picture?: string
  /** 'units' builds a word in one line; 'sentences' stacks lines top to bottom. */
  layout: 'units' | 'sentences'
  tiles: Tile[]
}

/** A whole book is one question: read all pages, then answer its questions. */
export interface BookQ extends Question<null> {
  book: Book
}
