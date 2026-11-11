import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { DigitPad, fromButton } from './games-column'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import { M5 } from './ids'
import type { FactorTreeQ } from './types'
import './math-g5.css'

// Per-question state; PlayScreen remounts this component for every question.
// Any split is accepted; the leaves are what is checked, so a different tree for the same number is fine.

const MAX_DIGITS = 3

interface Tree { v: number; kids?: readonly [Tree, Tree] }

const smallestFactor = (n: number) => {
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return f
  return n
}
export const isPrime = (n: number) => n > 1 && smallestFactor(n) === n

/** The leftmost leaf that is still composite, or null when every leaf is prime. */
function activeLeaf(t: Tree): Tree | null {
  if (t.kids) return activeLeaf(t.kids[0]) ?? activeLeaf(t.kids[1])
  return isPrime(t.v) ? null : t
}
const splitLeaf = (t: Tree, leaf: Tree, f: number): Tree =>
  t === leaf ? { v: t.v, kids: [{ v: f }, { v: t.v / f }] }
    : t.kids ? { v: t.v, kids: [splitLeaf(t.kids[0], leaf, f), splitLeaf(t.kids[1], leaf, f)] } : t
const leaves = (t: Tree): number[] => (t.kids ? [...leaves(t.kids[0]), ...leaves(t.kids[1])] : [t.v])

function Node({ t, active, shaking }: { t: Tree; active: Tree | null; shaking: boolean }) {
  const isLeaf = !t.kids
  const prime = isLeaf && isPrime(t.v)
  const cur = t === active
  return (
    <div className="ft-node">
      <span className={`ft-circle digi${prime ? ' prime' : ''}${cur ? ' cur' : ''}${cur && shaking ? ' bad' : ''}`}
        aria-label={prime ? `${t.v} ${phrases[M5.prime] ?? ''}` : String(t.v)}>{t.v}</span>
      {t.kids && (
        <div className="ft-kids">
          {t.kids.map((k, i) => <div key={i} className="ft-kid"><Node t={k} active={active} shaking={shaking} /></div>)}
        </div>
      )}
    </div>
  )
}

export function FactorTreeGame({ question, aid, onAttempt }: GameProps<FactorTreeQ>) {
  const [tree, setTree] = useState<Tree>({ v: question.n })
  const [value, setValue] = useState('')
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  useHintOnAid(aid, question.hint)

  const active = activeLeaf(tree)

  const digit = useCallback((d: string) => {
    if (!done.current) setValue(v => (v.length < MAX_DIGITS ? v + d : v))
  }, [])
  const back = useCallback(() => { if (!done.current) setValue(v => v.slice(0, -1)) }, [])
  const submit = useCallback(() => {
    if (done.current || value === '') return
    const leaf = activeLeaf(tree)
    if (!leaf) return
    const f = Number(value)
    if (f <= 1 || f >= leaf.v || leaf.v % f !== 0) {
      shake()
      setValue('')
      onAttempt(false)
      return
    }
    const next = splitLeaf(tree, leaf, f)
    setTree(next)
    setValue('')
    if (!activeLeaf(next)) {
      done.current = true
      setLocked(true)
      onAttempt(true)
    }
  }, [value, tree, shake, onAttempt])

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

  const found = leaves(tree)
  const anyPrime = found.some(isPrime)
  const product = [...found].sort((x, y) => x - y).join(' × ')

  return (
    <div className="pk-stage ft-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div className={`ft-tree${locked ? ' ok' : ''}`} dir="ltr" role="group" aria-label={String(question.n)}>
        <Node t={tree} active={active} shaking={shaking} />
      </div>
      {anyPrime && <p className="ft-legend"><span className="ft-circle prime mini" aria-hidden="true" /> {phrases[M5.prime]}</p>}
      <p className="ft-eq digi" dir="ltr" role="status">{locked ? `${question.n} = ${product}` : ''}</p>
      {!locked && (
        <>
          <div className={`ft-input digi${shaking ? ' bad' : ''}`} dir="ltr" aria-live="polite">
            {active && <span className="ft-of">{active.v} = </span>}
            {value || <span className="ft-caret" aria-hidden="true">?</span>}
            {active && <span className="ft-of"> × ?</span>}
          </div>
          {aid && active && <p className="ft-tip digi" dir="ltr">{active.v} ÷ {smallestFactor(active.v)}</p>}
        </>
      )}
      <DigitPad onDigit={digit} onBack={back} onGo={submit} disabled={locked} />
    </div>
  )
}
