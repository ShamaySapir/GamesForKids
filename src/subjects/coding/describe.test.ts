import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { island } from './index'

const NIKUD = /[֑-ׇ]/
const LATIN = /[A-Za-z]/

/** Every item key each skill's games produce, asking up to 40 questions per seed so the whole pool is visited. */
function keysBySkill(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  for (const skill of island.skills) {
    const keys = new Set<string>()
    for (const game of skill.games) {
      for (let seed = 1; seed <= 25; seed++) {
        const rng = seeded(seed)
        const avoid = new Set<string>()
        for (let i = 0; i < 40; i++) {
          const q = game.generate({ rng, avoid })
          keys.add(q.itemKey)
          avoid.add(q.itemKey)
        }
      }
    }
    out.set(skill.id, keys)
  }
  return out
}

describe('coding describeItem', () => {
  const keys = keysBySkill()
  const undescribed = new Set<string>()

  it('describes every skill except the undescribed ones', () => {
    for (const skill of island.skills) expect(Boolean(skill.describeItem), skill.id).toBe(!undescribed.has(skill.id))
  })

  it('gives every generated key a plain label: no nikud, no Latin letters', () => {
    for (const skill of island.skills) {
      for (const key of keys.get(skill.id)!) {
        const label = skill.describeItem?.(key)
        if (undescribed.has(skill.id)) continue
        expect(label, `${skill.id} ${key}`).toBeTruthy()
        expect(label).not.toMatch(NIKUD)
        expect(label).not.toMatch(LATIN)
      }
    }
  })

  it('never gives two keys of a skill the same label', () => {
    for (const skill of island.skills) {
      if (undescribed.has(skill.id)) continue
      const seen = new Map<string, string>()
      for (const key of keys.get(skill.id)!) {
        const label = skill.describeItem!(key)!
        expect(seen.get(label), `${skill.id}: "${label}" for ${key}`).toBeUndefined()
        seen.set(label, key)
      }
    }
  })

  it('has labels in the expected shape', () => {
    const skill = (id: string) => island.skills.find(s => s.id === id)!
    expect(skill('code.steps').describeItem!('teeth')).toBe('צחצוח שיניים')
    expect(skill('code.bug-steps').describeItem!('bug:teeth')).toBe('צחצוח שיניים: שלב שגוי')
    expect(skill('code.arrows').describeItem!('program:l4')).toBe('לוח 4')
    expect(skill('code.patterns').describeItem!('loop:p3')).toBe('דפוס 3')
  })

  it('has a plain home-practice sentence', () => {
    expect(island.homeTip).toBeTruthy()
    expect(island.homeTip).not.toMatch(NIKUD)
    expect(island.homeTip).not.toMatch(LATIN)
  })
})
