export type Rng = () => number

export const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (!items.length) throw new Error('pick from empty list')
  return items[Math.floor(rng() * items.length)]!
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Deterministic generator for tests (mulberry32). */
export function seeded(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
