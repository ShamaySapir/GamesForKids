import type { PhraseRef, Question } from '../../core/engine/types'

// Shared by content (T1), generators (T2) and games (T3) — fixed before parallel work starts.
// Spec: docs/specs/hebrew-letters.md § Data model.

/** Consonant sounds. ח and soft כ share 'x'; ט/ת share 't'; כּ/ק share 'k'; ס/שׂ share 's'; ב/ו share 'v'. */
export type SoundId =
  | 'b' | 'v' | 'g' | 'd' | 'h' | 'z' | 'x' | 't' | 'y' | 'k'
  | 'l' | 'm' | 'n' | 's' | 'p' | 'f' | 'ts' | 'r' | 'sh'

export interface Letter {
  /** Base letter without dots: 'כ'. Finals are separate entries: 'ך'. */
  char: string
  /** Phrase ID of the letter's name: 'hebrew.letter.כ' → "כַּף". */
  name: string
  /** Main sound, when the letter has one (א and ע have none). */
  sound?: SoundId
  /** Final form of a regular letter: 'ך' for 'כ'. */
  final?: string
  /** Regular form of a final letter: 'כ' for 'ך'. */
  regular?: string
  /** Letters commonly confused with this one by shape. */
  lookAlike: readonly string[]
}

export interface Word {
  /** Stable latin ID: 'kadur'. Phrase `hebrew.word.<id>` says the word. */
  id: string
  /** The word with full nikud: 'כַּדּוּר'. */
  text: string
  /** One unambiguous emoji, unique across words. */
  emoji: string
  /** Syllables with nikud; joined they equal `text`. */
  syllables: readonly string[]
  /** First consonant+vowel unit with nikud, a prefix of `text`: 'כַּ'. */
  opening: string
  /** First consonant sound; null when the word starts with a vowel (א/ע/ה). */
  first: SoundId | null
  /** Last consonant sound; null when the word ends in a vowel. */
  last: SoundId | null
  /** Rhyme group ID; words in the same group rhyme. */
  rhyme?: string
}

/* ---------- questions (T2 produces them, T3 renders them) ---------- */

/**
 * What a pick option shows. A 'sound' option answers on click and has a separate 🔊 that plays `say`; it shows
 * `label` (a letter), or without a label the text of its single `say` phrase (e.g. a letter's name, "בֵּית").
 */
export type PickOption =
  | { id: string; kind: 'picture'; emoji: string; say: PhraseRef }
  | { id: string; kind: 'letter'; label: string }
  | { id: string; kind: 'sound'; label?: string; say: string }
  /** Readable text with nikud (a unit, word or short phrase); optional 🔊 reads it. Used by the reading island. */
  | { id: string; kind: 'text'; label: string; say?: PhraseRef }

export interface PickPrompt {
  /** Big picture (emoji). */
  picture?: string
  /** Big single letter. */
  letter?: string
  /** Word with nikud; `blank` marks the missing letter position ('start' | 'end'). */
  word?: { text: string; blank?: 'start' | 'end' }
  /** A sentence with nikud for the child to read; '___' marks a gap. 🔊 reads it only when `say` is given. */
  sentence?: { text: string; say?: PhraseRef }
}

/** Answer is the correct option's id. */
export interface PickQ extends Question<string> {
  /** Child-facing instruction phrase ID, shown as text. */
  instruction: string
  prompt: PickPrompt
  options: PickOption[]
  /** Spoken again when the adaptive aid turns on. */
  hint?: PhraseRef
}

/** Answer is the syllable count. */
export interface ClapQ extends Question<number> {
  word: Word
  /** Says the word syllable by syllable (aid). */
  syllablesSay: PhraseRef
}

export interface SortCard { id: string; emoji: string; text: string; say: PhraseRef; bin: 0 | 1 }

/** Answer is unused (null); correctness is per card. */
export interface SortQ extends Question<null> {
  /** The two basket labels, e.g. ['בּ', 'ב']. */
  bins: readonly [string, string]
  cards: SortCard[]
}
