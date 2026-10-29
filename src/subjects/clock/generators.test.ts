import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import { phrases } from './phrases'
import { dayQuestion, handQuestion, matchQuestion, readQuestion, setQuestion } from './generators'
import { LEVELS, hourAngle, minuteAngle, sameTime, timeKey } from './time'

const ctx = (seed: number, avoid: string[] = [], review?: string) => ({ rng: seeded(seed), avoid: new Set(avoid), review })

describe('clock generators', () => {
  it('read: the answer is among the options and within the level', () => {
    for (let seed = 1; seed < 200; seed++) {
      const q = readQuestion(ctx(seed), LEVELS.quarter)
      expect(q.options.some(o => sameTime(o, q.answer))).toBe(true)
      expect(LEVELS.quarter.minutes).toContain(q.answer.m)
      expect(q.itemKey).toBe(timeKey(q.answer))
    }
  })

  it('read: asks a due review item when it fits the level', () => {
    expect(readQuestion(ctx(1, [], '7:30'), LEVELS.half).itemKey).toBe('7:30')
    expect(readQuestion(ctx(1, [], '7:20'), LEVELS.half).itemKey).not.toBe('7:20')
  })

  it('set: never starts on the answer, and speaks only declared phrases', () => {
    for (let seed = 1; seed < 200; seed++) {
      const q = setQuestion(ctx(seed), LEVELS.hours)
      expect(sameTime(q.start, q.answer)).toBe(false)
      // Hands must not overlap at the start, or the hour hand can't be grabbed.
      const gap = Math.abs(hourAngle(q.start) - minuteAngle(q.start)) % 360
      expect(Math.min(gap, 360 - gap)).toBeGreaterThanOrEqual(45)
      for (const id of q.say) expect(phrases[id]).toBeDefined()
    }
  })

  it('day: scenes have phrases and avoid repeats', () => {
    const q = dayQuestion(ctx(3), LEVELS.half)
    expect(phrases[q.scene!.phrase]).toBeDefined()
    expect(sameTime(q.start, q.answer)).toBe(false)
    const again = dayQuestion(ctx(3, [q.itemKey]), LEVELS.half)
    expect(again.itemKey).not.toBe(q.itemKey)
  })

  it('hand: asks for one of the two hands', () => {
    const q = handQuestion(ctx(5))
    expect(['hour', 'minute']).toContain(q.answer)
    expect(phrases[q.say as string]).toBeDefined()
  })

  it('match: four distinct times', () => {
    for (let seed = 1; seed < 50; seed++) {
      const q = matchQuestion(ctx(seed), LEVELS.five)
      expect(new Set(q.times.map(timeKey)).size).toBe(4)
    }
  })
})
