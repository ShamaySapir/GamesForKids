import type { Time } from '../time'

/** "The owl's day": daily-routine scenes at whole and half hours (1st–2nd grade level). */
export const DAY: readonly { id: string; icon: string; time: Time }[] = [
  { id: 'wake', icon: '🌅', time: { h: 7, m: 0 } },
  { id: 'breakfast', icon: '🥣', time: { h: 7, m: 30 } },
  { id: 'school', icon: '🏫', time: { h: 8, m: 0 } },
  { id: 'recess', icon: '⚽', time: { h: 10, m: 0 } },
  { id: 'lunch', icon: '🍝', time: { h: 1, m: 0 } },
  { id: 'homework', icon: '📚', time: { h: 4, m: 30 } },
  { id: 'park', icon: '🛝', time: { h: 5, m: 0 } },
  { id: 'bath', icon: '🛁', time: { h: 7, m: 0 } },
  { id: 'sleep', icon: '🌙', time: { h: 8, m: 30 } },
]
