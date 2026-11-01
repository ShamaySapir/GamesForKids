import { useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M } from './ids'
import type { BuildQ } from './types'
import './math.css'

export function TapBuildGame({ question, aid, onAttempt }: GameProps<BuildQ>) {
  const { emoji, max, show, answer, hint } = question
  const [count, setCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, hint)

  const add = () => { if (!done.current) setCount(c => Math.min(max, c + 1)) }
  const remove = () => { if (!done.current) setCount(c => Math.max(0, c - 1)) }
  const reset = () => { if (!done.current) setCount(0) }
  const check = () => {
    if (done.current) return
    const ok = count === answer
    if (ok) { done.current = true; setLocked(true) } else shake()
    onAttempt(ok)
  }

  // Rows of five make groups easy to see and count (curriculum: grouping).
  const rows = Array.from({ length: Math.ceil(count / 5) }, (_, r) =>
    Array.from({ length: Math.min(5, count - r * 5) }, (_, i) => r * 5 + i))

  return (
    <div className="pk-stage tb-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="pk-expr digi tb-show" dir="ltr">{show}</div>
      <HintButton aid={aid} hint={hint} />
      <div className={`tb-tray${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`}>
        {rows.map((row, r) => (
          <div key={r} className="tb-row">
            {row.map(i => (
              <button key={i} type="button" className="tb-obj" aria-label={emoji} disabled={locked} onClick={remove}>{emoji}</button>
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="tb-basket" aria-label="🧺" disabled={locked || count >= max} onClick={add} autoFocus>
        <span aria-hidden="true">🧺</span>
        <span className="tb-plus" aria-hidden="true">+</span>
      </button>
      <div className="tb-actions">
        <button type="button" className="pill" disabled={locked || count === 0} onClick={reset}>{phrases[M.reset]}</button>
        <button type="button" className="cta" disabled={locked} onClick={check}>{phrases[M.check]} ✓</button>
      </div>
    </div>
  )
}
