import { registerArt, type ArtProps } from '../../ui/pick/art'
import { MATH_ART_6, type CirclePart } from './types'
import './math-g6-art.css'

// Grade 6 drawings (number machine, circle parts, cube box, percent grid) for PickGame / tap-art questions.
// Spec: docs/specs/math-grade6.md. Colors come from math-g6-art.css.

const num = (v: ArtProps[string] | undefined, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rad = (deg: number) => (deg * Math.PI) / 180
const r2 = (v: number) => Math.round(v * 100) / 100

export type Pt = readonly [number, number]

/* ---------- number machine ---------- */

function MathMachine(p: ArtProps) {
  const rule = typeof p.rule === 'string' ? p.rule : '?'
  const side = (v: ArtProps[string] | undefined) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : '?')
  const fs = r2(Math.min(14, 50 / Math.max(rule.length * 0.62, 1)))
  const ball = (cx: number, v: string) => (
    <g>
      <circle className="g6a-ball" cx={cx} cy={50} r={17} />
      <text className="g6a-num" x={cx} y={50} style={v.length > 3 ? { fontSize: 12 } : undefined}>{v}</text>
    </g>
  )
  return (
    <svg className="g6a-art" width={num(p.size, 96) * 1.6} height={num(p.size, 96)} viewBox="0 0 160 100" aria-hidden="true">
      <path className="g6a-pipe" d="M35 50H44" />
      <path className="g6a-funnel" d="M38 34L54 34L50 50L42 50Z" />
      <rect className="g6a-box" x={52} y={24} width={56} height={52} rx={8} />
      <text className="g6a-rule" x={80} y={50} style={{ fontSize: fs }}>{rule}</text>
      <path className="g6a-pipe" d="M108 50H125" />
      <path className="g6a-pipe" d="M121 44L127 50L121 56" />
      {ball(18, side(p.input))}
      {ball(143, side(p.output))}
    </svg>
  )
}

/* ---------- circle ---------- */

const C = 50
const R = 36
const ANGLE = { radius: -60, diameter: 20, chordA: 100, chordB: 170, arcA: 225, arcB: 275 }

export function circleGeometry(): {
  radius: readonly [Pt, Pt]
  diameter: readonly [Pt, Pt]
  chord: readonly [Pt, Pt]
  arc: readonly [Pt, Pt]
} {
  const at = (deg: number): Pt => [r2(C + R * Math.cos(rad(deg))), r2(C + R * Math.sin(rad(deg)))]
  return {
    radius: [[C, C], at(ANGLE.radius)],
    diameter: [at(ANGLE.diameter), at(ANGLE.diameter + 180)],
    chord: [at(ANGLE.chordA), at(ANGLE.chordB)],
    arc: [at(ANGLE.arcA), at(ANGLE.arcB)],
  }
}

const PARTS: readonly CirclePart[] = ['radius', 'diameter', 'chord', 'arc']

function MathCircle(p: ArtProps) {
  const listed = (typeof p.parts === 'string' ? p.parts.split(',').map(s => s.trim()) : []).filter((s): s is CirclePart => PARTS.includes(s as CirclePart))
  const g = circleGeometry()
  const r = typeof p.r === 'number' && Number.isFinite(p.r) ? p.r : null
  const d = (part: CirclePart) => {
    const [a, b] = g[part]
    return part === 'arc' ? `M${a[0]} ${a[1]}A${R} ${R} 0 0 1 ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`
  }
  const mid = g.radius[1]
  return (
    <svg className="g6a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      <circle className="g6a-circle" cx={C} cy={C} r={R} />
      {[...new Set(listed)].map(part => (
        <g key={part}>
          <path className="g6a-hit" data-part={part} d={d(part)} />
          <path className="g6a-part" data-part={part} d={d(part)} />
        </g>
      ))}
      <circle className="g6a-centre" cx={C} cy={C} r={2.8} />
      {r !== null && listed.includes('radius') && (
        <text className="g6a-label" style={{ textAnchor: 'end' }} x={r2((C + mid[0]) / 2 - 6)} y={r2((C + mid[1]) / 2 - 4)}>r = {r}</text>
      )}
    </svg>
  )
}

/* ---------- cubes (isometric box) ---------- */

const COS = Math.cos(rad(30))
const SIN = 0.5

/** A box of l (right-down) × w (left-down) × h (up) unit cubes: the points of every visible unit face. */
export function cubeFaces(l: number, w: number, h: number): { kind: 'top' | 'left' | 'right'; pts: Pt[] }[] {
  const k = Math.min(86 / ((l + w) * COS), 86 / ((l + w) * SIN + h))
  const proj = (a: number, b: number, z: number): Pt => [(a - b) * COS * k, ((a + b) * SIN - z) * k]
  const minX = -w * COS * k
  const maxX = l * COS * k
  const minY = -h * k
  const maxY = (l + w) * SIN * k
  const ox = 50 - (minX + maxX) / 2
  const oy = 50 - (minY + maxY) / 2
  const place = (pts: Pt[]): Pt[] => pts.map((q): Pt => [r2(q[0] + ox), r2(q[1] + oy)])
  const out: { kind: 'top' | 'left' | 'right'; pts: Pt[] }[] = []
  for (let i = 0; i < l; i++) for (let j = 0; j < w; j++) out.push({ kind: 'top', pts: place([proj(i, j, h), proj(i + 1, j, h), proj(i + 1, j + 1, h), proj(i, j + 1, h)]) })
  for (let i = 0; i < l; i++) for (let z = 0; z < h; z++) out.push({ kind: 'left', pts: place([proj(i, w, z), proj(i + 1, w, z), proj(i + 1, w, z + 1), proj(i, w, z + 1)]) })
  for (let j = 0; j < w; j++) for (let z = 0; z < h; z++) out.push({ kind: 'right', pts: place([proj(l, j, z), proj(l, j + 1, z), proj(l, j + 1, z + 1), proj(l, j, z + 1)]) })
  return out
}

function MathCubes(p: ArtProps) {
  const l = Math.round(clamp(num(p.l, 2), 1, 5))
  const w = Math.round(clamp(num(p.w, 2), 1, 5))
  const h = Math.round(clamp(num(p.h, 2), 1, 5))
  return (
    <svg className="g6a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      {cubeFaces(l, w, h).map((f, i) => (
        <polygon key={i} className={`g6a-face g6a-face-${f.kind}`} points={f.pts.map(q => q.join(',')).join(' ')} />
      ))}
    </svg>
  )
}

/* ---------- percent grid ---------- */

function MathPercent(p: ArtProps) {
  const on = Math.round(clamp(num(p.p, 0), 0, 100))
  const cell = 8.6
  const x0 = (100 - cell * 10) / 2
  return (
    <svg className="g6a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: 100 }, (_, i) => (
        <rect key={i} className={`g6a-cell${i < on ? ' on' : ''}`} x={r2(x0 + (i % 10) * cell)} y={r2(x0 + Math.floor(i / 10) * cell)} width={cell} height={cell} />
      ))}
    </svg>
  )
}

export function registerMathArt6() {
  registerArt({
    [MATH_ART_6.machine]: MathMachine,
    [MATH_ART_6.circle]: MathCircle,
    [MATH_ART_6.cubes]: MathCubes,
    [MATH_ART_6.percent]: MathPercent,
  })
}
