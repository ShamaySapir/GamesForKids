import type { SymmetryItem } from '../types'
import { ref } from './ref'

// Only drawings marked `symmetric` in the catalog; colors vary so the same drawing does not repeat identically.
export const SYMMETRY_ITEMS: readonly SymmetryItem[] = [
  { id: 'butterfly-purple', art: ref('butterfly', { color: 'purple' }) },
  { id: 'butterfly-orange', art: ref('butterfly', { color: 'orange' }) },
  { id: 'ladybug', art: ref('ladybug') },
  { id: 'kite-red', art: ref('kite', { color: 'red' }) },
  { id: 'balloon-blue', art: ref('balloon', { color: 'blue' }) },
  { id: 'teddy', art: ref('teddy') },
  { id: 'cupcake-purple', art: ref('cupcake', { color: 'purple' }) },
  { id: 'icecream-yellow', art: ref('icecream', { color: 'yellow' }) },
  { id: 'lamp-yellow', art: ref('lamp', { color: 'yellow' }) },
  { id: 'flower-red', art: ref('flower', { color: 'red' }) },
  { id: 'flower-purple', art: ref('flower', { color: 'purple' }) },
  { id: 'leaf-green', art: ref('leaf', { color: 'green' }) },
  { id: 'house-orange', art: ref('house', { color: 'orange', missing: 'chimney' }) },
  { id: 'shirt-blue', art: ref('shirt', { color: 'blue', missing: 'pocket' }) },
  { id: 'hat-green', art: ref('hat', { color: 'green' }) },
  { id: 'heart-red', art: ref('heart', { color: 'red' }) },
  { id: 'star-yellow', art: ref('star', { color: 'yellow' }) },
  { id: 'tent-green', art: ref('tent', { color: 'green' }) },
]
