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

/**
 * 3rd grade (Stage 5a, docs/specs/math-grade3.md). Reused from above: M.build, M.flexible, M.compare, M.place,
 * M.misplaced, M.missing, M.estimate (+ moreThan/lessThan), M.facts, M.whichExercise, M.solve, M.check, M.reset.
 * Word problems (content/remainder.ts) and numbers in sentences are read by the browser voice via raw() (D23).
 */
export const M3 = {
  whatNumber: 'math.q.whatNumber', //     "אֵיזֶה מִסְפָּר זֶה?" (23 hundreds and 56 ones = ?)
  skipBig: 'math.q.skipBig', //           "אֵילוּ מִסְפָּרִים חֲסֵרִים?"
  jumpHint: 'math.hint.jump', //          "כָּל קְפִיצָה קָדִימָה הִיא בְּאוֹתוֹ גֹּדֶל"
  jumpBackHint: 'math.hint.jumpBack', //  "כָּל קְפִיצָה אֲחוֹרָה הִיא בְּאוֹתוֹ גֹּדֶל"
  closer: 'math.q.closer', //             "לְאֵיזֶה מִסְפָּר הוּא קָרוֹב יוֹתֵר?"
  roundHint: 'math.hint.round', //        "מֵחָמֵשׁ וָמַעְלָה מְעַגְּלִים לְמַעְלָה"
  column: 'math.q.column', //             "פִּתְרוּ בִּמְאֻנָּךְ. מַתְחִילִים מֵהָאֲחָדוֹת."
  columnHint: 'math.hint.column', //      "כְּשֶׁיּוֹצֵא עֶשֶׂר אוֹ יוֹתֵר, מַעֲבִירִים לַטּוּר הַבָּא"
  borrowHint: 'math.hint.borrow', //      "כְּשֶׁאֵין מַסְפִּיק, לוֹקְחִים עֶשֶׂר מֵהַטּוּר הַבָּא"
  splitHint: 'math.hint.split', //        "אֶפְשָׁר לְפָרֵק לִשְׁנֵי תַּרְגִּילִים קַלִּים"
  shareLeft: 'math.q.shareLeft', //       "חַלְּקוּ שָׁוֶה בְּשָׁוֶה, וּמָה שֶׁנִּשְׁאָר שִׂימוּ בַּקְּעָרָה"
  remainder: 'math.q.remainder', //       "כַּמָּה יוֹצֵא, וְכַמָּה נִשְׁאָר?"
  remainderHint: 'math.hint.remainder', // "הַשְּׁאֵרִית תָּמִיד קְטַנָּה מֵהַמִּסְפָּר שֶׁמְּחַלְּקִים בּוֹ"
  sortNumbers: 'math.q.sortNumbers', //   "מַיְּנוּ אֶת הַמִּסְפָּרִים"
  notDivisible: 'math.ui.notDivisible', // "לֹא מִתְחַלֵּק"
  lastDigitHint: 'math.hint.lastDigit', // "הִסְתַּכְּלוּ עַל הַסִּפְרָה הָאַחֲרוֹנָה"
  slideHint: 'math.hint.slide', //        "בְּכֶפֶל בְּעֶשֶׂר כָּל סִפְרָה זָזָה טוּר אֶחָד שְׂמֹאלָה"
  firstStep: 'math.q.firstStep', //       "מָה עוֹשִׂים קֹדֶם? לַחֲצוּ עַל הַפְּעֻלָּה."
  opsHint: 'math.hint.ops', //            "קֹדֶם מָה שֶׁבְּתוֹךְ הַסּוֹגְרַיִם, אַחַר כָּךְ כֶּפֶל וְחִלּוּק, וּבַסּוֹף חִבּוּר וְחִסּוּר"
  angleType: 'math.q.angleType', //       "אֵיזוֹ זָוִית זוֹ?"
  angleHint: 'math.hint.angle', //        "הַשְׁווּ לְפִנָּה יְשָׁרָה, כְּמוֹ הַפִּנָּה שֶׁל דַּף"
  triangleHint: 'math.hint.triangle', //  "הִסְתַּכְּלוּ עַל הַזָּוִית הַגְּדוֹלָה בְּיוֹתֵר"
  sidesHint: 'math.hint.sides', //        "הַקַּוִּים הַקְּטַנִּים מְסַמְּנִים צְלָעוֹת שָׁווֹת"
  countSquares: 'math.q.countSquares', // "כַּמָּה מִשְׁבָּצוֹת יֵשׁ בַּצּוּרָה?"
  area: 'math.q.area', //                 "מָה הַשֶּׁטַח? כַּמָּה סַנְטִימֶטְרִים רְבוּעִים?"
  areaHint: 'math.hint.area', //          "כַּמָּה שׁוּרוֹת יֵשׁ, וְכַמָּה מִשְׁבָּצוֹת בְּכָל שׁוּרָה?"
  thousands: 'math.ui.thousands', //      "אֲלָפִים"
  leftover: 'math.ui.leftover', //        "שְׁאֵרִית" (the left-over bowl, and "3, שְׁאֵרִית 2")
} as const

/** "round to the nearest 10 / 100 / 1,000". */
export const roundTo = (place: 10 | 100 | 1000) => `math.q.roundTo.${place}`
/** "which number divides by 2 / 5 / 10 with nothing left?" */
export const whichDivides = (d: 2 | 5 | 10) => `math.q.whichDivides.${d}`
/** Bin label "divides by 2 / 5 / 10". */
export const divisibleBy = (d: 2 | 5 | 10) => `math.ui.divisibleBy.${d}`
/** Angle names: "acute angle", … (option labels and their 🔊). */
export const angleName = (k: 'acute' | 'right' | 'obtuse' | 'straight') => `math.angle.${k}`
/** "which triangle is right-angled?" and so on, by angles or by sides. */
export const findTriangle = (k: 'acute' | 'right' | 'obtuse' | 'equilateral' | 'isosceles' | 'scalene') => `math.q.triangle.${k}`
