import { useEffect, useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { phrases } from '../../core/audio/audio'
import { MASTERY_ROUNDS } from '../../core/adaptive/adaptive'
import { gradeShort } from '../../core/engine/types'
import { isChallenge, recommendedSkill } from '../../core/progress/path'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { StickerProgress, goodRounds } from '../../ui/StickerProgress'
import { findIsland } from '../islands'
import { TopBar } from '../TopBar'

// Soft locks (DECISIONS D19): every skill is playable. One skill is marked "start here" from the child's grade, and
// skills that are a stretch are tagged as a challenge.
export function IslandScreen() {
  const island = findIsland(useParams().islandId)
  const progress = useStore(s => s.progress)
  const grade = useStore(s => s.current?.grade ?? 0)
  const start = useRef<HTMLLIElement | null>(null)
  const rec = island ? recommendedSkill(progress, island, grade) : undefined
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    start.current?.scrollIntoView?.({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [rec?.id])
  if (!island || island.comingSoon) return <Navigate to="/" replace />

  return (
    <>
      <TopBar />
      <h1>{island.icon} {island.title}</h1>
      <Mascot line={rec ? 'app.pickSkillStar' : 'app.pickSkill'} size={84} />
      <ol style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16, marginTop: 20 }}>
        {island.skills.map(skill => {
          const sp = progress.skills[skill.id]
          const here = rec?.id === skill.id
          const stretch = isChallenge(progress, skill, grade)
          return (
            <li key={skill.id} ref={here ? start : undefined} className={`tile${here ? ' start-here' : ''}`}
              style={{ ['--c' as string]: `var(${island.color})`, cursor: 'default', flexWrap: 'wrap' }}>
              <span className="ic">
                <StickerProgress sticker={skill.sticker} good={sp?.mastered ? MASTERY_ROUNDS : goodRounds(sp?.rounds)} size={34} />
              </span>
              <div style={{ flex: 1, minWidth: 180 }}>
                {here && <span className="badge badge-start">⭐ {phrases['app.startHere']}</span>}
                {stretch && <span className="badge badge-stretch">💪 {phrases['app.challengeTag']}</span>}
                <b>{skill.title}</b>
                <small>{gradeShort(skill.grade)} · {'⭐'.repeat(sp?.bestStars ?? 0) || 'עוד לא שיחקנו'}</small>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {skill.games.map(g => <Link key={g.id} className="pill" to={`/play/${island.id}/${skill.id}/${g.id}`}>{g.icon} {g.title}</Link>)}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
