import type { Survey } from '../types'

// Frequency tables for the mode (grade 5, G5 p.30–36). The question is surveyPhrase(id) in phrases.ts; the categories are
// shown in the table and as answer options. Written by the planner; full nikud.

export const SURVEYS: readonly Survey[] = [
  { id: 'fruit', categories: ['תַּפּוּחַ', 'בָּנָנָה', 'עֲנָבִים', 'אֲבַטִּיחַ', 'תּוּת'] },
  { id: 'pet', categories: ['כֶּלֶב', 'חָתוּל', 'דָּג', 'תֻּכִּי', 'אוֹגֵר'] },
  { id: 'color', categories: ['כָּחֹל', 'אָדֹם', 'יָרֹק', 'צָהֹב', 'סָגֹל'] },
  { id: 'sport', categories: ['כַּדּוּרֶגֶל', 'כַּדּוּרְסַל', 'קְפִיצָה בַּחֶבֶל', 'תּוֹפֶסֶת', 'מַחֲבוֹאִים'] },
]
