// The art kit contract (planner, T0). T1 draws every entry; T2/T3 may use only these names, parts and props.
//
// Props every drawing accepts (all optional except size, which ArtView passes):
//   size: number          box size in px (the drawing fills a square box)
//   scale: number         0.5–1, drawn smaller inside the same box (odd-one-out by size)
//   color: Color          main fill, only if `colorable`
//   facing: 'left'|'right' only if `facing` (the drawing's natural direction is 'right'; 'left' mirrors it)
//   silhouette: boolean   every shape filled with the shadow color (shadows game)
//   half: 'right'|'left'  only that half is drawn, the other is blank (symmetry game; only if `symmetric`)
//   missing: string       one part left out (what's-missing / twin games; only names from `parts`)
//   only: string          ONLY that part, enlarged and centred in the box (the answer options of the what's-missing game)

export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const
export type Color = (typeof COLORS)[number]

export type ArtKind = 'animal' | 'toy' | 'food' | 'furniture' | 'vehicle' | 'nature' | 'body' | 'building' | 'clothes' | 'shape'

export interface ArtSpec {
  name: string
  kind: ArtKind
  /** Has a clear front and can be mirrored with `facing`. */
  facing?: true
  /** Left and right halves mirror each other (can be used with `half`). */
  symmetric?: true
  colorable?: true
  /** Parts that can be left out with `missing`; each must be clearly visible when present. */
  parts?: readonly string[]
}

export const ART: readonly ArtSpec[] = [
  // animals — side views face right
  { name: 'dog', kind: 'animal', facing: true, parts: ['tail', 'ear', 'eye'] },
  { name: 'cat', kind: 'animal', facing: true, parts: ['tail', 'whiskers', 'ear'] },
  { name: 'fish', kind: 'animal', facing: true, colorable: true, parts: ['tail', 'fin', 'eye'] },
  { name: 'bird', kind: 'animal', facing: true, colorable: true, parts: ['beak', 'wing', 'tail'] },
  { name: 'duck', kind: 'animal', facing: true, parts: ['beak', 'wing'] },
  { name: 'turtle', kind: 'animal', facing: true, parts: ['head', 'shell-pattern'] },
  { name: 'snail', kind: 'animal', facing: true, parts: ['shell', 'antennae'] },
  { name: 'elephant', kind: 'animal', facing: true, parts: ['trunk', 'ear', 'tail'] },
  { name: 'rabbit', kind: 'animal', facing: true, parts: ['ear', 'tail'] },
  { name: 'mouse', kind: 'animal', facing: true, parts: ['tail', 'ear'] },
  { name: 'butterfly', kind: 'animal', symmetric: true, colorable: true, parts: ['spots', 'antennae'] },
  { name: 'ladybug', kind: 'animal', symmetric: true, parts: ['spots', 'antennae'] },
  // toys
  { name: 'ball', kind: 'toy', colorable: true, parts: ['stripe'] },
  { name: 'kite', kind: 'toy', symmetric: true, colorable: true, parts: ['tail', 'bow'] },
  { name: 'balloon', kind: 'toy', symmetric: true, colorable: true, parts: ['string'] },
  { name: 'teddy', kind: 'toy', symmetric: true, parts: ['ear', 'eye', 'nose', 'bow'] },
  { name: 'car', kind: 'vehicle', facing: true, colorable: true, parts: ['wheel', 'window', 'light'] },
  { name: 'train', kind: 'vehicle', facing: true, colorable: true, parts: ['chimney', 'wheel', 'window'] },
  { name: 'bus', kind: 'vehicle', facing: true, colorable: true, parts: ['wheel', 'door', 'window'] },
  { name: 'airplane', kind: 'vehicle', facing: true, colorable: true, parts: ['wing', 'tail', 'window'] },
  { name: 'boat', kind: 'vehicle', facing: true, colorable: true, parts: ['sail', 'flag'] },
  { name: 'bicycle', kind: 'vehicle', facing: true, colorable: true, parts: ['wheel', 'seat', 'pedal'] },
  // food
  { name: 'apple', kind: 'food', colorable: true, parts: ['leaf', 'stem'] },
  { name: 'pear', kind: 'food', parts: ['leaf', 'stem'] },
  { name: 'strawberry', kind: 'food', parts: ['leaves', 'seeds'] },
  { name: 'icecream', kind: 'food', symmetric: true, colorable: true, parts: ['cherry', 'sprinkles'] },
  { name: 'cupcake', kind: 'food', symmetric: true, colorable: true, parts: ['cherry', 'candle'] },
  { name: 'carrot', kind: 'food', parts: ['leaves'] },
  // furniture and objects
  { name: 'chair', kind: 'furniture', facing: true, colorable: true, parts: ['leg', 'back'] },
  { name: 'table', kind: 'furniture', symmetric: true, parts: ['leg'] },
  { name: 'bed', kind: 'furniture', facing: true, parts: ['pillow', 'leg'] },
  { name: 'lamp', kind: 'furniture', symmetric: true, colorable: true, parts: ['shade', 'cord'] },
  { name: 'box', kind: 'furniture', symmetric: true, colorable: true, parts: ['lid'] },
  { name: 'cup', kind: 'furniture', facing: true, colorable: true, parts: ['handle'] },
  // nature
  { name: 'tree', kind: 'nature', symmetric: true, parts: ['apples', 'trunk'] },
  { name: 'flower', kind: 'nature', symmetric: true, colorable: true, parts: ['petal', 'leaf', 'center'] },
  { name: 'sun', kind: 'nature', symmetric: true, parts: ['rays', 'face'] },
  { name: 'cloud', kind: 'nature', parts: ['raindrops'] },
  { name: 'leaf', kind: 'nature', symmetric: true, colorable: true, parts: ['vein', 'stem'] },
  { name: 'seed', kind: 'nature' },
  { name: 'sprout', kind: 'nature', symmetric: true },
  // body, buildings, clothes
  { name: 'face', kind: 'body', symmetric: true, parts: ['eye', 'nose', 'mouth', 'ear', 'hair'] },
  { name: 'house', kind: 'building', symmetric: true, colorable: true, parts: ['door', 'window', 'chimney', 'roof'] },
  { name: 'tent', kind: 'building', symmetric: true, colorable: true, parts: ['flag', 'door'] },
  { name: 'shirt', kind: 'clothes', symmetric: true, colorable: true, parts: ['button', 'pocket', 'sleeve'] },
  { name: 'shoe', kind: 'clothes', facing: true, colorable: true, parts: ['lace', 'sole'] },
  { name: 'hat', kind: 'clothes', symmetric: true, colorable: true, parts: ['ribbon'] },
  { name: 'glasses', kind: 'clothes', symmetric: true, parts: ['lens', 'arm'] },
  // shapes (patterns, sorting by shape/color)
  { name: 'circle', kind: 'shape', symmetric: true, colorable: true },
  { name: 'square', kind: 'shape', symmetric: true, colorable: true },
  { name: 'triangle', kind: 'shape', symmetric: true, colorable: true },
  { name: 'star', kind: 'shape', symmetric: true, colorable: true },
  { name: 'heart', kind: 'shape', symmetric: true, colorable: true },
]

/**
 * Composite drawing for the "where is it?" game: `a` placed relative to `b`, e.g.
 * { name: 'scene', props: { a: 'ball', b: 'table', rel: 'under' } }. `a` and `b` are catalog names.
 */
export const POSITIONS = ['on', 'under', 'in', 'next-to', 'between', 'in-front', 'behind', 'above'] as const
export type Position = (typeof POSITIONS)[number]
export const SCENE = 'scene'

export const artSpec = (name: string) => ART.find(a => a.name === name)
