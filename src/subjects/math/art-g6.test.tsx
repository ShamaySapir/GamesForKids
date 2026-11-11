import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ArtView, hasArt } from '../../ui/pick/art'
import { circleGeometry, cubeFaces, registerMathArt6, type Pt } from './art-g6'
import { MATH_ART_6 } from './types'

afterEach(cleanup)
registerMathArt6()

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
const distToLine = (a: Pt, b: Pt, c: Pt) => Math.abs((b[0] - a[0]) * (a[1] - c[1]) - (a[0] - c[0]) * (b[1] - a[1])) / Math.hypot(b[0] - a[0], b[1] - a[1])

describe('registerMathArt6', () => {
  it('registers every drawing by its MATH_ART_6 name', () => {
    for (const name of Object.values(MATH_ART_6)) expect(hasArt(name)).toBe(true)
  })
})

describe('math.machine', () => {
  it('shows the rule and the numbers, and ? for a missing side', () => {
    const svg = draw(MATH_ART_6.machine, { rule: '×3+1', input: 4 })
    noNaN(svg)
    expect(Array.from(svg.querySelectorAll('text')).map(t => t.textContent)).toEqual(['×3+1', '4', '?'])
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    cleanup()
    expect(Array.from(draw(MATH_ART_6.machine, { rule: '+5', output: 12 }).querySelectorAll('text')).map(t => t.textContent)).toEqual(['+5', '?', '12'])
  })
})

describe('math.circle', () => {
  it('draws each listed part once with a hit stroke, and the centre', () => {
    const svg = draw(MATH_ART_6.circle, { parts: 'radius,diameter,chord,arc', r: 5 })
    noNaN(svg)
    for (const part of ['radius', 'diameter', 'chord', 'arc']) {
      expect(svg.querySelectorAll(`.g6a-part[data-part="${part}"]`)).toHaveLength(1)
      expect(svg.querySelectorAll(`.g6a-hit[data-part="${part}"]`)).toHaveLength(1)
    }
    expect(svg.querySelector('.g6a-centre')).not.toBeNull()
    expect(svg.textContent).toContain('r = 5')
    cleanup()
    const only = draw(MATH_ART_6.circle, { parts: 'chord' })
    expect(only.querySelectorAll('.g6a-part')).toHaveLength(1)
    expect(only.textContent).toBe('')
  })

  it('has a radius from the centre, a diameter through it of length 2r, and a chord that misses it', () => {
    const g = circleGeometry()
    const c: Pt = [50, 50]
    const len = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
    expect(g.radius[0]).toEqual(c)
    expect(len(...g.radius)).toBeCloseTo(36, 0)
    expect(distToLine(g.diameter[0], g.diameter[1], c)).toBeLessThan(0.1)
    expect(len(...g.diameter)).toBeCloseTo(72, 0)
    expect(distToLine(g.chord[0], g.chord[1], c)).toBeGreaterThan(10)
    for (const seg of Object.values(g)) for (const p of seg) expect(inBox(p)).toBe(true)
  })
})

describe('math.cubes', () => {
  it('draws l·w + w·h + l·h visible faces, all inside the box', () => {
    for (let l = 1; l <= 5; l++) for (let w = 1; w <= 5; w++) for (let h = 1; h <= 5; h++) {
      const faces = cubeFaces(l, w, h)
      expect(faces).toHaveLength(l * w + w * h + l * h)
      for (const f of faces) for (const p of f.pts) expect(inBox(p)).toBe(true)
    }
    const svg = draw(MATH_ART_6.cubes, { l: 3, w: 2, h: 4 })
    noNaN(svg)
    expect(svg.querySelectorAll('polygon')).toHaveLength(3 * 2 + 2 * 4 + 3 * 4)
  })
})

describe('math.percent', () => {
  it('shades the first p of 100 cells', () => {
    for (const p of [0, 1, 7, 35, 50, 99, 100]) {
      const svg = draw(MATH_ART_6.percent, { p })
      noNaN(svg)
      expect(svg.querySelectorAll('.g6a-cell')).toHaveLength(100)
      expect(svg.querySelectorAll('.g6a-cell.on')).toHaveLength(p)
      cleanup()
    }
  })
})
