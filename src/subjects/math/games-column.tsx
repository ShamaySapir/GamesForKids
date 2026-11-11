import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { fmtDec } from './numbers'
import type { ColumnQ } from './types'
import './math-g3.css'
import './math-g5.css'
import './math-g4-art.css'

// Per-question state; PlayScreen remounts this component for every question.

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'] as const

/** The on-screen digit pad shared by the grade 3 games (same look as the number pad). */
export function DigitPad({ onDigit, onBack, onGo, disabled }: {
  onDigit: (d: string) => void
  onBack: () => void
  onGo: () => void
  disabled?: boolean
}) {
  return (
    <div className="g3-pad" dir="ltr">
      {KEYS.map(k => (
        <button key={k} type="button" className={`pd-key${k === '✓' ? ' go' : ''}`} aria-label={k} disabled={disabled}
          onClick={() => (k === '⌫' ? onBack() : k === '✓' ? onGo() : onDigit(k))}>{k}</button>
      ))}
    </div>
  )
}

/** True when a key event came from a button, which turns Enter into its own click (so the window handler must not submit too). */
export const fromButton = (e: KeyboardEvent) => e.target instanceof HTMLButtonElement

const digitAt = (n: number, k: number) => Math.floor(n / 10 ** k) % 10

/** Carries (or borrows) into each column, worked out from the exercise, and the digit sum of every column. */
function work({ a, b, op }: Pick<ColumnQ, 'a' | 'b' | 'op'>, n: number) {
  const carry: number[] = [0]
  const sums: string[] = []
  for (let k = 0; k < n; k++) {
    const x = digitAt(a, k)
    const y = digitAt(b, k)
    const c = carry[k]!
    if (op === '+') {
      const s = x + y + c
      carry.push(s >= 10 ? 1 : 0)
      sums.push(`${[x, y, ...(c ? [c] : [])].join(' + ')} = ${s}`)
    } else {
      const d = x - y - c
      carry.push(d < 0 ? 1 : 0)
      sums.push(d < 0 ? `${x - c + 10} − ${y} = ${d + 10}` : `${x - c} − ${y} = ${d}`)
    }
  }
  return { carry, sums }
}

/** Decimal places a number is written with (3.5 → 1). */
const ownPlaces = (x: number) => (fmtDec(x).split('.')[1] ?? '').length

export function ColumnGame({ question, aid, onAttempt }: GameProps<ColumnQ>) {
  const { op } = question
  const places = question.places ?? 0
  // Decimals are worked as whole numbers (3.5 and 2.25 → 350 and 225); only the point column is added to the drawing.
  const scale = 10 ** places
  const a = Math.round(question.a * scale)
  const b = Math.round(question.b * scale)
  const answer = Math.round(question.answer * scale)
  const aPlaces = ownPlaces(question.a)
  const bPlaces = ownPlaces(question.b)
  const n = Math.max(String(a).length, String(b).length, String(answer).length, places + 1)
  const { carry, sums } = work({ a, b, op }, n)
  // Digits in the order typed: the ones column first.
  const [typed, setTyped] = useState('')
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, question.hint)

  const digit = useCallback((d: string) => { if (!done.current) setTyped(t => (t.length < n ? t + d : t)) }, [n])
  const back = useCallback(() => { if (!done.current) setTyped(t => t.slice(0, -1)) }, [])
  const submit = useCallback(() => {
    if (done.current || typed === '') return
    const ok = Number([...typed].reverse().join('')) === answer
    if (ok) { done.current = true; setLocked(true) } else shake()
    onAttempt(ok)
  }, [typed, answer, onAttempt, shake])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) digit(e.key)
      else if (e.key === 'Backspace') back()
      else if (e.key === 'Enter' && !fromButton(e)) { e.preventDefault(); submit() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, back, submit])

  const cur = typed.length
  const cols = Array.from({ length: n }, (_, p) => n - 1 - p) // left to right; k counts from the ones column
  const hl = (k: number) => (aid && !locked && k === cur ? ' hl' : '')
  const showDigit = (x: number, k: number) => k < String(x).length || k <= places
  const faded = (k: number, own: number) => (k < places - own ? ' faded' : '')
  /** The fixed point sits between the ones column (k = places) and the tenths column. */
  const pt = (k: number, text = '') => (places > 0 && k === places ? <span key={`pt${k}`} className="g5-pt">{text}</span> : null)
  const cols1 = n + (places > 0 ? 1 : 0)
  const cell = n >= 6 || places > 0 ? `minmax(0, min(var(--g3-cell), calc((100vw - 150px) / ${cols1})))` : 'var(--g3-cell)'
  const template = `auto ${cols.flatMap(k => (places > 0 && k === places ? [cell, 'var(--g5-pt)'] : [cell])).join(' ')}`

  return (
    <div className="pk-stage g3-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g3-col digi${n >= 6 || places > 0 ? ' wide' : ''}${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`} dir="ltr" role="group" aria-label={`${fmtDec(question.a)} ${op} ${fmtDec(question.b)}`}
        style={{ gridTemplateColumns: template }}>
        <span />
        {cols.flatMap(k => [
          <span key={k} className={`g3-cell g3-carry${hl(k)}`}>
            {k > 0 && cur >= k && carry[k] ? <small>{op === '+' ? '1' : '−1'}</small> : null}
          </span>,
          pt(k),
        ])}
        <span />
        {cols.flatMap(k => [
          <span key={k} className={`g3-cell g3-num${hl(k)}${faded(k, aPlaces)}`}>{showDigit(a, k) ? digitAt(a, k) : ''}</span>,
          pt(k, '.'),
        ])}
        <span className="g3-op">{op === '+' ? '+' : '−'}</span>
        {cols.flatMap(k => [
          <span key={k} className={`g3-cell g3-num${hl(k)}${faded(k, bPlaces)}`}>{showDigit(b, k) ? digitAt(b, k) : ''}</span>,
          pt(k, '.'),
        ])}
        <span className="g3-rule" />
        <span />
        {cols.flatMap(k => [
          <span key={k} className={`g3-cell g3-res${k === cur && !locked ? ' cur' : ''}${hl(k)}`}>
            {k < cur ? typed[k] : ''}
          </span>,
          pt(k, '.'),
        ])}
      </div>
      <p className="g3-sum digi" dir="ltr" role="status">{aid && !locked && cur < n ? sums[cur] : ''}</p>
      <DigitPad onDigit={digit} onBack={back} onGo={submit} disabled={locked} />
    </div>
  )
}
