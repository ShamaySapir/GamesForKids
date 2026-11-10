import type { CSSProperties, ReactNode } from 'react'
import { registerArt, type ArtProps } from '../../ui/pick/art'
import { BoardView } from './board'
import type { Cell } from './types'

// Drawings for the coding island's pick questions (registered by name; props are flat strings and numbers).
// Spec: docs/specs/coding.md. All colors are theme tokens.

const str = (v: ArtProps[string] | undefined) => (typeof v === 'string' ? v : '')
const list = (v: ArtProps[string] | undefined) => str(v).split('|').filter(Boolean)

const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }
const chip: CSSProperties = {
  display: 'inline-grid', placeItems: 'center', minWidth: 34, height: 34, padding: '0 6px', borderRadius: 10,
  background: 'var(--card)', border: '2px solid var(--code)', color: 'var(--ink)', fontWeight: 800, fontSize: 20, lineHeight: 1,
}

/** A board, with the program's arrows under it (first move on the left, like the board) and/or one marked square. */
function CodeBoard(p: ArtProps) {
  const rows = list(p.rows)
  const mark = str(p.mark).split(',').map(Number)
  const marks: Cell[] = mark.length === 2 && mark.every(Number.isFinite) ? [[mark[0]!, mark[1]!]] : []
  const program = [...str(p.program)]
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
      <BoardView board={{ id: 'art', rows }} size={Math.max(p.size, 120)} marks={marks} plain={p.plain === true} />
      {program.length > 0 && (
        <div style={{ ...row, direction: 'ltr' }} aria-hidden="true">
          {program.map((a, i) => <span key={i} style={chip}>{a}</span>)}
        </div>
      )}
    </div>
  )
}

const emojiSize = (size: number) => Math.max(28, Math.min(52, size / 2))

/** Story steps as emoji, first step on the right (RTL); the step at `gap` is a '?' slot. */
function CodeSteps(p: ArtProps) {
  const steps = list(p.steps)
  const gap = typeof p.gap === 'number' ? p.gap : -1
  const fs = emojiSize(p.size)
  return (
    <div style={{ ...row, direction: 'rtl', gap: 10 }} aria-hidden="true">
      {steps.map((e, i) => i === gap
        ? <span key={i} className="pk-art-slot" style={{ width: fs * 1.6, height: fs * 1.6, fontSize: fs }}>?</span>
        : <span key={i} style={{ fontSize: fs, lineHeight: 1.2 }}>{e}</span>)}
    </div>
  )
}

const repeated = (unit: string[], times: number) => Array.from({ length: times }, () => unit).flat()

/** A dance: the unit's moves written out `times` times in a row (first move on the right). */
function CodeDance(p: ArtProps) {
  const moves = repeated(list(p.unit), typeof p.times === 'number' ? p.times : 1)
  const fs = emojiSize(p.size)
  return (
    <div style={{ ...row, direction: 'rtl', gap: 4, maxWidth: '100%' }} aria-hidden="true">
      {moves.map((e, i) => <span key={i} style={{ fontSize: fs * 0.8, lineHeight: 1.2 }}>{e}</span>)}
    </div>
  )
}

/** A "repeat ×N" card holding the unit. */
function CodeLoop(p: ArtProps) {
  const unit = list(p.unit)
  const fs = emojiSize(p.size)
  const frame: CSSProperties = {
    display: 'grid', justifyItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 16,
    background: 'var(--card)', border: '3px solid var(--code)',
  }
  const head: ReactNode = (
    <span style={{ color: 'var(--code)', fontWeight: 800, fontSize: 22, direction: 'ltr' }}>↻ ×{typeof p.times === 'number' ? p.times : '?'}</span>
  )
  return (
    <div style={frame} aria-hidden="true">
      {head}
      <div style={{ ...row, direction: 'rtl', gap: 4, borderTop: '2px dashed var(--line)', paddingTop: 6 }}>
        {unit.map((e, i) => <span key={i} style={{ fontSize: fs * 0.8, lineHeight: 1.2 }}>{e}</span>)}
      </div>
    </div>
  )
}

export const CODING_ART = { 'code-board': CodeBoard, 'code-steps': CodeSteps, 'code-dance': CodeDance, 'code-loop': CodeLoop }

export const registerCodingArt = () => registerArt(CODING_ART)
