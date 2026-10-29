import type { PhraseMap } from '../../core/engine/types'
import { BOOKS } from './content/books'
import { CLOZES } from './content/cloze'
import { SENTENCES } from './content/sentences'
import { STORIES } from './content/stories'
import { UNITS } from './content/units'
import { R, bookQuestionPhrase, bookTitlePhrase, clozePhrase, pagePhrase, sentencePhrase, storyPhrase, unitPhrase } from './ids'

// One recording per entry (docs/DECISIONS.md D3). Everything carries nikud: this island's readers are learning it.
// Words reuse the letters island's `hebrew.word.*` phrases.

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ')

const instructions: Record<string, string> = {
  [R.hearUnit]: 'אֵיפֹה כָּתוּב',
  [R.seeUnit]: 'אֵיךְ קוֹרְאִים אֶת זֶה?',
  [R.build]: 'בְּנוּ אֶת הַמִּילָּה',
  [R.readWord]: 'קִרְאוּ אֶת הַמִּילָּה וּבַחֲרוּ תְּמוּנָה',
  [R.pictureWord]: 'אֵיזוֹ מִילָּה מַתְאִימָה לַתְּמוּנָה?',
  [R.sentence]: 'קִרְאוּ אֶת הַמִּשְׁפָּט וּבַחֲרוּ תְּמוּנָה',
  [R.cloze]: 'אֵיזוֹ מִילָּה חֲסֵרָה?',
  [R.order]: 'סַדְּרוּ אֶת הַסִּפּוּר',
  [R.readBook]: 'בּוֹאוּ נִקְרָא יַחַד',
  [R.slow]: 'לְאַט',
  [R.next]: 'הַבָּא',
  [R.back]: 'הַקּוֹדֵם',
  [R.questions]: 'עַכְשָׁיו שְׁאֵלוֹת',
  [R.check]: 'בְּדִיקָה',
}

export const phrases: PhraseMap = {
  ...instructions,
  ...Object.fromEntries(UNITS.map(u => [unitPhrase(u.key), u.spellings[0]])),
  ...Object.fromEntries(SENTENCES.map(s => [sentencePhrase(s.id), s.text])),
  // The gap becomes a pause (…) in the recording and in TTS.
  ...Object.fromEntries(CLOZES.map(c => [clozePhrase(c.id), c.text.replace('___', '…')])),
  ...Object.fromEntries(STORIES.flatMap(s => s.sentences.map((text, n) => [storyPhrase(s.id, n), text]))),
  ...Object.fromEntries(
    BOOKS.flatMap(b => [
      [bookTitlePhrase(b.id), b.title],
      ...b.pages.map((p, i) => [pagePhrase(b.id, i), oneLine(p.text)]),
      ...b.questions.map((q, i) => [bookQuestionPhrase(b.id, i), q.prompt]),
    ]),
  ),
}
