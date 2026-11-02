import type { MagicPair, MinimalPair } from '../types'

const pair = (a: string, b: string, contrast: MinimalPair['contrast']): MinimalPair => ({ id: `${a}-${b}`, a, b, contrast })

export const MINIMAL_PAIRS: readonly MinimalPair[] = [
  pair('bear', 'pear', 'b/p'),
  pair('bin', 'pin', 'b/p'),
  pair('bee', 'pea', 'b/p'),
  pair('bye', 'pie', 'b/p'),
  pair('cab', 'cap', 'b/p'),
  pair('bill', 'pill', 'b/p'),
  pair('beach', 'peach', 'b/p'),
  pair('bad', 'pad', 'b/p'),
  pair('vet', 'wet', 'v/w'),
  pair('vest', 'west', 'v/w'),
  pair('sheep', 'ship', 'ee/i'),
  pair('bean', 'bin', 'ee/i'),
  pair('heel', 'hill', 'ee/i'),
  pair('green', 'grin', 'ee/i'),
  pair('heat', 'hit', 'ee/i'),
  pair('meat', 'mitt', 'ee/i'),
]

// Both sides are picturable; the long word is the short one plus a silent e.
export const MAGIC_PAIRS: readonly MagicPair[] = [
  { short: 'cap', long: 'cape' },
  { short: 'pin', long: 'pine' },
  { short: 'kit', long: 'kite' },
  { short: 'cut', long: 'cute' },
  { short: 'not', long: 'note' },
  { short: 'dim', long: 'dime' },
  { short: 'can', long: 'cane' },
  { short: 'pan', long: 'pane' },
  { short: 'tap', long: 'tape' },
  { short: 'plan', long: 'plane' },
  { short: 'tub', long: 'tube' },
  { short: 'hop', long: 'hope' },
]

export const SIGHT_WORDS: readonly string[] = [
  'the', 'is', 'are', 'I', 'you', 'my', 'and', 'it', 'in', 'on', 'a', 'he', 'she', 'we', 'said', 'was', 'they', 'to', 'of',
  'that', 'have', 'with', 'this', 'like', 'see', 'go', 'look', 'no', 'yes', 'me', 'at',
]
