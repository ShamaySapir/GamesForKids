import type { ComponentType } from 'react'
import { registerArt, type ArtProps } from '../../../ui/pick/art'
import { animals } from './animals'
import { makeArt, type Entry } from './common'
import { nature } from './nature'
import { objects } from './objects'
import { makeScene } from './scene'
import { shapes } from './shapes'

export const ENTRIES: Record<string, Entry> = { ...animals, ...objects, ...nature, ...shapes }

export const ART_KIT: Record<string, ComponentType<ArtProps>> = {
  ...Object.fromEntries(Object.entries(ENTRIES).map(([name, e]) => [name, makeArt(e.draw)])),
  scene: makeScene(() => ENTRIES),
}

export const registerThinkingArt = () => registerArt(ART_KIT)
