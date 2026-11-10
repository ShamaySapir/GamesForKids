import { moves } from '../program'
import type { Board, DebugItem, Dir, FollowItem, Level } from '../types'

// '#' wall, '.' free, 'S' start, 'G' goal. Boards are proven by content.test.ts (solvable, one-edit bugs, loops needed).
const U: Dir = 'up'
const D: Dir = 'down'
const L: Dir = 'left'
const R: Dir = 'right'
const board = (id: string, rows: string[]): Board => ({ id, rows })

/** Open 4×4 boards (no walls, no goal) and a 2–4 move program that stays on the board. */
export const FOLLOW: readonly FollowItem[] = [
  { id: 'f1', board: board('f1', ['....', '....', '....', 'S...']), program: [U, R] },
  { id: 'f2', board: board('f2', ['....', '....', '...S', '....']), program: [U, L, L] },
  { id: 'f3', board: board('f3', ['..S.', '....', '....', '....']), program: [L, D] },
  { id: 'f4', board: board('f4', ['....', '....', '....', '.S..']), program: [R, R, U] },
  { id: 'f5', board: board('f5', ['....', '.S..', '....', '....']), program: [D, L] },
  { id: 'f6', board: board('f6', ['....', '....', 'S...', '....']), program: [R, U] },
  { id: 'f7', board: board('f7', ['.S..', '....', '....', '....']), program: [L, D] },
  { id: 'f8', board: board('f8', ['...S', '....', '....', '....']), program: [D, L] },
  { id: 'f9', board: board('f9', ['....', '....', '..S.', '....']), program: [L, U, R] },
  { id: 'f10', board: board('f10', ['....', '....', '....', '.S..']), program: [U, R, D, R] },
  { id: 'f11', board: board('f11', ['....', 'S...', '....', '....']), program: [R, D, R] },
  { id: 'f12', board: board('f12', ['....', '...S', '....', '....']), program: [U, L, D, L] },
  { id: 'f13', board: board('f13', ['....', '....', '....', '..S.']), program: [U, L, L] },
  { id: 'f14', board: board('f14', ['....', '....', '....', '.S..']), program: [R, R, U, L] },
]

/** Programming levels: open 4×4 first (shortest 2–4), then 5×5 with walls (shortest 4–7). Trailing number = shortest. */
export const LEVELS: readonly Level[] = [
  { board: board('l1', ['....', '....', '....', '.S.G']) }, // 2
  { board: board('l2', ['....', '....', 'S...', '.G..']) }, // 2
  { board: board('l3', ['..S.', '....', '.G..', '....']) }, // 3
  { board: board('l4', ['....', '...S', '....', '..G.']) }, // 3
  { board: board('l5', ['S...', '....', '..G.', '....']) }, // 4
  { board: board('l6', ['..G.', '....', 'S...', '....']) }, // 4
  { board: board('l7', ['.....', '.G.#.', '.##..', '.....', 'S...#']) }, // 4
  { board: board('l8', ['..S..', '.....', '..#.#', '.G...', '.#..#']) }, // 4
  { board: board('l9', ['....#', '..#..', '.#...', '#.#.G', 'S....']) }, // 5
  { board: board('l10', ['....#', 'G##.S', '..#..', '.....', '.....']) }, // 6
  { board: board('l11', ['.....', '#..#.', '....#', 'S..#G', '#....']) }, // 6
  { board: board('l12', ['...G.', '...#.', '.#...', '#...#', '..#S.']) }, // 6
  { board: board('l13', ['....#', 'G..#.', '#...#', '.....', '#...S']) }, // 7
  { board: board('l14', ['.#S..', '##..#', '.....', '..#..', '#...G']) }, // 6
  { board: board('l15', ['.....', '.S...', '..##.', '.#G..', '##...']) }, // 7
]

/** Buggy programs: exactly one fix of the stated kind reaches the goal (turn a card, remove a card, add one at the end). */
export const DEBUG: readonly DebugItem[] = [
  { id: 'd1', board: board('d1', ['.#...', '..G..', '.....', '.#...', 'S....']), program: moves([R, R, R, U, U]), bug: 'turn' },
  { id: 'd2', board: board('d2', ['.....', '.G...', '.....', '.....', '.S...']), program: moves([U, R, U, U]), bug: 'remove' },
  { id: 'd3', board: board('d3', ['....#', '.....', '.....', '..#.G', '.S...']), program: moves([R, R, R]), bug: 'add' },
  { id: 'd4', board: board('d4', ['...S.', '.....', '.....', 'G....', '.....']), program: moves([R, L, D, L, D, D]), bug: 'turn' },
  { id: 'd5', board: board('d5', ['#..#G', '...#.', 'S....', '.....', '.....']), program: moves([R, R, L, R, R, U, U]), bug: 'remove' },
  { id: 'd6', board: board('d6', ['.....', '....G', '.....', 'S....', '.....']), program: moves([U, R, U, R, R]), bug: 'add' },
  { id: 'd7', board: board('d7', ['#....', '....S', '.....', '...G#', '..#..']), program: moves([D, R, D]), bug: 'turn' },
  { id: 'd8', board: board('d8', ['....G', '.....', '.....', '...S.', '.....']), program: moves([U, U, R, D, U]), bug: 'remove' },
  { id: 'd9', board: board('d9', ['.....', '.#...', '.G..#', '.....', '...S.']), program: moves([U, L, U]), bug: 'add' },
  { id: 'd10', board: board('d10', ['....G', '.....', '.....', '.....', '....S']), program: moves([U, L, U, U]), bug: 'turn' },
  { id: 'd11', board: board('d11', ['.....', '..G..', '.....', '....#', '.S.#.']), program: moves([U, U, L, R, U]), bug: 'remove' },
  { id: 'd12', board: board('d12', ['.....', 'G....', '.....', '...S.', '.....']), program: moves([U, L, L, L]), bug: 'add' },
  { id: 'd13', board: board('d13', ['.....', '..S..', '.....', '#....', '.#..G']), program: moves([R, R, D, L, D]), bug: 'turn' },
  { id: 'd14', board: board('d14', ['.....', 'G....', '..S..', '.....', '.....']), program: moves([L, U, U, L]), bug: 'remove' },
  { id: 'd15', board: board('d15', ['..#.S', 'G....', '..#..', '.....', '....#']), program: moves([D, L, L, L]), bug: 'add' },
]

/** 6×6 boards with long straight runs: a loop program fits in maxCards, the plain-move version does not. Four of them are detours around walls. */
export const REPEAT_LEVELS: readonly Level[] = [
  { board: board('r1', ['G....#', '.###..', '.#S...', '.#....', '.####.', '......']), maxCards: 3 }, // detour: shortest 8, loop 3
  { board: board('r2', ['......', '.G....', '.#...#', '#.....', '....S#', '...#..']), maxCards: 3 }, // shortest 6, loop 2
  { board: board('r3', ['......', '.#..#.', 'S.....', '......', '.#...#', '...G..']), maxCards: 3 }, // shortest 6, loop 2
  { board: board('r4', ['....#.', '.....G', '......', '....#.', 'S....#', '.#....']), maxCards: 3 }, // shortest 8, loop 2
  { board: board('r5', ['#.....', '..#..S', '#.#...', 'G#.##.', '......', '...#.#']), maxCards: 3 }, // detour: shortest 9, loop 3, one run of 5
  { board: board('r6', ['G.....', '......', '......', '......', '##.#S.', '.....#']), maxCards: 3 }, // shortest 8, loop 2
  { board: board('r7', ['......', 'G.....', '....#.', '..#...', '.....#', '..#S.#']), maxCards: 3 }, // shortest 7, loop 2
  { board: board('r8', ['......', '..#G#.', '...#..', '......', '..#...', '#S....']), maxCards: 3 }, // detour: shortest 8, loop 3, one run of 5
  { board: board('r9', ['S.###G', '......', '.#....', '......', '....#.', '.#..#.']), maxCards: 3 }, // detour: shortest 7, loop 3, one run of 5
  { board: board('r10', ['S#..#.', '......', '..#..#', '...G..', '.#....', '......']), maxCards: 3 }, // shortest 6, loop 2
  { board: board('r11', ['S.....', '.#....', '....##', '...G..', '....#.', '......']), maxCards: 3 }, // shortest 6, loop 2
  { board: board('r12', ['..S...', '...##.', '...#..', '......', '...#..', 'G.....']), maxCards: 3 }, // shortest 7, loop 2
  { board: board('r13', ['....S#', '......', '......', '.#....', '.G....', '#...#.']), maxCards: 3 }, // shortest 7, loop 2
  { board: board('r14', ['.#...G', '......', '...#..', '.#S#.#', '...#..', '..##..']), maxCards: 3 }, // shortest 6, loop 2
]
