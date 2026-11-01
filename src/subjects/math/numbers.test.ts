import { describe, expect, it } from 'vitest'
import { NUMBER_PHRASES } from './content/numbers'
import { numberPhrase } from './numbers'

const say = (n: number) => numberPhrase(n).map(id => NUMBER_PHRASES[id]).join(' ')

describe('numberPhrase', () => {
  it('uses only declared blocks for 0–100', () => {
    for (let n = 0; n <= 100; n++) for (const id of numberPhrase(n)) expect(NUMBER_PHRASES[id], `${n} → ${id}`).toBeDefined()
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

  it('rejects numbers outside 0–100', () => {
    expect(() => numberPhrase(-1)).toThrow()
    expect(() => numberPhrase(101)).toThrow()
    expect(() => numberPhrase(2.5)).toThrow()
  })
})
