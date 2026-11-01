import { useEffect, useRef, useState } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { numberPhrase } from './numbers'
import type { PairsQ } from './types'
import '../../ui/pick/pick.css'
import './math-coins.css'

// Cards are identified by their index, so the two 5s of "10" stay separate cards.

export function PairsBoardGame({ question, aid, onAttempt }: GameProps<PairsQ>) {
  const { cards, total } = question
  const [selected, setSelected] = useState<number | null>(null)
  const [found, setFound] = useState<readonly (readonly [number, number])[]>([])
  const [shake, setShake] = useState<readonly number[]>([])
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hinted = useRef(false)
  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])
  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const locked = new Set(found.flat())
  const done = locked.size === cards.length

  const pick = (i: number) => {
    if (done || locked.has(i) || shake.length) return
    if (selected === null) {
      setSelected(i)
      void say(numberPhrase(cards[i] ?? 0))
      return
    }
    if (selected === i) { setSelected(null); return }
    const a = selected
    setSelected(null)
    if ((cards[a] ?? 0) + (cards[i] ?? 0) === total) {
      sfx.tick()
      const next = [...found, [a, i] as const]
      setFound(next)
      if (next.length * 2 === cards.length) onAttempt(true)
    } else {
      setShake([a, i])
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShake([]), 450)
      onAttempt(false)
    }
  }

  return (
    <div className="mc-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="pr-board">
        {cards.map((v, i) => {
          const cls = locked.has(i) ? ' found' : shake.includes(i) ? ' bad' : selected === i ? ' sel' : ''
          return (
            <button key={i} type="button" className={`opt pr-card digi${cls}`} dir="ltr" aria-label={`${v}`}
              aria-pressed={selected === i} disabled={locked.has(i)} onClick={() => pick(i)}>
              {v}
            </button>
          )
        })}
      </div>
      <ul className="pr-found" aria-live="polite">
        {found.map(([a, b]) => (
          <li key={`${a}-${b}`} className="pr-eq digi" dir="ltr">{cards[a]} + {cards[b]} = {total}</li>
        ))}
      </ul>
    </div>
  )
}
