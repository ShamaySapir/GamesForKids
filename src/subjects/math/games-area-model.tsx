import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { DigitPad } from './games-column'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M, M4 } from './ids'
import { fmt } from './numbers'
import type { AreaModelQ } from './types'
import './math-g4.css'

// Per-question state; PlayScreen remounts this component for every question.

const MAX_DIGITS = 8

/** 34 → [30, 4]; 203 → [200, 3]; 6 → [6]. Largest place first, zeros left out. */
export function placeParts(n: number): number[] {
  const s = String(n)
  return [...s].flatMap((d, i) => (d === '0' ? [] : [Number(d) * 10 ** (s.length - 1 - i)]))
}

export function AreaModelGame({ question, aid, onAttempt }: GameProps<AreaModelQ>) {
  const { a, b, answer } = question
  const cols = placeParts(a)
  const rows = placeParts(b)
  const totalIdx = cols.length * rows.length // slots: the cells row by row, then the total
  const [vals, setVals] = useState<string[]>(() => Array(totalIdx + 1).fill(''))
  const [bad, setBad] = useState<ReadonlySet<number>>(new Set())
  const [active, setActive] = useState(0)
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  const slots = useRef<(HTMLButtonElement | null)[]>([])
  useHintOnAid(aid, question.hint)

  const full = vals.every(v => v !== '')

  const go = useCallback((i: number) => {
    setActive(i)
    slots.current[i]?.focus()
  }, [])
  const digit = useCallback((d: string) => {
    if (done.current) return
    setVals(v => v.map((x, i) => (i !== active ? x : bad.has(i) ? d : x.length < MAX_DIGITS ? x + d : x)))
    setBad(s => (s.has(active) ? new Set([...s].filter(i => i !== active)) : s))
  }, [active, bad])
  const back = useCallback(() => {
    if (!done.current) setVals(v => v.map((x, i) => (i === active ? x.slice(0, -1) : x)))
  }, [active])
  const check = useCallback(() => {
    if (done.current || !full) return
    const want = (i: number) => (i === totalIdx ? answer : cols[i % cols.length]! * rows[Math.floor(i / cols.length)]!)
    const wrong = vals.flatMap((v, i) => (Number(v) === want(i) ? [] : [i]))
    const ok = wrong.length === 0
    if (ok) { done.current = true; setLocked(true) } else { setBad(new Set(wrong)); shake() }
    onAttempt(ok)
  }, [full, vals, totalIdx, answer, cols, rows, onAttempt, shake])
  // Enter and the pad's ✓ move to the next box; on the last box they check.
  const next = useCallback(() => {
    if (active < totalIdx) go(active + 1)
    else check()
  }, [active, totalIdx, go, check])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) digit(e.key)
      else if (e.key === 'Backspace') back()
      else if (e.key === 'Enter') {
        const t = e.target
        if (t instanceof HTMLButtonElement && !t.dataset.slot) return // any other button handles its own Enter
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, back, next])

  const slot = (i: number, label: string) => (
    <button type="button" data-slot="1" ref={el => { slots.current[i] = el }}
      className={`g4-slot digi${i === active && !locked ? ' cur' : ''}${bad.has(i) ? ' bad' : ''}${locked ? ' ok' : ''}`}
      aria-label={`${label}: ${vals[i] || '?'}`} disabled={locked}
      onFocus={() => setActive(i)} onClick={() => setActive(i)}>
      {vals[i] ? fmt(Number(vals[i])) : ''}
    </button>
  )

  return (
    <div className="pk-stage g4-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g4-area digi${shaking ? ' bad' : ''}`} dir="ltr" role="group" aria-label={`${a} × ${b}`}
        style={{ gridTemplateColumns: `auto ${cols.map(c => `minmax(var(--g4-min), ${c}fr)`).join(' ')}` }}>
        <span />
        {cols.map((c, ci) => <span key={ci} className="g4-part">{fmt(c)}</span>)}
        {rows.map((r, ri) => (
          <div key={ri} className="g4-row">
            <span className="g4-part">{fmt(r)}</span>
            {cols.map((c, ci) => (
              <div key={ci} className="g4-cellwrap">
                {slot(ri * cols.length + ci, `${fmt(c)} × ${fmt(r)}`)}
                {aid && !locked && <small className="g4-small">{fmt(c)} × {fmt(r)}</small>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="g4-total digi" dir="ltr">
        <span className="g4-totlabel">{phrases[M4.total]}</span>
        {slot(totalIdx, phrases[M4.total] ?? '')}
      </div>
      <DigitPad onDigit={digit} onBack={back} onGo={next} disabled={locked} />
      <button type="button" className="cta" disabled={locked || !full} onClick={check}>{phrases[M.check]}</button>
    </div>
  )
}
