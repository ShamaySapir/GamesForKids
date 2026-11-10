import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { island } from './index'

const NIKUD = /[֑-ׇ]/


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

describe('english describeItem', () => {
  const keys = keysBySkill()
  const undescribed = new Set<string>()

  it('describes every skill except the undescribed ones', () => {
    for (const skill of island.skills) expect(Boolean(skill.describeItem), skill.id).toBe(!undescribed.has(skill.id))
  })

  it('gives every generated key a plain label: no nikud', () => {
    for (const skill of island.skills) {
      for (const key of keys.get(skill.id)!) {
        const label = skill.describeItem?.(key)
        if (undescribed.has(skill.id)) continue
        expect(label, `${skill.id} ${key}`).toBeTruthy()
        expect(label).not.toMatch(NIKUD)
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
    expect(skill('eng.cvc').describeItem!('cat')).toBe('המילה cat')
    expect(skill('eng.letters').describeItem!('b')).toBe('האות Bb')
    expect(skill('eng.magic-e').describeItem!('cap')).toBe('המילה cap (מול cape)')
  })

  it('has a plain home-practice sentence', () => {
    expect(island.homeTip).toBeTruthy()
    expect(island.homeTip).not.toMatch(NIKUD)
    expect(island.homeTip).not.toMatch(/[A-Za-z]/)
  })
})
