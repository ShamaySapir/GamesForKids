import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dueItems } from '../../core/adaptive/adaptive'
import { phrases, raw, say, sfx, stop } from '../../core/audio/audio'
import { advance, startSession, type SessionState } from '../../core/engine/session'
import type { GameDef, IslandDef, SkillDef } from '../../core/engine/types'
import { skillLeitner, type SprintOutcome } from '../../core/progress/progress'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { TopBar } from '../TopBar'

// A timed sprint (DECISIONS D23): the child beats their own record. A calm bar empties, no ticking, no red;
// a miss shows the answer and moves on, and nothing is ever taken away.

const SPRINT_LENGTH = 1000
const NEXT_AFTER_GOOD_MS = 350
const SHOW_ANSWER_MS = 1300
const TICK_MS = 250

type Phase = 'ready' | 'running' | 'done'

export function scoreSentence(score: number): string {
  return score === 1 ? 'עֲנִיתֶם נָכוֹן עַל תַּרְגִּיל אֶחָד!' : `עֲנִיתֶם נָכוֹן עַל ${score} תַּרְגִּילִים!`
}

export function SprintRound({ island, skill, game }: { island: IslandDef; skill: SkillDef; game: GameDef }) {
  const seconds = game.sprint!.seconds
  const recordSprint = useStore(s => s.recordSprint)
  const best = useStore(s => s.progress.records?.[`${skill.id}|${game.id}`] ?? 0)
  const [review] = useState(() =>
    dueItems(skillLeitner(useStore.getState().progress, skill.id), Date.now(), k => game.accepts?.(k) ?? false))
  const [phase, setPhase] = useState<Phase>('ready')
  const [s, setS] = useState<SessionState>(() => startSession(game, Math.random, review, SPRINT_LENGTH))
  const [left, setLeft] = useState(seconds * 1000)
  const [shown, setShown] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<SprintOutcome | null>(null)
  const [count, setCount] = useState(0)
  const correct = useRef<string[]>([])
  const missed = useRef<string[]>([])
  const busy = useRef(false)
  const ends = useRef(0)

  useEffect(() => { void say('app.sprint.ready') }, [])
  useEffect(() => stop, [])

  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => {
      const ms = Math.max(0, ends.current - Date.now())
      setLeft(ms)
      if (ms > 0) return
      clearInterval(t)
      setPhase('done')
      void recordSprint({ skillId: skill.id, gameId: game.id, correct: correct.current, missed: missed.current, at: Date.now() }).then(o => {
        setOutcome(o)
        sfx.win()
        void say(o.score === 0 ? 'app.sprint.again' : [raw(scoreSentence(o.score)), o.newRecord ? 'app.sprint.newRecord' : 'app.sprint.beatIt'])
      })
    }, TICK_MS)
    return () => clearInterval(t)
  }, [phase, recordSprint, skill.id, game.id])

  const start = () => {
    stop()
    ends.current = Date.now() + seconds * 1000
    setLeft(seconds * 1000)
    setPhase('running')
  }

  const next = () => setS(cur => advance({ ...cur, triedThis: false }, game, Math.random, review))

  const onAttempt = (ok: boolean) => {
    if (busy.current || phase !== 'running') return
    busy.current = true
    const key = s.question.itemKey
    if (ok) {
      correct.current.push(key)
      setCount(correct.current.length)
      sfx.good()
      setTimeout(() => { busy.current = false; next() }, NEXT_AFTER_GOOD_MS)
    } else {
      if (!missed.current.includes(key)) missed.current.push(key)
      const a = s.question.answer
      setShown(typeof a === 'number' || typeof a === 'string' ? String(a) : '')
      setTimeout(() => { busy.current = false; setShown(null); next() }, SHOW_ANSWER_MS)
    }
  }

  const color = { ['--c' as string]: `var(${island.color})` }
  const again = () => {
    correct.current = []
    missed.current = []
    setCount(0)
    setOutcome(null)
    setS(startSession(game, Math.random, review, SPRINT_LENGTH))
    start()
  }

  if (phase === 'ready') return (
    <>
      <TopBar back={`/island/${island.id}`} />
      <div className="card" style={{ textAlign: 'center', ...color, borderColor: `var(${island.color})` }}>
        <div style={{ fontSize: 72 }} aria-hidden="true">⏱️</div>
        <h1>{game.title}</h1>
        <p className="sub">{phrases['app.sprint.rules']}</p>
        {best > 0 && <p className="sub">{phrases['app.sprint.best']} {best}</p>}
        <button className="cta" onClick={start} autoFocus>{phrases['app.sprint.go']}</button>
      </div>
      <div style={{ marginTop: 16 }}><Mascot mood="happy" size={90} speak="app.sprint.ready" /></div>
    </>
  )

  if (phase === 'done') return (
    <>
      <TopBar back={`/island/${island.id}`} />
      <div className="card" style={{ textAlign: 'center', borderColor: `var(${island.color})` }}>
        {!outcome ? <p className="sub">…</p> : (
          <>
            <div className="pop" style={{ fontSize: 80 }} aria-hidden="true">{outcome.newRecord ? '🏆' : '⭐'}</div>
            <h1 data-testid="sprint-score">{outcome.score === 0 ? phrases['app.sprint.again'] : scoreSentence(outcome.score)}</h1>
            {outcome.newRecord
              ? <p className="pop" style={{ fontSize: 26, fontWeight: 800 }}>{phrases['app.sprint.newRecord']}</p>
              : <p className="sub">{phrases['app.sprint.best']} {outcome.previous}. {outcome.score > 0 && phrases['app.sprint.beatIt']}</p>}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <button className="cta" onClick={again} autoFocus>שחקו שוב</button>
              <Link className="pill" to={`/island/${island.id}`}>משחק אחר</Link>
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 16 }}><Mascot mood="happy" size={90} /></div>
    </>
  )

  const Game = game.component
  const fraction = left / (seconds * 1000)
  return (
    <>
      <TopBar back={`/island/${island.id}`} />
      <div className="sprint-bar" style={color} role="progressbar" aria-label="זמן" aria-valuemin={0} aria-valuemax={seconds} aria-valuenow={Math.ceil(left / 1000)}>
        <i style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="sprint-count" aria-live="polite">✓ {count}</p>
      <div className="card" style={{ ...color, borderColor: `var(${island.color})` }}>
        <Game key={`${s.index}:${s.question.itemKey}`} question={s.question} aid={false} onAttempt={onAttempt} />
        <div className="fb" aria-live="polite">{shown !== null && `${phrases['app.sprint.answerWas']} ${shown}`}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Mascot mood="idle" speak={s.question.say} size={70} text={phrases['app.replay']} />
      </div>
    </>
  )
}
