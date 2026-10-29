import { Link } from 'react-router-dom'
import { useStore } from '../core/storage/store'

/** Home button (or title), profile chip and star count. */
export function TopBar({ title, back = '/' }: { title?: string; back?: string | null }) {
  const current = useStore(s => s.current)
  const stars = useStore(s => s.progress.totalStars)
  return (
    <header className="top">
      <div className="top-side">
        {back === null ? <h1>{title}</h1> : <Link className="pill" to={back}>🏠 <span>חזרה</span></Link>}
      </div>
      <div className="top-side">
        <Link className="pill" to="/stickers" aria-label="אלבום מדבקות">📒</Link>
        {current && <Link className="pill" to="/profiles">{current.avatar} {current.name}</Link>}
        <span className="pill stars">⭐ {stars}</span>
      </div>
    </header>
  )
}
