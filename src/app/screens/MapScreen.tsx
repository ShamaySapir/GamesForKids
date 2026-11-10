import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { say } from '../../core/audio/audio'
import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { islandPhrase, islands } from '../islands'
import { TopBar } from '../TopBar'
import './map.css'

// Islands sit in rows on the sea (4 over 3 for seven, 3 over 3 for six), evenly spaced; every other island is set
// a little lower so the rows read as an archipelago, not a table. Rows wrap on narrow screens (map.css).
const rowsOf = <T,>(items: readonly T[]): T[][] => {
  const top = items.length <= 6 ? Math.min(3, items.length) : Math.ceil(items.length / 2)
  return [items.slice(0, top), items.slice(top)].filter(r => r.length)
}
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
      <TopBar title="הָאִיִּים שֶׁל אוֹלִי" back={null} />
      <Mascot line="app.pickIsland" size={96} />
      <div className="map">
        {rowsOf(islands).map((row, r) => (
        <div key={r} className="map-row">
        {row.map(island => {
          const mastered = island.skills.filter(s => progress.skills[s.id]?.mastered).length
          return (
            <button key={island.id} className={`island${island.comingSoon ? ' soon' : ''}`}
              style={{ ['--c' as string]: `var(${island.color})` }}
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
        ))}
      </div>
    </>
  )
}
