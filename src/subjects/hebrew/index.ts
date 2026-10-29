import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { LETTERS, SOUND_LABEL } from './content/letters'
import { CV_UNITS, DAGESH_GROUPS, SAME_SOUND_GROUPS, SYLLABLE_WORDS, WORDS } from './content/words'
import { ClapGame, PickGame, SortGame } from './games'
import * as g from './generators'
import { phrases } from './phrases'
import type { PickQ } from './types'

// Skills follow docs/specs/hebrew-letters.md (ministry gan–2nd grade language curriculum, DECISIONS D6).

/**
 * Same-sound sets as the same-sound generator expects them: letters (with the dot a word-initial letter
 * carries) joined by '/'. Word-initial ת and כ always take a dagesh, so their dotted forms are listed.
 */
const SAME_SOUND_SETS = [['ט', 'תּ'], ['ח', 'כ'], ['כּ', 'ק'], ['ס', 'שׂ'], ['ב', 'ו'], ['א', 'ע', 'ה']]
const byLetter: g.WordGroups = SAME_SOUND_GROUPS
// Content keys plain ת; the set lists dotted תּ, so fall back to the base letter.
const sameSoundGroups: g.WordGroups = Object.fromEntries(SAME_SOUND_SETS.map(set => [
  set.join('/'),
  set.flatMap(letter => byLetter[letter] ?? byLetter[letter[0]!] ?? []),
]))

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts?: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const letterSkill = (group: g.LetterGroup, title: string, sticker: string, requires: string[]) => ({
  id: `hebrew.letters-${group + 1}`, title, grade: 0 as const, requires, sticker,
  games: [
    pick('find', 'איפה האות?', '🔎', ctx => g.findLetterQuestion(ctx, LETTERS, group), g.letterAccepts(LETTERS, group)),
    pick('name', 'איך קוראים לה?', '🗣️', ctx => g.nameLetterQuestion(ctx, LETTERS, group), g.letterAccepts(LETTERS, group)),
  ],
})

export const island: IslandDef = {
  id: 'hebrew',
  order: 2,
  title: 'אי האותיות',
  icon: '🔤',
  color: '--abc',
  phrases,
  skills: [
    {
      id: 'hebrew.rhyme', title: 'מילים מתחרזות', grade: 0, requires: [], sticker: '🎵',
      games: [pick('rhyme', 'מה מתחרז?', '🎵', ctx => g.rhymeQuestion(ctx, WORDS), g.rhymeAccepts(WORDS))],
    },
    {
      id: 'hebrew.syllables', title: 'מוחאים כפיים להברות', grade: 0, requires: [], sticker: '👏',
      games: [defineGame({
        id: 'clap', title: 'מוחאים כפיים', icon: '👏', component: ClapGame,
        generate: ctx => g.syllablesQuestion(ctx, WORDS, SYLLABLE_WORDS), accepts: g.syllablesAccepts(WORDS, SYLLABLE_WORDS),
      })],
    },
    {
      id: 'hebrew.opening-cv', title: 'איך המילה מתחילה?', grade: 0, requires: ['hebrew.syllables'], sticker: '🔍',
      games: [pick('cv', 'איך מתחילה?', '🔍', ctx => g.openingCvQuestion(ctx, WORDS, CV_UNITS), g.cvAccepts(WORDS, CV_UNITS))],
    },
    {
      id: 'hebrew.opening-sound', title: 'הצליל הפותח', grade: 0, requires: ['hebrew.opening-cv'], sticker: '👂',
      games: [
        pick('sound-a', 'צלילים ארוכים', '🐍', ctx => g.openingSoundQuestion(ctx, WORDS, 'A'), g.openingSoundAccepts(WORDS, 'A')),
        pick('sound-b', 'כל הצלילים', '👂', ctx => g.openingSoundQuestion(ctx, WORDS, 'B'), g.openingSoundAccepts(WORDS, 'B')),
      ],
    },
    {
      id: 'hebrew.closing-sound', title: 'הצליל הסוגר', grade: 0, requires: ['hebrew.opening-sound'], sticker: '🎯',
      games: [pick('closing', 'איך נגמרת?', '🎯', ctx => g.closingSoundQuestion(ctx, WORDS, SOUND_LABEL), g.closingAccepts(WORDS))],
    },
    letterSkill(0, 'אותיות א–ה', '🐣', []),
    letterSkill(1, 'אותיות ו–י', '🐥', ['hebrew.letters-1']),
    letterSkill(2, 'אותיות כ–ס', '🐤', ['hebrew.letters-2']),
    letterSkill(3, 'אותיות ע–ת', '🦜', ['hebrew.letters-3']),
    {
      id: 'hebrew.letter-picture', title: 'אות ותמונה', grade: 1, requires: ['hebrew.letters-4', 'hebrew.opening-sound'], sticker: '🖼️',
      games: [
        pick('letter-to-picture', 'איזו תמונה?', '🖼️', ctx => g.letterToPictureQuestion(ctx, LETTERS, WORDS), g.letterToPictureAccepts(LETTERS, WORDS)),
        pick('picture-to-letter', 'איזו אות?', '🔤', ctx => g.pictureToLetterQuestion(ctx, LETTERS, WORDS), g.pictureToLetterAccepts(LETTERS, WORDS)),
      ],
    },
    {
      id: 'hebrew.finals', title: 'אותיות סופיות', grade: 1, requires: ['hebrew.letter-picture'], sticker: '🏁',
      games: [
        pick('finals-form', 'זוגות', '🧦', ctx => g.finalsFormQuestion(ctx, LETTERS), g.finalsAccepts(LETTERS)),
        pick('finals-word', 'סוף המילה', '🏁', ctx => g.finalsWordQuestion(ctx, LETTERS, WORDS), g.finalsWordAccepts(LETTERS, WORDS)),
      ],
    },
    {
      id: 'hebrew.same-sound', title: 'אותיות שנשמעות אותו דבר', grade: 1, requires: ['hebrew.letter-picture'], sticker: '👯',
      games: [pick('same-sound', 'איזו אות חסרה?', '👯', ctx => g.sameSoundQuestion(ctx, WORDS, sameSoundGroups), g.sameSoundAccepts(WORDS, sameSoundGroups))],
    },
    {
      id: 'hebrew.dagesh', title: 'עם נקודה ובלי נקודה', grade: 1, requires: ['hebrew.letter-picture'], sticker: '⚫',
      games: [defineGame({
        id: 'sort', title: 'מיון לסלים', icon: '🧺', component: SortGame, roundLength: 3,
        generate: ctx => g.dageshQuestion(ctx, WORDS, DAGESH_GROUPS),
      })],
    },
  ],
}
