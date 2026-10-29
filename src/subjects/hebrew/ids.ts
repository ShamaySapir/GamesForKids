import type { SoundId } from './types'

// Phrase-ID contract between content (T1), generators (T2) and games (T3).
// T1 must declare every ID below in phrases.ts; T2/T3 must use only these helpers and constants.
//
// Content exports (T1), imported by index.ts in T4 and passed into generators as arguments:
//   content/letters.ts  LETTERS: readonly Letter[]           22 regular letters + 5 finals, alphabetical
//                       SOUND_LABEL: Record<SoundId, string>  letter shown on a sound button ('x' → 'ח')
//   content/words.ts    WORDS: readonly Word[]
//                       CV_UNITS: readonly string[]          opening units used by the opening-cv skill (~25)
//                       SYLLABLE_WORDS: readonly string[]    word IDs with a syllable-by-syllable phrase (~40)

export const wordPhrase = (wordId: string) => `hebrew.word.${wordId}`
/** The word said syllable by syllable ("כַּ… דּוּר"). Exists only for SYLLABLE_WORDS. */
export const syllablesPhrase = (wordId: string) => `hebrew.syl.${wordId}`
/** A letter's name ("כַּף"). Key is the base letter or final form character. */
export const letterPhrase = (char: string) => `hebrew.letter.${char}`
/** An isolated consonant sound ("מְ"). */
export const soundPhrase = (sound: SoundId) => `hebrew.sound.${sound}`
/** A consonant+vowel unit ("סִי"). Exists only for CV_UNITS. */
export const cvPhrase = (unit: string) => `hebrew.cv.${unit}`

/** Instructions and UI labels. Spoken instruction = the phrase, often followed by a word/letter/sound phrase. */
export const Q = {
  rhyme: 'hebrew.q.rhyme', //           "איזו מילה מתחרזת עם…" + word
  clap: 'hebrew.q.clap', //             "מחאו כף אחת לכל הברה במילה" + word
  cv: 'hebrew.q.cv', //                 "איזו מילה מתחילה ב…" + cv unit
  sound: 'hebrew.q.sound', //           "איזו מילה מתחילה בצליל…" + sound
  closing: 'hebrew.q.closing', //       "באיזה צליל נגמרת המילה…" + word
  findLetter: 'hebrew.q.findLetter', // "איפה האות…" + letter name
  nameLetter: 'hebrew.q.nameLetter', // "איך קוראים לאות הזאת?"
  thisIs: 'hebrew.q.thisIs', //         "זו האות" (aid: + name + andSays + sound)
  andSays: 'hebrew.q.andSays', //       "והיא אומרת"
  letterPicture: 'hebrew.q.letterPicture', // "איזו תמונה מתחילה באות הזאת?"
  firstLetter: 'hebrew.q.firstLetter', //     "באיזו אות מתחילה המילה…" + word
  finalOf: 'hebrew.q.finalOf', //       "מה האות הסופית של…" + letter name
  regularOf: 'hebrew.q.regularOf', //   "של איזו אות זו האות הסופית?"
  lastLetter: 'hebrew.q.lastLetter', // "איזו אות חסרה בסוף המילה…" + word
  sameSound: 'hebrew.q.sameSound', //   "איזו אות חסרה בתחילת המילה…" + word
  sort: 'hebrew.q.sort', //             "שימו כל תמונה בסל הנכון"
  check: 'hebrew.ui.check', //          "בדיקה"
  reset: 'hebrew.ui.reset', //          "מהתחלה"
} as const
