import { useStore } from '../../core/storage/store'
import { Mascot } from '../../ui/Mascot'
import { islands } from '../islands'
import { TopBar } from '../TopBar'

export function StickersScreen() {
  const stickers = useStore(s => s.progress.stickers)
  const all = islands.flatMap(i => i.skills.map(s => ({ island: i, skill: s })))
  return (
    <>
      <TopBar />
      <Mascot line="app.stickers" size={84} />
      <div className="card" style={{ marginTop: 20, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
        {all.map(({ island, skill }) => {
          const got = stickers.includes(skill.sticker)
          return (
            <div key={skill.id} style={{ textAlign: 'center', border: '3px dashed var(--line)', borderRadius: 20, padding: 12 }}>
              <div className={got ? 'pop' : undefined} style={{ fontSize: 56, filter: got ? undefined : 'grayscale(1) opacity(.25)' }}>{skill.sticker}</div>
              <small style={{ color: 'var(--mute)' }}>{island.icon} {skill.title}</small>
            </div>
          )
        })}
      </div>
    </>
  )
}
