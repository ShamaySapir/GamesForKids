import { describe, expect, it } from 'vitest'
import { emptyProgress } from '../progress/progress'
import { makeBackup, parseBackup } from './backup'

const noa = { id: 'n1', name: 'נועה', avatar: '🦊', grade: 1 as const, autoSpeak: true }
const good = () => JSON.parse(JSON.stringify(makeBackup([noa], { n1: emptyProgress() }, 1000))) as unknown

describe('backup file', () => {
  it('round-trips through JSON unchanged', () => {
    expect(parseBackup(good())).toEqual(makeBackup([noa], { n1: emptyProgress() }, 1000))
  })

  it('rejects anything that is not a complete backup of this app', () => {
    const bad = (patch: Record<string, unknown>) => parseBackup({ ...(good() as object), ...patch })
    expect(parseBackup(null)).toBeNull()
    expect(parseBackup('{}')).toBeNull()
    expect(bad({ app: 'other' })).toBeNull()
    expect(bad({ version: 2 })).toBeNull()
    expect(bad({ profiles: [] })).toBeNull()
    expect(bad({ profiles: [{ ...noa, grade: 9 }] })).toBeNull()
    expect(bad({ profiles: [noa, noa] })).toBeNull()
    expect(bad({ progress: { n1: { skills: {} } } })).toBeNull()
    expect(bad({ progress: { other: emptyProgress() } })).toBeNull()
  })
})
