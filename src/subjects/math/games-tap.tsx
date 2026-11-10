import { useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import type { FirstStepQ } from './types'
import './math-g3.css'

// Per-question state; PlayScreen remounts this component for every question.

const isOp = (t: string) => /^[+\-−×÷:*/]$/.test(t)

/** Index of the bracket that closes (or opens) the group at `i`, scanning in `dir`. */
function matching(tokens: readonly string[], i: number, dir: 1 | -1) {
  const open = dir === 1 ? '(' : ')'
  let depth = 0
  for (let j = i; j >= 0 && j < tokens.length; j += dir) {
    if (tokens[j] === open) depth++
    else if (tokens[j] === (dir === 1 ? ')' : '(') && --depth === 0) return j
  }
  return i
}

/** The two operands of the operator at `i`: a number, or a whole bracketed group next to it. */
function operands(tokens: readonly string[], i: number): ReadonlySet<number> {
  const out = new Set<number>()
  const left = tokens[i - 1] === ')' ? matching(tokens, i - 1, -1) : i - 1
  const right = tokens[i + 1] === '(' ? matching(tokens, i + 1, 1) : i + 1
  for (let j = left; j <= i - 1; j++) out.add(j)
  for (let j = i + 1; j <= right; j++) out.add(j)
  return out
}

export function FirstStepGame({ question, aid, onAttempt }: GameProps<FirstStepQ>) {
  const { tokens, answer } = question
  const [lit, setLit] = useState<number | null>(null)
  const [tried, setTried] = useState<ReadonlySet<number>>(new Set())
  const [solved, setSolved] = useState(false)
  const [shaking, shake] = useShake()
  useHintOnAid(aid, question.hint)

  const near = lit === null ? new Set<number>() : operands(tokens, lit)
  const pick = (i: number) => {
    if (solved || tried.has(i)) return
    setLit(null)
    if (i === answer) { setSolved(true); onAttempt(true) } else { setTried(new Set(tried).add(i)); shake(); onAttempt(false) }
  }

  return (
    <div className="pk-stage g3-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`g3-expr digi${shaking ? ' shake' : ''}`} dir="ltr" role="group">
        {tokens.map((t, i) => {
          const paren = t === '(' || t === ')'
          const cls = `g3-tok${paren ? ' paren' : ''}${paren && aid ? ' aid' : ''}${near.has(i) ? ' near' : ''}`
          if (!isOp(t)) return <span key={i} className={cls}>{t}</span>
          return (
            <button key={i} type="button" className={`${cls} op${tried.has(i) ? ' bad' : ''}${solved && i === answer ? ' ok' : ''}${lit === i ? ' lit' : ''}`}
              disabled={solved || tried.has(i)} aria-label={t}
              onClick={() => pick(i)} onPointerEnter={() => setLit(i)} onPointerLeave={() => setLit(null)}
              onFocus={() => setLit(i)} onBlur={() => setLit(null)}>
              {t}
            </button>
          )
        })}
      </div>
    </div>
  )
}
