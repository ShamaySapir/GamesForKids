import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { T } from './ids'
import type { SymGridQ } from './types'
import '../../ui/pick/pick.css'
import './thinking.css'

const key = (r: number, c: number) => `${r},${c}`
// Colors arrive as token names ('--think') or plain CSS colors.
const paint = (color: string) => (color.startsWith('--') ? `var(${color})` : color)
const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0],
}

// The grid is a picture, so it stays left-to-right even on an RTL page: "left half" is the visual left.
export function SymmetryGridGame({ question, aid, onAttempt }: GameProps<SymGridQ>) {
  const { rows, cols, given, color, answer } = question
  const half = Math.floor(cols / 2)
  const [filled, setFilled] = useState<ReadonlySet<string>>(new Set())
  const [shaking, setShaking] = useState(false)
  const [focus, setFocus] = useState<readonly [number, number]>([0, half])
  const cells = useRef(new Map<string, HTMLButtonElement>())
  const hinted = useRef(false)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = useRef(false)
  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])
  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const givenSet = new Set(given.map(([r, c]) => key(r, c)))
  const toggle = (r: number, c: number) => {
    if (done.current) return
    setFilled(prev => {
      const next = new Set(prev)
      if (!next.delete(key(r, c))) next.add(key(r, c))
      return next
    })
  }
  const check = () => {
    if (done.current) return
    const want = new Set(answer.map(([r, c]) => key(r, c)))
    const ok = want.size === filled.size && [...want].every(k => filled.has(k))
    if (ok) {
      done.current = true
      sfx.tick()
      onAttempt(true)
    } else {
      setShaking(true)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShaking(false), 450)
      onAttempt(false)
    }
  }
  const onKey = (e: KeyboardEvent, r: number, c: number) => {
    const d = ARROWS[e.key]
    if (!d) return
    e.preventDefault()
    const nr = r + d[0]
    const nc = c + d[1]
    if (nr < 0 || nr >= rows || nc < half || nc >= cols) return
    setFocus([nr, nc])
    cells.current.get(key(nr, nc))?.focus()
  }

  return (
    <div className="tk-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className={`tk-sym${shaking ? ' bad' : ''}`} dir="ltr" style={{ '--cols': cols, '--rows': rows, '--fill': paint(color) } as CSSProperties}>
        <div className="tk-sym-grid">
          {Array.from({ length: rows * cols }, (_, n) => {
            const r = Math.floor(n / cols)
            const c = n % cols
            if (c < half) return <div key={n} className={`tk-sym-cell given${givenSet.has(key(r, c)) ? ' on' : ''}`} aria-hidden="true" />
            const on = filled.has(key(r, c))
            return (
              <button key={n} type="button" className={`tk-sym-cell${on ? ' on' : ''}`} aria-pressed={on}
                aria-label={`${r + 1}, ${c + 1}`} tabIndex={focus[0] === r && focus[1] === c ? 0 : -1}
                ref={el => { if (el) cells.current.set(key(r, c), el); else cells.current.delete(key(r, c)) }}
                onFocus={() => setFocus([r, c])} onKeyDown={e => onKey(e, r, c)} onClick={() => toggle(r, c)} />
            )
          })}
        </div>
        <div className="tk-sym-mirror" aria-hidden="true" />
      </div>
      <div className="tk-actions">
        <button type="button" className="cta" onClick={check}>{phrases[T.check]}</button>
        <button type="button" className="pill" onClick={() => setFilled(new Set())}>{phrases[T.reset]}</button>
      </div>
    </div>
  )
}
