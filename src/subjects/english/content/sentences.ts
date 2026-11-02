import type { EngSentence } from '../types'

// Groups of near-miss scenes: sentences in a group share one tag and differ in another, so a picture can't be chosen
// from one word alone.
export const SENTENCES: readonly EngSentence[] = [
  { id: 'cat-bed', text: 'The cat is on the bed.', scene: '🐱🛏️', tags: { who: 'cat', where: 'bed' } },
  { id: 'dog-bed', text: 'The dog is on the bed.', scene: '🐶🛏️', tags: { who: 'dog', where: 'bed' } },
  { id: 'cat-chair', text: 'The cat is on the chair.', scene: '🐱🪑', tags: { who: 'cat', where: 'chair' } },
  { id: 'dog-chair', text: 'The dog is on the chair.', scene: '🐶🪑', tags: { who: 'dog', where: 'chair' } },

  { id: 'book-red', text: 'The book is red.', scene: '📕', tags: { thing: 'book', color: 'red' } },
  { id: 'book-blue', text: 'The book is blue.', scene: '📘', tags: { thing: 'book', color: 'blue' } },
  { id: 'apple-red', text: 'The apple is red.', scene: '🍎', tags: { thing: 'apple', color: 'red' } },
  { id: 'apple-green', text: 'The apple is green.', scene: '🍏', tags: { thing: 'apple', color: 'green' } },

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

  { id: 'dad-car', text: 'My dad is in the car.', scene: '👨🚗', tags: { who: 'dad', where: 'car' } },
  { id: 'mom-car', text: 'My mom is in the car.', scene: '👩🚗', tags: { who: 'mom', where: 'car' } },
  { id: 'dad-bus', text: 'My dad is on the bus.', scene: '👨🚌', tags: { who: 'dad', where: 'bus' } },
  { id: 'mom-bus', text: 'My mom is on the bus.', scene: '👩🚌', tags: { who: 'mom', where: 'bus' } },
]
