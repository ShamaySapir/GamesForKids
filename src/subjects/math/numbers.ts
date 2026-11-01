/** Phrase IDs that say `n` (0–100): 7 → ['math.n.7'], 40 → ['math.n.40'], 47 → ['math.n.40', 'math.and.7']. */
export function numberPhrase(n: number): string[] {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new Error(`numberPhrase: ${n} is out of range 0–100`)
  if (n < 20 || n % 10 === 0) return [`math.n.${n}`]
  return [`math.n.${n - (n % 10)}`, `math.and.${n % 10}`]
}
