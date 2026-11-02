import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import type { MemoryQ } from './types'
import '../../ui/pick/pick.css'
import './thinking.css'

const FLIP_BACK_MS = 900

type Face = MemoryQ['cards'][number]['face']
const faceKey = (f: Face) => (typeof f === 'string' ? f : JSON.stringify([f.name, f.props ?? null]))
const faceName = (f: Face) => (typeof f === 'string' ? f : f.name)
const columns = (n: number) => (n <= 6 ? 3 : n === 10 ? 5 : 4)

// A wrong pair is how memory works, not a miss: onAttempt only fires once, when every pair is found.
export function MemoryGame({ question, aid, onAttempt }: GameProps<MemoryQ>) {
  const { cards } = question
  const [open, setOpen] = useState<readonly number[]>([])
  const [matched, setMatched] = useState<ReadonlySet<number>>(new Set())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hinted = useRef(false)
  const reported = useRef(false)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const flip = (i: number) => {
    if (open.length >= 2 || open.includes(i) || matched.has(i)) return
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return
    const [a, b] = next as [number, number]
    if (faceKey(cards[a]!.face) === faceKey(cards[b]!.face)) {
      sfx.tick()
      const all = new Set(matched).add(a).add(b)
      setMatched(all)
      setOpen([])
      if (all.size === cards.length && !reported.current) {
        reported.current = true
        onAttempt(true)
      }
    } else {
      timer.current = setTimeout(() => setOpen([]), FLIP_BACK_MS)
    }
  }

  return (
    <div className="tk-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="tk-mem-board" style={{ '--cols': columns(cards.length) } as CSSProperties}>
        {cards.map((c, i) => {
          const up = open.includes(i) || matched.has(i)
          const cls = matched.has(i) ? ' found' : up ? ' up' : ''
          return (
            <button key={c.id} type="button" className={`tk-mem-card${cls}`} aria-pressed={up}
              aria-label={up ? faceName(c.face) : '?'} onClick={() => flip(i)}>
              <span className="tk-mem-face" aria-hidden="true">
                {!up ? '?' : typeof c.face === 'string' ? <span className="tk-mem-emoji">{c.face}</span> : <ArtView art={c.face} size={80} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
