// Mastery, stars, adaptive aid and Leitner review. Thresholds: docs/DECISIONS.md D7.

export const ROUND_LENGTH = 6
export const MASTERY_ACCURACY = 0.8
export const MASTERY_ROUNDS = 2
export const AID_ON_AFTER_MISSES = 2
export const AID_OFF_AFTER_STREAK = 5

const DAY = 24 * 60 * 60 * 1000
/** Review delay per Leitner box. Box 0 is due immediately (next round). */
export const BOX_DELAYS = [0, DAY, 3 * DAY, 7 * DAY, 21 * DAY] as const
const TOP_BOX = BOX_DELAYS.length - 1

export interface RoundResult {
  at: number
  firstTry: number
  total: number
}

export interface LeitnerEntry {
  box: number
  due: number
}

export type Stars = 1 | 2 | 3

export function starsFor(firstTry: number, total: number): Stars {
  const accuracy = total ? firstTry / total : 0
  return accuracy >= MASTERY_ACCURACY ? 3 : accuracy >= 0.6 ? 2 : 1
}

export function isMastered(rounds: readonly RoundResult[]): boolean {
  return rounds.filter(r => r.total > 0 && r.firstTry / r.total >= MASTERY_ACCURACY).length >= MASTERY_ROUNDS
}

/** Aid state after an attempt, given the current miss and correct streaks. */
export function nextAid(aid: boolean, missStreak: number, correctStreak: number): boolean {
  if (missStreak >= AID_ON_AFTER_MISSES) return true
  if (correctStreak >= AID_OFF_AFTER_STREAK) return false
  return aid
}

export function updateLeitner(entry: LeitnerEntry | undefined, firstTryCorrect: boolean, now: number): LeitnerEntry {
  const box = firstTryCorrect ? Math.min((entry?.box ?? 0) + 1, TOP_BOX) : 0
  return { box, due: now + BOX_DELAYS[box]! }
}

/** Item keys due for review, most overdue first. */
export function dueItems(leitner: Readonly<Record<string, LeitnerEntry>>, now: number, accepts: (key: string) => boolean): string[] {
  return Object.entries(leitner)
    .filter(([key, e]) => e.due <= now && accepts(key))
    .sort((a, b) => a[1].due - b[1].due)
    .map(([key]) => key)
}
