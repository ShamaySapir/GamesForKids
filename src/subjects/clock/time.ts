import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import { phrases } from './phrases'

/** h: 1–12, m: 0–59. */
export interface Time {
  h: number
  m: number
}

export interface Level {
  /** Minute values this level asks about. */
  minutes: readonly number[]
  /** Minute-hand snapping while dragging. */
  snap: number
}

const range = (step: number) => Array.from({ length: 60 / step }, (_, i) => i * step)

export const LEVELS = {
  hours: { minutes: [0], snap: 15 },
  half: { minutes: [0, 30], snap: 15 },
  quarter: { minutes: [0, 15, 30, 45], snap: 15 },
  five: { minutes: range(5), snap: 5 },
  minute: { minutes: range(1), snap: 1 },
} satisfies Record<string, Level>

export const timeKey = ({ h, m }: Time) => `${h}:${String(m).padStart(2, '0')}`
export const sameTime = (a: Time, b: Time) => a.h % 12 === b.h % 12 && a.m === b.m

export function parseKey(key: string): Time | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(key)
  if (!match) return null
  const t = { h: Number(match[1]), m: Number(match[2]) }
  return t.h >= 1 && t.h <= 12 && t.m < 60 ? t : null
}

const nextHour = (h: number) => (h % 12) + 1
export const normHour = (h: number) => ((((h - 1) % 12) + 12) % 12) + 1

/** Phrase IDs that say the time the way it is taught: "שלוש וחצי", "רבע לארבע", "עשר דקות אחרי שלוש". */
export function timePhrase({ h, m }: Time): string[] {
  if (m === 0) return [`clock.h.${h}`]
  if (m === 15) return [`clock.h.${h}`, 'clock.quarter']
  if (m === 30) return [`clock.h.${h}`, 'clock.half']
  if (m === 45) return ['clock.quarterTo', `clock.to.${nextHour(h)}`]
  if (m < 30) return [`clock.min.${m}`, 'clock.past', `clock.h.${h}`]
  return [`clock.min.${60 - m}`, `clock.to.${nextHour(h)}`]
}

export const timeText = (t: Time) => timePhrase(t).map(id => phrases[id]).join(' ')

export const randomTime = (rng: Rng, level: Level): Time => ({ h: randInt(rng, 1, 12), m: pick(rng, level.minutes) })

/**
 * The correct time plus `count - 1` distractors that target typical mistakes:
 * right hour/wrong minutes, right minutes/wrong hour, and hands swapped.
 */
export function timeOptions(rng: Rng, answer: Time, level: Level, count = 4): Time[] {
  const seen = new Set([timeKey(answer)])
  const out: Time[] = []
  const add = (t: Time) => {
    if (out.length < count - 1 && !seen.has(timeKey(t))) {
      seen.add(timeKey(t))
      out.push(t)
    }
  }
  const swapped = { h: answer.m === 0 ? 12 : Math.round(answer.m / 5) || 12, m: (answer.h % 12) * 5 }
  if (level.minutes.includes(swapped.m) && swapped.h >= 1) add(swapped)
  for (const m of shuffle(rng, level.minutes).slice(0, 2)) add({ h: answer.h, m })
  add({ h: nextHour(answer.h), m: answer.m })
  for (let i = 0; out.length < count - 1 && i < 50; i++) add(randomTime(rng, level))
  return shuffle(rng, [answer, ...out])
}

/* ---------- geometry ---------- */

export const minuteAngle = (t: Time) => t.m * 6
export const hourAngle = (t: Time) => (t.h % 12) * 30 + t.m * 0.5

/** Clockwise angle in degrees from 12 o'clock for a point relative to the clock center. */
export const angleOf = (dx: number, dy: number) => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360

/** Dragging the minute hand: snap, and roll the hour when passing 12 like a real clock. */
export function dragMinute(t: Time, angle: number, snap: number): Time {
  const m = (Math.round(angle / 6 / snap) * snap) % 60
  let h = t.h
  if (t.m >= 45 && m < 15) h = nextHour(h)
  else if (t.m < 15 && m >= 45) h = normHour(h - 1)
  return { h, m }
}

/** Dragging the hour hand: pick the hour whose position (given the current minutes) is closest. */
export function dragHour(t: Time, angle: number): Time {
  return { h: normHour(Math.round((angle - t.m * 0.5) / 30)), m: t.m }
}

/** Keyboard step for one hand. */
export function stepTime(t: Time, hand: 'hour' | 'minute', dir: 1 | -1, snap: number): Time {
  if (hand === 'hour') return { h: normHour(t.h + dir), m: t.m }
  const total = t.m + dir * snap
  if (total >= 60) return { h: nextHour(t.h), m: total - 60 }
  if (total < 0) return { h: normHour(t.h - 1), m: total + 60 }
  return { h: t.h, m: total }
}
