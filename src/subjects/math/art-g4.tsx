import { registerArt, type ArtProps } from '../../ui/pick/art'
import { MATH_ART_4, type QuadKind } from './types'
import './math-g4-art.css'

// Grade 4 drawings (fractions, strips, line pairs, polygons, quadrilaterals) for PickGame questions.
// Spec: docs/specs/math-grade4.md. Each draws in a 100-unit box scaled to props.size; colors come from math-g4-art.css.

const num = (v: ArtProps[string] | undefined, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rad = (deg: number) => (deg * Math.PI) / 180
const r2 = (v: number) => Math.round(v * 100) / 100

export type Pt = readonly [number, number]

const turn = (p: Pt, deg: number): Pt => {
  const c = Math.cos(rad(deg))
  const s = Math.sin(rad(deg))
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]
}

/** Centres the points in the 100-unit box and scales them (uniformly) so the largest side spans `span`. */
function fit(points: readonly Pt[], span: number): Pt[] {
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const w = Math.max(...xs) - Math.min(...xs)
  const h = Math.max(...ys) - Math.min(...ys)
  const k = span / Math.max(w, h, 1e-6)
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2
  const my = (Math.min(...ys) + Math.max(...ys)) / 2
  return points.map((p): Pt => [r2(50 + (p[0] - mx) * k), r2(50 + (p[1] - my) * k)])
}

const pts = (list: readonly Pt[]) => list.map(p => p.join(',')).join(' ')

/* ---------- fraction (circle / rectangle / strip) ---------- */

/** Rows × columns of the rectangle: the factor pair closest to a square (a prime number of parts is one row). */
export function rectGrid(parts: number): { rows: number; cols: number } {
  let rows = 1
  for (let r = 1; r * r <= parts; r++) if (parts % r === 0) rows = r
  return { rows, cols: parts / rows }
}

function MathFraction(p: ArtProps) {
  const parts = Math.round(clamp(num(p.parts, 4), 2, 12))
  const shaded = Math.round(clamp(num(p.shaded, 1), 0, parts))
  const shape = p.shape === 'circle' || p.shape === 'strip' ? p.shape : 'rect'
  const cls = (i: number) => `g4a-part${i < shaded ? ' on' : ''}`
  if (shape === 'circle') {
    const R = 44
    const at = (i: number): Pt => [r2(50 + R * Math.cos(rad(-90 + (360 * i) / parts))), r2(50 + R * Math.sin(rad(-90 + (360 * i) / parts)))]
    return (
      <svg className="g4a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
        {Array.from({ length: parts }, (_, i) => {
          const [x0, y0] = at(i)
          const [x1, y1] = at(i + 1)
          return <path key={i} className={cls(i)} d={`M50 50L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z`} />
        })}
        <circle className="g4a-outer" cx={50} cy={50} r={R} />
      </svg>
    )
  }
  const { rows, cols } = shape === 'strip' ? { rows: 1, cols: parts } : rectGrid(parts)
  const W = 88
  const cw = W / cols
  const ch = shape === 'strip' ? 28 : Math.min(cw, W / rows)
  const x0 = 50 - W / 2
  const y0 = 50 - (ch * rows) / 2
  return (
    <svg className="g4a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: parts }, (_, i) => (
        <rect key={i} className={cls(i)} x={r2(x0 + (i % cols) * cw)} y={r2(y0 + Math.floor(i / cols) * ch)} width={r2(cw)} height={r2(ch)} />
      ))}
      <rect className="g4a-outer" x={x0} y={y0} width={W} height={r2(ch * rows)} />
    </svg>
  )
}

/* ---------- two strips ---------- */

/** Reads "n/d" (n clamped to 0–d). */
export function parseFraction(s: ArtProps[string] | undefined): { n: number; d: number } | null {
  const m = typeof s === 'string' ? /^(\d+)\/(\d+)$/.exec(s) : null
  if (!m) return null
  const d = clamp(Number(m[2]), 1, 24)
  return { n: clamp(Number(m[1]), 0, d), d }
}

function MathStrips(p: ArtProps) {
  const list = [parseFraction(p.a) ?? { n: 1, d: 2 }]
  const b = parseFraction(p.b)
  if (b) list.push(b)
  const LX = 30
  const W = 100
  const H = 26
  const GAP = 14
  const vh = list.length * H + (list.length - 1) * GAP + 12
  return (
    <svg className="g4a-art" width={p.size * 1.4} height={(p.size * 1.4 * vh) / 140} viewBox={`0 0 140 ${vh}`} aria-hidden="true" style={{ direction: 'ltr' }}>
      {list.map(({ n, d }, row) => {
        const y = 6 + row * (H + GAP)
        const cw = W / d
        return (
          <g key={row}>
            <text className="g4a-label" x={LX - 14} y={y + H / 2}>{`${n}/${d}`}</text>
            {Array.from({ length: d }, (_, i) => (
              <rect key={i} className={`g4a-part${i < n ? ' on' : ''}`} x={r2(LX + i * cw)} y={y} width={r2(cw)} height={H} />
            ))}
            <rect className="g4a-outer" x={LX} y={y} width={W} height={H} />
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- two lines ---------- */

export type LineKind = 'parallel' | 'perpendicular' | 'crossing'
const CROSS_DEG = 60 // crossing lines meet at 60° (30° away from a right angle)

/** Two segments in the 100-unit box, rotated by `rot` degrees and fitted inside it. */
export function lineGeometry(kind: LineKind, rot: number): readonly [readonly [Pt, Pt], readonly [Pt, Pt]] {
  const cx = 38 * Math.cos(rad(CROSS_DEG))
  const cy = 38 * Math.sin(rad(CROSS_DEG))
  const base: Pt[] =
    kind === 'parallel'
      ? [[-40, -13], [40, -13], [-34, 13], [46, 13]]
      : kind === 'perpendicular'
        ? [[-40, 0], [40, 0], [8, -38], [8, 38]]
        : [[-40, 0], [40, 0], [4 - cx, cy], [4 + cx, -cy]]
  const f = fit(base.map(q => turn(q, rot)), 84)
  return [[f[0]!, f[1]!], [f[2]!, f[3]!]]
}

function MathLines(p: ArtProps) {
  const kind: LineKind = p.kind === 'perpendicular' || p.kind === 'crossing' ? p.kind : 'parallel'
  const [s1, s2] = lineGeometry(kind, num(p.rot, 0))
  return (
    <svg className="g4a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      <line className="g4a-seg" x1={s1[0][0]} y1={s1[0][1]} x2={s1[1][0]} y2={s1[1][1]} />
      <line className="g4a-seg alt" x1={s2[0][0]} y1={s2[0][1]} x2={s2[1][0]} y2={s2[1][1]} />
    </svg>
  )
}

/* ---------- polygon ---------- */

/** A convex polygon: points of a slightly flattened, slightly turned circle, so it is never a perfect regular shape. */
export function polygonGeometry(sides: number): Pt[] {
  const n = Math.round(clamp(sides, 4, 8))
  const raw = Array.from({ length: n }, (_, i): Pt => {
    const a = rad(-90 + (360 * i) / n)
    return [Math.cos(a), 0.88 * Math.sin(a)]
  })
  return fit(raw.map(q => turn(q, 8)), 84)
}

function MathPolygon(p: ArtProps) {
  const v = polygonGeometry(num(p.sides, 5))
  return (
    <svg className="g4a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon className="g4a-shape" points={pts(v)} />
      {p.diagonals === true && v.slice(2, -1).map((q, i) => (
        <line key={i} className="g4a-diag" x1={v[0]![0]} y1={v[0]![1]} x2={q[0]} y2={q[1]} />
      ))}
      {v.map((q, i) => <circle key={i} className="g4a-dot" cx={q[0]} cy={q[1]} r={3.2} />)}
    </svg>
  )
}

/* ---------- quadrilaterals ---------- */

const A_RHOMBUS = 60
const A_PARALLELOGRAM = 70
const at = (len: number, deg: number): Pt => [len * Math.cos(rad(deg)), len * Math.sin(rad(deg))]

const QUADS: Record<QuadKind, readonly Pt[]> = {
  square: [[0, 0], [1, 0], [1, 1], [0, 1]],
  rectangle: [[0, 0], [1.8, 0], [1.8, 1], [0, 1]],
  rhombus: [[0, 0], [1, 0], [1 + at(1, A_RHOMBUS)[0], at(1, A_RHOMBUS)[1]], at(1, A_RHOMBUS)],
  parallelogram: [[0, 0], [1.7, 0], [1.7 + at(1, A_PARALLELOGRAM)[0], at(1, A_PARALLELOGRAM)[1]], at(1, A_PARALLELOGRAM)],
  // Bottom 2, top 1.1, legs of different length: one pair of parallel sides only.
  trapezoid: [[0, 0], [2, 0], [1.4, 1], [0.3, 1]],
}

/** The four corners in order, rotated by `rot` degrees and fitted in the 100-unit box (uniform scale: lengths keep their ratios). */
export function quadGeometry(kind: QuadKind, rot: number): Pt[] {
  return fit(QUADS[kind].map(q => turn(q, rot)), 78)
}

function MathQuad(p: ArtProps) {
  const kind = typeof p.kind === 'string' && p.kind in QUADS ? (p.kind as QuadKind) : 'square'
  return (
    <svg className="g4a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon className="g4a-shape" points={pts(quadGeometry(kind, num(p.rot, 0)))} />
    </svg>
  )
}

export const MATH_G4_ART = {
  [MATH_ART_4.fraction]: MathFraction,
  [MATH_ART_4.strips]: MathStrips,
  [MATH_ART_4.lines]: MathLines,
  [MATH_ART_4.polygon]: MathPolygon,
  [MATH_ART_4.quad]: MathQuad,
}

/** Registers the grade 4 drawings with the shared art registry; call once when the island loads (index.ts). */
export const registerMathArt4 = () => registerArt(MATH_G4_ART)
