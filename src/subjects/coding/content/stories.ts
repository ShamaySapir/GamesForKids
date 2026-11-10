import type { Story, StoryStep } from '../types'

// Everyday algorithms: exactly one sensible order. `wrong` replaces steps[at] with a funny-but-plausible mistake;
// `notMissing` are two steps that do not belong: one near the story's topic, one far from it.
// Emoji are distinct inside each story; the bug positions are spread over 0..3 and no decoy emoji is used in more than two stories.
const BIKE: StoryStep = { emoji: '🚲', text: 'רוֹכְבִים עַל אוֹפַנַּיִם' }
const BALLOON: StoryStep = { emoji: '🎈', text: 'מְנַפְּחִים בָּלוֹן' }
const BALL: StoryStep = { emoji: '⚽', text: 'בּוֹעֲטִים בְּכַדּוּר' }
const VIOLIN: StoryStep = { emoji: '🎻', text: 'מְנַגְּנִים בְּכִנּוֹר' }
const DRUM: StoryStep = { emoji: '🥁', text: 'מְתוֹפְפִים עַל תֹּף' }
const KITE: StoryStep = { emoji: '🪁', text: 'מְטַיְּסִים עֲפִיפוֹן' }

export const STORIES: readonly Story[] = [
  {
    id: 'teeth',
    steps: [
      { emoji: '🪥', text: 'שָׂמִים מִשְׁחָה עַל הַמִּבְרֶשֶׁת' },
      { emoji: '🦷', text: 'מְצַחְצְחִים שִׁנַּיִם' },
      { emoji: '💧', text: 'שׁוֹטְפִים אֶת הַפֶּה' },
      { emoji: '😁', text: 'מְחַיְּכִים' },
    ],
    wrong: { at: 0, step: { emoji: '🍴', text: 'שָׂמִים מִשְׁחָה עַל הַמַּזְלֵג' } },
    notMissing: [{ emoji: '🍬', text: 'אוֹכְלִים סֻכָּרִיָּה' }, BIKE],
  },
  {
    id: 'hands',
    steps: [
      { emoji: '👆', text: 'פּוֹתְחִים אֶת הַבֶּרֶז' },
      { emoji: '🧼', text: 'מְסַבְּנִים אֶת הַיָּדַיִם' },
      { emoji: '💦', text: 'שׁוֹטְפִים אֶת הַסַּבּוֹן' },
      { emoji: '🚰', text: 'סוֹגְרִים אֶת הַבֶּרֶז' },
    ],
    wrong: { at: 3, step: { emoji: '🌊', text: 'מַשְׁאִירִים אֶת הַבֶּרֶז פָּתוּחַ' } },
    notMissing: [{ emoji: '🧽', text: 'שׁוֹטְפִים כֵּלִים' }, BALL],
  },
  {
    id: 'sandwich',
    steps: [
      { emoji: '🍞', text: 'לוֹקְחִים פְּרוּסוֹת לֶחֶם' },
      { emoji: '🧈', text: 'מוֹרְחִים חֶמְאָה' },
      { emoji: '🧀', text: 'שָׂמִים גְּבִינָה' },
      { emoji: '🥪', text: 'סוֹגְרִים אֶת הַכָּרִיךְ' },
    ],
    wrong: { at: 2, step: { emoji: '🎨', text: 'מוֹרְחִים צֶבַע' } },
    notMissing: [{ emoji: '🥛', text: 'שׁוֹתִים חָלָב' }, VIOLIN],
  },
  {
    id: 'seed',
    steps: [
      { emoji: '🫘', text: 'שָׂמִים זֶרַע בָּאֲדָמָה' },
      { emoji: '💧', text: 'מַשְׁקִים בְּמַיִם' },
      { emoji: '⏳', text: 'מְחַכִּים כַּמָּה יָמִים' },
      { emoji: '🌱', text: 'הַנֶּבֶט צוֹמֵחַ' },
    ],
    wrong: { at: 1, step: { emoji: '🥛', text: 'מַשְׁקִים בְּחָלָב' } },
    notMissing: [{ emoji: '✂️', text: 'גּוֹזְרִים נְיָר' }, DRUM],
  },
  {
    id: 'shoes',
    steps: [
      { emoji: '🧦', text: 'לוֹבְשִׁים גַּרְבַּיִם' },
      { emoji: '👟', text: 'נוֹעֲלִים נַעֲלַיִם' },
      { emoji: '🎀', text: 'קוֹשְׁרִים שְׂרוֹכִים' },
      { emoji: '🚪', text: 'יוֹצְאִים לַגַּן' },
    ],
    wrong: { at: 0, step: { emoji: '🍌', text: 'נוֹעֲלִים בָּנָנָה' } },
    notMissing: [{ emoji: '🧤', text: 'לוֹבְשִׁים כְּפָפוֹת' }, BALLOON],
  },
  {
    id: 'road',
    steps: [
      { emoji: '🛑', text: 'עוֹצְרִים עַל הַמִּדְרָכָה' },
      { emoji: '🚦', text: 'מְחַכִּים לָאוֹר הַיָּרֹק' },
      { emoji: '👀', text: 'מִסְתַּכְּלִים לִשְׁנֵי הַצְּדָדִים' },
      { emoji: '🚶', text: 'חוֹצִים בַּהֲלִיכָה' },
    ],
    wrong: { at: 2, step: { emoji: '🙈', text: 'עוֹצְמִים עֵינַיִם' } },
    notMissing: [{ emoji: '🚌', text: 'נוֹסְעִים בְּאוֹטוֹבּוּס' }, BALL],
  },
  {
    id: 'cake',
    steps: [
      { emoji: '🥣', text: 'מְכִינִים בָּצֵק' },
      { emoji: '🔥', text: 'שָׂמִים בַּתַּנּוּר' },
      { emoji: '⏳', text: 'מְחַכִּים שֶׁהָעוּגָה תִּתְקָרֵר' },
      { emoji: '🍓', text: 'מְקַשְּׁטִים בְּתוּתִים' },
    ],
    wrong: { at: 3, step: { emoji: '🧅', text: 'מְקַשְּׁטִים בַּבָּצָל' } },
    notMissing: [{ emoji: '🍦', text: 'אוֹכְלִים גְּלִידָה' }, BIKE],
  },
  {
    id: 'pet',
    steps: [
      { emoji: '🐶', text: 'הַכֶּלֶב רָעֵב' },
      { emoji: '🥣', text: 'מְמַלְּאִים קְעָרָה בְּאֹכֶל' },
      { emoji: '😋', text: 'הַכֶּלֶב אוֹכֵל' },
      { emoji: '🧽', text: 'שׁוֹטְפִים אֶת הַקְּעָרָה' },
    ],
    wrong: { at: 1, step: { emoji: '🪨', text: 'מְמַלְּאִים קְעָרָה בַּאֲבָנִים' } },
    notMissing: [{ emoji: '🐱', text: 'מְלַטְּפִים חָתוּל' }, VIOLIN],
  },
  {
    id: 'sleep',
    steps: [
      { emoji: '🦷', text: 'מְצַחְצְחִים שִׁנַּיִם' },
      { emoji: '🛏️', text: 'נִכְנָסִים לַמִּטָּה' },
      { emoji: '😴', text: 'יְשֵׁנִים' },
      { emoji: '☀️', text: 'מִתְעוֹרְרִים' },
    ],
    wrong: { at: 2, step: { emoji: '🧺', text: 'יְשֵׁנִים בְּסַל הַכְּבִיסָה' } },
    notMissing: [{ emoji: '🎮', text: 'מְשַׂחֲקִים בַּטַּבְלֶט' }, BALLOON],
  },
  {
    id: 'icepop',
    steps: [
      { emoji: '🧃', text: 'שׁוֹפְכִים מִיץ לַתַּבְנִית' },
      { emoji: '🧊', text: 'שָׂמִים בַּמַּקְפִּיא' },
      { emoji: '⏳', text: 'מְחַכִּים' },
      { emoji: '😋', text: 'אוֹכְלִים אַרְטִיק' },
    ],
    wrong: { at: 0, step: { emoji: '🧦', text: 'שָׂמִים גֶּרֶב בַּתַּבְנִית' } },
    notMissing: [{ emoji: '🍵', text: 'שׁוֹתִים תֵּה' }, DRUM],
  },
  {
    id: 'fruit',
    steps: [
      { emoji: '🍎', text: 'לוֹקְחִים תַּפּוּחַ' },
      { emoji: '💦', text: 'שׁוֹטְפִים אוֹתוֹ' },
      { emoji: '😋', text: 'אוֹכְלִים אֶת הַתַּפּוּחַ' },
      { emoji: '🗑️', text: 'זוֹרְקִים אֶת הַשְּׁאֵרִית לַפַּח' },
    ],
    wrong: { at: 3, step: { emoji: '🐟', text: 'זוֹרְקִים אֶת הַשְּׁאֵרִית לָאַקְוַרְיוּם' } },
    notMissing: [{ emoji: '🥕', text: 'קוֹצְצִים גֶּזֶר' }, KITE],
  },
]
