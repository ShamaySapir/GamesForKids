import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { say } from '../../core/audio/audio'
import { MASTERY_ROUNDS } from '../../core/adaptive/adaptive'
import { isUnlocked } from '../../core/progress/progress'
import { gradeShort } from '../../core/engine/types'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { StickerProgress, goodRounds } from '../../ui/StickerProgress'
import { findIsland } from '../islands'
import { TopBar } from '../TopBar'

export function IslandScreen() {
  const island = findIsland(useParams().islandId)
  const progress = useStore(s => s.progress)
  // Tapping a locked game bounces the stickers still to earn; `n` remounts them so the bounce replays.
  const [pulse, setPulse] = useState<{ ids: readonly string[]; n: number }>({ ids: [], n: 0 })
  if (!island || island.comingSoon) return <Navigate to="/" replace />

  return (
    <>
      <TopBar />
      <h1>{island.icon} {island.title}</h1>
      <Mascot line="app.pickSkill" size={84} />
      <ol style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16, marginTop: 20 }}>
        {island.skills.map(skill => {
          const sp = progress.skills[skill.id]
          const open = isUnlocked(progress, skill.requires)
          const locked = () => {
            setPulse(p => ({ ids: skill.requires.filter(id => !progress.skills[id]?.mastered), n: p.n + 1 }))
            void say('app.locked')
          }
          const bounce = pulse.ids.includes(skill.id)
          return (
            <li key={skill.id} className="tile" style={{ ['--c' as string]: `var(${island.color})`, cursor: 'default', flexWrap: 'wrap', opacity: open ? 1 : 0.6 }}>
              <span className="ic">
                {open
                  ? <StickerProgress key={bounce ? pulse.n : 0} sticker={skill.sticker} good={sp?.mastered ? MASTERY_ROUNDS : goodRounds(sp?.rounds)} size={34} pulse={bounce} />
                  : '🔒'}
              </span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <b>{skill.title}</b>
                <small>{gradeShort(skill.grade)} · {'⭐'.repeat(sp?.bestStars ?? 0) || 'עוד לא שיחקנו'}</small>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {skill.games.map(g => open
                  ? <Link key={g.id} className="pill" to={`/play/${island.id}/${skill.id}/${g.id}`}>{g.icon} {g.title}</Link>
                  : <button key={g.id} className="pill" onClick={locked}>🔒 {g.title}</button>)}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
