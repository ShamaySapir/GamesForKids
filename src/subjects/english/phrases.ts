import type { PhraseMap } from '../../core/engine/types'
import { CHUNKS, QAS } from './content/chunks'
import { MAGIC_PAIRS, SIGHT_WORDS } from './content/phonics'
import { SENTENCES } from './content/sentences'
import { WORDS } from './content/words'
import { E, engAnswer, engBlend, engChunk, engLetter, engMagic, engQuestion, engSentence, engSight, engSound, engWord } from './ids'

// Hebrew instructions: recorded like the other islands. The English word, letter or sound that follows is a separate
// English phrase (spoken by the browser voice, D17).
export const phrases: PhraseMap = {
  [E.hearPick]: 'אֵיזוֹ תְּמוּנָה? הַקְשִׁיבוּ:',
  [E.chunk]: 'מָתַי אוֹמְרִים אֶת זֶה?',
  [E.answer]: 'מָה עוֹנִים?',
  [E.rhyme]: 'מָה מִתְחָרֵז עִם',
  [E.firstSound]: 'מָה מַתְחִיל בְּאוֹתוֹ צְלִיל כְּמוֹ',
  [E.blend]: 'חַבְּרוּ אֶת הַצְּלִילִים:',
  [E.findLetter]: 'אֵיפֹה הָאוֹת',
  [E.bigSmall]: 'מִצְאוּ אֶת הָאוֹת הַקְּטַנָּה הַמַּתְאִימָה',
  [E.letterSound]: 'אֵיזוֹ אוֹת עוֹשָׂה אֶת הַצְּלִיל',
  [E.firstLetter]: 'בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּילָּה',
  [E.readPicture]: 'קִרְאוּ אֶת הַמִּילָּה וּבַחֲרוּ תְּמוּנָה',
  [E.build]: 'בְּנוּ אֶת הַמִּילָּה בְּאַנְגְּלִית',
  [E.pairs]: 'הַקְשִׁיבוּ טוֹב: אֵיזוֹ תְּמוּנָה?',
  [E.whichWord]: 'אֵיזוֹ מִילָּה שְׁמַעְתֶּם?',
  [E.sight]: 'אֵיפֹה כָּתוּב',
  [E.sentence]: 'קִרְאוּ אֶת הַמִּשְׁפָּט וּבַחֲרוּ תְּמוּנָה',
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

// Isolated sounds written so a TTS voice comes close ("buh"); the studio offers them for optional recording.
const SOUNDS: Record<string, string> = {
  a: 'aah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fuh', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'luh', m: 'mmm',
  n: 'nuh', o: 'ah', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vuh', w: 'wuh', x: 'kss', y: 'yuh', z: 'zuh',
  sh: 'shh', ch: 'chuh', th: 'th',
}

// Rimes respelled so a TTS voice reads them as a sound, not as spelled-out letters; other rimes are said as written.
const RIME_TTS: Record<string, string> = {
  ap: 'app', ag: 'agg', ab: 'abb', ad: 'add', et: 'ett', eg: 'egg', eb: 'ebb', ig: 'igg', im: 'imm', ix: 'icks', og: 'ogg', ot: 'ott',
  op: 'opp', ug: 'ugg', un: 'unn', ut: 'utt', ub: 'ubb', om: 'ahm', ed: 'ed', id: 'idd',
}

/** A word's onset when a single letter or sh/ch/th, else undefined (blend phrases exist only for those). */
const blendOnset = (word: string, rime: string): string | undefined => {
  const onset = word.slice(0, word.length - rime.length)
  return onset.length === 1 || onset === 'sh' || onset === 'ch' || onset === 'th' ? onset : undefined
}

const entries = (pairs: Iterable<readonly [string, string]>): Record<string, string> => Object.fromEntries(pairs)

export const englishPhrases: PhraseMap = {
  ...entries(WORDS.map(w => [engWord(w.id), w.word] as const)),
  ...entries(CHUNKS.map(c => [engChunk(c.id), c.text] as const)),
  ...entries(QAS.flatMap(q => [
    [engQuestion(q.id), q.question] as const,
    [engAnswer(q.id, 0), q.answer] as const,
    [engAnswer(q.id, 1), q.wrong[0]] as const,
    [engAnswer(q.id, 2), q.wrong[1]] as const,
  ])),
  ...entries(SENTENCES.map(s => [engSentence(s.id), s.text] as const)),
  ...entries(MAGIC_PAIRS.flatMap(p => [[engMagic(p.short), p.short] as const, [engMagic(p.long), p.long] as const])),
  ...entries(SIGHT_WORDS.map(w => [engSight(w), w] as const)),
  ...entries(LETTERS.map(l => [engLetter(l), l === 'a' ? 'ay' : l.toUpperCase()] as const)),
  ...entries(Object.entries(SOUNDS).map(([s, text]) => [engSound(s), text] as const)),
  ...entries(WORDS.flatMap(w => {
    if (!w.rime) return []
    const onset = blendOnset(w.word, w.rime)
    return onset ? [[engBlend(w.id), `${SOUNDS[onset]} … ${RIME_TTS[w.rime] ?? w.rime}`] as const] : []
  })),
}
