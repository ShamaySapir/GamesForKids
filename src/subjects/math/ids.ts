// Phrase-ID contract between content (T1), generators (T2) and games (T3a, T3b).
// Numbers: numberPhrase(n) in ./numbers.ts (blocks in content/numbers.ts, written in T0).
// Prices: pricePhrase(n), a whole recorded phrase per price 1–20 (שֶׁקֶל is masculine; don't compose it from number blocks).
// T1 declares every other ID below in phrases.ts, which must keep spreading NUMBER_PHRASES.
//
// Content exports (T1), passed into generators by index.ts (T4):
//   content/things.ts   THINGS: readonly Thing[]          countable objects (see Thing in ./types)
//   content/stories.ts  STORIES: readonly StoryTemplate[] join/separate stories (see StoryTemplate in ./types)
//   content/shop.ts     SHOP: readonly { id: string; emoji: string }[]   items for the shop; phrase shopPhrase(id)

export const thingPhrase = (id: string) => `math.thing.${id}`
export const shopPhrase = (id: string) => `math.shop.${id}`
/** Story parts: `math.story.<id>.start`, `.middle`, `.end`. */
export const storyPart = (id: string, part: 'start' | 'middle' | 'end') => `math.story.${id}.${part}`

export const OP = {
  plus: 'math.op.plus', //     "וְעוֹד"
  minus: 'math.op.minus', //   "פָּחוֹת"
  equals: 'math.op.equals', // "שָׁוֶה"
  less: 'math.op.less', //     "קָטָן מִ"
  greater: 'math.op.greater', // "גָּדוֹל מִ"
  times: 'math.op.times', //   "כָּפוּל"
  div: 'math.op.div', //       "לְחַלֵּק לְ"
} as const

/** Instructions and labels. */
export const M = {
  howMany: 'math.q.howMany', //       "כַּמָּה יֵשׁ?"
  showMe: 'math.q.showMe', //         "שִׂימוּ בַּסַּל…" + number
  hearNumber: 'math.q.hearNumber', // "אֵיפֹה הַמִּסְפָּר…" + number
  matchNumber: 'math.q.matchNumber', // "אֵיפֹה יֵשׁ כָּל כָּךְ הַרְבֵּה?"
  more: 'math.q.more', //             "אֵיפֹה יֵשׁ יוֹתֵר?"
  fewer: 'math.q.fewer', //           "אֵיפֹה יֵשׁ פָּחוֹת?"
  most: 'math.q.most', //             "אֵיפֹה יֵשׁ הֲכִי הַרְבֵּה?"
  story: 'math.q.story', //           "כַּמָּה יֵשׁ עַכְשָׁו?"
  next: 'math.q.next', //             "אֵיזֶה מִסְפָּר בָּא אַחֲרֵי…" + number
  before: 'math.q.before', //         "אֵיזֶה מִסְפָּר בָּא לִפְנֵי…" + number
  skip: 'math.q.skip', //             "אֵיזֶה מִסְפָּר חָסֵר?"
  oneMore: 'math.q.oneMore', //       "אֲנִי גָּדוֹל בְּאֶחָד מִ…" + number ("who am I?")
  oneLess: 'math.q.oneLess', //       "אֲנִי קָטָן בְּאֶחָד מִ…" + number
  between: 'math.q.between', //       "אֲנִי בֵּין…" + n + "לְ…" + m  (use OP-free parts: between + n + betweenAnd + m)
  betweenAnd: 'math.q.betweenAnd', // "לְבֵין"
  place: 'math.q.place', //           "גִּרְרוּ אֶת הַחֵץ לַמִּסְפָּר…" + number
  whichNumber: 'math.q.whichNumber', // "אֵיזֶה מִסְפָּר מְסֻמָּן?"
  misplaced: 'math.q.misplaced', //   "מִצְאוּ אֶת הַמִּסְפָּר שֶׁלֹּא בַּמָּקוֹם"
  hidden: 'math.q.hidden', //         "כַּמָּה מִתְחַבְּאוֹת מִתַּחַת לַכּוֹס?" (things are feminine)
  allSplits: 'math.q.allSplits', //   "מִצְאוּ אֶת כָּל הַזּוּגוֹת שֶׁיַּחַד הֵם עֶשֶׂר"
  solve: 'math.q.solve', //           "כַּמָּה זֶה?"
  missing: 'math.q.missing', //       "אֵיזֶה מִסְפָּר חָסֵר?"
  pay: 'math.q.pay', //               "שַׁלְּמוּ בְּדִיּוּק…" + pricePhrase(price)
  change: 'math.q.change', //         "כַּמָּה עֹדֶף תְּקַבְּלוּ?"
  // 2nd grade (Stage 4b)
  build: 'math.q.build', //           "בְּנוּ אֶת הַמִּסְפָּר" + number
  flexible: 'math.q.flexible', //     "כַּמָּה אֲחָדוֹת חֲסֵרוֹת?" (e.g. 56 = 4 tens and ? ones)
  compare: 'math.q.compare', //       "אֵיזֶה סִימָן מַתְאִים?"
  chart: 'math.q.chart', //           "מִצְאוּ אֶת הַמִּסְפָּרִים הַחֲסֵרִים בַּלּוּחַ"
  estimate: 'math.q.estimate', //     "הַתּוֹצָאָה גְּדוֹלָה אוֹ קְטַנָּה מִ…" + number
  moreThan: 'math.q.moreThan', //     "יוֹתֵר"
  lessThan: 'math.q.lessThan', //     "פָּחוֹת"
  facts: 'math.q.facts', //           "כַּמָּה זֶה? בְּעַל פֶּה!"
  oddEven: 'math.q.oddEven', //       "זוּגִי אוֹ אִי זוּגִי?"
  pairUp: 'math.q.pairUp', //         "יֵשׁ חָבֵר לְכֻלָּם?"
  even: 'math.q.even', //             "זוּגִי"
  odd: 'math.q.odd', //               "אִי זוּגִי"
  array: 'math.q.array', //           "כַּמָּה יֵשׁ בְּסַךְ הַכֹּל?"
  whichExercise: 'math.q.whichExercise', // "אֵיזֶה תַּרְגִּיל מַתְאִים לַתְּמוּנָה?"
  share: 'math.q.share', //           "חַלְּקוּ שָׁוֶה בְּשָׁוֶה בֵּין הַצַּלָּחוֹת"
  groupsOf: 'math.q.groupsOf', //     "כַּמָּה קְבוּצוֹת יֵשׁ?"
  hundreds: 'math.ui.hundreds', //    "מֵאוֹת"
  tens: 'math.ui.tens', //            "עֲשָׂרוֹת"
  ones: 'math.ui.ones', //            "אֲחָדוֹת"
  check: 'math.ui.check', //          "בְּדִיקָה"
  reset: 'math.ui.reset', //          "מֵהַתְחָלָה"
} as const
