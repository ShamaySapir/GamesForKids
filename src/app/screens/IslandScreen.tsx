import { Link, Navigate, useParams } from 'react-router-dom'
import { say } from '../../core/audio/audio'
import { isUnlocked } from '../../core/progress/progress'
import { gradeShort } from '../../core/engine/types'
import { MASTERY_ACCURACY, MASTERY_ROUNDS } from '../../core/adaptive/adaptive'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { findIsland } from '../islands'
import { TopBar } from '../TopBar'


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
          // Rounds that count toward mastery (D7), shown so a 3-star round that didn't unlock the next skill makes sense.
          const good = Math.min(MASTERY_ROUNDS, sp?.rounds.filter(r => r.total > 0 && r.firstTry / r.total >= MASTERY_ACCURACY).length ?? 0)
          return (
            <li key={skill.id} className="tile" style={{ ['--c' as string]: `var(${island.color})`, cursor: 'default', flexWrap: 'wrap', opacity: open ? 1 : 0.6 }}>
              <span className="ic">{sp?.mastered ? skill.sticker : open ? i + 1 : '🔒'}</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <b>{skill.title}</b>
                <small>{gradeShort(skill.grade)} · {'⭐'.repeat(sp?.bestStars ?? 0) || 'עוד לא שיחקנו'}</small>
                {open && !sp?.mastered && good > 0 && (
                  <small style={{ display: 'block', marginTop: 4 }} aria-label={`${good} / ${MASTERY_ROUNDS}`}>{'🟢'.repeat(good)}{'⚪'.repeat(MASTERY_ROUNDS - good)} עוֹד סִבּוּב טוֹב וּמְקַבְּלִים מַדְבֵּקָה</small>
                )}
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
