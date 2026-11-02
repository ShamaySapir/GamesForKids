import type { ArtRef } from '../../../ui/pick/types'

/** Short constructor for an art reference: ref('ball', { color: 'red' }). */
export const ref = (name: string, props?: Record<string, string | number | boolean>): ArtRef =>
  props ? { name, props } : { name }
