import type { MissingItem } from '../types'
import { ref } from './ref'

const m = (id: string, art: MissingItem['art'], part: string, w1: string, w2: string): MissingItem => ({
  id,
  art,
  part,
  wrong: [w1, w2],
})

// `part` is left out of the drawing; the two wrong choices are other parts that ARE drawn on it.
export const MISSING_ITEMS: readonly MissingItem[] = [
  m('dog-tail', ref('dog'), 'tail', 'ear', 'eye'),
  m('dog-ear', ref('dog'), 'ear', 'tail', 'eye'),
  m('cat-whiskers', ref('cat'), 'whiskers', 'tail', 'ear'),
  m('fish-fin', ref('fish', { color: 'orange' }), 'fin', 'tail', 'eye'),
  m('bird-beak', ref('bird', { color: 'blue' }), 'beak', 'wing', 'tail'),
  m('elephant-trunk', ref('elephant'), 'trunk', 'ear', 'tail'),
  m('car-wheel', ref('car', { color: 'red' }), 'wheel', 'window', 'light'),
  m('bus-door', ref('bus', { color: 'yellow' }), 'door', 'wheel', 'window'),
  m('train-chimney', ref('train', { color: 'green' }), 'chimney', 'wheel', 'window'),
  m('airplane-wing', ref('airplane', { color: 'blue' }), 'wing', 'tail', 'window'),
  m('bicycle-pedal', ref('bicycle', { color: 'red' }), 'pedal', 'wheel', 'seat'),
  m('face-nose', ref('face'), 'nose', 'eye', 'mouth'),
  m('face-mouth', ref('face'), 'mouth', 'eye', 'nose'),
  m('house-chimney', ref('house', { color: 'orange' }), 'chimney', 'door', 'window'),
  m('house-door', ref('house', { color: 'blue' }), 'door', 'window', 'chimney'),
  m('teddy-nose', ref('teddy'), 'nose', 'ear', 'eye'),
  m('shirt-button', ref('shirt', { color: 'green' }), 'button', 'pocket', 'sleeve'),
]
