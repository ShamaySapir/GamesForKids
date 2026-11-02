// Phrase-ID contract between content (T1) and generators (T2).
// English phrases go in `englishPhrases` in phrases.ts (spoken by an en-US voice, D17); Hebrew instructions in `phrases`.
//
// Content exports (T1), passed into generators by index.ts (T3):
//   content/words.ts      WORDS: readonly EngWord[]            ≥ 120, all topics; CVC ≥ 40, digraph ≥ 15, magic-e ≥ 12
//   content/chunks.ts     CHUNKS: readonly Chunk[] ≥ 15 · QAS: readonly QA[] ≥ 12
//   content/phonics.ts    MINIMAL_PAIRS ≥ 15 · MAGIC_PAIRS ≥ 12 · SIGHT_WORDS: readonly string[] ≈ 30
//   content/sentences.ts  SENTENCES: readonly EngSentence[] ≥ 25
// Letters are a–z, generated in code.

/** English (en-US) phrases. */
export const engWord = (id: string) => `eng.w.${id}`
export const engChunk = (id: string) => `eng.chunk.${id}`
export const engQuestion = (id: string) => `eng.qa.${id}`
/** An answer option of a QA, n = 0 (the answer), 1, 2 (wrong). */
export const engAnswer = (id: string, n: 0 | 1 | 2) => `eng.qa.${id}.${n}`
export const engSentence = (id: string) => `eng.s.${id}`
export const engSight = (word: string) => `eng.sight.${word}`
/** A letter's name ("bee"). */
export const engLetter = (letter: string) => `eng.letter.${letter}`
/**
 * A letter's sound, approximated so a TTS voice can say it ("buh", "sss"). The studio offers these and engBlend phrases for
 * optional recording, because a browser voice cannot say isolated sounds exactly.
 */
export const engSound = (sound: string) => `eng.sound.${sound}`
/** Onset + rime said apart ("kuh … at"), for the blend game; exists for every CVC word with a rime. */
export const engBlend = (wordId: string) => `eng.blend.${wordId}`

/** Hebrew instructions (recorded like other islands). */
export const E = {
  hearPick: 'eng.q.hearPick', //      "אֵיזוֹ תְּמוּנָה? הַקְשִׁיבוּ:" + English word
  chunk: 'eng.q.chunk', //            "מָתַי אוֹמְרִים אֶת זֶה?"
  answer: 'eng.q.answer', //          "מָה עוֹנִים?"
  rhyme: 'eng.q.rhyme', //            "מָה מִתְחָרֵז עִם…" + English word
  firstSound: 'eng.q.firstSound', //  "מָה מַתְחִיל בְּאוֹתוֹ צְלִיל כְּמוֹ…" + English word
  blend: 'eng.q.blend', //            "חַבְּרוּ אֶת הַצְּלִילִים:" + blend
  findLetter: 'eng.q.findLetter', //  "אֵיפֹה הָאוֹת…" + letter name
  bigSmall: 'eng.q.bigSmall', //      "מִצְאוּ אֶת הָאוֹת הַקְּטַנָּה"
  letterSound: 'eng.q.letterSound', // "אֵיזוֹ אוֹת עוֹשָׂה אֶת הַצְּלִיל…" + sound
  firstLetter: 'eng.q.firstLetter', // "בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּילָּה?" + English word
  readPicture: 'eng.q.readPicture', // "קִרְאוּ אֶת הַמִּילָּה וּבַחֲרוּ תְּמוּנָה"
  build: 'eng.q.build', //            "בְּנוּ אֶת הַמִּילָּה בְּאַנְגְּלִית"
  pairs: 'eng.q.pairs', //            "הַקְשִׁיבוּ טוֹב: אֵיזוֹ תְּמוּנָה?" + English word
  whichWord: 'eng.q.whichWord', //    "אֵיזוֹ מִילָּה שְׁמַעְתֶּם?" + English word
  sight: 'eng.q.sight', //            "אֵיפֹה כָּתוּב…" + English word
  sentence: 'eng.q.sentence', //      "קִרְאוּ אֶת הַמִּשְׁפָּט וּבַחֲרוּ תְּמוּנָה"
} as const
