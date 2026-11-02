/**
 * Phrase IDs that say `n` (0–1,000) as numbers are counted, with "and" only before the last part:
 * 47 → [40, and-7] · 300 → [h3] · 307 → [h3, and-7] · 310 → [h3, and-10] · 315 → [h3, and-15] · 347 → [h3, 40, and-7].
 */
export function numberPhrase(n: number): string[] {
  if (!Number.isInteger(n) || n < 0 || n > 1000) throw new Error(`numberPhrase: ${n} is out of range 0–1,000`)
  if (n === 1000) return ['math.n.1000']
  if (n <= 100) return n < 20 || n % 10 === 0 ? [`math.n.${n}`] : [`math.n.${n - (n % 10)}`, `math.and.${n % 10}`]
  const h = `math.h.${Math.floor(n / 100)}`
  const r = n % 100
  if (r === 0) return [h]
  if (r < 10) return [h, `math.and.${r}`]
  if (r < 20) return [h, r === 10 ? 'math.andt.10' : `math.andteen.${r}`]
  if (r % 10 === 0) return [h, `math.andt.${r}`]
  return [h, `math.n.${r - (r % 10)}`, `math.and.${r % 10}`]
}

/** Phrase ID that says a price of `n` shekels (1–20), with correct masculine agreement. */
export function pricePhrase(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error(`pricePhrase: ${n} is out of range 1–20`)
  return `math.price.${n}`
}
