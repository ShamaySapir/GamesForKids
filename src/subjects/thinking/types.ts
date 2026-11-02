import type { PhraseRef, Question } from '../../core/engine/types'
import type { ArtRef } from '../../ui/pick/types'
import type { Position } from './art/catalog'

// Shared by art (T1), content (T2), generators (T3) and games (T4) — fixed before parallel work starts.
// Spec: docs/specs/thinking.md. Pick questions use the shared PickQ with `art` options/prompts (D14, D15).

/* ---------- content (T2) ---------- */

/** 1. Odd one out: three of `base`, one `odd`, differing in exactly the property `by`. */
export interface OddSet { id: string; by: 'facing' | 'color' | 'size' | 'shape' | 'kind'; base: ArtRef; odd: ArtRef }

/** 2. Identical twin: `sample`, and three decoys that differ from it by one small detail (a part or a color). */
export interface TwinSet { id: string; sample: ArtRef; decoys: readonly [ArtRef, ArtRef, ArtRef] }

/** 3. Shadows: an object and decoy objects whose silhouettes look similar but not the same. */
export interface ShadowSet { id: string; object: ArtRef; decoys: readonly [ArtRef, ArtRef] }

/** 4. Pattern: `unit` repeats (repeat) or each step adds one more of `unit[0]` (grow). */
export interface PatternDef { id: string; kind: 'repeat' | 'grow'; unit: readonly ArtRef[] }

/** 5. Where is it: `a` relative to `b`; phrase wherePhrase(id) asks it ("אֵיפֹה הַכַּדּוּר? מִתַּחַת לַשֻּׁלְחָן"). */
export interface WhereScene { id: string; a: string; b: string; rel: Position }

/** 6. Memory: card faces (drawings or emoji), at least 6 per theme. */
export interface MemoryTheme { id: string; faces: readonly (ArtRef | string)[] }

/** 7. Symmetry: a symmetric catalog drawing (with optional color) to split into halves. */
export interface SymmetryItem { id: string; art: ArtRef }

/** 8. Sequence: steps in order (emoji or short text); phrase sequencePhrase(id, n) says each step. */
export interface SequenceSet { id: string; steps: readonly string[] }

/** 9. Sorting: two baskets (emoji label + phrase) and cards (emoji) with their basket. */
export interface SortBoard { id: string; bins: readonly [string, string]; cards: readonly { emoji: string; bin: 0 | 1 }[] }

/** 10. What's missing: a drawing with one part left out, and two wrong parts of the same drawing. */
export interface MissingItem { id: string; art: ArtRef; part: string; wrong: readonly [string, string] }

/** 11. Differences: drawings placed on a 0–100 grid; `changes` alter the right-hand copy. */
export interface DiffScene {
  id: string
  items: readonly { art: ArtRef; x: number; y: number }[]
  /** Index into items and what changes on the right: removed, recolored, mirrored. */
  changes: readonly { index: number; change: 'remove' | { color: string } | 'mirror' }[]
}

/** 12. Maze rows: '#' wall, '.' path, 'S' start, 'G' goal. Rectangular, solvable. */
export interface MazeDef { id: string; rows: readonly string[]; hero: string; goal: string }

/* ---------- questions for the new components (T3 builds, T4 renders) ---------- */

interface ThinkQ<A> extends Question<A> {
  /** Child-facing instruction phrase ID, shown as text. */
  instruction: string
  hint?: PhraseRef
}

/** Flip two cards; pairs share `face`. Wrong pairs are not misses (that is how memory works). */
export interface MemoryQ extends ThinkQ<null> {
  cards: readonly { id: string; face: ArtRef | string }[]
}

/** Complete a symmetric picture on a grid: left half given, tap the cells of the right half. Answer: cells to fill. */
export interface SymGridQ extends ThinkQ<readonly (readonly [number, number])[]> {
  rows: number
  cols: number
  /** Filled cells in the left half (cols 0 … cols/2 − 1). */
  given: readonly (readonly [number, number])[]
  color: string
}

/** Two copies of a scene; tap each difference in the right copy. Answer: item indexes that changed. */
export interface DiffQ extends ThinkQ<readonly number[]> {
  left: DiffScene['items']
  right: readonly ({ art: ArtRef; x: number; y: number } | null)[]
}

/** Lead the hero through the maze to the goal. */
export interface MazeQ extends ThinkQ<null> {
  maze: MazeDef
}
