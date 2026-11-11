import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MathText, mathLabel } from './MathText'

describe('MathText', () => {
  it('stacks fractions and leaves the rest as text', () => {
    const { container } = render(<MathText text="1/4 + 2/4 = ?" />)
    expect(container.querySelectorAll('.frac')).toHaveLength(2)
    expect(container.querySelector('.frac-num')?.textContent).toBe('1')
    expect(container.querySelector('.frac-den')?.textContent).toBe('4')
    expect(container.textContent).toContain('+')
  })

  it('reads fractions aloud for screen readers', () => {
    expect(mathLabel('2 3/4')).toBe('2 3 חלקי 4')
  })

  it('renders plain text untouched', () => {
    const { container } = render(<MathText text="12 : 4 = ?" />)
    expect(container.textContent).toBe('12 : 4 = ?')
    expect(container.querySelector('.frac')).toBeNull()
  })
})
