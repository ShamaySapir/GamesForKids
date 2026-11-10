import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { LETTERS } from '../hebrew/content/letters'
import { WORDS } from '../hebrew/content/words'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
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

// Labels for the parents' page (D18): plain Hebrew, no nikud.
const stripNikud = (s: string) => s.replace(/[֑-ׇ]/g, '')
const plainSentence = (s: string) => stripNikud(s).replace(/[.]$/, '')

const WORD_BY_ID = new Map(WORDS.map(w => [w.id, w]))
/** Words that read the same without nikud (ורד / וָרֹד) get their picture appended, so the labels stay distinct. */
const PLAIN_TEXT_COUNT = WORDS.reduce((m, w) => m.set(stripNikud(w.text), (m.get(stripNikud(w.text)) ?? 0) + 1), new Map<string, number>())
const wordLabel = (key: string) => {
  const w = WORD_BY_ID.get(key)
  if (!w) return undefined
  const plain = stripNikud(w.text)
  return `המילה ${plain}${PLAIN_TEXT_COUNT.get(plain)! > 1 ? ` ${w.emoji}` : ''}`
}

const SOUND_TEXT: Record<string, string> = {
  b: 'ב עם דגש', v: 'ב בלי דגש', g: 'ג', d: 'ד', z: 'ז', x: 'ח', t: 'ת', y: 'י', k: 'כ עם דגש', l: 'ל', m: 'מ', n: 'נ', s: 'ס',
  p: 'פ עם דגש', f: 'פ בלי דגש', ts: 'צ', r: 'ר', sh: 'ש',
}
const VOWEL_TEXT: Record<Vowel, string> = { a: 'קמץ או פתח', i: 'חיריק', o: 'חולם', u: 'שורוק או קובוץ', e: 'צירה או סגול' }
/** A unit key such as 'm-a' becomes "ההברה מ + קמץ או פתח". */
const unitLabel = (key: string) => {
  const unit = UNITS.find(u => u.key === key)
  return unit && SOUND_TEXT[unit.sound] ? `ההברה ${SOUND_TEXT[unit.sound]} + ${VOWEL_TEXT[unit.vowel]}` : undefined
}

const sentenceLabel = (key: string) => {
  const s = SENTENCES.find(x => x.id === key)
  return s ? `המשפט ${plainSentence(s.text)}` : undefined
}
const clozeLabel = (key: string) => {
  const c = CLOZES.find(x => x.id === key)
  return c ? `המשפט ${plainSentence(c.text)}` : undefined
}
const storyLabel = (key: string) => {
  const s = STORIES.find(x => x.id === key)
  return s ? `הסיפור ${plainSentence(s.sentences[0])}` : undefined
}
const bookLabel = (key: string) => {
  const b = BOOKS.find(x => x.id === key)
  return b ? `הספר ${stripNikud(b.title)}` : undefined
}

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts?: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const vowelSkill = (vowel: Vowel, title: string, sticker: string) => ({
  id: `reading.vowels-${vowel}`, title, grade: 1 as const, requires: ['hebrew.letters-4'], sticker, describeItem: unitLabel,
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
  homeTip: 'לקרוא יחד ספר קצר כל יום, להצביע על המילים בזמן הקריאה, ולבקש מהילד לקרוא שלט או כותרת',
  phrases,
  skills: [
    vowelSkill('a', 'קָמָץ וּפַתָּח', '🅰️'),
    vowelSkill('i', 'חִירִיק', '🍦'),
    vowelSkill('o', 'חוֹלָם', '🍩'),
    vowelSkill('u', 'שׁוּרוּק וְקֻבּוּץ', '🦉'),
    vowelSkill('e', 'צֵירֵי וּסֶגּוֹל', '🥚'),
    {
      id: 'reading.build', title: 'בּוֹנִים מִילָּה', grade: 1, requires: ['reading.vowels-a'], sticker: '🧱', describeItem: wordLabel,
      games: [defineGame({
        id: 'build', title: 'בּוֹנִים מִילָּה', icon: '🧱', component: OrderGame,
        generate: ctx => g.buildQuestion(ctx, WORDS), accepts: g.buildAccepts(WORDS),
      })],
    },
    {
      id: 'reading.word-picture', title: 'קוֹרְאִים מִילָּה', grade: 1, requires: ['reading.vowels-a'], sticker: '📖', describeItem: wordLabel,
      games: [
        pick('read-word', 'מִילָּה ← תְּמוּנָה', '📖', ctx => g.readWordQuestion(ctx, WORDS), g.wordAccepts(WORDS)),
        pick('picture-word', 'תְּמוּנָה ← מִילָּה', '🖼️', ctx => g.pictureWordQuestion(ctx, WORDS), g.wordAccepts(WORDS)),
      ],
    },
    {
      id: 'reading.sentences', title: 'קוֹרְאִים מִשְׁפָּט', grade: 1, requires: ['reading.word-picture'], sticker: '📜', describeItem: sentenceLabel,
      games: [pick('sentence', 'מִשְׁפָּט וּתְמוּנָה', '📜', ctx => g.sentenceQuestion(ctx, SENTENCES), g.sentenceAccepts(SENTENCES))],
    },
    {
      id: 'reading.cloze', title: 'הַמִּילָּה הַחֲסֵרָה', grade: 2, requires: ['reading.sentences'], sticker: '🧩', describeItem: clozeLabel,
      games: [pick('cloze', 'מָה חָסֵר?', '🧩', ctx => g.clozeQuestion(ctx, CLOZES), g.clozeAccepts(CLOZES))],
    },
    {
      id: 'reading.story-order', title: 'מְסַדְּרִים סִפּוּר', grade: 2, requires: ['reading.sentences'], sticker: '🗂️', describeItem: storyLabel,
      games: [defineGame({
        id: 'order', title: 'מְסַדְּרִים סִפּוּר', icon: '🗂️', component: OrderGame,
        generate: ctx => g.storyOrderQuestion(ctx, STORIES), accepts: g.storyAccepts(STORIES),
      })],
    },
    {
      id: 'reading.books', title: 'סִפְרִיָּה', grade: 1, requires: [], sticker: '📚', describeItem: bookLabel,
      games: BOOKS.map(book => defineGame({
        id: `book-${book.id}`, title: book.title, icon: book.cover, component: BookGame, roundLength: 1,
        generate: ctx => g.bookQuestion(ctx, [book]),
      })),
    },
  ],
}
