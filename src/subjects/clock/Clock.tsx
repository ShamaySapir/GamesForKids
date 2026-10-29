import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { angleOf, dragHour, dragMinute, hourAngle, minuteAngle, stepTime, timeText, type Time } from './time'

export type Hand = 'hour' | 'minute'

interface Props {
  time: Time
  /** Set to make hands draggable (mouse, touch) and keyboard-adjustable. */
  onChange?: (t: Time) => void
  /** Minute-hand snapping while dragging. */
  snap?: number
  /** Hands that can be moved. Defaults to both. */
  movable?: readonly Hand[]
  /** Make hands clickable (for "which hand is which"). */
  onHandClick?: (hand: Hand) => void
  /** Visual aid: minute numbers around the face and half/quarter shading. */
  aid?: boolean
  /** Faded hands showing the correct answer. */
  ghost?: Time
  size?: number | string
  label?: string
}

const C = 120
const FACE = 94
const SVG_PT = 240
/** Hand grab areas start this far from the center, so one hand's area never covers the other near the hub. */
const GRAB_FROM = 22

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return [C + Math.sin(a) * r, C - Math.cos(a) * r] as const
}

/** Analog clock. Hour hand is short and red, minute hand long and purple (as in the prototype). */
export function Clock({ time, onChange, snap = 5, movable = ['hour', 'minute'], onHandClick, aid, ghost, size = 260, label }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<Hand | null>(null)
  const interactive = !!onChange

  const pointAngle = (e: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    return angleOf(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2)
  }

  const onPointerDown = (hand: Hand) => (e: PointerEvent) => {
    if (onHandClick) return onHandClick(hand)
    if (!interactive || !movable.includes(hand)) return
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDragging(hand)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging || !onChange) return
    const angle = pointAngle(e)
    const next = dragging === 'minute' ? dragMinute(time, angle, snap) : dragHour(time, angle)
    if (next.h !== time.h || next.m !== time.m) onChange(next)
  }

  const onKey = (hand: Hand) => (e: KeyboardEvent) => {
    if (onHandClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      return onHandClick(hand)
    }
    if (!onChange) return
    const dir = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    onChange(stepTime(time, hand, dir, snap))
  }

  const hand = (which: Hand, t: Time, opts: { ghost?: boolean } = {}) => {
    const isHour = which === 'hour'
    const deg = isHour ? hourAngle(t) : minuteAngle(t)
    const [x, y] = polar(deg, isHour ? 48 : 76)
    const [gx, gy] = polar(deg, GRAB_FROM)
    const color = isHour ? 'var(--clock)' : 'var(--abc)'
    if (opts.ghost) return <line key={`g-${which}`} x1={C} y1={C} x2={x} y2={y} stroke={color} strokeWidth={isHour ? 10 : 6} strokeLinecap="round" opacity={0.25} strokeDasharray="4 6" />
    const active = (interactive && movable.includes(which)) || !!onHandClick
    return (
      <g key={which} className={`hand${active ? ' hand-active' : ''}${dragging === which ? ' hand-drag' : ''}`}
        onPointerDown={onPointerDown(which)} onKeyDown={onKey(which)}
        tabIndex={active ? 0 : undefined}
        role={active ? (onHandClick ? 'button' : 'slider') : undefined}
        aria-label={isHour ? 'מחוג השעות' : 'מחוג הדקות'}
        aria-valuetext={active && !onHandClick ? timeText(time) : undefined}>
        {/* Wide transparent grab area, starting away from the center where the two hands always meet. */}
        <line x1={gx} y1={gy} x2={x} y2={y} stroke="transparent" strokeWidth={28} strokeLinecap="round" />
        <line x1={C} y1={C} x2={x} y2={y} stroke={color} strokeWidth={isHour ? 10 : 6} strokeLinecap="round" />
        {active && <circle cx={x} cy={y} r={isHour ? 9 : 8} fill={color} />}
      </g>
    )
  }

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0
    const [x1, y1] = polar(i * 6, FACE - 8)
    const [x2, y2] = polar(i * 6, FACE - 8 - (big ? 10 : 4))
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={big ? 3 : 1} />
  })
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = polar((i + 1) * 30, FACE - 32)
    return <text key={i} x={x} y={y + 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--ink)">{i + 1}</text>
  })
  const minuteLabels = aid && Array.from({ length: 12 }, (_, i) => {
    const [x, y] = polar(i * 30, FACE + 15)
    return <text key={i} x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--abc)">{String(i * 5).padStart(2, '0')}</text>
  })

  return (
    <svg ref={svg} viewBox={`0 0 ${SVG_PT} ${SVG_PT}`} width={size} role="img" aria-label={label ?? 'שעון'}
      className="clock" style={{ touchAction: interactive ? 'none' : undefined, maxWidth: '100%', direction: 'ltr' }}
      onPointerMove={onPointerMove} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)}>
      <circle cx={C} cy={C} r={FACE} fill="var(--card)" stroke="var(--clock)" strokeWidth="8" />
      {aid && <path d={`M${C} ${C} L${C} ${C - FACE + 4} A${FACE - 4} ${FACE - 4} 0 0 1 ${C} ${C + FACE - 4} Z`} fill="var(--abc)" opacity=".08" />}
      {ticks}
      {numbers}
      {minuteLabels}
      {ghost && [hand('hour', ghost, { ghost: true }), hand('minute', ghost, { ghost: true })]}
      {/* Hour hand last so it stays on top (grabbable) where the hands overlap. */}
      {hand('minute', time)}
      {hand('hour', time)}
      <circle cx={C} cy={C} r="8" fill="var(--ink)" />
    </svg>
  )
}
