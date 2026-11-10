import { GRADE_NAMES, type Grade } from '../engine/types'
import type { Progress } from '../progress/progress'
import type { Profile } from './store'

// The backup file a parent saves and restores (docs/specs/parents.md, DECISIONS D18). Pure: the store reads and
// writes storage; this only builds and validates the file, so a malformed file can never reach storage.

export interface Backup {
  app: 'lomdim-vemsachakim'
  version: 1
  savedAt: number
  profiles: Profile[]
  progress: Record<string, Progress>
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isGrade = (v: unknown): v is Grade => typeof v === 'number' && Number.isInteger(v) && v >= -1 && v < GRADE_NAMES.length - 1

function isProfile(v: unknown): v is Profile {
  return isObj(v) && typeof v.id === 'string' && v.id.length > 0 && typeof v.name === 'string' && typeof v.avatar === 'string'
    && isGrade(v.grade) && typeof v.autoSpeak === 'boolean'
}

function isProgress(v: unknown): v is Progress {
  if (!isObj(v) || !isObj(v.skills) || !isObj(v.leitner) || !Array.isArray(v.stickers) || typeof v.totalStars !== 'number') return false
  const skillsOk = Object.values(v.skills).every(s => isObj(s) && Array.isArray(s.rounds) && typeof s.mastered === 'boolean' && typeof s.bestStars === 'number'
    && s.rounds.every(r => isObj(r) && typeof r.at === 'number' && typeof r.firstTry === 'number' && typeof r.total === 'number'))
  const leitnerOk = Object.values(v.leitner).every(e => isObj(e) && typeof e.box === 'number' && typeof e.due === 'number')
  const recordsOk = v.records === undefined || (isObj(v.records) && Object.values(v.records).every(n => typeof n === 'number'))
  return skillsOk && leitnerOk && recordsOk && v.stickers.every(s => typeof s === 'string')
}

export const makeBackup = (profiles: Profile[], progress: Record<string, Progress>, savedAt: number): Backup =>
  ({ app: 'lomdim-vemsachakim', version: 1, savedAt, profiles, progress })

/** The backup in a file's parsed JSON, or null when it is not a complete, valid backup of this app. */
export function parseBackup(data: unknown): Backup | null {
  if (!isObj(data) || data.app !== 'lomdim-vemsachakim' || data.version !== 1 || typeof data.savedAt !== 'number') return null
  const { profiles, progress } = data
  if (!Array.isArray(profiles) || profiles.length === 0 || !profiles.every(isProfile)) return null
  const ids = new Set(profiles.map(p => p.id))
  if (ids.size !== profiles.length) return null
  if (!isObj(progress) || !Object.values(progress).every(isProgress) || !Object.keys(progress).every(id => ids.has(id))) return null
  return { app: 'lomdim-vemsachakim', version: 1, savedAt: data.savedAt, profiles, progress: progress as Record<string, Progress> }
}
