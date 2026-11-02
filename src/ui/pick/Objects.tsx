import type { ObjectGroup } from './types'
import './pick.css'

// Dot-dice positions (percent of the box) for 1–6, so small quantities can be recognised at a glance.
const DICE: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
}

/** Stable pseudo-random spots for a scattered group, so a question looks the same on every render. */
function scatter(count: number): [number, number][] {
  const spots: [number, number][] = []
  let seed = count * 9301 + 49297
  const next = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; spots.length < count && i < 400; i++) {
    const p: [number, number] = [12 + next() * 76, 12 + next() * 76]
    if (spots.every(([x, y]) => Math.hypot(x - p[0], y - p[1]) > 20)) spots.push(p)
  }
  return spots
}

/** A countable group of objects. Rows are split in fives, which supports grouping (curriculum: grouping into 10s). */
export function Objects({ group, size = 44 }: { group: ObjectGroup; size?: number }) {
  const { emoji, count, layout = 'row', faded = 0, covered = 0 } = group
  const item = (i: number) => (
    <span key={i} className={`pk-obj${i >= count - faded ? ' faded' : ''}`} style={{ fontSize: size }} aria-hidden="true">{emoji}</span>
  )
  // A covered group must not announce its total: that is the answer.
  const label = covered ? `${count - covered} + ?` : `${count}`
  if ((layout === 'dice' && count <= 6) || layout === 'scatter') {
    const spots = layout === 'dice' ? DICE[count]! : scatter(count)
    return (
      <div className="pk-objs-box" role="img" aria-label={label} style={{ width: size * 3.4, height: size * 3.4 }}>
        {spots.map(([x, y], i) => <span key={i} className="pk-obj-at" style={{ insetInlineStart: `${x}%`, top: `${y}%` }}>{item(i)}</span>)}
      </div>
    )
  }
  if (covered) {
    // All hidden objects sit under ONE cup, so the child works out the missing part instead of counting cups.
    const shown = count - covered
    return (
      <div className="pk-objs-rows" role="img" aria-label={label}>
        <div className="pk-objs-row pk-objs-cover">
          {Array.from({ length: shown }, (_, i) => item(i))}
          <span className="pk-cup" style={{ fontSize: size * 1.6 }} aria-hidden="true">?</span>
        </div>
      </div>
    )
  }
  if ((layout === 'array' || layout === 'groups') && group.cols) {
    const per = group.cols
    const rowsOf = Array.from({ length: Math.ceil(count / per) }, (_, r) => Array.from({ length: Math.min(per, count - r * per) }, (_, i) => r * per + i))
    return (
      <div className={layout === 'array' ? 'pk-objs-array' : 'pk-objs-groups'} role="img" aria-label={label}>
        {rowsOf.map((row, r) => <div key={r} className={layout === 'array' ? 'pk-objs-row' : 'pk-objs-group'}>{row.map(item)}</div>)}
      </div>
    )
  }
  const rows = Array.from({ length: Math.ceil(count / 5) }, (_, r) => Array.from({ length: Math.min(5, count - r * 5) }, (_, i) => r * 5 + i))
  return (
    <div className="pk-objs-rows" role="img" aria-label={label}>
      {rows.map((row, r) => <div key={r} className="pk-objs-row">{row.map(item)}</div>)}
    </div>
  )
}
