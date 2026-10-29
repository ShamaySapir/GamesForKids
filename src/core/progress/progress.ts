import { isMastered, starsFor, updateLeitner, type LeitnerEntry, type RoundResult, type Stars } from '../adaptive/adaptive'

export interface SkillProgress {
  rounds: RoundResult[]
  mastered: boolean
  bestStars: number
}

export interface Progress {
  skills: Record<string, SkillProgress>
  /** Keyed by `${skillId}|${itemKey}` so the same item in two skills is tracked separately. */
  leitner: Record<string, LeitnerEntry>
  stickers: string[]
  totalStars: number
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
      skills: { ...p.skills, [r.skillId]: { rounds, mastered, bestStars: Math.max(prev.bestStars, stars) } },
      leitner,
      stickers: newlyMastered && !p.stickers.includes(r.sticker) ? [...p.stickers, r.sticker] : p.stickers,
      totalStars: p.totalStars + stars,
    },
  }
}

/** Leitner entries for one skill, keyed by item key. */
export function skillLeitner(p: Progress, skillId: string): Record<string, LeitnerEntry> {
  const prefix = `${skillId}|`
  return Object.fromEntries(
    Object.entries(p.leitner).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]),
  )
}

export const isUnlocked = (p: Progress, requires: readonly string[]) => requires.every(id => p.skills[id]?.mastered)
