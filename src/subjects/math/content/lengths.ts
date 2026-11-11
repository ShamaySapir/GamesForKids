import type { SensibleLength } from '../types'

// "How long is …?" (G4 p.19, G5 p.17: absurd estimates as distractors). The question text is in phrases.ts
// (sensiblePhrase(id)); each item has one sensible length and three that are far off. Written by the planner.

export const SENSIBLE_LENGTHS: readonly SensibleLength[] = [
  { id: 'door', right: [2, 'm'], wrong: [[2, 'cm'], [20, 'm'], [2, 'km']] },
  { id: 'pencil', right: [15, 'cm'], wrong: [[15, 'mm'], [15, 'm'], [15, 'km']] },
  { id: 'ant', right: [5, 'mm'], wrong: [[5, 'cm'], [5, 'm'], [50, 'cm']] },
  { id: 'classroom', right: [8, 'm'], wrong: [[8, 'cm'], [8, 'km'], [80, 'mm']] },
  { id: 'cities', right: [60, 'km'], wrong: [[60, 'm'], [60, 'cm'], [6, 'm']] },
  { id: 'bed', right: [2, 'm'], wrong: [[2, 'mm'], [20, 'cm'], [2, 'km']] },
  { id: 'phone', right: [15, 'cm'], wrong: [[15, 'm'], [15, 'mm'], [1, 'km']] },
  { id: 'pool', right: [25, 'm'], wrong: [[25, 'cm'], [25, 'km'], [25, 'mm']] },
]
