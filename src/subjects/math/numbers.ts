import { raw } from '../../core/audio/audio'
import { NUMBER_PHRASES } from './content/numbers'

/**
 * Phrase IDs that say `n` (0–10,000) as numbers are counted, with "and" only before the last part:
 * 47 → [40, and-7] · 300 → [h3] · 307 → [h3, and-7] · 310 → [h3, and-10] · 315 → [h3, and-15] · 347 → [h3, 40, and-7] ·
 * 3,000 → [k3] · 3,300 → [k3, and-h3] · 3,347 → [k3, h3, 40, and-7] · 3,047 → [k3, 40, and-7] · 3,007 → [k3, and-7].
 * Until the blocks are recorded, `say` reads the whole number as one browser-voice sentence (D23).
 */
export function numberPhrase(n: number): string[] {
  if (!Number.isInteger(n) || n < 0 || n > 10000) throw new Error(`numberPhrase: ${n} is out of range 0–10,000`)
  if (n === 10000) return ['math.n.10000']
  if (n === 1000) return ['math.n.1000']
  if (n <= 100) return n < 20 || n % 10 === 0 ? [`math.n.${n}`] : [`math.n.${n - (n % 10)}`, `math.and.${n % 10}`]
  if (n > 1000) {
    const k = Math.floor(n / 1000)
    const head = k === 1 ? 'math.n.1000' : `math.k.${k}`
    const r = n % 1000
    if (r === 0) return [head]
    if (r % 100 === 0) return [head, `math.andh.${r / 100}`]
    return [head, ...(r < 100 ? lastTens(r) : numberPhrase(r))]
  }
  const h = `math.h.${Math.floor(n / 100)}`
  const r = n % 100
  return r === 0 ? [h] : [h, ...lastTens(r)]
}

/** 1–99 after a bigger part, with "and" before its last word. */
function lastTens(r: number): string[] {
  if (r < 10) return [`math.and.${r}`]
  if (r < 20) return [r === 10 ? 'math.andt.10' : `math.andteen.${r}`]
  if (r % 10 === 0) return [`math.andt.${r}`]
  return [`math.n.${r - (r % 10)}`, `math.and.${r % 10}`]
}

/** Phrase ID that says a price of `n` shekels (1–20), with correct masculine agreement. */
export function pricePhrase(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error(`pricePhrase: ${n} is out of range 1–20`)
  return `math.price.${n}`
}

/* ---------- grade 4 and up (docs/specs/math-grade4.md): shown with commas, spoken by the browser voice above 10,000 ---------- */

/** How a number is shown: commas in groups of three from five digits on (372,450), as grade 4 teaches; 3456 stays plain. */
export const fmt = (n: number) => (Math.abs(n) >= 10000 ? n.toLocaleString('en-US') : String(n))

/** Masculine counting form, for the count of thousands (שְׁלוֹשָׁה־עָשָׂר אֶלֶף, עֶשְׂרִים וּשְׁנַיִם אֶלֶף). */
const M_UNITS = ['', 'אֶחָד', 'שְׁנַיִם', 'שְׁלוֹשָׁה', 'אַרְבָּעָה', 'חֲמִשָּׁה', 'שִׁשָּׁה', 'שִׁבְעָה', 'שְׁמוֹנָה', 'תִּשְׁעָה']
const M_AND_UNITS = ['', 'וְאֶחָד', 'וּשְׁנַיִם', 'וּשְׁלוֹשָׁה', 'וְאַרְבָּעָה', 'וַחֲמִשָּׁה', 'וְשִׁשָּׁה', 'וְשִׁבְעָה', 'וּשְׁמוֹנָה', 'וְתִשְׁעָה']
const M_TEENS = ['עֲשָׂרָה', 'אַחַד־עָשָׂר', 'שְׁנֵים־עָשָׂר', 'שְׁלוֹשָׁה־עָשָׂר', 'אַרְבָּעָה־עָשָׂר', 'חֲמִשָּׁה־עָשָׂר', 'שִׁשָּׁה־עָשָׂר',
  'שִׁבְעָה־עָשָׂר', 'שְׁמוֹנָה־עָשָׂר', 'תִּשְׁעָה־עָשָׂר']
const M_AND_TEENS = ['וַעֲשָׂרָה', 'וְאַחַד־עָשָׂר', 'וּשְׁנֵים־עָשָׂר', 'וּשְׁלוֹשָׁה־עָשָׂר', 'וְאַרְבָּעָה־עָשָׂר', 'וַחֲמִשָּׁה־עָשָׂר',
  'וְשִׁשָּׁה־עָשָׂר', 'וְשִׁבְעָה־עָשָׂר', 'וּשְׁמוֹנָה־עָשָׂר', 'וְתִשְׁעָה־עָשָׂר']

const block = (id: string) => NUMBER_PHRASES[id]!
const blocks = (ids: readonly string[]) => ids.map(block).join(' ')

/** 1–99 in the masculine form; `and` adds ו before it (it ends a longer number). */
function masc99(n: number, and: boolean): string {
  if (n < 10) return (and ? M_AND_UNITS : M_UNITS)[n]!
  if (n < 20) return (and ? M_AND_TEENS : M_TEENS)[n - 10]!
  if (n % 10 === 0) return block(and ? `math.andt.${n}` : `math.n.${n}`)
  return `${block(`math.n.${n - (n % 10)}`)} ${M_AND_UNITS[n % 10]}`
}

/** 1–999 in the masculine form (the number of thousands or millions). */
function masc(n: number): string {
  if (n < 10) return M_UNITS[n]!
  if (n < 100) return masc99(n, false)
  const h = block(`math.h.${Math.floor(n / 100)}`)
  const r = n % 100
  return r === 0 ? h : `${h} ${masc99(r, r < 20 || r % 10 === 0)}`
}

/**
 * The words for 0–1,000,000 with full nikud, as numbers are counted: up to 10,000 exactly the recorded blocks
 * (numberPhrase), above it the thousands in the masculine form + אֶלֶף, then the rest with "and" before its last part.
 */
export function numberText(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e9) throw new Error(`numberText: ${n} is out of range 0–999,999,999`)
  if (n <= 10000) return blocks(numberPhrase(n))
  if (n >= 1000000) {
    // Grade 5: millions in the masculine form (שְׁלוֹשָׁה מִילְיוֹן), the rest as below with "and" before its last part.
    const m = Math.floor(n / 1000000)
    const head = m === 1 ? 'מִילְיוֹן' : m === 2 ? 'שְׁנֵי מִילְיוֹן' : `${masc(m)} מִילְיוֹן`
    const r = n % 1000000
    if (r === 0) return head
    const rest = numberText(r)
    return r < 1000 && (r < 100 || r % 100 === 0) ? `${head} ${withAnd(rest)}` : `${head} ${rest}`
  }
  const head = `${masc(Math.floor(n / 1000))} אֶלֶף`
  const r = n % 1000
  if (r === 0) return head
  if (r % 100 === 0) return `${head} ${block(`math.andh.${r / 100}`)}`
  return `${head} ${blocks(r < 100 ? lastTens(r) : numberPhrase(r))}`
}

/** What to say for `n`: the recorded blocks up to 10,000, otherwise the whole number by the browser voice (D23). */
export const spokenNumber = (n: number): string[] => (n <= 10000 ? numberPhrase(n) : [raw(numberText(n))])

/** Plural of 1/d: masculine for halves, thirds and quarters, feminine from fifths on (שְׁלוֹשָׁה רְבָעִים, שָׁלוֹשׁ חֲמִישִׁיּוֹת). */
const FRACTION_NAMES: Record<number, { one: string; many: string; masculine: boolean }> = {
  2: { one: 'חֵצִי', many: 'חֲצָאִים', masculine: true },
  3: { one: 'שְׁלִישׁ', many: 'שְׁלִישִׁים', masculine: true },
  4: { one: 'רֶבַע', many: 'רְבָעִים', masculine: true },
  5: { one: 'חֲמִישִׁית', many: 'חֲמִישִׁיּוֹת', masculine: false },
  6: { one: 'שִׁשִּׁית', many: 'שִׁשִּׁיּוֹת', masculine: false },
  7: { one: 'שְׁבִיעִית', many: 'שְׁבִיעִיּוֹת', masculine: false },
  8: { one: 'שְׁמִינִית', many: 'שְׁמִינִיּוֹת', masculine: false },
  9: { one: 'תְּשִׁיעִית', many: 'תְּשִׁיעִיּוֹת', masculine: false },
  10: { one: 'עֲשִׂירִית', many: 'עֲשִׂירִיּוֹת', masculine: false },
  100: { one: 'מֵאִית', many: 'מֵאִיּוֹת', masculine: false },
  1000: { one: 'אַלְפִּית', many: 'אַלְפִּיּוֹת', masculine: false },
}
const M_COUNT = ['', 'אֶחָד', 'שְׁנֵי', 'שְׁלוֹשָׁה', 'אַרְבָּעָה', 'חֲמִשָּׁה', 'שִׁשָּׁה', 'שִׁבְעָה', 'שְׁמוֹנָה', 'תִּשְׁעָה', 'עֲשָׂרָה']
const F_COUNT = ['', 'אַחַת', 'שְׁתֵּי', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע', 'עֶשֶׂר']

/**
 * A fraction in words with nikud: 1/4 → רֶבַע · 3/4 → שְׁלוֹשָׁה רְבָעִים · 3/5 → שָׁלוֹשׁ חֲמִישִׁיּוֹת · 2¾ → שְׁתַּיִם וּשְׁלוֹשָׁה רְבָעִים.
 * Denominators 2–10 and 100 by name; 12 as "חֲלָקִים מִתּוֹךְ שְׁנֵים־עָשָׂר". Numerators above 10 are left as digits for the voice.
 */
export function fractionText(num: number, den: number, whole = 0): string {
  const name = FRACTION_NAMES[den]
  let part: string
  if (num === 0) part = ''
  else if (!name) part = `${num <= 10 ? M_COUNT[num] : num} ${num === 1 ? 'חֵלֶק' : 'חֲלָקִים'} מִתּוֹךְ ${den === 12 ? 'שְׁנֵים־עָשָׂר' : den}`
  else if (num === 1) part = name.one
  else part = `${num <= 10 ? (name.masculine ? M_COUNT : F_COUNT)[num] : numberText(num)} ${name.many}`
  if (!whole) return part || block('math.n.0')
  const w = whole <= 10000 ? blocks(numberPhrase(whole)) : numberText(whole)
  if (!part) return w
  return `${w} ${num === 1 && den === 2 ? 'וָחֵצִי' : withAnd(part)}`
}

/** "and" before a word: וּ before a shva or ב/מ/פ, וַ before a chataf patach, otherwise וְ. */
function withAnd(word: string): string {
  const second = word[1]
  if (second === '\u05B0' || 'במפ'.includes(word[0] ?? '')) return `וּ${word}`
  if (second === '\u05B2') return `וַ${word}`
  return `וְ${word}`
}

/** How a decimal is shown: up to `places` digits after the point, trailing zeros kept only when asked (13.60 for money). */
export const fmtDec = (x: number, places?: number) => (places === undefined ? String(Number(x.toFixed(3))) : x.toFixed(places))

/**
 * A decimal said as schools read it: 3.05 → שְׁלוֹשָׁה שְׁלֵמִים וְחָמֵשׁ מֵאִיּוֹת · 0.6 → שֵׁשׁ עֲשִׂירִיּוֹת · 1.375 → שָׁלֵם אֶחָד
 * וּשְׁלוֹשׁ מֵאוֹת שִׁבְעִים וְחָמֵשׁ אַלְפִּיּוֹת. Up to three places; the fraction part is named by its last place.
 */
export function decimalText(x: number): string {
  const [w, f = ''] = fmtDec(x).split('.')
  const whole = Number(w)
  const wholeText = whole === 0 ? '' : whole === 1 ? 'שָׁלֵם אֶחָד' : `${whole <= 10 ? M_COUNT[whole] : masc(whole)} שְׁלֵמִים`
  if (!f) return wholeText || block('math.n.0')
  const part = fractionText(Number(f), 10 ** f.length)
  return wholeText ? `${wholeText} ${withAnd(part)}` : part
}
