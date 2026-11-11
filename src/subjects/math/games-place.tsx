import { Fragment, useRef, useState, type KeyboardEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M, M3, M5 } from './ids'
import type { PlaceValueQ } from './types'
import './math-g2.css'
import './math-g3-art.css'
import './math-g5.css'

// Per-question state; PlayScreen remounts this component for every question.
// The running value is never written as digits: the child has to read the pieces (counts show only with the aid).

const MAX_PER_COLUMN = 9

type Kind = 'thousand' | 'hundred' | 'ten' | 'one' | 'tenth' | 'hundredth' | 'thousandth'
const LABELS: Record<Kind, string> = {
  thousand: M3.thousands, hundred: M.hundreds, ten: M.tens, one: M.ones,
  tenth: M5.tenths, hundredth: M5.hundredths, thousandth: M5.thousandths,
}
/** Worth in thousandths, so decimal sums are exact integers. */
const WORTH: Record<Kind, number> = { thousand: 1e6, hundred: 1e5, ten: 1e4, one: 1e3, tenth: 100, hundredth: 10, thousandth: 1 }
const DECIMAL_KINDS: Kind[] = ['tenth', 'hundredth', 'thousandth']
const SHOWN: Record<Kind, string> = {
  thousand: '1000', hundred: '100', ten: '10', one: '1', tenth: '0.1', hundredth: '0.01', thousandth: '0.001',
}
const KINDS: Record<PlaceValueQ['columns'], Kind[]> = {
  2: ['ten', 'one'],
  3: ['hundred', 'ten', 'one'],
  4: ['thousand', 'hundred', 'ten', 'one'],
}

function Piece({ kind }: { kind: Kind }) {
  if (kind === 'tenth' || kind === 'hundredth' || kind === 'thousandth') {
    return <span className={`pv-piece pv-dec pv-dec-${kind}`} aria-hidden="true" />
  }
  if (kind === 'thousand') {
    // A cube: front face plus top and side, so it reads as "a big block" next to the flat hundred.
    return (
      <svg className="pv-piece pv-thousand" viewBox="0 0 44 44" aria-hidden="true">
        <polygon points="1,11 11,1 43,1 33,11" className="pv-fill pv-k-top" />
        <polygon points="33,11 43,1 43,33 33,43" className="pv-fill pv-k-side" />
        <rect x="1" y="11" width="32" height="32" rx="1" className="pv-fill pv-k" />
      </svg>
    )
  }
  if (kind === 'hundred') {
    return (
      <svg className="pv-piece pv-hundred" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" rx="3" className="pv-fill pv-h" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} className="pv-grid">
            <line x1={4 * (i + 1)} y1="1" x2={4 * (i + 1)} y2="39" />
            <line x1="1" y1={4 * (i + 1)} x2="39" y2={4 * (i + 1)} />
          </g>
        ))}
      </svg>
    )
  }
  if (kind === 'ten') {
    return (
      <svg className="pv-piece pv-ten" viewBox="0 0 10 40" aria-hidden="true">
        <rect x="1" y="1" width="8" height="38" rx="2" className="pv-fill pv-t" />
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1="1" y1={4 * (i + 1)} x2="9" y2={4 * (i + 1)} className="pv-grid" />)}
      </svg>
    )
  }
  return (
    <svg className="pv-piece pv-one" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" rx="2" className="pv-fill pv-o" />
    </svg>
  )
}

export function PlaceValueGame({ question, aid, onAttempt }: GameProps<PlaceValueQ>) {
  const { decimals } = question
  const kinds = [...KINDS[question.columns], ...DECIMAL_KINDS.slice(0, decimals ?? 0)]
  const whole = kinds.length - (decimals ?? 0)
  const [counts, setCounts] = useState<number[]>(() => kinds.map(() => 0))
  const [done, setDone] = useState(false)
  const [shaking, shake] = useShake()
  const finished = useRef(false)
  useHintOnAid(aid, question.hint)

  const change = (i: number, delta: number) => {
    if (finished.current) return
    setCounts(c => c.map((n, j) => (j === i ? Math.min(MAX_PER_COLUMN, Math.max(0, n + delta)) : n)))
  }
  const onKey = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); change(i, 1) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); change(i, -1) }
  }
  const empty = counts.every(n => n === 0)
  const check = () => {
    if (finished.current || empty) return
    const value = counts.reduce((s, n, i) => s + n * WORTH[kinds[i]!], 0)
    if (value === Math.round(question.answer * 1000)) {
      finished.current = true
      setDone(true)
      onAttempt(true)
    } else {
      shake()
      onAttempt(false)
    }
  }

  return (
    <div className="pk-stage pv-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="pv-show digi" dir="ltr">{question.show}</div>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`pv-house pv-house-${question.columns}${decimals ? ' pv-dec-house' : ''}${shaking ? ' bad' : ''}${done ? ' ok' : ''}`} dir="ltr">
        <div className="pv-roof" aria-hidden="true" />
        <div className="pv-cols" style={decimals ? { gridTemplateColumns: `repeat(${whole}, minmax(0, 1fr)) 14px repeat(${decimals}, minmax(0, 1fr))` } : undefined}>
          {kinds.map((kind, i) => (
            <Fragment key={kind}>
            {i === whole && <div className="pv-point digi" aria-hidden="true">.</div>}
            <div className="pv-col" role="group" aria-label={phrases[LABELS[kind]]} tabIndex={0} onKeyDown={onKey(i)}>
              <div className="pv-label">{phrases[LABELS[kind]]}</div>
              <div className={`pv-pieces pv-pieces-${kind}`} aria-hidden="true">
                {Array.from({ length: counts[i]! }, (_, k) => <Piece key={k} kind={kind} />)}
              </div>
              <div className="pv-count digi" dir="ltr" aria-hidden={!aid}>{aid ? (decimals ? <>{counts[i]}<br />×{SHOWN[kind]}</> : question.columns === 4 ? `${counts[i]} × ${SHOWN[kind]}` : counts[i]) : ''}</div>
              <div className="pv-btns">
                <button type="button" className="pv-btn" aria-label={`− ${phrases[LABELS[kind]]}`} tabIndex={-1}
                  disabled={done || counts[i] === 0} onClick={() => change(i, -1)}>−</button>
                <button type="button" className="pv-btn" aria-label={`+ ${phrases[LABELS[kind]]}`} tabIndex={-1}
                  disabled={done || counts[i] === MAX_PER_COLUMN} onClick={() => change(i, 1)}>+</button>
              </div>
            </div>
            </Fragment>
          ))}
        </div>
      </div>
      <div className="pv-actions">
        <button type="button" className="cta" disabled={done || empty} onClick={check}>{phrases[M.check]}</button>
        <button type="button" className="pill" disabled={done || empty} onClick={() => setCounts(kinds.map(() => 0))}>{phrases[M.reset]}</button>
      </div>
    </div>
  )
}
