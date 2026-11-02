import type { ShadowSet } from '../types'
import { ref } from './ref'

const s = (object: string, a: string, b: string): ShadowSet => ({
  id: object,
  object: ref(object),
  decoys: [ref(a), ref(b)],
})

// Decoys are of the same kind with a similar overall outline, but a clearly different silhouette.
export const SHADOW_SETS: readonly ShadowSet[] = [
  s('dog', 'elephant', 'rabbit'),
  s('cat', 'elephant', 'mouse'),
  s('elephant', 'dog', 'turtle'),
  s('rabbit', 'mouse', 'cat'),
  s('fish', 'bird', 'duck'),
  s('duck', 'turtle', 'fish'),
  s('bird', 'butterfly', 'fish'),
  s('turtle', 'snail', 'elephant'),
  s('snail', 'turtle', 'mouse'),
  s('butterfly', 'ladybug', 'bird'),
  s('car', 'bus', 'train'),
  s('bus', 'car', 'boat'),
  s('train', 'boat', 'car'),
  s('airplane', 'boat', 'bicycle'),
  s('boat', 'airplane', 'car'),
  s('bicycle', 'car', 'boat'),
  s('apple', 'pear', 'carrot'),
  s('pear', 'apple', 'carrot'),
  s('strawberry', 'carrot', 'pear'),
  s('icecream', 'cupcake', 'carrot'),
  s('chair', 'table', 'lamp'),
  s('bed', 'chair', 'table'),
  s('house', 'tent', 'tree'),
  s('tree', 'flower', 'cloud'),
  s('shoe', 'hat', 'glasses'),
  s('hat', 'shoe', 'shirt'),
  s('star', 'heart', 'triangle'),
  s('flower', 'sun', 'tree'),
]
