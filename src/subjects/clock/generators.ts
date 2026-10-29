import { pick, shuffle } from '../../core/engine/random'
import type { GenContext, Question } from '../../core/engine/types'
import type { Hand } from './Clock'
import { DAY } from './content/day'
import { parseKey, randomTime, sameTime, timeKey, timeOptions, timePhrase, type Level, type Time } from './time'

// Pure question generators, one per mini-game. Tested in generators.test.ts.

export interface ReadQ extends Question<Time> { options: Time[]; level: Level }
export interface SetQ extends Question<Time> { start: Time; level: Level; hourOnly: boolean; scene?: { icon: string; phrase: string } }
export interface HandQ extends Question<Hand> { time: Time }
export interface MatchQ extends Question<null> { times: Time[] }

/** Use the review item if it belongs to this level, else a fresh time not asked yet. */
function pickTime(ctx: GenContext, level: Level): Time {
  const review = ctx.review ? parseKey(ctx.review) : null
  if (review && level.minutes.includes(review.m)) return review
  let t = randomTime(ctx.rng, level)
  for (let i = 0; ctx.avoid.has(timeKey(t)) && i < 30; i++) t = randomTime(ctx.rng, level)
  return t
}

export const accepts = (level: Level) => (key: string) => {
  const t = parseKey(key)
  return !!t && level.minutes.includes(t.m)
}

/**
 * Where the hands start in "set" games: away from the answer, and with the hands far apart —
 * at 12:00 they overlap and the hour hand can't be grabbed.
 */
export const startFor = (answer: Time): Time => (sameTime(answer, { h: 9, m: 0 }) ? { h: 3, m: 0 } : { h: 9, m: 0 })

export function readQuestion(ctx: GenContext, level: Level): ReadQ {
  const answer = pickTime(ctx, level)
  return { itemKey: timeKey(answer), answer, options: timeOptions(ctx.rng, answer, level), level, say: 'clock.q.read' }
}

export function setQuestion(ctx: GenContext, level: Level, hourOnly = false): SetQ {
  const answer = pickTime(ctx, level)
  return { itemKey: timeKey(answer), answer, start: startFor(answer), level, hourOnly, say: ['clock.q.set', ...timePhrase(answer)] }
}

export function dayQuestion(ctx: GenContext, level: Level): SetQ {
  const fresh = DAY.filter(d => !ctx.avoid.has(`day.${d.id}`))
  const scene = pick(ctx.rng, fresh.length ? fresh : DAY)
  const answer = scene.time
  return {
    itemKey: `day.${scene.id}`, answer, start: startFor(answer), level, hourOnly: false,
    scene: { icon: scene.icon, phrase: `clock.day.${scene.id}` }, say: `clock.day.${scene.id}`,
  }
}

export function handQuestion(ctx: GenContext): HandQ {
  const hand: Hand = ctx.rng() < 0.5 ? 'hour' : 'minute'
  // Keep the hands far apart so they're easy to tell apart.
  const time = { h: pick(ctx.rng, [2, 3, 4, 8, 9, 10]), m: pick(ctx.rng, [30, 35, 40]) }
  return { itemKey: `${hand}@${timeKey(time)}`, answer: hand, time, say: `clock.q.hand.${hand}` }
}

export function matchQuestion(ctx: GenContext, level: Level, size = 4): MatchQ {
  const times: Time[] = []
  const keys = new Set<string>()
  for (let i = 0; times.length < size && i < 100; i++) {
    const t = randomTime(ctx.rng, level)
    if (!keys.has(timeKey(t))) {
      keys.add(timeKey(t))
      times.push(t)
    }
  }
  const sorted = shuffle(ctx.rng, times)
  return { itemKey: sorted.map(timeKey).sort().join('|'), answer: null, times: sorted, say: 'clock.q.match' }
}
