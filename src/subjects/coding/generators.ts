import { shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { ArtRef, PickOption, PickQ } from '../../ui/pick/types'
import type { OrderQ } from '../reading/types'
import { C, otherPhrase, stepPhrase, storyPhrase, wrongPhrase } from './ids'
import { ARROW, DIRS, compress, find, moves, run, sameCell } from './program'
import type { Board, Cell, DebugItem, Dir, FollowItem, Level, MovePattern, PaletteCard, ProgramQ, Story } from './types'

// Pure question generators for the coding island (7 skills). Content comes in as arguments. Spec: docs/specs/coding.md.
// Tested in generators.test.ts.
//
// Representation decisions:
// - Item keys: steps = the story id; the others are prefixed (`bug:`, `missing:`, `follow:`, `program:`, `debug:`, `loop:`, `repeat:`).
// - Pick option ids are positional letters 'a'…'c' (bug 'wrong' variant: 's0'…'sN', one per step in story order).
// - Art props are flat: boards are rows joined with '|', a program is its arrows ('→→↓'), a unit is emoji joined with '|'.

/* ---------- helpers ---------- */

/** Review item first (when a candidate), then fresh items, then repeats; the first candidate `build` accepts wins. */
function make<T, Q>(ctx: GenContext, items: readonly T[], key: (t: T) => string, build: (t: T) => Q | null): Q {
  const review = items.filter(i => key(i) === ctx.review)
  const rest = items.filter(i => key(i) !== ctx.review)
  const fresh = shuffle(ctx.rng, rest.filter(i => !ctx.avoid.has(key(i))))
  const stale = shuffle(ctx.rng, rest.filter(i => ctx.avoid.has(key(i))))
  for (const t of [...review, ...fresh, ...stale]) {
    const q = build(t)
    if (q) return q
  }
  throw new Error('no valid item to ask')
}

const SLOTS = ['a', 'b', 'c'] as const

/** Shuffles `correct` among `wrong`; returns the items in slot order and the correct slot's id. */
function arrange<T>(rng: Rng, correct: T, wrong: readonly T[]): { items: T[]; answer: string } {
  const items = shuffle(rng, [correct, ...wrong])
  return { items, answer: SLOTS[items.indexOf(correct)]! }
}

const artKey = (a: ArtRef) => JSON.stringify([a.name, Object.entries(a.props ?? {}).sort(([x], [y]) => (x < y ? -1 : 1))])
const artOptions = (items: readonly ArtRef[]): PickOption[] => items.map((art, i) => ({ id: SLOTS[i]!, kind: 'art', art }))
const cellKey = (c: Cell) => `${c[0]},${c[1]}`

const opposite: Readonly<Record<Dir, Dir>> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const arrows = (dirs: readonly Dir[]) => dirs.map(d => ARROW[d]).join('')
const PALETTE: readonly PaletteCard[] = DIRS
const REPEAT_PALETTE: readonly PaletteCard[] = [...DIRS, 'repeat']

const STEP: Readonly<Record<Dir, Cell>> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
const isOpen = (board: Board, [r, c]: Cell) => r >= 0 && r < board.rows.length && c >= 0 && c < (board.rows[r]?.length ?? 0) && board.rows[r]![c] !== '#'

/**
 * A route from 'S' to 'G' with the fewest moves and, among those, the fewest straight runs (turns), so it agrees with
 * compress(). Dijkstra over (cell, last direction); a move costs 1000, a change of direction one more. Null when unreachable.
 */
export function fewestTurnsRoute(board: Board): Dir[] | null {
  const start = find(board, 'S')
  const goal = find(board, 'G')
  if (!start || !goal) return null
  type Node = { cell: Cell; dir: Dir | null; cost: number; from: Node | null }
  const keyOf = (c: Cell, d: Dir | null) => `${c[0]},${c[1]},${d ?? ''}`
  const best = new Map<string, number>([[keyOf(start, null), 0]])
  const open: Node[] = [{ cell: start, dir: null, cost: 0, from: null }]
  const done = new Set<string>()
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost)
    const node = open.shift()!
    const k = keyOf(node.cell, node.dir)
    if (done.has(k)) continue
    done.add(k)
    if (sameCell(node.cell, goal)) {
      const dirs: Dir[] = []
      for (let n: Node | null = node; n?.from; n = n.from) dirs.unshift(n.dir!)
      return dirs
    }
    for (const d of DIRS) {
      const next: Cell = [node.cell[0] + STEP[d][0], node.cell[1] + STEP[d][1]]
      if (!isOpen(board, next)) continue
      const cost = node.cost + 1000 + (node.dir && node.dir !== d ? 1 : 0)
      const nk = keyOf(next, d)
      if (cost < (best.get(nk) ?? Infinity)) {
        best.set(nk, cost)
        open.push({ cell: next, dir: d, cost, from: node })
      }
    }
  }
  return null
}

/** The ghost route's moves, or null when the board has no non-trivial solution. */
function solution(board: Board): Dir[] | null {
  const dirs = fewestTurnsRoute(board)
  return dirs && dirs.length > 0 ? dirs : null
}

/* ---------- 1. order the steps ---------- */

export const stepsAccepts = (key: string) => !key.includes(':')

/** The steps of an everyday algorithm as emoji tiles, shuffled so they are never already in order. */
export function stepsQuestion(ctx: GenContext, stories: readonly Story[]): OrderQ {
  return make(ctx, stories, s => s.id, s => {
    if (s.steps.length < 3) return null
    const tiles = s.steps.map((st, n) => ({ id: `${s.id}.${n}`, text: st.emoji, say: stepPhrase(s.id, n) }))
    let shuffled = shuffle(ctx.rng, tiles)
    while (shuffled.every((t, i) => t === tiles[i])) shuffled = shuffle(ctx.rng, tiles)
    // The story's question first ("אֵיךְ מְצַחְצְחִים שִׁנַּיִם?"), then what to do; numbered slots show where to start.
    return { itemKey: s.id, answer: tiles.map(t => t.id), say: [storyPhrase(s.id), C.steps], instruction: storyPhrase(s.id), layout: 'units', numbered: true, tiles: shuffled }
  })
}

/* ---------- 2. find the bug ---------- */

const bugKey = (id: string) => `bug:${id}`
const missingKey = (id: string) => `missing:${id}`
export const bugAccepts = (key: string) => key.startsWith('bug:') || key.startsWith('missing:')

/** Either the steps with one wrong step (pick it), or the steps with a gap (pick the missing step of 3). */
export function bugQuestion(ctx: GenContext, stories: readonly Story[]): PickQ {
  const wrongVariant = ctx.rng() < 0.5
  return make(ctx, stories, s => (wrongVariant ? bugKey(s.id) : missingKey(s.id)), s => {
    if (s.steps.length < 3) return null
    if (wrongVariant) {
      const { at, step } = s.wrong
      if (at < 0 || at >= s.steps.length) return null
      const shown = s.steps.map((st, n) => (n === at ? step : st))
      if (new Set(shown.map(st => st.emoji)).size !== shown.length) return null
      const options: PickOption[] = shown.map((st, n) => ({
        id: `s${n}`, kind: 'picture', emoji: st.emoji, caption: st.text, say: n === at ? wrongPhrase(s.id) : stepPhrase(s.id, n),
      }))
      return { itemKey: bugKey(s.id), answer: `s${at}`, say: [storyPhrase(s.id), C.bug], instruction: C.bug, prompt: { sentence: { text: s.title } }, options, hint: C.bug }
    }
    const gap = Math.floor(ctx.rng() * s.steps.length)
    const missing = { emoji: s.steps[gap]!.emoji, caption: s.steps[gap]!.text, say: stepPhrase(s.id, gap) }
    const others = s.notMissing.map((st, n) => ({ emoji: st.emoji, caption: st.text, say: otherPhrase(s.id, n as 0 | 1) }))
    if (new Set([missing, ...others].map(o => o.emoji)).size !== 3) return null
    const { items, answer } = arrange(ctx.rng, missing, others)
    const options: PickOption[] = items.map((o, i) => ({ id: SLOTS[i]!, kind: 'picture', emoji: o.emoji, caption: o.caption, say: o.say }))
    const strip: ArtRef = { name: 'code-steps', props: { steps: s.steps.map(st => st.emoji).join('|'), gap } }
    return { itemKey: missingKey(s.id), answer, say: [storyPhrase(s.id), C.missing], instruction: C.missing, prompt: { sentence: { text: s.title }, art: [strip] }, options, hint: C.missing }
  })
}

/* ---------- 3. follow the program ---------- */

const followKey = (id: string) => `follow:${id}`
export const followAccepts = (key: string) => key.startsWith('follow:')

/** Programs a child following the arrows might act out by mistake: a skipped move, a flipped arrow, one extra repeat of the last move. */
function slips(program: readonly Dir[]): Dir[][] {
  const skips = program.map((_, i) => [...program.slice(0, i), ...program.slice(i + 1)])
  const flips = program.map((d, i) => program.map((x, j) => (j === i ? opposite[d] : x)))
  return [...skips, ...flips, [...program, program.at(-1)!]]
}

/** A board with the program's arrows, and 3 boards each marking one end square: the true one and two typical slips. */
export function followQuestion(ctx: GenContext, items: readonly FollowItem[]): PickQ {
  return make(ctx, items, i => followKey(i.id), item => {
    const end = run(item.board, moves(item.program)).end
    const seen = new Set([cellKey(end)])
    const wrong: Cell[] = []
    for (const slip of shuffle(ctx.rng, slips(item.program))) {
      const result = run(item.board, moves(slip))
      const e = result.end
      if (result.stoppedAt === undefined && wrong.length < 2 && !seen.has(cellKey(e))) {
        seen.add(cellKey(e))
        wrong.push(e)
      }
    }
    if (wrong.length < 2) return null
    const rows = item.board.rows.join('|')
    const marked = (c: Cell): ArtRef => ({ name: 'code-board', props: { rows, mark: cellKey(c), plain: true } })
    const { items: shown, answer } = arrange(ctx.rng, end, wrong)
    const prompt: ArtRef = { name: 'code-board', props: { rows, program: arrows(item.program), plain: true } }
    return {
      itemKey: followKey(item.id), answer, say: C.follow, instruction: C.follow, prompt: { art: [prompt] },
      options: artOptions(shown.map(marked)), hint: C.hintFollow,
    }
  })
}

/* ---------- 4. build a program ---------- */

const programKeyOf = (id: string) => `program:${id}`
export const programAccepts = (key: string) => key.startsWith('program:')

export function programQuestion(ctx: GenContext, levels: readonly Level[]): ProgramQ {
  return make(ctx, levels, l => programKeyOf(l.board.id), l => {
    const dirs = solution(l.board)
    if (!dirs) return null
    return {
      itemKey: programKeyOf(l.board.id), answer: null, say: C.program, instruction: C.program, hint: C.hintPath,
      board: l.board, palette: PALETTE, ghost: run(l.board, moves(dirs)).path,
    }
  })
}

/* ---------- 5. debug a program ---------- */

const debugKey = (id: string) => `debug:${id}`
export const debugAccepts = (key: string) => key.startsWith('debug:')

export function debugQuestion(ctx: GenContext, items: readonly DebugItem[]): ProgramQ {
  return make(ctx, items, i => debugKey(i.id), item => {
    const dirs = solution(item.board)
    if (!dirs || run(item.board, item.program).reachedGoal) return null
    const palette = item.program.some(c => c.kind === 'repeat') ? REPEAT_PALETTE : PALETTE
    return {
      itemKey: debugKey(item.id), answer: null, say: C.debug, instruction: C.debug, board: item.board, palette, hint: C.hintDebug,
      start: item.program, oneEdit: true, ghost: run(item.board, moves(dirs)).path,
    }
  })
}

/* ---------- 6. which loop? ---------- */

const loopKey = (id: string) => `loop:${id}`
export const loopAccepts = (key: string) => key.startsWith('loop:')

const dance = (unit: readonly string[], times: number) => Array.from({ length: times }, () => unit).flat().join('')
const loopCard = (unit: readonly string[], times: number): ArtRef => ({ name: 'code-loop', props: { unit: unit.join('|'), times } })

/** The dance, and 3 "repeat" cards: the right one, one with the wrong count, one with a wrong unit. */
export function loopQuestion(ctx: GenContext, patterns: readonly MovePattern[]): PickQ {
  return make(ctx, patterns, p => loopKey(p.id), p => {
    const { unit, times } = p
    if (unit.length < 2 || times < 2) return null
    const truth = dance(unit, times)
    const foreign = patterns.flatMap(o => o.unit).filter(e => !unit.includes(e))
    const swapIn = foreign.length ? [[...unit.slice(0, -1), shuffle(ctx.rng, foreign)[0]!]] : []
    const unitSlips = [[...unit].reverse(), unit.slice(0, -1), [...unit, unit[0]!], ...swapIn]
    const wrongCount = shuffle(ctx.rng, [times + 1, times - 1].filter(n => n >= 2)).find(n => dance(unit, n) !== truth)
    // A rotation of the unit (👏🦶 → 🦶👏) is the same dance started one move later: a child could rightly pick it.
    const rotation = (u: readonly string[]) => u.length === unit.length && unit.some((_, k) => [...unit.slice(k), ...unit.slice(0, k)].join('|') === u.join('|'))
    const wrongUnit = shuffle(ctx.rng, unitSlips).find(u => dance(u, times) !== truth && !rotation(u))
    if (wrongCount === undefined || !wrongUnit) return null
    const right = loopCard(unit, times)
    const wrong = [loopCard(unit, wrongCount), loopCard(wrongUnit, times)]
    if (new Set([right, ...wrong].map(artKey)).size !== 3) return null
    const { items, answer } = arrange(ctx.rng, right, wrong)
    const prompt: ArtRef = { name: 'code-dance', props: { unit: unit.join('|'), times } }
    return { itemKey: loopKey(p.id), answer, say: C.loop, instruction: C.loop, prompt: { art: [prompt] }, options: artOptions(items) }
  })
}

/* ---------- 7. use "repeat" ---------- */

const repeatKey = (id: string) => `repeat:${id}`
export const repeatAccepts = (key: string) => key.startsWith('repeat:')

/** A build with a card limit: the shortest route in plain moves doesn't fit, the same route with repeat cards does. */
export function repeatQuestion(ctx: GenContext, levels: readonly Level[]): ProgramQ {
  return make(ctx, levels, l => repeatKey(l.board.id), l => {
    const dirs = solution(l.board)
    if (!dirs) return null
    const maxCards = l.maxCards ?? compress(dirs).length
    if (compress(dirs).length > maxCards) return null
    return {
      itemKey: repeatKey(l.board.id), answer: null, say: C.repeat, instruction: C.repeat, hint: C.hintRepeat,
      board: l.board, palette: REPEAT_PALETTE, maxCards, ghost: run(l.board, moves(dirs)).path,
    }
  })
}
