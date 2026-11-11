import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as RKeyboardEvent, MouseEvent as RMouseEvent } from 'react'
import { phrases } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { HintButton, useHintOnAid, useShake } from './games-pad'
import type { TapArtQ } from './types'
import './math-g6.css'

// Per-question state; PlayScreen remounts this component for every question.

export function TapArtGame({ question, aid, onAttempt }: GameProps<TapArtQ>) {
  const { art, answer } = question
  const [wrong, setWrong] = useState<ReadonlySet<string>>(new Set())
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  const box = useRef<HTMLDivElement>(null)
  useHintOnAid(aid, question.hint)

  // The art owns its drawing; make each [data-part] a button after every render.
  useEffect(() => {
    // Art is drawn aria-hidden; here its parts are the buttons, so the drawing must be reachable by screen readers.
    box.current?.querySelectorAll('svg[aria-hidden]').forEach(svg => svg.removeAttribute('aria-hidden'))
    box.current?.querySelectorAll<Element>('[data-part]').forEach(el => {
      const part = el.getAttribute('data-part') ?? ''
      const off = locked || wrong.has(part)
      el.classList.add('g6a-part')
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', off ? '-1' : '0')
      el.setAttribute('aria-label', phrases[`math.circle.${part}`] ?? part)
      el.setAttribute('aria-disabled', String(off))
      el.classList.toggle('g6a-wrong', wrong.has(part))
      el.classList.toggle('g6a-ok', locked && part === answer)
    })
  })

  const tap = (part: string) => {
    if (done.current || wrong.has(part)) return
    const ok = part === answer
    if (ok) { done.current = true; setLocked(true) } else { setWrong(s => new Set([...s, part])); shake() }
    onAttempt(ok)
  }
  const partOf = (t: EventTarget) => (t instanceof Element ? t.closest('[data-part]')?.getAttribute('data-part') ?? null : null)
  const onClick = (e: RMouseEvent) => { const p = partOf(e.target); if (p) tap(p) }
  const onKey = (e: RKeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const p = partOf(e.target)
    if (p) { e.preventDefault(); tap(p) }
  }

  return (
    <div className="pk-stage g6-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <HintButton aid={aid} hint={question.hint} />
      <div ref={box} className={`g6a-art${shaking ? ' bad' : ''}`} dir="ltr" onClick={onClick} onKeyDown={onKey}>
        <ArtView art={art} size={260} />
      </div>
    </div>
  )
}
