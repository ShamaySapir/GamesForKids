import { LETTERS } from '../../hebrew/content/letters'
import type { SoundId } from '../../hebrew/types'
import type { Unit, Vowel } from '../types'

type OnsetSound = Exclude<SoundId, 'h'>

const DAGESH = 'ּ'
const SHIN_DOT = 'ׁ'

// One representative letter per sound, with the marks that make the sound. ו is never used for 'v': ו + shuruk
// would read as /u/, so ב without dagesh stands for 'v'. כּ stands for 'k' (the letters island teaches ק too).
const ONSET: Record<OnsetSound, string> = {
  b: `ב${DAGESH}`, v: 'ב', g: 'ג', d: 'ד', z: 'ז', x: 'ח', t: 'ת', y: 'י', k: `כ${DAGESH}`,
  l: 'ל', m: 'מ', n: 'נ', s: 'ס', p: `פ${DAGESH}`, f: 'פ', ts: 'צ', r: 'ר', sh: `ש${SHIN_DOT}`,
}

const PATACH = 'ַ'
const QAMATS = 'ָ'
const HIRIQ = 'ִ'
const HOLAM = 'ֹ'
const QUBUTS = 'ֻ'
const TSERE = 'ֵ'
const SEGOL = 'ֶ'

// Vowel sign and vowel-letter spellings of each vowel; each is appended to the consonant with its marks.
const VOWELS: Record<Vowel, readonly string[]> = {
  a: [PATACH, QAMATS],
  i: [HIRIQ, `${HIRIQ}י`],
  o: [HOLAM, `ו${HOLAM}`],
  u: [QUBUTS, `ו${DAGESH}`],
  e: [TSERE, SEGOL, `${TSERE}י`],
}

const VOWEL_ORDER: readonly Vowel[] = ['a', 'i', 'o', 'u', 'e']

const SOUNDS = [...new Set(LETTERS.flatMap(l => (l.sound && l.sound !== 'h' ? [l.sound] : [])))] as OnsetSound[]

// NFC puts vowel signs before dagesh and shin dot, which is how the letters island stores its text.
export const UNITS: readonly Unit[] = SOUNDS.flatMap(sound =>
  VOWEL_ORDER.map(vowel => ({
    key: `${sound}-${vowel}`,
    sound,
    vowel,
    spellings: VOWELS[vowel].map(v => (ONSET[sound] + v).normalize('NFC')),
    letter: ONSET[sound].charAt(0),
  })),
)
