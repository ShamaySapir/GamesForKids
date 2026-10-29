import { pick, shuffle, type Rng } from '../../core/engine/random'
import type { GenContext } from '../../core/engine/types'
import { Q, cvPhrase, letterPhrase, soundPhrase, syllablesPhrase, wordPhrase } from './ids'
import type { ClapQ, Letter, PickOption, PickQ, SoundId, SortCard, SortQ, Word } from './types'

// Pure question generators, one per game. Content comes in as arguments. Tested in generators.test.ts.

/* ---------- helpers ---------- */

/** Review item first (when a candidate), then fresh items, then repeats; the first candidate `build` accepts wins. */
function make<T, R>(ctx: GenContext, items: readonly T[], key: (t: T) => string, build: (t: T) => R | null): R {
  const review = items.filter(i => key(i) === ctx.review)
  const rest = items.filter(i => key(i) !== ctx.review)
  const fresh = shuffle(ctx.rng, rest.filter(i => !ctx.avoid.has(key(i))))
  const stale = shuffle(ctx.rng, rest.filter(i => ctx.avoid.has(key(i))))
  for (const t of [...review, ...fresh, ...stale]) {
    const q = build(t)
    if (q) return q
  }
  throw new Error('no valid item to ask')
}

/** n distinct (by `key`) items, drawn tier by tier so earlier tiers are preferred; null when there aren't enough. */
function take<T>(rng: Rng, tiers: readonly (readonly T[])[], n: number, key: (t: T) => string, taken: readonly string[] = []): T[] | null {
  const seen = new Set(taken)
  const out: T[] = []
  for (const tier of tiers)
    for (const t of shuffle(rng, tier)) {
      if (out.length < n && !seen.has(key(t))) {
        seen.add(key(t))
        out.push(t)
      }
    }
  return out.length === n ? out : null
}

const isHebrewLetter = (c: string | undefined) => !!c && c >= 'א' && c <= 'ת'
const DOTS = /[ּׁׂ]/

/** Dagesh/shin dots in a canonical order, so 'שׁ' compares equal however it was typed. */
export const normLetter = (s: string) => s[0] + [...s.slice(1)].filter(c => DOTS.test(c)).sort().join('')

/** First letter of a word with its dagesh/shin dot: 'כַּדּוּר' → 'כּ'. */
export function firstLetter(text: string): string {
  let end = 1
  while (end < text.length && !isHebrewLetter(text[end])) end++
  return normLetter(text.slice(0, end))
}

/** The word without its first letter (and that letter's nikud), so the blank hides the whole letter. */
const withoutFirst = (text: string) => {
  const i = [...text].findIndex((c, n) => n > 0 && isHebrewLetter(c))
  return i < 0 ? '' : text.slice(i)
}

const lastLetterIndex = (text: string) => {
  for (let i = text.length - 1; i >= 0; i--) if (isHebrewLetter(text[i])) return i
  return -1
}

const VOWELS: Record<string, string> = {
  'ְ': '0', 'ֱ': 'e', 'ֲ': 'a', 'ֳ': 'o', 'ִ': 'i', 'ֵ': 'e', 'ֶ': 'e',
  'ַ': 'a', 'ָ': 'a', 'ֹ': 'o', 'ֺ': 'o', 'ֻ': 'u',
}
/** Vowel as it sounds: patah=kamatz, tsere=segol, shuruk=kubutz. */
function vowelClass(unit: string): string {
  const rest = unit.slice(1)
  if (rest.includes('וּ')) return 'u'
  for (const c of rest) if (VOWELS[c]) return VOWELS[c]
  return ''
}
/** What a child hears at the start of a word: two words with the same key open with the same unit. */
const cvKey = (w: Word) => `${w.first ?? ''}|${vowelClass(w.opening)}`

const pictureOpt = (w: Word): PickOption => ({ id: w.id, kind: 'picture', emoji: w.emoji, say: wordPhrase(w.id) })
const letterOpt = (char: string): PickOption => ({ id: char, kind: 'letter', label: char })
const soundOpt = (s: SoundId, label: string): PickOption => ({ id: s, kind: 'sound', label, say: soundPhrase(s) })

function pickQ(ctx: GenContext, q: PickQ): PickQ {
  return { ...q, options: shuffle(ctx.rng, q.options) }
}

/* ---------- 1. rhyme ---------- */

const rhymeItems = (words: readonly Word[]) => words.filter(w => w.rhyme && words.some(x => x.id !== w.id && x.rhyme === w.rhyme))
export const rhymeAccepts = (words: readonly Word[]) => (key: string) => rhymeItems(words).some(w => w.id === key)

export function rhymeQuestion(ctx: GenContext, words: readonly Word[]): PickQ {
  return make(ctx, rhymeItems(words), w => w.id, target => {
    const answer = pick(ctx.rng, words.filter(w => w.id !== target.id && w.rhyme === target.rhyme))
    // A distractor with no rhyme group could rhyme for real, so only words known to rhyme elsewhere qualify.
    const others = words.filter(w => w.rhyme && w.rhyme !== target.rhyme)
    const wrong = take(ctx.rng, [others.filter(w => w.first && w.first === target.first), others], 2, w => w.id)
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: target.id, answer: answer.id, say: [Q.rhyme, wordPhrase(target.id)], instruction: Q.rhyme,
      prompt: { picture: target.emoji }, options: [answer, ...wrong].map(pictureOpt),
      hint: [wordPhrase(target.id), wordPhrase(answer.id)],
    })
  })
}

/* ---------- 2. syllables ---------- */

const syllableItems = (words: readonly Word[], syllableWords: readonly string[]) => words.filter(w => syllableWords.includes(w.id))
export const syllablesAccepts = (words: readonly Word[], syllableWords: readonly string[]) => (key: string) =>
  syllableItems(words, syllableWords).some(w => w.id === key)

export function syllablesQuestion(ctx: GenContext, words: readonly Word[], syllableWords: readonly string[]): ClapQ {
  return make(ctx, syllableItems(words, syllableWords), w => w.id, word => ({
    itemKey: word.id, answer: word.syllables.length, say: [Q.clap, wordPhrase(word.id)], word, syllablesSay: syllablesPhrase(word.id),
  }))
}

/* ---------- 3. opening consonant + vowel ---------- */

const cvItems = (words: readonly Word[], cvUnits: readonly string[]) => cvUnits.filter(u => words.some(w => w.opening === u))
export const cvAccepts = (words: readonly Word[], cvUnits: readonly string[]) => (key: string) => cvItems(words, cvUnits).includes(key)

export function openingCvQuestion(ctx: GenContext, words: readonly Word[], cvUnits: readonly string[]): PickQ {
  return make(ctx, cvItems(words, cvUnits), u => u, unit => {
    const answer = pick(ctx.rng, words.filter(w => w.opening === unit))
    const k = cvKey(answer)
    const pool = words.filter(w => cvKey(w) !== k)
    // Same consonant with another vowel, or another consonant with the same vowel, are the interesting mistakes.
    const near = pool.filter(w => (w.first !== null && w.first === answer.first) || vowelClass(w.opening) === vowelClass(unit))
    const wrong = take(ctx.rng, [near, pool], 3, cvKey, [k])
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: unit, answer: answer.id, say: [Q.cv, cvPhrase(unit)], instruction: Q.cv, prompt: {}, options: [answer, ...wrong].map(pictureOpt),
    })
  })
}

/* ---------- 4. opening sound ---------- */

/** Level A: sounds that can be stretched (sh z s l r m n x); level B: every consonant sound. */
export type SoundLevel = 'A' | 'B'
export const CONTINUOUS_SOUNDS: readonly SoundId[] = ['sh', 'z', 's', 'l', 'r', 'm', 'n', 'x']

/** Vowel-initial words have no opening consonant sound, and level A stays with continuous sounds. */
const soundPool = (words: readonly Word[], level: SoundLevel) =>
  words.filter(w => w.first !== null && (level === 'B' || CONTINUOUS_SOUNDS.includes(w.first)))
const soundItems = (words: readonly Word[], level: SoundLevel) => [...new Set(soundPool(words, level).map(w => w.first!))]
export const openingSoundAccepts = (words: readonly Word[], level: SoundLevel) => (key: string) => soundItems(words, level).includes(key as SoundId)

export function openingSoundQuestion(ctx: GenContext, words: readonly Word[], level: SoundLevel): PickQ {
  const pool = soundPool(words, level)
  return make(ctx, soundItems(words, level), s => s, sound => {
    const answer = pick(ctx.rng, pool.filter(w => w.first === sound))
    const wrong = take(ctx.rng, [pool.filter(w => w.first !== sound)], 3, w => w.first!)
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: sound, answer: answer.id, say: [Q.sound, soundPhrase(sound)], instruction: Q.sound, prompt: {}, options: [answer, ...wrong].map(pictureOpt),
    })
  })
}

/* ---------- 5. closing sound ---------- */

const closingItems = (words: readonly Word[]) => words.filter(w => w.last !== null)
export const closingAccepts = (words: readonly Word[]) => (key: string) => closingItems(words).some(w => w.id === key)

export function closingSoundQuestion(ctx: GenContext, words: readonly Word[], soundLabel: Record<SoundId, string>): PickQ {
  const sounds = Object.keys(soundLabel) as SoundId[]
  return make(ctx, closingItems(words), w => w.id, word => {
    const last = word.last!
    // Distinct labels too: two sounds drawn with the same letter would look identical.
    const wrong = take(ctx.rng, [sounds.filter(s => s !== last)], 2, s => soundLabel[s], [soundLabel[last]])
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: word.id, answer: last, say: [Q.closing, wordPhrase(word.id)], instruction: Q.closing, prompt: { picture: word.emoji },
      options: [last, ...wrong].map(s => soundOpt(s, soundLabel[s])), hint: wordPhrase(word.id),
    })
  })
}

/* ---------- 6–9. letter names ---------- */

const ALPHABET = 'אבגדהוזחטיכלמנסעפצקרשת'
/** Alphabetical groups of the 22 regular letters, as [from, to] inclusive: א–ה, ו–י, כ–ס, ע–ת. */
export const LETTER_GROUPS = [['א', 'ה'], ['ו', 'י'], ['כ', 'ס'], ['ע', 'ת']] as const
export type LetterGroup = 0 | 1 | 2 | 3

export function letterGroup(letters: readonly Letter[], group: LetterGroup): Letter[] {
  const [from, to] = LETTER_GROUPS[group]
  const [a, b] = [ALPHABET.indexOf(from), ALPHABET.indexOf(to)]
  return letters
    .filter(l => !l.regular && ALPHABET.indexOf(l.char) >= a && ALPHABET.indexOf(l.char) <= b)
    .sort((x, y) => ALPHABET.indexOf(x.char) - ALPHABET.indexOf(y.char))
}
export const letterAccepts = (letters: readonly Letter[], group: LetterGroup) => (key: string) => letterGroup(letters, group).some(l => l.char === key)

const isRegular = (l: Letter) => !l.regular

/** Wrong letters for `target`, look-alikes first, then its own group, then any letter. Its final/regular twin is never a distractor. */
function letterTiers(letters: readonly Letter[], group: LetterGroup, target: Letter): Letter[][] {
  const ok = letters.filter(l => l.char !== target.char && l.name !== target.name && l.char !== target.final && l.regular !== target.char)
  const alike = ok.filter(l => target.lookAlike.includes(l.char) || l.lookAlike.includes(target.char))
  const own = letterGroup(letters, group)
  return [alike, ok.filter(l => own.includes(l)), ok.filter(isRegular)]
}

const letterHint = (l: Letter): string[] => [Q.thisIs, letterPhrase(l.char), ...(l.sound ? [Q.andSays, soundPhrase(l.sound)] : [])]

/** Game A: hear a letter's name, find it among 4 letters. */
export function findLetterQuestion(ctx: GenContext, letters: readonly Letter[], group: LetterGroup): PickQ {
  return make(ctx, letterGroup(letters, group), l => l.char, target => {
    const wrong = take(ctx.rng, letterTiers(letters, group, target), 3, l => l.char)
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: target.char, answer: target.char, say: [Q.findLetter, letterPhrase(target.char)], instruction: Q.findLetter, prompt: {},
      options: [target, ...wrong].map(l => letterOpt(l.char)), hint: letterHint(target),
    })
  })
}

/** Game B: see a big letter, pick its name from 3 buttons that show and say the name. */
export function nameLetterQuestion(ctx: GenContext, letters: readonly Letter[], group: LetterGroup): PickQ {
  const btn = (l: Letter): PickOption => ({ id: l.char, kind: 'sound', say: letterPhrase(l.char) })
  return make(ctx, letterGroup(letters, group), l => l.char, target => {
    const wrong = take(ctx.rng, letterTiers(letters, group, target), 2, l => l.name, [target.name])
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: target.char, answer: target.char, say: Q.nameLetter, instruction: Q.nameLetter, prompt: { letter: target.char },
      options: [target, ...wrong].map(btn), hint: letterHint(target),
    })
  })
}

/* ---------- 10. letter ↔ picture ---------- */

/** Words whose first letter is `char`; vowel-initial words are left to the same-sound skill. */
const startingWith = (words: readonly Word[], char: string) => words.filter(w => w.first !== null && w.text[0] === char)

const letterToPictureItems = (letters: readonly Letter[], words: readonly Word[]) =>
  letters.filter(l => isRegular(l) && startingWith(words, l.char).length)
export const letterToPictureAccepts = (letters: readonly Letter[], words: readonly Word[]) => (key: string) =>
  letterToPictureItems(letters, words).some(l => l.char === key)

/** Game A: see a letter, pick the picture whose word starts with it, 1 of 4. */
export function letterToPictureQuestion(ctx: GenContext, letters: readonly Letter[], words: readonly Word[]): PickQ {
  return make(ctx, letterToPictureItems(letters, words), l => l.char, letter => {
    const answer = pick(ctx.rng, startingWith(words, letter.char))
    // Neither the letter itself nor its sound may open a wrong picture (כ and ק, ט and ת share sounds).
    const pool = words.filter(w => w.first !== null && w.text[0] !== letter.char && w.first !== answer.first && w.first !== letter.sound)
    const wrong = take(ctx.rng, [pool], 3, w => w.first!)
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: letter.char, answer: answer.id, say: Q.letterPicture, instruction: Q.letterPicture, prompt: { letter: letter.char },
      options: [answer, ...wrong].map(pictureOpt), hint: [Q.thisIs, letterPhrase(letter.char), Q.andSays, soundPhrase(answer.first!)],
    })
  })
}

const pictureToLetterItems = (letters: readonly Letter[], words: readonly Word[]) =>
  words.filter(w => w.first !== null && letters.some(l => isRegular(l) && l.char === w.text[0]))
export const pictureToLetterAccepts = (letters: readonly Letter[], words: readonly Word[]) => (key: string) =>
  pictureToLetterItems(letters, words).some(w => w.id === key)

/** Game B: see a picture, pick its first letter from 4. */
export function pictureToLetterQuestion(ctx: GenContext, letters: readonly Letter[], words: readonly Word[]): PickQ {
  return make(ctx, pictureToLetterItems(letters, words), w => w.id, word => {
    const answer = letters.find(l => isRegular(l) && l.char === word.text[0])!
    const sounds = (l: Letter) => l.sound ?? l.char
    // A look-alike that sounds like the answer (ח for כ) would sound right, so same-sound letters are never distractors.
    const ok = letters.filter(l => isRegular(l) && l.char !== answer.char && l.sound !== answer.sound && l.sound !== word.first)
    const wrong = take(ctx.rng, [ok.filter(l => answer.lookAlike.includes(l.char)), ok], 3, sounds, [sounds(answer)])
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: word.id, answer: answer.char, say: [Q.firstLetter, wordPhrase(word.id)], instruction: Q.firstLetter, prompt: { picture: word.emoji },
      options: [answer, ...wrong].map(l => letterOpt(l.char)), hint: wordPhrase(word.id),
    })
  })
}

/* ---------- 11. finals ---------- */

const finalItems = (letters: readonly Letter[]) => letters.filter(l => l.final && letters.some(f => f.char === l.final))
export const finalsAccepts = (letters: readonly Letter[]) => (key: string) => finalItems(letters).some(l => l.char === key)

/** Game A: regular → pick its final form, or final → pick the regular letter (direction chosen at random). */
export function finalsFormQuestion(ctx: GenContext, letters: readonly Letter[]): PickQ {
  const withFinal = finalItems(letters)
  return make(ctx, withFinal, l => l.char, regular => {
    const final = regular.final!
    if (ctx.rng() < 0.5) {
      const wrong = take(ctx.rng, [withFinal.filter(l => l.char !== regular.char).map(l => l.final!)], 3, c => c)
      if (!wrong) return null
      return pickQ(ctx, {
        itemKey: regular.char, answer: final, say: [Q.finalOf, letterPhrase(regular.char)], instruction: Q.finalOf, prompt: { letter: regular.char },
        options: [final, ...wrong].map(letterOpt), hint: letterPhrase(final),
      })
    }
    const alike = letters.filter(l => isRegular(l) && l.char !== regular.char && (regular.lookAlike.includes(l.char) || l.lookAlike.includes(regular.char)))
    const wrong = take(ctx.rng, [withFinal.filter(l => l.char !== regular.char), alike], 3, l => l.char)
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: regular.char, answer: regular.char, say: Q.regularOf, instruction: Q.regularOf, prompt: { letter: final },
      options: [regular, ...wrong].map(l => letterOpt(l.char)), hint: letterPhrase(regular.char),
    })
  })
}

const endsInFinal = (letters: readonly Letter[], w: Word) => {
  const i = lastLetterIndex(w.text)
  return i >= 0 && letters.some(l => l.char === w.text[i] && l.regular && letters.some(r => r.char === l.regular))
}
export const finalsWordAccepts = (letters: readonly Letter[], words: readonly Word[]) => (key: string) =>
  words.some(w => w.id === key && endsInFinal(letters, w))

/** Game B: a picture and its word missing the last letter; pick the final form (its regular twin is among the options). */
export function finalsWordQuestion(ctx: GenContext, letters: readonly Letter[], words: readonly Word[]): PickQ {
  return make(ctx, words.filter(w => endsInFinal(letters, w)), w => w.id, word => {
    const i = lastLetterIndex(word.text)
    const final = letters.find(l => l.char === word.text[i])!
    const regular = letters.find(l => l.char === final.regular)!
    const ok = letters.filter(l => l.char !== final.char && l.char !== regular.char && (l.sound === undefined || l.sound !== word.last))
    const alike = ok.filter(l => regular.lookAlike.includes(l.char) || l.lookAlike.includes(regular.char))
    const wrong = take(ctx.rng, [alike, ok], 2, l => l.char)
    if (!wrong) return null
    return pickQ(ctx, {
      itemKey: word.id, answer: final.char, say: [Q.lastLetter, wordPhrase(word.id)], instruction: Q.lastLetter,
      prompt: { picture: word.emoji, word: { text: word.text.slice(0, i), blank: 'end' } },
      options: [final, regular, ...wrong].map(l => letterOpt(l.char)), hint: wordPhrase(word.id),
    })
  })
}

/* ---------- 12. same-sound letters ---------- */

/** Word-ID groups keyed by their letters with dots, e.g. 'ט/תּ', 'ס/שׂ', 'א/ע/ה'. */
export type WordGroups = Readonly<Record<string, readonly string[]>>

function sameSoundItems(words: readonly Word[], groups: WordGroups): { word: Word; letters: string[] }[] {
  const out: { word: Word; letters: string[] }[] = []
  for (const [key, ids] of Object.entries(groups)) {
    const letters = key.split('/').map(normLetter)
    for (const w of words) if (ids.includes(w.id) && letters.includes(firstLetter(w.text)) && !out.some(o => o.word.id === w.id)) out.push({ word: w, letters })
  }
  return out
}
export const sameSoundAccepts = (words: readonly Word[], groups: WordGroups) => (key: string) => sameSoundItems(words, groups).some(i => i.word.id === key)

export function sameSoundQuestion(ctx: GenContext, words: readonly Word[], groups: WordGroups): PickQ {
  return make(ctx, sameSoundItems(words, groups), i => i.word.id, ({ word, letters }) =>
    pickQ(ctx, {
      itemKey: word.id, answer: firstLetter(word.text), say: [Q.sameSound, wordPhrase(word.id)], instruction: Q.sameSound,
      prompt: { picture: word.emoji, word: { text: withoutFirst(word.text), blank: 'start' } },
      options: letters.map(letterOpt), hint: wordPhrase(word.id),
    }),
  )
}

/* ---------- 13. dagesh and shin dot ---------- */

/** One pair per board: [with dagesh / left dot, without / right dot]. */
export const DAGESH_BOARDS = [['בּ', 'ב'], ['כּ', 'כ'], ['פּ', 'פ'], ['שׁ', 'שׂ']] as const
const boardKey = (pair: readonly [string, string]) => `${pair[0]}/${pair[1]}`

/** `groups` is keyed by the eight bin labels ('בּ', 'ב', …), each holding word IDs. */
export function dageshQuestion(ctx: GenContext, words: readonly Word[], groups: WordGroups): SortQ {
  const binWords = (label: string) => {
    const ids = Object.entries(groups).find(([k]) => normLetter(k) === normLetter(label))?.[1] ?? []
    return words.filter(w => ids.includes(w.id))
  }
  const sides = (pair: readonly [string, string]) => {
    const [x, y] = [binWords(pair[0]), binWords(pair[1])]
    return [x.filter(w => !y.includes(w)), y.filter(w => !x.includes(w))]
  }
  const boards = DAGESH_BOARDS.filter(p => sides(p).every(s => s.length >= 3))
  if (!boards.length) throw new Error('no valid dagesh board')
  // Boards are keyed by pair plus cards, so "avoid" and "review" match on the pair: a round shows three different pairs.
  const used = (p: readonly [string, string]) => [...ctx.avoid].some(k => k.startsWith(boardKey(p) + ':'))
  const reviewed = boards.find(p => ctx.review?.startsWith(boardKey(p) + ':'))
  const fresh = boards.filter(p => !used(p))
  const pair = reviewed ?? pick(ctx.rng, fresh.length ? fresh : boards)
  const cards: SortCard[] = sides(pair).flatMap((side, bin) =>
    shuffle(ctx.rng, side).slice(0, 3).map(w => ({ id: w.id, emoji: w.emoji, text: w.text, say: wordPhrase(w.id), bin: bin as 0 | 1 })))
  return {
    itemKey: `${boardKey(pair)}:${cards.map(c => c.id).sort().join('+')}`, answer: null, say: Q.sort,
    bins: [pair[0], pair[1]], cards: shuffle(ctx.rng, cards),
  }
}
