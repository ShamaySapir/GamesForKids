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
import { registerMathArt4 } from './art-g4'
import { registerMathArt5 } from './art-g5'
import { registerMathArt6 } from './art-g6'
import { MeanGame } from './games-mean'
import { TapArtGame } from './games-tap-art'
import { BinsGame } from './games-bins'
import { FactorTreeGame } from './games-factor'
import { SlantAreaGame } from './games-slant'
import { AreaModelGame } from './games-area-model'
import { FractionPadGame } from './games-fraction'
import { ShadeGame } from './games-shade'
import { ColumnGame } from './games-column'
import { GridAreaGame } from './games-grid'
import { SequenceFillGame, SequenceMistakeGame } from './games-sequence'
import { SortGame } from './games-sort'
import { FirstStepGame } from './games-tap'
import { ShareGame } from './games-share'
import * as g from './generators'
import * as g2 from './generators-g2'
import * as g3 from './generators-g3'
import * as g4 from './generators-g4'
import * as g5 from './generators-g5'
import * as g6 from './generators-g6'
import { fmt } from './numbers'
import { phrases } from './phrases'
import type { PadQ } from './types'

// Skills 1–10: docs/specs/math-k2.md (kindergarten and the new 1st-grade curriculum).
// Skills 11–17: docs/specs/math-grade2.md (the new 2nd-grade curriculum).
// Skills 18–28: docs/specs/math-grade3.md (the new 3rd-grade curriculum).
// Skills 29–41: docs/specs/math-grade4.md (the new 4th-grade curriculum).
// Skills 42–52: docs/specs/math-grade5.md (the new 5th-grade curriculum).
// Skills 53–63: docs/specs/math-grade6.md (the new 6th-grade curriculum).

registerMathArt()
registerMathArt4()
registerMathArt5()
registerMathArt6()

const sign = (op: string) => (op === '+' ? '+' : '−')
const skipLabel = (step: string, start: string) => (Number(step) < 0 ? `ספירה לאחור בקפיצות של ${-Number(step)} מ-${start}` : `ספירה בקפיצות של ${step} מ-${start}`)
const PLACE: Record<string, string> = { 10: 'עשרות', 100: 'מאות', 1000: 'אלפים' }
const ANGLE: Record<string, string> = { acute: 'חדה', right: 'ישרה', obtuse: 'קהה', straight: 'שטוחה' }
const TRIANGLE: Record<string, string> = {
  acute: 'חד זוויות', right: 'ישר זווית', obtuse: 'קהה זווית', equilateral: 'שווה צלעות', isosceles: 'שווה שוקיים', scalene: 'שונה צלעות',
}
const STORY: Record<string, string> = { boats: 'סירות', eggs: 'ביצים', cookies: 'עוגיות', teams: 'קבוצות', flowers: 'פרחים', pencils: 'עפרונות' }
const ROUND_UP: Record<string, string> = { bus: 'אוטובוסים', boxes: 'ארגזים', tables: 'שולחנות', boats: 'סירות', cars: 'מכוניות' }
const SHAPE: Record<string, string> = { circle: 'עיגול', rect: 'מלבן', strip: 'רצועה' }
const QUAD: Record<string, string> = { square: 'ריבוע', rectangle: 'מלבן', rhombus: 'מעוין', parallelogram: 'מקבילית', trapezoid: 'טרפז' }
const UNIT: Record<string, string> = { mm: 'מילימטרים', cm: 'סנטימטרים', dm: 'דצימטרים', m: 'מטרים', km: 'קילומטרים' }
const SENSIBLE: Record<string, string> = {
  door: 'גובה דלת', pencil: 'אורך עיפרון', ant: 'אורך נמלה', classroom: 'אורך כיתה', cities: 'מרחק בין ערים', bed: 'אורך מיטה', phone: 'אורך טלפון', pool: 'אורך בריכה',
}
const SOLID: Record<string, string> = {
  cube: 'קובייה', box: 'תיבה', 'tri-prism': 'מנסרה משולשת', 'square-pyramid': 'פירמידה מרובעת', 'tri-pyramid': 'פירמידה משולשת', 'hex-prism': 'מנסרה משושה',
}
const SOLID_ASK: Record<string, string> = { faces: 'פאות', edges: 'מקצועות', vertices: 'קודקודים' }
const HEIGHT_SHAPE: Record<string, string> = { acute: 'משולש חד זוויות', right: 'משולש ישר זווית', obtuse: 'משולש קהה זווית', parallelogram: 'מקבילית' }
const SURVEY: Record<string, string> = { fruit: 'פרי אהוב', pet: 'חיה אהובה', color: 'צבע אהוב', sport: 'משחק בהפסקה' }
const SHARE: Record<string, string> = { pizza: 'פיצות', cake: 'עוגות', chocolate: 'חפיסות שוקולד' }
const OPWORD: Record<string, string> = { x: '×', d: ':', p: '+', m: '−' }
const rule = (r: string) => r.split(',').map(s => `${OPWORD[s[0]!] ?? s[0]} ${s.slice(1)}`).join(' ')
const STORY6: Record<string, string> = { shirt: 'חולצה', ball: 'כדור', book: 'ספר', ticket: 'כרטיס', class: 'כיתה', savings: 'חיסכון' }
const PART: Record<string, string> = { radius: 'רדיוס', diameter: 'קוטר', chord: 'מיתר', arc: 'קשת' }
const VOLUME: Record<string, string> = { pool: 'בריכה', cup: 'כוס', bottle: 'בקבוק', room: 'חדר', spoon: 'כפית' }
const TRUTH: Record<string, string> = { in: 'האם הממוצע הוא אחד המספרים', wh: 'האם הממוצע שלם', ad: 'האם מספר נוסף משנה את הממוצע' }
const frac = (n: string, d: string) => (d === '1' ? n : `${n}/${d}`)
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
  // Grade 4
  [/^dv:(\d+):(\d)$/, m => `ערך הספרה ${m[2]} במספר ${fmt(Number(m[1]))}`],
  [/^cmp6:(\d+):(\d+)$/, m => `השוואה בין ${fmt(Number(m[1]))} ל-${fmt(Number(m[2]))}`],
  [/^line1m:(\d+)$/, m => `${fmt(Number(m[1]))} על ישר המספרים עד מיליון`],
  [/^rb:(\d+):(\d+)$/, m => `עיגול ${fmt(Number(m[1]))} ל${PLACE[m[2]!] ?? fmt(Number(m[2]))}`],
  [/^colb:(\d+)([+-])(\d+)$/, m => `${fmt(Number(m[1]))} ${sign(m[2]!)} ${fmt(Number(m[3]))} במאונך`],
  [/^comp:(\d+):(\d+):([rl])$/, m => `פיצוי: ${m[1]} פחות ${m[2]}${m[3] === 'l' ? ' (המספר החסר משמאל)' : ''}`],
  [/^estm:(\d+)([+-])(\d+)$/, m => `אומדן: ${fmt(Number(m[1]))} ${sign(m[2]!)} ${fmt(Number(m[3]))}`],
  [/^rt2:(\d+)x(\d+)$/, m => `${fmt(Number(m[1]))} × ${m[2]}`],
  [/^am:(\d+)x(\d+)$/, m => `${m[1]} × ${m[2]} במודל השטח`],
  [/^ld:(\d+):(\d+):(\d+)$/, m => `בדיקת ספרת האחדות: האם ${m[1]} × ${m[2]} = ${m[3]}`],
  [/^split:(\d+):(\d+)$/, m => `פירוק לחילוק: ${m[1]} : ${m[2]}`],
  [/^dp:(\d+):(\d+)$/, m => `${m[1]} : ${m[2]}`],
  [/^dr:(\d+):(\d+)$/, m => `${m[1]} : ${m[2]} עם שארית`],
  [/^bus:(\w+):(\d+):(\d+)$/, m => `כמה צריך (${ROUND_UP[m[1]!] ?? m[1]}): ${m[2]} : ${m[3]}, מעגלים למעלה`],
  [/^div369:(\d):(\d+)$/, m => `האם ${m[2]} מתחלק ב-${m[1]}`],
  [/^sort369:(\d):([\d,]+)$/, m => `מיון לפי התחלקות ב-${m[1]}: ${m[2]!.split(',').join(', ')}`],
  [/^ops2:(.+)$/, m => `סדר פעולות, מה קודם: ${exercise(m[1]!)}`],
  [/^ops2r:(.+)$/, m => `סדר פעולות, התוצאה: ${exercise(m[1]!)}`],
  [/^fracname:(\w+):(\d+):(\d+)$/, m => `איזה חלק צבוע: ${m[3]}/${m[2]} (${SHAPE[m[1]!] ?? m[1]})`],
  [/^shade:(\w+):(\d+):(\d+)$/, m => `לצבוע ${m[3]}/${m[2]} (${SHAPE[m[1]!] ?? m[1]})`],
  [/^partof:(\d+):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} מתוך ${m[3]}`],
  [/^fline:(\d+):(\d+)$/, m => `${m[1]}/${m[2]} על ישר המספרים`],
  [/^fcmp:(\d+):(\d+):(\d+):(\d+)$/, m => `השוואת שברים: ${frac(m[1]!, m[2]!)} ו-${frac(m[3]!, m[4]!)}`],
  [/^fl:(\d+):(\d+):(\d+):([pm])$/, m => `${m[1]}/${m[3]} ${m[4] === 'p' ? '+' : '−'} ${m[2]}/${m[3]}`],
  [/^fr:(\d+):(\d+):([+-]):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} ${sign(m[3]!)} ${m[4]}/${m[5]}`],
  [/^fw:(\d+):(\d+):(\d+)$/, m => `${m[1]} × ${m[2]}/${m[3]}`],
  [/^lines:(\w+)$/, m => `קווים ${m[1] === 'parallel' ? 'מקבילים' : 'מאונכים'}`],
  [/^diag:(\d+)$/, m => `אלכסונים ממצולע עם ${m[1]} צלעות`],
  [/^nq:(\w+)$/, m => `שם המרובע: ${QUAD[m[1]!] ?? m[1]}`],
  [/^quadp:(\w+)$/, m => `תכונות המרובע: ${QUAD[m[1]!] ?? m[1]}`],
  [/^conv:(\w+):(\w+):(\d+):([du])$/, m => `המרת יחידות: ${m[3]} ${m[4] === 'd' ? UNIT[m[1]!] : UNIT[m[2]!]} ל${m[4] === 'd' ? UNIT[m[2]!] : UNIT[m[1]!]}`],
  [/^sens:(\w+)$/, m => `אורך הגיוני: ${SENSIBLE[m[1]!] ?? m[1]}`],
  [/^box:(\d+):(\d+):(\d+)$/, m => `שטח פנים של תיבה ${m[1]} על ${m[2]} על ${m[3]}`],
  // Grade 5
  [/^dvb:(\d+):(\d)$/, m => `ערך הספרה ${m[2]} במספר ${fmt(Number(m[1]))}`],
  [/^cmp9:(\d+):(\d+)$/, m => `השוואה בין ${fmt(Number(m[1]))} ל-${fmt(Number(m[2]))}`],
  [/^tpx:(\d+):(\d+)$/, m => `${fmt(Number(m[1]))} × ${fmt(Number(m[2]))}`],
  [/^tpd:(\d+):(\d+)$/, m => `${fmt(Number(m[1]))} : ${fmt(Number(m[2]))}`],
  [/^prime:([\d,]+)$/, m => `ראשוני, פריק או אף אחד: ${m[1]!.split(',').join(', ')}`],
  [/^rect:(\d+)$/, m => `כמה מלבנים בשטח ${m[1]}`],
  [/^ft:(\d+)$/, m => `פירוק ${m[1]} לגורמים ראשוניים`],
  [/^lb1:(\d+):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} על ישר המספרים עד ${m[3]}`],
  [/^mixm:(\d+):(\d+)$/, m => `${m[1]}/${m[2]} כמספר מעורב`],
  [/^mixi:(\d+):(\d+):(\d+)$/, m => `${m[1]} ${m[2]}/${m[3]} כשבר אחד`],
  [/^fad:(\w+):(\d+):(\d+)$/, m => `שבר כחילוק: ${m[2]} ${SHARE[m[1]!] ?? m[1]} ל-${m[3]}`],
  [/^simp:(\d+):(\d+)$/, m => `צמצום ${m[1]}/${m[2]}`],
  [/^exp:(\d+):(\d+):(\d+)$/, m => `הרחבת ${m[1]}/${m[2]} למכנה ${m[3]}`],
  [/^btw:(\d+):(\d+):(\d+):(\d+)$/, m => `שבר בין ${m[1]}/${m[2]} ל-${m[3]}/${m[4]}`],
  [/^fcu:(\d+):(\d+):(\d+):(\d+)$/, m => `השוואת ${m[1]}/${m[2]} ו-${m[3]}/${m[4]}`],
  [/^au:(\d+):(\d+):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} + ${m[3]}/${m[4]}`],
  [/^amx:(\d+):(\d+):(\d+):(\d+):(\d+):(\d+)$/, m => `${m[1]} ${m[2]}/${m[3]} + ${m[4]} ${m[5]}/${m[6]}`],
  [/^clo:([hw]):(\d+):(\d+):(\d+):(\d+)$/, m => `אומדן: ${m[2]}/${m[3]} + ${m[4]}/${m[5]}${m[1] === 'h' ? ' (לחצי)' : ''}`],
  [/^dh:([\d.]+)$/, m => `בניית ${m[1]} בטבלת הערך`],
  [/^slx:([\d.]+):(\d+)$/, m => `${m[1]} × ${fmt(Number(m[2]))}`],
  [/^sld:([\d.]+):(\d+)$/, m => `${m[1]} : ${fmt(Number(m[2]))}`],
  [/^dfa:(\d+):(\d+)$/, m => `עשרוני לשבר: ${m[1]}/${m[2]}`],
  [/^dfb:(\d+):(\d+)$/, m => `שבר לעשרוני: ${m[1]}/${m[2]}`],
  [/^cd:([\d.]+):([\d.]+)$/, m => `השוואה בין ${m[1]} ל-${m[2]}`],
  [/^dl(1|10):([\d.]+)$/, m => `${m[2]} על ישר המספרים עד ${m[1]}`],
  [/^rdw:([\d.]+)$/, m => `עיגול ${m[1]} לשלם`],
  [/^rdt:([\d.]+)$/, m => `עיגול ${m[1]} לעשיריות`],
  [/^cold:([\d.]+)([+-])([\d.]+)$/, m => `${m[1]} ${sign(m[2]!)} ${m[3]} במאונך`],
  [/^ch:(\d+)$/, m => `עודף מ-20 שקלים כשהמחיר ${(Number(m[1]) / 10).toFixed(2)}`],
  [/^mcd:(\d+):(\d+)$/, m => `${m[1]} מטרים ו-${m[2]} סנטימטרים במטרים`],
  [/^mcc:(\d+):(\d+)$/, m => `${m[1]} מטרים ו-${m[2]} סנטימטרים בסנטימטרים`],
  [/^ph:(\w+):(\d+)$/, m => `הגובה ב${HEIGHT_SHAPE[m[1]!] ?? m[1]} (סיבוב ${Number(m[2]) * 30} מעלות)`],
  [/^ta:([hv]):(\d+):(\d+):(-?\d+):([ud])$/, m => `שטח משולש: בסיס ${m[2]}, גובה ${m[3]} (${m[1] === 'h' ? 'אופקי' : 'אנכי'}, היסט ${m[4]}${m[5] === 'u' ? '' : ', הפוך'})`],
  [/^pa:([hv]):(\d+):(\d+):(-?\d+):([ud])$/, m => `שטח מקבילית: בסיס ${m[2]}, גובה ${m[3]} (${m[1] === 'h' ? 'אופקי' : 'אנכי'}, היסט ${m[4]}${m[5] === 'u' ? '' : ', הפוך'})`],
  [/^sn:([\w-]+)$/, m => `פריסה של ${SOLID[m[1]!] ?? m[1]}`],
  [/^fe:([\w-]+):(\w+)$/, m => `${SOLID_ASK[m[2]!] ?? m[2]} של ${SOLID[m[1]!] ?? m[1]}`],
  [/^mode:(\w+):([\d.,]+)$/, m => `השכיח בטבלה (${SURVEY[m[1]!] ?? m[1]}): ${m[2]}`],
  // Grade 6
  [/^mo:([\w,]+):(\d+)$/, m => `מכונה ${rule(m[1]!)}, קלט ${m[2]}`],
  [/^mr:([\w,]+)$/, m => `הכלל של המכונה: ${rule(m[1]!)}`],
  [/^rom:(\d+):([ab])$/, m => `ספרות רומיות: ${m[1]} (${m[2] === 'a' ? 'לקרוא' : 'לכתוב'})`],
  [/^gem:(\d+):([ab])$/, m => `גימטריה: ${m[1]} (${m[2] === 'a' ? 'לקרוא' : 'לכתוב'})`],
  [/^fo:(\d+):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} מתוך ${m[3]}`],
  [/^fg:(\d+):(\d+):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} × ${m[3]}/${m[4]} על רשת`],
  [/^bs:([xd]):(\d+):(\d+):(\d+)$/, m => `האם ${m[1] === 'x' ? `${m[4]} × ${m[2]}/${m[3]}` : `${m[4]} : ${m[2]}/${m[3]}`} גדול או קטן מ-${m[4]}`],
  [/^hf:w:(\d+):(\d+)$/, m => `כמה 1/${m[2]} נכנסים ב-${m[1]}`],
  [/^hf:f:(\d+):(\d+)$/, m => `כמה 1/${m[2]} נכנסים ב-${m[1]}/${m[2]}`],
  [/^du:(\d+):(\d+)$/, m => `${m[1]} : 1/${m[2]}`],
  [/^df:(\d+):(\d+):(\d+):(\d+)$/, m => `${m[1]}/${m[2]} : ${m[3]}/${m[4]}`],
  [/^wp:([\d.]+):([\d.]+)$/, m => `איפה הנקודה: ${m[1]} × ${m[2]}`],
  [/^dm:([xd]):([\d.]+):([\d.]+)$/, m => `${m[2]} ${m[1] === 'x' ? '×' : ':'} ${m[3]}`],
  [/^ep:([xd]):([\d.]+):(\d+)$/, m => `אומדן: ${m[3]} ${m[1] === 'x' ? '×' : ':'} ${m[2]}`],
  [/^po:(\d+):(\d+)$/, m => `${m[1]}% מתוך ${m[2]}`],
  [/^pm:(\d+):(f|d|pf|pd)$/, m => `${m[1]}% ${m[2] === 'f' || m[2] === 'pf' ? 'כשבר' : 'כעשרוני'}${m[2]!.startsWith('p') ? ' (מהשבר לאחוזים)' : ''}`],
  [/^pwh:(\w+):(\d+):(\d+)$/, m => `מציאת השלם (${STORY6[m[1]!] ?? m[1]}): ${m[3]} הם ${m[2]}%`],
  [/^pdi:(\w+):(\d+):(\d+)$/, m => `הנחה של ${m[2]}% על ${m[3]} (${STORY6[m[1]!] ?? m[1]})`],
  [/^pri:(\w+):(\d+):(\d+)$/, m => `התייקרות של ${m[2]}% על ${m[3]} (${STORY6[m[1]!] ?? m[1]})`],
  [/^ca:(\w+):([\w.,-]+):(\d+)$/, m => `שטח של צורה מורכבת (${m[1] === 'L' ? 'ר' : m[1] === 'T' ? 'ט' : 'ח'}, ${m[2]}, ${m[3]})`],
  [/^cpm:(\w+):([\w.,-]+):(\d+)$/, m => `היקף של צורה מורכבת (${m[1] === 'L' ? 'ר' : m[1] === 'T' ? 'ט' : 'ח'}, ${m[2]}, ${m[3]})`],
  [/^se:(\d+):(\d+)(:1)?$/, m => `${m[3] ? 'רק האורך גדל פי 2' : 'הצלעות גדלו פי 2'}: מלבן ${m[1]} על ${m[2]}`],
  [/^cpt:(\w+)$/, m => `חלקי המעגל: ${PART[m[1]!] ?? m[1]}`],
  [/^circ:(\d+)$/, m => `היקף מעגל ברדיוס ${m[1]}`],
  [/^carea:(\d+)$/, m => `שטח עיגול ברדיוס ${m[1]}`],
  [/^cub:(\d+):(\d+):(\d+)$/, m => `ספירת קוביות בתיבה ${m[1]} על ${m[2]} על ${m[3]}`],
  [/^bv:(\d+):(\d+):(\d+)$/, m => `נפח תיבה ${m[1]} על ${m[2]} על ${m[3]}`],
  [/^vu:(\w+)$/, m => `יחידת נפח הגיונית: ${VOLUME[m[1]!] ?? m[1]}`],
  [/^lb:([\d,]+)$/, m => `השוואת עמודות לממוצע: ${m[1]!.split(',').join(', ')}`],
  [/^fm:([\d,]+)$/, m => `הממוצע של ${m[1]!.split(',').join(', ')}`],
  [/^mt:(in|wh):([\d,]+)$/, m => `${TRUTH[m[1]!]}: ${m[2]!.split(',').join(', ')}`],
  [/^mt:ad:([\d,]+):(\d+)$/, m => `${TRUTH.ad}: ${m[1]!.split(',').join(', ')} ועוד ${m[2]}`],
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
      id: 'math.table', title: 'לוּחַ הַכֶּפֶל הַמָּלֵא', grade: 3, requires: ['math.times'], sticker: '🏅',
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
    {
      id: 'math.million', title: 'מִסְפָּרִים עַד מִילְיוֹן', grade: 4, requires: ['math.place-10000'], sticker: '🏔️',
      games: [
        pick('digit-value', 'כַּמָּה שָׁוָה הַסִּפְרָה?', '🔢', g4.digitValueQuestion, g4.digitValueAccepts),
        pick('compare-6', 'מִי גָּדוֹל יוֹתֵר?', '⚖️', g4.compare6Question, g4.compare6Accepts),
        game({ id: 'line-million', title: 'יְשַׁר הַמִּילְיוֹן', icon: '📏', component: PlaceGame, generate: g4.lineMillionQuestion, accepts: g4.lineMillionAccepts }),
        pick('round-big', 'עִגּוּל מִסְפָּרִים גְּדוֹלִים', '🎯', g4.roundBigQuestion, g4.roundBigAccepts),
      ],
    },
    {
      id: 'math.add-million', title: 'חִבּוּר וְחִסּוּר עַד מִילְיוֹן', grade: 4, requires: ['math.add-10000', 'math.million'], sticker: '🧮',
      games: [
        game({ id: 'column-big', title: 'תַּרְגִּילֵי עֲנָק', icon: '🧱', component: ColumnGame, roundLength: 4, generate: g4.columnBigQuestion, accepts: g4.columnBigAccepts }),
        pad('compensate', 'מְפַצִּים', '🔁', g4.compensateQuestion, g4.compensateAccepts),
        pick('estimate-million', 'אֹמֶדֶן', '🎯', g4.estimateMillionQuestion, g4.estimateMillionAccepts),
      ],
    },
    {
      id: 'math.multiply', title: 'כֶּפֶל בְּמִסְפָּרִים גְּדוֹלִים', grade: 4, requires: ['math.table', 'math.times-10'], sticker: '🟧',
      games: [
        pad('round-times-2', 'כֶּפֶל עֲגֻלִּים', '💯', g4.roundTimes2Question, g4.roundTimes2Accepts),
        game({ id: 'area-model', title: 'מוֹדֶל הַשֶּׁטַח', icon: '🟧', component: AreaModelGame, roundLength: 4, generate: g4.areaModelQuestion, accepts: g4.areaModelAccepts }),
        pick('last-digit', 'סִפְרַת הָאֲחָדוֹת', '🔍', g4.lastDigitQuestion, g4.lastDigitAccepts),
      ],
    },
    {
      id: 'math.divide-big', title: 'חִלּוּק בְּמִסְפָּר חַד־סִפְרָתִי', grade: 4, requires: ['math.remainder', 'math.multiply'], sticker: '🚌',
      games: [
        pick('split-divide', 'מְפָרְקִים וּמְחַלְּקִים', '✂️', g4.splitDivideQuestion, g4.splitDivideAccepts),
        pad('divide-pad', 'חִלּוּק בְּלִי שְׁאֵרִית', '➗', g4.dividePadQuestion, g4.dividePadAccepts),
        pick('divide-remainder', 'שְׁאֵרִית בְּמִסְפָּרִים גְּדוֹלִים', '🧁', g4.divideRemainderQuestion, g4.divideRemainderAccepts),
        pick('bus-story', 'כַּמָּה צָרִיךְ?', '🚌', g4.busStoryQuestion, g4.busStoryAccepts),
      ],
    },
    {
      id: 'math.divisible-369', title: 'מִתְחַלֵּק בְּ־3, 6, 9', grade: 4, requires: ['math.divisible'], sticker: '🔎',
      games: [
        pick('which-divides-369', 'מִי מִתְחַלֵּק?', '🔎', g4.whichDivides369Question, g4.whichDivides369Accepts),
        game({ id: 'sort-369', title: 'מְמַיְּנִים', icon: '🗂️', component: SortGame, roundLength: 4, generate: g4.sort369Question, accepts: g4.sort369Accepts }),
      ],
    },
    {
      id: 'math.order-ops-2', title: 'סֵדֶר פְּעֻלּוֹת 2', grade: 4, requires: ['math.order-ops'], sticker: '🧠',
      games: [
        game({ id: 'first-step-2', title: 'מָה קֹדֶם?', icon: '👆', component: FirstStepGame, generate: g4.firstStep2Question, accepts: g4.firstStep2Accepts }),
        pick('result-2', 'כַּמָּה יוֹצֵא?', '🧠', g4.result2Question, g4.result2Accepts),
      ],
    },
    {
      id: 'math.fractions', title: 'מָה זֶה שֶׁבֶר?', grade: 4, requires: ['math.divide'], sticker: '🍕',
      games: [
        pick('name-fraction', 'אֵיזֶה חֵלֶק צָבוּעַ?', '🍕', g4.nameFractionQuestion, g4.nameFractionAccepts),
        game({ id: 'shade-fraction', title: 'צוֹבְעִים שֶׁבֶר', icon: '🖍️', component: ShadeGame, generate: g4.shadeFractionQuestion, accepts: g4.shadeFractionAccepts }),
        pad('part-of', 'חֵלֶק מִכַּמּוּת', '🍎', ctx => g4.partOfQuestion(ctx, THINGS), g4.partOfAccepts),
      ],
    },
    {
      id: 'math.fraction-compare', title: 'מַשְׁוִים שְׁבָרִים', grade: 4, requires: ['math.fractions'], sticker: '⚖️',
      games: [
        game({ id: 'fraction-line', title: 'שְׁבָרִים עַל הַיָּשָׁר', icon: '📏', component: PlaceGame, generate: g4.fractionLineQuestion, accepts: g4.fractionLineAccepts }),
        pick('compare-fractions', 'מִי גָּדוֹל יוֹתֵר?', '⚖️', g4.compareFractionsQuestion, g4.compareFractionsAccepts),
      ],
    },
    {
      id: 'math.fraction-add', title: 'חִבּוּר וְחִסּוּר שְׁבָרִים', grade: 4, requires: ['math.fraction-compare'], sticker: '🥧',
      games: [
        game({ id: 'add-like', title: 'אוֹתוֹ מְכַנֶּה', icon: '🥧', component: FractionPadGame, generate: g4.addLikeQuestion, accepts: g4.addLikeAccepts }),
        game({ id: 'add-related', title: 'מְכַנִּים קְרוֹבִים', icon: '🍰', component: FractionPadGame, generate: g4.addRelatedQuestion, accepts: g4.addRelatedAccepts }),
        game({ id: 'whole-times', title: 'שָׁלֵם כָּפוּל שֶׁבֶר', icon: '✖️', component: FractionPadGame, generate: g4.wholeTimesQuestion, accepts: g4.wholeTimesAccepts }),
      ],
    },
    {
      id: 'math.lines', title: 'מַקְבִּילִים וּמְאֻנָּכִים', grade: 4, requires: ['math.angles'], sticker: '🛤️',
      games: [
        pick('parallel-perpendicular', 'אֵיפֹה הַקַּוִּים?', '🛤️', g4.parallelPerpendicularQuestion, g4.parallelPerpendicularAccepts),
        pad('diagonals', 'אֲלַכְסוֹנִים', '✳️', g4.diagonalsQuestion, g4.diagonalsAccepts),
      ],
    },
    {
      id: 'math.quadrilaterals', title: 'מְרֻבָּעִים', grade: 4, requires: ['math.lines'], sticker: '🔷',
      games: [
        pick('name-quad', 'אֵיךְ קוֹרְאִים לוֹ?', '🔷', g4.nameQuadQuestion, g4.nameQuadAccepts),
        pick('quad-property', 'מִי מַתְאִים?', '🔍', g4.quadPropertyQuestion, g4.quadPropertyAccepts),
      ],
    },
    {
      id: 'math.length', title: 'יְחִידוֹת אֹרֶךְ', grade: 4, requires: ['math.times-10'], sticker: '📏',
      games: [
        pad('convert-length', 'מְמִירִים יְחִידוֹת', '🔄', g4.convertLengthQuestion, g4.convertLengthAccepts),
        pick('sensible-length', 'מָה הֶגְיוֹנִי?', '🤔', g4.sensibleLengthQuestion, g4.sensibleLengthAccepts),
      ],
    },
    {
      id: 'math.box', title: 'שֶׁטַח פְּנֵי תֵּבָה', grade: 4, requires: ['math.area', 'math.multiply'], sticker: '📦',
      games: [
        game({ id: 'box-net', title: 'פְּרִיסַת תֵּבָה', icon: '📦', component: GridAreaGame, roundLength: 4, generate: g4.boxNetQuestion, accepts: g4.boxNetAccepts }),
      ],
    },
    {
      id: 'math.huge', title: 'מִסְפָּרִים גְּדוֹלִים מִמִּילְיוֹן', grade: 5, requires: ['math.million'], sticker: '🌌',
      games: [
        pick('digit-value-big', 'הַסִּפְרָה בַּמִּסְפָּר הָעֲנָק', '🔢', g5.digitValueBigQuestion, g5.digitValueBigAccepts),
        pick('compare-big', 'מִי הֲכִי גָּדוֹל?', '⚖️', g5.compareBigQuestion, g5.compareBigAccepts),
        pad('times-power', 'כֶּפֶל וְחִלּוּק בְּ־1000', '🚀', g5.timesPowerQuestion, g5.timesPowerAccepts),
      ],
    },
    {
      id: 'math.primes', title: 'רִאשׁוֹנִיִּים וּפְרִיקִים', grade: 5, requires: ['math.divisible-369'], sticker: '🔑',
      games: [
        game({ id: 'prime-or-not', title: 'רִאשׁוֹנִי אוֹ פָּרִיק?', icon: '🔑', component: BinsGame, roundLength: 4, generate: g5.primeOrNotQuestion, accepts: g5.primeOrNotAccepts }),
        pad('rectangles-of-n', 'כַּמָּה מַלְבֵּנִים?', '🟦', g5.rectanglesOfNQuestion, g5.rectanglesOfNAccepts),
        game({ id: 'factor-tree', title: 'עֵץ גּוֹרְמִים', icon: '🌳', component: FactorTreeGame, roundLength: 4, generate: g5.factorTreeQuestion, accepts: g5.factorTreeAccepts }),
      ],
    },
    {
      id: 'math.fractions-beyond', title: 'שְׁבָרִים גְּדוֹלִים מֵאֶחָד', grade: 5, requires: ['math.fraction-add'], sticker: '🍰',
      games: [
        game({ id: 'line-beyond-1', title: 'אַחֲרֵי הָאֶחָד', icon: '📏', component: PlaceGame, generate: g5.lineBeyond1Question, accepts: g5.lineBeyond1Accepts }),
        game({ id: 'mixed-improper', title: 'מְעֹרָב וּמְדֻמֶּה', icon: '🔄', component: FractionPadGame, generate: g5.mixedImproperQuestion, accepts: g5.mixedImproperAccepts }),
        game({ id: 'fraction-as-division', title: 'מְחַלְּקִים פִּיצוֹת', icon: '🍕', component: FractionPadGame, generate: g5.fractionAsDivisionQuestion, accepts: g5.fractionAsDivisionAccepts }),
      ],
    },
    {
      id: 'math.equivalent', title: 'שְׁבָרִים שְׁוֵי עֵרֶךְ', grade: 5, requires: ['math.fractions-beyond'], sticker: '🪞',
      games: [
        game({ id: 'simplify', title: 'מְצַמְצְמִים', icon: '🔽', component: FractionPadGame, generate: g5.simplifyQuestion, accepts: g5.simplifyAccepts }),
        game({ id: 'expand', title: 'מַרְחִיבִים', icon: '🔼', component: FractionPadGame, generate: g5.expandQuestion, accepts: g5.expandAccepts }),
        pick('compare-unlike', 'מִי גָּדוֹל יוֹתֵר?', '⚖️', g5.compareUnlikeQuestion, g5.compareUnlikeAccepts),
        game({ id: 'between', title: 'מָה בָּאֶמְצַע?', icon: '↔️', component: FractionPadGame, generate: g5.betweenQuestion, accepts: g5.betweenAccepts }),
      ],
    },
    {
      id: 'math.fraction-add-2', title: 'חִבּוּר שְׁבָרִים בְּמִכְנִים שׁוֹנִים', grade: 5, requires: ['math.equivalent'], sticker: '🧁',
      games: [
        game({ id: 'add-unlike', title: 'מִכְנִים שׁוֹנִים', icon: '🧁', component: FractionPadGame, generate: g5.addUnlikeQuestion, accepts: g5.addUnlikeAccepts }),
        game({ id: 'add-mixed', title: 'מִסְפָּרִים מְעֹרָבִים', icon: '🍰', component: FractionPadGame, generate: g5.addMixedQuestion, accepts: g5.addMixedAccepts }),
        pick('closest-to', 'בְּעֵרֶךְ כַּמָּה?', '🎯', g5.closestToQuestion, g5.closestToAccepts),
      ],
    },
    {
      id: 'math.decimals', title: 'שְׁבָרִים עֶשְׂרוֹנִיִּים', grade: 5, requires: ['math.fraction-compare', 'math.times-10'], sticker: '🔟',
      games: [
        game({ id: 'decimal-house', title: 'בַּיִת עִם נְקֻדָּה', icon: '🏠', component: PlaceValueGame, generate: g5.decimalHouseQuestion, accepts: g5.decimalHouseAccepts }),
        pad('slide-digits', 'הַסְּפָרוֹת זָזוֹת', '↔️', g5.slideDigitsQuestion, g5.slideDigitsAccepts),
        pick('decimal-fraction', 'עֶשְׂרוֹנִי וְשֶׁבֶר', '🔗', g5.decimalFractionQuestion, g5.decimalFractionAccepts),
      ],
    },
    {
      id: 'math.decimal-order', title: 'מְסַדְּרִים עֶשְׂרוֹנִיִּים', grade: 5, requires: ['math.decimals'], sticker: '📶',
      games: [
        pick('compare-decimals', 'אֵיזֶה גָּדוֹל יוֹתֵר?', '⚖️', g5.compareDecimalsQuestion, g5.compareDecimalsAccepts),
        game({ id: 'decimal-line', title: 'עֶשְׂרוֹנִיִּים עַל הַיָּשָׁר', icon: '📏', component: PlaceGame, generate: g5.decimalLineQuestion, accepts: g5.decimalLineAccepts }),
        pick('round-decimal', 'מְעַגְּלִים עֶשְׂרוֹנִיִּים', '🎯', g5.roundDecimalQuestion, g5.roundDecimalAccepts),
      ],
    },
    {
      id: 'math.decimal-add', title: 'חִבּוּר וְחִסּוּר עֶשְׂרוֹנִיִּים', grade: 5, requires: ['math.decimal-order'], sticker: '🪙',
      games: [
        game({ id: 'column-decimal', title: 'הַנְּקֻדּוֹת בְּשׁוּרָה', icon: '🧱', component: ColumnGame, roundLength: 4, generate: g5.columnDecimalQuestion, accepts: g5.columnDecimalAccepts }),
        pad('change-20', 'עֹדֶף מֵעֶשְׂרִים', '🪙', g5.change20Question, g5.change20Accepts),
        pad('meters-cm', 'מֶטְרִים וְסֶנְטִימֶטְרִים', '📏', g5.metersCmQuestion, g5.metersCmAccepts),
      ],
    },
    {
      id: 'math.heights', title: 'גֹּבַהּ וְשֶׁטַח', grade: 5, requires: ['math.area', 'math.angles'], sticker: '📐',
      games: [
        pick('pick-height', 'אֵיפֹה הַגֹּבַהּ?', '📐', g5.pickHeightQuestion, g5.pickHeightAccepts),
        game({ id: 'triangle-area', title: 'שֶׁטַח מְשֻׁלָּשׁ', icon: '🔺', component: SlantAreaGame, roundLength: 4, generate: g5.triangleAreaQuestion, accepts: g5.triangleAreaAccepts }),
        game({ id: 'parallelogram-area', title: 'שֶׁטַח מַקְבִּילִית', icon: '▱', component: SlantAreaGame, roundLength: 4, generate: g5.parallelogramAreaQuestion, accepts: g5.parallelogramAreaAccepts }),
      ],
    },
    {
      id: 'math.solids', title: 'מִנְסָרוֹת וּפִירָמִידוֹת', grade: 5, requires: ['math.box'], sticker: '🔺',
      games: [
        pick('solid-net', 'אֵיזוֹ פְּרִיסָה?', '📦', g5.solidNetQuestion, g5.solidNetAccepts),
        pad('faces-edges', 'פֵּאוֹת וּמִקְצוֹעוֹת', '🧊', g5.facesEdgesQuestion, g5.facesEdgesAccepts),
      ],
    },
    {
      id: 'math.mode', title: 'הַשָּׁכִיחַ', grade: 5, requires: [], sticker: '📊',
      games: [pick('mode-table', 'מָה הֲכִי שָׁכִיחַ?', '📊', g5.modeTableQuestion, g5.modeTableAccepts)],
    },
    {
      id: 'math.machines', title: 'מְכוֹנַת מִסְפָּרִים', grade: 6, requires: ['math.order-ops-2'], sticker: '⚙️',
      games: [
        pad('machine-output', 'מָה יוֹצֵא?', '⚙️', g6.machineOutputQuestion, g6.machineOutputAccepts),
        pick('machine-rule', 'מָה הַכְּלָל?', '🔍', g6.machineRuleQuestion, g6.machineRuleAccepts),
      ],
    },
    {
      id: 'math.numerals', title: 'סְפָרוֹת רוֹמִיּוֹת וְאוֹתִיּוֹת', grade: 6, requires: ['math.huge'], sticker: '🏛️',
      games: [
        pick('roman', 'סְפָרוֹת רוֹמִיּוֹת', '🏛️', g6.romanQuestion, g6.romanAccepts),
        pick('gematria', 'גִּימַטְרִיָּה', '📜', g6.gematriaQuestion, g6.gematriaAccepts),
      ],
    },
    {
      id: 'math.fraction-times', title: 'כֶּפֶל שְׁבָרִים', grade: 6, requires: ['math.fraction-add-2'], sticker: '✖️',
      games: [
        pad('fraction-of', 'חֵלֶק מִמִּסְפָּר', '🍎', g6.fractionOfQuestion, g6.fractionOfAccepts),
        game({ id: 'fraction-grid', title: 'שֶׁבֶר כָּפוּל שֶׁבֶר', icon: '🟪', component: ShadeGame, generate: g6.fractionGridQuestion, accepts: g6.fractionGridAccepts }),
        pick('bigger-smaller', 'גָּדֵל אוֹ קָטֵן?', '↕️', g6.biggerSmallerQuestion, g6.biggerSmallerAccepts),
      ],
    },
    {
      id: 'math.fraction-divide', title: 'חִלּוּק שְׁבָרִים', grade: 6, requires: ['math.fraction-times'], sticker: '➗',
      games: [
        pad('how-many-fit', 'כַּמָּה נִכְנָסִים?', '🧩', g6.howManyFitQuestion, g6.howManyFitAccepts),
        pad('divide-unit', 'חִלּוּק בִּשְׁבַר יְחִידָה', '➗', g6.divideUnitQuestion, g6.divideUnitAccepts),
        game({ id: 'divide-fraction', title: 'שֶׁבֶר לְחַלֵּק לְשֶׁבֶר', icon: '🔄', component: FractionPadGame, generate: g6.divideFractionQuestion, accepts: g6.divideFractionAccepts }),
      ],
    },
    {
      id: 'math.decimal-times', title: 'כֶּפֶל וְחִלּוּק עֶשְׂרוֹנִיִּים', grade: 6, requires: ['math.decimal-add'], sticker: '🎯',
      games: [
        pick('where-point', 'אֵיפֹה הַנְּקֻדָּה?', '🎯', g6.wherePointQuestion, g6.wherePointAccepts),
        pad('decimal-mental', 'חֶשְׁבּוֹן בְּעַל פֶּה', '🧠', g6.decimalMentalQuestion, g6.decimalMentalAccepts),
        pick('estimate-product', 'יוֹתֵר אוֹ פָּחוֹת?', '⚖️', g6.estimateProductQuestion, g6.estimateProductAccepts),
      ],
    },
    {
      id: 'math.percent', title: 'אֲחוּזִים', grade: 6, requires: ['math.decimal-order', 'math.fraction-times'], sticker: '💯',
      games: [
        pad('percent-of', 'אֲחוּזִים מִמִּסְפָּר', '💯', g6.percentOfQuestion, g6.percentOfAccepts),
        pick('percent-match', 'אָחוּז, שֶׁבֶר וְעֶשְׂרוֹנִי', '🔗', g6.percentMatchQuestion, g6.percentMatchAccepts),
        defineGame({ id: 'percent-arena', title: 'זִירַת הָאֲחוּזִים', icon: '⏱️', component: NumberPadGame, sprint: { seconds: 60 }, generate: g6.percentArenaQuestion, accepts: g6.percentArenaAccepts }),
      ],
    },
    {
      id: 'math.percent-whole', title: 'הֲנָחוֹת וְהַשָּׁלֵם', grade: 6, requires: ['math.percent'], sticker: '🏷️',
      games: [
        pad('find-whole', 'מוֹצְאִים אֶת הַשָּׁלֵם', '🧩', g6.findWholeQuestion, g6.findWholeAccepts),
        pad('discount', 'הֲנָחָה', '🏷️', g6.discountQuestion, g6.discountAccepts),
        pad('price-rise', 'הִתְיַקְּרוּת', '📈', g6.priceRiseQuestion, g6.priceRiseAccepts),
      ],
    },
    {
      id: 'math.composite-area', title: 'שֶׁטַח וְהֶקֵּף שֶׁל צוּרוֹת', grade: 6, requires: ['math.heights'], sticker: '🧩',
      games: [
        game({ id: 'composite-area', title: 'שֶׁטַח צוּרָה מֻרְכֶּבֶת', icon: '🟩', component: GridAreaGame, roundLength: 4, generate: g6.compositeAreaQuestion, accepts: g6.compositeAreaAccepts }),
        game({ id: 'composite-perimeter', title: 'הֶקֵּף צוּרָה מֻרְכֶּבֶת', icon: '🔲', component: GridAreaGame, roundLength: 4, generate: g6.compositePerimeterQuestion, accepts: g6.compositePerimeterAccepts }),
        pick('scale-effect', 'מָה קָרָה לַשֶּׁטַח?', '🔍', g6.scaleEffectQuestion, g6.scaleEffectAccepts),
      ],
    },
    {
      id: 'math.circle', title: 'הַמַּעְגָּל', grade: 6, requires: ['math.composite-area'], sticker: '⭕',
      games: [
        game({ id: 'circle-parts', title: 'חֶלְקֵי הַמַּעְגָּל', icon: '⭕', component: TapArtGame, generate: g6.circlePartsQuestion, accepts: g6.circlePartsAccepts }),
        pick('circumference', 'הֶקֵּף הַמַּעְגָּל', '📏', g6.circumferenceQuestion, g6.circumferenceAccepts),
        pick('circle-area', 'שֶׁטַח הָעִגּוּל', '🟠', g6.circleAreaQuestion, g6.circleAreaAccepts),
      ],
    },
    {
      id: 'math.volume', title: 'נֶפַח', grade: 6, requires: ['math.solids'], sticker: '🧊',
      games: [
        pad('count-cubes', 'סוֹפְרִים קֻבִּיּוֹת', '🧊', g6.countCubesQuestion, g6.countCubesAccepts),
        pad('box-volume', 'נֶפַח תֵּבָה', '📦', g6.boxVolumeQuestion, g6.boxVolumeAccepts),
        pick('volume-unit', 'אֵיזוֹ יְחִידָה?', '🤔', g6.volumeUnitQuestion, g6.volumeUnitAccepts),
      ],
    },
    {
      id: 'math.mean', title: 'הַמְּמֻצָּע', grade: 6, requires: ['math.mode'], sticker: '⚖️',
      games: [
        game({ id: 'level-bars', title: 'מַשְׁוִים עַמּוּדוֹת', icon: '📊', component: MeanGame, roundLength: 4, generate: g6.levelBarsQuestion, accepts: g6.levelBarsAccepts }),
        pad('find-mean', 'מָה הַמְּמֻצָּע?', '🧮', g6.findMeanQuestion, g6.findMeanAccepts),
        pick('mean-truths', 'נָכוֹן אוֹ לֹא?', '🤔', g6.meanTruthsQuestion, g6.meanTruthsAccepts),
      ],
    },
  ]),
}
