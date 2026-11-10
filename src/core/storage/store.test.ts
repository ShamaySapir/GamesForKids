import { beforeEach, describe, expect, it, vi } from 'vitest'

// An in-memory stand-in for IndexedDB, so the store's actions can be tested without a browser.
const db = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: async (k: string) => structuredClone(db.get(k)),
  set: async (k: string, v: unknown) => { db.set(k, structuredClone(v)) },
  del: async (k: string) => { db.delete(k) },
}))

const { useStore } = await import('./store')
const { parseBackup } = await import('./backup')

const child = (name: string) => ({ name, avatar: '🦊', grade: 1 as const, autoSpeak: true })
const round = { skillId: 'clock.hours', sticker: '🕐', firstTry: ['3:00'], missed: ['4:30'], total: 2, at: 5 }

beforeEach(() => {
  db.clear()
  useStore.setState({ loaded: false, profiles: [], current: null })
})

describe('store actions for the parents page', () => {
  it('updates a profile, also when it is the current one', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const id = useStore.getState().current!.id
    await useStore.getState().updateProfile(id, { autoSpeak: false, grade: 2 })
    expect(useStore.getState().current).toMatchObject({ autoSpeak: false, grade: 2, id })
    expect(db.get('profiles')).toEqual([expect.objectContaining({ autoSpeak: false, grade: 2 })])
  })

  it('deletes a child with its progress, and resets progress', async () => {
    await useStore.getState().createProfile(child('נועה'))
    const noa = useStore.getState().current!.id
    await useStore.getState().recordRound(round)
    await useStore.getState().createProfile(child('כרמל'))
    const carmel = useStore.getState().current!.id
    await useStore.getState().recordRound(round)
    await useStore.getState().resetProgress(carmel)
    expect(useStore.getState().progress.totalStars).toBe(0)
    await useStore.getState().deleteProfile(noa)
    expect(db.has(`progress:${noa}`)).toBe(false)
    expect(useStore.getState().profiles.map(p => p.name)).toEqual(['כרמל'])
  })

  it('remembers the last child across a reload when there are several', async () => {
    await useStore.getState().createProfile(child('נועה'))
    await useStore.getState().createProfile(child('כרמל'))
    useStore.setState({ loaded: false, profiles: [], current: null })
    await useStore.getState().load()
    expect(useStore.getState().current?.name).toBe('כרמל')
  })

  it('exports everything and restores it after a child was deleted', async () => {
    await useStore.getState().createProfile(child('נועה'))
    await useStore.getState().recordRound(round)
    const id = useStore.getState().current!.id
    const backup = parseBackup(JSON.parse(JSON.stringify(await useStore.getState().exportAll())))!
    expect(backup.progress[id]!.totalStars).toBeGreaterThan(0)
    await useStore.getState().deleteProfile(id)
    await useStore.getState().importAll(backup)
    expect(useStore.getState().profiles.map(p => p.name)).toEqual(['נועה'])
    expect(useStore.getState().current?.id).toBe(id)
    expect(useStore.getState().progress.totalStars).toBe(backup.progress[id]!.totalStars)
  })
})
