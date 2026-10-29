import type { IslandDef, SkillDef } from '../core/engine/types'

// Islands register themselves by existing: src/subjects/<id>/index.ts exporting `island` (docs/DECISIONS.md D8).
const modules = import.meta.glob('/src/subjects/*/index.ts', { eager: true, import: 'island' }) as Record<string, IslandDef>

export const islands: readonly IslandDef[] = Object.values(modules).sort((a, b) => a.order - b.order)

export const findIsland = (id: string | undefined) => islands.find(i => i.id === id)

export const findSkill = (island: IslandDef | undefined, id: string | undefined): SkillDef | undefined =>
  island?.skills.find(s => s.id === id)
