import { registerArt, type ArtProps } from '../../ui/pick/art'
import { MATH_ART_5, type SolidKind } from './types'
import './math-g5-art.css'

// Grade 5 drawings (solids, nets, heights, frequency tables, rectangles of n, decimal house) for PickGame questions.
// Spec: docs/specs/math-grade5.md. Drawings use a 100-unit box scaled to props.size; colors come from math-g5-art.css.

const num = (v: ArtProps[string] | undefined, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const str = (v: ArtProps[string] | undefined, fallback = '') => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback)
const rad = (deg: number) => (deg * Math.PI) / 180
const r2 = (v: number) => Math.round(v * 100) / 100

export type Pt = readonly [number, number]
type V3 = readonly [number, number, number]

const turn = (p: Pt, deg: number): Pt => {
  const c = Math.cos(rad(deg))
  const s = Math.sin(rad(deg))
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]
}

/** Centres the points in the 100-unit box and scales them (uniformly) so the largest side spans `span`. */
function fitter(points: readonly Pt[], span: number): (p: Pt) => Pt {
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const k = span / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-6)
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2
  const my = (Math.min(...ys) + Math.max(...ys)) / 2
  return p => [r2(50 + (p[0] - mx) * k), r2(50 + (p[1] - my) * k)]
}

const pts = (list: readonly Pt[]) => list.map(p => p.join(',')).join(' ')

/* ---------- solids ---------- */

interface SolidDef { verts: V3[]; faces: number[][] }

const box = (w: number, h: number, d: number): SolidDef => ({
  verts: [[0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0], [0, 0, d], [w, 0, d], [w, h, d], [0, h, d]],
  faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]],
})

/** A polygon in the x-y plane pushed back along z. */
function prismZ(poly: readonly Pt[], d: number): SolidDef {
  const n = poly.length
  return {
    verts: [...poly.map((p): V3 => [p[0], p[1], 0]), ...poly.map((p): V3 => [p[0], p[1], d])],
    faces: [poly.map((_, i) => i), poly.map((_, i) => n + i), ...poly.map((_, i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i])],
  }
}

/** A polygon on the floor (x-z plane) lifted up along y. */
function prismY(poly: readonly Pt[], h: number): SolidDef {
  const n = poly.length
  return {
    verts: [...poly.map((p): V3 => [p[0], 0, p[1]]), ...poly.map((p): V3 => [p[0], h, p[1]])],
    faces: [poly.map((_, i) => i), poly.map((_, i) => n + i), ...poly.map((_, i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i])],
  }
}

function pyramid(base: readonly Pt[], apex: V3): SolidDef {
  const n = base.length
  return {
    verts: [...base.map((p): V3 => [p[0], 0, p[1]]), apex],
    faces: [base.map((_, i) => i), ...base.map((_, i) => [i, (i + 1) % n, n])],
  }
}

const hexagon = (rx: number, rz: number): Pt[] => Array.from({ length: 6 }, (_, i): Pt => [rx * Math.cos(rad(60 * i)), rz * Math.sin(rad(60 * i))])

const SOLIDS: Record<SolidKind, SolidDef> = {
  cube: box(1, 1, 1),
  box: box(1.7, 1, 1.1),
  'tri-prism': prismZ([[0, 0], [1.3, 0], [0.65, 1.05]], 1.5),
  'square-pyramid': pyramid([[0, 0], [1.2, 0], [1.2, 1.2], [0, 1.2]], [0.6, 1.15, 0.6]),
  'tri-pyramid': pyramid([[0, 0], [1.3, 0], [0.65, 1.1]], [0.55, 1.2, 0.4]),
  'hex-prism': prismY(hexagon(0.65, 0.65), 1.2),
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

// Oblique view: depth (z) slides up and to the right, y is up. The direction toward the viewer is (K, K2, -1).
const K = 0.5
const K2 = 0.38

export interface SolidGeometry {
  /** Projected vertices, fitted in the 100-unit box (screen y down). */
  points: Pt[]
  /** Every edge once; hidden = none of its two faces faces the viewer. */
  edges: { a: number; b: number; hidden: boolean }[]
  faces: { ids: number[]; front: boolean; shade: number }[]
}

export function solidGeometry(kind: SolidKind, rot = 0): SolidGeometry {
  const def = SOLIDS[kind]
  const mean: V3 = [0, 1, 2].map(k => def.verts.reduce((s, v) => s + v[k]!, 0) / def.verts.length) as unknown as V3
  const c = Math.cos(rad(rot))
  const s = Math.sin(rad(rot))
  // Turn about the vertical axis through the middle, so the same solid can be shown from another side.
  const v3 = def.verts.map((v): V3 => {
    const x = v[0] - mean[0]
    const z = v[2] - mean[2]
    return [x * c + z * s, v[1] - mean[1], -x * s + z * c]
  })
  const toViewer: V3 = [K, K2, -1]
  const faces = def.faces.map(ids => {
    const a = v3[ids[0]!]!
    let n = cross(sub(v3[ids[1]!]!, a), sub(v3[ids[2]!]!, a))
    const centre = ids.reduce<V3>((m, i) => [m[0] + v3[i]![0] / ids.length, m[1] + v3[i]![1] / ids.length, m[2] + v3[i]![2] / ids.length], [0, 0, 0])
    if (dot(n, centre) < 0) n = [-n[0], -n[1], -n[2]] // the middle of the solid is the origin, so outward = away from it
    const len = Math.hypot(...n) || 1
    const d = dot(n, toViewer) / (len * Math.hypot(...toViewer))
    return { ids, front: d > 1e-6, shade: d }
  })
  const flat = v3.map((v): Pt => [v[0] + K * v[2], -(v[1] + K2 * v[2])])
  const fit = fitter(flat, 74)
  const edgeFaces = new Map<string, boolean>()
  for (const f of faces) {
    f.ids.forEach((id, i) => {
      const nx = f.ids[(i + 1) % f.ids.length]!
      const key = `${Math.min(id, nx)}-${Math.max(id, nx)}`
      edgeFaces.set(key, (edgeFaces.get(key) ?? false) || f.front)
    })
  }
  return {
    points: flat.map(fit),
    edges: Array.from(edgeFaces, ([key, visible]) => {
      const [a, b] = key.split('-').map(Number) as [number, number]
      return { a, b, hidden: !visible }
    }),
    faces,
  }
}

const isKind = (v: string): v is SolidKind => v in SOLIDS

function MathSolid(p: ArtProps) {
  const k = str(p.kind)
  const g = solidGeometry(isKind(k) ? k : 'cube', num(p.rot, 0))
  const line = (e: { a: number; b: number }, cls: string, i: number) => (
    <line key={i} className={cls} x1={g.points[e.a]![0]} y1={g.points[e.a]![1]} x2={g.points[e.b]![0]} y2={g.points[e.b]![1]} />
  )
  return (
    <svg className="g5a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      {g.faces.filter(f => f.front).map((f, i) => (
        <polygon key={i} className="g5a-face" style={{ fillOpacity: r2(0.14 + 0.3 * Math.min(1, Math.max(0, f.shade))) }} points={pts(f.ids.map(id => g.points[id]!))} />
      ))}
      {g.edges.filter(e => e.hidden).map((e, i) => line(e, 'g5a-hidden', i))}
      {g.edges.filter(e => !e.hidden).map((e, i) => line(e, 'g5a-edge', i))}
    </svg>
  )
}

/* ---------- nets ---------- */

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
const TH = Math.sqrt(3) / 2

/** A flap (triangle) on edge `e` of `base`, pointing away from its middle; `h` is its height. */
function flap(base: readonly Pt[], e: number, h: number): Pt[] {
  const a = base[e]!
  const b = base[(e + 1) % base.length]!
  const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const cx = base.reduce((s, q) => s + q[0], 0) / base.length
  const cy = base.reduce((s, q) => s + q[1], 0) / base.length
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  let nx = (b[1] - a[1]) / len
  let ny = -(b[0] - a[0]) / len
  if ((mid[0] - cx) * nx + (mid[1] - cy) * ny < 0) { nx = -nx; ny = -ny }
  return [a, b, [mid[0] + nx * h, mid[1] + ny * h]]
}

const hexAt = (cx: number, cy: number, s: number): Pt[] => Array.from({ length: 6 }, (_, i): Pt => [cx + s * Math.cos(rad(60 * i)), cy + s * Math.sin(rad(60 * i))])

const CUBE_NETS: readonly (readonly (readonly [number, number])[])[] = [
  [[1, 0], [1, 1], [1, 2], [1, 3], [0, 1], [2, 1]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [1, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]],
]

/**
 * The faces of a net, in the plane (units of the solid's edge). wrong 0 folds into the solid. The near-misses:
 *  - cube 1: a band of four with two faces on the same side: both fold onto the top, the bottom stays open.
 *  - cube 2: contains a 2×2 block: four squares around one corner, a cube corner has room for only three.
 *  - box 1: both extra faces above the band, so two lids fold onto the top and the bottom is missing.
 *  - box 2: the lid is too narrow (as wide as the depth), it cannot cover the opening.
 *  - triangular prism 1: both triangles on the same side of the band: two caps on one end, the other end is open.
 *  - triangular prism 2: one end is a square, not a triangle.
 *  - square pyramid 1: only three triangles (four faces, not five): the sides cannot close.
 *  - square pyramid 2: the top and bottom triangles are squat, their sloping edges are shorter than the neighbours' and cannot meet.
 *  - triangular pyramid 1: only two flaps around the base: three faces, not four.
 *  - triangular pyramid 2: one flap is taller than the others, its sloping edges are longer than the neighbours' and cannot meet.
 *  - hexagonal prism 1: both hexagons on the same end of the band, the other end is open.
 *  - hexagonal prism 2: the band has five rectangles, a hexagon has six sides, so it cannot close around.
 */
export function netPolygons(kind: SolidKind, wrong: 0 | 1 | 2): Pt[][] {
  switch (kind) {
    case 'cube':
      return CUBE_NETS[wrong]!.map(c => rect(c[0], c[1], 1, 1))
    case 'box': {
      const w = 1.6
      const d = 1
      const h = 1.2
      const band = [rect(0, 0, d, h), rect(d, 0, w, h), rect(d + w, 0, d, h), rect(2 * d + w, 0, w, h)]
      if (wrong === 1) return [...band, rect(d, -d, w, d), rect(2 * d + w, -d, w, d)]
      if (wrong === 2) return [...band, rect(d, -d, d, d), rect(d, h, w, d)]
      return [...band, rect(d, -d, w, d), rect(d, h, w, d)]
    }
    case 'tri-prism': {
      const len = 1.5
      const band = [rect(0, 0, 1, len), rect(1, 0, 1, len), rect(2, 0, 1, len)]
      const up = (i: number): Pt[] => [[i, 0], [i + 1, 0], [i + 0.5, -TH]]
      if (wrong === 1) return [...band, up(0), up(1)]
      if (wrong === 2) return [...band, up(1), rect(1, len, 1, 1)]
      return [...band, up(1), [[1, len], [2, len], [1.5, len + TH]]]
    }
    case 'square-pyramid': {
      const base = rect(0, 0, 1, 1)
      const hh = wrong === 2 ? 0.45 : 1.1
      const sides = [flap(base, 0, hh), flap(base, 2, hh), flap(base, 3, 1.1), flap(base, 1, 1.1)]
      return [base, ...(wrong === 1 ? sides.slice(0, 3) : sides)]
    }
    case 'tri-pyramid': {
      const base: Pt[] = [[0, 0], [1, 0], [0.5, TH]]
      const flaps = [flap(base, 0, TH), flap(base, 1, wrong === 2 ? 1.5 : TH), flap(base, 2, TH)]
      return [base, ...(wrong === 1 ? flaps.slice(0, 2) : flaps)]
    }
    case 'hex-prism': {
      const s = 0.6
      const h = 1.2
      const apo = s * TH
      const band = Array.from({ length: wrong === 2 ? 5 : 6 }, (_, i) => rect(i * s, 0, s, h))
      const top = hexAt(1.5 * s, -apo, s)
      if (wrong === 1) return [...band, top, hexAt(4.5 * s, -apo, s)]
      return [...band, top, hexAt((wrong === 2 ? 3.5 : 4.5) * s, h + apo, s)]
    }
  }
}

function MathNet(p: ArtProps) {
  const k = str(p.kind)
  const w = num(p.wrong, 0)
  const polys = netPolygons(isKind(k) ? k : 'cube', w === 1 ? 1 : w === 2 ? 2 : 0)
  const fit = fitter(polys.flat(), 88)
  return (
    <svg className="g5a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      {polys.map((poly, i) => <polygon key={i} className="g5a-net" points={pts(poly.map(fit))} />)}
    </svg>
  )
}

/* ---------- heights ---------- */

export type HeightShape = 'acute' | 'right' | 'obtuse' | 'parallelogram'
export type HeightSeg = 'height' | 'median' | 'slant'

// Base on the line y = 0 from (0,0) to (2,0); the apex is the vertex (or top corner) opposite it, above (y negative).
const HEIGHT_SHAPES: Record<HeightShape, { poly: readonly Pt[]; apex: number; slant: number }> = {
  acute: { poly: [[0, 0], [2, 0], [0.5, -1.4]], apex: 2, slant: 1.8 },
  right: { poly: [[0, 0], [2, 0], [0, -1.4]], apex: 2, slant: 1.7 },
  // The foot of the height falls on the extension of the base, left of it.
  obtuse: { poly: [[0, 0], [2, 0], [-0.7, -1.2]], apex: 2, slant: 0.4 },
  // The top corner is beyond the right end of the base, so its height lands outside the base as well.
  parallelogram: { poly: [[0, 0], [2, 0], [2.9, -1.3], [0.9, -1.3]], apex: 2, slant: 1.6 },
}

export interface HeightGeometry {
  poly: Pt[]
  base: [Pt, Pt]
  apex: Pt
  /** Where the dashed segment meets the base line. */
  foot: Pt
  /** The base's midpoint. */
  mid: Pt
  /** The dotted extension of the base to the foot (only when the foot falls outside the base). */
  ext: [Pt, Pt] | null
  /** The right-angle mark (three points), only on a true height. */
  mark: Pt[] | null
}

export function heightGeometry(shape: HeightShape, seg: HeightSeg, rot: number): HeightGeometry {
  const def = HEIGHT_SHAPES[shape]
  const apex = def.poly[def.apex]!
  const footX = seg === 'height' ? apex[0] : seg === 'median' ? 1 : def.slant
  const fit = fitter([...def.poly, [footX, 0] as Pt].map(q => turn(q, rot)), 74)
  const tr = (q: Pt) => fit(turn(q, rot))
  const foot = tr([footX, 0])
  const base: [Pt, Pt] = [tr([0, 0]), tr([2, 0])]
  const unit = (a: Pt, b: Pt, k: number): Pt => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [((b[0] - a[0]) / l) * k, ((b[1] - a[1]) / l) * k]
  }
  let mark: Pt[] | null = null
  if (seg === 'height') {
    const along = unit(foot, tr([1, 0]), 6.5) // along the base, toward its middle
    const up = unit(foot, tr(apex), 6.5)
    mark = [
      [foot[0] + along[0], foot[1] + along[1]],
      [foot[0] + along[0] + up[0], foot[1] + along[1] + up[1]],
      [foot[0] + up[0], foot[1] + up[1]],
    ].map((q): Pt => [r2(q[0]!), r2(q[1]!)])
  }
  const outside = footX < 0 || footX > 2
  return { poly: def.poly.map(tr), base, apex: tr(apex), foot, mid: tr([1, 0]), ext: outside ? [footX < 0 ? base[0] : base[1], foot] : null, mark }
}

function MathHeight(p: ArtProps) {
  const sh = str(p.shape)
  const shape: HeightShape = sh in HEIGHT_SHAPES ? (sh as HeightShape) : 'acute'
  const seg: HeightSeg = p.seg === 'median' || p.seg === 'slant' ? p.seg : 'height'
  const g = heightGeometry(shape, seg, num(p.rot, 0))
  return (
    <svg className="g5a-art" width={p.size} height={p.size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon className="g5a-shape" points={pts(g.poly)} />
      {g.ext && <line className="g5a-ext" x1={g.ext[0][0]} y1={g.ext[0][1]} x2={g.ext[1][0]} y2={g.ext[1][1]} />}
      <line className="g5a-base" x1={g.base[0][0]} y1={g.base[0][1]} x2={g.base[1][0]} y2={g.base[1][1]} />
      <line className="g5a-seg" x1={g.apex[0]} y1={g.apex[1]} x2={g.foot[0]} y2={g.foot[1]} />
      {g.mark && <polyline className="g5a-right" points={pts(g.mark)} />}
    </svg>
  )
}

/* ---------- frequency table ---------- */

export function parseRows(rows: string): { label: string; count: number }[] {
  return rows.split(',').map(r => r.trim()).filter(Boolean).map(r => {
    const i = r.lastIndexOf(':')
    return { label: i < 0 ? r : r.slice(0, i).trim(), count: i < 0 ? 0 : Math.max(0, Math.round(Number(r.slice(i + 1)) || 0)) }
  })
}

const FREQ_W = 200
const FREQ_ROW = 28
const FREQ_COUNT_W = 56

function MathFreq(p: ArtProps) {
  const rows = parseRows(str(p.rows))
  const H = rows.length * FREQ_ROW + 4
  return (
    <svg className="g5a-art" width={p.size} height={r2((p.size * H) / FREQ_W)} viewBox={`0 0 ${FREQ_W} ${H}`} aria-hidden="true">
      <rect className="g5a-table" x={2} y={2} width={FREQ_W - 4} height={rows.length * FREQ_ROW} rx={6} />
      <line className="g5a-rule" x1={FREQ_COUNT_W + 2} y1={2} x2={FREQ_COUNT_W + 2} y2={H - 2} />
      {rows.map((r, i) => (
        <g key={i}>
          {i > 0 && <line className="g5a-rule" x1={2} y1={2 + i * FREQ_ROW} x2={FREQ_W - 2} y2={2 + i * FREQ_ROW} />}
          <text className="g5a-label" x={FREQ_W - 10} y={2 + (i + 0.5) * FREQ_ROW}>{r.label}</text>
          <text className="g5a-count" x={2 + FREQ_COUNT_W / 2} y={2 + (i + 0.5) * FREQ_ROW}>{r.count}</text>
        </g>
      ))}
    </svg>
  )
}

/* ---------- rectangles of n ---------- */

/** Every a × b with a ≤ b and a · b = n. */
export function rectPairs(n: number): [number, number][] {
  const out: [number, number][] = []
  for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push([a, n / a])
  return out
}

export interface RectsLayout { width: number; height: number; items: { x: number; y: number; w: number; h: number }[] }

/** Grids in rows, wrapping so the picture stays near the shape of its box (one unit gap between grids). */
export function rectsLayout(n: number): RectsLayout {
  const pairs = rectPairs(n)
  const limit = Math.max(...pairs.map(q => q[1]), Math.ceil(Math.sqrt(n) * 2.2))
  const items: RectsLayout['items'] = []
  let x = 0
  let y = 0
  let rowH = 0
  let width = 0
  for (const [a, b] of pairs) {
    if (x > 0 && x + b > limit) { x = 0; y += rowH + 1; rowH = 0 }
    items.push({ x, y, w: b, h: a })
    x += b + 1
    rowH = Math.max(rowH, a)
    width = Math.max(width, x - 1)
  }
  return { width, height: y + rowH, items }
}

function MathRects(p: ArtProps) {
  const n = Math.max(1, Math.round(num(p.n, 12)))
  const L = rectsLayout(n)
  const pad = 0.6
  const W = L.width + 2 * pad
  const H = L.height + 2 * pad
  return (
    <svg className="g5a-art" width={p.size} height={r2((p.size * H) / W)} viewBox={`${-pad} ${-pad} ${W} ${H}`} aria-hidden="true">
      {L.items.map((it, i) => (
        <g key={i}>
          <rect className="g5a-grid" x={it.x} y={it.y} width={it.w} height={it.h} />
          {Array.from({ length: it.w - 1 }, (_, c) => <line key={`c${c}`} className="g5a-gline" x1={it.x + c + 1} y1={it.y} x2={it.x + c + 1} y2={it.y + it.h} />)}
          {Array.from({ length: it.h - 1 }, (_, r) => <line key={`r${r}`} className="g5a-gline" x1={it.x} y1={it.y + r + 1} x2={it.x + it.w} y2={it.y + r + 1} />)}
        </g>
      ))}
    </svg>
  )
}

/* ---------- decimal house ---------- */

const PLACE_NAMES: Record<number, string> = { 5: 'מ׳ אֲלָפִים', 4: 'ע׳ אֲלָפִים', 3: 'אֲלָפִים', 2: 'מֵאוֹת', 1: 'עֲשָׂרוֹת', 0: 'אֲחָדוֹת', [-1]: 'עֲשִׂירִיּוֹת', [-2]: 'מֵאִיּוֹת', [-3]: 'אַלְפִּיּוֹת', [-4]: 'ע׳ אַלְפִּיּוֹת' }

interface Parsed { int: string; frac: string; point: boolean }
const splitNum = (s: string): Parsed => {
  const [i = '', f = ''] = s.trim().split('.')
  return { int: i.replace(/\D/g, '') || '0', frac: f.replace(/\D/g, ''), point: s.includes('.') }
}

export interface HouseLayout {
  /** Exponents of the place columns, left to right (highest first). */
  places: number[]
  /** For each row, the digit in every column ('' when empty). */
  rows: string[][]
  /** True when a decimal point column is needed. */
  point: boolean
}

export function houseLayout(before: string, after: string): HouseLayout {
  const nums = [splitNum(before), splitNum(after)]
  const hi = Math.min(5, Math.max(0, ...nums.map(n => n.int.length - 1)))
  const lo = -Math.min(4, Math.max(0, ...nums.map(n => n.frac.length)))
  const places = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i)
  const digit = (n: Parsed, e: number) => (e >= 0 ? n.int[n.int.length - 1 - e] ?? '' : n.frac[-e - 1] ?? '')
  return { places, rows: nums.map(n => places.map(e => digit(n, e))), point: nums.some(n => n.point) }
}

const HC = 30 // column width
const HD = 10 // decimal point column
const HM = 18 // left margin (the arrow)
const HH = 24 // header height
const HR = 34 // row height
const HG = 30 // gap between the rows (the arrow)

function MathHouse(p: ArtProps) {
  const before = str(p.before, '0')
  const after = str(p.after, '0')
  const L = houseLayout(before, after)
  const hasPoint = L.point && L.places.includes(-1)
  const gapAt = hasPoint ? L.places.indexOf(-1) : -1 // the point column sits just before this column
  const colX = (i: number) => HM + i * HC + (gapAt >= 0 && i >= gapAt ? HD : 0)
  const W = HM + L.places.length * HC + (hasPoint ? HD : 0) + 2
  const y1 = HH
  const y2 = HH + HR + HG
  const H = y2 + HR + 2
  const pointX = hasPoint ? colX(gapAt) - HD / 2 : 0
  const withPoint = [splitNum(before).point, splitNum(after).point]
  return (
    <svg className="g5a-art g5a-house" width={p.size} height={r2((p.size * H) / W)} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {[y1, y2].map((y, r) => (
        <g key={r}>
          <rect className="g5a-table" x={HM} y={y} width={W - HM - 2} height={HR} />
          {L.places.map((e, i) => (
            <g key={e}>
              {i > 0 && <line className="g5a-rule" x1={colX(i)} y1={y} x2={colX(i)} y2={y + HR} />}
              <text className="g5a-digit" x={colX(i) + HC / 2} y={y + HR / 2}>{L.rows[r]![i]}</text>
            </g>
          ))}
          {hasPoint && withPoint[r] && <circle className="g5a-pt" cx={pointX} cy={y + HR / 2 + 8} r={2.6} />}
        </g>
      ))}
      {L.places.map((e, i) => <text key={e} className="g5a-place" x={colX(i) + HC / 2} y={HH / 2}>{PLACE_NAMES[e] ?? ''}</text>)}
      {hasPoint && <line className="g5a-ext" x1={pointX} y1={HH - 2} x2={pointX} y2={y2 + HR + 1} />}
      <path className="g5a-arrow" d={`M${HM / 2} ${y1 + HR + 3}V${y2 - 8}`} />
      <path className="g5a-arrowhead" d={`M${HM / 2 - 4.5} ${y2 - 9}L${HM / 2} ${y2 - 3}L${HM / 2 + 4.5} ${y2 - 9}Z`} />
    </svg>
  )
}

export const MATH_G5_ART = {
  [MATH_ART_5.solid]: MathSolid,
  [MATH_ART_5.net]: MathNet,
  [MATH_ART_5.height]: MathHeight,
  [MATH_ART_5.freq]: MathFreq,
  [MATH_ART_5.rects]: MathRects,
  [MATH_ART_5.house]: MathHouse,
}

/** Registers the grade 5 drawings with the shared art registry; call once when the island loads (index.ts). */
export const registerMathArt5 = () => registerArt(MATH_G5_ART)
