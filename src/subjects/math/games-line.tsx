import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake, useWidth } from './games-pad'
import { M } from './ids'
import { PickGame } from '../../ui/pick/PickGame'
import type { Line, MisplacedQ, PlaceQ, WhichNumberQ } from './types'
import './math.css'

// Lines are laid out in pixels (not a scaled viewBox) so numbers stay readable on a phone.
const PAD_START = 40
const PAD_END = 52

/** Snap to the nearest step and keep inside the line. */
export function snap(v: number, { min, max, step, snap: unit = step }: Line) {
  const s = min + Math.round((v - min) / unit) * unit
  return Math.min(max, Math.max(min, s))
}

const valueAt = (px: number, w: number, line: Line) =>
  snap(line.min + ((px - PAD_START) / (w - PAD_START - PAD_END)) * (line.max - line.min), line)

function Axis({ line, w, y, numbers }: { line: Line; w: number; y: number; numbers: boolean }) {
  const { min, max, step, labelEvery } = line
  const x = (v: number) => PAD_START + ((v - min) / (max - min)) * (w - PAD_START - PAD_END)
  const count = Math.round((max - min) / step)
  const ticks = Array.from({ length: count + 1 }, (_, i) => min + i * step)
  // On a narrow screen show only every k-th label so numbers never touch.
  const skip = [1, 2, 5, 10].find(k => k * (x(min + labelEvery) - x(min)) >= 46) ?? 10
  return (
    <g>
      <line x1={x(min) - 8} y1={y} x2={w - PAD_END + 22} y2={y} stroke="var(--ink)" strokeWidth={4} strokeLinecap="round" />
      <polygon points={`${w - PAD_END + 34},${y} ${w - PAD_END + 20},${y - 9} ${w - PAD_END + 20},${y + 9}`} fill="var(--ink)" />
      {ticks.map(v => {
        const major = (v - min) % labelEvery === 0
        return (
          <g key={v}>
            <line x1={x(v)} y1={y - (major ? 11 : 6)} x2={x(v)} y2={y + (major ? 11 : 6)} stroke="var(--ink)" strokeWidth={major ? 3 : 1.5} />
            {numbers && major && ((v - min) / labelEvery) % skip === 0 && (
              <text x={x(v)} y={y + 38} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink)" className="ml-num">{v}</text>
            )}
          </g>
        )
      })}
    </g>
  )
}

export function PlaceGame({ question, aid, onAttempt }: GameProps<PlaceQ>) {
  const { line, target, tolerance, hint } = question
  const [value, setValue] = useState(() => (target === line.min ? line.max : line.min))
  const [dragging, setDragging] = useState(false)
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  const svg = useRef<SVGSVGElement>(null)
  const marker = useRef<SVGGElement>(null)
  const [wrap, w] = useWidth(640)
  useHintOnAid(aid, hint)

  const Y = 104
  const x = PAD_START + ((value - line.min) / (line.max - line.min)) * (w - PAD_START - PAD_END)

  const fromEvent = (e: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    if (r.width === 0) return
    setValue(valueAt(((e.clientX - r.left) / r.width) * w, w, line))
  }
  const down = (e: PointerEvent) => {
    if (done.current) return
    e.preventDefault()
    svg.current?.setPointerCapture?.(e.pointerId)
    marker.current?.focus()
    setDragging(true)
    fromEvent(e)
  }
  const move = (e: PointerEvent) => { if (dragging && !done.current) fromEvent(e) }
  const check = () => {
    if (done.current) return
    const ok = Math.abs(value - target) <= tolerance
    if (ok) { done.current = true; setLocked(true) } else shake()
    onAttempt(ok)
  }
  const key = (e: KeyboardEvent) => {
    if (done.current) return
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (dir) {
      e.preventDefault()
      setValue(v => snap(v + dir * (line.snap ?? line.step), line))
    } else if (e.key === 'Home') { e.preventDefault(); setValue(line.min) }
    else if (e.key === 'End') { e.preventDefault(); setValue(line.max) }
    else if (e.key === 'Enter') { e.preventDefault(); check() }
  }

  return (
    <div className="pk-stage ml-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="pk-expr digi" dir="ltr">{question.target}</div>
      <HintButton aid={aid} hint={hint} />
      <div className="ml-wrap" ref={wrap}>
        <svg ref={svg} width={w} height={150} className="ml-svg" style={{ direction: 'ltr', touchAction: 'none' }}
          onPointerDown={down} onPointerMove={move} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
          <Axis line={line} w={w} y={Y} numbers />
          <g ref={marker} className={`ml-marker${dragging ? ' drag' : ''}${locked ? ' ok' : ''}${shaking ? ' bad' : ''}`}
            tabIndex={locked ? -1 : 0} role="slider" aria-label={phrases[question.instruction]}
            aria-valuemin={line.min} aria-valuemax={line.max} aria-valuenow={value} aria-valuetext={aid || locked ? `${value}` : undefined}
            transform={`translate(${x} 0)`} onKeyDown={key}>
            <rect x={-32} y={8} width={64} height={Y} fill="transparent" />
            {/* The marker's value would let a child match digits instead of reading the line: shown only as an aid. */}
            {(aid || locked) && <>
              <rect className="ml-bubble" x={-30} y={10} width={60} height={36} rx={12} />
              <text className="ml-value" x={0} y={36} textAnchor="middle" fontSize={24} fontWeight={800}>{value}</text>
            </>}
            <polygon className="ml-tri" points={`-18,52 18,52 0,${Y - 6}`} />
          </g>
        </svg>
      </div>
      <button type="button" className="cta ml-check" disabled={locked} onClick={check}>{phrases[M.check]} ✓</button>
    </div>
  )
}

export function MisplacedGame({ question, aid, onAttempt }: GameProps<MisplacedQ>) {
  const { line, labels, answer, hint } = question
  const [wrong, setWrong] = useState<number[]>([])
  const [right, setRight] = useState(false)
  const done = useRef(false)
  const [wrap, w] = useWidth(640)
  useHintOnAid(aid, hint)

  const x = (v: number) => PAD_START + ((v - line.min) / (line.max - line.min)) * (w - PAD_START - PAD_END)
  const Y = 150
  // When neighbours would overlap, alternate labels between two heights.
  const order = labels.map((l, i) => ({ at: l.at, i })).sort((a, b) => a.at - b.at)
  const gaps = order.slice(1).map((o, k) => x(o.at) - x(order[k]!.at))
  const crowded = gaps.length > 0 && Math.min(...gaps) < 64
  const topOf = (i: number) => (crowded && order.findIndex(o => o.i === i) % 2 === 1 ? 8 : 62)

  const choose = (i: number) => {
    if (done.current || wrong.includes(i)) return
    const ok = i === answer
    if (ok) { done.current = true; setRight(true) } else setWrong(ws => [...ws, i])
    onAttempt(ok)
  }

  return (
    <div className="pk-stage ml-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={hint} />
      <div className="ml-wrap" ref={wrap}>
        <svg width={w} height={Y + 30} className="ml-svg" style={{ direction: 'ltr' }}>
          <Axis line={line} w={w} y={Y} numbers={false} />
          {/* Stems first, so a neighbouring label box is never crossed by another label's stem. */}
          {labels.map((l, i) => (
            <line key={`s${i}`} x1={x(l.at)} y1={topOf(i) + 48} x2={x(l.at)} y2={Y - 12} stroke="var(--line)" strokeWidth={3} strokeDasharray="3 5" />
          ))}
          {labels.map((l, i) => {
            const top = topOf(i)
            const state = right && i === answer ? ' ok' : wrong.includes(i) ? ' bad' : ''
            return (
              <g key={i} className={`ml-lab${state}`} role="button" tabIndex={wrong.includes(i) || right ? -1 : 0} aria-label={l.text}
                aria-disabled={wrong.includes(i) || right} transform={`translate(${x(l.at)} 0)`}
                onClick={() => choose(i)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i) } }}>
                <rect x={-30} y={top} width={60} height={48} rx={14} />
                <text x={0} y={top + 34} textAnchor="middle" fontSize={28} fontWeight={800}>{l.text}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function NumberLineGame({ question, aid, onAttempt }: GameProps<PlaceQ | MisplacedQ>) {
  return 'target' in question
    ? <PlaceGame question={question} aid={aid} onAttempt={onAttempt} />
    : <MisplacedGame question={question} aid={aid} onAttempt={onAttempt} />
}

/** "Which number is marked?": the line with a marked point above the shared pick-one-answer UI. */
export function WhichNumberGame({ question, aid, onAttempt }: GameProps<WhichNumberQ>) {
  const [ref, w] = useWidth(640)
  const { line, marked } = question
  const x = PAD_START + ((marked - line.min) / (line.max - line.min)) * (w - PAD_START - PAD_END)
  return (
    <div className="ml-stage">
      <div ref={ref} className="ml-wrap" dir="ltr">
        <svg width={w} height={96} role="img" aria-label={`${line.min}–${line.max}`}>
          <Axis line={line} w={w} y={36} numbers />
          <circle cx={x} cy={36} r={11} fill="var(--clock)" stroke="var(--card)" strokeWidth={3} />
          <text x={x} y={16} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--clock)">?</text>
        </svg>
      </div>
      <PickGame question={question} aid={aid} onAttempt={onAttempt} />
    </div>
  )
}
