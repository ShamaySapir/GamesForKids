import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
import { OrderGame } from '../reading/games'
import { CHUNKS, QAS } from './content/chunks'
import { MAGIC_PAIRS, MINIMAL_PAIRS, SIGHT_WORDS } from './content/phonics'
import { SENTENCES } from './content/sentences'
import { WORDS } from './content/words'
import * as g from './generators'
import { englishPhrases, phrases } from './phrases'
import type { Pattern, Topic } from './types'

// Skills follow docs/specs/english.md (Pre-A1 to early A1). English is spoken by the browser voice (D17);
// instructions are Hebrew. Word building reuses the reading island's OrderGame, left to right (D11).

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

/** Tile texts that have their own sound phrase ('b', 'sh'…), so build tiles can say their sound. */
const SOUNDS: ReadonlySet<string> = new Set(Object.keys(englishPhrases).filter(k => k.startsWith('eng.sound.')).map(k => k.slice('eng.sound.'.length)))

const words = (id: string, title: string, sticker: string, topics: Topic[]) => ({
  id, title, grade: 1 as const, requires: [], sticker,
  games: [pick('hear-pick', 'שׁוֹמְעִים וּבוֹחֲרִים', '👂', ctx => g.hearPickQuestion(ctx, WORDS, topics), g.hearPickAccepts(WORDS, topics))],
})

const readWord = (pattern: Pattern) =>
  pick(`read-${pattern}`, 'קוֹרְאִים מִילָּה', '📖', ctx => g.readPictureQuestion(ctx, WORDS, pattern), g.readPictureAccepts(WORDS, pattern))

const buildWord = (pattern: Pattern) => defineGame({
  id: `build-${pattern}`, title: 'בּוֹנִים מִילָּה', icon: '🧱', component: OrderGame,
  generate: ctx => g.buildQuestion(ctx, WORDS, pattern, SOUNDS), accepts: g.buildAccepts(WORDS, pattern),
})

export const island: IslandDef = {
  id: 'english',
  order: 6,
  title: 'English Island',
  icon: '🔠',
  color: '--eng',
  phrases: { ...phrases, ...englishPhrases },
  skills: [
    words('eng.words-1', 'Colors & numbers', '🎨', ['colors', 'numbers']),
    words('eng.words-2', 'Animals & food', '🐶', ['animals', 'food']),
    words('eng.words-3', 'Me, family & school', '🎒', ['body', 'family', 'school', 'toys', 'clothes', 'home']),
    {
      id: 'eng.chunks', title: 'Hello, how are you?', grade: 3, requires: [], sticker: '👋',
      games: [
        pick('chunk', 'מָתַי אוֹמְרִים?', '💬', ctx => g.chunkQuestion(ctx, CHUNKS), g.chunkAccepts(CHUNKS)),
        pick('answer', 'מָה עוֹנִים?', '🗨️', ctx => g.answerQuestion(ctx, QAS), g.answerAccepts(QAS)),
      ],
    },
    {
      id: 'eng.sounds', title: 'Sounds', grade: 3, requires: ['eng.words-2'], sticker: '👂',
      games: [
        pick('rhyme', 'מִתְחָרֵז', '🎵', ctx => g.rhymeQuestion(ctx, WORDS), g.rhymeAccepts(WORDS)),
        pick('first-sound', 'אוֹתוֹ צְלִיל', '🔊', ctx => g.firstSoundQuestion(ctx, WORDS), g.firstSoundAccepts(WORDS)),
        pick('blend', 'מְחַבְּרִים צְלִילִים', '🔗', ctx => g.blendQuestion(ctx, WORDS), g.blendAccepts(WORDS)),
      ],
    },
    {
      id: 'eng.letters', title: 'ABC', grade: 3, requires: [], sticker: '🔤',
      games: [
        pick('find-letter', 'אֵיפֹה הָאוֹת?', '🔎', g.findLetterQuestion, g.findLetterAccepts),
        pick('big-small', 'גְּדוֹלָה וּקְטַנָּה', '🔠', g.bigSmallQuestion, g.bigSmallAccepts),
        pick('letter-sound', 'אוֹת וּצְלִיל', '🗣️', g.letterSoundQuestion, g.letterSoundAccepts),
      ],
    },
    {
      id: 'eng.first-letter', title: 'First letter', grade: 3, requires: ['eng.letters', 'eng.sounds'], sticker: '🅰️',
      games: [pick('first-letter', 'אוֹת רִאשׁוֹנָה', '🅰️', ctx => g.firstLetterQuestion(ctx, WORDS), g.firstLetterAccepts(WORDS))],
    },
    { id: 'eng.cvc', title: 'Read: cat, dog, sun', grade: 3, requires: ['eng.first-letter'], sticker: '📖', games: [readWord('cvc'), buildWord('cvc')] },
    {
      id: 'eng.pairs', title: 'Listen carefully', grade: 4, requires: ['eng.sounds'], sticker: '🎧',
      games: [pick('pairs', 'הַקְשִׁיבוּ טוֹב', '🎧', ctx => g.pairsQuestion(ctx, WORDS, MINIMAL_PAIRS), g.pairsAccepts(WORDS, MINIMAL_PAIRS))],
    },
    { id: 'eng.digraphs', title: 'sh, ch, th', grade: 4, requires: ['eng.cvc'], sticker: '🐑', games: [readWord('digraph'), buildWord('digraph')] },
    {
      id: 'eng.magic-e', title: 'Magic e', grade: 4, requires: ['eng.cvc'], sticker: '🪄',
      games: [
        readWord('magic-e'),
        pick('which-word', 'אֵיזוֹ מִילָּה?', '🪄', ctx => g.whichWordQuestion(ctx, WORDS, MAGIC_PAIRS), g.whichWordAccepts(WORDS, MAGIC_PAIRS)),
      ],
    },
    {
      id: 'eng.sight', title: 'Sight words', grade: 4, requires: ['eng.cvc'], sticker: '👀',
      games: [pick('sight', 'אֵיפֹה כָּתוּב?', '👀', ctx => g.sightQuestion(ctx, SIGHT_WORDS), g.sightAccepts(SIGHT_WORDS))],
    },
    {
      id: 'eng.sentences', title: 'Read a sentence', grade: 4, requires: ['eng.cvc', 'eng.sight'], sticker: '📜',
      games: [pick('sentence', 'קוֹרְאִים מִשְׁפָּט', '📜', ctx => g.sentenceQuestion(ctx, SENTENCES), g.sentenceAccepts(SENTENCES))],
    },
  ],
}
