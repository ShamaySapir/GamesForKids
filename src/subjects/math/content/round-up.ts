import type { RoundUpStory } from '../types'

// Grade 4 word problems where the remainder means one more is needed (G4 p.8: "remainder in context"). Read by the
// browser voice (D23): {n} the total, {d} how many fit in one. Written by the planner; full nikud.

export const ROUND_UP_STORIES: readonly RoundUpStory[] = [
  { id: 'bus', text: 'לַטִּיּוּל נוֹסְעִים {n} יְלָדִים, וּבְכָל אוֹטוֹבּוּס יֵשׁ {d} מְקוֹמוֹת. כַּמָּה אוֹטוֹבּוּסִים צָרִיךְ?' },
  { id: 'boxes', text: 'יֵשׁ {n} סְפָרִים, וּבְכָל אַרְגָּז נִכְנָסִים {d} סְפָרִים. כַּמָּה אַרְגָּזִים צָרִיךְ?' },
  { id: 'tables', text: 'לַמְּסִבָּה בָּאוּ {n} אוֹרְחִים, וְלְיַד כָּל שֻׁלְחָן יוֹשְׁבִים {d}. כַּמָּה שֻׁלְחָנוֹת צָרִיךְ?' },
  { id: 'boats', text: '{n} יְלָדִים רוֹצִים לָשׁוּט, וּבְכָל סִירָה יֵשׁ מָקוֹם לְ־{d}. כַּמָּה סִירוֹת צָרִיךְ?' },
  { id: 'cars', text: '{n} שַׂחְקָנִים נוֹסְעִים לַמִּשְׂחָק, וּבְכָל מְכוֹנִית יֵשׁ מָקוֹם לְ־{d}. כַּמָּה מְכוֹנִיּוֹת צָרִיךְ?' },
]
