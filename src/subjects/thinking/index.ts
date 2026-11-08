import { defineGame, type GameDef, type GenContext, type IslandDef, type Question } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
import { SortGame } from '../hebrew/games'
import { OrderGame } from '../reading/games'
import { registerThinkingArt } from './art/kit'
import { DIFF_SCENES } from './content/differences'
import { MAZES } from './content/mazes'
import { MEMORY_THEMES } from './content/memory'
import { MISSING_ITEMS } from './content/missing'
import { ODD_SETS } from './content/odd'
import { PATTERNS } from './content/patterns'
import { SEQUENCES } from './content/sequences'
import { SHADOW_SETS } from './content/shadows'
import { SORT_BOARDS } from './content/sorting'
import { SYMMETRY_ITEMS } from './content/symmetry'
import { TWIN_SETS } from './content/twins'
import { WHERE_SCENES } from './content/where'
import { DifferencesGame } from './games-diff'
import { MazeGame } from './games-maze'
import { MemoryGame } from './games-memory'
import { SymmetryGridGame } from './games-symgrid'
import * as g from './generators'
import { phrases } from './phrases'

// Skills follow docs/specs/thinking.md. Reuses OrderGame (reading) and SortGame (letters) — DECISIONS D11.
// The drawings register themselves with the shared art registry so PickGame can draw them (D15).
registerThinkingArt()

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const game = <Q extends Question>(def: GameDef<Q>) => defineGame(def)

export const island: IslandDef = {
  id: 'thinking',
  order: 5,
  title: 'אִי הַחֲשִׁיבָה',
  icon: '🧩',
  color: '--think',
  phrases,
  skills: [
    {
      id: 'think.odd-one', title: 'מִי שׁוֹנֶה?', grade: -1, requires: [], sticker: '🦄',
      games: [pick('odd-one', 'מִי שׁוֹנֶה?', '🦄', ctx => g.oddOneQuestion(ctx, ODD_SETS), g.oddAccepts)],
    },
    {
      id: 'think.twin', title: 'מִצְאוּ אֶת הַתְּאוֹם', grade: -1, requires: [], sticker: '👯',
      games: [pick('twin', 'הַתְּאוֹם', '👯', ctx => g.twinQuestion(ctx, TWIN_SETS), g.twinAccepts)],
    },
    {
      id: 'think.shadows', title: 'צְלָלִים', grade: -1, requires: [], sticker: '🌑',
      games: [pick('shadows', 'שֶׁל מִי הַצֵּל?', '🌑', ctx => g.shadowQuestion(ctx, SHADOW_SETS), g.shadowAccepts)],
    },
    {
      id: 'think.patterns', title: 'מָה בָּא אַחַר כָּךְ?', grade: -1, requires: [], sticker: '🔁',
      games: [pick('patterns', 'מָה בָּא אַחַר כָּךְ?', '🔁', ctx => g.patternQuestion(ctx, PATTERNS), g.patternAccepts)],
    },
    {
      id: 'think.where', title: 'אֵיפֹה זֶה?', grade: -1, requires: [], sticker: '📦',
      games: [pick('where', 'אֵיפֹה זֶה?', '📦', ctx => g.whereQuestion(ctx, WHERE_SCENES), g.whereAccepts)],
    },
    {
      id: 'think.memory', title: 'זִכָּרוֹן', grade: -1, requires: [], sticker: '🧠',
      games: [
        game({ id: 'memory-small', title: 'זִכָּרוֹן קָטָן', icon: '🃏', component: MemoryGame, roundLength: 2, generate: ctx => g.memoryQuestion(ctx, MEMORY_THEMES, 3), accepts: g.memoryAccepts }),
        game({ id: 'memory-big', title: 'זִכָּרוֹן גָּדוֹל', icon: '🧠', component: MemoryGame, roundLength: 2, generate: ctx => g.memoryQuestion(ctx, MEMORY_THEMES, 6), accepts: g.memoryAccepts }),
      ],
    },
    {
      id: 'think.symmetry', title: 'סִימֶטְרִיָּה', grade: 0, requires: ['think.odd-one'], sticker: '🦋',
      games: [
        pick('halves', 'חֵצִי וָחֵצִי', '🦋', ctx => g.symmetryQuestion(ctx, SYMMETRY_ITEMS), g.symmetryAccepts),
        game({ id: 'mirror-grid', title: 'כְּמוֹ בְּמַרְאָה', icon: '🪞', component: SymmetryGridGame, generate: g.symGridQuestion, accepts: g.symGridAccepts }),
      ],
    },
    {
      id: 'think.sequence', title: 'מָה קָרָה קֹדֶם?', grade: 0, requires: ['think.patterns'], sticker: '🌱',
      games: [game({ id: 'sequence', title: 'מָה קָרָה קֹדֶם?', icon: '🌱', component: OrderGame, generate: ctx => g.sequenceQuestion(ctx, SEQUENCES), accepts: g.sequenceAccepts })],
    },
    {
      id: 'think.sorting', title: 'מְמַיְּנִים', grade: 0, requires: ['think.odd-one'], sticker: '🧺',
      games: [game({ id: 'sorting', title: 'מְמַיְּנִים', icon: '🧺', component: SortGame, roundLength: 3, generate: ctx => g.sortQuestion(ctx, SORT_BOARDS), accepts: g.sortAccepts })],
    },
    {
      id: 'think.missing', title: 'מָה חָסֵר?', grade: 0, requires: ['think.twin'], sticker: '🪑',
      games: [pick('missing', 'מָה חָסֵר?', '🪑', ctx => g.missingQuestion(ctx, MISSING_ITEMS), g.missingAccepts)],
    },
    {
      id: 'think.differences', title: 'מִצְאוּ אֶת הַהֶבְדֵּלִים', grade: 0, requires: ['think.twin'], sticker: '🔍',
      games: [game({ id: 'differences', title: 'הֶבְדֵּלִים', icon: '🔍', component: DifferencesGame, roundLength: 3, generate: ctx => g.diffQuestion(ctx, DIFF_SCENES), accepts: g.diffAccepts })],
    },
    {
      id: 'think.maze', title: 'מָבוֹךְ', grade: 0, requires: ['think.where'], sticker: '🐭',
      games: [game({ id: 'maze', title: 'מָבוֹךְ', icon: '🐭', component: MazeGame, roundLength: 3, generate: ctx => g.mazeQuestion(ctx, MAZES), accepts: g.mazeAccepts })],
    },
  ],
}
