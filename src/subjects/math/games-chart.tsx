import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import type { ChartQ } from './types'
import './math-g2.css'

// Per-question state; PlayScreen remounts this component for every question.

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'] as const

export function HundredChartGame({ question, aid, onAttempt }: GameProps<ChartQ>) {
  const { start, blanks } = question
  const maxDigits = String(start + 99).length
  const [filled, setFilled] = useState<ReadonlySet<number>>(new Set())
  const [selected, setSelected] = useState<number | null>(blanks[0] ?? null)
  const [typed, setTyped] = useState('')
  const [shaking, shake] = useShake()
  const reported = useRef(false)
  useHintOnAid(aid, question.hint)

  const select = (v: number) => {
    setSelected(v)
    setTyped('')
  }
  const digit = useCallback((d: string) => setTyped(t => (t.length < maxDigits ? t + d : t)), [maxDigits])
  const back = useCallback(() => setTyped(t => t.slice(0, -1)), [])
  const submit = useCallback(() => {
    if (selected === null || typed === '' || reported.current) return
    if (Number(typed) === selected) {
      const next = new Set(filled).add(selected)
      setFilled(next)
      setTyped('')
      const rest = blanks.filter(b => !next.has(b))
      setSelected(rest.find(b => b > selected) ?? rest[0] ?? null)
      if (rest.length === 0) {
        reported.current = true
        onAttempt(true)
      }
    } else {
      shake()
      setTyped('')
      onAttempt(false)
    }
  }, [selected, typed, filled, blanks, onAttempt, shake])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) digit(e.key)
      else if (e.key === 'Backspace') back()
      // A focused pad key turns Enter into its own click; a focused blank would only re-select itself, so Enter submits instead.
      else if (e.key === 'Enter' && !(e.target instanceof Element && e.target.closest('.hc-pad'))) {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, back, submit])

  const finished = filled.size === blanks.length
  const press = (k: (typeof KEYS)[number]) => (k === '⌫' ? back() : k === '✓' ? submit() : digit(k))

  return (
    <div className="pk-stage hc-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className="hc-chart digi" dir="ltr">
        {Array.from({ length: 100 }, (_, i) => {
          const v = start + i
          if (!blanks.includes(v)) return <div key={v} className="hc-cell">{v}</div>
          if (filled.has(v)) return <div key={v} className="hc-cell hc-ok">{v}</div>
          const sel = v === selected
          return (
            <button key={v} type="button" className={`hc-cell hc-blank${sel ? ' sel' : ''}${sel && shaking ? ' bad' : ''}`}
              aria-label="?" onClick={() => select(v)} onFocus={() => { if (!sel) select(v) }}>
              {sel && typed !== '' ? typed : '?'}
            </button>
          )
        })}
      </div>
      {!finished && (
        <div className="hc-pad" dir="ltr">
          {KEYS.map(k => (
            <button key={k} type="button" className={`pd-key${k === '✓' ? ' go' : ''}`} aria-label={k} disabled={selected === null}
              onClick={() => press(k)}>{k}</button>
          ))}
        </div>
      )}
    </div>
  )
}
