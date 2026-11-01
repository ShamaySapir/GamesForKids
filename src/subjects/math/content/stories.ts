import type { StoryTemplate } from '../types'

// Texts live in ../phrases.ts (STORY_TEXT). `things` lists only things whose verbs and place fit the scene.
const FOOD = ['banana', 'cookie', 'tomato', 'donut', 'candy']
const PARTY = ['cookie', 'candy', 'pizza', 'donut']

export const STORIES: readonly StoryTemplate[] = [
  { id: 'join-tree', kind: 'join', things: ['bird'] },
  { id: 'join-basket', kind: 'join', things: [...FOOD, 'egg', 'mushroom'] },
  { id: 'join-plate', kind: 'join', things: [...FOOD, 'pizza'] },
  { id: 'join-farm', kind: 'join', things: ['cow', 'sheep', 'chicken'] },
  { id: 'join-garden', kind: 'join', things: ['sunflower', 'mushroom'] },
  { id: 'join-bees', kind: 'join', things: ['bee', 'bird'] },
  { id: 'join-cars', kind: 'join', things: ['car'] },
  { id: 'join-train', kind: 'join', things: ['train'] },
  { id: 'join-closet', kind: 'join', things: ['shirt', 'dress'] },
  { id: 'join-party', kind: 'join', things: ['gift', ...PARTY] },
  { id: 'join-freezer', kind: 'join', things: ['icecream', 'pizza'] },
  { id: 'join-shop', kind: 'join', things: ['guitar', 'shirt', 'dress'] },
  { id: 'join-rock', kind: 'join', things: ['frog', 'bird'] },
  { id: 'sep-basket', kind: 'separate', things: FOOD },
  { id: 'sep-tree', kind: 'separate', things: ['bird'] },
  { id: 'sep-farm', kind: 'separate', things: ['cow', 'sheep', 'chicken'] },
  { id: 'sep-pond', kind: 'separate', things: ['frog'] },
  { id: 'sep-plate', kind: 'separate', things: [...FOOD, 'pizza'] },
  { id: 'sep-party', kind: 'separate', things: ['gift', ...PARTY] },
  { id: 'sep-garden', kind: 'separate', things: ['sunflower', 'mushroom'] },
  { id: 'sep-train', kind: 'separate', things: ['train'] },
  { id: 'sep-closet', kind: 'separate', things: ['shirt', 'dress'] },
  { id: 'sep-freezer', kind: 'separate', things: ['icecream', 'pizza'] },
  { id: 'sep-eggs', kind: 'separate', things: ['egg'] },
  { id: 'sep-spoons', kind: 'separate', things: ['spoon'] },
]
