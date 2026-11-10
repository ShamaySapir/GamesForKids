import type { PhraseMap } from '../../core/engine/types'
import { MOVE_NAMES, MOVES } from './content/patterns'
import { STORIES } from './content/stories'
import { C, movePhrase, otherPhrase, stepPhrase, wrongPhrase } from './ids'

const INSTRUCTIONS: Record<string, string> = {
  [C.steps]: 'סַדְּרוּ אֶת הַתְּמוּנוֹת לְפִי הַסֵּדֶר',
  [C.bug]: 'אֵיזֶה שָׁלָב לֹא בְּסֵדֶר?',
  [C.missing]: 'אֵיזֶה שָׁלָב חָסֵר?',
  [C.follow]: 'לְאָן שׁוּפִי יַגִּיעַ?',
  [C.program]: 'בְּנוּ תָּכְנִית שֶׁתָּבִיא אֶת שׁוּפִי לַתַּפּוּחַ',
  [C.debug]: 'יֵשׁ בָּאג בַּתָּכְנִית! מִצְאוּ אוֹתוֹ וְתַקְּנוּ',
  [C.loop]: 'אֵיזוֹ לוּלָאָה מַתְאִימָה לָרִקּוּד?',
  [C.repeat]: 'בְּנוּ תָּכְנִית קְצָרָה עִם "חֲזֹר"',
  [C.hintFollow]: 'עִקְבוּ אַחֲרֵי הַחִצִּים אֶחָד אַחֲרֵי הַשֵּׁנִי',
  [C.hintPath]: 'הַנְּקֻדּוֹת מַרְאוֹת אֶת הַדֶּרֶךְ',
  [C.hintRepeat]: 'כַּמָּה פְּעָמִים הוֹלְכִים בְּאוֹתוֹ כִּוּוּן?',
  [C.hintDebug]: 'לְחִיצָה עַל קְלָף מְשַׁנָּה אֶת הַכִּוּוּן שֶׁלּוֹ',
  [C.full]: 'אֵין יוֹתֵר מָקוֹם. נַסּוּ "חֲזֹר"',
  [C.run]: 'קָדִימָה!',
  [C.erase]: 'מְחִיקָה',
  [C.repeatCard]: 'חֲזֹר',
  [C.times]: 'פְּעָמִים',
  [C.up]: 'לְמַעְלָה',
  [C.down]: 'לְמַטָּה',
  [C.left]: 'שְׂמֹאלָה',
  [C.right]: 'יָמִינָה',
}

export const phrases: PhraseMap = {
  ...INSTRUCTIONS,
  ...Object.fromEntries(STORIES.flatMap(s => [
    ...s.steps.map((step, n) => [stepPhrase(s.id, n), step.text] as const),
    [wrongPhrase(s.id), s.wrong.step.text] as const,
    [otherPhrase(s.id, 0), s.notMissing[0].text] as const,
    [otherPhrase(s.id, 1), s.notMissing[1].text] as const,
  ])),
  ...Object.fromEntries(Object.values(MOVES).map(key => [movePhrase(key), MOVE_NAMES[key] ?? ''])),
}
