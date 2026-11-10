import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { DigitPad, fromButton } from './games-column'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import type { MistakeQ, SequenceQ } from './types'
import './math-g3.css'

// Per-question state; PlayScreen remounts these components for every question.

const stepLabel = (step: number) => `${step < 0 ? '−' : '+'}${Math.abs(step)}`

/** One card in the row; the aid hangs a jump arc over the card's left edge, from the card before it. */
function Card({ index, aid, step, className = '', children }: {
  index: number
  aid: boolean
  step: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`g3-term ${className}`}>
      {aid && index > 0 && <span className="g3-jump digi" aria-hidden="true">{stepLabel(step)}</span>}
      {children}
    </div>
  )
}

export function SequenceFillGame({ question, aid, onAttempt }: GameProps<SequenceQ>) {
  const { terms, blanks, step, answer } = question
  const maxDigits = Math.max(...terms.map(t => String(t).length))
  const [values, setValues] = useState<Readonly<Record<number, string>>>({})
  const [right, setRight] = useState<ReadonlySet<number>>(new Set())
  const [wrong, setWrong] = useState<ReadonlySet<number>>(new Set())
  const [active, setActive] = useState<number | null>(blanks[0] ?? null)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, question.hint)

  const edit = useCallback((f: (v: string) => string) => {
    if (done.current || active === null || right.has(active)) return
    setValues(v => ({ ...v, [active]: f(v[active] ?? '') }))
    setWrong(w => { const n = new Set(w); n.delete(active); return n })
  }, [active, right])
  const digit = useCallback((d: string) => edit(v => (v.length < maxDigits ? v + d : v)), [edit, maxDigits])
  const back = useCallback(() => edit(v => v.slice(0, -1)), [edit])

  const submit = useCallback(() => {
    if (done.current) return
    const open = blanks.filter(i => !right.has(i))
    const empty = open.filter(i => !values[i])
    if (empty.length > 0) { // Move on to the next empty blank; Check comes once all are filled.
      setActive(empty.find(i => active === null || i > active) ?? empty[0]!)
      return
    }
    const miss = open.filter(i => Number(values[i]) !== answer[blanks.indexOf(i)])
    if (miss.length === 0) {
      done.current = true
      setRight(new Set(blanks))
      onAttempt(true)
      return
    }
    setRight(new Set([...right, ...open.filter(i => !miss.includes(i))]))
    setWrong(new Set(miss))
    setValues(v => Object.fromEntries(Object.entries(v).filter(([i]) => !miss.includes(Number(i)))))
    setActive(miss[0]!)
    shake()
    onAttempt(false)
  }, [blanks, right, values, answer, active, onAttempt, shake])

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

  const finished = right.size === blanks.length
  return (
    <div className="pk-stage g3-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g3-terms digi${aid ? ' aid' : ''}`} dir="ltr" style={{ '--n': terms.length } as CSSProperties}>
        {terms.map((t, i) => {
          if (!blanks.includes(i)) return <Card key={i} index={i} aid={aid} step={step} className="fixed">{t}</Card>
          if (right.has(i)) return <Card key={i} index={i} aid={aid} step={step} className="ok">{t}</Card>
          const sel = i === active
          return (
            <Card key={i} index={i} aid={aid} step={step}>
              <button type="button" className={`g3-blank${sel ? ' sel' : ''}${wrong.has(i) ? ' bad' : ''}${sel && shaking ? ' shake' : ''}`}
                onClick={() => setActive(i)} onFocus={() => setActive(i)}>
                {values[i] || '?'}
              </button>
            </Card>
          )
        })}
      </div>
      {!finished && <DigitPad onDigit={digit} onBack={back} onGo={submit} />}
    </div>
  )
}

export function SequenceMistakeGame({ question, aid, onAttempt }: GameProps<MistakeQ>) {
  const { terms, step, answer } = question
  const [tried, setTried] = useState<ReadonlySet<number>>(new Set())
  const [solved, setSolved] = useState(false)
  const [shaking, shake] = useShake()
  useHintOnAid(aid, question.hint)

  const pick = (i: number) => {
    if (solved || tried.has(i)) return
    if (i === answer) { setSolved(true); onAttempt(true) } else { setTried(new Set(tried).add(i)); shake(); onAttempt(false) }
  }

  return (
    <div className="pk-stage g3-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g3-terms digi${aid ? ' aid' : ''}${shaking ? ' shake' : ''}`} dir="ltr" style={{ '--n': terms.length } as CSSProperties}>
        {terms.map((t, i) => (
          <Card key={i} index={i} aid={aid} step={step}>
            <button type="button" className={`g3-pick${tried.has(i) ? ' bad' : ''}${solved && i === answer ? ' ok' : ''}`}
              disabled={solved || tried.has(i)} onClick={() => pick(i)}>
              {t}
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
