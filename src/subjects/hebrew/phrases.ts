import type { PhraseMap } from '../../core/engine/types'
import { Q, cvPhrase, letterPhrase, soundPhrase, syllablesPhrase, wordPhrase } from './ids'
import { LETTERS } from './content/letters'
import { CV_UNITS, SYLLABLE_WORDS, WORDS } from './content/words'
import type { SoundId } from './types'

// One recording per entry (docs/DECISIONS.md D3). Word and letter phrases carry nikud because they are
// recorded and read aloud; instructions are plain Hebrew. Isolated sounds are consonant + shva.

const LETTER_NAMES: Record<string, string> = {
  'א': 'אָלֶף',
  'ב': 'בֵּית',
  'ג': 'גִּימֶל',
  'ד': 'דָּלֶת',
  'ה': 'הֵא',
  'ו': 'וָו',
  'ז': 'זַיִן',
  'ח': 'חֵית',
  'ט': 'טֵית',
  'י': 'יוֹד',
  'כ': 'כָּף',
  'ך': 'כָּף סוֹפִית',
  'ל': 'לָמֶד',
  'מ': 'מֵם',
  'ם': 'מֵם סוֹפִית',
  'נ': 'נוּן',
  'ן': 'נוּן סוֹפִית',
  'ס': 'סָמֶךְ',
  'ע': 'עַיִן',
  'פ': 'פֵּא',
  'ף': 'פֵּא סוֹפִית',
  'צ': 'צָדִי',
  'ץ': 'צָדִי סוֹפִית',
  'ק': 'קוֹף',
  'ר': 'רֵישׁ',
  'ש': 'שִׁין',
  'ת': 'תָּיו',
}

const SOUND_TEXT: Record<SoundId, string> = {
  b: 'בְּ',
  v: 'וְ',
  g: 'גְּ',
  d: 'דְּ',
  h: 'הְ',
  z: 'זְ',
  x: 'חְ',
  t: 'תְּ',
  y: 'יְ',
  k: 'קְ',
  l: 'לְ',
  m: 'מְ',
  n: 'נְ',
  s: 'סְ',
  p: 'פְּ',
  f: 'פְ',
  ts: 'צְ',
  r: 'רְ',
  sh: 'שְׁ',
}

const INSTRUCTIONS: Record<keyof typeof Q, string> = {
  rhyme: 'איזו מילה מתחרזת עם',
  clap: 'מחאו כף אחת לכל הברה במילה',
  cv: 'איזו מילה מתחילה ב',
  sound: 'איזו מילה מתחילה בצליל',
  closing: 'באיזה צליל נגמרת המילה',
  findLetter: 'איפה האות',
  nameLetter: 'איך קוראים לאות הזאת?',
  thisIs: 'זו האות',
  andSays: 'והיא אומרת',
  letterPicture: 'איזו תמונה מתחילה באות הזאת?',
  firstLetter: 'באיזו אות מתחילה המילה',
  finalOf: 'מה האות הסופית של',
  regularOf: 'של איזו אות זו האות הסופית?',
  lastLetter: 'איזו אות חסרה בסוף המילה',
  sameSound: 'איזו אות חסרה בתחילת המילה',
  sort: 'שימו כל תמונה בסל הנכון',
  check: 'בדיקה',
  reset: 'מהתחלה',
}

const blocks: Record<string, string> = {}
for (const w of WORDS) blocks[wordPhrase(w.id)] = w.text
for (const id of SYLLABLE_WORDS) {
  const w = WORDS.find(x => x.id === id)
  if (w) blocks[syllablesPhrase(id)] = w.syllables.join(' - ')
}
for (const l of LETTERS) blocks[letterPhrase(l.char)] = LETTER_NAMES[l.char] ?? l.char
for (const [sound, text] of Object.entries(SOUND_TEXT)) blocks[soundPhrase(sound as SoundId)] = text
for (const unit of CV_UNITS) blocks[cvPhrase(unit)] = unit
for (const key of Object.keys(Q) as (keyof typeof Q)[]) blocks[Q[key]] = INSTRUCTIONS[key]

export const phrases: PhraseMap = blocks
