import { defineGame, type GameDef, type IslandDef } from '../../core/engine/types'
import { HandGame, MatchGame, ReadGame, SetGame } from './games'
import { accepts, dayQuestion, handQuestion, matchQuestion, readQuestion, setQuestion } from './generators'
import { phrases } from './phrases'
import { LEVELS, type Level } from './time'

// Skills follow the ministry math curriculum (docs/DECISIONS.md D6):
// gan — parts of the day and the hands; 1st — whole hours; 2nd — half and quarter hours; 3rd — to the minute.

const read = (level: Level): GameDef => defineGame({
  id: 'read', title: 'מה השעה?', icon: '👀', component: ReadGame, accepts: accepts(level),
  generate: ctx => readQuestion(ctx, level),
})

const set = (level: Level, hourOnly = false): GameDef => defineGame({
  id: 'set', title: 'כוונו את השעון', icon: '✋', component: SetGame, accepts: accepts(level),
  generate: ctx => setQuestion(ctx, level, hourOnly),
})

const match = (level: Level): GameDef => defineGame({
  id: 'match', title: 'התאמה', icon: '🧩', component: MatchGame, roundLength: 3,
  generate: ctx => matchQuestion(ctx, level),
})

export const island: IslandDef = {
  id: 'clock',
  order: 1,
  title: 'אי השעון',
  icon: '⏰',
  color: '--clock',
  phrases,
  skills: [
    {
      id: 'clock.hands', title: 'מכירים את המחוגים', grade: 0, requires: [], sticker: '🦉',
      games: [
        defineGame({ id: 'hands', title: 'איזה מחוג?', icon: '👆', component: HandGame, generate: handQuestion }),
        set(LEVELS.hours, true),
      ],
    },
    { id: 'clock.hours', title: 'שעות עגולות', grade: 1, requires: ['clock.hands'], sticker: '🕐', games: [read(LEVELS.hours), set(LEVELS.hours)] },
    { id: 'clock.half', title: 'וחצי', grade: 1, requires: ['clock.hours'], sticker: '🌗', games: [read(LEVELS.half), set(LEVELS.half)] },
    {
      id: 'clock.day', title: 'היום של שופי', grade: 1, requires: ['clock.half'], sticker: '🌞',
      games: [defineGame({ id: 'day', title: 'היום של שופי', icon: '🌅', component: SetGame, generate: ctx => dayQuestion(ctx, LEVELS.half) })],
    },
    { id: 'clock.quarter', title: 'רבע ורבע ל…', grade: 2, requires: ['clock.half'], sticker: '🍕', games: [read(LEVELS.quarter), set(LEVELS.quarter), match(LEVELS.quarter)] },
    { id: 'clock.five', title: 'כל חמש דקות', grade: 2, requires: ['clock.quarter'], sticker: '🚀', games: [read(LEVELS.five), set(LEVELS.five), match(LEVELS.five)] },
    { id: 'clock.minute', title: 'כל דקה', grade: 3, requires: ['clock.five'], sticker: '🏆', games: [read(LEVELS.minute), set(LEVELS.minute)] },
  ],
}
