import { useCallback, useEffect, useRef, useState } from 'react'
import { phrases, say } from '../../core/audio/audio'
import type { GameProps, PhraseRef } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { MathText } from '../../ui/pick/MathText'
import { Objects } from '../../ui/pick/Objects'
import type { PickPrompt } from '../../ui/pick/types'
import type { PadQ } from './types'
import './math.css'
import './math-g5.css'

// Shared helpers (hint, shake, width) live here and are reused by games-line and games-build.

/** Speaks the hint once when the adaptive aid turns on. */
export function useHintOnAid(aid: boolean, hint: PhraseRef | undefined) {
  const hinted = useRef(false)
  useEffect(() => {
    if (aid && hint && !hinted.current) {
      hinted.current = true
      void say(hint)
    }
  }, [aid, hint])
}

export function HintButton({ aid, hint }: { aid: boolean; hint: PhraseRef | undefined }) {
  if (!aid || !hint) return null
  return <button type="button" className="pill pk-hint" aria-label="🔊" onClick={() => void say(hint)}>💡 🔊</button>
}

/** A short-lived flag for the shake animation after a miss. */
export function useShake(): [boolean, () => void] {
  const [on, setOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const trigger = useCallback(() => {
    setOn(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOn(false), 400)
  }, [])
  return [on, trigger]
}

/** Pixel width of an element, so SVG text stays readable at any screen size (no scaled viewBox). */
export function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { if (el.clientWidth > 0) setWidth(el.clientWidth) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function PromptBlock({ prompt }: { prompt: PickPrompt }) {
  const { picture, objects, expr, art } = prompt
  return (
    <div className="pk-prompt">
      {picture && <div className="pk-picture" aria-hidden="true">{picture}</div>}
      {art && <div className="pk-art-row">{art.map((a, i) => <ArtView key={i} art={a} size={prompt.artSize ?? 160} />)}</div>}
      {objects && <div className="pk-groups">{objects.map((g, i) => <Objects key={i} group={g} />)}</div>}
      {expr && <div className="pk-expr digi" dir="ltr"><MathText text={expr} /></div>}
    </div>
  )
}

/** Number line 0..max with the exercise's jumps drawn as arcs (aid for within-20). */
function AidLine({ max, from, jumps }: NonNullable<PadQ['aidLine']>) {
  const [ref, w] = useWidth(520)
  const PAD = 24
  const unit = (w - PAD * 2) / max
  const x = (v: number) => PAD + v * unit
  const Y = 96
  const labelEvery = unit >= 26 ? 1 : 5
  const stops = jumps.reduce<number[]>((acc, j) => [...acc, acc[acc.length - 1]! + j], [from])
  return (
    <div className="pd-aid" ref={ref}>
      <svg width={w} height={Y + 36} role="img" aria-label="0–20" style={{ direction: 'ltr' }}>
        <line x1={x(0)} y1={Y} x2={x(max)} y2={Y} stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />
        {Array.from({ length: max + 1 }, (_, v) => (
          <g key={v}>
            <line x1={x(v)} y1={Y - 6} x2={x(v)} y2={Y + 6} stroke="var(--ink)" strokeWidth={v % 5 === 0 ? 3 : 1.5} />
            {v % labelEvery === 0 && <text x={x(v)} y={Y + 28} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--mute)">{v}</text>}
          </g>
        ))}
        {stops.slice(1).map((to, i) => {
          const a = x(stops[i]!)
          const b = x(to)
          const h = Math.min(34, 12 + Math.abs(b - a) / 6)
          return (
            <g key={i} className="pd-jump">
              <path d={`M${a} ${Y - 8} Q${(a + b) / 2} ${Y - 8 - h * 2} ${b} ${Y - 8}`} fill="none" stroke="var(--abc)" strokeWidth={4} strokeLinecap="round" />
              <text x={(a + b) / 2} y={Y - 8 - h - 8} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--abc)">{jumps[i]! > 0 ? '+' : '−'}{Math.abs(jumps[i]!)}</text>
            </g>
          )
        })}
        <circle cx={x(from)} cy={Y} r={7} fill="var(--num)" />
      </svg>
    </div>
  )
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'] as const
const DECIMAL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '.', '✓'] as const
type PadKey = (typeof DECIMAL_KEYS)[number]

/** The pad's value as typed ("3.", ".5" and "3.50" are all fine) compared to the answer at 3 places. */
export const sameDecimal = (value: string, answer: number) =>
  value !== '' && value !== '.' && Math.round(Number(value) * 1000) === Math.round(answer * 1000)

export function NumberPadGame({ question, aid, onAttempt }: GameProps<PadQ>) {
  const [value, setValue] = useState('')
  const [locked, setLocked] = useState(false)
  const [shaking, shake] = useShake()
  const done = useRef(false)
  const { maxDigits, aidLine, aidArt, prompt, hint, answer, decimal } = question
  useHintOnAid(aid, hint)

  const digit = useCallback((d: string) => {
    if (done.current) return
    setValue(v => (v.replace('.', '').length < maxDigits ? v + d : v))
  }, [maxDigits])
  const point = useCallback(() => {
    if (done.current || !decimal) return
    setValue(v => (v.includes('.') ? v : (v === '' ? '0' : v) + '.'))
  }, [decimal])
  const back = useCallback(() => { if (!done.current) setValue(v => v.slice(0, -1)) }, [])
  const submit = useCallback(() => {
    if (done.current || value === '') return
    const ok = decimal ? sameDecimal(value, answer) : Number(value) === answer
    if (ok) { done.current = true; setLocked(true) } else { shake(); setValue('') }
    onAttempt(ok)
  }, [value, answer, decimal, onAttempt, shake])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) digit(e.key)
      else if (e.key === '.' || e.key === ',') point()
      else if (e.key === 'Backspace') back()
      // A focused button turns Enter into its own click; handling it here too would submit twice.
      else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digit, point, back, submit])

  const press = (k: PadKey) => (k === '⌫' ? back() : k === '✓' ? submit() : k === '.' ? point() : digit(k))

  return (
    <div className="pk-stage pd-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <PromptBlock prompt={prompt} />
      {aid && aidLine && <AidLine {...aidLine} />}
      {aid && aidArt && <div className="pk-art-row">{aidArt.map((a, i) => <ArtView key={i} art={a} size={prompt.artSize ?? 160} />)}</div>}
      <HintButton aid={aid} hint={hint} />
      <div className={`pd-answer digi${shaking ? ' bad' : ''}${locked ? ' ok' : ''}`} dir="ltr" role="status">
        {value || <span className="pd-caret" aria-hidden="true">?</span>}
      </div>
      <div className="pd-pad" dir="ltr">
        {(decimal ? DECIMAL_KEYS : KEYS).map(k => (
          <button key={k} type="button" className={`pd-key${k === '✓' ? ` go${decimal ? ' wide' : ''}` : ''}`} aria-label={k} disabled={locked}
            onClick={() => press(k)}>{k}</button>
        ))}
      </div>
    </div>
  )
}
