import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { SayButton } from '../../ui/pick/SayButton'
import { Coin, type CoinValue } from './coins'
import { M } from './ids'
import { pricePhrase } from './numbers'
import type { CoinsQ } from './types'
import '../../ui/pick/pick.css'
import './math-coins.css'

// Per-question state; PlayScreen remounts this component for every question.

const DRAG_THRESHOLD = 8
const MAX_COINS = 20

interface Drag { value: CoinValue; sx: number; sy: number; dx: number; dy: number; moved: boolean; over: boolean }

export function CoinsGame({ question, aid, onAttempt }: GameProps<CoinsQ>) {
  const [wallet, setWallet] = useState<CoinValue[]>([])
  const [drag, setDrag] = useState<Drag | null>(null)
  const [shake, setShake] = useState(false)
  const [done, setDone] = useState(false)
  const walletEl = useRef<HTMLDivElement | null>(null)
  const suppressClick = useRef(false)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hinted = useRef(false)
  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])
  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const { item, price, coins } = question
  const total = wallet.reduce((s, v) => s + v, 0)
  const priceSay = pricePhrase(price)

  const add = (value: CoinValue) => {
    if (done || wallet.length >= MAX_COINS) return
    sfx.tick()
    setWallet(w => [...w, value])
  }
  const remove = (index: number) => {
    if (done) return
    setWallet(w => w.filter((_, i) => i !== index))
  }
  const check = () => {
    if (done || wallet.length === 0) return
    if (total === price) {
      setDone(true)
      onAttempt(true)
    } else {
      setShake(true)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShake(false), 450)
      onAttempt(false)
    }
  }

  const overWallet = (x: number, y: number) => {
    const r = walletEl.current?.getBoundingClientRect()
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }
  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, value: CoinValue) => {
    if (done || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ value, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, over: false })
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const dx = e.clientX - drag.sx
    const dy = e.clientY - drag.sy
    const moved = drag.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD
    setDrag({ ...drag, dx, dy, moved, over: moved && overWallet(e.clientX, e.clientY) })
  }
  const onUp = (e: ReactPointerEvent) => {
    if (!drag) return
    const { moved, value } = drag
    setDrag(null)
    if (!moved) return
    suppressClick.current = true
    if (overWallet(e.clientX, e.clientY)) add(value)
  }
  const onCoinClick = (value: CoinValue) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    add(value)
  }

  return (
    <div className="mc-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="mc-shop">
        <span className="mc-item" role="img" aria-label={[item.name].flat().map(id => phrases[id]).join(' ')}>{item.emoji}</span>
        <span className="mc-tag digi" dir="ltr">{price} ₪</span>
        <SayButton id={priceSay} />
        {aid && question.hint && (
          <button type="button" className="pill pk-hint" aria-label="🔊" onClick={() => void say(question.hint as string)}>💡 🔊</button>
        )}
      </div>
      <div ref={walletEl} className={`mc-wallet${drag?.over ? ' aim' : ''}${shake ? ' bad' : ''}${done ? ' ok' : ''}`}>
        <div className="mc-wallet-head">
          <span className="mc-purse" aria-hidden="true">👛</span>
          <span className="mc-total digi" dir="ltr" role="status" aria-live="polite">{total} ₪</span>
        </div>
        <div className="mc-wallet-coins">
          {wallet.map((v, i) => (
            <button key={i} type="button" className="mc-coin-btn" aria-label={`${v} ₪ ✕`} disabled={done} onClick={() => remove(i)}>
              <Coin value={v} size={v === 10 ? 72 : 64} />
            </button>
          ))}
        </div>
      </div>
      <div className="mc-tray">
        {coins.map(v => {
          const dragging = drag?.value === v && drag.moved
          return (
            <div key={v} className={`mc-coin-wrap${dragging ? ' dragging' : ''}`}
              style={dragging && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}>
              <button type="button" className="mc-coin-btn" aria-label={`${v} ₪`} disabled={done}
                onClick={() => onCoinClick(v)} onPointerDown={e => onDown(e, v)} onPointerMove={onMove}
                onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
                <Coin value={v} />
              </button>
            </div>
          )
        })}
      </div>
      <div className="mc-actions">
        <button type="button" className="cta" disabled={done || wallet.length === 0} onClick={check}>{phrases[M.check]}</button>
        <button type="button" className="pill" disabled={done || wallet.length === 0} onClick={() => setWallet([])}>{phrases[M.reset]}</button>
      </div>
    </div>
  )
}
