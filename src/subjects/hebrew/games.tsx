import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { Q, wordPhrase } from './ids'
import { SayButton } from '../../ui/pick/SayButton'
import type { ClapQ, SortCard, SortQ } from './types'
import './hebrew.css'

// Components keep per-question state; PlayScreen remounts them via `key` on each new question.

const MAX_CLAPS = 6
const DRAG_THRESHOLD = 8

/* ---------- ClapGame ---------- */

export function ClapGame({ question, aid, onAttempt }: GameProps<ClapQ>) {
  const [claps, setClaps] = useState(0)
  const [done, setDone] = useState(false)
  const { word } = question

  const clap = useCallback(() => {
    if (done) return
    sfx.tick()
    setClaps(n => Math.min(n + 1, MAX_CLAPS))
  }, [done])

  // Space claps from anywhere, but a focused button keeps its native Space activation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      if (!e.repeat) clap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clap])

  const check = () => {
    if (done || claps === 0) return
    const ok = claps === question.answer
    if (ok) setDone(true)
    else setClaps(0)
    onAttempt(ok)
  }

  return (
    <div className="pk-stage">
      <p className="pk-q">{phrases[Q.clap]}</p>
      <div className="pk-picture" aria-hidden="true">{word.emoji}</div>
      <div className="pk-word-row">
        <div className="he-text pk-word" dir="rtl">{word.text}</div>
        <SayButton id={wordPhrase(word.id)} />
      </div>
      {(aid || done) && (
        <div className="hb-syllables" dir="rtl" aria-hidden="true">
          {word.syllables.map((s, i) => <span key={i} className="he-text hb-syl">{s}</span>)}
        </div>
      )}
      <button type="button" className="hb-drum" onClick={clap} disabled={done} aria-label="🥁">
        <span aria-hidden="true">🥁</span>
      </button>
      <div className="hb-claps" role="status" aria-label={`${claps}`}>
        {Array.from({ length: MAX_CLAPS }, (_, i) => <i key={i} className={`hb-clap-dot${i < claps ? ' on' : ''}`} />)}
      </div>
      <div className="hb-actions">
        <button type="button" className="pill" onClick={() => setClaps(0)} disabled={done || claps === 0}>↺ {phrases[Q.reset]}</button>
        <button type="button" className="cta" onClick={check} disabled={done || claps === 0}>✔ {phrases[Q.check]}</button>
        {aid && <SayButton id={question.syllablesSay} label={`🔊 ${word.syllables.join('·')}`} className="pk-say-wide" />}
      </div>
    </div>
  )
}

/* ---------- SortGame ---------- */

interface Drag { id: string; sx: number; sy: number; dx: number; dy: number; moved: boolean; over: 0 | 1 | null }

export function SortGame({ question, onAttempt }: GameProps<SortQ>) {
  const [placed, setPlaced] = useState<Record<string, 0 | 1>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [aim, setAim] = useState<0 | 1 | null>(null)
  const [shake, setShake] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [live, setLive] = useState('')
  const baskets = useRef<(HTMLElement | null)[]>([null, null])
  const suppressClick = useRef(false)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])

  const { cards, bins } = question
  const loose = cards.filter(c => placed[c.id] === undefined)

  const drop = (card: SortCard, bin: 0 | 1) => {
    setSelected(null)
    setAim(null)
    if (card.bin === bin) {
      const next = { ...placed, [card.id]: bin }
      setPlaced(next)
      setLive(`${card.text} → ${bins[bin]}`)
      sfx.tick()
      if (cards.every(c => next[c.id] !== undefined)) onAttempt(true)
    } else {
      setShake(card.id)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShake(null), 450)
      onAttempt(false)
    }
  }

  const select = (card: SortCard) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    setAim(null)
    if (selected === card.id) { setSelected(null); setLive(''); return }
    setSelected(card.id)
    setLive(card.text)
    void say(card.say)
  }

  const basketClick = (bin: 0 | 1) => {
    const card = cards.find(c => c.id === selected)
    if (card) drop(card, bin)
  }

  const onCardKey = (e: ReactKeyboardEvent, card: SortCard) => {
    if (selected !== card.id) return
    // The first basket is on the right in RTL.
    const dir = e.key === 'ArrowRight' ? 0 : e.key === 'ArrowLeft' ? 1 : null
    if (dir !== null) {
      e.preventDefault()
      setAim(dir)
      setLive(`${card.text} → ${bins[dir]}`)
    } else if (e.key === 'Enter' && aim !== null) {
      e.preventDefault()
      drop(card, aim)
    } else if (e.key === 'Escape') {
      setSelected(null)
      setAim(null)
    }
  }

  const binAt = (x: number, y: number): 0 | 1 | null => {
    for (const bin of [0, 1] as const) {
      const r = baskets.current[bin]?.getBoundingClientRect()
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return bin
    }
    return null
  }

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, card: SortCard) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ id: card.id, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, over: null })
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy
    const moved = drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD
    setDrag({ ...drag, dx, dy, moved, over: moved ? binAt(e.clientX, e.clientY) : null })
  }
  const onUp = (e: ReactPointerEvent, card: SortCard) => {
    if (!drag) return
    const { moved } = drag
    setDrag(null)
    if (!moved) return
    suppressClick.current = true
    const bin = binAt(e.clientX, e.clientY)
    if (bin !== null) drop(card, bin)
  }

  const activeBin = drag?.over ?? aim

  return (
    <div className="pk-stage">
      <p className="pk-q">{phrases[Q.sort]}</p>
      <div className="hb-baskets">
        {([0, 1] as const).map(bin => (
          <div key={bin} ref={el => { baskets.current[bin] = el }}
            className={`hb-basket${activeBin === bin ? ' aim' : ''}${selected ? ' ready' : ''}`} onClick={() => basketClick(bin)}>
            <button type="button" className="hb-basket-label he-letter" disabled={!selected} aria-label={bins[bin]}>{bins[bin]}</button>
            <div className="hb-basket-cards">
              {cards.filter(c => placed[c.id] === bin).map(c => (
                <div key={c.id} className="hb-chip">
                  <span aria-hidden="true">{c.emoji}</span>
                  <span className="he-text hb-chip-text">{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="hb-tray">
        {loose.map(c => {
          const dragging = drag?.id === c.id && drag.moved
          return (
            <div key={c.id} className={`hb-card-wrap${dragging ? ' dragging' : ''}`}
              style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}>
              <button type="button" className={`opt hb-card${selected === c.id ? ' sel' : ''}${shake === c.id ? ' bad' : ''}`}
                onClick={() => select(c)} onKeyDown={e => onCardKey(e, c)}
                onPointerDown={e => onDown(e, c)} onPointerMove={onMove} onPointerUp={e => onUp(e, c)}
                onPointerCancel={() => setDrag(null)}>
                <span className="pk-emoji" aria-hidden="true">{c.emoji}</span>
                <span className="he-text hb-chip-text">{c.text}</span>
              </button>
              <SayButton id={c.say} />
            </div>
          )
        })}
      </div>
      <p className="hb-live" role="status" aria-live="polite">{live}</p>
    </div>
  )
}
