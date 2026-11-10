import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M, M3 } from './ids'
import type { ShareQ } from './types'
import './math-g2.css'
import './math-g3-art.css'

// Per-question state; PlayScreen remounts this component for every question.

const DRAG_THRESHOLD = 8

interface Drag { index: number; sx: number; sy: number; dx: number; dy: number; moved: boolean; over: number }

export function ShareGame({ question, aid, onAttempt }: GameProps<ShareQ>) {
  const { emoji, total, plates, answer, leftover } = question
  const rest = total % plates
  const [pile, setPile] = useState(total)
  const [onPlate, setOnPlate] = useState<number[]>(() => Array.from({ length: plates }, () => 0))
  const [bowl, setBowl] = useState(0)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [done, setDone] = useState(false)
  const [shaking, shake] = useShake()
  const plateEls = useRef<(HTMLDivElement | null)[]>([])
  const bowlEl = useRef<HTMLDivElement | null>(null)
  const suppressClick = useRef(false)
  useHintOnAid(aid, question.hint)

  const give = (p: number) => {
    if (done || pile === 0) return
    setPile(n => n - 1)
    setOnPlate(c => c.map((n, i) => (i === p ? n + 1 : n)))
  }
  const takeBack = (p: number) => {
    if (done || onPlate[p] === 0) return
    setPile(n => n + 1)
    setOnPlate(c => c.map((n, i) => (i === p ? n - 1 : n)))
  }
  const giveBowl = () => {
    if (done || pile === 0) return
    setPile(n => n - 1)
    setBowl(n => n + 1)
  }
  const takeBowl = () => {
    if (done || bowl === 0) return
    setPile(n => n + 1)
    setBowl(n => n - 1)
  }
  const inside = (el: HTMLElement | null | undefined, x: number, y: number) => {
    const r = el?.getBoundingClientRect()
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }
  /** Index of the plate under the point, `plates` for the left-over bowl, -1 for neither. */
  const plateAt = (x: number, y: number) => {
    const p = plateEls.current.findIndex(el => inside(el, x, y))
    return p >= 0 ? p : leftover && inside(bowlEl.current, x, y) ? plates : -1
  }

  const onDown = (e: ReactPointerEvent<HTMLElement>, index: number) => {
    if (done || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ index, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, over: -1 })
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy
    const moved = drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD
    setDrag({ ...drag, dx, dy, moved, over: moved ? plateAt(e.clientX, e.clientY) : -1 })
  }
  const onUp = (e: ReactPointerEvent) => {
    if (!drag) return
    const { moved } = drag
    setDrag(null)
    if (!moved) return
    // Swallow only the click that this same pointer-up produces, not the child's next tap on a plate.
    suppressClick.current = true
    setTimeout(() => { suppressClick.current = false }, 0)
    const p = plateAt(e.clientX, e.clientY)
    if (p === plates) giveBowl()
    else if (p >= 0) give(p)
  }
  const onPlateClick = (p: number) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    give(p)
  }

  const check = () => {
    if (done) return
    if (pile === 0 && onPlate.every(n => n === answer) && bowl === (leftover ? rest : 0)) {
      setDone(true)
      onAttempt(true)
    } else {
      shake()
      onAttempt(false)
    }
  }
  const reset = () => {
    setPile(total)
    setBowl(0)
    setOnPlate(onPlate.map(() => 0))
  }

  return (
    <div className="pk-stage sh-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className="sh-pile" role="group" aria-label={emoji}>
        {Array.from({ length: pile }, (_, i) => {
          const dragging = drag?.moved && drag.index === i
          return (
            <span key={i} className={`sh-item${dragging ? ' dragging' : ''}`}
              style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
              onPointerDown={e => onDown(e, i)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>{emoji}</span>
          )
        })}
      </div>
      <div className={`sh-plates${shaking ? ' bad' : ''}`}>
        {onPlate.map((n, p) => (
          <div key={p} ref={el => { plateEls.current[p] = el }} className={`sh-plate${drag?.over === p ? ' aim' : ''}${done ? ' ok' : ''}`}>
            <button type="button" className="sh-dish" aria-label={`🍽️ ${p + 1}`} disabled={done || pile === 0} onClick={() => onPlateClick(p)}>🍽️</button>
            <div className="sh-on">
              {Array.from({ length: n }, (_, k) => (
                <button key={k} type="button" className="sh-item sh-placed" aria-label={`${emoji} ✕`} disabled={done} onClick={() => takeBack(p)}>{emoji}</button>
              ))}
            </div>
            <div className="sh-count digi" dir="ltr" aria-hidden={!aid}>{aid ? n : ''}</div>
          </div>
        ))}
      </div>
      {leftover && (
        <div ref={bowlEl} className={`g3a-bowl${drag?.over === plates ? ' aim' : ''}${done ? ' ok' : ''}`}>
          <div className="g3a-bowl-label">{phrases[M3.leftover]}</div>
          <button type="button" className="g3a-bowl-dish" aria-label={`🥣 ${phrases[M3.leftover]}`} disabled={done || pile === 0} onClick={giveBowl}>🥣</button>
          <div className="sh-on">
            {Array.from({ length: bowl }, (_, k) => (
              <button key={k} type="button" className="sh-item sh-placed" aria-label={`${emoji} ✕`} disabled={done} onClick={takeBowl}>{emoji}</button>
            ))}
          </div>
          <div className="sh-count digi" dir="ltr" aria-hidden={!aid}>{aid ? bowl : ''}</div>
        </div>
      )}
      {done
        ? (
          <div className="sh-eq digi" dir="ltr" role="status">
            {total} ÷ {plates} = {answer}{leftover ? `, ${phrases[M3.leftover]} ${rest}` : ''}
          </div>
        )
        : (
          <div className="pv-actions">
            <button type="button" className="cta" disabled={pile === total} onClick={check}>{phrases[M.check]}</button>
            <button type="button" className="pill" disabled={pile === total} onClick={reset}>{phrases[M.reset]}</button>
          </div>
        )}
    </div>
  )
}
