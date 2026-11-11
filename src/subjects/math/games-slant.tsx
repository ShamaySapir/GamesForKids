import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { DigitPad, fromButton } from './games-column'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import type { SlantAreaQ } from './types'
import './math-g3-art.css'
import './math-g5-art.css'

// SlantAreaGame (grade 5, skill 50): a triangle or parallelogram on a square grid with its base (thick) and height
// (dashed, with a right-angle mark). The lengths are computed from the drawing. The answer is typed on the pad.
// Aid: the surrounding rectangle b × h is shaded (a triangle is half of it); for a parallelogram the piece that
// moves across to make that rectangle is shown. Per-question state; PlayScreen remounts this for every question.

const U = 30
const PAD = 34
const MAX_DIGITS = 3

type P = readonly [number, number]
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]]
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]]
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k]
const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1]
const len = (a: P) => Math.hypot(a[0], a[1])
const unit = (a: P): P => mul(a, 1 / (len(a) || 1))

export interface SlantInfo {
  base: [P, P]
  apex: P
  foot: P
  baseLen: number
  height: number
  /** The foot falls outside the base: its line is drawn dotted. */
  outside: boolean
  /** The surrounding rectangle b × h (grid units), with the cut-and-move piece for a parallelogram. */
  rectangle: P[]
  cut: P[] | null
  parallelogram: boolean
}

export function slantInfo(q: SlantAreaQ): SlantInfo {
  const pt = (i: number): P => q.points[i] as P
  const b0 = pt(q.base[0])
  const b1 = pt(q.base[1])
  const apex = pt(q.apex)
  const foot = q.foot as P
  const u = unit(sub(b1, b0))
  const baseLen = len(sub(b1, b0))
  const height = len(sub(apex, foot))
  const n = unit(sub(apex, foot))
  const along = dot(sub(foot, b0), u)
  const outside = along < -1e-6 || along > baseLen + 1e-6
  const parallelogram = q.points.length === 4
  let start = b0
  let dir = u
  let cut: P[] | null = null
  if (parallelogram && !outside) {
    // Rectangle from the foot, toward the side the top edge runs; the triangle between the foot and the nearer base corner moves across.
    const nbr = [(q.apex + 1) % 4, (q.apex + 3) % 4]
    const other = pt(nbr.find(i => i !== q.base[0] && i !== q.base[1]) ?? nbr[0]!)
    const s = dot(sub(other, apex), u) >= 0 ? 1 : -1
    start = foot
    dir = mul(u, s)
    const bv = pt(nbr.find(i => i === q.base[0] || i === q.base[1]) ?? q.base[0])
    cut = [apex, foot, bv]
  }
  const far = add(start, mul(dir, baseLen))
  return {
    base: [b0, b1], apex, foot, baseLen, height, outside,
    rectangle: [start, far, add(far, mul(n, height)), add(start, mul(n, height))],
    cut, parallelogram,
  }
}

const fmt = (v: number) => String(Math.round(v * 10) / 10)

function Board({ q, aid }: { q: SlantAreaQ; aid: boolean }) {
  const info = slantInfo(q)
  const W = q.cols * U + 2 * PAD
  const H = q.rows * U + 2 * PAD
  const X = (p: P) => PAD + p[0] * U
  const Y = (p: P) => PAD + p[1] * U
  const pts = (list: readonly P[]) => list.map(p => `${X(p)},${Y(p)}`).join(' ')
  const centroid = q.points.reduce<P>((s, p) => [s[0] + p[0] / q.points.length, s[1] + p[1] / q.points.length], [0, 0])
  // A label sits beside its segment, on the side away from the shape.
  const labelAt = (a: P, b: P, off: number): P => {
    const mid = mul(add(a, b), 0.5)
    const d = unit(sub(b, a))
    let nrm: P = [-d[1], d[0]]
    if (dot(nrm, sub(mid, centroid)) < 0) nrm = mul(nrm, -1)
    return add(mid, mul(nrm, off))
  }
  const baseLabel = labelAt(info.base[0], info.base[1], 0.62)
  const heightLabel = labelAt(info.apex, info.foot, 0.55)
  const [b0, b1] = info.base
  const u = unit(sub(b1, b0))
  const toBase = dot(sub(mul(add(b0, b1), 0.5), info.foot), u) >= 0 ? u : mul(u, -1)
  const up = unit(sub(info.apex, info.foot))
  const m = 0.28
  const mark: P[] = [add(info.foot, mul(toBase, m)), add(add(info.foot, mul(toBase, m)), mul(up, m)), add(info.foot, mul(up, m))]
  const along = dot(sub(info.foot, b0), u)
  const nearEnd = along < 0 ? b0 : b1
  const rectCentre = mul(add(info.rectangle[0]!, info.rectangle[2]!), 0.5)
  return (
    <div className="g5s-board">
      <svg className="g5s-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={phrases[q.instruction]}>
        {Array.from({ length: q.cols + 1 }, (_, c) => <line key={`c${c}`} className="g5s-grid" x1={PAD + c * U} y1={PAD} x2={PAD + c * U} y2={PAD + q.rows * U} />)}
        {Array.from({ length: q.rows + 1 }, (_, r) => <line key={`r${r}`} className="g5s-grid" x1={PAD} y1={PAD + r * U} x2={PAD + q.cols * U} y2={PAD + r * U} />)}
        {aid && <polygon className="g5s-aid" points={pts(info.rectangle)} />}
        {aid && info.cut && <polygon className="g5s-cut" points={pts(info.cut)} />}
        <polygon className="g5s-shape" points={pts(q.points as readonly P[])} />
        {info.outside && <line className="g5s-ext" x1={X(nearEnd)} y1={Y(nearEnd)} x2={X(info.foot)} y2={Y(info.foot)} />}
        <line className="g5s-base" x1={X(b0)} y1={Y(b0)} x2={X(b1)} y2={Y(b1)} />
        <line className="g5s-height" x1={X(info.apex)} y1={Y(info.apex)} x2={X(info.foot)} y2={Y(info.foot)} />
        <polyline className="g5s-right" points={pts(mark)} />
        <text className="g5s-len" x={X(baseLabel)} y={Y(baseLabel)}>{fmt(info.baseLen)}</text>
        <text className="g5s-len" x={X(heightLabel)} y={Y(heightLabel)}>{fmt(info.height)}</text>
        {aid && !info.parallelogram && <text className="g5s-half" x={X(rectCentre)} y={Y(rectCentre)}>½</text>}
      </svg>
    </div>
  )
}

export function SlantAreaGame({ question, aid, onAttempt }: GameProps<SlantAreaQ>) {
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
      else if (e.key === 'Enter' && !fromButton(e)) submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, back, submit])

  return (
    <div className="pk-stage pd-stage g5s-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <Board q={question} aid={aid} />
      <HintButton aid={aid} hint={question.hint} />
      <div className="g5s-answer-row">
        <div className={`pd-answer digi${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`} dir="ltr" role="status">
          {value || <span className="pd-caret" aria-hidden="true">?</span>}
        </div>
        <span className="g5s-unit">סמ״ר</span>
      </div>
      <DigitPad onDigit={digit} onBack={back} onGo={submit} disabled={locked} />
    </div>
  )
}
