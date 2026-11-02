import { describe, expect, it } from 'vitest'
import { seeded } from '../../core/engine/random'
import type { GenContext, PhraseRef } from '../../core/engine/types'
import type { ArtRef, PickOption, PickQ } from '../../ui/pick/types'
import { POSITIONS, SCENE, artSpec } from './art/catalog'
import {
  applyChanges, diffAccepts, diffQuestion, mazeAccepts, mazeQuestion, mazeSolvable, memoryAccepts, memoryQuestion, memoryQuestionFor, missingAccepts,
  missingQuestion, oddAccepts, oddOneQuestion, patternAccepts, patternQuestion, sequenceAccepts, sequenceQuestion, shadowAccepts, shadowQuestion,
  sortAccepts, sortQuestion, symGridAccepts, symGridQuestion, symmetryAccepts, symmetryQuestion, twinAccepts, twinQuestion, whereAccepts,
  whereQuestion,
} from './generators'
import { T, artPhrase, sequencePhrase, wherePhrase } from './ids'
import type {
  DiffScene, MazeDef, MemoryTheme, MissingItem, OddSet, PatternDef, SequenceSet, ShadowSet, SortBoard, SymmetryItem, TwinSet, WhereScene,
} from './types'

/* ---------- fixtures ---------- */

const art = (name: string, props?: ArtRef['props']): ArtRef => ({ name, ...(props ? { props } : {}) })
const ODD: OddSet[] = [
  { id: 'dog-dir', by: 'facing', base: art('dog', { facing: 'left' }), odd: art('dog', { facing: 'right' }) },
  { id: 'ball-col', by: 'color', base: art('ball', { color: 'red' }), odd: art('ball', { color: 'blue' }) },
  { id: 'cat-size', by: 'size', base: art('cat'), odd: art('cat', { scale: 0.6 }) },
]
const TWINS: TwinSet[] = [
  { id: 't1', sample: art('house', { color: 'red' }), decoys: [art('house', { color: 'red', missing: 'door' }), art('house', { color: 'red', missing: 'window' }), art('house', { color: 'red', missing: 'chimney' })] },
  { id: 't2', sample: art('car'), decoys: [art('car', { missing: 'wheel' }), art('car', { missing: 'light' }), art('car', { missing: 'window' })] },
]
const SHADOWS: ShadowSet[] = [
  { id: 's1', object: art('dog', { scale: 0.8 }), decoys: [art('cat'), art('rabbit')] },
  { id: 's2', object: art('apple'), decoys: [art('pear'), art('ball')] },
]
const PATTERNS: PatternDef[] = [
  { id: 'ab', kind: 'repeat', unit: [art('circle', { color: 'red' }), art('square', { color: 'blue' })] },
  { id: 'aab', kind: 'repeat', unit: [art('apple'), art('apple'), art('pear')] },
  { id: 'abb', kind: 'repeat', unit: [art('star'), art('heart'), art('heart')] },
  { id: 'abc', kind: 'repeat', unit: [art('dog'), art('cat'), art('fish')] },
  { id: 'grow-red', kind: 'grow', unit: [art('circle', { color: 'red' })] },
  { id: 'grow-star', kind: 'grow', unit: [art('star')] },
]
const WHERE: WhereScene[] = ['ball', 'cat', 'dog', 'cup'].flatMap((a, i) => POSITIONS.map(rel => ({ id: `${a}-${rel}-${i}`, a, b: 'table', rel })))
const THEMES: MemoryTheme[] = [
  { id: 'animals', faces: [art('dog'), art('cat'), art('fish'), art('bird'), art('duck'), art('rabbit'), art('mouse')] },
  { id: 'emoji', faces: ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑'] },
]
const SYM: SymmetryItem[] = [
  { id: 'butterfly', art: art('butterfly', { color: 'red' }) },
  { id: 'house', art: art('house', { color: 'blue' }) },
  { id: 'tree', art: art('tree') },
  { id: 'sun', art: art('sun') },
  { id: 'dog', art: art('dog') }, // not symmetric: must never be asked
]
const SEQS: SequenceSet[] = [
  { id: 'plant', steps: ['🌰', '🌱', '🌷'] },
  { id: 'egg', steps: ['🥚', '🐣', '🐥', '🐔'] },
]
const BOARDS: SortBoard[] = [
  { id: 'fv', bins: ['🍎', '🚗'], cards: [...['🍌', '🍇', '🍓', '🍒'].map(emoji => ({ emoji, bin: 0 as const })), ...['🚌', '🚲', '✈️', '🚂'].map(emoji => ({ emoji, bin: 1 as const }))] },
  { id: 'small', bins: ['🐶', '🌳'], cards: [{ emoji: '🐱', bin: 0 }, { emoji: '🌲', bin: 1 }] },
]
const MISSING: MissingItem[] = [
  { id: 'chair', art: art('chair'), part: 'leg', wrong: ['back', 'leg2'] },
  { id: 'face', art: art('face'), part: 'eye', wrong: ['nose', 'mouth'] },
  { id: 'house', art: art('house', { color: 'red' }), part: 'door', wrong: ['window', 'chimney'] },
]
const DIFFS: DiffScene[] = [
  {
    id: 'd1',
    items: [{ art: art('dog', { facing: 'left' }), x: 20, y: 50 }, { art: art('ball', { color: 'red' }), x: 50, y: 50 }, { art: art('tree'), x: 80, y: 40 }, { art: art('cat'), x: 60, y: 80 }],
    changes: [{ index: 3, change: 'mirror' }, { index: 1, change: { color: 'blue' } }, { index: 2, change: 'remove' }],
  },
  {
    id: 'd2',
    items: [{ art: art('sun'), x: 10, y: 10 }, { art: art('car', { facing: 'right' }), x: 50, y: 70 }, { art: art('cloud'), x: 70, y: 20 }],
    changes: [{ index: 0, change: 'remove' }, { index: 1, change: 'mirror' }],
  },
]
const MAZES: MazeDef[] = [
  { id: 'big', rows: ['S.#####', '#.#...#', '#.#.#.#', '#...#.#', '###.#.#', '#...#.#', '#.###.G'].map(r => r), hero: '🐭', goal: '🧀' },
  { id: 'small', rows: ['S.#..', '#.#.#', '#...#', '#.###', '#...G'], hero: '🐭', goal: '🧀' },
  { id: 'unsolvable', rows: ['S#G'], hero: '🐭', goal: '🧀' },
]

const KNOWN = new Set<string>([
  ...Object.values(T), ...WHERE.map(w => wherePhrase(w.id)),
  ...SEQS.flatMap(s => s.steps.map((_, n) => sequencePhrase(s.id, n))),
  ...['dog', 'cat', 'rabbit', 'apple', 'pear', 'ball'].map(artPhrase),
])

/* ---------- utilities ---------- */

const ctx = (seed: number, avoid: string[] = [], review?: string): GenContext => ({ rng: seeded(seed), avoid: new Set(avoid), review })
const SEEDS = Array.from({ length: 250 }, (_, i) => i + 1)
const each = <Q>(gen: (c: GenContext) => Q, fn: (q: Q, seed: number) => void) => {
  for (const seed of SEEDS) fn(gen(ctx(seed)), seed)
}
const ids = (ref: PhraseRef | undefined) => (ref === undefined ? [] : typeof ref === 'string' ? [ref] : [...ref])
const expectKnown = (refs: (PhraseRef | undefined)[]) => {
  for (const p of refs.flatMap(ids)) expect(KNOWN.has(p), p).toBe(true)
}
const key = (a: ArtRef) => JSON.stringify([a.name, Object.entries(a.props ?? {}).sort()])
const artOf = (o: PickOption) => (o as { art: ArtRef }).art
const byId = (q: PickQ, id: string) => q.options.find(o => o.id === id)!

function expectPick(q: PickQ, options: number) {
  expect(q.options).toHaveLength(options)
  expect(new Set(q.options.map(o => o.id)).size).toBe(options)
  expect(q.options.filter(o => o.id === q.answer)).toHaveLength(1)
  expectKnown([q.say, q.instruction, q.hint, ...q.options.map(o => ('say' in o ? o.say : undefined))])
}

/* ---------- tests ---------- */

describe('odd one out', () => {
  it('has 4 art options, one odd, whose slot varies', () => {
    const slots = new Set<string>()
    each(c => oddOneQuestion(c, ODD), q => {
      expectPick(q, 4)
      expect(q.prompt).toEqual({})
      const set = ODD.find(s => oddKey(s) === q.itemKey)!
      expect(key(artOf(byId(q, q.answer)))).toBe(key(set.odd))
      const others = q.options.filter(o => o.id !== q.answer).map(o => key(artOf(o)))
      expect(others).toEqual([key(set.base), key(set.base), key(set.base)])
      slots.add(q.answer)
    })
    expect([...slots].sort()).toEqual(['a', 'b', 'c', 'd'])
  })
  it('honours avoid and review', () => {
    expect(oddOneQuestion(ctx(1, ['odd:dog-dir', 'odd:ball-col']), ODD).itemKey).toBe('odd:cat-size')
    expect(oddOneQuestion(ctx(1, [], 'odd:ball-col'), ODD).itemKey).toBe('odd:ball-col')
    expect(oddAccepts('odd:x')).toBe(true)
    expect(oddAccepts('twin:x')).toBe(false)
  })
})
const oddKey = (s: OddSet) => `odd:${s.id}`

describe('twin', () => {
  it('shows the sample and hides its identical copy among distinct decoys', () => {
    const slots = new Set<string>()
    each(c => twinQuestion(c, TWINS), q => {
      expectPick(q, 4)
      const set = TWINS.find(s => `twin:${s.id}` === q.itemKey)!
      const sample = q.prompt.art![0]!
      expect(key(sample)).toBe(key(set.sample))
      expect(key(artOf(byId(q, q.answer)))).toBe(key(sample))
      expect(new Set(q.options.map(o => key(artOf(o)))).size).toBe(4)
      expect(q.options.filter(o => key(artOf(o)) === key(sample))).toHaveLength(1)
      slots.add(q.answer)
    })
    expect(slots.size).toBe(4)
    expect(twinAccepts('twin:t1')).toBe(true)
  })
  it('rejects a decoy equal to the sample', () => {
    const bad: TwinSet = { id: 'bad', sample: art('car'), decoys: [art('car'), art('car', { missing: 'wheel' }), art('car', { missing: 'light' })] }
    expect(() => twinQuestion(ctx(1), [bad])).toThrow()
  })
})

describe('shadows', () => {
  it('goes both ways, silhouettes match exactly and have equal size', () => {
    const dirs = new Set<string>()
    each(c => shadowQuestion(c, SHADOWS), q => {
      expectPick(q, 3)
      const set = SHADOWS.find(s => `shadow:${s.id}` === q.itemKey)!
      const promptArt = q.prompt.art![0]!
      const sil = (a: ArtRef) => a.props?.silhouette === true
      if (sil(promptArt)) {
        dirs.add('toObject')
        expect(promptArt.name).toBe(set.object.name)
        expect(q.options.every(o => !sil(artOf(o)))).toBe(true)
        expect(artOf(byId(q, q.answer)).name).toBe(set.object.name)
        expect(q.instruction).toBe(T.shadow)
      } else {
        dirs.add('toShadow')
        expect(q.options.every(o => sil(artOf(o)))).toBe(true)
        expect(artOf(byId(q, q.answer)).name).toBe(set.object.name)
        expect(q.options.every(o => !('say' in o))).toBe(true)
        expect(q.instruction).toBe(T.shadowOf)
      }
      expect(new Set(q.options.map(o => artOf(o).name)).size).toBe(3)
      for (const a of [promptArt, ...q.options.map(artOf)]) expect(a.props).not.toHaveProperty('scale')
    })
    expect(dirs.size).toBe(2)
    expect(shadowAccepts('shadow:s1')).toBe(true)
  })
})

describe('patterns', () => {
  it('repeat: 5–8 items then a slot, exactly one correct continuation', () => {
    const lengths = new Set<number>()
    each(c => patternQuestion(c, PATTERNS), q => {
      expectPick(q, 3)
      const p = PATTERNS.find(x => `pattern:${x.id}` === q.itemKey)!
      if (p.kind === 'grow') return
      const shown = q.prompt.art!
      expect(shown.at(-1)).toEqual({ name: '?' })
      const seq = shown.slice(0, -1)
      lengths.add(seq.length)
      expect(seq.length).toBeGreaterThanOrEqual(5)
      expect(seq.length).toBeLessThanOrEqual(8)
      seq.forEach((a, i) => expect(key(a)).toBe(key(p.unit[i % p.unit.length]!)))
      const next = p.unit[seq.length % p.unit.length]!
      const right = q.options.filter(o => key(artOf(o)) === key(next))
      expect(right).toHaveLength(1)
      expect(right[0]!.id).toBe(q.answer)
      expect(new Set(q.options.map(o => key(artOf(o)))).size).toBe(3)
      const unitKeys = new Set(p.unit.map(key))
      expect(q.options.filter(o => unitKeys.has(key(artOf(o)))).length).toBeGreaterThanOrEqual(2)
    })
    expect(lengths).toEqual(new Set([5, 6, 7, 8]))
  })
  it('grow: rows 1..k then a slot; the answer is k+1 objects', () => {
    let grows = 0
    each(c => patternQuestion(c, PATTERNS.filter(p => p.kind === 'grow')), q => {
      grows++
      const groups = q.prompt.objects!
      const shown = groups.slice(0, -1)
      expect(shown.map(g => g.count)).toEqual(shown.map((_, i) => i + 1))
      expect(shown.length).toBeGreaterThanOrEqual(3)
      expect(new Set(shown.map(g => g.emoji)).size).toBe(1)
      expect(groups.at(-1)).toMatchObject({ emoji: '❓', count: 1 })
      const counts = q.options.map(o => (o as { group: { count: number; emoji: string } }).group)
      expect(new Set(counts.map(g => g.count)).size).toBe(3)
      expect(counts.every(g => g.emoji === shown[0]!.emoji)).toBe(true)
      expect(counts.find((_, i) => q.options[i]!.id === q.answer)!.count).toBe(shown.length + 1)
      expect(counts.every(g => g.count >= 1)).toBe(true)
    })
    expect(grows).toBe(SEEDS.length)
  })
  it('skips a grow pattern with no countable emoji', () => {
    const odd: PatternDef = { id: 'g', kind: 'grow', unit: [art('dog')] }
    expect(() => patternQuestion(ctx(1), [odd])).toThrow()
    expect(patternAccepts('pattern:ab')).toBe(true)
  })
})

describe('where', () => {
  it('shows the same a and b with three distinct positions, the right one included', () => {
    each(c => whereQuestion(c, WHERE), q => {
      expectPick(q, 3)
      const s = WHERE.find(x => `where:${x.id}` === q.itemKey)!
      expect(q.say).toBe(wherePhrase(s.id))
      const props = q.options.map(o => artOf(o).props as { a: string; b: string; rel: string })
      expect(q.options.every(o => artOf(o).name === SCENE)).toBe(true)
      expect(props.every(p => p.a === s.a && p.b === s.b)).toBe(true)
      expect(new Set(props.map(p => p.rel)).size).toBe(3)
      expect((byId(q, q.answer) as { art: ArtRef }).art.props!.rel).toBe(s.rel)
      const rels = props.map(p => p.rel)
      expect(rels.includes('on') && rels.includes('above')).toBe(false)
      expect(q.options.every(o => !('say' in o))).toBe(true)
    })
    expect(whereAccepts('where:x')).toBe(true)
  })
})

describe('memory', () => {
  it('has 2×pairs shuffled cards, each face exactly twice', () => {
    for (const pairs of [3, 4, 6]) {
      let sorted = 0
      each(c => memoryQuestion(c, THEMES, pairs), q => {
        expect(q.cards).toHaveLength(pairs * 2)
        expect(new Set(q.cards.map(c => c.id)).size).toBe(pairs * 2)
        const faces = new Map<string, number>()
        for (const c of q.cards) faces.set(typeof c.face === 'string' ? c.face : key(c.face), (faces.get(typeof c.face === 'string' ? c.face : key(c.face)) ?? 0) + 1)
        expect(faces.size).toBe(pairs)
        expect([...faces.values()].every(n => n === 2)).toBe(true)
        expect(q.answer).toBeNull()
        if (q.cards.every((c, i) => i % 2 === 0 || c.id.slice(0, -1) === q.cards[i - 1]!.id.slice(0, -1))) sorted++
      })
      expect(sorted).toBeLessThan(SEEDS.length / 4)
    }
    expect(memoryQuestionFor(5)(ctx(1), THEMES).cards).toHaveLength(10)
    expect(memoryAccepts('memory:animals')).toBe(true)
  })
  it('skips themes too small for the board', () => {
    expect(memoryQuestion(ctx(1), THEMES, 7).itemKey).toBe('memory:animals')
    expect(() => memoryQuestion(ctx(1), THEMES, 8)).toThrow()
  })
})

describe('symmetry', () => {
  it('shows the right half; exactly one of 3 left halves matches', () => {
    each(c => symmetryQuestion(c, SYM), q => {
      expectPick(q, 3)
      const item = SYM.find(s => `sym:${s.id}` === q.itemKey)!
      expect(item.id).not.toBe('dog')
      expect(artSpec(item.art.name)?.symmetric).toBe(true)
      expect(q.prompt.art).toEqual([{ ...item.art, props: { ...item.art.props, half: 'right' } }])
      expect(q.options.every(o => artOf(o).props?.half === 'left')).toBe(true)
      const want = key({ ...item.art, props: { ...item.art.props, half: 'left' } })
      expect(q.options.filter(o => key(artOf(o)) === want)).toHaveLength(1)
      expect(key(artOf(byId(q, q.answer)))).toBe(want)
      expect(new Set(q.options.map(o => key(artOf(o)))).size).toBe(3)
    })
    expect(symmetryAccepts('sym:tree')).toBe(true)
  })
  it('uses a different color for a colorable drawing that has one', () => {
    let recolored = 0
    each(c => symmetryQuestion(c, [SYM[0]!, SYM[2]!]), q => {
      if (q.itemKey === 'sym:butterfly') {
        recolored += q.options.filter(o => artOf(o).name === 'butterfly' && artOf(o).props?.color !== 'red').length > 0 ? 1 : 0
        expect(q.options.filter(o => artOf(o).name === 'butterfly' && artOf(o).props?.color === 'red')).toHaveLength(1)
      }
    })
    expect(recolored).toBeGreaterThan(0)
  })
})

describe('symmetry grid', () => {
  it('answer mirrors the given cells across the vertical axis', () => {
    const sizes = new Set<number>()
    each(symGridQuestion, q => {
      sizes.add(q.rows)
      expect(q.cols).toBe(q.rows)
      expect([4, 6]).toContain(q.rows)
      expect(q.given.length).toBeGreaterThanOrEqual(3)
      expect(q.given.every(([r, c]) => r >= 0 && r < q.rows && c >= 0 && c < q.cols / 2)).toBe(true)
      expect(new Set(q.given.map(String)).size).toBe(q.given.length)
      expect(new Set(q.answer.map(String))).toEqual(new Set(q.given.map(([r, c]) => String([r, q.cols - 1 - c]))))
      expect(q.answer.every(([, c]) => c >= q.cols / 2)).toBe(true)
      expect(q.color).toBeTruthy()
    })
    expect(sizes).toEqual(new Set([4, 6]))
    expect(symGridAccepts('symgrid:4')).toBe(true)
    expect(symGridAccepts('symgrid:5')).toBe(false)
  })
})

describe('sequence', () => {
  it('shuffles tiles, never already in order; answer is the order', () => {
    each(c => sequenceQuestion(c, SEQS), q => {
      const s = SEQS.find(x => `seq:${x.id}` === q.itemKey)!
      expect(q.layout).toBe('units')
      expect(q.answer).toEqual(s.steps.map((_, n) => `${s.id}.${n}`))
      expect(q.tiles.map(t => t.id)).not.toEqual(q.answer)
      expect([...q.tiles.map(t => t.id)].sort()).toEqual([...q.answer].sort())
      for (const t of q.tiles) {
        const n = Number(t.id.split('.')[1])
        expect(t.text).toBe(s.steps[n])
        expect(t.say).toBe(sequencePhrase(s.id, n))
      }
      expectKnown([q.say, q.instruction, ...q.tiles.map(t => t.say)])
    })
    expect(sequenceAccepts('seq:plant')).toBe(true)
  })
})

describe('sorting', () => {
  it('puts every card in its basket, both baskets used, sides vary', () => {
    const flips = new Set<string>()
    each(c => sortQuestion(c, BOARDS), q => {
      const board = BOARDS.find(b => `sort:${b.id}` === q.itemKey)!
      flips.add(`${board.id}:${q.bins[0] === board.bins[0]}`)
      const binOf = (emoji: string) => board.cards.find(c => c.emoji === emoji)!.bin
      expect(q.cards.length).toBeLessThanOrEqual(6)
      expect(new Set(q.cards.map(c => c.bin)).size).toBe(2)
      for (const c of q.cards) {
        const home = binOf(c.emoji)
        expect(q.bins[c.bin]).toBe(board.bins[home])
        expect(c.say).toEqual([])
      }
      expect(new Set(q.cards.map(c => c.id)).size).toBe(q.cards.length)
      expect(q.answer).toBeNull()
      expectKnown([q.say])
    })
    expect(flips.size).toBe(4)
    expect(sortAccepts('sort:fv')).toBe(true)
  })
  it('takes at most 3 cards per basket', () => {
    const q = sortQuestion(ctx(1, [], 'sort:fv'), BOARDS)
    expect(q.cards).toHaveLength(6)
  })
})

describe('what is missing', () => {
  it('shows the drawing minus a part; options are the parts alone, one correct', () => {
    const items = MISSING.filter(m => m.id !== 'chair') // 'leg2' is not a part: such items are skipped
    each(c => missingQuestion(c, MISSING), q => {
      expectPick(q, 3)
      const item = items.find(m => `missing:${m.id}` === q.itemKey)!
      expect(item).toBeDefined()
      expect(q.prompt.art).toEqual([{ ...item.art, props: { ...item.art.props, missing: item.part } }])
      const onlys = q.options.map(o => artOf(o).props!.only)
      expect(new Set(onlys).size).toBe(3)
      expect(artOf(byId(q, q.answer)).props!.only).toBe(item.part)
      expect(q.options.every(o => artOf(o).name === item.art.name)).toBe(true)
      expect(onlys.filter(p => p === item.part)).toHaveLength(1)
      expect(q.options.every(o => !('say' in o))).toBe(true)
    })
    expect(missingAccepts('missing:face')).toBe(true)
  })
})

describe('differences', () => {
  it('applies the changes to the right copy and answers their indexes', () => {
    each(c => diffQuestion(c, DIFFS), q => {
      const scene = DIFFS.find(s => `diff:${s.id}` === q.itemKey)!
      expect(q.left).toBe(scene.items)
      expect(q.right).toHaveLength(scene.items.length)
      const changed = q.right.map((r, i) => (r === null || key(r.art) !== key(scene.items[i]!.art) ? i : -1)).filter(i => i >= 0)
      expect(changed).toEqual([...q.answer])
      expect([...q.answer]).toEqual(scene.changes.map(c => c.index).sort((a, b) => a - b))
      for (const ch of scene.changes) {
        const r = q.right[ch.index]
        if (ch.change === 'remove') expect(r).toBeNull()
        else if (ch.change === 'mirror') expect(r!.art.props!.facing).not.toBe(scene.items[ch.index]!.art.props?.facing ?? 'right')
        else expect(r!.art.props!.color).toBe(ch.change.color)
      }
    })
    expect(applyChanges(DIFFS[1]!)[0]).toBeNull()
    expect(applyChanges(DIFFS[1]!)[1]!.art.props!.facing).toBe('left')
    expect(diffAccepts('diff:d1')).toBe(true)
  })
  it('rejects a change that changes nothing', () => {
    const same: DiffScene = { id: 'same', items: [{ art: art('ball', { color: 'red' }), x: 1, y: 1 }], changes: [{ index: 0, change: { color: 'red' } }] }
    expect(() => diffQuestion(ctx(1), [same])).toThrow()
  })
})

describe('maze', () => {
  it('only asks solvable mazes, smaller first', () => {
    expect(mazeSolvable(MAZES[0]!.rows) && mazeSolvable(MAZES[1]!.rows)).toBe(true)
    expect(mazeSolvable(MAZES[2]!.rows)).toBe(false)
    expect(mazeSolvable(['S.', '.'])).toBe(false)
    each(c => mazeQuestion(c, MAZES), q => {
      expect(q.maze.id).not.toBe('unsolvable')
      expect(mazeSolvable(q.maze.rows)).toBe(true)
      expect(q.answer).toBeNull()
      expectKnown([q.say, q.instruction])
    })
    expect(mazeQuestion(ctx(3), MAZES).maze.id).toBe('small')
    expect(mazeQuestion(ctx(3, ['maze:small']), MAZES).maze.id).toBe('big')
    expect(mazeAccepts('maze:small')).toBe(true)
  })
})
