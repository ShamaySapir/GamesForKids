import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { LETTERS, SOUND_LABEL } from './content/letters'
import { CV_UNITS, DAGESH_GROUPS, SAME_SOUND_GROUPS, SYLLABLE_WORDS, WORDS } from './content/words'
import { PickGame } from '../../ui/pick/PickGame'
import { ClapGame, SortGame } from './games'
import * as g from './generators'
import { phrases } from './phrases'
import type { PickQ, SoundId } from './types'

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

// Labels for the parents' page (D18): plain Hebrew, no nikud.
const stripNikud = (s: string) => s.replace(/[֑-ׇ]/g, '')

const WORD_BY_ID = new Map(WORDS.map(w => [w.id, w]))
/** Words that read the same without nikud (ורד / וָרֹד) get their picture appended, so the labels stay distinct. */
const PLAIN_TEXT_COUNT = WORDS.reduce((m, w) => m.set(stripNikud(w.text), (m.get(stripNikud(w.text)) ?? 0) + 1), new Map<string, number>())
const wordLabel = (key: string) => {
  const w = WORD_BY_ID.get(key)
  if (!w) return undefined
  const plain = stripNikud(w.text)
  return `המילה ${plain}${PLAIN_TEXT_COUNT.get(plain)! > 1 ? ` ${w.emoji}` : ''}`
}

const letterLabel = (key: string) => (LETTERS.some(l => l.char === key) ? `האות ${key}` : undefined)

/** Letter-picture: a letter in one game, a word in the other. */
const letterOrWord = (key: string) => letterLabel(key) ?? wordLabel(key)

/** Finals skill: a regular letter with its final form ("כ / ך"), or a word that ends in a final letter. */
const finalsLabel = (key: string) => {
  const letter = LETTERS.find(l => l.char === key)
  if (letter) return letter.final ? `${letter.char} / ${letter.final}` : `האות ${letter.char}`
  return wordLabel(key)
}

const SOUND_TEXT: Record<SoundId, string> = {
  b: 'ב עם דגש כמו בית', v: 'ו כמו ורד', g: 'ג כמו גמל', d: 'ד כמו דג', h: 'ה כמו הר', z: 'ז כמו זית', x: 'ח כמו חתול',
  t: 'ט או ת כמו טלפון', y: 'י כמו יד', k: 'ק כמו קוף', l: 'ל כמו לב', m: 'מ כמו מים', n: 'נ כמו נר', s: 'ס כמו סוס',
  p: 'פ עם דגש כמו פיל', f: 'פ בלי דגש כמו ציפור', ts: 'צ כמו צפרדע', r: 'ר כמו רכבת', sh: 'ש כמו שמש',
}
const soundLabel = (key: string) => (key in SOUND_TEXT ? `הצליל ${SOUND_TEXT[key as SoundId]}` : undefined)

const VOWEL_NAMES: Record<string, string> = {
  'ְ': 'שווא', 'ֱ': 'חטף סגול', 'ֲ': 'חטף פתח', 'ֳ': 'חטף קמץ', 'ִ': 'חיריק', 'ֵ': 'צירה',
  'ֶ': 'סגול', 'ַ': 'פתח', 'ָ': 'קמץ', 'ֹ': 'חולם', 'ֻ': 'קובוץ',
}
/** An opening unit such as 'בַּ' becomes "ההברה ב + פתח". */
const cvLabel = (key: string) => {
  if (!CV_UNITS.includes(key)) return undefined
  const rest = [...key.slice(1)]
  const vowel = rest.map(c => VOWEL_NAMES[c]).find(Boolean) ?? (rest.includes('ו') ? 'שורוק' : undefined)
  return vowel ? `ההברה ${key[0]} + ${vowel}` : undefined
}

/** A same-sound word with the letters it may start with, e.g. "המילה טלפון (ט / ת)". */
const sameSoundLabel = (key: string) => {
  const w = WORD_BY_ID.get(key)
  if (!w) return undefined
  const first = g.firstLetter(w.text)[0]!
  const set = SAME_SOUND_SETS.find(s => s.some(l => l[0] === first))
  return set ? `${wordLabel(key)} (${set.map(l => l[0]).join(' / ')})` : wordLabel(key)
}

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts?: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const letterSkill = (group: g.LetterGroup, title: string, sticker: string, requires: string[]) => ({
  id: `hebrew.letters-${group + 1}`, title, grade: 0 as const, requires, sticker, describeItem: letterLabel,
  games: [
    pick('find', 'איפה האות?', '🔎', ctx => g.findLetterQuestion(ctx, LETTERS, group), g.letterAccepts(LETTERS, group)),
    pick('name', 'איך קוראים לה?', '🗣️', ctx => g.nameLetterQuestion(ctx, LETTERS, group), g.letterAccepts(LETTERS, group)),
  ],
})

export const island: IslandDef = {
  id: 'hebrew',
  order: 2,
  title: 'אִי הָאוֹתִיּוֹת',
  // Real Hebrew letters: no emoji shows Hebrew, and 🔤 is Latin (the map styles letter icons in the island color).
  icon: 'אב',
  color: '--abc',
  homeTip: 'לחפש יחד אותיות בשלטים ובספרים, ולשאול באיזו אות מתחילה מילה ובאיזה צליל היא נגמרת',
  phrases,
  skills: [
    {
      id: 'hebrew.rhyme', title: 'מילים מתחרזות', grade: 0, requires: [], sticker: '🎵', describeItem: wordLabel,
      games: [pick('rhyme', 'מה מתחרז?', '🎵', ctx => g.rhymeQuestion(ctx, WORDS), g.rhymeAccepts(WORDS))],
    },
    {
      id: 'hebrew.syllables', title: 'מוחאים כפיים להברות', grade: 0, requires: [], sticker: '👏', describeItem: wordLabel,
      games: [defineGame({
        id: 'clap', title: 'מוחאים כפיים', icon: '👏', component: ClapGame,
        generate: ctx => g.syllablesQuestion(ctx, WORDS, SYLLABLE_WORDS), accepts: g.syllablesAccepts(WORDS, SYLLABLE_WORDS),
      })],
    },
    {
      id: 'hebrew.opening-cv', title: 'איך המילה מתחילה?', grade: 0, requires: ['hebrew.syllables'], sticker: '🔍', describeItem: cvLabel,
      games: [pick('cv', 'איך מתחילה?', '🔍', ctx => g.openingCvQuestion(ctx, WORDS, CV_UNITS), g.cvAccepts(WORDS, CV_UNITS))],
    },
    {
      id: 'hebrew.opening-sound', title: 'הצליל הפותח', grade: 0, requires: ['hebrew.opening-cv'], sticker: '👂', describeItem: soundLabel,
      games: [
        pick('sound-a', 'צלילים ארוכים', '🐍', ctx => g.openingSoundQuestion(ctx, WORDS, 'A'), g.openingSoundAccepts(WORDS, 'A')),
        pick('sound-b', 'כל הצלילים', '👂', ctx => g.openingSoundQuestion(ctx, WORDS, 'B'), g.openingSoundAccepts(WORDS, 'B')),
      ],
    },
    {
      id: 'hebrew.closing-sound', title: 'הצליל הסוגר', grade: 0, requires: ['hebrew.opening-sound'], sticker: '🎯', describeItem: wordLabel,
      games: [pick('closing', 'איך נגמרת?', '🎯', ctx => g.closingSoundQuestion(ctx, WORDS, SOUND_LABEL), g.closingAccepts(WORDS))],
    },
    letterSkill(0, 'אותיות א–ה', '🐣', []),
    letterSkill(1, 'אותיות ו–י', '🐥', ['hebrew.letters-1']),
    letterSkill(2, 'אותיות כ–ס', '🐤', ['hebrew.letters-2']),
    letterSkill(3, 'אותיות ע–ת', '🦜', ['hebrew.letters-3']),
    {
      id: 'hebrew.letter-picture', title: 'אות ותמונה', grade: 1, requires: ['hebrew.letters-4', 'hebrew.opening-sound'], sticker: '🖼️', describeItem: letterOrWord,
      games: [
        pick('letter-to-picture', 'איזו תמונה?', '🖼️', ctx => g.letterToPictureQuestion(ctx, LETTERS, WORDS), g.letterToPictureAccepts(LETTERS, WORDS)),
        pick('picture-to-letter', 'איזו אות?', '🔤', ctx => g.pictureToLetterQuestion(ctx, LETTERS, WORDS), g.pictureToLetterAccepts(LETTERS, WORDS)),
      ],
    },
    {
      id: 'hebrew.finals', title: 'אותיות סופיות', grade: 1, requires: ['hebrew.letter-picture'], sticker: '🏁', describeItem: finalsLabel,
      games: [
        pick('finals-form', 'זוגות', '🧦', ctx => g.finalsFormQuestion(ctx, LETTERS), g.finalsAccepts(LETTERS)),
        pick('finals-word', 'סוף המילה', '🏁', ctx => g.finalsWordQuestion(ctx, LETTERS, WORDS), g.finalsWordAccepts(LETTERS, WORDS)),
      ],
    },
    {
      id: 'hebrew.same-sound', title: 'אותיות שנשמעות אותו דבר', grade: 1, requires: ['hebrew.letter-picture'], sticker: '👯', describeItem: sameSoundLabel,
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
