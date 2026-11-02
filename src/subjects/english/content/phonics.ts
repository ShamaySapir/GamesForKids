import type { MagicPair, MinimalPair } from '../types'

const pair = (a: string, b: string, contrast: MinimalPair['contrast']): MinimalPair => ({ id: `${a}-${b}`, a, b, contrast })

export const MINIMAL_PAIRS: readonly MinimalPair[] = [
  pair('bear', 'pear', 'b/p'),
  pair('bin', 'pin', 'b/p'),
  pair('bye', 'pie', 'b/p'),
  pair('cab', 'cap', 'b/p'),
  pair('bill', 'pill', 'b/p'),
  pair('beach', 'peach', 'b/p'),
  pair('bad', 'pad', 'b/p'),
  pair('vest', 'west', 'v/w'),
  pair('veil', 'whale', 'v/w'),
  pair('sheep', 'ship', 'ee/i'),
  pair('bean', 'bin', 'ee/i'),
  pair('heel', 'hill', 'ee/i'),
  pair('green', 'grin', 'ee/i'),
  pair('meat', 'mitt', 'ee/i'),
]

// Written words only (the which-word game is heard and read); the long word is the short one plus a silent e.
export const MAGIC_PAIRS: readonly MagicPair[] = [
  { short: 'cap', long: 'cape' },
  { short: 'kit', long: 'kite' },
  { short: 'hop', long: 'hope' },
  { short: 'tap', long: 'tape' },
  { short: 'tub', long: 'tube' },
  { short: 'pin', long: 'pine' },
  { short: 'can', long: 'cane' },
  { short: 'not', long: 'note' },
  { short: 'cut', long: 'cute' },
  { short: 'dim', long: 'dime' },
  { short: 'plan', long: 'plane' },
  { short: 'mad', long: 'made' },
]

export const SIGHT_WORDS: readonly string[] = [
  'the', 'is', 'are', 'I', 'you', 'my', 'and', 'it', 'in', 'on', 'a', 'he', 'she', 'we', 'said', 'was', 'they', 'to', 'of',
  'that', 'have', 'with', 'this', 'like', 'see', 'go', 'look', 'no', 'yes', 'me', 'at', 'can',
]
