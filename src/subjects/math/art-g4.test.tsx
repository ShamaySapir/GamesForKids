import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ArtView, hasArt } from '../../ui/pick/art'
import { lineGeometry, polygonGeometry, quadGeometry, rectGrid, registerMathArt4, type Pt } from './art-g4'
import { MATH_ART_4, type QuadKind } from './types'

afterEach(cleanup)
registerMathArt4()

const draw = (name: string, props: Record<string, string | number | boolean>, size = 96) => {
  const { container } = render(<ArtView art={{ name, props }} size={size} />)
  return container.querySelector('svg')!
}
const noNaN = (svg: Element) => {
  for (const el of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
    for (const a of Array.from(el.attributes)) expect(a.value, `${el.tagName} ${a.name}`).not.toMatch(/NaN|Infinity|undefined/)
  }
  expect(svg.textContent ?? '').not.toMatch(/NaN/)
}
const inBox = (p: Pt) => p[0] >= 0 && p[0] <= 100 && p[1] >= 0 && p[1] <= 100
const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1])
const angle = (a: Pt, b: Pt, c: Pt) => { // interior angle at b, degrees
  const u: Pt = [a[0] - b[0], a[1] - b[1]]
  const v: Pt = [c[0] - b[0], c[1] - b[1]]
  return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI
}
const cross3 = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
const dir = (s: readonly [Pt, Pt]): Pt => [s[1][0] - s[0][0], s[1][1] - s[0][1]]
const sinBetween = (a: Pt, b: Pt) => Math.abs(a[0] * b[1] - a[1] * b[0]) / (Math.hypot(...a) * Math.hypot(...b))
const cosBetween = (a: Pt, b: Pt) => Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))
const ROTS = [0, 17, 45, 90, 133, 180, 222, 271, 315, 359]
const KINDS: QuadKind[] = ['square', 'rectangle', 'rhombus', 'parallelogram', 'trapezoid']

describe('registerMathArt4', () => {
  it('registers every drawing by its MATH_ART_4 name', () => {
    for (const name of Object.values(MATH_ART_4)) expect(hasArt(name)).toBe(true)
  })
})

describe('math.fraction', () => {
  it('has finite attributes, the right number of parts and shaded parts', () => {
    for (const shape of ['circle', 'rect', 'strip']) {
      for (let parts = 2; parts <= 12; parts++) {
        for (const shaded of [0, 1, parts - 1, parts]) {
          const svg = draw(MATH_ART_4.fraction, { shape, parts, shaded })
          noNaN(svg)
          expect(svg.querySelectorAll('.g4a-part')).toHaveLength(parts)
          expect(svg.querySelectorAll('.g4a-part.on')).toHaveLength(shaded)
          cleanup()
        }
      }
    }
  })
  it('lays a rectangle out as square as possible', () => {
    expect(rectGrid(4)).toEqual({ rows: 2, cols: 2 })
    expect(rectGrid(6)).toEqual({ rows: 2, cols: 3 })
    expect(rectGrid(9)).toEqual({ rows: 3, cols: 3 })
    expect(rectGrid(12)).toEqual({ rows: 3, cols: 4 })
    expect(rectGrid(7)).toEqual({ rows: 1, cols: 7 })
  })
  it('survives bad props', () => {
    noNaN(draw(MATH_ART_4.fraction, { shape: 'x', parts: 99, shaded: -4 }))
  })
})

describe('math.strips', () => {
  it('draws one or two strips cut into d parts with n shaded, with the fraction written', () => {
    const one = draw(MATH_ART_4.strips, { a: '3/4' })
    noNaN(one)
    expect(one.querySelectorAll('.g4a-part')).toHaveLength(4)
    expect(one.querySelectorAll('.g4a-part.on')).toHaveLength(3)
    expect(one.textContent).toBe('3/4')
    cleanup()
    const two = draw(MATH_ART_4.strips, { a: '1/2', b: '5/10' })
    noNaN(two)
    expect(two.querySelectorAll('.g4a-part')).toHaveLength(12)
    expect(two.querySelectorAll('.g4a-part.on')).toHaveLength(6)
    expect(two.textContent).toBe('1/25/10')
  })
  it('survives bad props', () => { noNaN(draw(MATH_ART_4.strips, { a: 'zzz', b: '9/0' })) })
})

describe('math.lines', () => {
  it('stays inside the box and has no NaN', () => {
    for (const kind of ['parallel', 'perpendicular', 'crossing'] as const) {
      for (let rot = 0; rot < 360; rot += 7) {
        for (const p of lineGeometry(kind, rot).flat()) expect(inBox(p), `${kind} ${rot}`).toBe(true)
        noNaN(draw(MATH_ART_4.lines, { kind, rot }))
        cleanup()
      }
    }
  })
  it('parallel lines have equal slopes and are not collinear', () => {
    for (const rot of ROTS) {
      const [a, b] = lineGeometry('parallel', rot)
      expect(sinBetween(dir(a), dir(b))).toBeLessThan(0.02)
      const gap = Math.abs(cross3(a[0], a[1], b[0])) / len(a[0], a[1])
      expect(gap).toBeGreaterThan(10)
    }
  })
  it('perpendicular lines have a zero dot product and really meet', () => {
    for (const rot of ROTS) {
      const [a, b] = lineGeometry('perpendicular', rot)
      expect(cosBetween(dir(a), dir(b))).toBeLessThan(0.02)
      expect(cross3(a[0], a[1], b[0]) * cross3(a[0], a[1], b[1])).toBeLessThan(0)
      expect(cross3(b[0], b[1], a[0]) * cross3(b[0], b[1], a[1])).toBeLessThan(0)
    }
  })
  it('crossing lines meet 25 to 65 degrees away from a right angle, and the segments intersect', () => {
    for (const rot of ROTS) {
      const [a, b] = lineGeometry('crossing', rot)
      const acute = (Math.acos(cosBetween(dir(a), dir(b))) * 180) / Math.PI
      expect(90 - acute).toBeGreaterThanOrEqual(25)
      expect(90 - acute).toBeLessThanOrEqual(65)
      expect(cross3(a[0], a[1], b[0]) * cross3(a[0], a[1], b[1])).toBeLessThan(0)
      expect(cross3(b[0], b[1], a[0]) * cross3(b[0], b[1], a[1])).toBeLessThan(0)
    }
  })
})

describe('math.polygon', () => {
  it('is convex, inside the box, with vertex dots and sides-3 diagonals', () => {
    for (let sides = 4; sides <= 8; sides++) {
      const v = polygonGeometry(sides)
      expect(v).toHaveLength(sides)
      for (const p of v) expect(inBox(p)).toBe(true)
      const signs = v.map((_, i) => Math.sign(cross3(v[i]!, v[(i + 1) % sides]!, v[(i + 2) % sides]!)))
      expect(new Set(signs).size).toBe(1)
      for (const diagonals of [false, true]) {
        const svg = draw(MATH_ART_4.polygon, { sides, diagonals })
        noNaN(svg)
        expect(svg.querySelectorAll('.g4a-dot')).toHaveLength(sides)
        expect(svg.querySelectorAll('.g4a-diag')).toHaveLength(diagonals ? sides - 3 : 0)
        cleanup()
      }
    }
  })
})

describe('math.quad', () => {
  const near = (a: number, b: number, tol = 0.03) => Math.abs(a - b) <= tol * Math.max(a, b)
  const sidesOf = (q: Pt[]) => q.map((p, i) => len(p, q[(i + 1) % 4]!))
  const anglesOf = (q: Pt[]) => q.map((_, i) => angle(q[(i + 3) % 4]!, q[i]!, q[(i + 1) % 4]!))

  it('stays inside the box for every rotation and has no NaN', () => {
    for (const kind of KINDS) {
      for (let rot = 0; rot < 360; rot += 13) {
        for (const p of quadGeometry(kind, rot)) expect(inBox(p), `${kind} ${rot}`).toBe(true)
        noNaN(draw(MATH_ART_4.quad, { kind, rot }))
        cleanup()
      }
    }
  })
  it('each shape really is its kind, whatever the rotation', () => {
    for (const rot of ROTS) {
      const sq = quadGeometry('square', rot)
      expect(sidesOf(sq).every(s => near(s, sidesOf(sq)[0]!))).toBe(true)
      expect(anglesOf(sq).every(a => Math.abs(a - 90) < 1)).toBe(true)

      const re = quadGeometry('rectangle', rot)
      const rs = sidesOf(re)
      expect(near(rs[0]!, rs[2]!) && near(rs[1]!, rs[3]!)).toBe(true)
      expect(Math.max(...rs) / Math.min(...rs)).toBeGreaterThanOrEqual(1.5)
      expect(anglesOf(re).every(a => Math.abs(a - 90) < 1)).toBe(true)

      const rh = quadGeometry('rhombus', rot)
      expect(sidesOf(rh).every(s => near(s, sidesOf(rh)[0]!))).toBe(true)
      const ra = anglesOf(rh)
      expect(Math.min(...ra)).toBeGreaterThanOrEqual(55)
      expect(Math.min(...ra)).toBeLessThanOrEqual(70)
      expect(Math.max(...ra)).toBeGreaterThanOrEqual(110)
      expect(Math.max(...ra)).toBeLessThanOrEqual(125)

      const pa = quadGeometry('parallelogram', rot)
      const ps = sidesOf(pa)
      expect(near(ps[0]!, ps[2]!) && near(ps[1]!, ps[3]!)).toBe(true)
      expect(Math.max(...ps) / Math.min(...ps)).toBeGreaterThanOrEqual(1.5)
      const pang = Math.min(...anglesOf(pa))
      expect(pang).toBeGreaterThanOrEqual(60)
      expect(pang).toBeLessThanOrEqual(75)

      const tr = quadGeometry('trapezoid', rot)
      const dirs = tr.map((p, i) => dir([p, tr[(i + 1) % 4]!]))
      expect(sinBetween(dirs[0]!, dirs[2]!)).toBeLessThan(0.02) // the two bases
      expect(sinBetween(dirs[1]!, dirs[3]!)).toBeGreaterThan(0.1) // the legs are not parallel
      const ts = sidesOf(tr)
      expect(near(ts[1]!, ts[3]!, 0.1)).toBe(false) // and not equal: no isosceles look
    }
  })
})
