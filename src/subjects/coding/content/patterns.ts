import type { MovePattern } from '../types'

/** Dance moves: picture (emoji) → its phrase key (see movePhrase) and spoken name. */
export const MOVES: Readonly<Record<string, string>> = {
  '👏': 'clap',
  '🦶': 'stomp',
  '🙆': 'up',
  '💫': 'spin',
  '🦘': 'jump',
  '👋': 'wave',
}

export const MOVE_NAMES: Readonly<Record<string, string>> = {
  clap: 'מוֹחֲאִים כַּף',
  stomp: 'רוֹקְעִים בָּרֶגֶל',
  up: 'מְרִימִים יָדַיִם',
  spin: 'מִסְתּוֹבְבִים',
  jump: 'קוֹפְצִים',
  wave: 'מְנַפְנְפִים לְשָׁלוֹם',
}

// A unit of 2–3 moves repeated 2–4 times. No unit is itself a repetition (not 👏👏).
export const PATTERNS: readonly MovePattern[] = [
  { id: 'p1', unit: ['👏', '🦶'], times: 3 },
  { id: 'p2', unit: ['🦘', '💫'], times: 3 },
  { id: 'p3', unit: ['🙆', '👏'], times: 4 },
  { id: 'p4', unit: ['👋', '🦶'], times: 3 },
  { id: 'p5', unit: ['👏', '👏', '🦶'], times: 3 },
  { id: 'p6', unit: ['🦘', '🦘', '💫'], times: 3 },
  { id: 'p7', unit: ['🙆', '👋', '👏'], times: 2 },
  { id: 'p8', unit: ['💫', '👏', '🦶'], times: 3 },
  { id: 'p9', unit: ['🦶', '👏', '👏'], times: 2 },
  { id: 'p10', unit: ['🦘', '🙆'], times: 4 },
  { id: 'p11', unit: ['👋', '👋', '🙆'], times: 3 },
  { id: 'p12', unit: ['👏', '💫'], times: 2 },
]
