import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { say } from '../../core/audio/audio'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { islandPhrase, islands } from '../islands'
import { TopBar } from '../TopBar'
import './map.css'

// Spots on the sea in map order (percent of the map box), gently staggered so they read as islands, with room
// between them. From the reading side (right) in RTL: two rows of three, or four over three for seven islands.
const SPOTS_6 = [[17, 26], [50, 21], [83, 26], [17, 74], [50, 79], [83, 74]] as const
const SPOTS_7 = [[12, 25], [37, 20], [63, 25], [88, 20], [25, 76], [50, 81], [75, 76]] as const
/** A mouse resting on an island says its name (pre-readers); a passing pointer says nothing. */
const HOVER_SAY_MS = 400

export function MapScreen() {
  const navigate = useNavigate()
  const progress = useStore(s => s.progress)
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverEnd = () => { if (hover.current) clearTimeout(hover.current) }
  useEffect(() => hoverEnd, [])

  return (
    <>
      <TopBar title="לומדים ומשחקים" back={null} />
      <Mascot line="app.pickIsland" size={96} />
      <div className="map">
        {islands.map((island, i) => {
          const spots = islands.length > 6 ? SPOTS_7 : SPOTS_6
          const [x, y] = spots[i % spots.length]!
          const mastered = island.skills.filter(s => progress.skills[s.id]?.mastered).length
          return (
            <button key={island.id} className={`island${island.comingSoon ? ' soon' : ''}`}
              style={{ insetInlineStart: `${x}%`, top: `${y}%`, ['--c' as string]: `var(${island.color})` }}
              onPointerEnter={e => {
                if (e.pointerType !== 'mouse') return
                hoverEnd()
                hover.current = setTimeout(() => void say(islandPhrase(island.id)), HOVER_SAY_MS)
              }}
              onPointerLeave={hoverEnd}
              onClick={() => { hoverEnd(); if (island.comingSoon) void say('app.soon'); else navigate(`/island/${island.id}`) }}>
              <span className={`island-icon${/[א-ת]/.test(island.icon) ? ' island-letters' : ''}`}>{island.icon}</span>
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
