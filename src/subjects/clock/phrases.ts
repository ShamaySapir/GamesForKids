import type { PhraseMap } from '../../core/engine/types'

// Spoken times are composed from short blocks to keep the number of recordings small
// (docs/DECISIONS.md D3). Hours and minutes are feminine (שעה, דקה).

const HOURS = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת־עשרה', 'שתים־עשרה']
const UNITS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע']
const TEENS = ['עשר', 'אחת־עשרה', 'שתים־עשרה', 'שלוש־עשרה', 'ארבע־עשרה', 'חמש־עשרה', 'שש־עשרה', 'שבע־עשרה', 'שמונה־עשרה', 'תשע־עשרה']

function minutesText(n: number): string {
  if (n === 1) return 'דקה'
  if (n === 2) return 'שתי דקות'
  const word = n < 10 ? UNITS[n] : n < 20 ? TEENS[n - 10] : n === 20 ? 'עשרים' : `עשרים ו${UNITS[n - 20]}`
  return `${word} דקות`
}

const blocks: Record<string, string> = {}
HOURS.forEach((w, i) => {
  blocks[`clock.h.${i + 1}`] = w
  blocks[`clock.to.${i + 1}`] = `ל${w}`
})
for (let m = 1; m < 30; m++) blocks[`clock.min.${m}`] = minutesText(m)

export const phrases: PhraseMap = {
  ...blocks,
  'clock.quarter': 'ורבע',
  'clock.half': 'וחצי',
  'clock.quarterTo': 'רבע',
  'clock.past': 'אחרי',

  'clock.q.read': 'מה השעה?',
  'clock.q.set': 'כוונו את השעון לשעה',
  'clock.q.check': 'בדיקה',
  'clock.q.hand.hour': 'לחצו על המחוג הקצר. הוא מראה את השעות.',
  'clock.q.hand.minute': 'לחצו על המחוג הארוך. הוא מראה את הדקות.',
  'clock.q.match': 'התאימו כל שעון לשעה שלו.',
  'clock.hint.read': 'המחוג הקצר והאדום מראה שעות. המחוג הארוך והסגול מראה דקות.',
  'clock.hint.set': 'גררו את המחוגים. אפשר גם עם החצים במקלדת.',

  'clock.day.wake': 'בשבע בבוקר שופי מתעורר. כוונו את השעון!',
  'clock.day.breakfast': 'בשבע וחצי אוכלים ארוחת בוקר. כוונו את השעון!',
  'clock.day.school': 'בשמונה מתחילים את הלימודים. כוונו את השעון!',
  'clock.day.recess': 'בעשר יוצאים להפסקה. כוונו את השעון!',
  'clock.day.lunch': 'באחת אוכלים ארוחת צהריים. כוונו את השעון!',
  'clock.day.homework': 'בארבע וחצי מכינים שיעורי בית. כוונו את השעון!',
  'clock.day.park': 'בחמש הולכים לגן השעשועים. כוונו את השעון!',
  'clock.day.bath': 'בשבע בערב מתקלחים. כוונו את השעון!',
  'clock.day.sleep': 'בשמונה וחצי בערב הולכים לישון. לילה טוב!',
}
