import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { phrases, say, sfx } from '../../core/audio/audio'
import type { GameProps } from '../../core/engine/types'
import { BoardView } from './board'
import { C } from './ids'
import { ARROW, DIRS, expand, find, oneEditApart, run, type RunResult } from './program'
import type { Card, Dir, PaletteCard, Program, ProgramQ } from './types'
import '../../ui/pick/pick.css'
import './coding.css'

const STEP_MS = 400
const PAUSE_MS = 900
const BOARD_PX = 320
const KEY_DIR: Readonly<Record<string, Dir>> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
const NAME: Readonly<Record<Dir, string>> = { up: C.up, down: C.down, left: C.left, right: C.right }
const MIN_TIMES = 2
const MAX_TIMES = 5

type Phase = 'edit' | 'walk' | 'miss' | 'won'

const dirName = (d: Dir) => phrases[NAME[d]] ?? ARROW[d]
const nextDir = (d: Dir): Dir => DIRS[(DIRS.indexOf(d) + 1) % DIRS.length]!
const reducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The program is built from cards (docs/specs/coding.md, ProgramGame). Every move is computed by run() in program.ts.
// A run that misses keeps the strip, shows the card where Shufi stopped, and walks him back: no negative text.
export function ProgramGame({ question, aid, onAttempt }: GameProps<ProgramQ>) {
  const { board, palette, maxCards, oneEdit } = question
  const initial = question.start ?? []
  const [program, setProgram] = useState<Program>(initial)
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('edit')
  const [result, setResult] = useState<RunResult | null>(null)
  const [step, setStep] = useState(0)
  const [stopCard, setStopCard] = useState<number | null>(null)
  const hinted = useRef(false)
  const reported = useRef(false)

  useEffect(() => {
    if (aid && question.hint && !hinted.current) {
      hinted.current = true
      void say(question.hint)
    }
  }, [aid, question.hint])

  const lastStepOf = (r: RunResult) => r.path.length - 1 + (r.stoppedAt !== undefined ? 1 : 0)

  useEffect(() => {
    if (phase === 'walk' && result) {
      const t = setTimeout(() => {
        if (step < lastStepOf(result)) {
          setStep(step + 1)
          if (step + 1 < result.path.length) sfx.tick()
          return
        }
        if (reported.current) return
        reported.current = true
        if (result.reachedGoal && (!oneEdit || oneEditApart(initial, program))) {
          setPhase('won')
          onAttempt(true)
        } else {
          setStopCard(result.stoppedAt ?? program.length - 1)
          setPhase('miss')
          onAttempt(false)
        }
      }, STEP_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'miss') {
      const t = setTimeout(() => { setResult(null); setStep(0); setPhase('edit') }, PAUSE_MS)
      return () => clearTimeout(t)
    }
  })

  const editing = phase === 'edit'
  const change = (next: Program) => { setProgram(next); setStopCard(null) }
  const full = maxCards !== undefined && program.length >= maxCards

  // A new "repeat" card starts empty and the next arrow goes inside it (like wrapping in ScratchJr), so a child
  // picks what to repeat instead of getting whatever arrow happened to come last.
  const filling = program.findIndex(c => c.kind === 'repeat' && c.body.length === 0)
  const append = (c: PaletteCard) => {
    if (!editing) return
    if (filling >= 0 && c !== 'repeat') {
      change(program.map((x, k) => (k === filling && x.kind === 'repeat' ? { ...x, body: [c] } : x)))
      return
    }
    if (filling >= 0) return
    if (full) { void say(C.full); return }
    const card: Card = c === 'repeat' ? { kind: 'repeat', times: MIN_TIMES, body: [] } : { kind: 'move', dir: c }
    change([...program, card])
    setSelected(null)
  }
  const removeAt = (i: number) => {
    change(program.filter((_, k) => k !== i))
    setSelected(null)
  }
  const eraseLast = () => {
    if (editing && program.length) removeAt(selected !== null && selected < program.length ? selected : program.length - 1)
  }
  const tapCard = (i: number) => {
    if (!editing) return
    const c = program[i]!
    if (oneEdit && c.kind === 'move') {
      change(program.map((x, k) => k === i ? { kind: 'move', dir: nextDir(c.dir) } : x))
      setSelected(i)
    } else removeAt(i)
  }
  const edit = (i: number, f: (c: Extract<Card, { kind: 'repeat' }>) => Card) => {
    if (!editing) return
    change(program.map((x, k) => k === i && x.kind === 'repeat' ? f(x) : x))
  }

  const go = () => {
    if (!editing || !program.length || filling >= 0) return
    const r = run(board, program)
    reported.current = false
    setSelected(null)
    setStopCard(null)
    setResult(r)
    setStep(reducedMotion() ? lastStepOf(r) : 0)
    setPhase('walk')
  }

  const onKey = (e: KeyboardEvent) => {
    const onRoot = (e.target as HTMLElement).classList.contains('cd-play')
    const dir = KEY_DIR[e.key]
    // Buttons don't use arrows or Backspace themselves, so those keys count from them too; Enter must stay a click.
    const fromButton = (e.target as HTMLElement).tagName === 'BUTTON'
    if (dir && (onRoot || fromButton)) { e.preventDefault(); append(dir) }
    else if (e.key === 'Backspace' && (onRoot || fromButton)) { e.preventDefault(); eraseLast() }
    else if (e.key === 'Enter' && onRoot) { e.preventDefault(); go() }
  }

  const expanded = result ? expand(program) : []
  const active = phase === 'walk' && step > 0 ? (expanded[step - 1]?.card ?? result?.stoppedAt ?? null) : null
  const hero = result ? result.path[Math.min(step, result.path.length - 1)] : undefined
  const trail = result && phase !== 'edit' ? result.path.slice(0, step + 1) : undefined
  const start = find(board, 'S')
  const slots = Math.max(maxCards ?? 0, program.length)

  const cardCls = (i: number) => `cd-card${active === i ? ' run' : ''}${stopCard === i ? ' stop' : ''}${selected === i ? ' sel' : ''}`

  return (
    <div className="cd-stage" onKeyDown={onKey}>
      <p className="pk-q">{phrases[question.instruction]}</p>
      <div className="cd-play" role="group" tabIndex={0} aria-label={phrases[question.instruction] ?? ''}>
        <BoardView board={board} size={BOARD_PX} hero={hero ?? start} trail={trail} ghost={aid ? question.ghost : undefined} />
      </div>
      {/* Cards to add look like buttons (solid, with +); the program below looks like a numbered track, so a child
          can tell "choose" from "what Shufi will do". */}
      <p className="cd-label">{phrases['code.ui.add']}</p>
      <div className="cd-palette" role="group" aria-label="קְלָפִים">
        {palette.map(p => (
          <button key={p} type="button" className="cd-pal" disabled={!editing} onClick={() => append(p)}
            aria-label={p === 'repeat' ? (phrases[C.repeatCard] ?? '🔁') : dirName(p)}>
            <span className="cd-plus" aria-hidden="true">+</span>
            <span aria-hidden="true">{p === 'repeat' ? '🔁' : ARROW[p]}</span>
            {p === 'repeat' && <span className="cd-pal-text">{phrases[C.repeatCard]}</span>}
          </button>
        ))}
      </div>
      <p className="cd-label">{phrases['code.ui.program']}</p>
      <div className="cd-strip" dir="ltr" role="list" aria-label="הַתָּכְנִית">
        <span className="cd-start" aria-hidden="true">🦉</span>
        {Array.from({ length: slots }, (_, i) => {
          const c = program[i]
          if (!c) return <span key={i} className="cd-slot" aria-hidden="true" />
          if (c.kind === 'move') {
            return (
              <button key={i} type="button" role="listitem" className={cardCls(i)} disabled={!editing}
                aria-label={dirName(c.dir)} onClick={() => tapCard(i)}><span className="cd-n" aria-hidden="true">{i + 1}</span>{ARROW[c.dir]}</button>
            )
          }
          return (
            <span key={i} role="listitem" className={`${cardCls(i)} cd-rep`}>
              <span className="cd-n" aria-hidden="true">{i + 1}</span>
              <span aria-hidden="true">🔁</span>
              <button type="button" className="cd-sub cd-times" disabled={!editing}
                aria-label={c.times === 2 ? 'פַּעֲמַיִם' : `${c.times} ${phrases[C.times] ?? '×'}`}
                onClick={() => edit(i, r => ({ ...r, times: r.times >= MAX_TIMES ? MIN_TIMES : r.times + 1 }))}>×{c.times}</button>
              {c.body.length === 0 && <span className="cd-ask" aria-live="polite">? {phrases['code.ui.pickArrow']}</span>}
              {c.body.map((d, j) => (
                <button key={j} type="button" className="cd-sub" disabled={!editing} aria-label={dirName(d)}
                  onClick={() => edit(i, r => ({ ...r, body: r.body.map((x, k) => k === j ? nextDir(x) : x) }))}>{ARROW[d]}</button>
              ))}
              <button type="button" className="cd-sub cd-x" disabled={!editing} aria-label={phrases[C.erase] ?? '⌫'}
                onClick={() => removeAt(i)}>✕</button>
            </span>
          )
        })}
      </div>
      <div className="cd-actions">
        <button type="button" className="cta cd-run" disabled={!editing || !program.length || filling >= 0} onClick={go}
          aria-label={phrases[C.run] ?? '▶'}>
          <span aria-hidden="true">▶</span> {phrases[C.run]}
        </button>
        <button type="button" className="pill cd-erase" disabled={!editing || !program.length} onClick={eraseLast}
          aria-label={phrases[C.erase] ?? '⌫'}>
          <span aria-hidden="true">⌫</span> {phrases[C.erase]}
        </button>
      </div>
    </div>
  )
}
