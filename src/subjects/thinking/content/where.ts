import type { WhereScene } from '../types'
import type { Position } from '../art/catalog'

const w = (rel: Position, a: string, b: string): WhereScene => ({ id: `${rel}-${a}-${b}`, a, b, rel })

// `a` is a small thing or animal, `b` a reference object (table, chair, box, bed, tree, house, tent).
// Each position has six different scenes; for 'between' the scene shows two copies of `b`.
export const WHERE_SCENES: readonly WhereScene[] = [
  w('on', 'ball', 'table'),
  w('on', 'cat', 'chair'),
  w('on', 'teddy', 'table'),
  w('on', 'cup', 'table'),
  w('on', 'apple', 'box'),
  w('on', 'bird', 'house'),

  w('under', 'ball', 'chair'),
  w('under', 'cat', 'table'),
  w('under', 'dog', 'table'),
  w('under', 'shoe', 'bed'),
  w('under', 'mouse', 'table'),
  w('under', 'rabbit', 'chair'),

  w('in', 'ball', 'box'),
  w('in', 'teddy', 'box'),
  w('in', 'cat', 'box'),
  w('in', 'mouse', 'box'),
  w('in', 'dog', 'tent'),
  w('in', 'rabbit', 'tent'),

  w('next-to', 'dog', 'house'),
  w('next-to', 'cat', 'tree'),
  w('next-to', 'ball', 'chair'),
  w('next-to', 'rabbit', 'box'),
  w('next-to', 'duck', 'tent'),
  w('next-to', 'teddy', 'table'),

  w('between', 'ball', 'chair'),
  w('between', 'cat', 'tree'),
  w('between', 'dog', 'house'),
  w('between', 'rabbit', 'tent'),
  w('between', 'mouse', 'box'),
  w('between', 'teddy', 'bed'),

  w('in-front', 'dog', 'house'),
  w('in-front', 'cat', 'tent'),
  w('in-front', 'ball', 'tree'),
  w('in-front', 'car', 'house'),
  w('in-front', 'rabbit', 'box'),
  w('in-front', 'teddy', 'chair'),

  w('behind', 'dog', 'house'),
  w('behind', 'cat', 'tree'),
  w('behind', 'ball', 'box'),
  w('behind', 'rabbit', 'tent'),
  w('behind', 'mouse', 'house'),
  w('behind', 'duck', 'box'),

  w('above', 'bird', 'tree'),
  w('above', 'kite', 'house'),
  w('above', 'balloon', 'tent'),
  w('above', 'balloon', 'chair'),
  w('above', 'ball', 'box'),
  w('above', 'butterfly', 'table'),
]
