import { say } from '../../core/audio/audio'
import type { PhraseRef } from '../../core/engine/types'
import './pick.css'

/** Small replay button. Always a separate control, so playing a sound never answers or selects. */
export function SayButton({ id, label = '🔊', className = '' }: { id: PhraseRef; label?: string; className?: string }) {
  return (
    <button type="button" className={`pk-say ${className}`} aria-label="🔊" onClick={() => void say(id)}>{label}</button>
  )
}
