import type { EngSentence } from '../types'

// Groups of near-miss scenes: sentences in a group share one tag and differ in another, so a picture can't be chosen
// from one word alone.
export const SENTENCES: readonly EngSentence[] = [
  { id: 'cat-bed', text: 'The cat is on the bed.', scene: '🐱🛏️', tags: { who: 'cat', where: 'bed' } },
  { id: 'dog-bed', text: 'The dog is on the bed.', scene: '🐶🛏️', tags: { who: 'dog', where: 'bed' } },
  { id: 'cat-chair', text: 'The cat is on the chair.', scene: '🐱🪑', tags: { who: 'cat', where: 'chair' } },
  { id: 'dog-chair', text: 'The dog is on the chair.', scene: '🐶🪑', tags: { who: 'dog', where: 'chair' } },

  { id: 'hat-red', text: 'The hat is red.', scene: '🎩🔴', tags: { thing: 'hat', color: 'red' } },
  { id: 'hat-blue', text: 'The hat is blue.', scene: '🎩🔵', tags: { thing: 'hat', color: 'blue' } },
  { id: 'bus-red', text: 'The bus is red.', scene: '🚌🔴', tags: { thing: 'bus', color: 'red' } },
  { id: 'bus-blue', text: 'The bus is blue.', scene: '🚌🔵', tags: { thing: 'bus', color: 'blue' } },

  { id: 'pig-run', text: 'The pig can run.', scene: '🐷🏃', tags: { who: 'pig', does: 'run' } },
  { id: 'pig-dig', text: 'The pig can dig.', scene: '🐷⛏️', tags: { who: 'pig', does: 'dig' } },
  { id: 'dog-run', text: 'The dog can run.', scene: '🐶🏃', tags: { who: 'dog', does: 'run' } },
  { id: 'dog-dig', text: 'The dog can dig.', scene: '🐶⛏️', tags: { who: 'dog', does: 'dig' } },

  { id: 'she-sad', text: 'She is sad.', scene: '👧😢', tags: { who: 'she', feels: 'sad' } },
  { id: 'he-sad', text: 'He is sad.', scene: '👦😢', tags: { who: 'he', feels: 'sad' } },
  { id: 'she-mad', text: 'She is mad.', scene: '👧😡', tags: { who: 'she', feels: 'mad' } },
  { id: 'he-mad', text: 'He is mad.', scene: '👦😡', tags: { who: 'he', feels: 'mad' } },

  { id: 'see-fox', text: 'I see a fox.', scene: '👀🦊', tags: { who: 'I', sees: 'fox' } },
  { id: 'see-bug', text: 'I see a bug.', scene: '👀🐛', tags: { who: 'I', sees: 'bug' } },
  { id: 'see-bat', text: 'I see a bat.', scene: '👀🦇', tags: { who: 'I', sees: 'bat' } },

  { id: 'like-pizza', text: 'I like pizza.', scene: '🍕😋', tags: { who: 'I', likes: 'pizza' } },
  { id: 'like-cake', text: 'I like cake.', scene: '🍰😋', tags: { who: 'I', likes: 'cake' } },
  { id: 'like-milk', text: 'I like milk.', scene: '🥛😋', tags: { who: 'I', likes: 'milk' } },

  { id: 'dad-van', text: 'My dad is in the van.', scene: '👨🚐', tags: { who: 'dad', where: 'van' } },
  { id: 'mom-van', text: 'My mom is in the van.', scene: '👩🚐', tags: { who: 'mom', where: 'van' } },
  { id: 'dad-bus', text: 'My dad is on the bus.', scene: '👨🚌', tags: { who: 'dad', where: 'bus' } },
  { id: 'mom-bus', text: 'My mom is on the bus.', scene: '👩🚌', tags: { who: 'mom', where: 'bus' } },
]
