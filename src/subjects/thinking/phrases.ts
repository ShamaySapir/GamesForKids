import type { PhraseMap } from '../../core/engine/types'
import { ART } from './art/catalog'
import { PART_NAMES, partPhrase, NAMES, REFERENCE_FORMS } from './content/names'
import { SEQUENCE_TEXT } from './content/sequences'
import { BIN_TEXT } from './content/sorting'
import { WHERE_SCENES } from './content/where'
import { artPhrase, binPhrase, sequencePhrase, T, wherePhrase } from './ids'
import type { WhereScene } from './types'

const INSTRUCTIONS: Record<string, string> = {
  [T.oddOne]: 'מִי שׁוֹנֶה מִכֻּלָּם?',
  [T.twin]: 'מִצְאוּ אֶת הַתְּמוּנָה שֶׁזֵּהָה בְּדִיּוּק',
  [T.shadow]: 'שֶׁל מִי הַצֵּל הַזֶּה?',
  [T.shadowOf]: 'אֵיזֶה צֵל שַׁיָּךְ לַתְּמוּנָה?',
  [T.pattern]: 'מָה בָּא אַחַר כָּךְ?',
  [T.memory]: 'מִצְאוּ זוּגוֹת שֶׁל קְלָפִים זֵהִים',
  [T.symmetry]: 'אֵיזֶה חֵצִי מַשְׁלִים אֶת הַצִּיּוּר?',
  [T.symGrid]: 'הַשְׁלִימוּ אֶת הַצַּד הַשֵּׁנִי כְּמוֹ בְּמַרְאָה',
  [T.sequence]: 'סַדְּרוּ: מָה קָרָה קֹדֶם?',
  [T.sorting]: 'שִׂימוּ כָּל תְּמוּנָה בַּסַּל הַמַּתְאִים',
  [T.missing]: 'מָה חָסֵר בַּצִּיּוּר?',
  [T.differences]: 'מִצְאוּ אֶת הַהֶבְדֵּלִים',
  [T.notHere]: 'לֹא כָּאן, נַסּוּ שׁוּב',
  [T.foundAll]: 'מְצָאתֶם אֶת כֻּלָּם!',
  [T.maze]: 'עִזְרוּ לַגִּבּוֹר לְהַגִּיעַ לַמַּטָּרָה',
  [T.check]: 'בְּדִיקָה',
  [T.reset]: 'מֵהַתְחָלָה',
}

/** The position words, each followed by the definite reference noun ("עַל הַשֻּׁלְחָן"). */
export function whereText(scene: WhereScene): string {
  const a = NAMES[scene.a]?.def
  const b = NAMES[scene.b]?.def
  if (!a || !b) throw new Error(`where scene ${scene.id}: unknown drawing`)
  // "לְ" + definite noun: the ה of the article becomes ל ("הַשֻּׁלְחָן" → "לַשֻּׁלְחָן").
  const lamed = 'ל' + b.slice(1)
  const pl = REFERENCE_FORMS[scene.b]
  const two = pl?.fem ? 'שְׁתֵּי' : 'שְׁנֵי'
  const where: Record<WhereScene['rel'], string> = {
    on: `עַל ${b}`,
    under: `מִתַּחַת ${lamed}`,
    in: `בְּתוֹךְ ${b}`,
    'next-to': `לְיַד ${b}`,
    between: `בֵּין ${two} ${pl?.plDef ?? ''}`,
    'in-front': `לִפְנֵי ${b}`,
    behind: `מֵאֲחוֹרֵי ${b}`,
    above: `מֵעַל ${b}`,
  }
  return `אֵיפֹה ${a}? ${where[scene.rel]}`
}

export const phrases: PhraseMap = {
  ...INSTRUCTIONS,
  ...Object.fromEntries(ART.map(spec => [artPhrase(spec.name), NAMES[spec.name]?.he ?? ''])),
  ...Object.fromEntries(Object.entries(PART_NAMES).map(([part, he]) => [partPhrase(part), he])),
  ...Object.fromEntries(WHERE_SCENES.map(s => [wherePhrase(s.id), whereText(s)])),
  ...Object.fromEntries(
    Object.entries(SEQUENCE_TEXT).flatMap(([id, steps]) => steps.map((text, n) => [sequencePhrase(id, n), text])),
  ),
  ...Object.fromEntries(
    Object.entries(BIN_TEXT).flatMap(([id, [zero, one]]) => [
      [binPhrase(id, 0), zero],
      [binPhrase(id, 1), one],
    ]),
  ),
}
