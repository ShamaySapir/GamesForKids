import { useNavigate } from 'react-router-dom'
import { say } from '../../core/audio/audio'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { islands } from '../islands'
import { TopBar } from '../TopBar'
import './map.css'

// Spots on the sea in map order (percent of the map box): two rows of three, gently staggered so they read as
// islands, with room between them. From the reading side (right) in RTL. Add a row when there are more than six.
const SPOTS = [[17, 26], [50, 21], [83, 26], [17, 74], [50, 79], [83, 74]] as const

export function MapScreen() {
  const navigate = useNavigate()
  const progress = useStore(s => s.progress)

  return (
    <>
      <TopBar title="לומדים ומשחקים" back={null} />
      <Mascot line="app.pickIsland" size={96} />
      <div className="map">
        {islands.map((island, i) => {
          const [x, y] = SPOTS[i % SPOTS.length]!
          const mastered = island.skills.filter(s => progress.skills[s.id]?.mastered).length
          return (
            <button key={island.id} className={`island${island.comingSoon ? ' soon' : ''}`}
              style={{ insetInlineStart: `${x}%`, top: `${y}%`, ['--c' as string]: `var(${island.color})` }}
              onClick={() => (island.comingSoon ? void say('app.soon') : navigate(`/island/${island.id}`))}>
              <span className="island-icon">{island.icon}</span>
              <b>{island.title}</b>
              {island.comingSoon
                ? <small>🚧 בקרוב</small>
                : <small>{mastered}/{island.skills.length} 🏅</small>}
            </button>
          )
        })}
      </div>
    </>
  )
}
