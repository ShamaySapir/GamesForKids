import { useCallback, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { MathText } from '../../ui/pick/MathText'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M } from './ids'
import type { ShadeQ } from './types'
import './math-g4.css'

// Per-question state; PlayScreen remounts this component for every question.

/** Rows × columns for equal rectangles that are as square as possible (6 → 2 × 3, 12 → 3 × 4, a prime → 1 × n). */
export function gridShape(parts: number): [number, number] {
  for (let r = Math.floor(Math.sqrt(parts)); r >= 1; r--) if (parts % r === 0) return [r, parts / r]
  return [1, parts]
}

/** The path of wedge `i` of `n`, starting at the top and going clockwise. */
function wedge(i: number, n: number, c: number, r: number) {
  const pt = (k: number) => {
    const t = (k / n) * 2 * Math.PI - Math.PI / 2
    return `${(c + r * Math.cos(t)).toFixed(2)} ${(c + r * Math.sin(t)).toFixed(2)}`
  }
  return `M${c} ${c} L${pt(i)} A${r} ${r} 0 0 1 ${pt(i + 1)} Z`
}

export function ShadeGame({ question, aid, onAttempt }: GameProps<ShadeQ>) {
  const { shape, parts, answer } = question
  const [on, setOn] = useState<ReadonlySet<number>>(new Set())
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, question.hint)

  const toggle = useCallback((i: number) => {
    if (done.current) return
    setOn(s => new Set(s.has(i) ? [...s].filter(x => x !== i) : [...s, i]))
  }, [])
  const check = () => {
    if (done.current || on.size === 0) return
    const ok = on.size === answer
    if (ok) { done.current = true; setLocked(true) } else shake()
    onAttempt(ok)
  }

  const label = (i: number) => `${i + 1} / ${parts}`
  const [rows, cols] = gridShape(parts)
  const common = (i: number) => ({
    'aria-pressed': on.has(i),
    'aria-label': label(i),
  })

  return (
    <div className="pk-stage g4-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="g4-show digi" dir="ltr"><MathText text={question.show} /></div>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g4-shape ${shape}${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`} dir="ltr" role="group"
        style={shape === 'rect' ? { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` } : undefined}>
        {shape === 'circle' ? (
          <svg viewBox="0 0 240 240" className="g4-pie">
            {Array.from({ length: parts }, (_, i) => (
              <path key={i} d={wedge(i, parts, 120, 114)} role="button" tabIndex={locked ? -1 : 0} {...common(i)}
                className={`g4-wedge${on.has(i) ? ' on' : ''}`}
                onClick={() => toggle(i)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) } }} />
            ))}
          </svg>
        ) : (
          Array.from({ length: parts }, (_, i) => (
            <button key={i} type="button" {...common(i)} disabled={locked}
              className={`g4-part-btn${on.has(i) ? ' on' : ''}`} onClick={() => toggle(i)} />
          ))
        )}
      </div>
      <p className="g4-count digi" dir="ltr" role="status">{aid && !locked ? `${on.size} / ${parts}` : ''}</p>
      <button type="button" className="cta" disabled={locked || on.size === 0} onClick={check}>{phrases[M.check]}</button>
    </div>
  )
}
