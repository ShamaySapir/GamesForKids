import type { SortBoard } from '../types'

const board = (id: string, bins: readonly [string, string], zero: readonly string[], one: readonly string[]): SortBoard => ({
  id,
  bins,
  cards: [...zero.map(emoji => ({ emoji, bin: 0 as const })), ...one.map(emoji => ({ emoji, bin: 1 as const }))],
})

// 3 + 3 cards. First by kind, then by a rule (color, size, temperature, shape). No card fits both baskets.
export const SORT_BOARDS: readonly SortBoard[] = [
  board('fruit-veg', ['🍏', '🥬'], ['🍌', '🍇', '🍓'], ['🥕', '🥦', '🥒']),
  board('animals-vehicles', ['🐾', '🚦'], ['🐶', '🐱', '🐰'], ['🚗', '🚌', '🚲']),
  board('sea-land', ['🌊', '🌳'], ['🐟', '🐙', '🐳'], ['🐘', '🦒', '🐄']),
  board('clothes-food', ['🧺', '🍽️'], ['👕', '🧦', '👟'], ['🍕', '🍞', '🧀']),
  board('fly-swim', ['☁️', '💧'], ['🐦', '🦋', '🐝'], ['🐠', '🐬', '🐙']),
  board('toys-tools', ['🎲', '🧰'], ['🧸', '⚽', '🪁'], ['🔨', '🔧', '⛏️']),
  board('pets-farm', ['🏠', '🚜'], ['🐶', '🐱', '🐹'], ['🐄', '🐑', '🐖']),
  board('school-kitchen', ['🏫', '🍽️'], ['✏️', '📚', '🎒'], ['🍴', '🥄', '🍳']),
  board('red-yellow', ['🔴', '🟡'], ['🍎', '🍓', '🍅'], ['🍌', '🍋', '🌻']),
  board('green-red', ['🟢', '🔴'], ['🥒', '🐸', '🐢'], ['🍓', '🚒', '🌹']),
  board('big-small', ['🏔️', '🔍'], ['🐘', '🚌', '🌳'], ['🐜', '🐛', '🐞']),
  board('hot-cold', ['🥵', '🥶'], ['🔥', '☀️', '🍲'], ['❄️', '🧊', '🍦']),
  board('road-air', ['🛣️', '☁️'], ['🚗', '🚌', '🚲'], ['✈️', '🚁', '🚀']),
  board('round-long', ['⭕', '📏'], ['🍊', '⚽', '🏀'], ['🍌', '🥕', '🥖']),
]

/** The label of each basket (index = bin), said by the owl and shown under the basket. */
export const BIN_TEXT: Readonly<Record<string, readonly [string, string]>> = {
  'fruit-veg': ['פֵּרוֹת', 'יְרָקוֹת'],
  'animals-vehicles': ['חַיּוֹת', 'כְּלֵי רֶכֶב'],
  'sea-land': ['בַּיָּם', 'בַּיַּבָּשָׁה'],
  'clothes-food': ['בְּגָדִים', 'אֹכֶל'],
  'fly-swim': ['עָפִים', 'שׂוֹחִים'],
  'toys-tools': ['צַעֲצוּעִים', 'כְּלֵי עֲבוֹדָה'],
  'pets-farm': ['חַיּוֹת מַחְמָד', 'חַיּוֹת הַחַוָּה'],
  'school-kitchen': ['בְּבֵית הַסֵּפֶר', 'בַּמִּטְבָּח'],
  'red-yellow': ['אֲדֻמִּים', 'צְהֻבִּים'],
  'green-red': ['יְרֻקִּים', 'אֲדֻמִּים'],
  'big-small': ['גְּדוֹלִים', 'קְטַנִּים'],
  'hot-cold': ['חַם', 'קַר'],
  'road-air': ['עַל הַכְּבִישׁ', 'בָּאֲוִיר'],
  'round-long': ['עֲגֻלִּים', 'אֲרֻכִּים'],
}
