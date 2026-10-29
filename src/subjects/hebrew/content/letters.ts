import { letterPhrase } from '../ids'
import type { Letter, SoundId } from '../types'

// Alphabetical; each final letter comes right after its regular letter (כ ך, מ ם, נ ן, פ ף, צ ץ).
// A letter's main sound is the one taught first: כ is 'k' (כּ) while its final ך only exists as 'x'; פ is 'p', ף is 'f'.
// ב is 'b' and ו is 'v'; א and ע have no sound of their own. Look-alikes are symmetric.
export const LETTERS: readonly Letter[] = [
  { char: 'א', name: letterPhrase('א'), lookAlike: [] },
  { char: 'ב', name: letterPhrase('ב'), sound: 'b', lookAlike: ['כ'] },
  { char: 'ג', name: letterPhrase('ג'), sound: 'g', lookAlike: ['נ'] },
  { char: 'ד', name: letterPhrase('ד'), sound: 'd', lookAlike: ['ר', 'ך'] },
  { char: 'ה', name: letterPhrase('ה'), sound: 'h', lookAlike: ['ח', 'ת'] },
  { char: 'ו', name: letterPhrase('ו'), sound: 'v', lookAlike: ['ז', 'ן'] },
  { char: 'ז', name: letterPhrase('ז'), sound: 'z', lookAlike: ['ו', 'ן'] },
  { char: 'ח', name: letterPhrase('ח'), sound: 'x', lookAlike: ['ה', 'ת'] },
  { char: 'ט', name: letterPhrase('ט'), sound: 't', lookAlike: ['מ'] },
  { char: 'י', name: letterPhrase('י'), sound: 'y', lookAlike: [] },
  { char: 'כ', name: letterPhrase('כ'), sound: 'k', final: 'ך', lookAlike: ['ב'] },
  { char: 'ך', name: letterPhrase('ך'), sound: 'x', regular: 'כ', lookAlike: ['ר', 'ד'] },
  { char: 'ל', name: letterPhrase('ל'), sound: 'l', lookAlike: [] },
  { char: 'מ', name: letterPhrase('מ'), sound: 'm', final: 'ם', lookAlike: ['ט'] },
  { char: 'ם', name: letterPhrase('ם'), sound: 'm', regular: 'מ', lookAlike: ['ס'] },
  { char: 'נ', name: letterPhrase('נ'), sound: 'n', final: 'ן', lookAlike: ['ג'] },
  { char: 'ן', name: letterPhrase('ן'), sound: 'n', regular: 'נ', lookAlike: ['ו', 'ז'] },
  { char: 'ס', name: letterPhrase('ס'), sound: 's', lookAlike: ['ם'] },
  { char: 'ע', name: letterPhrase('ע'), lookAlike: ['צ'] },
  { char: 'פ', name: letterPhrase('פ'), sound: 'p', final: 'ף', lookAlike: [] },
  { char: 'ף', name: letterPhrase('ף'), sound: 'f', regular: 'פ', lookAlike: [] },
  { char: 'צ', name: letterPhrase('צ'), sound: 'ts', final: 'ץ', lookAlike: ['ע'] },
  { char: 'ץ', name: letterPhrase('ץ'), sound: 'ts', regular: 'צ', lookAlike: [] },
  { char: 'ק', name: letterPhrase('ק'), sound: 'k', lookAlike: [] },
  { char: 'ר', name: letterPhrase('ר'), sound: 'r', lookAlike: ['ד', 'ך'] },
  { char: 'ש', name: letterPhrase('ש'), sound: 'sh', lookAlike: [] },
  { char: 'ת', name: letterPhrase('ת'), sound: 't', lookAlike: ['ה', 'ח'] },
]

/** The letter shown on a sound button. Ambiguous sounds use the letter taught first: 'x' → ח, 't' → ת, 'k' → ק, 's' → ס. */
export const SOUND_LABEL: Record<SoundId, string> = {
  b: 'בּ', v: 'ב', g: 'ג', d: 'ד', h: 'ה', z: 'ז', x: 'ח', t: 'ת', y: 'י', k: 'ק',
  l: 'ל', m: 'מ', n: 'נ', s: 'ס', p: 'פּ', f: 'פ', ts: 'צ', r: 'ר', sh: 'שׁ',
}
