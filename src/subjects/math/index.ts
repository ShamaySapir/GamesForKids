import { defineGame, type GameDef, type GenContext, type IslandDef, type Question, type SkillDef } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
import { SHOP } from './content/shop'
import { STORIES } from './content/stories'
import { THINGS } from './content/things'
import { TapBuildGame } from './games-build'
import { CoinsGame } from './games-coins'
import { MisplacedGame, PlaceGame, WhichNumberGame } from './games-line'
import { NumberPadGame } from './games-pad'
import { HundredChartGame } from './games-chart'
import { PairsBoardGame } from './games-pairs'
import { PlaceValueGame } from './games-place'
import { registerMathArt } from './art-g3'
import { ColumnGame } from './games-column'
import { GridAreaGame } from './games-grid'
import { SequenceFillGame, SequenceMistakeGame } from './games-sequence'
import { SortGame } from './games-sort'
import { FirstStepGame } from './games-tap'
import { ShareGame } from './games-share'
import * as g from './generators'
import * as g2 from './generators-g2'
import * as g3 from './generators-g3'
import { phrases } from './phrases'
import type { PadQ } from './types'

// Skills 1–10: docs/specs/math-k2.md (kindergarten and the new 1st-grade curriculum).
// Skills 11–17: docs/specs/math-grade2.md (the new 2nd-grade curriculum).
// Skills 18–28: docs/specs/math-grade3.md (the new 3rd-grade curriculum).

registerMathArt()

const sign = (op: string) => (op === '+' ? '+' : '−')
const skipLabel = (step: string, start: string) => (Number(step) < 0 ? `ספירה לאחור בקפיצות של ${-Number(step)} מ-${start}` : `ספירה בקפיצות של ${step} מ-${start}`)
const PLACE: Record<string, string> = { 10: 'עשרות', 100: 'מאות', 1000: 'אלפים' }
const ANGLE: Record<string, string> = { acute: 'חדה', right: 'ישרה', obtuse: 'קהה', straight: 'שטוחה' }
const TRIANGLE: Record<string, string> = {
  acute: 'חד זוויות', right: 'ישר זווית', obtuse: 'קהה זווית', equilateral: 'שווה צלעות', isosceles: 'שווה שוקיים', scalene: 'שונה צלעות',
}
const STORY: Record<string, string> = { boats: 'סירות', eggs: 'ביצים', cookies: 'עוגיות', teams: 'קבוצות', flowers: 'פרחים', pencils: 'עפרונות' }
const nearLabel = (n: number, p: number) => `האם ${n} קרוב יותר ל-${Math.floor(n / p) * p} או ל-${(Math.floor(n / p) + 1) * p}`
const exercise = (s: string) => s.replace(/x/g, ' × ').replace(/([+\-:=])/g, ' $1 ').replace(/\s+/g, ' ').trim()
type Rule = [RegExp, (m: string[]) => string]
const RULES: Rule[] = [
  [/^count:(\d+)$/, m => `ספירת ${m[1]} חפצים`],
  [/^num:(\d+)$/, m => `זיהוי המספר ${m[1]}`],
  [/^cmp:(\d+):(\d+)$/, m => `השוואה בין ${m[1]} ל-${m[2]}`],
  [/^most:(\d+(?::\d+)*)$/, m => `הכי הרבה מבין ${m[1]!.split(':').join(', ')}`],
  [/^story:(\d+)([+-])(\d+)$/, m => `סיפור חשבון: ${m[1]} ${sign(m[2]!)} ${m[3]}`],
  [/^next:(\d+)$/, m => `המספר שאחרי ${m[1]}`],
  [/^before:(\d+)$/, m => `המספר שלפני ${m[1]}`],
  [/^skip:(-?\d+):(\d+)$/, m => skipLabel(m[1]!, m[2]!)],
  [/^oneMore:(\d+)$/, m => `מספר אחד יותר מ-${m[1]}`],
  [/^oneLess:(\d+)$/, m => `מספר אחד פחות מ-${m[1]}`],
  [/^between:(\d+)$/, m => `המספר שבין ${m[1]} ל-${Number(m[1]) + 2}`],
  [/^line:(\d+):(\d+)$/, m => `${m[2]} על ישר המספרים (עד ${m[1]})`],
  [/^mis:(\d+):(\d+):(\d+)$/, m => `מספר שגוי על ישר המספרים עד ${m[1]} (התווית הראשונה ${m[2]}, שגיאה במקום ${Number(m[3]) + 1})`],
  [/^hide:(\d+)$/, m => `חברים של 10: ${m[1]} + ? = 10`],
  [/^splits:10$/, () => 'כל הזוגות שמשלימים ל-10'],
  [/^(?:tens:|w100:|f20:)?(\d+)([+-])(\d+)$/, m => `${m[1]} ${sign(m[2]!)} ${m[3]}`],
  [/^pay:(\d+)$/, m => `תשלום של ${m[1]} שקלים במטבעות`],
  [/^change:(\d+)-(\d+)$/, m => `עודף: שילמו ${m[1]} ומחיר ${m[2]}`],
  [/^pv:(\d+)$/, m => `בניית המספר ${m[1]} מאחדות, עשרות ומאות`],
  [/^flex:(\d+)$/, m => `פירוק גמיש של ${m[1]}`],
  [/^sign:(\d+)$/, m => `השוואת ${m[1]} למספר אחר (גדול, קטן, שווה)`],
  [/^skip1000:(-?\d+):(\d+)$/, m => skipLabel(m[1]!, m[2]!)],
  [/^chart:(\d+)$/, m => `לוח המאה, השלמת מספרים החל מ-${m[1]}`],
  [/^pairs:(\d+)$/, m => `${m[1]} חפצים: האם יש חבר לכולם`],
  [/^parity:(\d+)$/, m => `${m[1]}: זוגי או אי זוגי`],
  [/^arr:(\d+)x(\d+)$/, m => `מערך של ${m[1]} שורות על ${m[2]} טורים`],
  [/^grp:(\d+)x(\d+)$/, m => `${m[1]} קבוצות של ${m[2]}`],
  [/^tbl:(\d+)x(\d+)$/, m => `${m[1]} × ${m[2]}`],
  [/^share:(\d+)÷(\d+)$/, m => `${m[1]} ÷ ${m[2]} (חלוקה שווה לצלחות)`],
  [/^groupsof:(\d+)÷(\d+)$/, m => `${m[1]} ÷ ${m[2]} (כמה קבוצות)`],
  // Grade 3
  [/^pv4:(\d+)$/, m => `בניית המספר ${m[1]} מאלפים, מאות, עשרות ואחדות`],
  [/^flex4:(\d+):[htw]$/, m => `פירוק גמיש של ${m[1]}`],
  [/^sign4:(\d+):(\d+)$/, m => `השוואה בין ${m[1]} ל-${m[2]}`],
  [/^line10k:(\d+)(:z)?$/, m => `${m[1]} על ישר המספרים${m[2] ? ' (בין אלף לאלף)' : ' (עד 10000)'}`],
  [/^skipbig:(-?\d+):(\d+)$/, m => skipLabel(m[1]!, m[2]!)],
  [/^mistake:(-?\d+):(\d+)$/, m => `מציאת טעות בסדרה: ${skipLabel(m[1]!, m[2]!)}`],
  [/^near:(\d+):(\d+)$/, m => nearLabel(Number(m[1]), Number(m[2]))],
  [/^round:(\d+):(\d+)$/, m => `עיגול ${m[1]} ל${PLACE[m[2]!] ?? m[2]}`],
  [/^col:(\d+)([+-])(\d+)$/, m => `${m[1]} ${sign(m[2]!)} ${m[3]} במאונך`],
  [/^mleft:(.+)$/, m => `מספר חסר: ${exercise(m[1]!)}`],
  [/^est10k:(\d+)([+-])(\d+)$/, m => `אומדן: ${m[1]} ${sign(m[2]!)} ${m[3]}`],
  [/^mfac:(.+)$/, m => `מספר חסר: ${exercise(m[1]!)}`],
  [/^arrbig:(\d+)x(\d+)$/, m => `פירוק ${m[1]} × ${m[2]} לשני תרגילים קלים`],
  [/^rem:(\d+):(\d+)$/, m => `${m[1]} : ${m[2]} עם שארית`],
  [/^remstory:(\w+):(\d+):(\d+)$/, m => `בעיה מילולית (${STORY[m[1]!] ?? m[1]}): ${m[2]} : ${m[3]} עם שארית`],
  [/^div(\d+):(\d+)$/, m => `האם ${m[2]} מתחלק ב-${m[1]}`],
  [/^sortdiv:(\d+):([\d,]+)$/, m => `מיון לפי התחלקות ב-${m[1]}: ${m[2]!.split(',').join(', ')}`],
  [/^(?:x10|rt):(.+)$/, m => exercise(m[1]!)],
  [/^ops:(.+)$/, m => `סדר פעולות, מה קודם: ${exercise(m[1]!)}`],
  [/^opsr:(.+)$/, m => `סדר פעולות, התוצאה: ${exercise(m[1]!)}`],
  [/^angle:(\w+)(?::(\d+))?$/, m => `זווית ${ANGLE[m[1]!] ?? m[1]}${m[2] ? ` (${m[2]} מעלות)` : ''}`],
  [/^(?:tri|side):(\w+)$/, m => `משולש ${TRIANGLE[m[1]!] ?? m[1]}`],
  [/^area:(\d+)x(\d+)$/, m => `שטח של מלבן ${m[1]} על ${m[2]}`],
  [/^areaL:(\d+)x(\d+)\+(\d+)x(\d+)$/, m => `שטח של צורה משני מלבנים: ${m[1]} על ${m[2]} ו-${m[3]} על ${m[4]}`],
]

/** Adult-readable label for a practice item key, plain Hebrew without nikud (D18). */
export function describeMathItem(key: string): string | undefined {
  for (const [re, label] of RULES) {
    const m = re.exec(key)
    if (m) return label(m)
  }
  return undefined
}

const withDescribe = (skills: SkillDef[]): SkillDef[] => skills.map(skill => ({ ...skill, describeItem: describeMathItem }))

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const pad = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PadQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: NumberPadGame, generate, accepts })

const game = <Q extends Question>(def: GameDef<Q>) => defineGame(def)

export const island: IslandDef = {
  id: 'math',
  order: 4,
  title: 'אִי הַמִּסְפָּרִים',
  icon: '🔢',
  color: '--num',
  phrases,
  homeTip: 'לתרגל בחיי היום-יום: לספור יחד חפצים, לשלם בחנות ולחשב עודף, ולחלק בין כולם בצורה שווה',
  skills: withDescribe([
    {
      id: 'math.count-10', title: 'סוֹפְרִים עַד 10', grade: 0, requires: [], sticker: '🍎',
      games: [
        pick('how-many', 'כַּמָּה יֵשׁ?', '🔢', ctx => g.howManyQuestion(ctx, THINGS), g.countAccepts),
        game({ id: 'show-me', title: 'שִׂימוּ בַּסַּל', icon: '🧺', component: TapBuildGame, generate: ctx => g.showMeQuestion(ctx, THINGS), accepts: g.countAccepts }),
      ],
    },
    {
      id: 'math.numerals-10', title: 'מַכִּירִים מִסְפָּרִים', grade: 0, requires: [], sticker: '🔢',
      games: [
        pick('hear-number', 'אֵיפֹה הַמִּסְפָּר?', '👂', g.hearNumberQuestion, g.hearNumberAccepts),
        pick('match', 'מִסְפָּר וְכַמּוּת', '🧩', ctx => g.matchQuestion(ctx, THINGS), g.matchAccepts),
        pick('domino', 'דּוֹמִינוֹ', '🎲', g.dominoQuestion, g.dominoAccepts),
      ],
    },
    {
      id: 'math.compare', title: 'אֵיפֹה יוֹתֵר?', grade: 0, requires: ['math.count-10'], sticker: '⚖️',
      games: [
        pick('more-less', 'יוֹתֵר אוֹ פָּחוֹת', '⚖️', ctx => g.moreLessQuestion(ctx, THINGS), g.compareAccepts),
        pick('most', 'הֲכִי הַרְבֵּה', '🏔️', ctx => g.mostQuestion(ctx, THINGS), g.mostAccepts),
      ],
    },
    {
      id: 'math.stories-10', title: 'סִפּוּרֵי חֶשְׁבּוֹן', grade: 0, requires: ['math.count-10'], sticker: '🧺',
      games: [pick('story', 'סִפּוּר', '📖', ctx => g.joinSeparateQuestion(ctx, THINGS, STORIES), g.storyAccepts)],
    },
    {
      id: 'math.count-100', title: 'סוֹפְרִים עַד 100', grade: 1, requires: ['math.numerals-10'], sticker: '💯',
      games: [
        pad('next-before', 'לִפְנֵי וְאַחֲרֵי', '↔️', g.nextBeforeQuestion, g.nextBeforeAccepts),
        pad('skip-count', 'קְפִיצוֹת', '🐸', g.skipCountQuestion, g.skipCountAccepts),
        pad('who-am-i', 'מִי אֲנִי?', '🕵️', g.whoAmIQuestion, g.whoAmIAccepts),
      ],
    },
    {
      id: 'math.number-line', title: 'יְשַׁר הַמִּסְפָּרִים', grade: 1, requires: ['math.count-100'], sticker: '📏',
      games: [
        game({ id: 'place', title: 'שִׂימוּ עַל הַקַּו', icon: '📍', component: PlaceGame, generate: g.placeQuestion, accepts: g.placeAccepts }),
        game({ id: 'which-number', title: 'אֵיזֶה מִסְפָּר?', icon: '❓', component: WhichNumberGame, generate: g.whichNumberQuestion, accepts: g.whichNumberAccepts }),
        game({ id: 'misplaced', title: 'לֹא בַּמָּקוֹם', icon: '🔍', component: MisplacedGame, generate: g.misplacedQuestion }),
      ],
    },
    {
      id: 'math.splits-10', title: 'חֲבֵרִים שֶׁל 10', grade: 1, requires: ['math.stories-10'], sticker: '🤝',
      games: [
        pad('hidden', 'מִי מִתְחַבֵּא?', '🫣', ctx => g.hiddenQuestion(ctx, THINGS), g.hiddenAccepts),
        game({ id: 'all-splits', title: 'כָּל הַזּוּגוֹת', icon: '🤝', component: PairsBoardGame, generate: g.allSplitsQuestion, roundLength: 2 }),
      ],
    },
    {
      id: 'math.within-20', title: 'חִבּוּר וְחִסּוּר עַד 20', grade: 1, requires: ['math.splits-10'], sticker: '➕',
      games: [
        pad('solve', 'כַּמָּה זֶה?', '➕', g.solveQuestion, g.solveAccepts),
        pad('missing', 'מָה חָסֵר?', '❔', g.missingQuestion, g.missingAccepts),
      ],
    },
    {
      id: 'math.tens', title: 'עֲשָׂרוֹת שְׁלֵמוֹת', grade: 1, requires: ['math.within-20', 'math.count-100'], sticker: '🔟',
      games: [pad('tens', 'עֲשָׂרוֹת', '🔟', ctx => g.tensQuestion(ctx, '🪙'), g.tensAccepts)],
    },
    {
      id: 'math.money', title: 'קוֹנִים בַּחֲנוּת', grade: 1, requires: ['math.within-20'], sticker: '🪙',
      games: [
        game({ id: 'pay', title: 'מְשַׁלְּמִים', icon: '🪙', component: CoinsGame, generate: ctx => g.payQuestion(ctx, SHOP), accepts: g.payAccepts }),
        pad('change', 'עֹדֶף', '💰', ctx => g.changeQuestion(ctx, SHOP), g.changeAccepts),
      ],
    },
    {
      id: 'math.place-value', title: 'אֲחָדוֹת, עֲשָׂרוֹת, מֵאוֹת', grade: 2, requires: ['math.number-line'], sticker: '🏠',
      games: [
        game({ id: 'build-number', title: 'בּוֹנִים מִסְפָּר', icon: '🏠', component: PlaceValueGame, generate: g2.buildNumberQuestion, accepts: g2.buildNumberAccepts }),
        pad('flexible', 'פֵּרוּק גָּמִישׁ', '🧩', g2.flexibleQuestion, g2.flexibleAccepts),
        pick('compare-signs', 'גָּדוֹל, קָטָן, שָׁוֶה', '⚖️', g2.compareSignsQuestion, g2.compareSignsAccepts),
      ],
    },
    {
      id: 'math.count-1000', title: 'סוֹפְרִים עַד 1000', grade: 2, requires: ['math.place-value'], sticker: '🗺️',
      games: [
        pad('skip-1000', 'קְפִיצוֹת גְּדוֹלוֹת', '🦘', g2.skip1000Question, g2.skip1000Accepts),
        game({ id: 'hundred-chart', title: 'לוּחַ הַמֵּאָה', icon: '🔢', component: HundredChartGame, roundLength: 3, generate: g2.hundredChartQuestion, accepts: g2.hundredChartAccepts }),
      ],
    },
    {
      id: 'math.within-100', title: 'חִבּוּר וְחִסּוּר עַד 100', grade: 2, requires: ['math.tens', 'math.place-value'], sticker: '🧮',
      games: [
        pad('solve-100', 'תַּרְגִּילִים עַד 100', '🧮', g2.solve100Question, g2.within100Accepts),
        pad('missing-100', 'הַמִּסְפָּר הֶחָסֵר', '❔', g2.missing100Question, g2.within100Accepts),
        pick('estimate', 'יוֹתֵר אוֹ פָּחוֹת?', '🎯', g2.estimateQuestion, g2.within100Accepts),
      ],
    },
    {
      id: 'math.facts-20', title: 'עוּבְדּוֹת עַד 20 בְּעַל פֶּה', grade: 2, requires: ['math.within-20'], sticker: '⚡',
      games: [pad('facts', 'בְּעַל פֶּה', '⚡', g2.facts20Question, g2.facts20Accepts)],
    },
    {
      id: 'math.odd-even', title: 'זוּגִי וְאִי זוּגִי', grade: 2, requires: ['math.count-100'], sticker: '👟',
      games: [
        pick('pairs', 'יֵשׁ חָבֵר לְכֻלָּם?', '👟', ctx => g2.pairsQuestion(ctx, THINGS), g2.pairsAccepts),
        pick('parity', 'מִסְפָּרִים זוּגִיִּים', '🔢', g2.parityQuestion, g2.parityAccepts),
      ],
    },
    {
      id: 'math.times', title: 'כֶּפֶל', grade: 2, requires: ['math.facts-20'], sticker: '✖️',
      games: [
        pick('array', 'שׁוּרוֹת וְטוּרִים', '🍫', ctx => g2.arrayQuestion(ctx, THINGS), g2.arrayAccepts),
        pick('groups', 'קְבוּצוֹת שָׁווֹת', '🧺', ctx => g2.groupsQuestion(ctx, THINGS), g2.groupsAccepts),
        pad('tables', 'לוּחַ הַכֶּפֶל', '✖️', g2.tablesQuestion, g2.tablesAccepts),
      ],
    },
    {
      id: 'math.divide', title: 'חִלּוּק', grade: 2, requires: ['math.times'], sticker: '🍪',
      games: [
        game({ id: 'share', title: 'מְחַלְּקִים לַצַּלָּחוֹת', icon: '🍪', component: ShareGame, generate: ctx => g2.shareQuestion(ctx, THINGS), accepts: g2.shareAccepts }),
        pad('groups-of', 'כַּמָּה קְבוּצוֹת?', '🧺', ctx => g2.groupsOfQuestion(ctx, THINGS), g2.groupsOfAccepts),
      ],
    },
    {
      id: 'math.place-10000', title: 'מִסְפָּרִים עַד 10000', grade: 3, requires: ['math.place-value'], sticker: '🏰',
      games: [
        game({ id: 'build-4', title: 'בּוֹנִים עִם אֲלָפִים', icon: '🏰', component: PlaceValueGame, generate: g3.build4Question, accepts: g3.build4Accepts }),
        pad('flexible-4', 'פֵּרוּק גָּמִישׁ', '🧩', g3.flexible4Question, g3.flexible4Accepts),
        pick('compare-4', 'גָּדוֹל, קָטָן, שָׁוֶה', '⚖️', g3.compare4Question, g3.compare4Accepts),
        game({ id: 'line-10000', title: 'עַל יְשַׁר הַמִּסְפָּרִים', icon: '📏', component: PlaceGame, generate: g3.line10000Question, accepts: g3.line10000Accepts }),
      ],
    },
    {
      id: 'math.skip-10000', title: 'קְפִיצוֹת עַד 10000', grade: 3, requires: ['math.count-1000', 'math.place-10000'], sticker: '🦘',
      games: [
        game({ id: 'skip-big', title: 'מָה חָסֵר בַּסִּדְרָה?', icon: '🦘', component: SequenceFillGame, generate: g3.skipBigQuestion, accepts: g3.skipBigAccepts }),
        game({ id: 'find-mistake', title: 'מִצְאוּ אֶת הַטָּעוּת', icon: '🔎', component: SequenceMistakeGame, generate: g3.mistakeQuestion, accepts: g3.mistakeAccepts }),
      ],
    },
    {
      id: 'math.round', title: 'מְעַגְּלִים', grade: 3, requires: ['math.place-10000'], sticker: '🎯',
      games: [
        pick('closer-to', 'קָרוֹב יוֹתֵר', '🧲', g3.closerQuestion, g3.closerAccepts),
        pick('round-pick', 'עִגּוּל', '🎯', g3.roundPickQuestion, g3.roundPickAccepts),
      ],
    },
    {
      id: 'math.add-10000', title: 'חִבּוּר וְחִסּוּר עַד 10000', grade: 3, requires: ['math.within-100', 'math.place-10000'], sticker: '🧱',
      games: [
        game({ id: 'column', title: 'בִּמְאֻנָּךְ', icon: '🧱', component: ColumnGame, roundLength: 4, generate: g3.columnQuestion, accepts: g3.columnAccepts }),
        pad('missing-left', 'הַמִּסְפָּר הֶחָסֵר', '❔', g3.missingLeftQuestion, g3.missingLeftAccepts),
        pick('estimate-big', 'יוֹתֵר אוֹ פָּחוֹת?', '🎯', g3.estimateBigQuestion, g3.estimateBigAccepts),
      ],
    },
    {
      id: 'math.table', title: 'לוּחַ הַכֶּפֶל', grade: 3, requires: ['math.times'], sticker: '🏅',
      games: [
        pad('table-new', 'הַלּוּחַ הַמָּלֵא', '✖️', g3.tableNewQuestion, g3.tableNewAccepts),
        pad('missing-factor', 'מָה חָסֵר?', '❔', g3.missingFactorQuestion, g3.missingFactorAccepts),
        pick('array-big', 'מְפָרְקִים לִשְׁנַיִם', '🍫', ctx => g3.arrayBigQuestion(ctx, THINGS), g3.arrayBigAccepts),
        defineGame({ id: 'arena', title: 'זִירַת הַכֶּפֶל', icon: '⏱️', component: NumberPadGame, sprint: { seconds: 60 }, generate: g3.arenaQuestion, accepts: g3.arenaAccepts }),
      ],
    },
    {
      id: 'math.remainder', title: 'חִלּוּק עִם שְׁאֵרִית', grade: 3, requires: ['math.divide', 'math.table'], sticker: '🧁',
      games: [
        game({ id: 'share-left', title: 'מָה נִשְׁאָר?', icon: '🧁', component: ShareGame, generate: ctx => g3.shareLeftQuestion(ctx, THINGS), accepts: g3.shareLeftAccepts }),
        pick('remainder-pick', 'כַּמָּה וְכַמָּה נִשְׁאָר', '➗', g3.remainderPickQuestion, g3.remainderPickAccepts),
        pick('remainder-story', 'סִפּוּרֵי חִלּוּק', '🚣', g3.remainderStoryQuestion, g3.remainderStoryAccepts),
      ],
    },
    {
      id: 'math.divisible', title: 'מִתְחַלֵּק בְּ־2, 5, 10', grade: 3, requires: ['math.table'], sticker: '🔍',
      games: [
        pick('which-divides', 'מִי מִתְחַלֵּק?', '🔍', g3.whichDividesQuestion, g3.whichDividesAccepts),
        game({ id: 'sort-divides', title: 'מְמַיְּנִים', icon: '🗂️', component: SortGame, roundLength: 4, generate: g3.sortDividesQuestion, accepts: g3.sortDividesAccepts }),
      ],
    },
    {
      id: 'math.times-10', title: 'כּוֹפְלִים בְּ־10, 100, 1000', grade: 3, requires: ['math.table', 'math.place-10000'], sticker: '🚀',
      games: [
        pad('times-ten', 'כֶּפֶל בְּ־10, 100, 1000', '🚀', g3.timesTenQuestion, g3.timesTenAccepts),
        pad('round-times', 'עֲשָׂרוֹת וּמֵאוֹת', '💯', g3.roundTimesQuestion, g3.roundTimesAccepts),
      ],
    },
    {
      id: 'math.order-ops', title: 'סֵדֶר פְּעֻלּוֹת', grade: 3, requires: ['math.table'], sticker: '🧩',
      games: [
        game({ id: 'first-step', title: 'מָה עוֹשִׂים קֹדֶם?', icon: '👆', component: FirstStepGame, generate: g3.firstStepQuestion, accepts: g3.firstStepAccepts }),
        pick('result', 'כַּמָּה יוֹצֵא?', '🧩', g3.resultQuestion, g3.resultAccepts),
      ],
    },
    {
      id: 'math.angles', title: 'זָוִיּוֹת וּמְשֻׁלָּשִׁים', grade: 3, requires: [], sticker: '📐',
      games: [
        pick('angle-type', 'אֵיזוֹ זָוִית?', '📐', g3.angleTypeQuestion, g3.angleTypeAccepts),
        pick('triangle-angles', 'מְשֻׁלָּשִׁים לְפִי זָוִיּוֹת', '🔺', g3.triangleAnglesQuestion, g3.triangleAnglesAccepts),
        pick('triangle-sides', 'מְשֻׁלָּשִׁים לְפִי צְלָעוֹת', '📏', g3.triangleSidesQuestion, g3.triangleSidesAccepts),
      ],
    },
    {
      id: 'math.area', title: 'שֶׁטַח', grade: 3, requires: ['math.table'], sticker: '🟩',
      games: [
        game({ id: 'count-squares', title: 'סוֹפְרִים מִשְׁבָּצוֹת', icon: '🟩', component: GridAreaGame, roundLength: 4, generate: g3.countSquaresQuestion, accepts: g3.countSquaresAccepts }),
        game({ id: 'length-width', title: 'אֹרֶךְ וְרֹחַב', icon: '📐', component: GridAreaGame, roundLength: 4, generate: g3.lengthWidthQuestion, accepts: g3.lengthWidthAccepts }),
      ],
    },
  ]),
}
