import { registerArt, type ArtProps } from '../../ui/pick/art'
import { MATH_ART } from './types'
import './math-g3-art.css'

// Grade 3 drawings (angles, triangles, a rounding line) for PickGame questions. Spec: docs/specs/math-grade3.md § 27.
// Each draws in a 100-unit box scaled to props.size; colors come from math-g3-art.css. Drawings are aria-hidden (PickGame labels them).

const num = (v: ArtProps[string] | undefined, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rad = (deg: number) => (deg * Math.PI) / 180
const r1 = (v: number) => Math.round(v * 100) / 100

type Pt = readonly [number, number]

/* ---------- angle ---------- */

const HALF = 44 // arm length for armA/armB = 1 (half the 100-unit box minus the stroke)

export interface AngleGeometry {
  vertex: Pt
  a: Pt
  b: Pt
  arc: string
  corner: string
}

/** Screen geometry (y down) of two arms from a vertex; arm A points `rot` degrees counter-clockwise from the right. */
export function angleGeometry(deg: number, rot: number, armA: number, armB: number): AngleGeometry {
  const d = clamp(deg, 0, 180)
  const lenA = HALF * clamp(armA, 0.35, 1)
  const lenB = HALF * clamp(armB, 0.35, 1)
  const dirA: Pt = [Math.cos(rad(rot)), -Math.sin(rad(rot))]
  const dirB: Pt = [Math.cos(rad(rot + d)), -Math.sin(rad(rot + d))]
  const ends: Pt[] = [[0, 0], [dirA[0] * lenA, dirA[1] * lenA], [dirB[0] * lenB, dirB[1] * lenB]]
  // Centre the drawing: every point stays within one arm length of the vertex, so the box is never left.
  const xs = ends.map(p => p[0])
  const ys = ends.map(p => p[1])
  const cx = 50 - (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = 50 - (Math.min(...ys) + Math.max(...ys)) / 2
  const at = (p: Pt): Pt => [r1(p[0] + cx), r1(p[1] + cy)]
  const vertex = at([0, 0])
  const rArc = Math.max(9, Math.min(lenA, lenB) * 0.45)
  const arcStart = at([dirA[0] * rArc, dirA[1] * rArc])
  const arcEnd = at([dirB[0] * rArc, dirB[1] * rArc])
  const arc = d < 1 ? '' : `M${arcStart[0]} ${arcStart[1]} A${r1(rArc)} ${r1(rArc)} 0 0 0 ${arcEnd[0]} ${arcEnd[1]}`
  // The right-angle corner sits on arm A, on the side the other arm opens to.
  const c = Math.min(lenA, lenB) * 0.4
  const perp: Pt = [Math.cos(rad(rot + 90)), -Math.sin(rad(rot + 90))]
  const p1 = at([dirA[0] * c, dirA[1] * c])
  const p2 = at([dirA[0] * c + perp[0] * c, dirA[1] * c + perp[1] * c])
  const p3 = at([perp[0] * c, perp[1] * c])
  return { vertex, a: at(ends[1]!), b: at(ends[2]!), arc, corner: `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} L${p3[0]} ${p3[1]}` }
}

function MathAngle(p: ArtProps) {
  const g = angleGeometry(num(p.deg, 90), num(p.rot, 0), num(p.armA, 1), num(p.armB, 1))
  return (
    <svg className="g3a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      {p.corner === true && <path className="g3a-corner" d={g.corner} />}
      <line className="g3a-arm" x1={g.vertex[0]} y1={g.vertex[1]} x2={g.a[0]} y2={g.a[1]} />
      <line className="g3a-arm" x1={g.vertex[0]} y1={g.vertex[1]} x2={g.b[0]} y2={g.b[1]} />
      {g.arc && <path className="g3a-arc" d={g.arc} />}
      <circle className="g3a-dot" cx={g.vertex[0]} cy={g.vertex[1]} r={3.5} />
    </svg>
  )
}

/* ---------- triangle ---------- */

const MARGIN = 10
const EQUAL_TOLERANCE = 0.5 // degrees

export interface TriangleGeometry {
  /** Vertices in the 100-unit box: base left, base right, third. */
  points: readonly [Pt, Pt, Pt]
  /** Tick count per side: base, right side, left side. Equal sides carry one tick each. */
  ticks: readonly [number, number, number]
}

export function triangleGeometry(a: number, b: number, rot: number): TriangleGeometry {
  const A = clamp(a, 1, 177)
  const B = clamp(b, 1, 178 - A)
  const C = 180 - A - B
  const left = Math.sin(rad(B)) / Math.sin(rad(C)) // side from the left base vertex to the third one (base = 1)
  const raw: Pt[] = [[0, 0], [1, 0], [left * Math.cos(rad(A)), left * Math.sin(rad(A))]]
  const cos = Math.cos(rad(rot))
  const sin = Math.sin(rad(rot))
  const turned = raw.map((p): Pt => [p[0] * cos - p[1] * sin, p[0] * sin + p[1] * cos])
  const xs = turned.map(p => p[0])
  const ys = turned.map(p => p[1])
  const w = Math.max(...xs) - Math.min(...xs)
  const h = Math.max(...ys) - Math.min(...ys)
  const k = (100 - 2 * MARGIN) / Math.max(w, h, 1e-6)
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2
  const my = (Math.min(...ys) + Math.max(...ys)) / 2
  // y is flipped for the screen.
  const to = (p: Pt): Pt => [r1(50 + (p[0] - mx) * k), r1(50 - (p[1] - my) * k)]
  const points = turned.map(to) as unknown as [Pt, Pt, Pt]
  // A side is opposite the angle at the other vertex: base ↔ C, right side ↔ A, left side ↔ B.
  const same = (x: number, y: number) => Math.abs(x - y) <= EQUAL_TOLERANCE
  const baseRight = same(C, A)
  const baseLeft = same(C, B)
  const sides = same(A, B)
  return { points, ticks: [baseRight || baseLeft ? 1 : 0, baseRight || sides ? 1 : 0, baseLeft || sides ? 1 : 0] }
}

function MathTriangle(p: ArtProps) {
  const g = triangleGeometry(num(p.a, 60), num(p.b, 60), num(p.rot, 0))
  const [P0, P1, P2] = g.points
  const sides: readonly (readonly [Pt, Pt])[] = [[P0, P1], [P1, P2], [P2, P0]]
  return (
    <svg className="g3a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon className="g3a-tri" points={g.points.map(q => q.join(',')).join(' ')} />
      {p.ticks === true && sides.map(([s, e], i) => {
        if (!g.ticks[i]) return null
        const dx = e[0] - s[0]
        const dy = e[1] - s[1]
        const len = Math.hypot(dx, dy) || 1
        const mx = (s[0] + e[0]) / 2
        const my = (s[1] + e[1]) / 2
        const nx = (-dy / len) * 5
        const ny = (dx / len) * 5
        return <line key={i} className="g3a-tick" x1={r1(mx - nx)} y1={r1(my - ny)} x2={r1(mx + nx)} y2={r1(my + ny)} />
      })}
    </svg>
  )
}

/* ---------- rounding line ---------- */

const LX0 = 20
const LX1 = 140

function MathRound(p: ArtProps) {
  const from = num(p.from, 0)
  const to = num(p.to, from + 10)
  const n = num(p.n, from)
  const span = to - from || 1
  const x = (v: number) => r1(LX0 + clamp((v - from) / span, 0, 1) * (LX1 - LX0))
  const mid = x(from + span / 2)
  return (
    <svg className="g3a-art" width={p.size * 2.2} height={p.size * 0.88} viewBox="0 0 160 64" aria-hidden="true" style={{ direction: 'ltr' }}>
      <line className="g3a-line" x1={LX0} y1={38} x2={LX1} y2={38} />
      <line className="g3a-line" x1={LX0} y1={30} x2={LX0} y2={46} />
      <line className="g3a-line" x1={LX1} y1={30} x2={LX1} y2={46} />
      <line className="g3a-mid" x1={mid} y1={26} x2={mid} y2={50} />
      <text className="g3a-label" x={LX0} y={60} fontSize={14}>{from}</text>
      <text className="g3a-label" x={LX1} y={60} fontSize={14}>{to}</text>
      <circle className="g3a-mark" cx={x(n)} cy={38} r={6} />
      <text className="g3a-label-n" x={x(n)} y={20} fontSize={16}>{n}</text>
    </svg>
  )
}

export const MATH_G3_ART = { [MATH_ART.angle]: MathAngle, [MATH_ART.triangle]: MathTriangle, [MATH_ART.round]: MathRound }

/** Registers the grade 3 drawings with the shared art registry; call once when the island loads (index.ts). */
export const registerMathArt = () => registerArt(MATH_G3_ART)
