import { isMastered, starsFor, updateLeitner, type LeitnerEntry, type RoundResult, type Stars } from '../adaptive/adaptive'

export interface SkillProgress {
  rounds: RoundResult[]
  mastered: boolean
  bestStars: number
  /** Marked "already knows this" by a parent (DECISIONS D19): mastered without playing, no sticker, undoable. */
  byParent?: boolean
}

export interface Progress {
  skills: Record<string, SkillProgress>
  /** Keyed by `${skillId}|${itemKey}` so the same item in two skills is tracked separately. */
  leitner: Record<string, LeitnerEntry>
  stickers: string[]
  totalStars: number
  /** Best sprint score per game (D23), keyed by `${skillId}|${gameId}`. Absent in progress saved before sprints. */
  records?: Record<string, number>
}

export const emptyProgress = (): Progress => ({ skills: {}, leitner: {}, stickers: [], totalStars: 0 })

/** Keep only recent history per skill. */
const MAX_ROUNDS = 20

export interface RoundSummary {
  skillId: string
  sticker: string
  firstTry: readonly string[]
  missed: readonly string[]
  total: number
  at: number
}

export interface RoundOutcome {
  progress: Progress
  stars: Stars
  newlyMastered: boolean
}

export function applyRound(p: Progress, r: RoundSummary): RoundOutcome {
  const prev = p.skills[r.skillId] ?? { rounds: [], mastered: false, bestStars: 0 }
  const stars = starsFor(r.firstTry.length, r.total)
  const rounds = [...prev.rounds, { at: r.at, firstTry: r.firstTry.length, total: r.total }].slice(-MAX_ROUNDS)
  const mastered = prev.mastered || isMastered(rounds)
  const newlyMastered = mastered && !prev.mastered

  const leitner = { ...p.leitner }
  for (const key of r.firstTry) leitner[`${r.skillId}|${key}`] = updateLeitner(leitner[`${r.skillId}|${key}`], true, r.at)
  for (const key of r.missed) leitner[`${r.skillId}|${key}`] = updateLeitner(leitner[`${r.skillId}|${key}`], false, r.at)

  return {
    stars,
    newlyMastered,
    progress: {
      ...p,
      skills: { ...p.skills, [r.skillId]: { rounds, mastered, bestStars: Math.max(prev.bestStars, stars) } },
      leitner,
      stickers: newlyMastered && !p.stickers.includes(r.sticker) ? [...p.stickers, r.sticker] : p.stickers,
      totalStars: p.totalStars + stars,
    },
  }
}

export interface SprintSummary {
  skillId: string
  gameId: string
  /** Correct answers, in order (a key may repeat: a sprint can ask a fact again). */
  correct: readonly string[]
  missed: readonly string[]
  at: number
}

export interface SprintOutcome {
  progress: Progress
  score: number
  /** The record before this sprint (0 if none). */
  previous: number
  newRecord: boolean
}

/** A sprint (D23) updates Leitner and the game's record only: stars, rounds and mastery are left alone. */
export function applySprint(p: Progress, r: SprintSummary): SprintOutcome {
  const leitner = { ...p.leitner }
  const missed = new Set(r.missed)
  for (const key of new Set(r.correct)) if (!missed.has(key)) leitner[`${r.skillId}|${key}`] = updateLeitner(leitner[`${r.skillId}|${key}`], true, r.at)
  for (const key of missed) leitner[`${r.skillId}|${key}`] = updateLeitner(leitner[`${r.skillId}|${key}`], false, r.at)
  const recordKey = `${r.skillId}|${r.gameId}`
  const previous = p.records?.[recordKey] ?? 0
  const score = r.correct.length
  const newRecord = score > previous
  const records = newRecord ? { ...p.records, [recordKey]: score } : p.records
  return { score, previous, newRecord, progress: { ...p, leitner, ...(records ? { records } : {}) } }
}

/** Leitner entries for one skill, keyed by item key. */
export function skillLeitner(p: Progress, skillId: string): Record<string, LeitnerEntry> {
  const prefix = `${skillId}|`
  return Object.fromEntries(
    Object.entries(p.leitner).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]),
  )
}

export const isUnlocked = (p: Progress, requires: readonly string[]) => requires.every(id => p.skills[id]?.mastered)

/** A parent's "already knows this" (D19), or undoing it. Undo only clears a parent's mark, never a played mastery. */
export function markKnown(p: Progress, skillId: string, known: boolean): Progress {
  const prev = p.skills[skillId] ?? { rounds: [], mastered: false, bestStars: 0 }
  if (!known && !prev.byParent) return p
  const next: SkillProgress = known
    ? { ...prev, mastered: true, byParent: prev.mastered && !prev.byParent ? undefined : true }
    : { ...prev, mastered: isMastered(prev.rounds), byParent: undefined }
  if (next.byParent === undefined) delete next.byParent
  return { ...p, skills: { ...p.skills, [skillId]: next } }
}

