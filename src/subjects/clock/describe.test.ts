import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { island } from './index'

const FORBIDDEN = /[֑-ׇA-Za-z]/

describe('clock describeItem', () => {
  it('has a home tip without nikud', () => {
    expect(island.homeTip).toBeTruthy()
    expect(island.homeTip).not.toMatch(/[֑-ׇ]/)
  })

  for (const skill of island.skills) {
    it(`${skill.id}: every generated key has a clean, unique label`, () => {
      expect(skill.describeItem).toBeDefined()
      const byLabel = new Map<string, string>()
      for (const game of skill.games) {
        for (let seed = 1; seed <= 300; seed++) {
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

  it('labels read naturally', () => {
    const d = island.skills[0]!.describeItem!
    expect(d('3:30')).toBe('שלוש וחצי (3:30)')
    expect(d('3:45')).toBe('רבע לארבע (3:45)')
    expect(d('12:05')).toBe('חמש דקות אחרי שתים עשרה (12:05)')
    expect(d('day.wake')).toBe('סדר היום: השכמה')
    expect(d('nonsense')).toBeUndefined()
  })
})
