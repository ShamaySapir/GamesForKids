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
import { ShareGame } from './games-share'
import * as g from './generators'
import * as g2 from './generators-g2'
import { phrases } from './phrases'
import type { PadQ } from './types'

// Skills 1–10: docs/specs/math-k2.md (kindergarten and the new 1st-grade curriculum).
// Skills 11–17: docs/specs/math-grade2.md (the new 2nd-grade curriculum).

const sign = (op: string) => (op === '+' ? '+' : '−')
const skipLabel = (step: string, start: string) => (Number(step) < 0 ? `ספירה לאחור בקפיצות של ${-Number(step)} מ-${start}` : `ספירה בקפיצות של ${step} מ-${start}`)
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
  ]),
}
