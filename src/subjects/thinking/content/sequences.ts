import type { SequenceSet } from '../types'

// Each process has one natural order that a 5-year-old knows from life.
export const SEQUENCES: readonly SequenceSet[] = [
  { id: 'chick', steps: ['🥚', '🐣', '🐥'] },
  { id: 'tree', steps: ['🌰', '🌱', '🌳'] },
  { id: 'rain', steps: ['☁️', '🌧️', '🌈'] },
  { id: 'sunflower', steps: ['🌰', '🌱', '🌻'] },
  { id: 'fried-egg', steps: ['🥚', '🍳', '😋'] },
  { id: 'day', steps: ['🌅', '☀️', '🌇', '🌙'] },
  { id: 'ages', steps: ['👶', '👦', '👨', '👴'] },
  { id: 'butterfly', steps: ['🥚', '🐛', '🦋'] },
  { id: 'house', steps: ['🧱', '🏗️', '🏠'] },
  { id: 'milk', steps: ['🐄', '🥛', '🧀'] },
  { id: 'school', steps: ['🏠', '🚌', '🏫'] },
  { id: 'trip', steps: ['🧳', '✈️', '🏖️'] },
  { id: 'shoes', steps: ['🧦', '👟', '🏃'] },
]

/** What the owl says for each step, in order (index = step index, so SEQUENCE_TEXT[id][n] is sequencePhrase(id, n)). */
export const SEQUENCE_TEXT: Readonly<Record<string, readonly string[]>> = {
  chick: ['בֵּיצָה', 'הָאֶפְרוֹחַ בּוֹקֵעַ', 'אֶפְרוֹחַ קָטָן'],
  tree: ['זֶרַע', 'נֵבֶט קָטָן', 'עֵץ גָּדוֹל'],
  rain: ['עָנָן', 'יוֹרֵד גֶּשֶׁם', 'קֶשֶׁת בֶּעָנָן'],
  sunflower: ['זֶרַע', 'נֵבֶט קָטָן', 'חַמָּנִית גְּדוֹלָה'],
  'fried-egg': ['בֵּיצָה', 'מְטַגְּנִים אֶת הַבֵּיצָה', 'אוֹכְלִים'],
  day: ['בֹּקֶר', 'צָהֳרַיִם', 'עֶרֶב', 'לַיְלָה'],
  ages: ['תִּינוֹק', 'יֶלֶד', 'אִישׁ', 'סַבָּא'],
  butterfly: ['בֵּיצָה', 'זַחַל', 'פַּרְפָּר'],
  house: ['לְבֵנִים', 'בּוֹנִים', 'בַּיִת גָּמוּר'],
  milk: ['פָּרָה', 'חָלָב', 'גְּבִינָה'],
  school: ['בַּבַּיִת', 'בָּאוֹטוֹבּוּס', 'בְּבֵית הַסֵּפֶר'],
  trip: ['אוֹרְזִים מִזְוָדָה', 'טָסִים בְּמָטוֹס', 'נֶהֱנִים בַּחוֹף'],
  shoes: ['גַּרְבַּיִם', 'נַעֲלַיִם', 'רָצִים'],
}
