import { useState, type ReactNode } from 'react'
import { phrases } from '../../core/audio/audio'
import { shuffle } from '../../core/engine/random'
import type { GameProps } from '../../core/engine/types'
import { Clock, type Hand } from './Clock'
import type { HandQ, MatchQ, ReadQ, SetQ } from './generators'
import { sameTime, timeKey, timeText, type Time } from './time'
import './clock.css'

// Components keep per-question state; PlayScreen remounts them via `key` on each new question.

function Prompt({ id, children }: { id: string; children?: ReactNode }) {
  return <p className="clock-q">{phrases[id]} {children}</p>
}

/** "What time is it?" — read an analog clock, pick the time. */
export function ReadGame({ question, aid, onAttempt }: GameProps<ReadQ>) {
  const [wrong, setWrong] = useState<string[]>([])
  const [right, setRight] = useState(false)
  const choose = (t: Time) => {
    if (right) return
    const ok = sameTime(t, question.answer)
    if (ok) setRight(true)
    else setWrong(w => [...w, timeKey(t)])
    onAttempt(ok)
  }
  return (
    <div className="clock-stage">
      <Prompt id="clock.q.read" />
      <Clock time={question.answer} aid={aid} size={280} />
      {aid && <p className="clock-hint">{phrases['clock.hint.read']}</p>}
      <div className="opts" style={{ width: '100%' }}>
        {question.options.map(t => {
          const key = timeKey(t)
          const isRight = right && sameTime(t, question.answer)
          return (
            <button key={key} className={`opt${isRight ? ' ok' : wrong.includes(key) ? ' bad' : ''}`}
              disabled={wrong.includes(key)} onClick={() => choose(t)}>
              <span className="digi">{key}</span>
              <span className="clock-opt-text">{timeText(t)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** "Set the clock" — drag the hands to the requested time, then check. Also used by "The owl's day". */
export function SetGame({ question, aid, onAttempt }: GameProps<SetQ>) {
  const [time, setTime] = useState(question.start)
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const check = () => {
    if (done) return
    const ok = sameTime(time, question.answer)
    if (ok) setDone(true)
    else setMisses(n => n + 1)
    onAttempt(ok)
  }
  return (
    <div className="clock-stage">
      {question.scene
        ? <>
          <div className="clock-scene" aria-hidden="true">{question.scene.icon}</div>
          <p className="clock-q">{phrases[question.scene.phrase]}</p>
        </>
        : <p className="clock-q">{phrases['clock.q.set']} <span className="clock-target">{timeText(question.answer)}</span>
          {aid && <span className="digi clock-target">({timeKey(question.answer)})</span>}</p>}
      <Clock time={time} onChange={done ? undefined : setTime} snap={question.level.snap}
        movable={question.hourOnly ? ['hour'] : ['hour', 'minute']}
        aid={aid} ghost={aid && misses > 0 && !done ? question.answer : undefined} size={320} label={timeText(time)} />
      <p className="clock-hint">{phrases['clock.hint.set']}</p>
      <button className="cta" onClick={check} disabled={done}>✔ {phrases['clock.q.check']}</button>
    </div>
  )
}

/** "Which hand is which?" — click the short (hours) or long (minutes) hand. */
export function HandGame({ question, onAttempt }: GameProps<HandQ>) {
  const [done, setDone] = useState(false)
  const click = (hand: Hand) => {
    if (done) return
    const ok = hand === question.answer
    if (ok) setDone(true)
    onAttempt(ok)
  }
  return (
    <div className="clock-stage">
      <Prompt id={`clock.q.hand.${question.answer}`} />
      <Clock time={question.time} onHandClick={click} size={320} />
    </div>
  )
}

/** "Match" — pair each analog clock with its digital time. */
export function MatchGame({ question, aid, onAttempt }: GameProps<MatchQ>) {
  const [digital] = useState(() => shuffle(Math.random, question.times))
  const [sel, setSel] = useState<{ side: 'clock' | 'digi'; key: string } | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [bad, setBad] = useState<string | null>(null)

  const pickCard = (side: 'clock' | 'digi', t: Time) => {
    const key = timeKey(t)
    if (matched.includes(key)) return
    if (!sel || sel.side === side) return setSel({ side, key })
    if (sel.key === key) {
      const next = [...matched, key]
      setMatched(next)
      setSel(null)
      if (next.length === question.times.length) onAttempt(true)
    } else {
      setBad(side + key)
      setSel(null)
      setTimeout(() => setBad(null), 400)
      onAttempt(false)
    }
  }

  const cls = (side: 'clock' | 'digi', key: string) =>
    `opt match-card${matched.includes(key) ? ' done' : sel?.side === side && sel.key === key ? ' sel' : ''}${bad === side + key ? ' bad' : ''}`

  return (
    <div className="clock-stage">
      <Prompt id="clock.q.match" />
      <div className="match">
        {question.times.map(t => (
          <button key={timeKey(t)} className={cls('clock', timeKey(t))} onClick={() => pickCard('clock', t)} aria-label={`שעון ${matched.includes(timeKey(t)) ? timeText(t) : ''}`}>
            <Clock time={t} aid={aid} size="100%" />
          </button>
        ))}
      </div>
      <div className="match">
        {digital.map(t => (
          <button key={timeKey(t)} className={cls('digi', timeKey(t))} onClick={() => pickCard('digi', t)}>
            <span className="digi">{timeKey(t)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
