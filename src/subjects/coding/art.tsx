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
  // Numbered arrows after Shufi (first on the left, like the board): "he walks these, one step each".
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
      {/* Bigger than other art: a child has to count squares (the prompt board most of all). */}
      <BoardView board={{ id: 'art', rows }} size={program.length > 0 ? 220 : Math.max(p.size, 150)} marks={marks} plain={p.plain === true} />
      {program.length > 0 && (
        <div style={{ ...row, direction: 'ltr' }} aria-hidden="true">
          <span style={{ fontSize: 26 }}>🦉</span>
          {program.map((a, i) => (
            <span key={i} style={{ ...chip, position: 'relative' }}>
              <span style={num}>{i + 1}</span>{a}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const num: CSSProperties = {
  position: 'absolute', insetBlockStart: -9, insetInlineStart: -7, minWidth: 18, height: 18, borderRadius: 9, padding: '0 3px',
  background: 'var(--code)', color: 'var(--on-accent)', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center',
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

/** "חֲזֹר 3 פְּעָמִים" in words a child hears, not "×3" (2 is פַּעֲמַיִם). */
const timesText = (n: number) => (n === 2 ? 'חֲזֹר פַּעֲמַיִם' : `חֲזֹר ${n} פְּעָמִים`)

/**
 * A dance: the unit's moves written out `times` times (first move on the right), each repetition in its own frame,
 * so a child sees "the same steps again" — what a loop is — before choosing the card that does it.
 */
function CodeDance(p: ArtProps) {
  const unit = list(p.unit)
  const times = typeof p.times === 'number' ? p.times : 1
  const fs = emojiSize(p.size)
  const frame: CSSProperties = { ...row, gap: 2, padding: '4px 8px', borderRadius: 14, border: '2px dashed var(--code)' }
  return (
    <div style={{ ...row, direction: 'rtl', gap: 8, maxWidth: '100%' }} aria-hidden="true">
      {Array.from({ length: times }, (_, k) => (
        <span key={k} style={frame}>{unit.map((e, i) => <span key={i} style={{ fontSize: fs * 0.7, lineHeight: 1.2 }}>{e}</span>)}</span>
      ))}
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
    <span style={{ color: 'var(--code)', fontWeight: 800, fontSize: 20 }}>🔁 {timesText(typeof p.times === 'number' ? p.times : 0)}</span>
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
