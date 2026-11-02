import type { PhraseRef, Question } from '../../core/engine/types'

// Shared "pick one answer" question, used by every island (DECISIONS D14). Generators build PickQ; PickGame renders it.

/**
 * A registered drawing and its variation props, e.g. { name: 'dog', props: { facing: 'left' } }.
 * The name '?' is an empty slot. Drawings are registered with registerArt (./art.tsx).
 */
export interface ArtRef {
  name: string
  props?: Readonly<Record<string, string | number | boolean>>
  /** Spoken name, when the drawing should be named on hover/🔊. */
  say?: PhraseRef
}

/** A group of identical objects to count: '🍎' × 7. */
export interface ObjectGroup {
  emoji: string
  count: number
  /**
   * row: in rows of 5 (helps grouping); dice: dot-dice pattern (count ≤ 6, invites subitizing); scatter: loose;
   * array: `count / cols` rows of `cols` (multiplication); groups: `count / cols` separate groups of `cols`.
   */
  layout?: 'row' | 'dice' | 'scatter' | 'array' | 'groups'
  /** Items per row (array) or per group (groups). */
  cols?: number
  /** The last `faded` objects are shown leaving (subtraction stories). */
  faded?: number
  /** The last `covered` objects are hidden under cups ("how many are hiding?"). */
  covered?: number
}

/**
 * What an option shows. A 'sound' option answers on click and has a separate 🔊 that plays `say`; it shows
 * `label` (a letter), or without a label the text of its single `say` phrase (e.g. a letter's name, "בֵּית").
 */
export type PickOption =
  | { id: string; kind: 'picture'; emoji: string; say: PhraseRef }
  | { id: string; kind: 'letter'; label: string; lang?: 'en' }
  | { id: string; kind: 'sound'; label?: string; say: string }
  /** Readable text with nikud (a unit, word or short phrase); optional 🔊 reads it. */
  | { id: string; kind: 'text'; label: string; say?: PhraseRef; lang?: 'en' }
  /** A number or a short exercise/sign shown in digits, left-to-right ('7', '<', '3 + 4'). */
  | { id: string; kind: 'number'; label: string; say?: PhraseRef }
  /** A group of objects to compare or count. */
  | { id: string; kind: 'objects'; group: ObjectGroup }
  /** A drawing from a registered art kit. */
  | { id: string; kind: 'art'; art: ArtRef; say?: PhraseRef }

export interface PickPrompt {
  /** 'en': the letter, word and sentence are English — shown left to right in the English reading font. */
  lang?: 'en'
  /** Big picture (emoji). */
  picture?: string
  /** Big single letter. */
  letter?: string
  /** Word with nikud; `blank` marks the missing letter position ('start' | 'end'). */
  word?: { text: string; blank?: 'start' | 'end' }
  /** A sentence with nikud for the child to read; '___' marks a gap. 🔊 reads it only when `say` is given. */
  sentence?: { text: string; say?: PhraseRef }
  /** Groups of objects shown side by side (first group on the right), e.g. a join story 3 + 2. */
  objects?: readonly ObjectGroup[]
  /** An exercise shown left-to-right in digits: '8 + 5 = ?'. */
  expr?: string
  /** Drawings in a row (a sample, a pattern with a '?' slot, a drawing with a missing part). */
  art?: readonly ArtRef[]
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
