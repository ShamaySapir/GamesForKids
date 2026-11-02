import { defineGame, type GameDef, type GenContext, type IslandDef, type Question } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
import { SHOP } from './content/shop'
import { STORIES } from './content/stories'
import { THINGS } from './content/things'
import { TapBuildGame } from './games-build'
import { CoinsGame } from './games-coins'
import { MisplacedGame, PlaceGame, WhichNumberGame } from './games-line'
import { NumberPadGame } from './games-pad'
import { PairsBoardGame } from './games-pairs'
import * as g from './generators'
import { phrases } from './phrases'
import type { PadQ } from './types'

// Skills 1–10 of docs/specs/math-k2.md (kindergarten and the new 1st-grade curriculum). Skills 11–14 are Stage 4b.

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
  skills: [
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
  ],
}
