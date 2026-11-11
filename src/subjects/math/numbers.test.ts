import { describe, expect, it } from 'vitest'
import { NUMBER_PHRASES, PRICE_PHRASES } from './content/numbers'
import { decimalText, fmt, fmtDec, fractionText, numberPhrase, numberText, pricePhrase, spokenNumber, toGematria, toRoman } from './numbers'

const say = (n: number) => numberPhrase(n).map(id => NUMBER_PHRASES[id]).join(' ')

describe('numberPhrase', () => {
  it('uses only declared blocks for 0–10,000', () => {
    for (let n = 0; n <= 10000; n++) for (const id of numberPhrase(n)) expect(NUMBER_PHRASES[id], `${n} → ${id}`).toBeDefined()
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

  it('rejects numbers outside 0–10,000', () => {
    expect(() => numberPhrase(-1)).toThrow()
    expect(() => numberPhrase(10001)).toThrow()
    expect(() => numberPhrase(2.5)).toThrow()
  })

  it('says thousands with "and" only before the last part (grade 3)', () => {
    expect(say(1001)).toBe('אֶלֶף וְאַחַת')
    expect(say(1010)).toBe('אֶלֶף וְעֶשֶׂר')
    expect(say(1100)).toBe('אֶלֶף וּמֵאָה')
    expect(say(2000)).toBe('אַלְפַּיִם')
    expect(say(3300)).toBe('שְׁלוֹשֶׁת אֲלָפִים וּשְׁלוֹשׁ מֵאוֹת')
    expect(say(3407)).toBe('שְׁלוֹשֶׁת אֲלָפִים אַרְבַּע מֵאוֹת וְשֶׁבַע')
    expect(say(3047)).toBe('שְׁלוֹשֶׁת אֲלָפִים אַרְבָּעִים וְשֶׁבַע')
    expect(say(5015)).toBe('חֲמֵשֶׁת אֲלָפִים וַחֲמֵשׁ־עֶשְׂרֵה')
    expect(say(7050)).toBe('שִׁבְעַת אֲלָפִים וַחֲמִשִּׁים')
    expect(say(9999)).toBe('תִּשְׁעַת אֲלָפִים תְּשַׁע מֵאוֹת תִּשְׁעִים וְתֵשַׁע')
    expect(say(10000)).toBe('עֲשֶׂרֶת אֲלָפִים')
    expect(() => numberPhrase(10001)).toThrow()
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

describe('grade 4 numbers', () => {
  it('shows commas from five digits on', () => {
    expect(fmt(3456)).toBe('3456')
    expect(fmt(10000)).toBe('10,000')
    expect(fmt(372450)).toBe('372,450')
  })

  it('writes numbers to a million as they are counted', () => {
    for (let n = 0; n <= 10000; n += 37) expect(numberText(n)).toBe(say(n))
    expect(numberText(10001)).toBe('עֲשָׂרָה אֶלֶף וְאַחַת')
    expect(numberText(11000)).toBe('אַחַד־עָשָׂר אֶלֶף')
    expect(numberText(20000)).toBe('עֶשְׂרִים אֶלֶף')
    expect(numberText(21500)).toBe('עֶשְׂרִים וְאֶחָד אֶלֶף וַחֲמֵשׁ מֵאוֹת')
    expect(numberText(99999)).toBe('תִּשְׁעִים וְתִשְׁעָה אֶלֶף תְּשַׁע מֵאוֹת תִּשְׁעִים וְתֵשַׁע')
    expect(numberText(100000)).toBe('מֵאָה אֶלֶף')
    expect(numberText(110000)).toBe('מֵאָה וַעֲשָׂרָה אֶלֶף')
    expect(numberText(342000)).toBe('שְׁלוֹשׁ מֵאוֹת אַרְבָּעִים וּשְׁנַיִם אֶלֶף')
    expect(numberText(372450)).toBe('שְׁלוֹשׁ מֵאוֹת שִׁבְעִים וּשְׁנַיִם אֶלֶף אַרְבַּע מֵאוֹת וַחֲמִשִּׁים')
    expect(numberText(1000000)).toBe('מִילְיוֹן')
    expect(spokenNumber(372450)).toEqual([`raw:${numberText(372450)}`])
    expect(spokenNumber(347)).toEqual(numberPhrase(347))
  })

  it('says fractions with the right gender', () => {
    expect(fractionText(1, 2)).toBe('חֵצִי')
    expect(fractionText(1, 4)).toBe('רֶבַע')
    expect(fractionText(3, 4)).toBe('שְׁלוֹשָׁה רְבָעִים')
    expect(fractionText(2, 3)).toBe('שְׁנֵי שְׁלִישִׁים')
    expect(fractionText(3, 5)).toBe('שָׁלוֹשׁ חֲמִישִׁיּוֹת')
    expect(fractionText(2, 7)).toBe('שְׁתֵּי שְׁבִיעִיּוֹת')
    expect(fractionText(7, 100)).toBe('שֶׁבַע מֵאִיּוֹת')
    expect(fractionText(5, 12)).toBe('חֲמִשָּׁה חֲלָקִים מִתּוֹךְ שְׁנֵים־עָשָׂר')
    expect(fractionText(1, 2, 2)).toBe('שְׁתַּיִם וָחֵצִי')
    expect(fractionText(3, 4, 2)).toBe('שְׁתַּיִם וּשְׁלוֹשָׁה רְבָעִים')
    expect(fractionText(1, 5, 1)).toBe('אַחַת וַחֲמִישִׁית')
    expect(fractionText(0, 4, 3)).toBe('שָׁלוֹשׁ')
  })
})

describe('grade 5 numbers', () => {
  it('says millions', () => {
    expect(numberText(1000000)).toBe('מִילְיוֹן')
    expect(numberText(2000000)).toBe('שְׁנֵי מִילְיוֹן')
    expect(numberText(3400000)).toBe('שְׁלוֹשָׁה מִילְיוֹן אַרְבַּע מֵאוֹת אֶלֶף')
    expect(numberText(52000007)).toBe('חֲמִשִּׁים וּשְׁנַיִם מִילְיוֹן וְשֶׁבַע')
    expect(numberText(1000300)).toBe('מִילְיוֹן וּשְׁלוֹשׁ מֵאוֹת')
  })

  it('says decimals as schools read them', () => {
    expect(fmtDec(0.5)).toBe('0.5')
    expect(fmtDec(13.6, 2)).toBe('13.60')
    expect(decimalText(0.6)).toBe('שֵׁשׁ עֲשִׂירִיּוֹת')
    expect(decimalText(3.05)).toBe('שְׁלוֹשָׁה שְׁלֵמִים וְחָמֵשׁ מֵאִיּוֹת')
    expect(decimalText(1.37)).toBe('שָׁלֵם אֶחָד וּשְׁלוֹשִׁים וְשֶׁבַע מֵאִיּוֹת')
    expect(decimalText(0.125)).toBe('מֵאָה עֶשְׂרִים וְחָמֵשׁ אַלְפִּיּוֹת')
    expect(decimalText(2)).toBe('שְׁנֵי שְׁלֵמִים')
  })
})

describe('grade 6 numeral systems', () => {
  it('writes Roman numerals', () => {
    expect([1, 4, 9, 14, 40, 90, 400, 1900, 2026].map(toRoman)).toEqual(['I', 'IV', 'IX', 'XIV', 'XL', 'XC', 'CD', 'MCM', 'MMXXVI'])
  })

  it('writes gematria with geresh, gershayim and the ט״ו / ט״ז rule', () => {
    expect(toGematria(5)).toBe('ה׳')
    expect(toGematria(300)).toBe('ש׳')
    expect(toGematria(15)).toBe('ט״ו')
    expect(toGematria(16)).toBe('ט״ז')
    expect(toGematria(115)).toBe('קט״ו')
    expect(toGematria(123)).toBe('קכ״ג')
    expect(toGematria(786)).toBe('תשפ״ו')
    expect(toGematria(900)).toBe('תת״ק')
  })
})
