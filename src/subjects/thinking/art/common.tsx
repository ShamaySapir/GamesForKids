import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import type { ArtProps } from '../../../ui/pick/art'
import { COLORS, type Color } from './catalog'
import './art.css'

export const SHADOW = 'var(--art-shadow)'
export const LINE = 'var(--art-line)'
/** CSS variable of a palette entry, e.g. pal('red'). */
export const pal = (name: string) => `var(--art-${name})`
/** A darker variant of a fill, for wings, shading and similar. */
export const mix = (a: string, b: string, pct = 50) => `color-mix(in srgb, ${a} ${pct}%, ${b})`
export const shade = (fill: string, pct = 72) => `color-mix(in srgb, ${fill} ${pct}%, var(--art-dark))`

export interface Opts {
  color?: Color
  facing: 'left' | 'right'
  silhouette: boolean
  half?: 'left' | 'right'
  missing?: string
  only?: string
  scale: number
}

/** A drawing's body. Pure (no hooks) so the scene can call drawings directly. */
export type Draw = (o: Opts) => ReactNode
/** Rough content box [x0, y0, x1, y1] in the 100 box, used by the scene to place drawings. */
export type BBox = readonly [number, number, number, number]
export interface Entry { draw: Draw; bb?: BBox }

const Ctx = createContext<{ sil: boolean; missing?: string; only?: string }>({ sil: false })

/** Main fill: the requested palette color for colorable drawings, else the drawing's own default. */
export const tint = (o: Opts, def: string) => pal(o.color ?? def)

/* ---------- shapes ---------- */

interface Paint { f?: string; l?: false | string; w?: number }

interface Look { fill: string; stroke?: string; strokeWidth?: number; strokeLinejoin: 'round'; strokeLinecap: 'round' }

function usePaint({ f = 'none', l, w = 4 }: Paint): Look {
  const { sil } = useContext(Ctx)
  const stroke = l === false ? undefined : sil ? SHADOW : l ?? LINE
  return {
    fill: sil && f !== 'none' ? SHADOW : f,
    stroke,
    strokeWidth: stroke ? w : undefined,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  }
}

type Rest<T> = Omit<SVGProps<T>, 'fill' | 'stroke' | 'strokeWidth'>
export const Pa = ({ f, l, w, ...r }: Paint & Rest<SVGPathElement>) => <path {...r} {...usePaint({ f, l, w })} />
export const El = ({ f, l, w, ...r }: Paint & Rest<SVGEllipseElement>) => <ellipse {...r} {...usePaint({ f, l, w })} />
export const Ci = ({ f, l, w, ...r }: Paint & Rest<SVGCircleElement>) => <circle {...r} {...usePaint({ f, l, w })} />
export const Re = ({ f, l, w, ...r }: Paint & Rest<SVGRectElement>) => <rect {...r} {...usePaint({ f, l, w })} />

/** A thick curved line with an outline (tails, trunks, handles): a wide outline stroke under a narrower colored one. */
export function Tube({ d, f, w }: { d: string; f: string; w: number }) {
  return <><Pa d={d} l={LINE} w={w + 4} /><Pa d={d} l={f} w={w} /></>
}

/** Inner detail (eyes, spots, stripes): not part of the outline, so silhouettes leave it out. */
export function Dt({ children }: { children: ReactNode }) {
  return useContext(Ctx).sil ? null : <>{children}</>
}

/** Everything that is not a named part; hidden when only one part is shown. */
export function B({ children }: { children: ReactNode }) {
  return useContext(Ctx).only !== undefined ? null : <>{children}</>
}

/** A named part: left out with `missing`, drawn alone, enlarged and centred, with `only`. */
export function Part({ name, children }: { name: string; children: ReactNode }) {
  const { missing, only } = useContext(Ctx)
  if (missing === name) return null
  if (only !== undefined) return only === name ? <Fitted name={name}>{children}</Fitted> : null
  return <g data-part={name}>{children}</g>
}

function Fitted({ name, children }: { name: string; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null)
  const [t, setT] = useState<string>()
  useLayoutEffect(() => {
    const b = ref.current?.getBBox?.()
    if (!b || !b.width || !b.height) return
    const s = Math.min(3.5, 76 / b.width, 76 / b.height)
    setT(`translate(50 50) scale(${s.toFixed(3)}) translate(${(-b.x - b.width / 2).toFixed(2)} ${(-b.y - b.height / 2).toFixed(2)})`)
  }, [name])
  return <g transform={t}><g ref={ref} data-part={name}>{children}</g></g>
}

/** Overrides what the parts inside do (a scene draws a box without its lid). */
export function Scope({ missing, children }: { missing?: string; children: ReactNode }) {
  const c = useContext(Ctx)
  return <Ctx.Provider value={{ ...c, missing }}>{children}</Ctx.Provider>
}

const FLIP = 'translate(100 0) scale(-1 1)'

/** Draws its children and their mirror image across x = 50. */
export function Pair({ children }: { children: ReactNode }) {
  return <>{children}<g transform={FLIP}>{children}</g></>
}

/** Mirror transform about the vertical line x = cx (for a side-view head whose axis is not 50). */
export const around = (cx: number) => `translate(${2 * cx} 0) scale(-1 1)`

/**
 * Closed path that is exactly symmetric about x = 50: `start` and the last segment end sit on the axis;
 * `segs` describe the right-hand side top to bottom (2 numbers = line, 4 = quadratic, 6 = cubic).
 */
export function symD(start: readonly [number, number], segs: readonly (readonly number[])[]): string {
  const cmd = (s: readonly number[]) => (s.length === 2 ? 'L' : s.length === 4 ? 'Q' : 'C') + s.join(' ')
  const m = (x: number | undefined, y: number | undefined) => `${100 - (x ?? 0)} ${y ?? 0}`
  let from: readonly number[] = start
  const back = segs.map(s => {
    const p = from
    from = s.slice(-2)
    if (s.length === 2) return `L${m(p[0], p[1])}`
    if (s.length === 4) return `Q${m(s[0], s[1])} ${m(p[0], p[1])}`
    return `C${m(s[2], s[3])} ${m(s[0], s[1])} ${m(p[0], p[1])}`
  })
  return `M${start.join(' ')}${segs.map(cmd).join('')}${back.reverse().join('')}Z`
}

/** Point on a circle, for radial layouts (rays, petals). */
export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [+(cx + r * Math.cos(a)).toFixed(2), +(cy - r * Math.sin(a)).toFixed(2)]
}

/* ---------- frame ---------- */

const isColor = (v: unknown): v is Color => COLORS.includes(v as Color)

export function parseOpts(p: ArtProps): Opts {
  return {
    color: isColor(p.color) ? p.color : undefined,
    facing: p.facing === 'left' ? 'left' : 'right',
    silhouette: p.silhouette === true,
    half: p.half === 'left' || p.half === 'right' ? p.half : undefined,
    missing: typeof p.missing === 'string' ? p.missing : undefined,
    only: typeof p.only === 'string' ? p.only : undefined,
    scale: typeof p.scale === 'number' && p.scale > 0 && p.scale <= 1 ? p.scale : 1,
  }
}

export function Frame({ size, o, children }: { size: number; o: Opts; children: ReactNode }) {
  const clip = useId().replace(/:/g, '')
  const mirrored = o.facing === 'left' && o.only === undefined
  const s = o.scale
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-hidden="true" focusable="false">
      <Ctx.Provider value={{ sil: o.silhouette, missing: o.missing, only: o.only }}>
        {o.half && <defs><clipPath id={clip}><rect x={o.half === 'right' ? 50 : 0} y="0" width="50" height="100" /></clipPath></defs>}
        <g transform={s === 1 ? undefined : `translate(50 50) scale(${s}) translate(-50 -50)`}>
          <g clipPath={o.half ? `url(#${clip})` : undefined}>
            <g transform={mirrored ? FLIP : undefined}>{children}</g>
          </g>
        </g>
      </Ctx.Provider>
    </svg>
  )
}

export function makeArt(draw: Draw): ComponentType<ArtProps> {
  return function Art(p: ArtProps) {
    const o = parseOpts(p)
    return <Frame size={p.size} o={o}>{draw(o)}</Frame>
  }
}

/** Places a nested drawing inside a scene: scaled, with its bottom-centre at (cx, bottom). */
export function Placed({ draw, o, bb = [6, 6, 94, 94], s, cx, bottom }: {
  draw: Draw; o?: Partial<Opts>; bb?: BBox; s: number; cx: number; bottom: number
}) {
  const full: Opts = { facing: 'right', silhouette: false, scale: 1, ...o }
  const tx = cx - s * ((bb[0] + bb[2]) / 2)
  const ty = bottom - s * bb[3]
  return <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s})`}>{draw(full)}</g>
}
