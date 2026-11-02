import { createElement, type ComponentType } from 'react'
import type { ArtRef } from './types'

// Drawings are registered by the island that owns them (the thinking island's art kit), so shared UI can draw an
// ArtRef by name without depending on any island (DECISIONS D14, D15).

export type ArtProps = Readonly<Record<string, string | number | boolean>> & { size: number }

const registry = new Map<string, ComponentType<ArtProps>>()

export function registerArt(drawings: Readonly<Record<string, ComponentType<ArtProps>>>) {
  for (const [name, c] of Object.entries(drawings)) registry.set(name, c)
}

export const hasArt = (name: string) => registry.has(name)

/** Draws a registered drawing; '?' draws an empty slot (the item to find, e.g. the next in a pattern). */
export function ArtView({ art, size = 96 }: { art: ArtRef; size?: number }) {
  if (art.name === '?') return <span className="pk-art-slot" style={{ width: size, height: size }} aria-label="?">?</span>
  const Drawing = registry.get(art.name)
  if (!Drawing) return <span className="pk-art-missing" style={{ width: size, height: size }} aria-label={art.name}>{art.name}</span>
  // Looked up from the registry, not created here.
  return createElement(Drawing, { ...art.props, size })
}
