import type { PhraseMap } from '../../core/engine/types'
import { NUMBER_PHRASES } from './content/numbers'

// T1 (content) adds instructions, things, stories and shop items here; keep spreading NUMBER_PHRASES.
export const phrases: PhraseMap = {
  ...NUMBER_PHRASES,
}
