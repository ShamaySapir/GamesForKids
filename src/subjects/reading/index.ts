import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { LETTERS } from '../hebrew/content/letters'
import { WORDS } from '../hebrew/content/words'
import { PickGame } from '../hebrew/games'
import type { PickQ } from '../hebrew/types'
import { BOOKS } from './content/books'
import { CLOZES } from './content/cloze'
import { SENTENCES } from './content/sentences'
import { STORIES } from './content/stories'
import { UNITS } from './content/units'
import { BookGame, OrderGame } from './games'
import * as g from './generators'
import { phrases } from './phrases'
import type { Vowel } from './types'

// Skills follow docs/specs/reading.md. Reuses the letters island's words, letters and PickGame (DECISIONS D11).
// The vowel skills are deliberately not chained: the ministry leaves the order of nikud signs to each school.

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts?: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const vowelSkill = (vowel: Vowel, title: string, sticker: string) => ({
  id: `reading.vowels-${vowel}`, title, grade: 1 as const, requires: ['hebrew.letters-4'], sticker,
  games: [
    pick('hear-unit', 'אֵיפֹה כָּתוּב?', '👂', ctx => g.hearUnitQuestion(ctx, UNITS, LETTERS, vowel), g.unitAccepts(UNITS, vowel)),
    pick('see-unit', 'אֵיךְ קוֹרְאִים?', '👀', ctx => g.seeUnitQuestion(ctx, UNITS, LETTERS, vowel), g.unitAccepts(UNITS, vowel)),
  ],
})

export const island: IslandDef = {
  id: 'reading',
  order: 3,
  title: 'אִי הַקְּרִיאָה',
  icon: '📖',
  color: '--read',
  phrases,
  skills: [
    vowelSkill('a', 'קָמָץ וּפַתָּח', '🅰️'),
    vowelSkill('i', 'חִירִיק', '🍦'),
    vowelSkill('o', 'חוֹלָם', '🍩'),
    vowelSkill('u', 'שׁוּרוּק וְקֻבּוּץ', '🦉'),
    vowelSkill('e', 'צֵירֵה וּסֶגּוֹל', '🥚'),
    {
      id: 'reading.build', title: 'בּוֹנִים מִילָּה', grade: 1, requires: ['reading.vowels-a'], sticker: '🧱',
      games: [defineGame({
        id: 'build', title: 'בּוֹנִים מִילָּה', icon: '🧱', component: OrderGame,
        generate: ctx => g.buildQuestion(ctx, WORDS), accepts: g.buildAccepts(WORDS),
      })],
    },
    {
      id: 'reading.word-picture', title: 'קוֹרְאִים מִילָּה', grade: 1, requires: ['reading.vowels-a'], sticker: '📖',
      games: [
        pick('read-word', 'מִילָּה ← תְּמוּנָה', '📖', ctx => g.readWordQuestion(ctx, WORDS), g.wordAccepts(WORDS)),
        pick('picture-word', 'תְּמוּנָה ← מִילָּה', '🖼️', ctx => g.pictureWordQuestion(ctx, WORDS), g.wordAccepts(WORDS)),
      ],
    },
    {
      id: 'reading.sentences', title: 'קוֹרְאִים מִשְׁפָּט', grade: 1, requires: ['reading.word-picture'], sticker: '📜',
      games: [pick('sentence', 'מִשְׁפָּט וּתְמוּנָה', '📜', ctx => g.sentenceQuestion(ctx, SENTENCES), g.sentenceAccepts(SENTENCES))],
    },
    {
      id: 'reading.cloze', title: 'הַמִּילָּה הַחֲסֵרָה', grade: 2, requires: ['reading.sentences'], sticker: '🧩',
      games: [pick('cloze', 'מָה חָסֵר?', '🧩', ctx => g.clozeQuestion(ctx, CLOZES), g.clozeAccepts(CLOZES))],
    },
    {
      id: 'reading.story-order', title: 'מְסַדְּרִים סִפּוּר', grade: 2, requires: ['reading.sentences'], sticker: '🗂️',
      games: [defineGame({
        id: 'order', title: 'מְסַדְּרִים סִפּוּר', icon: '🗂️', component: OrderGame,
        generate: ctx => g.storyOrderQuestion(ctx, STORIES), accepts: g.storyAccepts(STORIES),
      })],
    },
    {
      id: 'reading.books', title: 'סִפְרִיָּה', grade: 1, requires: [], sticker: '📚',
      games: BOOKS.map(book => defineGame({
        id: `book-${book.id}`, title: book.title, icon: book.cover, component: BookGame, roundLength: 1,
        generate: ctx => g.bookQuestion(ctx, [book]),
      })),
    },
  ],
}
