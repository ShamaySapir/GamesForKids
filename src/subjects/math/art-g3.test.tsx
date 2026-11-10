import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ArtView, hasArt } from '../../ui/pick/art'
import { angleGeometry, registerMathArt, triangleGeometry } from './art-g3'
import { MATH_ART } from './types'

afterEach(cleanup)
registerMathArt()

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
// A small deterministic generator so failures are reproducible.
const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296

describe('registerMathArt', () => {
  it('registers the three drawings by their MATH_ART names', () => {
    for (const name of Object.values(MATH_ART)) expect(hasArt(name)).toBe(true)
  })
})

describe('math.angle', () => {
  it('has finite attributes for many angles, rotations and arm lengths', () => {
    const rnd = lcg(1)
    for (let i = 0; i < 150; i++) {
      const svg = draw(MATH_ART.angle, {
        deg: Math.round(rnd() * 180), rot: Math.round(rnd() * 359), armA: 0.35 + rnd() * 0.65, armB: 0.35 + rnd() * 0.65, corner: rnd() < 0.5,
      })
      noNaN(svg)
      cleanup()
    }
  })

  it('keeps every point inside the box', () => {
    const rnd = lcg(2)
    for (let i = 0; i < 300; i++) {
      const g = angleGeometry(rnd() * 180, rnd() * 359, 0.35 + rnd() * 0.65, 0.35 + rnd() * 0.65)
      for (const [x, y] of [g.vertex, g.a, g.b]) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(100)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(100)
      }
    }
  })

  it('draws a dashed corner only when asked', () => {
    expect(draw(MATH_ART.angle, { deg: 60, rot: 10, armA: 1, armB: 1 }).querySelector('.g3a-corner')).toBeNull()
    cleanup()
    expect(draw(MATH_ART.angle, { deg: 60, rot: 10, armA: 1, armB: 1, corner: true }).querySelector('.g3a-corner')).not.toBeNull()
  })

  it('draws 180 degrees as a straight line through the vertex, with the dot', () => {
    for (const rot of [0, 37, 90, 213]) {
      const g = angleGeometry(180, rot, 0.8, 0.6)
      const cross = (g.a[0] - g.vertex[0]) * (g.b[1] - g.vertex[1]) - (g.a[1] - g.vertex[1]) * (g.b[0] - g.vertex[0])
      expect(Math.abs(cross)).toBeLessThan(0.5)
      const dot = (g.a[0] - g.vertex[0]) * (g.b[0] - g.vertex[0]) + (g.a[1] - g.vertex[1]) * (g.b[1] - g.vertex[1])
      expect(dot).toBeLessThan(0)
    }
    expect(draw(MATH_ART.angle, { deg: 180, rot: 0, armA: 1, armB: 1 }).querySelector('.g3a-dot')).not.toBeNull()
  })

  it('is aria-hidden and sized from props.size', () => {
    const svg = draw(MATH_ART.angle, { deg: 90, rot: 0, armA: 1, armB: 1 }, 120)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '120')
  })
})

describe('math.triangle', () => {
  it('has finite attributes for many shapes', () => {
    const rnd = lcg(3)
    for (let i = 0; i < 150; i++) {
      const a = 20 + Math.round(rnd() * 100)
      const b = 20 + Math.round(rnd() * (150 - a))
      noNaN(draw(MATH_ART.triangle, { a, b, rot: Math.round(rnd() * 359), ticks: rnd() < 0.5 }))
      cleanup()
    }
  })

  it('stays inside the box after rotation and fills it', () => {
    const rnd = lcg(4)
    for (let i = 0; i < 500; i++) {
      const a = 15 + rnd() * 110
      const b = 15 + rnd() * (160 - a - 15)
      const { points } = triangleGeometry(a, b, rnd() * 359)
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(100)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(100)
      }
      const xs = points.map(p => p[0])
      const ys = points.map(p => p[1])
      expect(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))).toBeGreaterThan(79)
    }
  })

  const ticks = (a: number, b: number, rot = 20) => draw(MATH_ART.triangle, { a, b, rot, ticks: true }).querySelectorAll('.g3a-tick').length

  it('marks all three sides of an equilateral triangle, the equal pair of an isosceles one, nothing on a scalene one', () => {
    expect(ticks(60, 60)).toBe(3)
    cleanup()
    expect(ticks(70, 70)).toBe(2) // equal base angles
    cleanup()
    expect(ticks(40, 70)).toBe(2) // third angle 70 equals b
    cleanup()
    expect(ticks(70, 40)).toBe(2)
    cleanup()
    expect(ticks(50, 50)).toBe(2)
    cleanup()
    expect(ticks(50, 60)).toBe(0)
    cleanup()
    expect(ticks(30, 100)).toBe(0)
  })

  it('draws no ticks unless asked', () => {
    expect(draw(MATH_ART.triangle, { a: 60, b: 60, rot: 0 }).querySelectorAll('.g3a-tick')).toHaveLength(0)
  })

  it('puts the ticks on sides that really are the same length', () => {
    const rnd = lcg(5)
    for (let i = 0; i < 200; i++) {
      const a = 30 + Math.round(rnd() * 60)
      const b = rnd() < 0.5 ? a : 30 + Math.round(rnd() * 60)
      const g = triangleGeometry(a, b, rnd() * 359)
      const [P0, P1, P2] = g.points
      const len = [Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), Math.hypot(P2[0] - P1[0], P2[1] - P1[1]), Math.hypot(P0[0] - P2[0], P0[1] - P2[1])]
      const marked = len.filter((_, k) => g.ticks[k])
      for (const m of marked) expect(m).toBeCloseTo(marked[0]!, 0)
    }
  })
})

describe('math.round', () => {
  it('has finite attributes and shows from, to and n', () => {
    const rnd = lcg(6)
    for (let i = 0; i < 100; i++) {
      const from = Math.round(rnd() * 90) * 100
      const to = from + 100
      const n = from + Math.round(rnd() * 100)
      const svg = draw(MATH_ART.round, { from, to, n })
      noNaN(svg)
      const labels = Array.from(svg.querySelectorAll('text')).map(t => t.textContent)
      expect(labels).toEqual([String(from), String(to), String(n)])
      cleanup()
    }
  })

  it('draws the dashed midpoint halfway and the dot at n', () => {
    const svg = draw(MATH_ART.round, { from: 300, to: 400, n: 347 })
    const mid = svg.querySelector('.g3a-mid')!
    expect(Number(mid.getAttribute('x1'))).toBeCloseTo(80, 1)
    const dot = svg.querySelector('.g3a-mark')!
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(20 + 0.47 * 120, 1)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
