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
  area: 'math.q.area', //                 "מָה הַשֶּׁטַח? כַּמָּה סֶנְטִימֶטְרִים רְבוּעִים?"
  areaHint: 'math.hint.area', //          "כַּמָּה שׁוּרוֹת יֵשׁ, וְכַמָּה מִשְׁבָּצוֹת בְּכָל שׁוּרָה?"
  thousands: 'math.ui.thousands', //      "אֲלָפִים"
  leftover: 'math.ui.leftover', //        "שְׁאֵרִית" (the left-over bowl, and "3, שְׁאֵרִית 2")
} as const

/** "round to the nearest 10 / 100 / 1,000". */
export const roundTo = (place: 10 | 100 | 1000 | 10000 | 100000) => `math.q.roundTo.${place}`
/** "which number divides by 2 / 5 / 10 with nothing left?" */
export const whichDivides = (d: 2 | 3 | 5 | 6 | 9 | 10) => `math.q.whichDivides.${d}`
/** Bin label "divides by 2 / 5 / 10". */
export const divisibleBy = (d: 2 | 3 | 5 | 6 | 9 | 10) => `math.ui.divisibleBy.${d}`
/** Angle names: "acute angle", … (option labels and their 🔊). */
export const angleName = (k: 'acute' | 'right' | 'obtuse' | 'straight') => `math.angle.${k}`
/** "which triangle is right-angled?" and so on, by angles or by sides. */
export const findTriangle = (k: 'acute' | 'right' | 'obtuse' | 'equilateral' | 'isosceles' | 'scalene') => `math.q.triangle.${k}`

/**
 * 4th grade (Stage 5b, docs/specs/math-grade4.md). Reused: M.compare, M.place, M.missing, M.solve, M.estimate (+ moreThan/
 * lessThan), M.whichExercise, M3.firstStep, M3.opsHint, M3.lastDigitHint, M3.leftover, M3.sortNumbers, M3.notDivisible,
 * roundTo, whichDivides, divisibleBy. Numbers above 10,000: spokenNumber(n); fractions: raw(fractionText(…)) (D23).
 */
export const M4 = {
  inNumber: 'math.q.inNumber', //           "בַּמִּסְפָּר הַזֶּה" (after digitValue)
  compensateHint: 'math.hint.compensate', // "אִם מוֹרִידִים אֶחָד מִשְּׁנֵי הַמִּסְפָּרִים, הַהֶפְרֵשׁ לֹא מִשְׁתַּנֶּה"
  areaModel: 'math.q.areaModel', //         "מַלְּאוּ כָּל חֵלֶק, וְאַחַר כָּךְ אֶת הַסְּכוּם"
  areaModelHint: 'math.hint.areaModel', //  "כּוֹפְלִים כָּל חֵלֶק בְּנִפְרָד, וּמְחַבְּרִים"
  total: 'math.ui.total', //                "סַךְ הַכֹּל"
  canItBe: 'math.q.canItBe', //             "הַאִם זֹאת יְכוֹלָה לִהְיוֹת הַתּוֹצָאָה?"
  yes: 'math.ui.yes', //                    "כֵּן"
  no: 'math.ui.no', //                      "לֹא"
  helpfulSplit: 'math.q.helpfulSplit', //   "אֵיזֶה פֵּרוּק עוֹזֵר לְחַלֵּק?"
  splitDivideHint: 'math.hint.splitDivide', // "מְפָרְקִים לְמִסְפָּרִים שֶׁקַּל לְחַלֵּק"
  howManyNeeded: 'math.q.howManyNeeded', // "כַּמָּה צָרִיךְ?"
  roundUpHint: 'math.hint.roundUp', //      "אִם נִשְׁאַר מִישֶׁהוּ, צָרִיךְ עוֹד אֶחָד"
  digitSumHint: 'math.hint.digitSum', //    "חַבְּרוּ אֶת כָּל הַסְּפָרוֹת"
  nameFraction: 'math.q.nameFraction', //   "אֵיזֶה חֵלֶק צָבוּעַ?"
  shade: 'math.q.shade', //                 "צִבְעוּ" (+ the fraction, spoken)
  partOf: 'math.q.partOf', //               "כַּמָּה זֶה?" over objects and a stacked fraction ("1/3 of the group")
  partOfHint: 'math.hint.partOf', //        "חַלְּקוּ לִקְבוּצוֹת שָׁווֹת, וְסִפְרוּ בִּקְבוּצָה אַחַת"
  fractionLineHint: 'math.hint.fractionLine', // "סִפְרוּ אֶת הַחֲלָקִים מֵהָאֶפֶס"
  compareFractionHint: 'math.hint.compareFraction', // "כְּכָל שֶׁיֵּשׁ יוֹתֵר חֲלָקִים, כָּל חֵלֶק קָטָן יוֹתֵר"
  sameDenHint: 'math.hint.sameDen', //      "כְּשֶׁהַמְּכַנִּים שָׁוִים, מְחַבְּרִים רַק אֶת הַמּוֹנִים"
  commonDenHint: 'math.hint.commonDen', //  "הָפְכוּ אֶת שְׁנֵי הַשְּׁבָרִים לְאוֹתוֹ מְכַנֶּה"
  numerator: 'math.ui.numerator', //        "מוֹנֶה"
  denominator: 'math.ui.denominator', //    "מְכַנֶּה"
  whole: 'math.ui.whole', //                "שָׁלֵם"
  diagonals: 'math.q.diagonals', //         "כַּמָּה אֲלַכְסוֹנִים יוֹצְאִים מִקָּדְקֹד אֶחָד?"
  diagonalsHint: 'math.hint.diagonals', //  "לֹא לְקָדְקוֹד עַצְמוֹ, וְלֹא לַשְּׁכֵנִים שֶׁלּוֹ"
  nameQuad: 'math.q.nameQuad', //           "אֵיךְ קוֹרְאִים לַצּוּרָה?"
  quadHint: 'math.hint.quad', //            "בִּדְקוּ אֶת הַצְּלָעוֹת וְאֶת הַזָּוִיּוֹת"
  convert: 'math.q.convert', //             "הַשְׁלִימוּ אֶת הַמִּדָּה"
  convertHint: 'math.hint.convert', //      "בְּמֶטֶר יֵשׁ מֵאָה סֶנְטִימֶטְרִים, וּבְסֶנְטִימֶטֶר עֲשָׂרָה מִילִימֶטְרִים"
  boxNet: 'math.q.boxNet', //               "זוֹ פְּרִיסָה שֶׁל תֵּבָה. מָה הַשֶּׁטַח שֶׁלָּהּ?"
  boxHint: 'math.hint.box', //              "כָּל שְׁתֵּי פֵּאוֹת זוֹ מוּל זוֹ שָׁווֹת"
} as const

/** "What is the digit 7 worth in this number?" — the digit is said in the phrase, so it is one recording per digit. */
export const digitValue = (d: number) => `math.q.digitValue.${d}`
/** "Where are the lines parallel / perpendicular?" */
export const findLines = (k: 'parallel' | 'perpendicular') => `math.q.lines.${k}`
/** Quadrilateral names (option labels and their 🔊). */
export const quadName = (k: 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid') => `math.quad.${k}`
/** "Which shape has …?" — one property question per shape, each fitting exactly one of the five (no inclusion, G4 p.18). */
export const quadQuestion = (k: 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid') => `math.q.quad.${k}`
/** "How long is a door?" and the like (content/lengths.ts). */
export const sensiblePhrase = (id: string) => `math.q.sensible.${id}`

/** Length units as written on screen (abbreviations take no nikud, Academy punctuation rules). */
export const UNIT_LABEL = { mm: 'מ״מ', cm: 'ס״מ', dm: 'דצ״מ', m: 'מ׳', km: 'ק״מ' } as const
