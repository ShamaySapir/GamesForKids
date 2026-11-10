import { MASTERY_ACCURACY, MASTERY_ROUNDS } from '../adaptive/adaptive'
import type { IslandDef, SkillDef } from '../engine/types'
import { isUnlocked, type Progress } from './progress'

// Pure summaries for the parents' page (docs/specs/parents.md). Nothing here reads storage or the clock.

const DAY = 24 * 60 * 60 * 1000

export type SkillState = 'mastered' | 'practising' | 'new' | 'locked'

export interface SkillReport {
  state: SkillState
  /** Rounds that count toward mastery (D7), capped at the number needed. */
  good: number
  bestStars: number
  lastPlayed?: number
  /** Mastered by a parent's "already knows this" (D19), not by playing. */
  byParent: boolean
}

export function skillStatus(p: Progress, skill: SkillDef): SkillReport {
  const sp = p.skills[skill.id]
  const rounds = sp?.rounds ?? []
  const good = Math.min(MASTERY_ROUNDS, rounds.filter(r => r.total > 0 && r.firstTry / r.total >= MASTERY_ACCURACY).length)
  const lastPlayed = rounds.length ? Math.max(...rounds.map(r => r.at)) : undefined
  const state: SkillState = sp?.mastered ? 'mastered' : rounds.length ? 'practising' : isUnlocked(p, skill.requires) ? 'new' : 'locked'
  return { state, good: sp?.mastered ? MASTERY_ROUNDS : good, bestStars: sp?.bestStars ?? 0, lastPlayed, byParent: !!sp?.byParent }
}

export interface PracticeGroup {
  island: IslandDef
  skill: SkillDef
  /** Item keys missed the last time they were asked (Leitner box 0), most recent first. */
  items: string[]
}

/** What to practise: per skill, the items the child got wrong the last time they saw them; most items first. */
export function practiceItems(p: Progress, islands: readonly IslandDef[]): PracticeGroup[] {
  const groups: PracticeGroup[] = []
  for (const island of islands) for (const skill of island.skills) {
    const items = Object.entries(p.leitner)
      .filter(([k, e]) => e.box === 0 && k.startsWith(`${skill.id}|`))
      .sort((a, b) => b[1].due - a[1].due)
      .map(([k]) => k.slice(skill.id.length + 1))
    if (items.length) groups.push({ island, skill, items })
  }
  return groups.sort((a, b) => b.items.length - a.items.length)
}

export interface Summary {
  stars: number
  stickers: number
  mastered: number
  skills: number
  lastPlayed?: number
  roundsThisWeek: number
}

export function summary(p: Progress, islands: readonly IslandDef[], now: number): Summary {
  const skills = islands.flatMap(i => i.skills)
  const times = Object.values(p.skills).flatMap(s => s.rounds.map(r => r.at))
  return {
    stars: p.totalStars,
    stickers: p.stickers.length,
    mastered: skills.filter(s => p.skills[s.id]?.mastered).length,
    skills: skills.length,
    lastPlayed: times.length ? Math.max(...times) : undefined,
    roundsThisWeek: times.filter(t => t > now - 7 * DAY && t <= now).length,
  }
}
