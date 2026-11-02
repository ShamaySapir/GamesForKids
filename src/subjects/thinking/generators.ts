import { pick, randInt, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import type { OrderQ } from '../reading/types'
import type { SortQ } from '../hebrew/types'
import type { ArtRef, ObjectGroup, PickOption, PickQ } from '../../ui/pick/types'
import { COLORS, POSITIONS, SCENE, artSpec, type Position } from './art/catalog'
import { T, artPhrase, sequencePhrase, wherePhrase } from './ids'
import type {
  DiffQ, DiffScene, MazeDef, MazeQ, MemoryQ, MemoryTheme, MissingItem, OddSet, PatternDef, SequenceSet, ShadowSet, SortBoard, SymGridQ,
  SymmetryItem, TwinSet, WhereScene,
} from './types'

// Pure question generators for the thinking island (12 skills). Content comes in as arguments. Spec: docs/specs/thinking.md.
// Tested in generators.test.ts.
//
// Representation decisions:
// - Option ids are positional letters 'a'…'d' (the answer is the id of the correct slot), so the correct slot varies by seed.
// - Growing patterns (●, ●●, ●●●, ?) are one `objects` prompt row: groups of the pattern's emoji with counts 1…k, then a
//   single '❓' group as the empty slot. Options are `objects` groups. The emoji comes from EMOJI_OF (shapes by color).
// - Sorting cards say nothing (`say: []`, `text: ''`): they are pictures, and naming them would be noise.
// - Sequence tile numbers n are 0-based indexes into `steps`.
// - What's missing: options are the parts alone ({ only: part }), per the contract.

/* ---------- helpers ---------- */

type Props = NonNullable<ArtRef['props']>

/** Review item first (when a candidate), then fresh items, then repeats; the first candidate `build` accepts wins. */
function make<T, Q>(ctx: GenContext, items: readonly T[], key: (t: T) => string, build: (t: T) => Q | null, order?: (ts: T[]) => T[]): Q {
  const review = items.filter(i => key(i) === ctx.review)
  const rest = items.filter(i => key(i) !== ctx.review)
  const sort = order ?? ((ts: T[]) => shuffle(ctx.rng, ts))
  const fresh = sort(rest.filter(i => !ctx.avoid.has(key(i))))
  const stale = sort(rest.filter(i => ctx.avoid.has(key(i))))
  for (const t of [...review, ...fresh, ...stale]) {
    const q = build(t)
    if (q) return q
  }
  throw new Error('no valid item to ask')
}

const SLOTS = ['a', 'b', 'c', 'd'] as const

/** Stable identity of a drawing: name and props (never the spoken name). */
const artKey = (a: ArtRef) => JSON.stringify([a.name, Object.entries(a.props ?? {}).sort(([x], [y]) => (x < y ? -1 : 1))])
const withProps = (a: ArtRef, extra: Props): ArtRef => ({ ...a, props: { ...a.props, ...extra } })
/** A drawing without its spoken name, so options never name the answer. */
const bare = (a: ArtRef): ArtRef => ({ name: a.name, ...(a.props ? { props: a.props } : {}) })
const allDistinct = (arts: readonly ArtRef[]) => new Set(arts.map(artKey)).size === arts.length

/** Shuffles `correct` among `wrong`; returns the items in slot order and the correct slot's id. */
function arrange<T>(rng: Rng, correct: T, wrong: readonly T[]): { items: T[]; answer: string } {
  const items = shuffle(rng, [correct, ...wrong])
  return { items, answer: SLOTS[items.indexOf(correct)]! }
}

const artOptions = (items: readonly ArtRef[]): PickOption[] => items.map((art, i) => ({ id: SLOTS[i]!, kind: 'art', art }))

/** n distinct (by `key`) items, drawn tier by tier so earlier tiers are preferred; null when there aren't enough. */
function take<T>(rng: Rng, tiers: readonly (readonly T[])[], n: number, key: (t: T) => string, taken: readonly string[] = []): T[] | null {
  const seen = new Set(taken)
  const out: T[] = []
  for (const tier of tiers)
    for (const t of shuffle(rng, tier)) {
      if (out.length < n && !seen.has(key(t))) {
        seen.add(key(t))
        out.push(t)
      }
    }
  return out.length === n ? out : null
}

/* ---------- 1. odd one out ---------- */

const oddKey = (id: string) => `odd:${id}`
export const oddAccepts = (key: string) => key.startsWith('odd:')

/** Three of `base` and one `odd`, in a random slot; pick the odd one. The options carry no sound (it would name the answer). */
export function oddOneQuestion(ctx: GenContext, sets: readonly OddSet[]): PickQ {
  return make(ctx, sets, s => oddKey(s.id), s => {
    if (artKey(s.base) === artKey(s.odd)) return null
    const { items, answer } = arrange(ctx.rng, s.odd, [s.base, s.base, s.base])
    return {
      itemKey: oddKey(s.id), answer, say: T.oddOne, instruction: T.oddOne, prompt: {}, options: artOptions(items), hint: T.oddOne,
    }
  })
}

/* ---------- 2. twin ---------- */

const twinKey = (id: string) => `twin:${id}`
export const twinAccepts = (key: string) => key.startsWith('twin:')

/** A sample above, and the sample hidden among 3 near-identical decoys. */
export function twinQuestion(ctx: GenContext, sets: readonly TwinSet[]): PickQ {
  return make(ctx, sets, s => twinKey(s.id), s => {
    if (!allDistinct([s.sample, ...s.decoys])) return null
    const sample = bare(s.sample)
    const { items, answer } = arrange(ctx.rng, sample, s.decoys.map(bare))
    return {
      itemKey: twinKey(s.id), answer, say: T.twin, instruction: T.twin, prompt: { art: [sample] }, options: artOptions(items), hint: T.twin,
    }
  })
}

/* ---------- 3. shadows ---------- */

const shadowKey = (id: string) => `shadow:${id}`
export const shadowAccepts = (key: string) => key.startsWith('shadow:')

/** Shadows are all drawn at the same size: `scale` is dropped so size never gives the answer away. */
const unscaled = (a: ArtRef): ArtRef => ({ name: a.name, props: Object.fromEntries(Object.entries(a.props ?? {}).filter(([k]) => k !== 'scale')) })
const shadowOf = (a: ArtRef): ArtRef => withProps(unscaled(a), { silhouette: true })

/** Either an object (pick its silhouette of 3) or a silhouette (pick its object of 3). Silhouettes are never named. */
export function shadowQuestion(ctx: GenContext, sets: readonly ShadowSet[]): PickQ {
  return make(ctx, sets, s => shadowKey(s.id), s => {
    const objects = [s.object, ...s.decoys].map(unscaled)
    if (!allDistinct(objects)) return null
    const toShadow = ctx.rng() < 0.5
    if (toShadow) {
      const { items, answer } = arrange(ctx.rng, shadowOf(s.object), s.decoys.map(shadowOf))
      return {
        itemKey: shadowKey(s.id), answer, say: T.shadowOf, instruction: T.shadowOf, prompt: { art: [objects[0]!] }, options: artOptions(items),
      }
    }
    const { items, answer } = arrange(ctx.rng, objects[0]!, objects.slice(1))
    const options: PickOption[] = items.map((art, i) => ({ id: SLOTS[i]!, kind: 'art', art, say: artPhrase(art.name) }))
    return { itemKey: shadowKey(s.id), answer, say: T.shadow, instruction: T.shadow, prompt: { art: [shadowOf(s.object)] }, options }
  })
}

/* ---------- 4. patterns ---------- */

const patternKey = (id: string) => `pattern:${id}`
export const patternAccepts = (key: string) => key.startsWith('pattern:')

/** Emoji for drawings that can be counted in a growing pattern. */
const SHAPE_EMOJI: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  circle: { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', purple: '🟣', orange: '🟠' },
  square: { red: '🟥', blue: '🟦', green: '🟩', yellow: '🟨', purple: '🟪', orange: '🟧' },
  heart: { red: '❤️', blue: '💙', green: '💚', yellow: '💛', purple: '💜', orange: '🧡' },
}
const PLAIN_EMOJI: Readonly<Record<string, string>> = { star: '⭐', sun: '☀️', apple: '🍎', ball: '⚽', flower: '🌸', cupcake: '🧁', fish: '🐟' }
export const EMOJI_OF = (a: ArtRef): string | null => {
  const color = a.props?.color
  const byColor = SHAPE_EMOJI[a.name]
  if (byColor) return typeof color === 'string' ? (byColor[color] ?? null) : null
  return PLAIN_EMOJI[a.name] ?? null
}
const COUNT_SLOT = '❓'

const countGroup = (emoji: string, count: number): ObjectGroup => ({ emoji, count, layout: 'row' })

/**
 * repeat: 5–8 items of the repeating unit then a '?' slot; options are the pattern's own items (plus a drawing from another
 * pattern when the unit has only 2 kinds). grow: rows of 1…k objects then ❓; options are rows of k+1 and nearby counts.
 */
export function patternQuestion(ctx: GenContext, patterns: readonly PatternDef[]): PickQ {
  return make(ctx, patterns, p => patternKey(p.id), p => {
    if (p.kind === 'grow') {
      const emoji = EMOJI_OF(p.unit[0]!)
      if (!emoji) return null
      const k = randInt(ctx.rng, 3, 4)
      const wrong = take(ctx.rng, [[k, k + 2], [k - 1, k + 3]].map(t => t.filter(c => c >= 1)), 2, String, [String(k + 1)])
      if (!wrong) return null
      const { items, answer } = arrange(ctx.rng, k + 1, wrong)
      const shown = Array.from({ length: k }, (_, i) => countGroup(emoji, i + 1))
      return {
        itemKey: patternKey(p.id), answer, say: T.pattern, instruction: T.pattern, hint: T.pattern,
        prompt: { objects: [...shown, { emoji: COUNT_SLOT, count: 1 }] },
        options: items.map((c, i) => ({ id: SLOTS[i]!, kind: 'objects', group: countGroup(emoji, c) })),
      }
    }
    const unit = p.unit.map(bare)
    const own = [...new Map(unit.map(a => [artKey(a), a])).values()]
    if (unit.length < 2 || own.length < 2) return null
    const n = randInt(ctx.rng, 5, 8)
    const next = unit[n % unit.length]!
    const shown = Array.from({ length: n }, (_, i) => unit[i % unit.length]!)
    const ownKeys = new Set(own.map(artKey))
    const foreign = patterns.filter(o => o.kind === 'repeat' && o.id !== p.id).flatMap(o => o.unit.map(bare)).filter(a => !ownKeys.has(artKey(a)))
    const wrong = take(ctx.rng, [own.filter(a => artKey(a) !== artKey(next)), foreign], 2, artKey)
    if (!wrong) return null
    const { items, answer } = arrange(ctx.rng, next, wrong)
    return {
      itemKey: patternKey(p.id), answer, say: T.pattern, instruction: T.pattern, hint: T.pattern,
      prompt: { art: [...shown, { name: '?' }] }, options: artOptions(items),
    }
  })
}

/* ---------- 5. where is it ---------- */

const whereKey = (id: string) => `where:${id}`
export const whereAccepts = (key: string) => key.startsWith('where:')

/** Positions that can look alike in a drawing; never offered together. */
const CLASH: Readonly<Partial<Record<Position, Position>>> = { on: 'above', above: 'on' }

/** The same two objects in 3 positions; pick the one the spoken sentence describes. Pictures are silent. */
export function whereQuestion(ctx: GenContext, scenes: readonly WhereScene[]): PickQ {
  return make(ctx, scenes, s => whereKey(s.id), s => {
    const wrong: Position[] = []
    for (const r of shuffle(ctx.rng, POSITIONS.filter(r => r !== s.rel && r !== CLASH[s.rel])))
      if (wrong.length < 2 && !wrong.some(w => CLASH[w] === r)) wrong.push(r)
    if (wrong.length < 2) return null
    const art = (rel: Position): ArtRef => ({ name: SCENE, props: { a: s.a, b: s.b, rel } })
    const { items, answer } = arrange(ctx.rng, s.rel, wrong)
    return {
      itemKey: whereKey(s.id), answer, say: wherePhrase(s.id), instruction: wherePhrase(s.id), prompt: {}, options: artOptions(items.map(art)),
      hint: wherePhrase(s.id),
    }
  })
}

/* ---------- 6. memory ---------- */

const memoryKey = (id: string) => `memory:${id}`
export const memoryAccepts = (key: string) => key.startsWith('memory:')
const faceKey = (f: ArtRef | string) => (typeof f === 'string' ? f : artKey(f))

/** A board of 2×`pairs` shuffled cards from one theme. Card ids are `p<i>a` / `p<i>b`; a pair shares its face. */
export function memoryQuestion(ctx: GenContext, themes: readonly MemoryTheme[], pairs: number): MemoryQ {
  return make(ctx, themes, t => memoryKey(t.id), t => {
    const faces = [...new Map(t.faces.map(f => [faceKey(f), f])).values()]
    if (faces.length < pairs) return null
    const cards = shuffle(ctx.rng, shuffle(ctx.rng, faces).slice(0, pairs).flatMap((face, i) => [
      { id: `p${i}a`, face }, { id: `p${i}b`, face },
    ]))
    return { itemKey: memoryKey(t.id), answer: null, say: T.memory, instruction: T.memory, cards }
  })
}

/** A generator for a fixed number of pairs (3 for age 4 … 6 for age 6). */
export const memoryQuestionFor = (pairs: number) => (ctx: GenContext, themes: readonly MemoryTheme[]) => memoryQuestion(ctx, themes, pairs)

/* ---------- 7. symmetry ---------- */

const symKey = (id: string) => `sym:${id}`
export const symmetryAccepts = (key: string) => key.startsWith('sym:')
const isSymmetric = (a: ArtRef) => artSpec(a.name)?.symmetric === true

/** The right half is shown; pick the matching left half of 3 — the same drawing in another color, or another drawing's half. */
export function symmetryQuestion(ctx: GenContext, items: readonly SymmetryItem[]): PickQ {
  return make(ctx, items, i => symKey(i.id), item => {
    const art = bare(item.art)
    if (!isSymmetric(art)) return null
    const color = art.props?.color
    const colors = typeof color === 'string' && artSpec(art.name)?.colorable
      ? COLORS.filter(c => c !== color).map(c => withProps(art, { color: c }))
      : []
    const others = items.map(i => bare(i.art)).filter(a => a.name !== art.name && isSymmetric(a))
    const pool = [shuffle(ctx.rng, colors)[0], shuffle(ctx.rng, others)[0]].filter((a): a is ArtRef => !!a)
    const wrong = take(ctx.rng, [pool, colors, others], 2, artKey)
    if (!wrong) return null
    const half = (a: ArtRef) => withProps(a, { half: 'left' })
    const { items: slots, answer } = arrange(ctx.rng, half(art), wrong.map(half))
    return {
      itemKey: symKey(item.id), answer, say: T.symmetry, instruction: T.symmetry, hint: T.symmetry,
      prompt: { art: [withProps(art, { half: 'right' })] }, options: artOptions(slots),
    }
  })
}

const GRID_SIZES = [4, 6] as const
const gridKey = (n: number) => `symgrid:${n}`
export const symGridAccepts = (key: string) => GRID_SIZES.some(n => gridKey(n) === key)

/** A 4×4 or 6×6 grid with random cells filled in the left half; the answer is their mirror image, cells as [row, col]. */
export function symGridQuestion(ctx: GenContext): SymGridQ {
  return make(ctx, GRID_SIZES, gridKey, n => {
    const half = n / 2
    const left = Array.from({ length: n * half }, (_, i) => [Math.floor(i / half), i % half] as const)
    const given = shuffle(ctx.rng, left).slice(0, n === 4 ? randInt(ctx.rng, 3, 5) : randInt(ctx.rng, 6, 9))
    given.sort((x, y) => x[0] - y[0] || x[1] - y[1])
    const answer = given.map(([r, c]) => [r, n - 1 - c] as const).sort((x, y) => x[0] - y[0] || x[1] - y[1])
    return {
      itemKey: gridKey(n), answer, say: T.symGrid, instruction: T.symGrid, rows: n, cols: n, given, color: pick(ctx.rng, COLORS),
    }
  })
}

/* ---------- 8. sequence ---------- */

const seqKey = (id: string) => `seq:${id}`
export const sequenceAccepts = (key: string) => key.startsWith('seq:')

/** The steps of a process as tiles, shuffled so they are never already in order. Answer: tile ids in order. */
export function sequenceQuestion(ctx: GenContext, seqs: readonly SequenceSet[]): OrderQ {
  return make(ctx, seqs, s => seqKey(s.id), s => {
    if (s.steps.length < 3) return null
    const tiles = s.steps.map((text, n) => ({ id: `${s.id}.${n}`, text, say: sequencePhrase(s.id, n) }))
    let shuffled = shuffle(ctx.rng, tiles)
    while (shuffled.every((t, i) => t === tiles[i])) shuffled = shuffle(ctx.rng, tiles)
    return {
      itemKey: seqKey(s.id), answer: tiles.map(t => t.id), say: T.sequence, instruction: T.sequence, layout: 'units', tiles: shuffled,
    }
  })
}

/* ---------- 9. sorting ---------- */

const sortKey = (id: string) => `sort:${id}`
export const sortAccepts = (key: string) => key.startsWith('sort:')

/** Up to 3 cards per basket (6 in all), baskets in random sides. Cards are silent pictures: `say: []`, `text: ''`. */
export function sortQuestion(ctx: GenContext, boards: readonly SortBoard[]): SortQ {
  return make(ctx, boards, b => sortKey(b.id), b => {
    const side = (bin: 0 | 1) => shuffle(ctx.rng, b.cards.filter(c => c.bin === bin)).slice(0, 3)
    const [zero, one] = [side(0), side(1)]
    if (!zero.length || !one.length) return null
    const flip = ctx.rng() < 0.5
    const cards = shuffle(ctx.rng, [...zero, ...one]).map((c, i) => ({
      id: String(i), emoji: c.emoji, text: '', say: [] as string[], bin: (flip ? 1 - c.bin : c.bin) as 0 | 1,
    }))
    const bins: readonly [string, string] = flip ? [b.bins[1], b.bins[0]] : [b.bins[0], b.bins[1]]
    return { itemKey: sortKey(b.id), answer: null, say: T.sorting, bins, cards }
  })
}

/* ---------- 10. what's missing ---------- */

const missingKey = (id: string) => `missing:${id}`
export const missingAccepts = (key: string) => key.startsWith('missing:')

/** The drawing without one part; pick that part (drawn alone) of 3. Parts are not named: no sound on options. */
export function missingQuestion(ctx: GenContext, items: readonly MissingItem[]): PickQ {
  return make(ctx, items, i => missingKey(i.id), item => {
    const parts = [item.part, ...item.wrong]
    const known = artSpec(item.art.name)?.parts ?? []
    if (new Set(parts).size !== 3 || !parts.every(p => known.includes(p))) return null
    const only = (part: string): ArtRef => ({ name: item.art.name, props: { only: part } })
    const { items: slots, answer } = arrange(ctx.rng, item.part, item.wrong)
    return {
      itemKey: missingKey(item.id), answer, say: T.missing, instruction: T.missing, hint: T.missing,
      prompt: { art: [withProps(item.art, { missing: item.part })] }, options: artOptions(slots.map(only)),
    }
  })
}

/* ---------- 11. differences ---------- */

const diffKey = (id: string) => `diff:${id}`
export const diffAccepts = (key: string) => key.startsWith('diff:')

/** Applies a scene's changes to its items: removed → null, recolored → props.color, mirrored → props.facing flipped. */
export function applyChanges(scene: DiffScene): DiffQ['right'] {
  return scene.items.map((it, index) => {
    const change = scene.changes.find(c => c.index === index)?.change
    if (change === undefined) return it
    if (change === 'remove') return null
    if (change === 'mirror') return { ...it, art: withProps(it.art, { facing: it.art.props?.facing === 'left' ? 'right' : 'left' }) }
    return { ...it, art: withProps(it.art, { color: change.color }) }
  })
}

export function diffQuestion(ctx: GenContext, scenes: readonly DiffScene[]): DiffQ {
  return make(ctx, scenes, s => diffKey(s.id), s => {
    const indexes = s.changes.map(c => c.index)
    if (!indexes.length || new Set(indexes).size !== indexes.length || indexes.some(i => !s.items[i])) return null
    const right = applyChanges(s)
    // A change that leaves the drawing as it was is not a difference.
    if (indexes.some(i => right[i] && artKey(right[i]!.art) === artKey(s.items[i]!.art))) return null
    return {
      itemKey: diffKey(s.id), answer: [...indexes].sort((a, b) => a - b), say: T.differences, instruction: T.differences, left: s.items, right,
    }
  })
}

/* ---------- 12. maze ---------- */

const mazeKey = (id: string) => `maze:${id}`
export const mazeAccepts = (key: string) => key.startsWith('maze:')

/** True when 'S' reaches 'G' through '.' cells; the maze must be rectangular with one S and one G. */
export function mazeSolvable(rows: readonly string[]): boolean {
  const w = rows[0]?.length ?? 0
  if (!w || rows.some(r => r.length !== w)) return false
  const cells = rows.flatMap((r, y) => [...r].map((ch, x) => ({ ch, x, y })))
  const start = cells.filter(c => c.ch === 'S')
  const goal = cells.filter(c => c.ch === 'G')
  if (start.length !== 1 || goal.length !== 1) return false
  const seen = new Set([`${start[0]!.x},${start[0]!.y}`])
  const queue: [number, number][] = [[start[0]!.x, start[0]!.y]]
  for (const [x, y] of queue)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const [nx, ny] = [x + dx, y + dy]
      const ch = rows[ny]?.[nx]
      if (ch === undefined || ch === '#' || seen.has(`${nx},${ny}`)) continue
      if (ch === 'G') return true
      seen.add(`${nx},${ny}`)
      queue.push([nx, ny])
    }
  return false
}

const area = (m: MazeDef) => m.rows.length * (m.rows[0]?.length ?? 0)

/** Smaller mazes first: fresh mazes are tried by ascending size (ties shuffled), so a round climbs from easy to hard. */
export function mazeQuestion(ctx: GenContext, mazes: readonly MazeDef[]): MazeQ {
  return make(ctx, mazes, m => mazeKey(m.id), m => {
    if (!mazeSolvable(m.rows)) return null
    return { itemKey: mazeKey(m.id), answer: null, say: T.maze, instruction: T.maze, maze: m }
  }, ms => shuffle(ctx.rng, ms).sort((a, b) => area(a) - area(b)))
}
