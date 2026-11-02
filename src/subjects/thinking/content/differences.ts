import type { DiffScene } from '../types'
import { ref } from './ref'

// Items sit on a staggered lattice of 10 slots on the 0–100 grid (centers ≥ 25 apart horizontally, ≥ 17 vertically
// between neighbours), so drawings of ~20 units never overlap. Colored items always carry an explicit color and
// mirrored items an explicit facing, so a change is always visible.
const A1 = { x: 12, y: 14 }
const A2 = { x: 12, y: 48 }
const A3 = { x: 12, y: 82 }
const B1 = { x: 37, y: 30 }
const B2 = { x: 37, y: 65 }
const C1 = { x: 63, y: 14 }
const C2 = { x: 63, y: 48 }
const C3 = { x: 63, y: 82 }
const D1 = { x: 88, y: 30 }
const D2 = { x: 88, y: 65 }

export const DIFF_SCENES: readonly DiffScene[] = [
  {
    id: 'garden',
    items: [
      { art: ref('sun'), ...A1 },
      { art: ref('tree'), ...A2 },
      { art: ref('flower', { color: 'red' }), ...A3 },
      { art: ref('bird', { color: 'blue', facing: 'right' }), ...B1 },
      { art: ref('butterfly', { color: 'purple' }), ...B2 },
      { art: ref('cloud'), ...C1 },
      { art: ref('house', { color: 'orange' }), ...C2 },
      { art: ref('ladybug'), ...C3 },
      { art: ref('kite', { color: 'red' }), ...D1 },
    ],
    changes: [
      { index: 0, change: 'remove' },
      { index: 2, change: { color: 'yellow' } },
      { index: 3, change: 'mirror' },
      { index: 6, change: { color: 'green' } },
    ],
  },
  {
    id: 'toys',
    items: [
      { art: ref('ball', { color: 'red' }), ...A1 },
      { art: ref('teddy'), ...A2 },
      { art: ref('car', { color: 'blue', facing: 'right' }), ...A3 },
      { art: ref('kite', { color: 'yellow' }), ...B1 },
      { art: ref('balloon', { color: 'green' }), ...B2 },
      { art: ref('train', { color: 'red', facing: 'right' }), ...C1 },
      { art: ref('box', { color: 'orange' }), ...C2 },
      { art: ref('bicycle', { color: 'yellow', facing: 'left' }), ...C3 },
      { art: ref('cupcake', { color: 'purple' }), ...D1 },
    ],
    changes: [
      { index: 0, change: { color: 'blue' } },
      { index: 1, change: 'remove' },
      { index: 2, change: 'mirror' },
      { index: 4, change: { color: 'purple' } },
      { index: 7, change: { color: 'green' } },
    ],
  },
  {
    id: 'street',
    items: [
      { art: ref('house', { color: 'red' }), ...A1 },
      { art: ref('tree'), ...A2 },
      { art: ref('car', { color: 'yellow', facing: 'right' }), ...A3 },
      { art: ref('bus', { color: 'green', facing: 'left' }), ...B1 },
      { art: ref('bicycle', { color: 'blue', facing: 'right' }), ...B2 },
      { art: ref('tent', { color: 'green' }), ...C1 },
      { art: ref('dog', { facing: 'right' }), ...C2 },
      { art: ref('cloud'), ...C3 },
      { art: ref('bird', { color: 'red', facing: 'left' }), ...D1 },
    ],
    changes: [
      { index: 1, change: 'remove' },
      { index: 2, change: 'mirror' },
      { index: 3, change: { color: 'orange' } },
      { index: 6, change: 'mirror' },
      { index: 8, change: 'remove' },
    ],
  },
  {
    id: 'pets',
    items: [
      { art: ref('dog', { facing: 'right' }), ...A1 },
      { art: ref('cat', { facing: 'left' }), ...A2 },
      { art: ref('rabbit', { facing: 'right' }), ...A3 },
      { art: ref('duck', { facing: 'left' }), ...B1 },
      { art: ref('fish', { color: 'blue', facing: 'right' }), ...B2 },
      { art: ref('turtle', { facing: 'right' }), ...C1 },
      { art: ref('mouse', { facing: 'left' }), ...C2 },
      { art: ref('bird', { color: 'yellow', facing: 'right' }), ...C3 },
    ],
    changes: [
      { index: 0, change: 'mirror' },
      { index: 2, change: 'remove' },
      { index: 4, change: { color: 'orange' } },
      { index: 5, change: 'mirror' },
    ],
  },
  {
    id: 'sea',
    items: [
      { art: ref('sun'), ...A1 },
      { art: ref('boat', { color: 'red', facing: 'right' }), ...A2 },
      { art: ref('fish', { color: 'orange', facing: 'left' }), ...B1 },
      { art: ref('fish', { color: 'blue', facing: 'right' }), ...B2 },
      { art: ref('bird', { color: 'green', facing: 'left' }), ...C1 },
      { art: ref('turtle', { facing: 'right' }), ...C2 },
      { art: ref('cloud'), ...D1 },
    ],
    changes: [
      { index: 0, change: 'remove' },
      { index: 1, change: { color: 'yellow' } },
      { index: 2, change: 'mirror' },
      { index: 5, change: 'remove' },
    ],
  },
  {
    id: 'fruit-stand',
    items: [
      { art: ref('apple', { color: 'red' }), ...A1 },
      { art: ref('pear'), ...A2 },
      { art: ref('strawberry'), ...A3 },
      { art: ref('carrot'), ...B1 },
      { art: ref('cup', { color: 'blue', facing: 'right' }), ...B2 },
      { art: ref('icecream', { color: 'yellow' }), ...C1 },
      { art: ref('cupcake', { color: 'purple' }), ...C2 },
      { art: ref('chair', { color: 'green', facing: 'right' }), ...C3 },
    ],
    changes: [
      { index: 0, change: { color: 'green' } },
      { index: 2, change: 'remove' },
      { index: 4, change: { color: 'yellow' } },
      { index: 5, change: 'remove' },
      { index: 7, change: 'mirror' },
    ],
  },
  {
    id: 'sky',
    items: [
      { art: ref('airplane', { color: 'blue', facing: 'right' }), ...A1 },
      { art: ref('bird', { color: 'red', facing: 'right' }), ...A2 },
      { art: ref('kite', { color: 'red' }), ...A3 },
      { art: ref('balloon', { color: 'yellow' }), ...B1 },
      { art: ref('cloud'), ...B2 },
      { art: ref('sun'), ...C1 },
      { art: ref('butterfly', { color: 'orange' }), ...C2 },
      { art: ref('tree'), ...C3 },
      { art: ref('flower', { color: 'purple' }), ...D2 },
    ],
    changes: [
      { index: 0, change: 'mirror' },
      { index: 1, change: { color: 'green' } },
      { index: 3, change: 'remove' },
      { index: 6, change: { color: 'blue' } },
    ],
  },
  {
    id: 'clothes',
    items: [
      { art: ref('shirt', { color: 'blue' }), ...A1 },
      { art: ref('hat', { color: 'red' }), ...A2 },
      { art: ref('shoe', { color: 'green', facing: 'right' }), ...A3 },
      { art: ref('glasses'), ...B1 },
      { art: ref('ball', { color: 'orange' }), ...B2 },
      { art: ref('shirt', { color: 'yellow' }), ...C1 },
      { art: ref('lamp', { color: 'yellow' }), ...C2 },
      { art: ref('teddy'), ...C3 },
      { art: ref('shoe', { color: 'blue', facing: 'left' }), ...D2 },
    ],
    changes: [
      { index: 0, change: { color: 'red' } },
      { index: 1, change: 'remove' },
      { index: 2, change: 'mirror' },
      { index: 6, change: { color: 'blue' } },
      { index: 8, change: { color: 'orange' } },
    ],
  },
]
