import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ART, POSITIONS, SCENE } from './catalog'
import { ART_KIT } from './kit'

type P = Record<string, string | number | boolean>

function draw(name: string, props: P = {}) {
  const Drawing = ART_KIT[name]
  if (!Drawing) throw new Error(`no drawing ${name}`)
  return render(<Drawing size={90} {...props} />).container
}
const parts = (c: HTMLElement) => [...c.querySelectorAll('[data-part]')].map(e => e.getAttribute('data-part'))

describe('art kit', () => {
  it('covers every catalog name and the scene', () => {
    for (const a of ART) expect(ART_KIT[a.name], a.name).toBeDefined()
    expect(ART_KIT[SCENE]).toBeDefined()
  })

  it('renders each drawing as a decorative 100-box svg of the requested size', () => {
    for (const a of ART) {
      const svg = draw(a.name).querySelector('svg')
      expect(svg, a.name).not.toBeNull()
      expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100')
      expect(svg?.getAttribute('width')).toBe('90')
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(svg?.getAttribute('role')).toBe('img')
    }
  })

  it('mirrors only when facing left', () => {
    for (const a of ART.filter(x => x.facing)) {
      expect(draw(a.name, { facing: 'left' }).innerHTML, a.name).toContain('scale(-1 1)')
      expect(draw(a.name, { facing: 'right' }).innerHTML, a.name).not.toContain('scale(-1 1)')
    }
  })

  it('draws smaller with scale', () => {
    expect(draw('dog', { scale: 0.5 }).innerHTML).toContain('scale(0.5)')
  })

  it('colors colorable drawings with the requested palette color', () => {
    for (const a of ART.filter(x => x.colorable)) {
      expect(draw(a.name, { color: 'purple' }).innerHTML, a.name).toContain('var(--art-purple)')
    }
  })

  it('fills silhouettes with the shadow color only', () => {
    for (const a of ART) {
      const c = draw(a.name, { silhouette: true })
      for (const el of c.querySelectorAll('path,circle,ellipse,rect')) {
        const fill = el.getAttribute('fill')
        const stroke = el.getAttribute('stroke')
        expect(['none', 'var(--art-shadow)'], `${a.name} fill ${fill}`).toContain(fill)
        if (stroke) expect(stroke, `${a.name} stroke`).toBe('var(--art-shadow)')
      }
    }
  })

  it('clips halves of symmetric drawings', () => {
    for (const a of ART.filter(x => x.symmetric)) {
      for (const half of ['right', 'left']) {
        const c = draw(a.name, { half })
        expect(c.querySelector('clipPath'), `${a.name} ${half}`).not.toBeNull()
      }
    }
    expect(draw('house').querySelector('clipPath')).toBeNull()
  })

  it('has every catalog part, and missing removes exactly that one', () => {
    for (const a of ART.filter(x => x.parts)) {
      const all = parts(draw(a.name))
      expect([...all].sort(), a.name).toEqual([...(a.parts ?? [])].sort())
      for (const p of a.parts ?? []) {
        const left = parts(draw(a.name, { missing: p }))
        expect(left, `${a.name} -${p}`).toEqual(all.filter(x => x !== p))
      }
    }
  })

  it('shows only the requested part', () => {
    for (const a of ART.filter(x => x.parts)) {
      for (const p of a.parts ?? []) expect(parts(draw(a.name, { only: p })), `${a.name} only ${p}`).toEqual([p])
    }
  })

  it('draws a scene for every position', () => {
    for (const rel of POSITIONS) {
      for (const [a, b] of [['ball', 'table'], ['cat', 'house'], ['apple', 'box'], ['dog', 'tent'], ['mouse', 'chair']] as const) {
        const c = draw(SCENE, { a, b, rel })
        expect(c.querySelectorAll('svg').length, `${a} ${rel} ${b}`).toBe(1)
        expect(c.querySelectorAll('path,circle,ellipse,rect').length).toBeGreaterThan(4)
      }
    }
  })

  it('draws the opened box for "in" and the lid for "on"', () => {
    expect(parts(draw(SCENE, { a: 'ball', b: 'box', rel: 'in' }))).not.toContain('lid')
    expect(parts(draw(SCENE, { a: 'ball', b: 'box', rel: 'on' }))).toContain('lid')
  })
})
