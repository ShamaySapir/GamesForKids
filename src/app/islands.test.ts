import { describe, expect, it } from 'vitest'
import { phrases } from '../core/audio/audio'
import { islandPhrase, islands } from './islands'

describe('island names on the map', () => {
  it('every island has a spoken name, the same text as its title (one shared recording)', () => {
    for (const island of islands) {
      const said = phrases[islandPhrase(island.id)]
      expect(said, island.id).toBeTruthy()
      if (island.id !== 'english') expect(said, island.id).toBe(island.title)
    }
  })
})
