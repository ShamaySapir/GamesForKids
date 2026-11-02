import { describe, expect, it } from 'vitest'
import type { ArtRef } from '../../ui/pick/types'
import { ART, COLORS, POSITIONS, artSpec } from './art/catalog'
import { DIFF_SCENES } from './content/differences'
import { MAZES } from './content/mazes'
import { MEMORY_THEMES } from './content/memory'
import { MISSING_ITEMS } from './content/missing'
import { NAMES, PART_NAMES, REFERENCE_FORMS, partPhrase } from './content/names'
import { ODD_SETS } from './content/odd'
import { PATTERNS } from './content/patterns'
import { SEQUENCES, SEQUENCE_TEXT } from './content/sequences'
import { SHADOW_SETS } from './content/shadows'
import { BIN_TEXT, SORT_BOARDS } from './content/sorting'
import { SYMMETRY_ITEMS } from './content/symmetry'
import { TWIN_SETS } from './content/twins'
import { WHERE_SCENES } from './content/where'
import { artPhrase, binPhrase, sequencePhrase, T, wherePhrase } from './ids'
import { phrases } from './phrases'

const colors: readonly string[] = COLORS
const ALLOWED = new Set(['facing', 'color', 'scale', 'half', 'missing'])
const GROW_ART = new Set(['circle', 'square', 'heart', 'star', 'sun', 'apple', 'ball', 'flower', 'cupcake', 'fish'])
const key = (r: ArtRef) => JSON.stringify([r.name, Object.entries(r.props ?? {}).sort()])
const unique = (xs: readonly string[]) => new Set(xs).size === xs.length

function checkRef(r: ArtRef, where: string) {
  const spec = artSpec(r.name)
  expect(spec, `${where}: unknown drawing ${r.name}`).toBeDefined()
  if (!spec) return
  for (const [k, v] of Object.entries(r.props ?? {})) {
    expect(ALLOWED.has(k), `${where}: prop ${k}`).toBe(true)
    if (k === 'facing') {
      expect(spec.facing, `${where}: facing on ${r.name}`).toBe(true)
      expect(['left', 'right']).toContain(v)
    }
    if (k === 'color') {
      expect(spec.colorable, `${where}: color on ${r.name}`).toBe(true)
      expect(colors).toContain(v)
    }
    if (k === 'half') expect(spec.symmetric, `${where}: half on ${r.name}`).toBe(true)
    if (k === 'scale') expect(v).toBeGreaterThanOrEqual(0.5)
    if (k === 'missing') expect(spec.parts ?? [], `${where}: missing ${String(v)}`).toContain(v)
  }
}

const propsOf = (r: ArtRef): Record<string, string | number | boolean> => ({ ...(r.props ?? {}) })
const diffKeys = (a: ArtRef, b: ArtRef) => {
  const pa = propsOf(a)
  const pb = propsOf(b)
  return [...new Set([...Object.keys(pa), ...Object.keys(pb)])].filter(k => pa[k] !== pb[k])
}

const isHebrewWord = (w: string) => /[א-ת]/.test(w)
const hasVowel = (w: string) => /[ְ-ֻ]/.test(w) || /וּ/.test(w)
const hebrewWords = (text: string) => text.split(/[\s־]+/).map(w => w.replace(/[.,?!":]/g, '')).filter(isHebrewWord)

describe('counts', () => {
  it('has enough content', () => {
    expect(ODD_SETS.length).toBeGreaterThanOrEqual(30)
    for (const by of ['facing', 'color', 'size', 'shape', 'kind'] as const)
      expect(ODD_SETS.filter(s => s.by === by).length, by).toBeGreaterThanOrEqual(6)
    expect(TWIN_SETS.length).toBeGreaterThanOrEqual(12)
    expect(SHADOW_SETS.length).toBeGreaterThanOrEqual(20)
    for (const p of ['ab', 'aab', 'abb', 'abc'])
      expect(PATTERNS.filter(x => x.kind === 'repeat' && x.id.startsWith(p + '-')).length, p).toBeGreaterThanOrEqual(6)
    expect(PATTERNS.filter(x => x.kind === 'grow').length).toBeGreaterThanOrEqual(6)
    for (const pos of POSITIONS) expect(WHERE_SCENES.filter(s => s.rel === pos).length, pos).toBeGreaterThanOrEqual(6)
    expect(MEMORY_THEMES.length).toBeGreaterThanOrEqual(6)
    expect(SYMMETRY_ITEMS.length).toBeGreaterThanOrEqual(12)
    expect(SEQUENCES.length).toBeGreaterThanOrEqual(12)
    expect(SORT_BOARDS.length).toBeGreaterThanOrEqual(12)
    expect(MISSING_ITEMS.length).toBeGreaterThanOrEqual(12)
    expect(DIFF_SCENES.length).toBeGreaterThanOrEqual(8)
    expect(MAZES.length).toBeGreaterThanOrEqual(10)
  })

  it('has unique ids', () => {
    for (const list of [ODD_SETS, TWIN_SETS, SHADOW_SETS, PATTERNS, WHERE_SCENES, MEMORY_THEMES, SYMMETRY_ITEMS, SEQUENCES, SORT_BOARDS, MISSING_ITEMS, DIFF_SCENES, MAZES])
      expect(unique(list.map(x => x.id))).toBe(true)
  })
})

describe('odd one out', () => {
  it('uses valid drawings and differs in exactly the declared property', () => {
    for (const s of ODD_SETS) {
      checkRef(s.base, s.id)
      checkRef(s.odd, s.id)
      const keys = diffKeys(s.base, s.odd)
      if (s.by === 'facing') {
        expect(s.base.name, s.id).toBe(s.odd.name)
        expect(keys, s.id).toEqual(['facing'])
        expect(s.base.props?.facing, s.id).toBeDefined()
      } else if (s.by === 'color') {
        expect(s.base.name, s.id).toBe(s.odd.name)
        expect(keys, s.id).toEqual(['color'])
        expect(s.base.props?.color, s.id).toBeDefined()
      } else if (s.by === 'size') {
        expect(s.base.name, s.id).toBe(s.odd.name)
        expect(keys, s.id).toEqual(['scale'])
        expect(s.base.props?.scale ?? 1).toBe(1)
        const scale = Number(s.odd.props?.scale)
        expect(scale, s.id).toBeGreaterThanOrEqual(0.55)
        expect(scale, s.id).toBeLessThanOrEqual(0.65)
      } else if (s.by === 'shape') {
        expect(artSpec(s.base.name)?.kind, s.id).toBe('shape')
        expect(artSpec(s.odd.name)?.kind, s.id).toBe('shape')
        expect(s.base.name, s.id).not.toBe(s.odd.name)
        expect(s.base.props?.color, s.id).toBeDefined()
        expect(s.base.props?.color, s.id).toBe(s.odd.props?.color)
      } else {
        expect(artSpec(s.base.name)?.kind, s.id).not.toBe(artSpec(s.odd.name)?.kind)
        expect(s.base.props?.scale).toBeUndefined()
        expect(s.odd.props?.scale).toBeUndefined()
      }
    }
  })
})

describe('twins', () => {
  it('decoys differ from the sample by one detail and from each other', () => {
    for (const t of TWIN_SETS) {
      checkRef(t.sample, t.id)
      expect(t.sample.props?.missing, t.id).toBeUndefined()
      const keys = t.decoys.map(key)
      expect(new Set([key(t.sample), ...keys]).size, t.id).toBe(4)
      for (const d of t.decoys) {
        checkRef(d, t.id)
        expect(d.name, t.id).toBe(t.sample.name)
        const changed = diffKeys(t.sample, d)
        expect(changed.length, t.id).toBe(1)
        expect(['missing', 'color']).toContain(changed[0])
      }
    }
  })
})

describe('shadows', () => {
  it('uses three different drawings of the same kind', () => {
    for (const s of SHADOW_SETS) {
      for (const r of [s.object, ...s.decoys]) checkRef(r, s.id)
      expect(new Set([s.object.name, ...s.decoys.map(d => d.name)]).size, s.id).toBe(3)
    }
  })
})

describe('patterns', () => {
  it('has distinct units of the right length and letters', () => {
    for (const p of PATTERNS) {
      for (const r of p.unit) checkRef(r, p.id)
      if (p.kind === 'grow') {
        expect(p.unit.length, p.id).toBe(1)
        const first = p.unit[0] as ArtRef
        expect(GROW_ART.has(first.name), `${p.id}: ${first.name}`).toBe(true)
        if (['circle', 'square', 'heart'].includes(first.name)) expect(first.props?.color, p.id).toBeDefined()
        continue
      }
      const letters = p.id.split('-')[0] as string
      expect(['ab', 'aab', 'abb', 'abc'], p.id).toContain(letters)
      expect(p.unit.length, p.id).toBe(letters.length)
      // The unit's shape must follow its letters: equal letters = identical drawings, different letters = distinct.
      for (let i = 0; i < letters.length; i++)
        for (let j = i + 1; j < letters.length; j++)
          expect(key(p.unit[i] as ArtRef) === key(p.unit[j] as ArtRef), `${p.id} ${i}/${j}`).toBe(letters[i] === letters[j])
    }
  })
})

describe('where', () => {
  it('uses catalog drawings and sensible reference objects', () => {
    for (const s of WHERE_SCENES) {
      expect(artSpec(s.a), s.id).toBeDefined()
      expect(artSpec(s.b), s.id).toBeDefined()
      expect(s.a).not.toBe(s.b)
      expect(REFERENCE_FORMS[s.b], `${s.id}: ${s.b} is not a reference object`).toBeDefined()
      expect(NAMES[s.a], s.id).toBeDefined()
    }
  })

  it('says the position words correctly', () => {
    const text = (id: string) => phrases[wherePhrase(id)]
    expect(text('on-ball-table')).toBe('אֵיפֹה הַכַּדּוּר? עַל הַשֻּׁלְחָן')
    expect(text('under-ball-chair')).toBe('אֵיפֹה הַכַּדּוּר? מִתַּחַת לַכִּסֵּא')
    expect(text('in-ball-box')).toBe('אֵיפֹה הַכַּדּוּר? בְּתוֹךְ הַקֻּפְסָה')
    expect(text('next-to-cat-tree')).toBe('אֵיפֹה הֶחָתוּל? לְיַד הָעֵץ')
    expect(text('between-cat-tree')).toBe('אֵיפֹה הֶחָתוּל? בֵּין שְׁנֵי הָעֵצִים')
    expect(text('between-mouse-box')).toBe('אֵיפֹה הָעַכְבָּר? בֵּין שְׁתֵּי הַקֻּפְסָאוֹת')
    expect(text('in-front-dog-house')).toBe('אֵיפֹה הַכֶּלֶב? לִפְנֵי הַבַּיִת')
    expect(text('behind-dog-house')).toBe('אֵיפֹה הַכֶּלֶב? מֵאֲחוֹרֵי הַבַּיִת')
    expect(text('above-bird-tree')).toBe('אֵיפֹה הַצִּפּוֹר? מֵעַל הָעֵץ')
    expect(text('under-dog-tree')).toBe('אֵיפֹה הַכֶּלֶב? מִתַּחַת לָעֵץ')
  })
})

describe('memory and symmetry', () => {
  it('has at least 6 distinct faces per theme', () => {
    for (const t of MEMORY_THEMES) {
      expect(t.faces.length, t.id).toBeGreaterThanOrEqual(6)
      const keys = t.faces.map(f => (typeof f === 'string' ? f : key(f)))
      expect(unique(keys), t.id).toBe(true)
      for (const f of t.faces) if (typeof f !== 'string') checkRef(f, t.id)
    }
  })

  it('uses symmetric drawings, colored where colorable', () => {
    for (const s of SYMMETRY_ITEMS) {
      checkRef(s.art, s.id)
      const spec = artSpec(s.art.name)
      expect(spec?.symmetric, s.id).toBe(true)
      if (spec?.colorable) expect(s.art.props?.color, s.id).toBeDefined()
    }
    expect(new Set(SYMMETRY_ITEMS.map(s => key(s.art))).size).toBe(SYMMETRY_ITEMS.length)
  })
})

describe('sequences and sorting', () => {
  it('has 3-4 steps with a text for each', () => {
    for (const s of SEQUENCES) {
      expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3)
      expect(s.steps.length, s.id).toBeLessThanOrEqual(4)
      expect(unique(s.steps), s.id).toBe(true)
      expect(SEQUENCE_TEXT[s.id]?.length, s.id).toBe(s.steps.length)
      for (let n = 0; n < s.steps.length; n++) expect(phrases[sequencePhrase(s.id, n)], `${s.id}.${n}`).toBeTruthy()
    }
  })

  it('has boards of 3 + 3 distinct cards and labeled baskets', () => {
    for (const b of SORT_BOARDS) {
      expect(b.cards.filter(c => c.bin === 0).length, b.id).toBe(3)
      expect(b.cards.filter(c => c.bin === 1).length, b.id).toBe(3)
      const emoji = b.cards.map(c => c.emoji)
      expect(unique(emoji), b.id).toBe(true)
      expect(b.bins[0], b.id).not.toBe(b.bins[1])
      for (const bin of b.bins) expect(emoji, `${b.id}: basket picture ${bin} is also a card`).not.toContain(bin)
      expect(BIN_TEXT[b.id], b.id).toBeDefined()
      expect(phrases[binPhrase(b.id, 0)], b.id).toBeTruthy()
      expect(phrases[binPhrase(b.id, 1)], b.id).toBeTruthy()
    }
  })
})

describe('missing part', () => {
  it('has the missing and wrong parts on the drawing, all different', () => {
    for (const m of MISSING_ITEMS) {
      checkRef(m.art, m.id)
      expect(m.art.props?.missing, m.id).toBeUndefined()
      const parts = artSpec(m.art.name)?.parts ?? []
      expect(unique([m.part, ...m.wrong]), m.id).toBe(true)
      for (const p of [m.part, ...m.wrong]) {
        expect(parts, `${m.id}: ${p}`).toContain(p)
        expect(PART_NAMES[p], `${m.id}: ${p}`).toBeDefined()
        expect(phrases[partPhrase(p)]).toBeTruthy()
      }
    }
  })
})

describe('differences', () => {
  it('places 6-10 items without overlap and changes distinct, valid items', () => {
    for (const d of DIFF_SCENES) {
      expect(d.items.length, d.id).toBeGreaterThanOrEqual(6)
      expect(d.items.length, d.id).toBeLessThanOrEqual(10)
      d.items.forEach((it, i) => {
        checkRef(it.art, d.id)
        expect(it.x, d.id).toBeGreaterThanOrEqual(10)
        expect(it.x, d.id).toBeLessThanOrEqual(90)
        expect(it.y, d.id).toBeGreaterThanOrEqual(10)
        expect(it.y, d.id).toBeLessThanOrEqual(90)
        for (let j = i + 1; j < d.items.length; j++) {
          const o = d.items[j] as (typeof d.items)[number]
          expect(Math.max(Math.abs(it.x - o.x), Math.abs(it.y - o.y)), `${d.id}: items ${i}/${j} overlap`).toBeGreaterThanOrEqual(20)
        }
      })
      expect(d.changes.length, d.id).toBeGreaterThanOrEqual(3)
      expect(d.changes.length, d.id).toBeLessThanOrEqual(5)
      expect(unique(d.changes.map(c => String(c.index))), d.id).toBe(true)
      for (const c of d.changes) {
        const item = d.items[c.index] as (typeof d.items)[number]
        expect(item, d.id).toBeDefined()
        const spec = artSpec(item.art.name)
        if (c.change === 'mirror') expect(spec?.facing, `${d.id}: mirror ${item.art.name}`).toBe(true)
        else if (c.change !== 'remove') {
          expect(spec?.colorable, `${d.id}: recolor ${item.art.name}`).toBe(true)
          expect(colors).toContain(c.change.color)
          expect(item.art.props?.color, `${d.id}: needs an explicit color`).toBeDefined()
          expect(item.art.props?.color).not.toBe(c.change.color)
        }
      }
    }
  })
})

describe('mazes', () => {
  function shortest(rows: readonly string[]): number {
    let start: [number, number] | undefined
    rows.forEach((r, y) => {
      if (r.includes('S')) start = [y, r.indexOf('S')]
    })
    if (!start) return -1
    const seen = new Map<string, number>([[start.join(), 0]])
    const queue: [number, number][] = [start]
    while (queue.length) {
      const [y, x] = queue.shift() as [number, number]
      const d = seen.get(`${y},${x}`) as number
      if (rows[y]?.[x] === 'G') return d
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const ny = y + dy
        const nx = x + dx
        if (rows[ny]?.[nx] === undefined) continue
        if (rows[ny]?.[nx] === '#' || seen.has(`${ny},${nx}`)) continue
        seen.set(`${ny},${nx}`, d + 1)
        queue.push([ny, nx])
      }
    }
    return -1
  }

  it('are rectangular, 5x5 to 7x7, have one S and one G and can be solved', () => {
    for (const m of MAZES) {
      const w = (m.rows[0] as string).length
      expect(m.rows.length, m.id).toBeGreaterThanOrEqual(5)
      expect(m.rows.length, m.id).toBeLessThanOrEqual(7)
      expect(w, m.id).toBeGreaterThanOrEqual(5)
      expect(w, m.id).toBeLessThanOrEqual(7)
      for (const r of m.rows) {
        expect(r.length, m.id).toBe(w)
        expect(r, m.id).toMatch(/^[#.SG]+$/)
      }
      const all = m.rows.join('')
      expect(all.split('S').length - 1, m.id).toBe(1)
      expect(all.split('G').length - 1, m.id).toBe(1)
      expect(shortest(m.rows), `${m.id} unsolvable`).toBeGreaterThanOrEqual(8)
      expect(m.hero).not.toBe(m.goal)
    }
    expect(MAZES.some(m => m.rows.length === 5)).toBe(true)
    expect(MAZES.some(m => m.rows.length === 7)).toBe(true)
  })
})

describe('phrases', () => {
  it('has every phrase the contract implies', () => {
    for (const id of Object.values(T)) expect(phrases[id], id).toBeTruthy()
    for (const spec of ART) expect(phrases[artPhrase(spec.name)], spec.name).toBeTruthy()
    for (const s of WHERE_SCENES) expect(phrases[wherePhrase(s.id)], s.id).toBeTruthy()
  })

  it('prefixes IDs with think. and has no empty text', () => {
    for (const [id, text] of Object.entries(phrases)) {
      expect(id.startsWith('think.'), id).toBe(true)
      expect(text.trim().length, id).toBeGreaterThan(0)
    }
  })

  it('carries nikud on every Hebrew word', () => {
    const problems: string[] = []
    for (const [id, text] of Object.entries(phrases))
      for (const w of hebrewWords(text)) if (!hasVowel(w)) problems.push(`${id}: ${w}`)
    expect(problems).toEqual([])
  })
})
