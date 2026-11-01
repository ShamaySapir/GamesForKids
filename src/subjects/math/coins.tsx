// Original, generic coin drawings (not the Bank of Israel designs): a rim, an inner ring and the value.
// Sizes and tones differ so a child can tell coins apart at a glance; colors come from math-coins.css.

export type CoinValue = 1 | 2 | 5 | 10

/** Rendered diameter in px: grows with value so the coins are clearly different sizes. */
export const COIN_SIZE: Record<CoinValue, number> = { 1: 72, 2: 84, 5: 96, 10: 108 }

const TONE: Record<CoinValue, string> = { 1: 'mc-silver', 2: 'mc-steel', 5: 'mc-pewter', 10: 'mc-gold' }

export function Coin({ value, size = COIN_SIZE[value] }: { value: CoinValue; size?: number }) {
  const tone = TONE[value]
  const gold = value === 10
  return (
    <svg className={`mc-coin ${tone}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className="mc-rim" cx="50" cy="50" r="47" />
      <circle className="mc-ring" cx="50" cy="50" r={gold ? 31 : 38} />
      {value === 2 && <path className="mc-shine" d="M22 40 A31 31 0 0 1 40 22" />}
      <text className="mc-num" x="50" y={gold ? 56 : 58} textAnchor="middle" fontSize={gold ? 34 : 40}>{value}</text>
      <text className="mc-sym" x="50" y={gold ? 76 : 78} textAnchor="middle" fontSize="20">₪</text>
    </svg>
  )
}
