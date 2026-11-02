import type { ReactNode } from 'react'
import { POSITIONS, type Position } from './catalog'
import { Frame, Placed, Scope, type BBox, type Entry, type Opts } from './common'

type Ent = Entry & { bb: BBox }

/** Where `a` fits under `b` (the space between its legs), in b's own 100 box: [x0, y0, x1, y1]. */
const CAVITY: Record<string, BBox> = { table: [27, 47, 73, 90], chair: [33, 57, 65, 90], bed: [24, 68, 80, 88] }
/** Containers `a` sits in: the y (in b's box) of the top edge hiding a's lower part, and a part to drop (the lid). */
const CONTAINER: Record<string, { rim: number; open?: string }> = { box: { rim: 40, open: 'lid' }, cup: { rim: 30 } }
/** Openings `a` stands inside, drawn in front of b: [x0, y0, x1, y1] in b's box. */
const OPENING: Record<string, BBox> = { tent: [34, 58, 66, 90], house: [26, 56, 74, 92] }

const DEFAULT_BB: BBox = [6, 6, 94, 94]
const GROUND = 95
const isPosition = (v: unknown): v is Position => POSITIONS.includes(v as Position)

/** Draws `a` relative to `b`; both are looked up in `all` by catalog name. */
export function sceneDraw(all: Record<string, Entry>, a: string, b: string, rel: Position): ReactNode {
  const get = (n: string): Ent => ({ draw: all[n]?.draw ?? (() => null), bb: all[n]?.bb ?? DEFAULT_BB })
  const A = get(a)
  const Bo = get(b)
  const aw = A.bb[2] - A.bb[0]
  const ah = A.bb[3] - A.bb[1]
  const bw = Bo.bb[2] - Bo.bb[0]
  const bh = Bo.bb[3] - Bo.bb[1]
  const at = (e: Ent, s: number, cx: number, bottom: number, missing?: string) => (
    <Scope missing={missing}><Placed draw={e.draw} bb={e.bb} s={s} cx={cx} bottom={bottom} /></Scope>
  )
  /** b drawn at scale s standing on the ground: maps a y or x in b's box to the scene. */
  const mapB = (s: number) => ({
    x: (x: number) => 50 + s * (x - (Bo.bb[0] + Bo.bb[2]) / 2),
    y: (y: number) => GROUND - s * (Bo.bb[3] - y),
  })

  /** b on the left, a to its right overlapping `ov` of a's own width; the pair is centred and scaled to fit. */
  const overlapping = (sb0: number, sa0: number, ov: number) => {
    const k = Math.min(1, 92 / (sb0 * bw + (1 - ov) * sa0 * aw))
    const [sb, sa] = [sb0 * k, sa0 * k]
    const [wb, wa] = [sb * bw, sa * aw]
    const left = 50 - (wb + (1 - ov) * wa) / 2
    return { sb, sa, bCx: left + wb / 2, aCx: left + wb - ov * wa + wa / 2 }
  }

  switch (rel) {
    case 'on': {
      const sb = Math.min(0.8, 56 / bh)
      const bTop = GROUND - sb * bh
      const sa = Math.min(0.42, (bTop - 4) / ah, 52 / aw)
      return <>{at(Bo, sb, 50, GROUND)}{at(A, sa, 50, bTop + 1.5)}</>
    }
    case 'above': {
      const sb = 0.55
      const bTop = GROUND - sb * bh
      const aBottom = Math.max(bTop - 22, 32)
      const sa = Math.min(0.42, (aBottom - 3) / ah)
      return <>{at(Bo, sb, 50, GROUND)}{at(A, sa, 50, aBottom)}</>
    }
    case 'under': {
      const cav = CAVITY[b]
      if (cav) {
        const sb = Math.min(0.9, 80 / bw)
        const m = mapB(sb)
        const sa = Math.min((0.85 * sb * (cav[2] - cav[0])) / aw, (0.85 * sb * (cav[3] - cav[1])) / ah)
        return <>{at(A, sa, m.x((cav[0] + cav[2]) / 2), m.y(cav[3]) - 1)}{at(Bo, sb, 50, GROUND)}</>
      }
      return <>{at(Bo, 0.5, 50, 50)}{at(A, Math.min(0.42, 40 / ah), 50, GROUND)}</>
    }
    case 'in': {
      const cont = CONTAINER[b]
      const sb = Math.min(0.8, 70 / bw)
      const m = mapB(sb)
      if (cont) {
        const rimY = m.y(cont.rim)
        const sa = Math.min(0.5, (rimY + 0.4 * 0.5 * ah - 3) / ah)
        return <>{at(A, sa, 50, rimY + 0.4 * sa * ah)}{at(Bo, sb, 50, GROUND, cont.open)}</>
      }
      const op = OPENING[b]
      if (op) {
        const sa = Math.min((0.85 * sb * (op[2] - op[0])) / aw, (0.85 * sb * (op[3] - op[1])) / ah)
        return <>{at(Bo, sb, 50, GROUND)}{at(A, sa, m.x((op[0] + op[2]) / 2), m.y(op[3]) - 1)}</>
      }
      return <>{at(Bo, sb, 50, GROUND)}{at(A, 0.3, 50, GROUND - 8)}</>
    }
    case 'next-to': {
      const gap = 10
      const k = Math.min(1, 92 / (0.7 * bw + 0.5 * aw + gap))
      const [sb, sa] = [0.7 * k, 0.5 * k]
      const [wb, wa] = [sb * bw, sa * aw]
      const left = 50 - (wb + gap + wa) / 2
      return <>{at(Bo, sb, left + wb / 2, GROUND)}{at(A, sa, left + wb + gap + wa / 2, GROUND)}</>
    }
    case 'between': {
      const gap = 6
      const k = Math.min(1, 94 / (2 * 0.6 * bw + 0.5 * aw + 2 * gap))
      const [sb, sa] = [0.6 * k, 0.5 * k]
      const [wb, wa] = [sb * bw, sa * aw]
      const left = 50 - (2 * wb + wa + 2 * gap) / 2
      return <>{at(Bo, sb, left + wb / 2, GROUND)}{at(A, sa, 50, GROUND)}{at(Bo, sb, left + wb + gap + wa + gap + wb / 2, GROUND)}</>
    }
    case 'in-front': {
      const { sb, sa, bCx, aCx } = overlapping(0.6, 0.66, 0.45)
      return <>{at(Bo, sb, bCx, 76)}{at(A, sa, aCx, GROUND)}</>
    }
    case 'behind': {
      const { sb, sa, bCx, aCx } = overlapping(0.72, 0.6, 0.5)
      return <>{at(A, sa, aCx, 82)}{at(Bo, sb, bCx, GROUND)}</>
    }
  }
}

export function makeScene(all: () => Record<string, Entry>) {
  return function Scene(p: Record<string, string | number | boolean> & { size: number }) {
    const rel = isPosition(p.rel) ? p.rel : 'next-to'
    const o: Opts = { facing: 'right', silhouette: p.silhouette === true, scale: typeof p.scale === 'number' ? p.scale : 1 }
    return <Frame size={p.size} o={o}>{sceneDraw(all(), String(p.a), String(p.b), rel)}</Frame>
  }
}
