import type { PhraseMap } from '../../core/engine/types'
import { NUMBER_PHRASES, PRICE_PHRASES } from './content/numbers'
import { M, OP, shopPhrase, storyPart, thingPhrase } from './ids'

// Feminine plural nouns: the number blocks are feminine counting forms (שָׁלוֹשׁ בָּנָנוֹת).
const THING_WORDS: Record<string, string> = {
  bird: 'צִפֳּרִים',
  banana: 'בָּנָנוֹת',
  cookie: 'עוּגִיּוֹת',
  car: 'מְכוֹנִיּוֹת',
  candy: 'סֻכָּרִיּוֹת',
  egg: 'בֵּיצִים',
  cow: 'פָּרוֹת',
  sheep: 'כְּבָשׂוֹת',
  chicken: 'תַּרְנְגֹלוֹת',
  bee: 'דְּבוֹרִים',
  frog: 'צְפַרְדְּעִים',
  tomato: 'עַגְבָנִיּוֹת',
  donut: 'סוּפְגָּנִיּוֹת',
  sunflower: 'חַמָּנִיּוֹת',
  mushroom: 'פִּטְרִיּוֹת',
  gift: 'מַתָּנוֹת',
  icecream: 'גְּלִידוֹת',
  train: 'רַכָּבוֹת',
  shirt: 'חֻלְצוֹת',
  dress: 'שִׂמְלוֹת',
  guitar: 'גִּיטָרוֹת',
  spoon: 'כַּפּוֹת',
  pizza: 'פִּיצוֹת',
}

const SHOP_WORDS: Record<string, string> = {
  bear: 'דֻּבּוֹן',
  car: 'מְכוֹנִית',
  ball: 'כַּדּוּר',
  kite: 'עֲפִיפוֹן',
  balloon: 'בַּלּוֹן',
  icecream: 'גְּלִידָה',
  chocolate: 'שׁוֹקוֹלָד',
  cookie: 'עוּגִיָּה',
  apple: 'תַּפּוּחַ',
  banana: 'בָּנָנָה',
  candy: 'סֻכָּרִיָּה',
  book: 'סֵפֶר',
  pencil: 'עִפָּרוֹן',
  train: 'רַכֶּבֶת',
  trumpet: 'חֲצוֹצְרָה',
}

const JOIN_END = 'כַּמָּה יֵשׁ עַכְשָׁו?'
const SEPARATE_END = 'כַּמָּה נִשְׁאֲרוּ?'
const join = (start: string, middle: string) => ({ start, middle, end: JOIN_END })
const separate = (start: string, middle: string) => ({ start, middle, end: SEPARATE_END })

/** Spoken as: start · number · thing · middle · number · end (see StoryTemplate). Verbs are plural and fit every listed thing. */
export const STORY_TEXT: Record<string, { start: string; middle: string; end: string }> = {
  'join-tree': join('עַל הָעֵץ יָשְׁבוּ', 'בָּאוּ עוֹד'),
  'join-basket': join('בַּסַּל הָיוּ', 'שָׂמְנוּ עוֹד'),
  'join-plate': join('עַל הַצַּלַּחַת הָיוּ', 'הוֹסַפְנוּ עוֹד'),
  'join-farm': join('בַּמִּשְׁק הָיוּ', 'הִצְטָרְפוּ עוֹד'),
  'join-garden': join('בַּגִּנָּה צָמְחוּ', 'צָמְחוּ עוֹד'),
  'join-bees': join('סָבִיב לַפֶּרַח טָסוּ', 'הִצְטָרְפוּ עוֹד'),
  'join-cars': join('בַּחֲנִיָּה עָמְדוּ', 'הִגִּיעוּ עוֹד'),
  'join-train': join('בַּתַּחֲנָה עָמְדוּ', 'הִגִּיעוּ עוֹד'),
  'join-closet': join('בָּאָרוֹן הָיוּ', 'תָּלִינוּ עוֹד'),
  'join-party': join('עַל הַשֻּׁלְחָן הָיוּ', 'הֵבִיאוּ עוֹד'),
  'join-freezer': join('בַּמַּקְפִּיא הָיוּ', 'הִכְנַסְנוּ עוֹד'),
  'join-shop': join('בַּחֲנוּת הָיוּ', 'הֵבִיאוּ עוֹד'),
  'join-rock': join('עַל הַסֶּלַע יָשְׁבוּ', 'הִצְטָרְפוּ עוֹד'),
  'sep-basket': separate('בַּסַּל הָיוּ', 'אָכַלְנוּ'),
  'sep-tree': separate('עַל הָעֵץ יָשְׁבוּ', 'עָפוּ'),
  'sep-farm': separate('בַּמִּשְׁק הָיוּ', 'הָלְכוּ'),
  'sep-pond': separate('עַל הַסֶּלַע יָשְׁבוּ', 'קָפְצוּ'),
  'sep-plate': separate('עַל הַצַּלַּחַת הָיוּ', 'אָכַלְנוּ'),
  'sep-party': separate('עַל הַשֻּׁלְחָן הָיוּ', 'הַיְלָדִים לָקְחוּ'),
  'sep-garden': separate('בַּגִּנָּה צָמְחוּ', 'קָטַפְנוּ'),
  'sep-train': separate('בַּתַּחֲנָה עָמְדוּ', 'נָסְעוּ'),
  'sep-closet': separate('בָּאָרוֹן הָיוּ', 'לָקַחְנוּ'),
  'sep-freezer': separate('בַּמַּקְפִּיא הָיוּ', 'אָכַלְנוּ'),
  'sep-eggs': separate('בַּקַּרְטוֹן הָיוּ', 'לָקַחְנוּ'),
  'sep-spoons': separate('בַּמְּגֵרָה הָיוּ', 'לָקַחְנוּ'),
}

const INSTRUCTIONS: Record<string, string> = {
  [OP.plus]: 'וְעוֹד',
  [OP.minus]: 'פָּחוֹת',
  [OP.equals]: 'שָׁוֶה',
  [M.howMany]: 'כַּמָּה יֵשׁ?',
  [M.showMe]: 'שִׂימוּ בַּסַּל',
  [M.hearNumber]: 'אֵיפֹה הַמִּסְפָּר',
  [M.matchNumber]: 'אֵיפֹה יֵשׁ אוֹתָהּ כַּמּוּת?',
  [M.more]: 'אֵיפֹה יֵשׁ יוֹתֵר?',
  [M.fewer]: 'אֵיפֹה יֵשׁ פָּחוֹת?',
  [M.most]: 'אֵיפֹה יֵשׁ הֲכִי הַרְבֵּה?',
  [M.story]: 'כַּמָּה יֵשׁ עַכְשָׁו?',
  [M.next]: 'אֵיזֶה מִסְפָּר בָּא אַחֲרֵי',
  [M.before]: 'אֵיזֶה מִסְפָּר בָּא לִפְנֵי',
  [M.skip]: 'אֵיזֶה מִסְפָּר חָסֵר?',
  [M.oneMore]: 'אֲנִי גָּדוֹל בְּאֶחָד מֵהַמִּסְפָּר',
  [M.oneLess]: 'אֲנִי קָטָן בְּאֶחָד מֵהַמִּסְפָּר',
  [M.between]: 'אֲנִי בֵּין',
  [M.betweenAnd]: 'לְבֵין',
  [M.place]: 'גִּרְרוּ אֶת הַחֵץ לַמִּסְפָּר',
  [M.whichNumber]: 'אֵיזֶה מִסְפָּר מְסֻמָּן?',
  [M.misplaced]: 'מִצְאוּ אֶת הַמִּסְפָּר שֶׁלֹּא בַּמָּקוֹם',
  [M.hidden]: 'כַּמָּה מִתְחַבְּאוֹת מִתַּחַת לַכּוֹס?',
  [M.allSplits]: 'מִצְאוּ אֶת כָּל הַזּוּגוֹת שֶׁיַּחַד הֵם עֶשֶׂר',
  [M.solve]: 'כַּמָּה זֶה?',
  [M.missing]: 'אֵיזֶה מִסְפָּר חָסֵר?',
  [M.pay]: 'שַׁלְּמוּ בְּדִיּוּק',
  [M.change]: 'כַּמָּה עֹדֶף תְּקַבְּלוּ?',
  [M.check]: 'בְּדִיקָה',
  [M.reset]: 'מֵהַתְחָלָה',
}

export const phrases: PhraseMap = {
  ...NUMBER_PHRASES,
  ...PRICE_PHRASES,
  ...INSTRUCTIONS,
  ...Object.fromEntries(Object.entries(THING_WORDS).map(([id, w]) => [thingPhrase(id), w])),
  ...Object.fromEntries(Object.entries(SHOP_WORDS).map(([id, w]) => [shopPhrase(id), w])),
  ...Object.fromEntries(
    Object.entries(STORY_TEXT).flatMap(([id, t]) => [
      [storyPart(id, 'start'), t.start],
      [storyPart(id, 'middle'), t.middle],
      [storyPart(id, 'end'), t.end],
    ]),
  ),
}
