import { find } from './program'
import type { Board, Cell } from './types'
import './board.css'

// The board drawing shared by ProgramGame (T3) and the art kit for pick questions (T2). A board is a map, so it
// stays left-to-right inside the RTL page, like the maze.

/** Oli dressed as a programmer: the app's owl in a small robot helmet with an antenna (user's choice). */
export function RoboOli({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size / 120
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`} aria-hidden="true">
      <line x1="60" y1="2" x2="60" y2="18" stroke="var(--mute)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="6" r="7" fill="var(--bad)" />
      <ellipse cx="60" cy="74" rx="44" ry="44" fill="var(--owl)" />
      <ellipse cx="60" cy="88" rx="28" ry="28" fill="var(--owl-belly)" />
      <path d="M14 46 Q14 16 60 16 Q106 16 106 46 L106 52 L14 52 Z" fill="var(--code)" />
      <rect x="14" y="48" width="92" height="8" rx="4" fill="var(--mute)" />
      <circle cx="42" cy="68" r="15" fill="#fff" />
      <circle cx="78" cy="68" r="15" fill="#fff" />
      <circle cx="44" cy="70" r="7" fill="#1f2a5c" />
      <circle cx="80" cy="70" r="7" fill="#1f2a5c" />
      <path d="M53 82 L67 82 L60 94 Z" fill="var(--sun)" />
    </g>
  )
}

interface Props {
  board: Board
  /** Width in px; cells are square. */
  size: number
  /** Where Oli stands (default: the 'S' cell). */
  hero?: Cell
  /** Cells Oli has walked, drawn as a trail. */
  trail?: readonly Cell[]
  /** The aid's suggested route, drawn faint and dashed. */
  ghost?: readonly Cell[]
  /** Highlighted squares (pick options: "Oli ends here?"). */
  marks?: readonly Cell[]
  /** Hide the start marker and goal (a follow board has no goal). */
  plain?: boolean
  label?: string
}

export function BoardView({ board, size, hero, trail, ghost, marks, plain = false, label }: Props) {
  const rows = board.rows.length
  const cols = board.rows[0]?.length ?? 0
  const cell = size / cols
  const at = hero ?? find(board, 'S') ?? [0, 0]
  const goal = plain ? undefined : find(board, 'G')
  const center = ([r, c]: Cell) => [c * cell + cell / 2, r * cell + cell / 2] as const
  const line = (cells: readonly Cell[]) => cells.map(c => center(c).join(',')).join(' ')

  return (
    <svg className="cd-board" viewBox={`0 0 ${size} ${(size / cols) * rows}`} width={size} role="img" aria-label={label ?? ''}>
      {board.rows.flatMap((row, r) => [...row].map((ch, c) => (
        <rect key={`${r},${c}`} x={c * cell + 2} y={r * cell + 2} width={cell - 4} height={cell - 4} rx={cell / 6}
          className={ch === '#' ? 'cd-wall' : 'cd-free'} />
      )))}
      {marks?.map(m => (
        <rect key={`m${m.join(',')}`} x={m[1] * cell + 5} y={m[0] * cell + 5} width={cell - 10} height={cell - 10} rx={cell / 6}
          className="cd-mark" />
      ))}
      {ghost && ghost.length > 1 && <polyline points={line(ghost)} className="cd-ghost" />}
      {trail && trail.length > 1 && <polyline points={line(trail)} className="cd-trail" />}
      {goal && <text x={center(goal)[0]} y={center(goal)[1]} fontSize={cell * 0.62} textAnchor="middle" dominantBaseline="central" aria-hidden="true">🍎</text>}
      <RoboOli x={center(at)[0]} y={center(at)[1]} size={cell * 0.9} />
    </svg>
  )
}
