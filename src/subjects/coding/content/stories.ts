import type { Story, StoryStep } from '../types'

// Everyday algorithms: exactly one sensible order. `wrong` replaces steps[at] with a funny-but-plausible mistake;
// `notMissing` are two steps that do not belong. Emoji are distinct inside each story.
const BIKE: StoryStep = { emoji: '🚲', text: 'רוֹכְבִים עַל אוֹפַנַּיִם' }
const BALLOON: StoryStep = { emoji: '🎈', text: 'מְנַפְּחִים בַּלּוֹן' }
const BALL: StoryStep = { emoji: '⚽', text: 'בּוֹעֲטִים בְּכַדּוּר' }
const PIZZA: StoryStep = { emoji: '🍕', text: 'אוֹכְלִים פִּיצָה' }
const VIOLIN: StoryStep = { emoji: '🎻', text: 'מְנַגְּנִים בְּכִנּוֹר' }
const DRUM: StoryStep = { emoji: '🥁', text: 'מְתַפְּפִים עַל תֹּף' }

export const STORIES: readonly Story[] = [
  {
    id: 'teeth',
    steps: [
      { emoji: '🧴', text: 'מִשְׁחָה עַל הַמִּבְרֶשֶׁת' },
      { emoji: '🦷', text: 'מְצַחְצְחִים שִׁנַּיִם' },
      { emoji: '💧', text: 'שׁוֹטְפִים אֶת הַפֶּה' },
      { emoji: '😁', text: 'מְחַיְּכִים' },
    ],
    wrong: { at: 0, step: { emoji: '🍴', text: 'מִשְׁחָה עַל הַמַּזְלֵג' } },
    notMissing: [BIKE, BALLOON],
  },
  {
    id: 'hands',
    steps: [
      { emoji: '🚰', text: 'פּוֹתְחִים אֶת הַבֶּרֶז' },
      { emoji: '🧼', text: 'מְסַבְּנִים אֶת הַיָּדַיִם' },
      { emoji: '💦', text: 'שׁוֹטְפִים אֶת הַסַּבּוֹן' },
      { emoji: '🧻', text: 'מְנַגְּבִים אֶת הַיָּדַיִם' },
    ],
    wrong: { at: 3, step: { emoji: '🧦', text: 'מְנַגְּבִים בְּגֶרֶב' } },
    notMissing: [BALL, { emoji: '🚗', text: 'נוֹסְעִים בִּמְכוֹנִית' }],
  },
  {
    id: 'sandwich',
    steps: [
      { emoji: '🍞', text: 'לוֹקְחִים פְּרוּסוֹת לֶחֶם' },
      { emoji: '🧈', text: 'מוֹרְחִים חֶמְאָה' },
      { emoji: '🧀', text: 'שָׂמִים גְּבִינָה' },
      { emoji: '🥪', text: 'סוֹגְרִים אֶת הַכָּרִיךְ' },
    ],
    wrong: { at: 1, step: { emoji: '🎨', text: 'מוֹרְחִים צֶבַע' } },
    notMissing: [BALL, VIOLIN],
  },
  {
    id: 'seed',
    steps: [
      { emoji: '🫘', text: 'שָׂמִים זֶרַע בָּאֲדָמָה' },
      { emoji: '💧', text: 'מַשְׁקִים בְּמַיִם' },
      { emoji: '⏳', text: 'מְחַכִּים כַּמָּה יָמִים' },
      { emoji: '🌱', text: 'הַנָּבֶט צוֹמֵחַ' },
    ],
    wrong: { at: 1, step: { emoji: '🥛', text: 'מַשְׁקִים בְּחָלָב' } },
    notMissing: [{ emoji: '🚌', text: 'נוֹסְעִים בְּאוֹטוֹבּוּס' }, DRUM],
  },
  {
    id: 'shoes',
    steps: [
      { emoji: '🧦', text: 'לוֹבְשִׁים גַּרְבַּיִם' },
      { emoji: '👟', text: 'נוֹעֲלִים נַעֲלַיִם' },
      { emoji: '🎀', text: 'קוֹשְׁרִים שְׂרוֹכִים' },
      { emoji: '🚪', text: 'יוֹצְאִים לַגַּן' },
    ],
    wrong: { at: 1, step: { emoji: '👒', text: 'נוֹעֲלִים כּוֹבַע' } },
    notMissing: [{ emoji: '🍦', text: 'אוֹכְלִים גְּלִידָה' }, VIOLIN],
  },
  {
    id: 'road',
    steps: [
      { emoji: '🛑', text: 'עוֹצְרִים לְיַד הַכְּבִישׁ' },
      { emoji: '👀', text: 'מִסְתַּכְּלִים יָמִינָה וּשְׂמֹאלָה' },
      { emoji: '🚗', text: 'הַמְּכוֹנִיּוֹת עוֹצְרוֹת' },
      { emoji: '🚶', text: 'חוֹצִים לְאַט' },
    ],
    wrong: { at: 1, step: { emoji: '🙈', text: 'עוֹצְמִים עֵינַיִם' } },
    notMissing: [{ emoji: '🎂', text: 'אוֹכְלִים עוּגָה' }, BALL],
  },
  {
    id: 'cake',
    steps: [
      { emoji: '🥣', text: 'מְכִינִים בָּצֵק' },
      { emoji: '🔥', text: 'שָׂמִים בַּתַּנּוּר' },
      { emoji: '❄️', text: 'מְחַכִּים שֶׁיִּתְקַרֵּר' },
      { emoji: '🍓', text: 'מְקַשְּׁטִים בְּתוּת' },
    ],
    wrong: { at: 1, step: { emoji: '🚿', text: 'שָׂמִים בַּמִּקְלַחַת' } },
    notMissing: [BIKE, BALLOON],
  },
  {
    id: 'pet',
    steps: [
      { emoji: '🐶', text: 'הַכֶּלֶב רָעֵב' },
      { emoji: '🥣', text: 'מְמַלְּאִים קְעָרָה' },
      { emoji: '🍽️', text: 'שָׂמִים עַל הָרִצְפָּה' },
      { emoji: '😋', text: 'הַכֶּלֶב אוֹכֵל' },
    ],
    wrong: { at: 1, step: { emoji: '🪨', text: 'מְמַלְּאִים קְעָרָה בַּאֲבָנִים' } },
    notMissing: [PIZZA, VIOLIN],
  },
  {
    id: 'sleep',
    steps: [
      { emoji: '🦷', text: 'מְצַחְצְחִים שִׁנַּיִם' },
      { emoji: '🛏️', text: 'שׁוֹכְבִים בַּמִּטָּה' },
      { emoji: '📖', text: 'קוֹרְאִים סִפּוּר' },
      { emoji: '😴', text: 'יְשֵׁנִים' },
    ],
    wrong: { at: 1, step: { emoji: '🧊', text: 'שׁוֹכְבִים בַּמְּקָרֵר' } },
    notMissing: [BALL, BALLOON],
  },
  {
    id: 'tea',
    steps: [
      { emoji: '♨️', text: 'מַרְתִּיחִים מַיִם' },
      { emoji: '🍵', text: 'שָׂמִים שַׂקִּית בַּכּוֹס' },
      { emoji: '🫖', text: 'יוֹצְקִים מַיִם' },
      { emoji: '👵', text: 'נוֹתְנִים לְסַבְתָּא' },
    ],
    wrong: { at: 1, step: { emoji: '🧦', text: 'שָׂמִים גֶּרֶב בַּכּוֹס' } },
    notMissing: [BIKE, DRUM],
  },
  {
    id: 'fruit',
    steps: [
      { emoji: '🍎', text: 'לוֹקְחִים תַּפּוּחַ' },
      { emoji: '💦', text: 'שׁוֹטְפִים אוֹתוֹ' },
      { emoji: '😋', text: 'נוֹגְסִים' },
      { emoji: '🗑️', text: 'זוֹרְקִים לַפַּח' },
    ],
    wrong: { at: 1, step: { emoji: '👟', text: 'שָׂמִים בַּנַּעַל' } },
    notMissing: [BIKE, BALL],
  },
]
