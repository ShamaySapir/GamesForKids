import type { Board, Card, Cell, Dir, Program } from './types'

// The single source of truth for what a program does (docs/specs/coding.md): ProgramGame runs it, generators
// check answers and build ghost paths with it, and content tests prove every board is solvable.

export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right']
const STEP: Readonly<Record<Dir, Cell>> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
export const ARROW: Readonly<Record<Dir, string>> = { up: '↑', down: '↓', left: '←', right: '→' }

export function find(board: Board, ch: 'S' | 'G'): Cell | undefined {
  for (let r = 0; r < board.rows.length; r++) {
    const c = board.rows[r]!.indexOf(ch)
    if (c >= 0) return [r, c]
  }
  return undefined
}

const open = (board: Board, [r, c]: Cell) => r >= 0 && r < board.rows.length && c >= 0 && c < (board.rows[r]?.length ?? 0) && board.rows[r]![c] !== '#'
const move = ([r, c]: Cell, d: Dir): Cell => [r + STEP[d][0], c + STEP[d][1]]
export const sameCell = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1]

/** Every single move a program makes, with the index of the card it comes from (repeat cards expand). */
export function expand(program: Program): { dir: Dir; card: number }[] {
  return program.flatMap((c, card) => c.kind === 'move'
    ? [{ dir: c.dir, card }]
    : Array.from({ length: c.times }, () => c.body.map(dir => ({ dir, card }))).flat())
}

export interface RunResult {
  /** Cells visited, start first; a blocked move adds nothing. */
  path: readonly Cell[]
  end: Cell
  /** Index of the card whose move hit a wall or the edge; the run stops there. */
  stoppedAt?: number
  reachedGoal: boolean
}

/** Runs a program from 'S'. Bumping a wall or the edge stops the run (it is not an error to show, only a stop). */
export function run(board: Board, program: Program): RunResult {
  const start = find(board, 'S') ?? [0, 0]
  const goal = find(board, 'G')
  const path: Cell[] = [start]
  let at = start
  for (const { dir, card } of expand(program)) {
    const next = move(at, dir)
    if (!open(board, next)) return { path, end: at, stoppedAt: card, reachedGoal: false }
    at = next
    path.push(at)
  }
  return { path, end: at, reachedGoal: !!goal && sameCell(at, goal) }
}

/** A shortest list of moves from 'S' to 'G' (breadth-first), or undefined when the goal can't be reached. */
export function shortest(board: Board): Dir[] | undefined {
  const start = find(board, 'S')
  const goal = find(board, 'G')
  if (!start || !goal) return undefined
  const key = (c: Cell) => `${c[0]},${c[1]}`
  const prev = new Map<string, { from: Cell; dir: Dir } | null>([[key(start), null]])
  const queue: Cell[] = [start]
  while (queue.length) {
    const at = queue.shift()!
    if (sameCell(at, goal)) {
      const dirs: Dir[] = []
      for (let p = prev.get(key(at)); p; p = prev.get(key(p.from))) dirs.unshift(p.dir)
      return dirs
    }
    for (const d of DIRS) {
      const next = move(at, d)
      if (open(board, next) && !prev.has(key(next))) {
        prev.set(key(next), { from: at, dir: d })
        queue.push(next)
      }
    }
  }
  return undefined
}

/** Plain move cards for a list of directions. */
export const moves = (dirs: readonly Dir[]): Card[] => dirs.map(dir => ({ kind: 'move', dir }))

/**
 * The fewest cards that make these moves, using "repeat" for runs (→→→→ becomes repeat 4 × [→]).
 * Used to set the repeat skill's card limit and its hint.
 */
export function compress(dirs: readonly Dir[]): Card[] {
  const out: Card[] = []
  for (let i = 0; i < dirs.length;) {
    let j = i
    while (j < dirs.length && dirs[j] === dirs[i]) j++
    const n = j - i
    out.push(n >= 2 ? { kind: 'repeat', times: n, body: [dirs[i]!] } : { kind: 'move', dir: dirs[i]! })
    i = j
  }
  return out
}

/** Programs differ by exactly one card: one changed, one removed, or one added. */
export function oneEditApart(a: Program, b: Program): boolean {
  const same = (x: Card, y: Card) => JSON.stringify(x) === JSON.stringify(y)
  if (a.length === b.length) return a.filter((c, i) => !same(c, b[i]!)).length === 1
  const [long, short] = a.length > b.length ? [a, b] : [b, a]
  if (long.length !== short.length + 1) return false
  for (let i = 0; i < long.length; i++) if ([...long.slice(0, i), ...long.slice(i + 1)].every((c, k) => same(c, short[k]!))) return true
  return false
}

/** Short text form for item keys and art props: "RRD" / "R4D" ('U' 'D' 'L' 'R', a digit = repeat the next moves). */
export function programKey(program: Program): string {
  const letter = { up: 'U', down: 'D', left: 'L', right: 'R' } as const
  return program.map(c => c.kind === 'move' ? letter[c.dir] : `${c.times}(${c.body.map(d => letter[d]).join('')})`).join('')
}
