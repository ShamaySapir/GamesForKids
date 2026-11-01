import type { PhraseMap } from '../../../core/engine/types'

// Spoken number building blocks, feminine counting form (as numbers are said when counting).
// Written by the planner in T0; numberPhrase() in ../numbers.ts composes them. Stage 4b adds hundreds.

const UNITS = ['אֶפֶס', 'אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע']
const TEENS = ['עֶשֶׂר', 'אַחַת־עֶשְׂרֵה', 'שְׁתֵּים־עֶשְׂרֵה', 'שְׁלוֹשׁ־עֶשְׂרֵה', 'אַרְבַּע־עֶשְׂרֵה', 'חֲמֵשׁ־עֶשְׂרֵה',
  'שֵׁשׁ־עֶשְׂרֵה', 'שְׁבַע־עֶשְׂרֵה', 'שְׁמוֹנֶה־עֶשְׂרֵה', 'תְּשַׁע־עֶשְׂרֵה']
const TENS = ['', '', 'עֶשְׂרִים', 'שְׁלוֹשִׁים', 'אַרְבָּעִים', 'חֲמִשִּׁים', 'שִׁשִּׁים', 'שִׁבְעִים', 'שְׁמוֹנִים', 'תִּשְׁעִים']
/** "and" + unit after a ten (עֶשְׂרִים וְאַחַת). ו becomes וּ before a shva (וּשְׁתַּיִם, וּשְׁמוֹנֶה). */
const AND_UNITS = ['', 'וְאַחַת', 'וּשְׁתַּיִם', 'וְשָׁלוֹשׁ', 'וְאַרְבַּע', 'וְחָמֵשׁ', 'וְשֵׁשׁ', 'וְשֶׁבַע', 'וּשְׁמוֹנֶה', 'וְתֵשַׁע']

export const NUMBER_PHRASES: PhraseMap = Object.fromEntries([
  ...UNITS.map((w, n) => [`math.n.${n}`, w]),
  ...TEENS.map((w, i) => [`math.n.${10 + i}`, w]),
  ...TENS.flatMap((w, t) => (w ? [[`math.n.${t * 10}`, w]] : [])),
  ...AND_UNITS.flatMap((w, u) => (w ? [[`math.and.${u}`, w]] : [])),
  ['math.n.100', 'מֵאָה'],
])
