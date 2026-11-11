import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import type { CellRect, GridAreaQ } from './types'
import './math-g3-art.css'
import './math-g4-art.css'
import './math-g6-art.css'

// GridAreaGame (grade 3, skill 28): a shape on a square-centimetre grid; type its area in סמ״ר on a pad.
// count mode draws every square; sides mode draws only the outline and the side lengths, and the inner
// squares plus row counts appear with the aid, so a child moves from counting to length × width.

const U = 30 // one square, in viewBox units
const PAD_L = 34
const PAD_R = 40
const PAD_T = 30
const PAD_B = 32
const MAX_DIGITS = 3
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'] as const

const cellKey = (c: number, r: number) => `${c},${r}`

function filledCells(rects: readonly CellRect[]): Set<string> {
  const set = new Set<string>()
  for (const [c, r, w, h] of rects) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) set.add(cellKey(c + i, r + j))
  return set
}

/** The shape's outer edge: every unit side between a filled square and an empty one, as one path. */
function outlinePath(filled: ReadonlySet<string>): string {
  const seg: string[] = []
  for (const key of filled) {
    const [c, r] = key.split(',').map(Number) as [number, number]
    const x = c * U
    const y = r * U
    if (!filled.has(cellKey(c, r - 1))) seg.push(`M${x} ${y}H${x + U}`)
    if (!filled.has(cellKey(c, r + 1))) seg.push(`M${x} ${y + U}H${x + U}`)
    if (!filled.has(cellKey(c - 1, r))) seg.push(`M${x} ${y}V${y + U}`)
    if (!filled.has(cellKey(c + 1, r))) seg.push(`M${x + U} ${y}V${y + U}`)
  }
  return seg.join('')
}

type Edge = { a: readonly [number, number]; b: readonly [number, number]; n: readonly [number, number] }

/** Every boundary unit side, directed clockwise and ordered by walking around each outline (outer edge, then holes). */
export function boundaryEdges(filled: ReadonlySet<string>): Edge[] {
  const all: Edge[] = []
  for (const key of filled) {
    const [c, r] = key.split(',').map(Number) as [number, number]
    const x = c * U
    const y = r * U
    if (!filled.has(cellKey(c, r - 1))) all.push({ a: [x, y], b: [x + U, y], n: [0, -1] })
    if (!filled.has(cellKey(c + 1, r))) all.push({ a: [x + U, y], b: [x + U, y + U], n: [1, 0] })
    if (!filled.has(cellKey(c, r + 1))) all.push({ a: [x + U, y + U], b: [x, y + U], n: [0, 1] })
    if (!filled.has(cellKey(c - 1, r))) all.push({ a: [x, y + U], b: [x, y], n: [-1, 0] })
  }
  const used = new Set<Edge>()
  const out: Edge[] = []
  for (const first of all) {
    let e: Edge | undefined = first
    while (e && !used.has(e)) {
      used.add(e)
      out.push(e)
      const end: Edge['b'] = e.b
      e = all.find(o => !used.has(o) && o.a[0] === end[0] && o.a[1] === end[1])
    }
  }
  return out
}

function Board({ q, aid }: { q: GridAreaQ; aid: boolean }) {
  const { cols, rows, rects, mode } = q
  const filled = useMemo(() => filledCells(rects), [rects])
  const outline = useMemo(() => outlinePath(filled), [filled])
  const perimeter = q.ask === 'perimeter'
  const edges = useMemo(() => (perimeter ? boundaryEdges(filled) : []), [perimeter, filled])
  const showCells = mode === 'count' || (aid && !perimeter)
  // Box nets with the aid: the faces that are opposite each other share a tint.
  const tint = (i: number) => (aid && q.faces?.[i] !== undefined ? `g3a-shape face face-${Math.abs(Math.round(q.faces[i]!)) % 3}` : 'g3a-shape')
  const w = cols * U + PAD_L + PAD_R
  const h = rows * U + PAD_T + PAD_B
  const rowCounts = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (filled.has(cellKey(c, r)) ? 1 : 0)).reduce<number>((s, n) => s + n, 0))
  return (
    <div className="g3a-board">
      <svg className="g3a-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={phrases[q.instruction]}>
        <g transform={`translate(${PAD_L} ${PAD_T})`}>
          {rects.map(([c, r, rw, rh], i) => <rect key={i} className={tint(i)} x={c * U} y={r * U} width={rw * U} height={rh * U} />)}
          {showCells && Array.from(filled, key => {
            const [c, r] = key.split(',').map(Number) as [number, number]
            return <rect key={key} className="g3a-cell" x={c * U} y={r * U} width={U} height={U} />
          })}
          <path className="g3a-edge" d={outline} />
          {mode === 'sides' && rects.map(([c, r, rw, rh], i) => {
            const topFree = !filled.has(cellKey(c + Math.floor(rw / 2), r - 1))
            const leftFree = !filled.has(cellKey(c - 1, r + Math.floor(rh / 2)))
            return (
              <g key={i}>
                <text className="g3a-side" textAnchor="middle" x={(c + rw / 2) * U} y={topFree ? r * U - 8 : (r + rh) * U + 22}>{rw}</text>
                <text className="g3a-side" textAnchor={leftFree ? 'end' : 'start'} dominantBaseline="central"
                  x={leftFree ? c * U - 8 : (c + rw) * U + 8} y={(r + rh / 2) * U}>{rh}</text>
              </g>
            )
          })}
          {aid && perimeter && edges.map((e, i) => {
            const mx = (e.a[0] + e.b[0]) / 2
            const my = (e.a[1] + e.b[1]) / 2
            return (
              <g key={i} className="g3a-step">
                <line className="g3a-tick" x1={mx} y1={my} x2={mx + e.n[0] * 6} y2={my + e.n[1] * 6} />
                <text className="g3a-stepnum" textAnchor="middle" dominantBaseline="central" x={mx + e.n[0] * 13} y={my + e.n[1] * 13}>{i + 1}</text>
              </g>
            )
          })}
          {aid && !perimeter && rowCounts.map((n, r) => n > 0 && (
            <text key={r} className="g3a-rowcount" x={cols * U + 10} y={r * U + U / 2} dominantBaseline="central">{n}</text>
          ))}
        </g>
      </svg>
    </div>
  )
}

export function GridAreaGame({ question, aid, onAttempt }: GameProps<GridAreaQ>) {
  const [value, setValue] = useState('')
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, question.hint)

  const digit = useCallback((d: string) => {
    if (done.current) return
    setValue(v => (v.length < MAX_DIGITS ? v + d : v))
  }, [])
  const back = useCallback(() => { if (!done.current) setValue(v => v.slice(0, -1)) }, [])
  const submit = useCallback(() => {
    if (done.current || value === '') return
    const ok = Number(value) === question.answer
    if (ok) { done.current = true; setLocked(true) } else shake() // the typed number stays, so it can be fixed
    onAttempt(ok)
  }, [value, question.answer, onAttempt, shake])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) digit(e.key)
      else if (e.key === 'Backspace') back()
      // A focused button turns Enter into its own click; handling it here too would submit twice.
      else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, back, submit])

  const press = (k: (typeof KEYS)[number]) => (k === '⌫' ? back() : k === '✓' ? submit() : digit(k))

  return (
    <div className="pk-stage pd-stage g3a-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <Board q={question} aid={aid} />
      <HintButton aid={aid} hint={question.hint} />
      <div className="g3a-answer-row">
        <div className={`pd-answer digi${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`} dir="ltr" role="status">
          {value || <span className="pd-caret" aria-hidden="true">?</span>}
        </div>
        <span className="g3a-unit">{question.ask === 'perimeter' ? 'ס״מ' : 'סמ״ר'}</span>
      </div>
      <div className="pd-pad" dir="ltr">
        {KEYS.map(k => (
          <button key={k} type="button" className={`pd-key${k === '✓' ? ' go' : ''}`} aria-label={k} disabled={locked} onClick={() => press(k)}>{k}</button>
        ))}
      </div>
    </div>
  )
}
