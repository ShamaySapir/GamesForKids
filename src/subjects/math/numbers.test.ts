import { describe, expect, it } from 'vitest'
import { NUMBER_PHRASES, PRICE_PHRASES } from './content/numbers'
import { numberPhrase, pricePhrase } from './numbers'

const say = (n: number) => numberPhrase(n).map(id => NUMBER_PHRASES[id]).join(' ')

describe('numberPhrase', () => {
  it('uses only declared blocks for 0–1,000', () => {
    for (let n = 0; n <= 1000; n++) for (const id of numberPhrase(n)) expect(NUMBER_PHRASES[id], `${n} → ${id}`).toBeDefined()
  })

  it('says numbers in the counting form', () => {
    expect(say(0)).toBe('אֶפֶס')
    expect(say(2)).toBe('שְׁתַּיִם')
    expect(say(12)).toBe('שְׁתֵּים־עֶשְׂרֵה')
    expect(say(21)).toBe('עֶשְׂרִים וְאַחַת')
    expect(say(40)).toBe('אַרְבָּעִים')
    expect(say(58)).toBe('חֲמִשִּׁים וּשְׁמוֹנֶה')
    expect(say(99)).toBe('תִּשְׁעִים וְתֵשַׁע')
    expect(say(100)).toBe('מֵאָה')
  })

  it('says hundreds with "and" only before the last part', () => {
    expect(say(105)).toBe('מֵאָה וְחָמֵשׁ')
    expect(say(120)).toBe('מֵאָה וְעֶשְׂרִים')
    expect(say(200)).toBe('מָאתַיִם')
    expect(say(310)).toBe('שְׁלוֹשׁ מֵאוֹת וְעֶשֶׂר')
    expect(say(315)).toBe('שְׁלוֹשׁ מֵאוֹת וַחֲמֵשׁ־עֶשְׂרֵה')
    expect(say(347)).toBe('שְׁלוֹשׁ מֵאוֹת אַרְבָּעִים וְשֶׁבַע')
    expect(say(550)).toBe('חֲמֵשׁ מֵאוֹת וַחֲמִשִּׁים')
    expect(say(999)).toBe('תְּשַׁע מֵאוֹת תִּשְׁעִים וְתֵשַׁע')
    expect(say(1000)).toBe('אֶלֶף')
  })

  it('rejects numbers outside 0–1,000', () => {
    expect(() => numberPhrase(-1)).toThrow()
    expect(() => numberPhrase(1001)).toThrow()
    expect(() => numberPhrase(2.5)).toThrow()
  })
})

describe('pricePhrase', () => {
  it('says every price 1–20 with masculine agreement', () => {
    for (let n = 1; n <= 20; n++) expect(PRICE_PHRASES[pricePhrase(n)], `${n}`).toBeDefined()
    expect(PRICE_PHRASES[pricePhrase(1)]).toBe('שֶׁקֶל אֶחָד')
    expect(PRICE_PHRASES[pricePhrase(2)]).toBe('שְׁנֵי שְׁקָלִים')
    expect(PRICE_PHRASES[pricePhrase(3)]).toBe('שְׁלוֹשָׁה שְׁקָלִים')
    expect(() => pricePhrase(0)).toThrow()
    expect(() => pricePhrase(21)).toThrow()
  })
})
