import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { dueItems, type Stars } from '../../core/adaptive/adaptive'
import { phrases, say, sfx, stop } from '../../core/audio/audio'
import { advance, attempt, startSession, type SessionState } from '../../core/engine/session'
import { pick } from '../../core/engine/random'
import type { GameDef, IslandDef, SkillDef } from '../../core/engine/types'
import { isUnlocked, skillLeitner } from '../../core/progress/progress'
import { useStore } from '../../core/storage/store'
import { Mascot, type Mood } from '../../ui/Mascot'
import { findIsland, findSkill } from '../islands'
import { TopBar } from '../TopBar'

const NEXT_DELAY_MS = 1100
const GOOD = ['app.good.1', 'app.good.2', 'app.good.3', 'app.good.4']

export function PlayScreen() {
  const { islandId, skillId, gameId } = useParams()
  const island = findIsland(islandId)
  const skill = findSkill(island, skillId)
  const game = skill?.games.find(g => g.id === gameId)
  const progress = useStore(s => s.progress)
  if (!island || !skill || !game || !isUnlocked(progress, skill.requires)) return <Navigate to="/" replace />
  // Remount on replay so every round starts fresh.
  return <Round key={`${skill.id}/${game.id}`} island={island} skill={skill} game={game} />
}

function Round({ island, skill, game }: { island: IslandDef; skill: SkillDef; game: GameDef }) {
  const autoSpeak = useStore(s => s.current?.autoSpeak ?? false)
  const recordRound = useStore(s => s.recordRound)
  // Items due for review, fixed for the lifetime of this round screen.
  const [review] = useState(() =>
    dueItems(skillLeitner(useStore.getState().progress, skill.id), Date.now(), k => game.accepts?.(k) ?? false))
  const [s, setS] = useState<SessionState>(() => startSession(game, Math.random, review))
  const [feedback, setFeedback] = useState<{ id: string; mood: Mood } | null>(null)
  const [result, setResult] = useState<{ stars: Stars; newlyMastered: boolean } | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    if (autoSpeak && !s.done) void say(s.question.say)
  }, [autoSpeak, s.question, s.done])
  useEffect(() => stop, [])

  const onAttempt = (correct: boolean) => {
    if (busy.current) return
    const next = attempt(s, correct)
    setS(next)
    if (!correct) {
      sfx.oops()
      setFeedback({ id: 'app.tryAgain', mood: 'encouraging' })
      return
    }
    busy.current = true
    sfx.good()
    const id = pick(Math.random, GOOD)
    setFeedback({ id, mood: 'happy' })
    void say(id)
    setTimeout(async () => {
      busy.current = false
      setFeedback(null)
      const after = advance(next, game, Math.random, review)
      setS(after)
      if (after.done) {
        const outcome = await recordRound({
          skillId: skill.id, sticker: skill.sticker, firstTry: after.firstTry, missed: after.missed,
          total: after.length, at: Date.now(),
        })
        setResult(outcome)
        sfx.win()
        void say(outcome.newlyMastered ? ['app.end.' + outcome.stars, 'app.mastered'] : 'app.end.' + outcome.stars)
      }
    }, NEXT_DELAY_MS)
  }

  const color = { ['--c' as string]: `var(${island.color})` }
  if (result) return <Results island={island} skill={skill} result={result} firstTry={s.firstTry.length} total={s.length} onAgain={() => {
    setResult(null)
    setS(startSession(game, Math.random, review))
  }} />

  const Game = game.component
  const dots = Array.from({ length: s.length }, (_, i) => <i key={i} className={`dot ${i < s.index ? 'done' : i === s.index ? 'now' : ''}`} />)

  return (
    <>
      <TopBar back={`/island/${island.id}`} />
      <div className="dots" style={color}>{dots}</div>
      <div className="card" style={{ ...color, borderColor: `var(${island.color})` }}>
        <Game key={`${s.index}:${s.question.itemKey}`} question={s.question} aid={s.aid} onAttempt={onAttempt} />
        <div className="fb" aria-live="polite">{feedback && phrases[feedback.id]}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Mascot mood={feedback?.mood ?? 'idle'} speak={s.question.say} size={80} text={feedback ? undefined : phrases['app.replay']} />
      </div>
    </>
  )
}

interface ResultsProps {
  island: IslandDef
  skill: SkillDef
  result: { stars: Stars; newlyMastered: boolean }
  firstTry: number
  total: number
  onAgain: () => void
}

function Results({ island, skill, result, firstTry, total, onAgain }: ResultsProps) {
  return (
    <>
      <TopBar back={`/island/${island.id}`} />
      <div className="card" style={{ textAlign: 'center', borderColor: `var(${island.color})` }}>
        <div className="pop" style={{ fontSize: 80 }}>{'⭐'.repeat(result.stars)}</div>
        <h1>{phrases['app.end.' + result.stars]}</h1>
        <p className="sub">{firstTry} מתוך {total} בניסיון הראשון</p>
        {result.newlyMastered && (
          <p className="pop" style={{ fontSize: 26, fontWeight: 800 }}>
            <span style={{ fontSize: 64, display: 'block' }}>{skill.sticker}</span>{phrases['app.mastered']}
          </p>
        )}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="cta" onClick={onAgain} autoFocus>שחקו שוב</button>
          <Link className="pill" to={`/island/${island.id}`}>משחק אחר</Link>
        </div>
      </div>
      <div style={{ marginTop: 16 }}><Mascot mood="happy" size={90} /></div>
    </>
  )
}
