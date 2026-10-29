import { AID_OFF_AFTER_STREAK, ROUND_LENGTH, nextAid } from '../adaptive/adaptive'
import type { GameDef, Question } from './types'
import type { Rng } from './random'

/** Pure state of one round of a game. Rendering lives in GameRunner. */
export interface SessionState {
  index: number
  length: number
  question: Question
  asked: string[]
  /** Item keys answered correctly on the first try / missed at least once. */
  firstTry: string[]
  missed: string[]
  triedThis: boolean
  aid: boolean
  missStreak: number
  correctStreak: number
  done: boolean
}

const MAX_TRIES = 30

export function nextQuestion(game: GameDef, rng: Rng, asked: readonly string[], review: string[]): Question {
  const avoid = new Set(asked)
  const reviewKey = review.find(k => !avoid.has(k) && (game.accepts?.(k) ?? false))
  let q = game.generate({ rng, avoid, review: reviewKey })
  for (let i = 0; avoid.has(q.itemKey) && i < MAX_TRIES; i++) q = game.generate({ rng, avoid })
  return q
}

export function startSession(game: GameDef, rng: Rng, review: string[], length = game.roundLength ?? ROUND_LENGTH): SessionState {
  const question = nextQuestion(game, rng, [], review)
  return {
    index: 0, length, question, asked: [question.itemKey], firstTry: [], missed: [],
    triedThis: false, aid: false, missStreak: 0, correctStreak: 0, done: false,
  }
}

/** Apply one attempt. A correct answer marks the question finished; call `advance` to move on. */
export function attempt(s: SessionState, correct: boolean): SessionState {
  const key = s.question.itemKey
  if (!correct) {
    const missStreak = s.missStreak + 1
    return {
      ...s, triedThis: true, missStreak, correctStreak: 0,
      missed: s.missed.includes(key) ? s.missed : [...s.missed, key],
      aid: nextAid(s.aid, missStreak, 0),
    }
  }
  const correctStreak = s.triedThis ? 0 : s.correctStreak + 1
  return {
    ...s, missStreak: 0, correctStreak,
    firstTry: s.triedThis ? s.firstTry : [...s.firstTry, key],
    aid: nextAid(s.aid, 0, Math.min(correctStreak, AID_OFF_AFTER_STREAK)),
  }
}

export function advance(s: SessionState, game: GameDef, rng: Rng, review: string[]): SessionState {
  if (s.index + 1 >= s.length) return { ...s, done: true }
  const question = nextQuestion(game, rng, s.asked, review)
  return { ...s, index: s.index + 1, question, asked: [...s.asked, question.itemKey], triedThis: false }
}
