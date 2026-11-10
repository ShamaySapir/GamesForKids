import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { island } from './index'

const FORBIDDEN = /[֑-ׇA-Za-z]/

describe('math describeItem', () => {
  it('has a home tip without nikud', () => {
    expect(island.homeTip).toBeTruthy()
    expect(island.homeTip).not.toMatch(/[֑-ׇ]/)
  })

  for (const skill of island.skills) {
    it(`${skill.id}: every generated key has a clean, unique label`, () => {
      expect(skill.describeItem).toBeDefined()
      const byLabel = new Map<string, string>()
      for (const game of skill.games) {
        for (let seed = 1; seed <= 150; seed++) {
          const q = game.generate({ rng: seeded(seed), avoid: new Set() })
          const label = skill.describeItem!(q.itemKey)
          expect(label, q.itemKey).toBeTruthy()
          expect(label, q.itemKey).not.toMatch(FORBIDDEN)
          const other = byLabel.get(label!)
          expect(other === undefined || other === q.itemKey, `${label}: ${other} vs ${q.itemKey}`).toBe(true)
          byLabel.set(label!, q.itemKey)
        }
      }
    })
  }

  it('returns undefined for unknown keys', () => {
    expect(island.skills[0]!.describeItem!('nonsense')).toBeUndefined()
  })
})
