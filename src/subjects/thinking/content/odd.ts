import type { OddSet } from '../types'
import { ref } from './ref'

// Exactly one property differs in each set (`by`); everything else is identical.
// Size sets: the odd drawing is drawn at 0.6 of the base (the base has no scale = full size).
export const ODD_SETS: readonly OddSet[] = [
  // direction: the same drawing mirrored
  { id: 'facing-dog', by: 'facing', base: ref('dog', { facing: 'left' }), odd: ref('dog', { facing: 'right' }) },
  { id: 'facing-cat', by: 'facing', base: ref('cat', { facing: 'right' }), odd: ref('cat', { facing: 'left' }) },
  { id: 'facing-duck', by: 'facing', base: ref('duck', { facing: 'left' }), odd: ref('duck', { facing: 'right' }) },
  { id: 'facing-turtle', by: 'facing', base: ref('turtle', { facing: 'right' }), odd: ref('turtle', { facing: 'left' }) },
  { id: 'facing-elephant', by: 'facing', base: ref('elephant', { facing: 'left' }), odd: ref('elephant', { facing: 'right' }) },
  { id: 'facing-rabbit', by: 'facing', base: ref('rabbit', { facing: 'right' }), odd: ref('rabbit', { facing: 'left' }) },
  { id: 'facing-car', by: 'facing', base: ref('car', { facing: 'left', color: 'red' }), odd: ref('car', { facing: 'right', color: 'red' }) },
  { id: 'facing-airplane', by: 'facing', base: ref('airplane', { facing: 'right', color: 'blue' }), odd: ref('airplane', { facing: 'left', color: 'blue' }) },

  // color: the same drawing in another color
  { id: 'color-ball', by: 'color', base: ref('ball', { color: 'red' }), odd: ref('ball', { color: 'blue' }) },
  { id: 'color-apple', by: 'color', base: ref('apple', { color: 'green' }), odd: ref('apple', { color: 'red' }) },
  { id: 'color-balloon', by: 'color', base: ref('balloon', { color: 'yellow' }), odd: ref('balloon', { color: 'purple' }) },
  { id: 'color-kite', by: 'color', base: ref('kite', { color: 'blue' }), odd: ref('kite', { color: 'orange' }) },
  { id: 'color-flower', by: 'color', base: ref('flower', { color: 'purple' }), odd: ref('flower', { color: 'yellow' }) },
  { id: 'color-house', by: 'color', base: ref('house', { color: 'orange' }), odd: ref('house', { color: 'blue' }) },
  { id: 'color-shirt', by: 'color', base: ref('shirt', { color: 'green' }), odd: ref('shirt', { color: 'purple' }) },
  { id: 'color-hat', by: 'color', base: ref('hat', { color: 'red' }), odd: ref('hat', { color: 'green' }) },

  // size: the odd one is smaller
  { id: 'size-dog', by: 'size', base: ref('dog'), odd: ref('dog', { scale: 0.6 }) },
  { id: 'size-house', by: 'size', base: ref('house', { color: 'red' }), odd: ref('house', { color: 'red', scale: 0.6 }) },
  { id: 'size-tree', by: 'size', base: ref('tree'), odd: ref('tree', { scale: 0.6 }) },
  { id: 'size-ball', by: 'size', base: ref('ball', { color: 'blue' }), odd: ref('ball', { color: 'blue', scale: 0.6 }) },
  { id: 'size-teddy', by: 'size', base: ref('teddy'), odd: ref('teddy', { scale: 0.6 }) },
  { id: 'size-flower', by: 'size', base: ref('flower', { color: 'red' }), odd: ref('flower', { color: 'red', scale: 0.6 }) },
  { id: 'size-cup', by: 'size', base: ref('cup', { color: 'green' }), odd: ref('cup', { color: 'green', scale: 0.6 }) },
  { id: 'size-balloon', by: 'size', base: ref('balloon', { color: 'orange' }), odd: ref('balloon', { color: 'orange', scale: 0.6 }) },

  // shape: another shape, same color
  { id: 'shape-circle-square', by: 'shape', base: ref('circle', { color: 'red' }), odd: ref('square', { color: 'red' }) },
  { id: 'shape-square-triangle', by: 'shape', base: ref('square', { color: 'blue' }), odd: ref('triangle', { color: 'blue' }) },
  { id: 'shape-triangle-circle', by: 'shape', base: ref('triangle', { color: 'green' }), odd: ref('circle', { color: 'green' }) },
  { id: 'shape-star-heart', by: 'shape', base: ref('star', { color: 'yellow' }), odd: ref('heart', { color: 'yellow' }) },
  { id: 'shape-heart-square', by: 'shape', base: ref('heart', { color: 'purple' }), odd: ref('square', { color: 'purple' }) },
  { id: 'shape-circle-star', by: 'shape', base: ref('circle', { color: 'orange' }), odd: ref('star', { color: 'orange' }) },
  { id: 'shape-square-heart', by: 'shape', base: ref('square', { color: 'green' }), odd: ref('heart', { color: 'green' }) },
  { id: 'shape-triangle-star', by: 'shape', base: ref('triangle', { color: 'red' }), odd: ref('star', { color: 'red' }) },

  // kind: three of one thing and one of another kind
  { id: 'kind-dog-car', by: 'kind', base: ref('dog'), odd: ref('car') },
  { id: 'kind-rabbit-chair', by: 'kind', base: ref('rabbit'), odd: ref('chair') },
  { id: 'kind-apple-shoe', by: 'kind', base: ref('apple'), odd: ref('shoe') },
  { id: 'kind-carrot-cat', by: 'kind', base: ref('carrot'), odd: ref('cat') },
  { id: 'kind-tree-bus', by: 'kind', base: ref('tree'), odd: ref('bus') },
  { id: 'kind-ball-pear', by: 'kind', base: ref('ball'), odd: ref('pear') },
  { id: 'kind-hat-elephant', by: 'kind', base: ref('hat'), odd: ref('elephant') },
  { id: 'kind-train-flower', by: 'kind', base: ref('train'), odd: ref('flower') },
]
