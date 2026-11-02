import type { MemoryTheme } from '../types'
import { ref } from './ref'

// Faces within a theme are all different and easy to tell apart at a glance.
export const MEMORY_THEMES: readonly MemoryTheme[] = [
  { id: 'animals', faces: ['🐶', '🐱', '🐰', '🐸', '🐵', '🦁', '🐼', '🐷'] },
  { id: 'fruit', faces: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍐', '🍋'] },
  { id: 'vehicles', faces: ['🚗', '🚌', '🚂', '✈️', '🚲', '⛵', '🚜', '🚑'] },
  { id: 'sea', faces: ['🐟', '🐙', '🐳', '🦀', '🐢', '🐬', '🦈', '⭐'] },
  { id: 'toys', faces: ['🧸', '⚽', '🪁', '🎈', '🎲', '🥁', '🎨', '🚀'] },
  { id: 'nature', faces: ['🌸', '🌳', '☀️', '🌈', '🍄', '🌵', '🌻', '🌙'] },
  { id: 'food', faces: ['🍕', '🍦', '🧁', '🍪', '🍩', '🥕', '🍞', '🧀'] },
  {
    id: 'shapes',
    faces: [
      ref('circle', { color: 'red' }),
      ref('square', { color: 'blue' }),
      ref('triangle', { color: 'green' }),
      ref('star', { color: 'yellow' }),
      ref('heart', { color: 'purple' }),
      ref('circle', { color: 'orange' }),
      ref('square', { color: 'green' }),
      ref('triangle', { color: 'red' }),
    ],
  },
]
