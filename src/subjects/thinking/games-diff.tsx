import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { ArtView } from '../../ui/pick/art'
import { T } from './ids'
import type { DiffQ } from './types'
import '../../ui/pick/pick.css'
import './thinking.css'

const NEAR = 12 // percent of the picture
const MISSES_PER_MISS = 3 // gentle: only every third wrong tap in a row counts

type Item = DiffQ['left'][number]

export function DifferencesGame({ question, aid, onAttempt }: GameProps<DiffQ>) {
  const { left, right, answer } = question
  const [found, setFound] = useState<ReadonlySet<number>>(new Set())
  const [notHere, setNotHere] = useState(false)
  const misses = useRef(0)
  const done = useRef(false)
  const hinted = useRef(false)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current) }, [])
  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const changed = new Set(answer)
  const hit = (i: number) => {
    misses.current = 0
    setNotHere(false)
    if (found.has(i)) return
    sfx.tick()
    const all = new Set(found).add(i)
    setFound(all)
    if (all.size >= changed.size && !done.current) {
      done.current = true
      void say(T.foundAll)
      onAttempt(true)
    }
  }
  const miss = () => {
    setNotHere(true)
    void say(T.notHere)
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => setNotHere(false), 1600)
    misses.current += 1
    if (misses.current >= MISSES_PER_MISS) {
      misses.current = 0
      onAttempt(false)
    }
  }
  // Keyboard choice: pick an item position directly (decoys included).
  const choose = (i: number) => {
    if (done.current) return
    if (changed.has(i)) hit(i)
    else miss()
  }
  const tap = (e: MouseEvent<HTMLDivElement>) => {
    if (done.current) return
    const box = e.currentTarget.getBoundingClientRect()
    if (!box.width || !box.height) return
    const x = ((e.clientX - box.left) / box.width) * 100
    const y = ((e.clientY - box.top) / box.height) * 100
    let best = -1
    let bestD = Infinity
    left.forEach((it, i) => {
      if (!changed.has(i)) return
      const d = Math.hypot(it.x - x, it.y - y)
      if (d < bestD) { bestD = d; best = i }
    })
    if (best >= 0 && bestD <= NEAR) hit(best)
    else miss()
  }

  const place = (it: Item): CSSProperties => ({ left: `${it.x}%`, top: `${it.y}%` })
  const complete = found.size >= changed.size && changed.size > 0

  return (
    <div className="tk-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="tk-diff-pair" dir="ltr">
        <div className="tk-diff-pic" aria-hidden="true">
          {left.map((it, i) => <span key={i} className="tk-diff-item" style={place(it)}><ArtView art={it.art} size={100} /></span>)}
        </div>
        <div className="tk-diff-pic right" onClick={tap} data-testid="diff-right">
          {right.map((it, i) => it && <span key={i} className="tk-diff-item" style={place(it)}><ArtView art={it.art} size={100} /></span>)}
          {left.map((it, i) => found.has(i) && <span key={`r${i}`} className="tk-diff-ring" style={place(it)} data-testid="diff-ring" />)}
          {left.map((it, i) => (
            <button key={i} type="button" className="tk-diff-spot" style={place(it)} aria-label={`${i + 1}`}
              onClick={e => { e.stopPropagation(); choose(i) }} />
          ))}
        </div>
      </div>
      <p className="fb" role="status" aria-live="polite">{complete ? phrases[T.foundAll] : notHere ? phrases[T.notHere] : ''}</p>
    </div>
  )
}
