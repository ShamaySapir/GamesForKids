import { describe, expect, it } from 'vitest'
import { BOX_DELAYS, dueItems, nextAid, starsFor } from '../adaptive/adaptive'
import { applyRound, emptyProgress, isUnlocked, skillLeitner } from './progress'

const round = (firstTry: string[], missed: string[], at = 1000) =>
  ({ skillId: 'clock.hours', sticker: '🕐', firstTry, missed, total: firstTry.length + missed.length, at })

describe('adaptive', () => {
  it('awards 1–3 stars by first-try accuracy', () => {
    expect(starsFor(5, 6)).toBe(3)
    expect(starsFor(4, 6)).toBe(2)
    expect(starsFor(0, 6)).toBe(1)
  })

  it('turns the aid on after two misses and off after a streak of five', () => {
    expect(nextAid(false, 2, 0)).toBe(true)
    expect(nextAid(true, 0, 4)).toBe(true)
    expect(nextAid(true, 0, 5)).toBe(false)
  })
})

describe('applyRound', () => {
  it('masters a skill after two rounds at ≥80% and grants its sticker once', () => {
    const good = round(['1:00', '2:00', '3:00', '4:00', '5:00'], ['6:00'])
    const first = applyRound(emptyProgress(), good)
    expect(first.newlyMastered).toBe(false)
    const second = applyRound(first.progress, { ...good, at: 2000 })
    expect(second.newlyMastered).toBe(true)
    expect(second.progress.stickers).toEqual(['🕐'])
    const third = applyRound(second.progress, { ...good, at: 3000 })
    expect(third.newlyMastered).toBe(false)
    expect(third.progress.stickers).toEqual(['🕐'])
    expect(isUnlocked(third.progress, ['clock.hours'])).toBe(true)
  })

  it('sends missed items back to box 0 and promotes first-try items', () => {
    const { progress } = applyRound(emptyProgress(), round(['1:00'], ['6:00'], 0))
    const l = skillLeitner(progress, 'clock.hours')
    expect(l['6:00']).toEqual({ box: 0, due: 0 })
    expect(l['1:00']).toEqual({ box: 1, due: BOX_DELAYS[1] })
    expect(dueItems(l, 0, () => true)).toEqual(['6:00'])
  })
})
