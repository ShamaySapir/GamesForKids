import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M } from './ids'
import type { BinsQ } from './types'
import './math-g3.css'
import './math-g5-art.css'

// BinsGame (grade 5, skill 43): sort numbers into N bins (prime / composite / neither). Like SortGame, with N bins.
// Keyboard: Tab to a number, then 1..N = that bin, Backspace = back to the pool. Enter selects a number and Enter on a
// bin puts the selected number in it. Per-question state; PlayScreen remounts this component for every question.

const DRAG_THRESHOLD = 8

/** 'pool' or the index of a bin. */
type Spot = 'pool' | number
interface Drag { index: number; sx: number; sy: number; dx: number; dy: number; moved: boolean; over: Spot | null }

export function BinsGame({ question, aid, onAttempt }: GameProps<BinsQ>) {
  const { items, bins, answer } = question
  const [spot, setSpot] = useState<readonly Spot[]>(() => items.map(() => 'pool'))
  const [locked, setLocked] = useState<ReadonlySet<number>>(new Set())
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [done, setDone] = useState(false)
  const [refocus, setRefocus] = useState(0)
  const [shaking, shake] = useShake()
  const els = useRef<Map<Spot, HTMLDivElement>>(new Map())
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
    (['pool', ...bins.map((_, b) => b)] as Spot[]).find(s => {
      const r = els.current.get(s)?.getBoundingClientRect()
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
    if (to !== null) put(index, to)
  }

  const onChipClick = (i: number) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (!done && !locked.has(i)) setSelected(s => (s === i ? null : i))
  }
  const onChipKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const digit = /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : -1
    const to: Spot | null = digit >= 0 && digit < bins.length ? digit : e.key === 'Backspace' || e.key === 'Delete' ? 'pool' : null
    if (to === null) return
    e.preventDefault()
    put(i, to)
    setRefocus(n => n + 1)
  }
  const onSpotClick = (to: Spot) => { if (selected !== null) put(selected, to) }

  const allSorted = spot.every(s => s !== 'pool')
  const [missed, setMissed] = useState<ReadonlySet<number>>(new Set())
  const check = () => {
    if (done || !allSorted) return
    const all = items.map((_, i) => i)
    const miss = all.filter(i => !locked.has(i) && spot[i] !== answer[i])
    if (miss.length === 0) {
      setDone(true)
      setLocked(new Set(all))
      setMissed(new Set())
      onAttempt(true)
      return
    }
    setLocked(new Set(all.filter(i => !miss.includes(i))))
    setMissed(new Set(miss))
    setSpot(s => s.map((x, i) => (miss.includes(i) ? 'pool' : x)))
    setSelected(null)
    shake()
    onAttempt(false)
  }

  const chip = (i: number) => {
    const dragging = drag?.moved && drag.index === i
    return (
      <button key={i} type="button" data-chip={i}
        className={`g3-chip digi${selected === i ? ' sel' : ''}${dragging ? ' dragging' : ''}${locked.has(i) ? ' ok' : ''}${missed.has(i) && shaking ? ' miss' : ''}`}
        style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
        disabled={locked.has(i)} aria-pressed={selected === i} aria-keyshortcuts={`${bins.map((_, b) => b + 1).join(' ')} Backspace`}
        onClick={() => onChipClick(i)} onKeyDown={e => onChipKey(e, i)}
        onPointerDown={e => onDown(e, i)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        {items[i]}
      </button>
    )
  }
  const inSpot = (s: Spot) => items.map((_, i) => i).filter(i => spot[i] === s)

  return (
    <div className="pk-stage g3-stage" ref={root}>
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div ref={el => { if (el) els.current.set('pool', el) }} className={`g3-pool${shaking ? ' shake' : ''}${drag?.over === 'pool' ? ' aim' : ''}`}
        dir="ltr" role="group" onClick={e => { if (e.target === e.currentTarget) onSpotClick('pool') }}>
        {inSpot('pool').map(chip)}
      </div>
      <div className="g5-bins" style={{ ['--n' as string]: bins.length }}>
        {bins.map((label, b) => (
          <div key={b} ref={el => { if (el) els.current.set(b, el) }} className={`g3-bin${drag?.over === b ? ' aim' : ''}${selected !== null ? ' ready' : ''}`}
            role="group" aria-label={phrases[label] ?? ''}>
            <button type="button" className="g3-bin-label" aria-keyshortcuts={String(b + 1)} onClick={() => onSpotClick(b)} disabled={done}>
              <span className="g3-key digi" aria-hidden="true">{b + 1}</span> {phrases[label]}
            </button>
            <div className="g3-bin-chips" dir="ltr">{inSpot(b).map(chip)}</div>
          </div>
        ))}
      </div>
      {!done && (
        <div className="pv-actions">
          <button type="button" className="cta" disabled={!allSorted} onClick={check}>{phrases[M.check]}</button>
        </div>
      )}
    </div>
  )
}
