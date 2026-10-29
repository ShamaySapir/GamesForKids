// Phrase-ID contract between content (T1), generators (T2) and games (T3).
// T1 declares every ID below in phrases.ts; words reuse the letters island's `hebrew.word.<id>` phrases.
//
// Content exports (T1), passed into generators by index.ts (T4):
//   content/units.ts      UNITS: readonly Unit[]          generated from the letters island's LETTERS
//   content/sentences.ts  SENTENCES: readonly Sentence[]
//   content/cloze.ts      CLOZES: readonly Cloze[]
//   content/stories.ts    STORIES: readonly Story[]
//   content/books.ts      BOOKS: readonly Book[]

export const unitPhrase = (key: string) => `reading.unit.${key}`
export const sentencePhrase = (id: string) => `reading.sentence.${id}`
export const clozePhrase = (id: string) => `reading.cloze.${id}`
export const storyPhrase = (id: string, n: number) => `reading.story.${id}.${n}`
export const pagePhrase = (bookId: string, page: number) => `reading.book.${bookId}.${page}`
export const bookQuestionPhrase = (bookId: string, q: number) => `reading.book.${bookId}.q${q}`
export const bookTitlePhrase = (bookId: string) => `reading.book.${bookId}.title`

/** Instructions and labels. */
export const R = {
  hearUnit: 'reading.q.hearUnit', //       "אֵיפֹה כָּתוּב…" + unit
  seeUnit: 'reading.q.seeUnit', //         "אֵיךְ קוֹרְאִים אֶת זֶה?"
  build: 'reading.q.build', //             "בְּנוּ אֶת הַמִּילָּה"
  readWord: 'reading.q.readWord', //       "קִרְאוּ אֶת הַמִּילָּה וּבַחֲרוּ תְּמוּנָה"
  pictureWord: 'reading.q.pictureWord', // "אֵיזוֹ מִילָּה מַתְאִימָה לַתְּמוּנָה?"
  sentence: 'reading.q.sentence', //       "קִרְאוּ אֶת הַמִּשְׁפָּט וּבַחֲרוּ תְּמוּנָה"
  cloze: 'reading.q.cloze', //             "אֵיזוֹ מִילָּה חֲסֵרָה?"
  order: 'reading.q.order', //             "סַדְּרוּ אֶת הַסִּפּוּר"
  readBook: 'reading.q.readBook', //       "בּוֹאוּ נִקְרָא יַחַד"
  slow: 'reading.ui.slow', //              "לְאַט"
  next: 'reading.ui.next', //              "הַבָּא"
  back: 'reading.ui.back', //              "הַקּוֹדֵם"
  questions: 'reading.ui.questions', //    "עַכְשָׁיו שְׁאֵלוֹת"
  check: 'reading.ui.check', //            "בְּדִיקָה"
} as const
