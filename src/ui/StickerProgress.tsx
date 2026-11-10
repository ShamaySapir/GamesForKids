import { MASTERY_ACCURACY, MASTERY_ROUNDS, type RoundResult } from '../core/adaptive/adaptive'
import './sticker.css'

/** Rounds that count toward mastery (DECISIONS D7), capped at the number needed. */
export const goodRounds = (rounds: readonly RoundResult[] = []) =>
  Math.min(MASTERY_ROUNDS, rounds.filter(r => r.total > 0 && r.firstTry / r.total >= MASTERY_ACCURACY).length)

interface Props {
  sticker: string
  /** Good rounds so far, 0..MASTERY_ROUNDS; the sticker fills in from the bottom as they add up. */
  good: number
  size?: number
  /** Bounce once, to point a child at the game that unlocks the one they tapped. */
  pulse?: boolean
}

/**
 * The sticker a skill earns, grey until earned, colored in part by part inside a ring that fills with the island's color
 * (`--c`) — a progress bar a pre-reader understands.
 */
export function StickerProgress({ sticker, good, size = 44, pulse = false }: Props) {
  const fill = Math.min(1, good / MASTERY_ROUNDS)
  return (
    <span className={`sticker-progress${pulse ? ' pulse' : ''}${fill === 1 ? ' full' : ''}`}
      style={{ fontSize: size, ['--fill' as string]: `${fill * 100}%` }} role="img" aria-label={`${sticker} ${good} / ${MASTERY_ROUNDS}`}>
      <span className="sp-face">
        <span className="sp-base" aria-hidden="true">{sticker}</span>
        <span className="sp-fill" aria-hidden="true" style={{ clipPath: `inset(${(1 - fill) * 100}% 0 0 0)` }}>{sticker}</span>
      </span>
    </span>
  )
}
