import type { Book } from '../types'

// Five original read-along books with Shufi the owl. Lines of a page are separated by '\n'.
// Stage 1 sticks to kamatz and patach words (plus names and a few function words); later stages add one vowel each.
export const BOOKS: readonly Book[] = [
  {
    id: 'butterfly',
    title: 'שׁוּפִי וְהַפַּרְפַּר',
    cover: '🦉🦋',
    stage: 1,
    pages: [
      { text: 'שׁוּפִי יָשַׁב עַל עָנָף.', scene: '🦉🌳' },
      { text: 'פַּרְפַּר קָטָן בָּא.\nהוּא עָף וְעָף.', scene: '🦋✨' },
      { text: '"מַה שְׁמָךְ?"\nשָׁאַל הַפַּרְפַּר.', scene: '🦋❓' },
      { text: '"אֲנִי שׁוּפִי,"\nאָמַר שׁוּפִי.', scene: '🦉💬' },
      { text: 'הַפַּרְפַּר שָׂמַח.\nשׁוּפִי שָׂמַח.', scene: '😊🦉🦋' },
      { text: 'הֵם יָשְׁבוּ יַחַד עַל עָנָף.', scene: '🦉🦋🌿' },
    ],
    questions: [
      { prompt: 'עַל מָה יָשַׁב שׁוּפִי?', options: [{ scene: '🏠' }, { scene: '🌳' }, { scene: '🌊' }], answer: 1 },
      { prompt: 'מִי בָּא?', options: [{ scene: '🐶' }, { scene: '🐟' }, { scene: '🦋' }], answer: 2 },
      { prompt: 'מַה שָׁאַל הַפַּרְפַּר?', options: [{ text: 'מַה שְׁמָךְ?' }, { text: 'אֵיפֹה הַבַּיִת?' }, { text: 'מָה אַתָּה אוֹכֵל?' }], answer: 0 },
    ],
  },
  {
    id: 'elephant',
    title: 'שׁוּפִי וְהַפִּיל',
    cover: '🦉🐘',
    stage: 2,
    pages: [
      { text: 'שׁוּפִי הָלַךְ בַּגַּן.', scene: '🦉🚶' },
      { text: 'שָׁם הוּא רָאָה פִּיל.', scene: '👀🐘' },
      { text: 'הַפִּיל שָׁתָה מַיִם.', scene: '🐘💧' },
      { text: 'הַפִּיל שָׁפַךְ מַיִם\nעַל שׁוּפִי!', scene: '🐘💦🦉' },
      { text: 'שׁוּפִי צָחַק.\nהַפִּיל צָחַק.', scene: '😂🦉🐘' },
      { text: 'מֵאָז הֵם חֲבֵרִים טוֹבִים.', scene: '🦉🤝🐘' },
    ],
    questions: [
      { prompt: 'מָה שָׁתָה הַפִּיל?', options: [{ scene: '🍕' }, { scene: '🍎' }, { scene: '💧' }], answer: 2 },
      { prompt: 'עַל מִי שָׁפַךְ הַפִּיל מַיִם?', options: [{ text: 'עַל דָּג' }, { text: 'עַל שׁוּפִי' }, { text: 'עַל סוּס' }], answer: 1 },
      { prompt: 'מִי צָחַק?', options: [{ scene: '🦉🐘' }, { scene: '🐶' }, { scene: '🐟' }], answer: 0 },
    ],
  },
  {
    id: 'winter',
    title: 'שׁוּפִי בַּחֹרֶף',
    cover: '🦉❄️',
    stage: 3,
    pages: [
      { text: 'הַחֹרֶף בָּא.', scene: '❄️' },
      { text: 'קַר וְיוֹרֵד גֶּשֶׁם.', scene: '🌧️🥶' },
      { text: 'שׁוּפִי לָבַשׁ כּוֹבַע וְצָעִיף.', scene: '🦉🧢🧣' },
      { text: 'הַדֹּב הָלַךְ לִישׁוֹן.', scene: '🐻💤' },
      { text: 'שׁוּפִי שָׁתָה שׁוֹקוֹלָד חַם\nוְשָׁר שִׁיר.', scene: '🦉🍫🎵' },
      { text: '"חֹרֶף טוֹב!"\nאָמַר שׁוּפִי.', scene: '🦉⛄' },
    ],
    questions: [
      { prompt: 'מָה לָבַשׁ שׁוּפִי?', options: [{ scene: '🩴' }, { scene: '🧢🧣' }, { scene: '🕶️' }], answer: 1 },
      { prompt: 'מִי הָלַךְ לִישׁוֹן?', options: [{ scene: '🐻' }, { scene: '🐶' }, { scene: '🐘' }], answer: 0 },
      { prompt: 'מָה שָׁתָה שׁוּפִי?', options: [{ text: 'חָלָב קַר' }, { text: 'מִיץ קַר' }, { text: 'שׁוֹקוֹלָד חַם' }], answer: 2 },
    ],
  },
  {
    id: 'kindergarten',
    title: 'יוֹם בַּגַּן עִם שׁוּפִי',
    cover: '🦉🏫',
    stage: 4,
    pages: [
      { text: 'בַּבֹּקֶר שׁוּפִי בָּא לַגַּן.', scene: '🦉🏫' },
      { text: 'הַיְלָדִים צִיְּרוּ וְשָׁרוּ.', scene: '🎨🎵' },
      { text: 'בַּהַפְסָקָה כֻּלָּם רָצוּ.', scene: '🏃💨' },
      { text: 'שׁוּפִי אָכַל תּוּת\nוְשָׁתָה מַיִם.', scene: '🍓💧' },
      { text: 'אַחַר כָּךְ כֻּלָּם\nחָזְרוּ הַבַּיְתָה.', scene: '🌇🏠' },
      { text: '"יוֹם נֶהְדָּר!"\nאָמַר שׁוּפִי.', scene: '🦉🌟' },
    ],
    questions: [
      { prompt: 'מָה עָשׂוּ הַיְלָדִים בַּגַּן?', options: [{ text: 'צִיְּרוּ וְשָׁרוּ' }, { text: 'שָׂחוּ בַּיָּם' }, { text: 'עָפוּ בַּשָּׁמַיִם' }], answer: 0 },
      { prompt: 'מָה אָכַל שׁוּפִי?', options: [{ scene: '🍕' }, { scene: '🍓' }, { scene: '🍦' }], answer: 1 },
      { prompt: 'לְאָן חָזְרוּ כֻּלָּם?', options: [{ scene: '🌊' }, { scene: '🌳' }, { scene: '🏠' }], answer: 2 },
    ],
  },
  {
    id: 'key',
    title: 'שׁוּפִי וְהַמַּפְתֵּחַ',
    cover: '🦉🔑',
    stage: 5,
    pages: [
      { text: 'שׁוּפִי מָצָא מַפְתֵּחַ קָטָן.', scene: '🦉🔑' },
      { text: '"אֵיפֹה הַדֶּלֶת?"\nשָׁאַל שׁוּפִי.', scene: '🚪❓' },
      { text: 'הוּא חִפֵּשׂ בַּגַּן\nוּבַשָּׂדֶה.', scene: '🔍🌾' },
      { text: 'מֵאֲחוֹרֵי עֵץ גָּדוֹל\nהָיְתָה דֶּלֶת קְטַנָּה.', scene: '🌳🚪' },
      { text: 'הַמַּפְתֵּחַ הִתְאִים לַדֶּלֶת.\nשׁוּפִי פָּתַח אוֹתָהּ.', scene: '🔑🚪✅' },
      { text: 'מֵאֲחוֹרֵי הַדֶּלֶת\nחִכּוּ חֲבֵרִים!', scene: '🎉🦊🐰' },
    ],
    questions: [
      { prompt: 'מָה מָצָא שׁוּפִי?', options: [{ scene: '🎈' }, { scene: '🔑' }, { scene: '🍎' }], answer: 1 },
      { prompt: 'אֵיפֹה הָיְתָה הַדֶּלֶת?', options: [{ text: 'בַּיָּם' }, { text: 'עַל הַגָּג' }, { text: 'מֵאֲחוֹרֵי עֵץ' }], answer: 2 },
      { prompt: 'מִי הָיָה מֵאֲחוֹרֵי הַדֶּלֶת?', options: [{ scene: '🐘' }, { scene: '🦊🐰' }, { scene: '🐢' }], answer: 1 },
    ],
  },
]
