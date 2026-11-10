import { describe, expect, it } from 'vitest'
import type { IslandDef, SkillDef } from '../engine/types'
import { emptyProgress, type Progress } from './progress'
import { practiceItems, skillStatus, summary } from './report'

const DAY = 24 * 60 * 60 * 1000
const skill = (id: string, requires: string[] = []): SkillDef => ({ id, title: id, grade: 1, requires, sticker: '⭐', games: [] })
const island: IslandDef = { id: 'i', order: 1, title: 'i', icon: 'i', color: '--c', phrases: {}, skills: [skill('a'), skill('b', ['a']), skill('c')] }

const progress = (): Progress => ({
  ...emptyProgress(),
  totalStars: 7,
  stickers: ['⭐'],
  skills: {
    a: { rounds: [{ at: 10 * DAY, firstTry: 6, total: 6 }, { at: 11 * DAY, firstTry: 5, total: 6 }], mastered: true, bestStars: 3 },
    c: { rounds: [{ at: 2 * DAY, firstTry: 6, total: 6 }, { at: 3 * DAY, firstTry: 2, total: 6 }], mastered: false, bestStars: 3 },
  },
  leitner: {
    'c|x': { box: 0, due: 3 * DAY }, 'c|y': { box: 0, due: 5 * DAY }, 'c|z': { box: 2, due: 9 * DAY }, 'a|q': { box: 0, due: 1 },
  },
})

describe('parents report', () => {
  it('names each skill state, counting good rounds toward mastery', () => {
    const p = progress()
    expect(skillStatus(p, island.skills[0]!)).toMatchObject({ state: 'mastered', good: 2, lastPlayed: 11 * DAY })
    expect(skillStatus(p, island.skills[1]!).state).toBe('new')
    expect(skillStatus(p, island.skills[2]!)).toMatchObject({ state: 'practising', good: 1, bestStars: 3 })
    expect(skillStatus(emptyProgress(), island.skills[1]!).state).toBe('locked')
  })

  it('lists only items missed last time (box 0), most items first, most recent first', () => {
    const groups = practiceItems(progress(), [island])
    expect(groups.map(g => [g.skill.id, g.items])).toEqual([['c', ['y', 'x']], ['a', ['q']]])
  })

  it('summarises stars, stickers, mastery and rounds in the last 7 days', () => {
    expect(summary(progress(), [island], 12 * DAY)).toEqual({ stars: 7, stickers: 1, mastered: 1, skills: 3, lastPlayed: 11 * DAY, roundsThisWeek: 2 })
  })
})
