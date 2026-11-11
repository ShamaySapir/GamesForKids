import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { MathText } from '../../ui/pick/MathText'
import { DigitPad } from './games-column'
import { HintButton, PromptBlock, useHintOnAid, useShake } from './games-pad'
import { M, M4 } from './ids'
import type { Fraction, FractionPadQ } from './types'
import './math-g4.css'

// Per-question state; PlayScreen remounts this component for every question.

type Box = 'whole' | 'num' | 'den'
const MAX_DIGITS = 3

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** Same value as `want`? Cross-multiplied, so 2/4 = 1/2 and 1 1/4 = 5/4. */
export function sameFraction(got: Required<Fraction>, want: Fraction): boolean {
  const w = want.whole ?? 0
  return (got.whole * got.den + got.num) * want.den === (w * want.den + want.num) * got.den
}

/** Is `got` strictly between the two fractions (either order)? Cross-multiplied, so 3/8 sits between 1/4 and 1/2. */
export function strictlyBetween(got: Required<Fraction>, [x, y]: readonly [Fraction, Fraction]): boolean {
  const top = (f: Fraction) => (f.whole ?? 0) * f.den + f.num
  const g = got.whole * got.den + got.num
  const cmp = (f: Fraction) => g * f.den - top(f) * got.den // sign of got - f
  const a = cmp(x)
  const b = cmp(y)
  return (a > 0 && b < 0) || (a < 0 && b > 0)
}

/** A strip of `den` cells with `num` shaded, for the aid ("3/4"). */
function Strip({ text }: { text: string }) {
  const [n, d] = text.split('/').map(Number) as [number, number]
  return (
    <div className="g4-strip-row" dir="ltr">
      <span className="g4-strip-label digi"><MathText text={text} /></span>
      <div className="g4-strip" aria-hidden="true">
        {Array.from({ length: d }, (_, i) => <span key={i} className={i < n ? 'on' : ''} />)}
      </div>
    </div>
  )
}

export function FractionPadGame({ question, aid, onAttempt }: GameProps<FractionPadQ>) {
  const { mixed, simplest, answer, between } = question
  const [vals, setVals] = useState<Record<Box, string>>({ whole: '', num: '', den: '' })
  const [active, setActive] = useState<Box>(mixed ? 'whole' : 'num')
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, question.hint)

  const digit = useCallback((d: string) => {
    if (done.current) return
    setVals(v => (v[active].length < MAX_DIGITS ? { ...v, [active]: v[active] + d } : v))
  }, [active])
  const back = useCallback(() => {
    if (!done.current) setVals(v => ({ ...v, [active]: v[active].slice(0, -1) }))
  }, [active])
  const check = useCallback(() => {
    if (done.current || vals.num === '' || vals.den === '' || Number(vals.den) === 0) return
    const got = { whole: Number(vals.whole), num: Number(vals.num), den: Number(vals.den) }
    let ok = between ? strictlyBetween(got, between) : sameFraction(got, answer)
    if (ok && simplest) ok = gcd(got.num, got.den) === 1 && (!mixed || got.num < got.den)
    if (ok) { done.current = true; setLocked(true) } else shake()
    onAttempt(ok)
  }, [vals, answer, between, simplest, mixed, onAttempt, shake])

  const order: Box[] = mixed ? ['whole', 'num', 'den'] : ['num', 'den']
  const move = useCallback((to: Box) => { if (order.includes(to)) setActive(to) }, [mixed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) digit(e.key)
      else if (e.key === 'Backspace') back()
      else if (e.key === 'ArrowUp') { e.preventDefault(); move('num') }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move('den') }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (active !== 'whole') move(active === 'num' ? 'whole' : 'num') }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (active === 'whole') move('num') }
      else if (e.key === 'Enter') {
        const t = e.target
        if (t instanceof HTMLButtonElement && !t.dataset.box) return // any other button handles its own Enter
        e.preventDefault()
        check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, back, check, move, active])

  const box = (b: Box, label: string) => (
    <button type="button" data-box={b} className={`g4-box digi${active === b && !locked ? ' cur' : ''}${locked ? ' ok' : ''}`}
      aria-label={`${label}: ${vals[b] || '?'}`} disabled={locked} onFocus={() => setActive(b)} onClick={() => setActive(b)}>
      {vals[b]}
    </button>
  )

  return (
    <div className="pk-stage g4-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <PromptBlock prompt={question.prompt} />
      {aid && question.aidStrips && (
        <div className="g4-strips">{question.aidStrips.map(s => <Strip key={s} text={s} />)}</div>
      )}
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g4-frac${shaking ? ' bad' : ''}`} dir="ltr" role="group">
        {mixed && <div className="g4-whole">{box('whole', phrases[M4.whole] ?? '')}</div>}
        <div className="g4-stack">
          {box('num', phrases[M4.numerator] ?? '')}
          <span className="g4-bar" aria-hidden="true" />
          {box('den', phrases[M4.denominator] ?? '')}
        </div>
      </div>
      <DigitPad onDigit={digit} onBack={back} onGo={check} disabled={locked} />
      <button type="button" className="cta" disabled={locked} onClick={check}>{phrases[M.check]}</button>
    </div>
  )
}
