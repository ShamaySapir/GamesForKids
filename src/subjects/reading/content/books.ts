import type { Book } from '../types'

// Five original read-along books with Oli the owl. Lines of a page are separated by '\n'.
// Stage 1 sticks to kamatz and patach words (plus names and a few function words); later stages add one vowel each.
export const BOOKS: readonly Book[] = [
  {
    id: 'butterfly',
    title: 'אוֹלִי וְהַפַּרְפַּר',
    cover: '🦉🦋',
    stage: 1,
    pages: [
      { text: 'אוֹלִי יָשַׁב עַל עָנָף.', scene: '🦉🌳' },
      { text: 'פַּרְפַּר קָטָן בָּא.\nהוּא עָף וְעָף.', scene: '🦋✨' },
      { text: '"מָה שִׁמְךָ?"\nשָׁאַל הַפַּרְפַּר.', scene: '🦋❓' },
      { text: '"אֲנִי אוֹלִי,"\nאָמַר אוֹלִי.', scene: '🦉💬' },
      { text: 'הַפַּרְפַּר שָׂמַח.\nאוֹלִי שָׂמַח.', scene: '😊🦉🦋' },
      { text: 'הֵם יָשְׁבוּ יַחַד עַל הֶעָנָף.', scene: '🦉🦋🌿' },
    ],
    questions: [
      { prompt: 'עַל מָה יָשַׁב אוֹלִי?', options: [{ scene: '🏠' }, { scene: '🌳' }, { scene: '🌊' }], answer: 1 },
      { prompt: 'מִי בָּא?', options: [{ scene: '🐶' }, { scene: '🐟' }, { scene: '🦋' }], answer: 2 },
      { prompt: 'מָה שָׁאַל הַפַּרְפַּר?', options: [{ text: 'מָה שִׁמְךָ?' }, { text: 'אֵיפֹה הַבַּיִת?' }, { text: 'מָה אַתָּה אוֹכֵל?' }], answer: 0 },
    ],
  },
  {
    id: 'elephant',
    title: 'אוֹלִי וְהַפִּיל',
    cover: '🦉🐘',
    stage: 2,
    pages: [
      { text: 'אוֹלִי הָלַךְ בַּגַּן.', scene: '🦉🚶' },
      { text: 'שָׁם הוּא רָאָה פִּיל.', scene: '👀🐘' },
      { text: 'הַפִּיל שָׁתָה מַיִם.', scene: '🐘💧' },
      { text: 'הַפִּיל שָׁפַךְ מַיִם\nעַל אוֹלִי!', scene: '🐘💦🦉' },
      { text: 'אוֹלִי צָחַק.\nהַפִּיל צָחַק.', scene: '😂🦉🐘' },
      { text: 'מֵאָז הֵם חֲבֵרִים טוֹבִים.', scene: '🦉🤝🐘' },
    ],
    questions: [
      { prompt: 'מָה שָׁתָה הַפִּיל?', options: [{ scene: '🍕' }, { scene: '🍎' }, { scene: '💧' }], answer: 2 },
      { prompt: 'עַל מִי שָׁפַךְ הַפִּיל מַיִם?', options: [{ text: 'עַל דָּג' }, { text: 'עַל אוֹלִי' }, { text: 'עַל סוּס' }], answer: 1 },
      { prompt: 'מִי צָחַק?', options: [{ scene: '🦉🐘' }, { scene: '🐶' }, { scene: '🐟' }], answer: 0 },
    ],
  },
  {
    id: 'winter',
    title: 'אוֹלִי בַּחֹרֶף',
    cover: '🦉❄️',
    stage: 3,
    pages: [
      { text: 'הַחֹרֶף בָּא.', scene: '❄️' },
      { text: 'הָיָה קַר וְיָרַד גֶּשֶׁם.', scene: '🌧️🥶' },
      { text: 'אוֹלִי חָבַשׁ כּוֹבַע וְכָרַךְ צָעִיף.', scene: '🦉🧢🧣' },
      { text: 'הַדֹּב הָלַךְ לִישׁוֹן.', scene: '🐻💤' },
      { text: 'אוֹלִי שָׁתָה שׁוֹקוֹלָד חַם\nוְשָׁר שִׁיר.', scene: '🦉☕🎵' },
      { text: '"חֹרֶף טוֹב!"\nאָמַר אוֹלִי.', scene: '🦉⛄' },
    ],
    questions: [
      { prompt: 'מָה אוֹלִי שָׂם כִּי הָיָה קַר?', options: [{ scene: '🩴' }, { scene: '🧢🧣' }, { scene: '🕶️' }], answer: 1 },
      { prompt: 'מִי הָלַךְ לִישׁוֹן?', options: [{ scene: '🐻' }, { scene: '🐶' }, { scene: '🐘' }], answer: 0 },
      { prompt: 'מָה שָׁתָה אוֹלִי?', options: [{ text: 'חָלָב קַר' }, { text: 'מִיץ קַר' }, { text: 'שׁוֹקוֹלָד חַם' }], answer: 2 },
    ],
  },
  {
    id: 'kindergarten',
    title: 'יוֹם בַּגַּן עִם אוֹלִי',
    cover: '🦉🏫',
    stage: 4,
    pages: [
      { text: 'בַּבֹּקֶר אוֹלִי בָּא לַגַּן.', scene: '🦉🏫' },
      { text: 'הַיְלָדִים צִיְּרוּ וְשָׁרוּ.', scene: '🎨🎵' },
      { text: 'בֶּחָצֵר כֻּלָּם רָצוּ.', scene: '🏃💨' },
      { text: 'אוֹלִי אָכַל תּוּת\nוְשָׁתָה מַיִם.', scene: '🍓💧' },
      { text: 'אַחַר כָּךְ כֻּלָּם\nחָזְרוּ הַבַּיְתָה.', scene: '🌇🏠' },
      { text: '"יוֹם נֶהְדָּר!"\nאָמַר אוֹלִי.', scene: '🦉🌟' },
    ],
    questions: [
      { prompt: 'מָה עָשׂוּ הַיְלָדִים בַּגַּן?', options: [{ text: 'צִיְּרוּ וְשָׁרוּ' }, { text: 'שָׂחוּ בַּיָּם' }, { text: 'עָפוּ בַּשָּׁמַיִם' }], answer: 0 },
      { prompt: 'מָה אָכַל אוֹלִי?', options: [{ scene: '🍕' }, { scene: '🍓' }, { scene: '🍦' }], answer: 1 },
      { prompt: 'לְאָן חָזְרוּ כֻּלָּם?', options: [{ scene: '🌊' }, { scene: '🌳' }, { scene: '🏠' }], answer: 2 },
    ],
  },
  {
    id: 'key',
    title: 'אוֹלִי וְהַמַּפְתֵּחַ',
    cover: '🦉🔑',
    stage: 5,
    pages: [
      { text: 'אוֹלִי מָצָא מַפְתֵּחַ קָטָן.', scene: '🦉🔑' },
      { text: '"אֵיפֹה הַדֶּלֶת?"\nשָׁאַל אוֹלִי.', scene: '🚪❓' },
      { text: 'הוּא חִפֵּשׂ בַּגַּן\nוּבַשָּׂדֶה.', scene: '🔍🌾' },
      { text: 'מֵאֲחוֹרֵי עֵץ גָּדוֹל\nהָיְתָה דֶּלֶת קְטַנָּה.', scene: '🌳🚪' },
      { text: 'הַמַּפְתֵּחַ הִתְאִים לַדֶּלֶת.\nאוֹלִי פָּתַח אוֹתָהּ.', scene: '🔑🚪✅' },
      { text: 'מֵאֲחוֹרֵי הַדֶּלֶת\nחִכּוּ שׁוּעָל וְאַרְנָב!', scene: '🎉🦊🐰' },
    ],
    questions: [
      { prompt: 'מָה מָצָא אוֹלִי?', options: [{ scene: '🎈' }, { scene: '🔑' }, { scene: '🍎' }], answer: 1 },
      { prompt: 'אֵיפֹה הָיְתָה הַדֶּלֶת?', options: [{ text: 'בַּיָּם' }, { text: 'עַל הַגָּג' }, { text: 'מֵאֲחוֹרֵי עֵץ' }], answer: 2 },
      { prompt: 'מִי חִכָּה מֵאֲחוֹרֵי הַדֶּלֶת?', options: [{ scene: '🐘' }, { scene: '🦊🐰' }, { scene: '🐢' }], answer: 1 },
    ],
  },
]
