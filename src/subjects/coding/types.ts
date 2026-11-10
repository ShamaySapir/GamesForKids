import type { PhraseRef, Question } from '../../core/engine/types'

// Shared by content (T1), generators + art (T2) and ProgramGame (T3) — fixed before parallel work starts.
// Spec: docs/specs/coding.md. Pick and order questions reuse PickQ (D14) and the reading island's OrderQ (D11).

/** Absolute moves (Bee-Bot style): K–2 children don't track a facing; turns come in Stage 8b. */
export type Dir = 'up' | 'down' | 'left' | 'right'

/** A program card: one move, or "repeat `times` × body" (body of 1–2 moves). */
export type Card = { kind: 'move'; dir: Dir } | { kind: 'repeat'; times: number; body: readonly Dir[] }
export type Program = readonly Card[]

/** A board in the maze row format: '#' wall, '.' free, 'S' Shufi's start, 'G' the goal (🍎). Rectangular. */
export interface Board { id: string; rows: readonly string[] }

export type Cell = readonly [row: number, col: number]

/* ---------- content (T1) ---------- */

export interface StoryStep { emoji: string; text: string }

/**
 * An everyday algorithm: 3–4 steps with exactly one sensible order.
 * `wrong` replaces steps[wrong.at] with a step that breaks the algorithm (the bug a child spots);
 * `notMissing` are two steps that don't belong, offered with the real missing step.
 */
export interface Story {
  id: string
  /** The question the steps answer, spoken first ("אֵיךְ מְצַחְצְחִים שִׁנַּיִם?"); phrase storyPhrase(id). */
  title: string
  steps: readonly StoryStep[]
  wrong: { at: number; step: StoryStep }
  notMissing: readonly [StoryStep, StoryStep]
}

/** "Where will Shufi get to?": an open 4×4 board (no walls, no goal) and a 2–4 move program that stays on it. */
export interface FollowItem { id: string; board: Board; program: readonly Dir[] }

/**
 * A buggy program with exactly one wrong card. Fixes the child can make in ProgramGame:
 * 'turn' — tap a card to change its direction; 'remove' — an extra card to delete; 'add' — a card missing at the end.
 */
export interface DebugItem { id: string; board: Board; program: Program; bug: 'turn' | 'remove' | 'add' }

/** Programming levels; `maxCards` (repeat skill) is small enough that only a program with a loop fits. */
export interface Level { board: Board; maxCards?: number }

/** "What repeats?": a dance of picture moves (emoji keys of MOVES) repeated `times`. */
export interface MovePattern { id: string; unit: readonly string[]; times: number }

/* ---------- questions for ProgramGame (T2 builds, T3 renders) ---------- */

export type PaletteCard = Dir | 'repeat'

/** Build (or fix) a program that takes Shufi to the goal. The component checks with `run` from program.ts. */
export interface ProgramQ extends Question<null> {
  /** Child-facing instruction phrase ID, shown as text. */
  instruction: string
  hint?: PhraseRef
  board: Board
  palette: readonly PaletteCard[]
  /** Prefilled strip (debug skill). */
  start?: Program
  /** Debug skill: the fix must change exactly one card (turn, remove or add) of `start`. */
  oneEdit?: boolean
  /** Strip capacity in cards; a repeat card counts as one. */
  maxCards?: number
  /** The aid's ghost path: a shortest solution's cells, start included. */
  ghost: readonly Cell[]
}
