import { describe, expect, it } from 'vitest'
import { SHOP } from './content/shop'
import { STORIES } from './content/stories'
import { THINGS } from './content/things'
import { M, OP, shopPhrase, storyPart, thingPhrase } from './ids'
import { STORY_TEXT, phrases } from './phrases'

/** Thing IDs whose noun was checked as FEMININE (the number blocks are feminine counting forms). Adding a thing forces a check. */
const FEMININE_THINGS_VERIFIED = [
  'bird', 'banana', 'cookie', 'car', 'candy', 'egg', 'cow', 'sheep', 'chicken', 'bee', 'frog', 'tomato',
  'donut', 'sunflower', 'mushroom', 'gift', 'icecream', 'train', 'shirt', 'dress', 'guitar', 'spoon', 'pizza',
]
/** Feminine nouns with a masculine-looking plural ending (-ים). Every other thing must end in -וֹת. */
const FEMININE_IM = new Set(['bird', 'egg', 'bee', 'frog'])

const isHebrewWord = (w: string) => /[א-ת]/.test(w)
const hasVowel = (w: string) => /[ְ-ֻ]/.test(w) || /וּ/.test(w)
const hebrewWords = (text: string) => text.split(/[\s־]+/).map(w => w.replace(/[.,?!"]/g, '')).filter(isHebrewWord)

const ownPhrases = Object.entries(phrases).filter(([id]) => !id.startsWith('math.n.') && !id.startsWith('math.and.'))

describe('math content', () => {
  it('has enough content', () => {
    expect(THINGS.length).toBeGreaterThanOrEqual(15)
    expect(STORIES.length).toBeGreaterThanOrEqual(25)
    expect(SHOP.length).toBeGreaterThanOrEqual(12)
    const joins = STORIES.filter(s => s.kind === 'join').length
    expect(joins).toBeGreaterThanOrEqual(10)
    expect(STORIES.length - joins).toBeGreaterThanOrEqual(10)
  })

  it('has unique IDs and emoji', () => {
    for (const list of [THINGS, SHOP]) {
      expect(new Set(list.map(x => x.id)).size).toBe(list.length)
      expect(new Set(list.map(x => x.emoji)).size).toBe(list.length)
    }
    expect(new Set(STORIES.map(s => s.id)).size).toBe(STORIES.length)
  })

  it('every story lists existing things and every thing is used', () => {
    const ids = new Set(THINGS.map(t => t.id))
    for (const s of STORIES) {
      expect(s.things.length, s.id).toBeGreaterThan(0)
      for (const t of s.things) expect(ids.has(t), `${s.id}: ${t}`).toBe(true)
    }
    const used = new Set(STORIES.flatMap(s => s.things))
    for (const t of ids) expect(used.has(t), `${t} is in no story`).toBe(true)
  })

  it('every phrase ID the contract implies exists', () => {
    for (const id of [...Object.values(M), ...Object.values(OP)]) expect(phrases[id], id).toBeTruthy()
    for (const t of THINGS) expect(phrases[thingPhrase(t.id)], t.id).toBeTruthy()
    for (const s of SHOP) expect(phrases[shopPhrase(s.id)], s.id).toBeTruthy()
    for (const s of STORIES) for (const p of ['start', 'middle', 'end'] as const) expect(phrases[storyPart(s.id, p)], `${s.id}.${p}`).toBeTruthy()
    expect(Object.keys(STORY_TEXT).sort()).toEqual(STORIES.map(s => s.id).sort())
  })

  it('every thing was checked as a feminine noun', () => {
    expect([...FEMININE_THINGS_VERIFIED].sort()).toEqual(THINGS.map(t => t.id).sort())
    for (const t of THINGS) {
      const word = phrases[thingPhrase(t.id)] ?? ''
      const ok = word.endsWith('וֹת') || (FEMININE_IM.has(t.id) && word.endsWith('ִים'))
      expect(ok, `${t.id}: ${word}`).toBe(true)
      expect(word.includes(' '), `${t.id} must be one word`).toBe(false)
    }
  })

  it('story questions match their kind', () => {
    for (const s of STORIES) {
      const end = phrases[storyPart(s.id, 'end')]
      expect(end, s.id).toBe(s.kind === 'join' ? 'כַּמָּה יֵשׁ עַכְשָׁו?' : 'כַּמָּה נִשְׁאֲרוּ?')
    }
  })

  it('every Hebrew word in these phrases has nikud', () => {
    const problems: string[] = []
    for (const [id, text] of ownPhrases) {
      for (const w of hebrewWords(text)) {
        if (!hasVowel(w)) problems.push(`${id}: ${w} has no vowel`)
        if (/ש(?![ְ-ֽ]*[ׁׂ])/.test(w)) problems.push(`${id}: ${w} has a ש without a dot`)
        // every letter needs a mark of its own, except the last one, a vav, a yod, a silent alef, and a letter whose
        // vowel is the vav after it (מוֹ, שׁוּ)
        const bare = [...w.matchAll(/[א-ת](?![ְ-ׇ])/g)]
          .filter(m => m.index < w.length - 1 && !'ויא'.includes(m[0]) && !/^ו[ֹּ]/.test(w.slice(m.index + 1))).length
        if (bare > 1) problems.push(`${id}: ${w} looks mostly unpointed`)
      }
    }
    expect(problems).toEqual([])
  })

  it('has no phrases with stray Latin text or digits', () => {
    for (const [id, text] of ownPhrases) expect(/[A-Za-z0-9]/.test(text), id).toBe(false)
  })
})
