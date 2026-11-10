import type { Story, StoryStep } from '../types'

// Everyday algorithms: exactly one sensible order. Each caption says what its picture shows (two emoji when one can't
// show the action), and `title` asks the question the steps answer ("אֵיךְ מְצַחְצְחִים שִׁנַּיִם?").
// `wrong` replaces steps[at] with a funny-but-plausible mistake;
// `notMissing` are two steps that do not belong: one near the story's topic, one far from it.
// Emoji are distinct inside each story; the bug positions are spread over 0..3 and no decoy emoji is used in more than two stories.
const BIKE: StoryStep = { emoji: '🚲', text: 'רוֹכְבִים עַל אוֹפַנַּיִם' }
const BALLOON: StoryStep = { emoji: '🎈', text: 'מְנַפְּחִים בָּלוֹן' }
const BALL: StoryStep = { emoji: '⚽', text: 'בּוֹעֲטִים בְּכַדּוּר' }
const VIOLIN: StoryStep = { emoji: '🎻', text: 'מְנַגְּנִים בְּכִנּוֹר' }
const DRUM: StoryStep = { emoji: '🥁', text: 'מְתוֹפְפִים עַל תֹּף' }
const KITE: StoryStep = { emoji: '🪁', text: 'מְטַיְּסִים עֲפִיפוֹן' }
const BRUSH: StoryStep = { emoji: '🪥🦷', text: 'מְצַחְצְחִים אֶת הַשִּׁנַּיִם' }

export const STORIES: readonly Story[] = [
  {
    id: 'teeth', title: 'אֵיךְ מְצַחְצְחִים שִׁנַּיִם?',
    steps: [
      { emoji: '🪥', text: 'לוֹקְחִים מִבְרֶשֶׁת' },
      BRUSH,
      { emoji: '🚰💧', text: 'שׁוֹטְפִים אֶת הַפֶּה' },
      { emoji: '😁', text: 'שִׁנַּיִם נְקִיּוֹת!' },
    ],
    wrong: { at: 0, step: { emoji: '🍴', text: 'לוֹקְחִים מַזְלֵג' } },
    notMissing: [{ emoji: '🍬', text: 'אוֹכְלִים סֻכָּרִיָּה' }, BIKE],
  },
  {
    id: 'hands', title: 'אֵיךְ רוֹחֲצִים יָדַיִם?',
    steps: [
      { emoji: '🚰', text: 'פּוֹתְחִים אֶת הַבֶּרֶז' },
      { emoji: '🧼🙌', text: 'מְסַבְּנִים אֶת הַיָּדַיִם' },
      { emoji: '💦🙌', text: 'שׁוֹטְפִים אֶת הַיָּדַיִם' },
      { emoji: '👐✨', text: 'יָדַיִם נְקִיּוֹת!' },
    ],
    wrong: { at: 3, step: { emoji: '🍫🙌', text: 'מְלַכְלְכִים אֶת הַיָּדַיִם בְּשׁוֹקוֹלָד' } },
    notMissing: [{ emoji: '🧽', text: 'שׁוֹטְפִים כֵּלִים' }, BALL],
  },
  {
    id: 'sandwich', title: 'אֵיךְ מְכִינִים כָּרִיךְ?',
    steps: [
      { emoji: '🍞', text: 'לוֹקְחִים לֶחֶם' },
      { emoji: '🧈', text: 'מוֹרְחִים חֶמְאָה' },
      { emoji: '🧀', text: 'שָׂמִים גְּבִינָה' },
      { emoji: '🥪', text: 'הַכָּרִיךְ מוּכָן' },
    ],
    wrong: { at: 2, step: { emoji: '🎨', text: 'מוֹרְחִים צֶבַע' } },
    notMissing: [{ emoji: '🥛', text: 'שׁוֹתִים חָלָב' }, VIOLIN],
  },
  {
    id: 'seed', title: 'אֵיךְ מְגַדְּלִים צֶמַח?',
    steps: [
      { emoji: '🫘', text: 'שׁוֹתְלִים זֶרַע' },
      { emoji: '💧', text: 'מַשְׁקִים בְּמַיִם' },
      { emoji: '⏳', text: 'מְחַכִּים' },
      { emoji: '🌱', text: 'צוֹמֵחַ נֶבֶט' },
    ],
    wrong: { at: 1, step: { emoji: '🥛', text: 'מַשְׁקִים בְּחָלָב' } },
    notMissing: [{ emoji: '✂️', text: 'גּוֹזְרִים נְיָר' }, DRUM],
  },
  {
    id: 'shoes', title: 'אֵיךְ מִתְכּוֹנְנִים לָצֵאת?',
    steps: [
      { emoji: '🧦', text: 'לוֹבְשִׁים גַּרְבַּיִם' },
      { emoji: '👟', text: 'נוֹעֲלִים נַעֲלַיִם' },
      { emoji: '👟🎀', text: 'קוֹשְׁרִים שְׂרוֹכִים' },
      { emoji: '🚪🚶', text: 'יוֹצְאִים מֵהַבַּיִת' },
    ],
    wrong: { at: 0, step: { emoji: '🍌', text: 'נוֹעֲלִים בָּנָנָה' } },
    notMissing: [{ emoji: '🧤', text: 'לוֹבְשִׁים כְּפָפוֹת' }, BALLOON],
  },
  {
    id: 'road', title: 'אֵיךְ חוֹצִים כְּבִישׁ?',
    steps: [
      { emoji: '🧍', text: 'עוֹמְדִים עַל הַמִּדְרָכָה' },
      { emoji: '🚦', text: 'מְחַכִּים לָאוֹר הַיָּרֹק' },
      { emoji: '👀', text: 'מִסְתַּכְּלִים לִשְׁנֵי הַצְּדָדִים' },
      { emoji: '🚶', text: 'חוֹצִים בַּהֲלִיכָה' },
    ],
    wrong: { at: 2, step: { emoji: '🙈', text: 'עוֹצְמִים עֵינַיִם' } },
    notMissing: [{ emoji: '🚌', text: 'נוֹסְעִים בְּאוֹטוֹבּוּס' }, BALL],
  },
  {
    id: 'cake', title: 'אֵיךְ אוֹפִים עוּגָה?',
    steps: [
      { emoji: '🥚', text: 'שׁוֹבְרִים בֵּיצִים' },
      { emoji: '🥣', text: 'מְעַרְבְּבִים' },
      { emoji: '🔥', text: 'אוֹפִים' },
      { emoji: '🍰', text: 'אוֹכְלִים עוּגָה' },
    ],
    wrong: { at: 3, step: { emoji: '🧅', text: 'אוֹכְלִים בָּצָל' } },
    notMissing: [{ emoji: '🍦', text: 'אוֹכְלִים גְּלִידָה' }, BIKE],
  },
  {
    id: 'pet', title: 'אֵיךְ מַאֲכִילִים כֶּלֶב?',
    steps: [
      { emoji: '🥫', text: 'פּוֹתְחִים קֻפְסַת אֹכֶל' },
      { emoji: '🥣', text: 'שָׂמִים אֹכֶל בַּקְּעָרָה' },
      { emoji: '🐶🥣', text: 'הַכֶּלֶב אוֹכֵל' },
      { emoji: '🧽🥣', text: 'שׁוֹטְפִים אֶת הַקְּעָרָה' },
    ],
    wrong: { at: 1, step: { emoji: '🪨🥣', text: 'שָׂמִים אֲבָנִים בַּקְּעָרָה' } },
    notMissing: [{ emoji: '🐱', text: 'מְלַטְּפִים חָתוּל' }, VIOLIN],
  },
  {
    id: 'sleep', title: 'אֵיךְ הוֹלְכִים לִישֹׁן?',
    steps: [
      BRUSH,
      { emoji: '🛏️', text: 'נִכְנָסִים לַמִּטָּה' },
      { emoji: '😴', text: 'יְשֵׁנִים' },
      { emoji: '☀️', text: 'מִתְעוֹרְרִים בַּבֹּקֶר' },
    ],
    wrong: { at: 2, step: { emoji: '🧺', text: 'יְשֵׁנִים בְּסַל הַכְּבִיסָה' } },
    notMissing: [{ emoji: '📺', text: 'רוֹאִים טֵלֵוִיזְיָה' }, BALLOON],
  },
  {
    id: 'popcorn', title: 'אֵיךְ מְכִינִים פּוֹפְּקוֹרְן?',
    steps: [
      { emoji: '🌽', text: 'לוֹקְחִים תִּירָס' },
      { emoji: '🔥', text: 'מְחַמְּמִים' },
      { emoji: '💥', text: 'הַתִּירָס מִתְפּוֹצֵץ' },
      { emoji: '🍿', text: 'אוֹכְלִים פּוֹפְּקוֹרְן' },
    ],
    wrong: { at: 0, step: { emoji: '🧦', text: 'לוֹקְחִים גֶּרֶב' } },
    notMissing: [{ emoji: '🍵', text: 'שׁוֹתִים תֵּה' }, DRUM],
  },
  {
    id: 'fruit', title: 'אֵיךְ אוֹכְלִים תַּפּוּחַ?',
    steps: [
      { emoji: '🍎', text: 'לוֹקְחִים תַּפּוּחַ' },
      { emoji: '💦🍎', text: 'שׁוֹטְפִים אֶת הַתַּפּוּחַ' },
      { emoji: '😋🍎', text: 'אוֹכְלִים אֶת הַתַּפּוּחַ' },
      { emoji: '🗑️', text: 'זוֹרְקִים אֶת הַשְּׁאֵרִית לַפַּח' },
    ],
    wrong: { at: 3, step: { emoji: '🐟', text: 'זוֹרְקִים אֶת הַשְּׁאֵרִית לַדָּגִים' } },
    notMissing: [{ emoji: '🥕', text: 'אוֹכְלִים גֶּזֶר' }, KITE],
  },
]
