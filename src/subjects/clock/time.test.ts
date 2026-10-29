import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { phrases } from './phrases'
import { LEVELS, angleOf, dragHour, dragMinute, stepTime, timeKey, timeOptions, timePhrase, timeText } from './time'

const allTimes = Array.from({ length: 12 * 60 }, (_, i) => ({ h: Math.floor(i / 60) + 1, m: i % 60 }))

describe('timePhrase', () => {
  it('uses only declared phrases for every minute of the day', () => {
    for (const t of allTimes) for (const id of timePhrase(t)) expect(phrases[id], `${timeKey(t)} → ${id}`).toBeDefined()
  })

  it('says times the way they are taught', () => {
    expect(timeText({ h: 3, m: 0 })).toBe('שלוש')
    expect(timeText({ h: 3, m: 30 })).toBe('שלוש וחצי')
    expect(timeText({ h: 3, m: 15 })).toBe('שלוש ורבע')
    expect(timeText({ h: 3, m: 45 })).toBe('רבע לארבע')
    expect(timeText({ h: 12, m: 45 })).toBe('רבע לאחת')
    expect(timeText({ h: 3, m: 10 })).toBe('עשר דקות אחרי שלוש')
    expect(timeText({ h: 3, m: 50 })).toBe('עשר דקות לארבע')
    expect(timeText({ h: 3, m: 1 })).toBe('דקה אחרי שלוש')
    expect(timeText({ h: 3, m: 58 })).toBe('שתי דקות לארבע')
    expect(timeText({ h: 3, m: 25 })).toBe('עשרים וחמש דקות אחרי שלוש')
  })
})

describe('timeOptions', () => {
  it('includes the answer once, has no duplicates, and stays within the level', () => {
    for (const [name, level] of Object.entries(LEVELS)) {
      const rng = seeded(name.length)
      for (const t of allTimes.filter(t => level.minutes.includes(t.m))) {
        const opts = timeOptions(rng, t, level)
        const keys = opts.map(timeKey)
        expect(new Set(keys).size, name).toBe(keys.length)
        expect(keys.filter(k => k === timeKey(t))).toHaveLength(1)
        expect(opts.length).toBe(4)
        for (const o of opts) {
          expect(o.h).toBeGreaterThanOrEqual(1)
          expect(o.h).toBeLessThanOrEqual(12)
          expect(level.minutes, `${name} ${timeKey(o)}`).toContain(o.m)
        }
      }
    }
  })
})

describe('hand geometry', () => {
  it('maps pointer positions to clockwise angles from 12', () => {
    expect(angleOf(0, -1)).toBeCloseTo(0)
    expect(angleOf(1, 0)).toBeCloseTo(90)
    expect(angleOf(0, 1)).toBeCloseTo(180)
    expect(angleOf(-1, 0)).toBeCloseTo(270)
  })

  it('snaps the minute hand and rolls the hour past 12', () => {
    expect(dragMinute({ h: 3, m: 0 }, 92, 15)).toEqual({ h: 3, m: 15 })
    expect(dragMinute({ h: 3, m: 50 }, 3, 5)).toEqual({ h: 4, m: 0 })
    expect(dragMinute({ h: 4, m: 5 }, 330, 5)).toEqual({ h: 3, m: 55 })
    expect(dragMinute({ h: 12, m: 55 }, 0, 5)).toEqual({ h: 1, m: 0 })
  })

  it('picks the nearest hour for the hour hand', () => {
    expect(dragHour({ h: 12, m: 0 }, 91)).toEqual({ h: 3, m: 0 })
    expect(dragHour({ h: 12, m: 30 }, 105)).toEqual({ h: 3, m: 30 })
    expect(dragHour({ h: 5, m: 0 }, 2)).toEqual({ h: 12, m: 0 })
  })

  it('steps with the keyboard across hour boundaries', () => {
    expect(stepTime({ h: 12, m: 55 }, 'minute', 1, 5)).toEqual({ h: 1, m: 0 })
    expect(stepTime({ h: 1, m: 0 }, 'minute', -1, 5)).toEqual({ h: 12, m: 55 })
    expect(stepTime({ h: 12, m: 0 }, 'hour', 1, 5)).toEqual({ h: 1, m: 0 })
    expect(stepTime({ h: 1, m: 0 }, 'hour', -1, 5)).toEqual({ h: 12, m: 0 })
  })
})
