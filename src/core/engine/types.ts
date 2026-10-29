import type { ComponentType } from 'react'

/** 0 = kindergarten (gan chova), 1–6 = school grades. */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** One phrase ID, or several played back to back (e.g. "three" + "and a half"). */
export type PhraseRef = string | readonly string[]

/** Phrase ID → the text TTS reads when no recording exists. IDs are prefixed with the island ID. */
export type PhraseMap = Readonly<Record<string, string>>

export interface Question<A = unknown> {
  /** Stable identity of the item being practiced, used for de-duplication and Leitner review. */
  itemKey: string
  answer: A
  /** Spoken instruction for this question. */
  say: PhraseRef
}

export interface GenContext {
  rng: () => number
  /** Item keys already asked this round; generators should avoid repeating them. */
  avoid: ReadonlySet<string>
  /** An item due for review that the generator should ask, if it can. */
  review?: string
}

export type QuestionGenerator<Q extends Question> = (ctx: GenContext) => Q

export interface GameProps<Q extends Question> {
  question: Q
  /** Adaptive visual aid is on (after repeated mistakes). */
  aid: boolean
  /** Report every attempt. After a correct answer the session moves on. */
  onAttempt: (correct: boolean) => void
}

export interface GameDef<Q extends Question = Question> {
  id: string
  /** Child-facing title. */
  title: string
  icon: string
  generate: QuestionGenerator<Q>
  component: ComponentType<GameProps<Q>>
  /** Optional: is this item key valid for this game (used to accept review items). */
  accepts?: (itemKey: string) => boolean
  /** Questions per round, when different from the default. */
  roundLength?: number
}

export interface SkillDef {
  /** Globally unique, prefixed with the island ID: "clock.half". */
  id: string
  title: string
  grade: Grade
  /** Skill IDs that must be mastered first. Empty = unlocked from the start. */
  requires: readonly string[]
  /** Sticker earned on mastering this skill (emoji). */
  sticker: string
  /** Wrap each entry with `defineGame` so its question type is checked. */
  games: readonly GameDef[]
}

/** Type-checks a game against its own question type, then erases it for storage in a skill. */
export function defineGame<Q extends Question>(game: GameDef<Q>): GameDef {
  return game as unknown as GameDef
}

export interface IslandDef {
  id: string
  /** Position on the world map, ascending. */
  order: number
  title: string
  icon: string
  /** CSS custom property used as the island's accent, e.g. "--clock". */
  color: string
  skills: readonly SkillDef[]
  phrases: PhraseMap
  /** Shown on the map but not playable yet. */
  comingSoon?: boolean
}
