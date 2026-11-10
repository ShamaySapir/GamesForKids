import { describe, expect, it } from 'vitest'
import type { Grade, IslandDef, SkillDef } from '../engine/types'
import { applyRound, emptyProgress, markKnown, type Progress } from './progress'
import { easierStep, isChallenge, recommendedSkill } from './path'

const skill = (id: string, grade: Grade, requires: string[] = []): SkillDef => ({ id, title: id, grade, requires, sticker: '⭐', games: [] })
const island: IslandDef = {
  id: 'clock', order: 1, title: 'c', icon: 'c', color: '--c', phrases: {},
  skills: [skill('hands', 0), skill('hours', 1, ['hands']), skill('half', 1, ['hours']), skill('quarter', 2, ['half']), skill('minute', 3, ['quarter'])],
}
const mastered = (...ids: string[]): Progress => ids.reduce((p, id) => markKnown(p, id, true), emptyProgress())

describe('soft locks (D19)', () => {
  it('recommends from the child grade: a 2nd grader starts at a grade-1 skill, a gan child at the start', () => {
    expect(recommendedSkill(emptyProgress(), island, 2)?.id).toBe('hours')
    expect(recommendedSkill(emptyProgress(), island, 0)?.id).toBe('hands')
    expect(recommendedSkill(mastered('hours'), island, 2)?.id).toBe('half')
    expect(recommendedSkill(mastered('hands', 'hours', 'half', 'quarter', 'minute'), island, 2)).toBeUndefined()
  })

  it('falls back to the first unmastered skill when everything at the grade is done', () => {
    expect(recommendedSkill(mastered('quarter', 'minute'), island, 3)?.id).toBe('hands')
  })

  it('tags a challenge only above the grade with prerequisites unmet', () => {
    expect(isChallenge(emptyProgress(), island.skills[3]!, 1)).toBe(true)
    expect(isChallenge(mastered('half'), island.skills[3]!, 1)).toBe(false)
    expect(isChallenge(emptyProgress(), island.skills[1]!, 1)).toBe(false)
  })

  it('offers the unmastered prerequisite as the easier step', () => {
    expect(easierStep(emptyProgress(), island, island.skills[2]!)?.id).toBe('hours')
    expect(easierStep(mastered('hours'), island, island.skills[2]!)).toBeUndefined()
  })
})

describe('parent "already knows this"', () => {
  it('marks mastered with no sticker, and undo restores what was played', () => {
    const marked = markKnown(emptyProgress(), 'hours', true)
    expect(marked.skills.hours).toMatchObject({ mastered: true, byParent: true })
    expect(marked.stickers).toEqual([])
    expect(markKnown(marked, 'hours', false).skills.hours?.mastered).toBe(false)
  })

  it('never undoes a mastery the child earned', () => {
    const round = (at: number) => ({ skillId: 'hours', sticker: '🕐', firstTry: ['a', 'b', 'c', 'd', 'e'], missed: [], total: 5, at })
    const earned = applyRound(applyRound(emptyProgress(), round(1)).progress, round(2)).progress
    expect(markKnown(earned, 'hours', false)).toBe(earned)
    expect(markKnown(earned, 'hours', true).skills.hours?.byParent).toBeUndefined()
  })
})
