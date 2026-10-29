import { create } from 'zustand'
import { get, set } from 'idb-keyval'
import type { Grade } from '../engine/types'
import { applyRound, emptyProgress, type Progress, type RoundOutcome, type RoundSummary } from '../progress/progress'

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
}

const PROFILES = 'profiles'
const progressKey = (id: string) => `progress:${id}`

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
    if (profiles.length === 1) await getState().selectProfile(profiles[0]!.id)
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
  },

  async recordRound(r) {
    const { current, progress } = getState()
    const outcome = applyRound(progress, r)
    setState({ progress: outcome.progress })
    if (current) await safeSet(progressKey(current.id), outcome.progress)
    return outcome
  },
}))
