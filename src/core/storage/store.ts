import { create } from 'zustand'
import { del, get, set } from 'idb-keyval'
import type { Grade } from '../engine/types'
import { applyRound, emptyProgress, markKnown, type Progress, type RoundOutcome, type RoundSummary } from '../progress/progress'
import { makeBackup, type Backup } from './backup'

// The only module that touches persistent storage (docs/DECISIONS.md D2: local only).

export interface Profile {
  id: string
  name: string
  avatar: string
  grade: Grade
  /** Speak each instruction automatically (for pre-readers). */
  autoSpeak: boolean
}

interface State {
  loaded: boolean
  profiles: Profile[]
  current: Profile | null
  progress: Progress
  load: () => Promise<void>
  createProfile: (p: Omit<Profile, 'id'>) => Promise<void>
  selectProfile: (id: string | null) => Promise<void>
  recordRound: (r: RoundSummary) => Promise<RoundOutcome>
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  resetProgress: (id: string) => Promise<void>
  /** A parent's "already knows this" for one child's skill, or undoing it (D19). */
  markKnown: (childId: string, skillId: string, known: boolean) => Promise<void>
  /** Every profile and its progress, for the parent's backup file. */
  exportAll: () => Promise<Backup>
  /** Replaces all profiles and progress with a validated backup (see parseBackup). */
  importAll: (b: Backup) => Promise<void>
}

const PROFILES = 'profiles'
const progressKey = (id: string) => `progress:${id}`
/** The child who played last, so a reload with several profiles doesn't go back to the picker. */
const LAST = 'lastProfile'

async function safeGet<T>(key: string): Promise<T | undefined> {
  try { return await get<T>(key) } catch { return undefined }
}
async function safeSet(key: string, value: unknown) {
  try { await set(key, value) } catch { /* storage unavailable (private mode): play without saving */ }
}

export const useStore = create<State>((setState, getState) => ({
  loaded: false,
  profiles: [],
  current: null,
  progress: emptyProgress(),

  async load() {
    const profiles = (await safeGet<Profile[]>(PROFILES)) ?? []
    setState({ profiles })
    // Select before marking loaded, or routes redirect to the profile picker on reload.
    const last = await safeGet<string>(LAST)
    const pick = profiles.length === 1 ? profiles[0]!.id : profiles.find(p => p.id === last)?.id
    if (pick) await getState().selectProfile(pick)
    setState({ loaded: true })
  },

  async createProfile(p) {
    const profile: Profile = { ...p, id: crypto.randomUUID() }
    const profiles = [...getState().profiles, profile]
    setState({ profiles })
    await safeSet(PROFILES, profiles)
    await getState().selectProfile(profile.id)
  },

  async selectProfile(id) {
    const current = getState().profiles.find(p => p.id === id) ?? null
    const progress = current ? ((await safeGet<Progress>(progressKey(current.id))) ?? emptyProgress()) : emptyProgress()
    setState({ current, progress })
    if (current) await safeSet(LAST, current.id)
  },

  async recordRound(r) {
    const { current, progress } = getState()
    const outcome = applyRound(progress, r)
    setState({ progress: outcome.progress })
    if (current) await safeSet(progressKey(current.id), outcome.progress)
    return outcome
  },

  async updateProfile(id, patch) {
    const profiles = getState().profiles.map(p => (p.id === id ? { ...p, ...patch, id } : p))
    const current = getState().current
    setState({ profiles, current: current?.id === id ? profiles.find(p => p.id === id)! : current })
    await safeSet(PROFILES, profiles)
  },

  async deleteProfile(id) {
    const profiles = getState().profiles.filter(p => p.id !== id)
    setState({ profiles })
    await safeSet(PROFILES, profiles)
    try { await del(progressKey(id)) } catch { /* storage unavailable */ }
    if (getState().current?.id === id) {
      setState({ current: null, progress: emptyProgress() })
      try { await del(LAST) } catch { /* storage unavailable */ }
    }
  },

  async resetProgress(id) {
    await safeSet(progressKey(id), emptyProgress())
    if (getState().current?.id === id) setState({ progress: emptyProgress() })
  },

  async markKnown(childId, skillId, known) {
    const isCurrent = getState().current?.id === childId
    const before = isCurrent ? getState().progress : ((await safeGet<Progress>(progressKey(childId))) ?? emptyProgress())
    const after = markKnown(before, skillId, known)
    if (isCurrent) setState({ progress: after })
    await safeSet(progressKey(childId), after)
  },

  async exportAll() {
    const { profiles } = getState()
    const progress: Record<string, Progress> = {}
    for (const p of profiles) progress[p.id] = (await safeGet<Progress>(progressKey(p.id))) ?? emptyProgress()
    return makeBackup(profiles, progress, Date.now())
  },

  async importAll(b) {
    for (const p of getState().profiles) if (!b.profiles.some(x => x.id === p.id)) {
      try { await del(progressKey(p.id)) } catch { /* storage unavailable */ }
    }
    for (const p of b.profiles) await safeSet(progressKey(p.id), b.progress[p.id] ?? emptyProgress())
    setState({ profiles: b.profiles })
    await safeSet(PROFILES, b.profiles)
    const keep = b.profiles.find(p => p.id === getState().current?.id)
    await getState().selectProfile(keep?.id ?? (b.profiles.length === 1 ? b.profiles[0]!.id : null))
  },
}))
