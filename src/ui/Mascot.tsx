import { useState } from 'react'
import { phrases, say } from '../core/audio/audio'
import type { PhraseRef } from '../core/engine/types'
import './mascot.css'

export type Mood = 'idle' | 'talking' | 'happy' | 'thinking' | 'encouraging'

interface Props {
  mood?: Mood
  /** Phrase ID shown in the speech bubble and spoken on click. */
  line?: string
  /** Bubble text, when not taken from `line`. */
  text?: string
  /** What to speak on click, when not `line`. */
  speak?: PhraseRef
  size?: number
}

/** Shufi the owl. Clicking replays what it said. */
export function Mascot({ mood = 'idle', line, text = line && phrases[line], speak = line, size = 120 }: Props) {
  const [talking, setTalking] = useState(false)
  const shown: Mood = talking ? 'talking' : mood

  const onClick = async () => {
    if (!speak) return
    setTalking(true)
    await say(speak)
    setTalking(false)
  }

  return (
    <div className={`mascot mood-${shown}`}>
      <button className="mascot-owl" onClick={onClick} aria-label={text ?? 'ינשוף'} disabled={!speak} style={{ width: size }}>
        <Owl mood={shown} />
      </button>
      {text && <p className="bubble" aria-live="polite">{text}</p>}
    </div>
  )
}

function Owl({ mood }: { mood: Mood }) {
  const happy = mood === 'happy' || mood === 'encouraging'
  const eye = (cx: number) =>
    happy ? <path d={`M${cx - 11} 58 q11 -12 22 0`} stroke="var(--ink)" strokeWidth="5" fill="none" strokeLinecap="round" />
      : <>
        <circle cx={cx} cy="58" r="16" fill="#fff" />
        <circle cx={cx + (mood === 'thinking' ? 5 : 0)} cy={mood === 'thinking' ? 52 : 60} r="8" fill="#1f2a5c" />
      </>
  return (
    <svg viewBox="0 0 120 130" role="img" aria-hidden="true">
      <path d="M22 30 L32 8 L46 26 Z M98 30 L88 8 L74 26 Z" fill="var(--owl)" />
      <ellipse cx="60" cy="72" rx="46" ry="52" fill="var(--owl)" />
      <ellipse cx="60" cy="88" rx="30" ry="32" fill="var(--owl-belly)" />
      <path d="M48 92 q4 -5 8 0 M64 92 q4 -5 8 0 M56 104 q4 -5 8 0" stroke="var(--owl)" strokeWidth="2.5" fill="none" />
      <circle cx="40" cy="58" r="20" fill="var(--owl-belly)" />
      <circle cx="80" cy="58" r="20" fill="var(--owl-belly)" />
      {eye(40)}
      {eye(80)}
      {mood === 'talking'
        ? <ellipse className="beak-talk" cx="60" cy="76" rx="7" ry="8" fill="#ff9f1c" />
        : <path d="M53 70 L67 70 L60 82 Z" fill="#ff9f1c" />}
      <path className="wing wing-r" d="M16 70 q-8 26 10 42 q4 -24 -10 -42 Z" fill="var(--owl)" stroke="var(--ink)" strokeOpacity=".15" />
      <path className="wing wing-l" d="M104 70 q8 26 -10 42 q-4 -24 10 -42 Z" fill="var(--owl)" stroke="var(--ink)" strokeOpacity=".15" />
      <path d="M46 122 l-4 6 M52 122 v7 M68 122 v7 M74 122 l4 6" stroke="#ff9f1c" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
