import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { gateNumber, numberWords } from './gate'

describe('parents gate', () => {
  it('writes numbers the way they are said', () => {
    expect(numberWords(38)).toBe('שלושים ושמונה')
    expect(numberWords(21)).toBe('עשרים ואחת')
    expect(numberWords(50)).toBe('חמישים')
    expect(numberWords(92)).toBe('תשעים ושתיים')
  })

  it('draws two-digit numbers only, each with distinct words', () => {
    const rng = seeded(4)
    for (let i = 0; i < 500; i++) {
      const n = gateNumber(rng)
      expect(n).toBeGreaterThanOrEqual(21)
      expect(n).toBeLessThanOrEqual(99)
    }
    const words = Array.from({ length: 79 }, (_, i) => numberWords(21 + i))
    expect(new Set(words).size).toBe(79)
  })
})
