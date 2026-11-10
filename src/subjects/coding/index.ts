import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
import { OrderGame } from '../reading/games'
import { registerCodingArt } from './art'
import { DEBUG, FOLLOW, LEVELS, REPEAT_LEVELS } from './content/boards'
import { PATTERNS } from './content/patterns'
import { STORIES } from './content/stories'
import { ProgramGame } from './games-program'
import * as g from './generators'
import { phrases } from './phrases'
import type { ProgramQ } from './types'

// Skills follow docs/specs/coding.md (Stage 8a, pre-K to grade 2). Story algorithms reuse OrderGame and PickGame;
// building and fixing programs is ProgramGame. Board drawings register with the shared art registry (D15).
registerCodingArt()

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const program = (id: string, title: string, icon: string, generate: (ctx: GenContext) => ProgramQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: ProgramGame, generate, accepts })

export const island: IslandDef = {
  id: 'coding',
  order: 7,
  title: 'אִי הַתִּכְנוּת',
  icon: '🤖',
  color: '--code',
  phrases,
  skills: [
    {
      id: 'code.steps', title: 'מָה קוֹדֵם?', grade: -1, requires: [], sticker: '🪥',
      games: [defineGame({ id: 'order', title: 'מָה קוֹדֵם?', icon: '🪥', component: OrderGame, generate: ctx => g.stepsQuestion(ctx, STORIES), accepts: g.stepsAccepts })],
    },
    {
      id: 'code.bug-steps', title: 'מָה לֹא בְּסֵדֶר?', grade: 0, requires: ['code.steps'], sticker: '🐞',
      games: [pick('pick-bug', 'מָה לֹא בְּסֵדֶר?', '🐞', ctx => g.bugQuestion(ctx, STORIES), g.bugAccepts)],
    },
    {
      id: 'code.follow', title: 'לְאָן הוּא יַגִּיעַ?', grade: 0, requires: [], sticker: '🗺️',
      games: [pick('follow', 'לְאָן הוּא יַגִּיעַ?', '🗺️', ctx => g.followQuestion(ctx, FOLLOW), g.followAccepts)],
    },
    {
      id: 'code.arrows', title: 'מְתַכְנְתִים צַעַד צַעַד', grade: 1, requires: ['code.follow'], sticker: '🤖',
      games: [program('program', 'מְתַכְנְתִים', '🤖', ctx => g.programQuestion(ctx, LEVELS), g.programAccepts)],
    },
    {
      id: 'code.debug', title: 'מְתַקְּנִים בָּאג', grade: 1, requires: ['code.arrows', 'code.bug-steps'], sticker: '🔧',
      games: [program('fix', 'מְתַקְּנִים בָּאג', '🔧', ctx => g.debugQuestion(ctx, DEBUG), g.debugAccepts)],
    },
    {
      id: 'code.patterns', title: 'מָה חוֹזֵר?', grade: 2, requires: ['code.arrows'], sticker: '🔁',
      games: [pick('pick-loop', 'מָה חוֹזֵר?', '🔁', ctx => g.loopQuestion(ctx, PATTERNS), g.loopAccepts)],
    },
    {
      id: 'code.repeat', title: 'חוֹזְרִים עַל זֶה', grade: 2, requires: ['code.patterns'], sticker: '🌀',
      games: [program('program-repeat', 'חוֹזְרִים עַל זֶה', '🌀', ctx => g.repeatQuestion(ctx, REPEAT_LEVELS), g.repeatAccepts)],
    },
  ],
}
