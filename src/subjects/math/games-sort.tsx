import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M } from './ids'
import type { SortQ } from './types'
import './math-g3.css'

// Per-question state; PlayScreen remounts this component for every question.
// Keyboard: Tab to a number, then 1 = first bin, 2 = second bin, Backspace = back to the pool. Enter selects a number
// and Enter on a bin puts the selected number in it.

const DRAG_THRESHOLD = 8

type Spot = 'pool' | 'yes' | 'no'
interface Drag { index: number; sx: number; sy: number; dx: number; dy: number; moved: boolean; over: Spot | null }

export function SortGame({ question, aid, onAttempt }: GameProps<SortQ>) {
  const { items, yes, no, answer } = question
  const [spot, setSpot] = useState<readonly Spot[]>(() => items.map(() => 'pool'))
  const [locked, setLocked] = useState<ReadonlySet<number>>(new Set())
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [done, setDone] = useState(false)
  const [refocus, setRefocus] = useState(0)
  const [shaking, shake] = useShake()
  const els = useRef<Record<Spot, HTMLDivElement | null>>({ pool: null, yes: null, no: null })
  const root = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)
  useHintOnAid(aid, question.hint)

  // After a number leaves the pool by keyboard, its button is gone: carry the focus to the next number in the pool.
  useEffect(() => {
    if (refocus > 0) root.current?.querySelector<HTMLElement>('.g3-pool .g3-chip:not(:disabled)')?.focus()
  }, [refocus])

  const put = (i: number, to: Spot) => {
    if (done || locked.has(i)) return
    setSpot(s => s.map((x, k) => (k === i ? to : x)))
    setSelected(null)
  }
  const spotAt = (x: number, y: number): Spot | null =>
    (['yes', 'no', 'pool'] as const).find(s => {
      const r = els.current[s]?.getBoundingClientRect()
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }) ?? null

  const onDown = (e: ReactPointerEvent<HTMLElement>, index: number) => {
    if (done || locked.has(index) || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ index, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, over: null })
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy
    const moved = drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD
    setDrag({ ...drag, dx, dy, moved, over: moved ? spotAt(e.clientX, e.clientY) : null })
  }
  const onUp = (e: ReactPointerEvent) => {
    if (!drag) return
    const { moved, index } = drag
    setDrag(null)
    if (!moved) return
    // Swallow only the click that this same pointer-up produces.
    suppressClick.current = true
    setTimeout(() => { suppressClick.current = false }, 0)
    const to = spotAt(e.clientX, e.clientY)
    if (to) put(index, to)
  }

  const onChipClick = (i: number) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (!done && !locked.has(i)) setSelected(s => (s === i ? null : i))
  }
  const onChipKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const to: Spot | null = e.key === '1' ? 'yes' : e.key === '2' ? 'no' : e.key === 'Backspace' || e.key === 'Delete' ? 'pool' : null
    if (!to) return
    e.preventDefault()
    put(i, to)
    setRefocus(n => n + 1)
  }
  const onSpotClick = (to: Spot) => { if (selected !== null) put(selected, to) }

  const allSorted = spot.every(s => s !== 'pool')
  const check = () => {
    if (done || !allSorted) return
    const miss = items.map((_, i) => i).filter(i => !locked.has(i) && (spot[i] === 'yes') !== answer.includes(i))
    if (miss.length === 0) {
      setDone(true)
      setLocked(new Set(items.map((_, i) => i)))
      onAttempt(true)
      return
    }
    setLocked(new Set(items.map((_, i) => i).filter(i => !miss.includes(i))))
    setSpot(s => s.map((x, i) => (miss.includes(i) ? 'pool' : x)))
    setSelected(null)
    shake()
    onAttempt(false)
  }

  const chip = (i: number) => {
    const s = String(items[i])
    const dragging = drag?.moved && drag.index === i
    return (
      <button key={i} type="button" data-chip={i}
        className={`g3-chip digi${selected === i ? ' sel' : ''}${dragging ? ' dragging' : ''}${locked.has(i) ? ' ok' : ''}`}
        style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
        disabled={locked.has(i)} aria-pressed={selected === i} aria-keyshortcuts="1 2 Backspace"
        onClick={() => onChipClick(i)} onKeyDown={e => onChipKey(e, i)}
        onPointerDown={e => onDown(e, i)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        {aid ? <>{s.slice(0, -1)}<u className="g3-last">{s.slice(-1)}</u></> : s}
      </button>
    )
  }
  const inSpot = (s: Spot) => items.map((_, i) => i).filter(i => spot[i] === s)
  const bin = (s: 'yes' | 'no', label: string, key: string) => (
    <div ref={el => { els.current[s] = el }} className={`g3-bin ${s}${drag?.over === s ? ' aim' : ''}${selected !== null ? ' ready' : ''}`} role="group" aria-label={label}>
      <button type="button" className="g3-bin-label" aria-keyshortcuts={key} onClick={() => onSpotClick(s)} disabled={done}>
        <span className="g3-key digi" aria-hidden="true">{key}</span> {label}
      </button>
      <div className="g3-bin-chips">{inSpot(s).map(chip)}</div>
    </div>
  )

  return (
    <div className="pk-stage g3-stage" ref={root}>
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div ref={el => { els.current.pool = el }} className={`g3-pool${shaking ? ' shake' : ''}${drag?.over === 'pool' ? ' aim' : ''}`}
        dir="ltr" role="group" onClick={e => { if (e.target === e.currentTarget) onSpotClick('pool') }}>
        {inSpot('pool').map(chip)}
      </div>
      <div className="g3-bins">
        {bin('yes', phrases[yes] ?? '', '1')}
        {bin('no', phrases[no] ?? '', '2')}
      </div>
      {!done && (
        <div className="pv-actions">
          <button type="button" className="cta" disabled={!allSorted} onClick={check}>{phrases[M.check]}</button>
        </div>
      )}
    </div>
  )
}
