import type { SensibleVolume } from '../types'

// "What is the volume of …?" (G6 p.20: the pool in mL). Question text: sensibleVolume(id) in phrases.ts. Units are
// abbreviations (no nikud): מ״ק, ל׳ (liter), מ״ל, סמ״ק. Written by the planner.

export const SENSIBLE_VOLUMES: readonly SensibleVolume[] = [
  { id: 'pool', right: '500 מ״ק', wrong: ['500 מ״ל', '500 סמ״ק', '5 ל׳'] },
  { id: 'cup', right: '250 מ״ל', wrong: ['250 ל׳', '250 מ״ק', '2 מ״ל'] },
  { id: 'bottle', right: '1.5 ל׳', wrong: ['1.5 מ״ל', '1.5 מ״ק', '150 ל׳'] },
  { id: 'room', right: '40 מ״ק', wrong: ['40 ל׳', '40 מ״ל', '40 סמ״ק'] },
  { id: 'spoon', right: '5 מ״ל', wrong: ['5 ל׳', '5 מ״ק', '500 ל׳'] },
]
