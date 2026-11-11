import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as RPointerEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M } from './ids'
import type { MeanQ } from './types'
import './math-g6.css'

// Per-question state; PlayScreen remounts this component for every question.

const DRAG_PX = 8

/** Moves the top block of bar `from` onto bar `to`. */
export function moveBlock(heights: readonly number[], from: number, to: number): number[] {
  if (from === to || (heights[from] ?? 0) <= 0) return [...heights]
  return heights.map((h, i) => (i === from ? h - 1 : i === to ? h + 1 : h))
}

export function MeanGame({ question, aid, onAttempt }: GameProps<MeanQ>) {
  const { values, answer } = question
  const [heights, setHeights] = useState<number[]>(() => [...values])
  const [sel, setSel] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  const drag = useRef<{ from: number; x: number; y: number; moved: boolean } | null>(null)
  const swallow = useRef(false) // the click that follows a finished drag
  useHintOnAid(aid, question.hint)

  const move = (from: number, to: number) => {
    if (done.current) return
    setHeights(h => moveBlock(h, from, to))
  }
  const act = (i: number) => {
    if (done.current) return
    if (sel === null) { if ((heights[i] ?? 0) > 0) setSel(i) }
    else if (sel === i) setSel(null)
    else { move(sel, i); setSel(null) }
  }
  const barAt = (x: number, y: number): number | null => {
    const el = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : null
    const b = el?.closest<HTMLElement>('[data-bar]')
    return b ? Number(b.dataset.bar) : null
  }
  const onDown = (e: RPointerEvent, i: number) => {
    if (done.current || (heights[i] ?? 0) <= 0) return
    drag.current = { from: i, x: e.clientX, y: e.clientY, moved: false }
  }
  const onMove = (e: RPointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > DRAG_PX) { d.moved = true; setSel(d.from) }
    if (d.moved) setOver(barAt(e.clientX, e.clientY))
  }
  const onUp = (e: RPointerEvent) => {
    const d = drag.current
    drag.current = null
    setOver(null)
    if (!d || !d.moved) return
    swallow.current = true
    const to = barAt(e.clientX, e.clientY)
    if (to !== null && to !== d.from) move(d.from, to)
    setSel(null)
  }
  const onClick = (i: number) => {
    if (swallow.current) { swallow.current = false; return }
    act(i)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSel(null); drag.current = null; setOver(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const check = () => {
    if (done.current) return
    const ok = heights.every(h => h === heights[0])
    if (ok) { done.current = true; setLocked(true); setSel(null) } else shake()
    onAttempt(ok)
  }
  const reset = () => { if (!done.current) { setHeights([...values]); setSel(null) } }

  const avg = heights.reduce((a, b) => a + b, 0) / Math.max(1, heights.length)
  const rowMax = Math.max(...values, ...heights, 1)

  return (
    <div className="pk-stage g6-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g6-mean${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`} dir="ltr" role="group">
        {heights.map((h, i) => (
          <button key={i} type="button" data-bar={i} disabled={locked}
            className={`g6-bar${sel === i ? ' pick' : ''}${over === i && over !== sel ? ' over' : ''}`}
            style={{ minHeight: `calc(${rowMax} * (var(--g6-block) + 2px) + 8px)` }}
            aria-label={`${i + 1}: ${h}`} aria-pressed={sel === i}
            onPointerDown={e => onDown(e, i)} onPointerMove={onMove} onPointerUp={onUp}
            onPointerCancel={() => { drag.current = null; setOver(null) }}
            onClick={() => onClick(i)}>
            {Array.from({ length: h }, (_, k) => (
              <span key={k} className={`g6-block${k === h - 1 && sel === i ? ' lift' : ''}`} />
            ))}
          </button>
        ))}
        {aid && !locked && (
          <span className="g6-avg" aria-hidden="true"
            style={{ bottom: `calc(14px + ${avg} * (var(--g6-block) + 2px))` }} />
        )}
      </div>
      <p className="g6-meanlabel digi" dir="rtl" role="status">{locked ? `הַמְּמֻצָּע: ${answer}` : ''}</p>
      <div className="g6-row">
        <button type="button" className="cta g6-ghost" disabled={locked} onClick={reset}>{phrases[M.reset]}</button>
        <button type="button" className="cta" disabled={locked} onClick={check}>{phrases[M.check]}</button>
      </div>
    </div>
  )
}
