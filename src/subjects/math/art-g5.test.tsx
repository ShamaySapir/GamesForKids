import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ArtView, hasArt } from '../../ui/pick/art'
import { heightGeometry, houseLayout, netPolygons, parseRows, rectPairs, rectsLayout, registerMathArt5, solidGeometry, type HeightSeg, type HeightShape, type Pt } from './art-g5'
import { MATH_ART_5, type SolidKind } from './types'

afterEach(cleanup)
registerMathArt5()

const draw = (name: string, props: Record<string, string | number | boolean>, size = 96) => {
  const { container } = render(<ArtView art={{ name, props }} size={size} />)
  return container.querySelector('svg')!
}
const noNaN = (svg: Element) => {
  for (const el of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
    for (const a of Array.from(el.attributes)) expect(a.value, `${el.tagName} ${a.name}`).not.toMatch(/NaN|Infinity|undefined/)
  }
  expect(svg.textContent ?? '').not.toMatch(/NaN|undefined/)
}
const inBox = (p: Pt) => p[0] >= 0 && p[0] <= 100 && p[1] >= 0 && p[1] <= 100
const vec = (a: Pt, b: Pt): Pt => [b[0] - a[0], b[1] - a[1]]
const cosBetween = (a: Pt, b: Pt) => Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))

const KINDS: SolidKind[] = ['cube', 'box', 'tri-prism', 'square-pyramid', 'tri-pyramid', 'hex-prism']
const FACES: Record<SolidKind, number> = { cube: 6, box: 6, 'tri-prism': 5, 'square-pyramid': 5, 'tri-pyramid': 4, 'hex-prism': 8 }
const EDGES: Record<SolidKind, number> = { cube: 12, box: 12, 'tri-prism': 9, 'square-pyramid': 8, 'tri-pyramid': 6, 'hex-prism': 18 }
const SHAPES: HeightShape[] = ['acute', 'right', 'obtuse', 'parallelogram']
const SEGS: HeightSeg[] = ['height', 'median', 'slant']
const ROTS = [0, 17, 45, 90, 133, 180, 222, 271, 315, 359]

describe('registerMathArt5', () => {
  it('registers every drawing by its MATH_ART_5 name', () => {
    for (const name of Object.values(MATH_ART_5)) expect(hasArt(name)).toBe(true)
  })
})

describe('math.solid', () => {
  it('has the right number of faces and edges, finite attributes, inside the box, at any turn', () => {
    for (const kind of KINDS) {
      for (const rot of ROTS) {
        const g = solidGeometry(kind, rot)
        expect(g.faces).toHaveLength(FACES[kind])
        expect(g.edges).toHaveLength(EDGES[kind])
        for (const p of g.points) expect(inBox(p)).toBe(true)
        noNaN(draw(MATH_ART_5.solid, { kind, rot }))
        cleanup()
      }
    }
  })

  it('draws hidden edges dashed and the visible ones solid, with something hidden on every solid', () => {
    for (const kind of KINDS) {
      const svg = draw(MATH_ART_5.solid, { kind })
      expect(svg.querySelectorAll('.g5a-hidden').length, kind).toBeGreaterThan(0)
      expect(svg.querySelectorAll('.g5a-edge').length + svg.querySelectorAll('.g5a-hidden').length, kind).toBe(EDGES[kind])
      cleanup()
    }
  })

  it('a cube seen from the front shows three faces and three hidden edges', () => {
    const g = solidGeometry('cube')
    expect(g.faces.filter(f => f.front)).toHaveLength(3)
    expect(g.edges.filter(e => e.hidden)).toHaveLength(3)
  })
})

describe('math.net', () => {
  it('the correct net has as many faces as the solid', () => {
    for (const kind of KINDS) expect(netPolygons(kind, 0), kind).toHaveLength(FACES[kind])
  })

  it('a wrong net is never the same drawing as the right one, and is drawn finite inside the box', () => {
    for (const kind of KINDS) {
      const right = JSON.stringify(netPolygons(kind, 0))
      for (const wrong of [0, 1, 2]) {
        expect(wrong === 0 || JSON.stringify(netPolygons(kind, wrong as 1 | 2)) !== right, `${kind} ${wrong}`).toBe(true)
        const svg = draw(MATH_ART_5.net, { kind, wrong })
        noNaN(svg)
        for (const poly of Array.from(svg.querySelectorAll('polygon'))) {
          for (const pair of poly.getAttribute('points')!.split(' ')) expect(inBox(pair.split(',').map(Number) as unknown as Pt), `${kind} ${wrong}`).toBe(true)
        }
        cleanup()
      }
    }
  })

  it('the two near-misses of each solid differ from each other', () => {
    for (const kind of KINDS) expect(JSON.stringify(netPolygons(kind, 1))).not.toBe(JSON.stringify(netPolygons(kind, 2)))
  })
})

describe('math.height', () => {
  it('a height is perpendicular to the base, the others are not, at every turn', () => {
    for (const shape of SHAPES) {
      for (const seg of SEGS) {
        for (const rot of ROTS) {
          const g = heightGeometry(shape, seg, rot)
          const c = cosBetween(vec(g.apex, g.foot), vec(g.base[0], g.base[1]))
          if (seg === 'height') expect(c, `${shape} ${rot}`).toBeLessThan(0.01)
          else expect(c, `${shape} ${seg} ${rot}`).toBeGreaterThan(0.2)
          expect(g.mark !== null, `${shape} ${seg}`).toBe(seg === 'height')
          for (const p of [...g.poly, g.foot, ...(g.mark ?? [])]) expect(inBox(p), `${shape} ${seg} ${rot}`).toBe(true)
        }
      }
    }
  })

  it('the median ends at the middle of the base', () => {
    for (const shape of SHAPES) {
      for (const rot of ROTS) {
        const g = heightGeometry(shape, 'median', rot)
        expect(g.foot[0]).toBeCloseTo((g.base[0][0] + g.base[1][0]) / 2, 1)
        expect(g.foot[1]).toBeCloseTo((g.base[0][1] + g.base[1][1]) / 2, 1)
      }
    }
  })

  it('the foot is on the base line; outside the base (dotted extension) for obtuse and the parallelogram heights only', () => {
    for (const shape of SHAPES) {
      for (const seg of SEGS) {
        const g = heightGeometry(shape, seg, 0)
        expect(g.foot[1]).toBeCloseTo(g.base[0][1], 1)
        expect(g.ext !== null, `${shape} ${seg}`).toBe(seg === 'height' && (shape === 'obtuse' || shape === 'parallelogram'))
      }
    }
  })

  it('renders finite, with the base, one dashed segment and a right-angle mark only on a height', () => {
    for (const shape of SHAPES) {
      for (const seg of SEGS) {
        const svg = draw(MATH_ART_5.height, { shape, seg, rot: 30 })
        noNaN(svg)
        expect(svg.querySelectorAll('.g5a-base')).toHaveLength(1)
        expect(svg.querySelectorAll('.g5a-seg')).toHaveLength(1)
        expect(svg.querySelectorAll('.g5a-right')).toHaveLength(seg === 'height' ? 1 : 0)
        cleanup()
      }
    }
  })
})

describe('math.freq', () => {
  it('parses rows and draws a row per category with its count', () => {
    expect(parseRows('תפוח:5,בננה:3')).toEqual([{ label: 'תפוח', count: 5 }, { label: 'בננה', count: 3 }])
    const svg = draw(MATH_ART_5.freq, { rows: 'תפוח:5,בננה:3,ענב:7,אגס:2' }, 240)
    noNaN(svg)
    expect([...svg.querySelectorAll('.g5a-count')].map(t => t.textContent)).toEqual(['5', '3', '7', '2'])
    expect([...svg.querySelectorAll('.g5a-label')].map(t => t.textContent)).toEqual(['תפוח', 'בננה', 'ענב', 'אגס'])
  })
})

describe('math.rects', () => {
  it('draws one grid per pair of factors, each of area n, inside the picture', () => {
    for (let n = 1; n <= 50; n++) {
      const pairs = rectPairs(n)
      expect(pairs.every(([a, b]) => a <= b && a * b === n)).toBe(true)
      expect(pairs).toHaveLength(Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0 && d * d <= n).length)
      const L = rectsLayout(n)
      expect(L.items).toHaveLength(pairs.length)
      for (const it of L.items) {
        expect(it.w * it.h).toBe(n)
        expect(it.x + it.w).toBeLessThanOrEqual(L.width)
        expect(it.y + it.h).toBeLessThanOrEqual(L.height)
      }
      for (const [i, a] of L.items.entries()) for (const b of L.items.slice(i + 1)) {
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y
        expect(apart, `${n}`).toBe(true)
      }
      const svg = draw(MATH_ART_5.rects, { n })
      noNaN(svg)
      expect(svg.querySelectorAll('.g5a-grid')).toHaveLength(pairs.length)
      cleanup()
    }
  })
})

describe('math.house', () => {
  it('aligns digits by place with the point between ones and tenths', () => {
    const L = houseLayout('3.45', '345')
    expect(L.places).toEqual([2, 1, 0, -1, -2])
    expect(L.rows[0]).toEqual(['', '', '3', '4', '5'])
    expect(L.rows[1]).toEqual(['3', '4', '5', '', ''])
    expect(L.point).toBe(true)
  })

  it('renders finite, with the same place columns in both rows', () => {
    const cases: [string, string][] = [['3.45', '345'], ['0.07', '7'], ['120', '1.2'], ['5', '5000'], ['12.345', '1.2345']]
    for (const [before, after] of cases) {
      const svg = draw(MATH_ART_5.house, { before, after }, 280)
      noNaN(svg)
      const L = houseLayout(before, after)
      expect(svg.querySelectorAll('.g5a-digit')).toHaveLength(2 * L.places.length)
      expect(svg.querySelectorAll('.g5a-arrow')).toHaveLength(1)
      cleanup()
    }
  })
})
