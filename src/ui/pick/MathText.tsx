import { Fragment } from 'react'

// Exercises and numbers shown to the child, with fractions stacked: "1/4 + 2/4 = ?" renders ¼-style numerator over
// denominator (grade 4 and up, docs/specs/math-grade4.md). A mixed number is written "2 3/4". Everything else is plain text.

const FRACTION = /(\d+)\/(\d+)/g

/** Screen readers hear "3 חלקי 4" for a stacked 3/4. */
export const mathLabel = (text: string) => text.replace(FRACTION, '$1 חלקי $2')

export function MathText({ text }: { text: string }) {
  if (!text.includes('/')) return <>{text}</>
  const parts: (string | { num: string; den: string })[] = []
  let last = 0
  for (const m of text.matchAll(FRACTION)) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push({ num: m[1]!, den: m[2]! })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return (
    <span aria-label={mathLabel(text)}>
      {parts.map((p, i) => typeof p === 'string'
        ? <Fragment key={i}>{p}</Fragment>
        : <span key={i} className="frac" aria-hidden="true"><span className="frac-num">{p.num}</span><span className="frac-den">{p.den}</span></span>)}
    </span>
  )
}
