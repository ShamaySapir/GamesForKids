/**
 * Phrase IDs that say `n` (0–10,000) as numbers are counted, with "and" only before the last part:
 * 47 → [40, and-7] · 300 → [h3] · 307 → [h3, and-7] · 310 → [h3, and-10] · 315 → [h3, and-15] · 347 → [h3, 40, and-7] ·
 * 3,000 → [k3] · 3,300 → [k3, and-h3] · 3,347 → [k3, h3, 40, and-7] · 3,047 → [k3, 40, and-7] · 3,007 → [k3, and-7].
 * Until the blocks are recorded, `say` reads the whole number as one browser-voice sentence (D23).
 */
export function numberPhrase(n: number): string[] {
  if (!Number.isInteger(n) || n < 0 || n > 10000) throw new Error(`numberPhrase: ${n} is out of range 0–10,000`)
  if (n === 10000) return ['math.n.10000']
  if (n === 1000) return ['math.n.1000']
  if (n <= 100) return n < 20 || n % 10 === 0 ? [`math.n.${n}`] : [`math.n.${n - (n % 10)}`, `math.and.${n % 10}`]
  if (n > 1000) {
    const k = Math.floor(n / 1000)
    const head = k === 1 ? 'math.n.1000' : `math.k.${k}`
    const r = n % 1000
    if (r === 0) return [head]
    if (r % 100 === 0) return [head, `math.andh.${r / 100}`]
    return [head, ...(r < 100 ? lastTens(r) : numberPhrase(r))]
  }
  const h = `math.h.${Math.floor(n / 100)}`
  const r = n % 100
  return r === 0 ? [h] : [h, ...lastTens(r)]
}

/** 1–99 after a bigger part, with "and" before its last word. */
function lastTens(r: number): string[] {
  if (r < 10) return [`math.and.${r}`]
  if (r < 20) return [r === 10 ? 'math.andt.10' : `math.andteen.${r}`]
  if (r % 10 === 0) return [`math.andt.${r}`]
  return [`math.n.${r - (r % 10)}`, `math.and.${r % 10}`]
}

/** Phrase ID that says a price of `n` shekels (1–20), with correct masculine agreement. */
export function pricePhrase(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error(`pricePhrase: ${n} is out of range 1–20`)
  return `math.price.${n}`
}
