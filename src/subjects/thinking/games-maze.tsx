import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import type { MazeQ } from './types'
import '../../ui/pick/pick.css'
import './thinking.css'

const SWIPE_PX = 24
const DIRS = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
} as const satisfies Record<string, readonly [number, number]>
type Dir = keyof typeof DIRS

const find = (rows: readonly string[], ch: string): readonly [number, number] => {
  for (let r = 0; r < rows.length; r++) {
    const c = rows[r]!.indexOf(ch)
    if (c >= 0) return [r, c]
  }
  return [0, 0]
}

// Walls block silently: bumping into one is not a mistake. The grid is a map, so it stays left-to-right.
export function MazeGame({ question, aid, onAttempt }: GameProps<MazeQ>) {
  const { rows, hero, goal } = question.maze
  const cols = rows[0]?.length ?? 0
  const [pos, setPos] = useState<readonly [number, number]>(() => find(rows, 'S'))
  const [walked, setWalked] = useState<ReadonlySet<string>>(() => new Set([find(rows, 'S').join(',')]))
  const goalAt = find(rows, 'G')
  const done = useRef(false)
  const hinted = useRef(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const moveTo = (r: number, c: number) => {
    if (done.current) return
    if (r < 0 || c < 0 || r >= rows.length || c >= cols || rows[r]![c] === '#') return
    sfx.tick()
    setPos([r, c])
    setWalked(prev => new Set(prev).add(`${r},${c}`))
    if (r === goalAt[0] && c === goalAt[1]) {
      done.current = true
      onAttempt(true)
    }
  }
  const step = (d: Dir) => moveTo(pos[0] + DIRS[d][0], pos[1] + DIRS[d][1])
  const onKey = (e: KeyboardEvent) => {
    if (!(e.key in DIRS)) return
    e.preventDefault()
    step(e.key as Dir)
  }
  const down = (e: PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; swiped.current = false }
  const up = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return
    swiped.current = true
    step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'))
  }
  const tapCell = (r: number, c: number) => {
    if (swiped.current) { swiped.current = false; return }
    if (Math.abs(r - pos[0]) + Math.abs(c - pos[1]) === 1) moveTo(r, c)
  }

  const arrow = (d: Dir, glyph: string) => (
    <button type="button" className={`tk-maze-arrow ${d}`} aria-label={glyph} onClick={() => step(d)}>{glyph}</button>
  )

  return (
    <div className="tk-stage">
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="tk-maze" dir="ltr" tabIndex={0} role="group" aria-label={phrases[question.instruction]}
        style={{ '--cols': cols, '--rows': rows.length } as CSSProperties}
        onKeyDown={onKey} onPointerDown={down} onPointerUp={up}>
        {rows.flatMap((row, r) => Array.from(row, (ch, c) => {
          const here = pos[0] === r && pos[1] === c
          const cls = ch === '#' ? 'wall' : walked.has(`${r},${c}`) ? 'path walked' : 'path'
          return (
            <div key={`${r},${c}`} className={`tk-maze-cell ${cls}`} onClick={() => tapCell(r, c)} data-cell={`${r},${c}`}>
              {here ? <span className="tk-maze-hero">{hero}</span> : ch === 'G' ? <span className="tk-maze-goal">{goal}</span> : null}
            </div>
          )
        }))}
      </div>
      <div className="tk-maze-pad" dir="ltr">
        {arrow('ArrowUp', '↑')}
        {arrow('ArrowLeft', '←')}
        {arrow('ArrowDown', '↓')}
        {arrow('ArrowRight', '→')}
      </div>
    </div>
  )
}
