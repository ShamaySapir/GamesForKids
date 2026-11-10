import type { Grade, IslandDef, SkillDef } from '../engine/types'
import { isUnlocked, type Progress } from './progress'

// Soft locks (DECISIONS D19): nothing is locked; the path recommends where to start from the child's grade and tags
// skills that are a stretch. Pure, so the island screen, play screen and tests share one rule.

/** The first skill in path order not yet mastered, at or above the child's grade minus one; else the first unmastered. */
export function recommendedSkill(p: Progress, island: IslandDef, grade: Grade): SkillDef | undefined {
  const open = island.skills.filter(s => !p.skills[s.id]?.mastered)
  return open.find(s => s.grade >= grade - 1) ?? open[0]
}

/** Above the child's grade with prerequisites not mastered: playable, but Shufi says it is harder. */
export const isChallenge = (p: Progress, skill: SkillDef, grade: Grade) =>
  skill.grade > grade && !p.skills[skill.id]?.mastered && !isUnlocked(p, skill.requires)

/** After a weak round: the first prerequisite not mastered, to suggest as an easier step. */
export const easierStep = (p: Progress, island: IslandDef, skill: SkillDef): SkillDef | undefined =>
  island.skills.find(s => skill.requires.includes(s.id) && !p.skills[s.id]?.mastered)
