import { defineGame, type GameDef, type IslandDef, type SkillDef } from '../../core/engine/types'
import { HandGame, MatchGame, ReadGame, SetGame } from './games'
import { accepts, dayQuestion, handQuestion, matchQuestion, readQuestion, setQuestion } from './generators'
import { phrases } from './phrases'
import { LEVELS, parseKey, timeText, type Level } from './time'

// Skills follow the ministry math curriculum (docs/DECISIONS.md D6):
// gan — parts of the day and the hands; 1st — whole hours; 2nd — half and quarter hours; 3rd — to the minute.

const stripNikud = (s: string) => s.replace(/\u05BE/g, ' ').replace(/[\u0591-\u05C7]/g, '')

const DAY_LABELS: Readonly<Record<string, string>> = {
  wake: 'השכמה', breakfast: 'ארוחת בוקר', school: 'תחילת הלימודים', recess: 'הפסקה', lunch: 'ארוחת צהריים',
  homework: 'שיעורי בית', park: 'גן שעשועים', bath: 'מקלחת', sleep: 'שינה',
}

const timeLabel = (key: string): string | undefined => {
  const t = parseKey(key)
  return t ? `${stripNikud(timeText(t))} (${key})` : undefined
}

/** Adult-readable label for a practice item key, plain Hebrew without nikud (D18). */
export function describeClockItem(key: string): string | undefined {
  const plain = timeLabel(key)
  if (plain) return plain
  const hand = /^(hour|minute)@(\d{1,2}:\d{2})$/.exec(key)
  if (hand && parseKey(hand[2]!)) return `${hand[1] === 'hour' ? 'מחוג השעות' : 'מחוג הדקות'} בשעה ${hand[2]}`
  const day = /^day\.(\w+)$/.exec(key)
  if (day && DAY_LABELS[day[1]!]) return `סדר היום: ${DAY_LABELS[day[1]!]}`
  const times = key.split('|')
  if (times.length > 1 && times.every(t => parseKey(t))) return `התאמת שעות: ${times.join(', ')}`
  return undefined
}

const withDescribe = (skills: SkillDef[]): SkillDef[] => skills.map(skill => ({ ...skill, describeItem: describeClockItem }))

const read = (level: Level): GameDef => defineGame({
  id: 'read', title: 'מָה הַשָּׁעָה?', icon: '👀', component: ReadGame, accepts: accepts(level),
  generate: ctx => readQuestion(ctx, level),
})

const set = (level: Level, hourOnly = false): GameDef => defineGame({
  id: 'set', title: 'כַּוְּנוּ אֶת הַשָּׁעוֹן', icon: '✋', component: SetGame, accepts: accepts(level),
  generate: ctx => setQuestion(ctx, level, hourOnly),
})

const match = (level: Level): GameDef => defineGame({
  id: 'match', title: 'הַתְאָמָה', icon: '🧩', component: MatchGame, roundLength: 3,
  generate: ctx => matchQuestion(ctx, level),
})

export const island: IslandDef = {
  id: 'clock',
  order: 1,
  title: 'אִי הַשָּׁעוֹן',
  icon: '⏰',
  color: '--clock',
  phrases,
  homeTip: 'לקרוא יחד את השעה בשעון מחוגים בזמנים קבועים ביום, כמו ארוחת בוקר ושינה',
  skills: withDescribe([
    {
      id: 'clock.hands', title: 'מַכִּירִים אֶת הַמְּחוֹגִים', grade: 0, requires: [], sticker: '🦉',
      games: [
        defineGame({ id: 'hands', title: 'אֵיזֶה מָחוֹג?', icon: '👆', component: HandGame, generate: handQuestion }),
        set(LEVELS.hours, true),
      ],
    },
    { id: 'clock.hours', title: 'שָׁעוֹת עֲגֻלּוֹת', grade: 1, requires: ['clock.hands'], sticker: '🕐', games: [read(LEVELS.hours), set(LEVELS.hours)] },
    { id: 'clock.half', title: 'וָחֵצִי', grade: 1, requires: ['clock.hours'], sticker: '🌗', games: [read(LEVELS.half), set(LEVELS.half)] },
    {
      id: 'clock.day', title: 'הַיּוֹם שֶׁל אוֹלִי', grade: 1, requires: ['clock.half'], sticker: '🌞',
      games: [defineGame({ id: 'day', title: 'הַיּוֹם שֶׁל אוֹלִי', icon: '🌅', component: SetGame, generate: ctx => dayQuestion(ctx, LEVELS.half) })],
    },
    { id: 'clock.quarter', title: 'רֶבַע וְרֶבַע לְ…', grade: 2, requires: ['clock.half'], sticker: '🍕', games: [read(LEVELS.quarter), set(LEVELS.quarter), match(LEVELS.quarter)] },
    { id: 'clock.five', title: 'כָּל חָמֵשׁ דַּקּוֹת', grade: 2, requires: ['clock.quarter'], sticker: '🚀', games: [read(LEVELS.five), set(LEVELS.five), match(LEVELS.five)] },
    { id: 'clock.minute', title: 'כָּל דַּקָּה', grade: 3, requires: ['clock.five'], sticker: '🏆', games: [read(LEVELS.minute), set(LEVELS.minute)] },
  ]),
}
