import { Link, Navigate, useParams } from 'react-router-dom'
import { say } from '../../core/audio/audio'
import { isUnlocked } from '../../core/progress/progress'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { findIsland } from '../islands'
import { TopBar } from '../TopBar'

const GRADE_LABEL = ['גן', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']

export function IslandScreen() {
  const island = findIsland(useParams().islandId)
  const progress = useStore(s => s.progress)
  if (!island || island.comingSoon) return <Navigate to="/" replace />

  return (
    <>
      <TopBar />
      <h1>{island.icon} {island.title}</h1>
      <Mascot line="app.pickSkill" size={84} />
      <ol style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16, marginTop: 20 }}>
        {island.skills.map((skill, i) => {
          const sp = progress.skills[skill.id]
          const open = isUnlocked(progress, skill.requires)
          return (
            <li key={skill.id} className="tile" style={{ ['--c' as string]: `var(${island.color})`, cursor: 'default', flexWrap: 'wrap', opacity: open ? 1 : 0.6 }}>
              <span className="ic">{sp?.mastered ? skill.sticker : open ? i + 1 : '🔒'}</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <b>{skill.title}</b>
                <small>{GRADE_LABEL[skill.grade]} · {'⭐'.repeat(sp?.bestStars ?? 0) || 'עוד לא שיחקנו'}</small>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {skill.games.map(g => open
                  ? <Link key={g.id} className="pill" to={`/play/${island.id}/${skill.id}/${g.id}`}>{g.icon} {g.title}</Link>
                  : <button key={g.id} className="pill" onClick={() => void say('app.locked')}>🔒 {g.title}</button>)}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
