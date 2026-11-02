import type { PatternDef } from '../types'
import { ref } from './ref'

const circle = (color: string) => ref('circle', { color })
const square = (color: string) => ref('square', { color })
const triangle = (color: string) => ref('triangle', { color })
const star = (color: string) => ref('star', { color })
const heart = (color: string) => ref('heart', { color })

// Ids start with the pattern's letters: ab / aab / abb / abc (unit repeats), grow (unit[0] 1, 2, 3 times).
// Every unit's elements are visually distinct (different drawing or color).
export const PATTERNS: readonly PatternDef[] = [
  // AB
  { id: 'ab-circles', kind: 'repeat', unit: [circle('red'), circle('blue')] },
  { id: 'ab-fruit', kind: 'repeat', unit: [ref('apple', { color: 'red' }), ref('pear')] },
  { id: 'ab-star-heart', kind: 'repeat', unit: [star('yellow'), heart('red')] },
  { id: 'ab-pets', kind: 'repeat', unit: [ref('cat'), ref('dog')] },
  { id: 'ab-sky', kind: 'repeat', unit: [ref('sun'), ref('cloud')] },
  { id: 'ab-shapes', kind: 'repeat', unit: [triangle('green'), square('orange')] },
  { id: 'ab-garden', kind: 'repeat', unit: [ref('flower', { color: 'red' }), ref('leaf', { color: 'green' })] },

  // AAB
  { id: 'aab-red-red-square', kind: 'repeat', unit: [circle('red'), circle('red'), square('blue')] },
  { id: 'aab-fruit', kind: 'repeat', unit: [ref('apple', { color: 'green' }), ref('apple', { color: 'green' }), ref('pear')] },
  { id: 'aab-stars', kind: 'repeat', unit: [star('yellow'), star('yellow'), heart('red')] },
  { id: 'aab-pets', kind: 'repeat', unit: [ref('dog'), ref('dog'), ref('cat')] },
  { id: 'aab-toys', kind: 'repeat', unit: [ref('balloon', { color: 'red' }), ref('balloon', { color: 'red' }), ref('kite', { color: 'yellow' })] },
  { id: 'aab-triangles', kind: 'repeat', unit: [triangle('green'), triangle('green'), circle('purple')] },
  { id: 'aab-sky', kind: 'repeat', unit: [ref('sun'), ref('sun'), ref('cloud')] },

  // ABB
  { id: 'abb-square-circles', kind: 'repeat', unit: [square('blue'), circle('red'), circle('red')] },
  { id: 'abb-fruit', kind: 'repeat', unit: [ref('pear'), ref('apple', { color: 'red' }), ref('apple', { color: 'red' })] },
  { id: 'abb-stars', kind: 'repeat', unit: [heart('red'), star('yellow'), star('yellow')] },
  { id: 'abb-pets', kind: 'repeat', unit: [ref('cat'), ref('dog'), ref('dog')] },
  { id: 'abb-toys', kind: 'repeat', unit: [ref('kite', { color: 'yellow' }), ref('balloon', { color: 'red' }), ref('balloon', { color: 'red' })] },
  { id: 'abb-triangles', kind: 'repeat', unit: [circle('purple'), triangle('orange'), triangle('orange')] },
  { id: 'abb-sky', kind: 'repeat', unit: [ref('cloud'), ref('sun'), ref('sun')] },

  // ABC
  { id: 'abc-shapes', kind: 'repeat', unit: [circle('red'), square('blue'), triangle('green')] },
  { id: 'abc-fruit', kind: 'repeat', unit: [ref('apple', { color: 'red' }), ref('pear'), ref('strawberry')] },
  { id: 'abc-stars', kind: 'repeat', unit: [star('yellow'), heart('red'), circle('blue')] },
  { id: 'abc-animals', kind: 'repeat', unit: [ref('dog'), ref('cat'), ref('rabbit')] },
  { id: 'abc-sky', kind: 'repeat', unit: [ref('sun'), ref('cloud'), ref('flower', { color: 'red' })] },
  { id: 'abc-vehicles', kind: 'repeat', unit: [ref('car', { color: 'red' }), ref('bus', { color: 'yellow' }), ref('train', { color: 'blue' })] },
  { id: 'abc-toys', kind: 'repeat', unit: [ref('ball', { color: 'blue' }), ref('kite', { color: 'yellow' }), ref('balloon', { color: 'red' })] },

  // growing: one, two, three, ...
  { id: 'grow-circle', kind: 'grow', unit: [circle('red')] },
  { id: 'grow-star', kind: 'grow', unit: [star('yellow')] },
  { id: 'grow-apple', kind: 'grow', unit: [ref('apple', { color: 'red' })] },
  { id: 'grow-ball', kind: 'grow', unit: [ref('ball', { color: 'blue' })] },
  { id: 'grow-heart', kind: 'grow', unit: [heart('purple')] },
  { id: 'grow-flower', kind: 'grow', unit: [ref('flower', { color: 'orange' })] },
  { id: 'grow-fish', kind: 'grow', unit: [ref('fish', { color: 'blue' })] },
]
